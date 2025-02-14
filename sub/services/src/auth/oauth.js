//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';
import passport from 'passport';

import { Logger, HttpError, HttpUtil } from 'alien-util';
import { AuthDefs, ID } from 'alien-core';

import { JwtUtil } from './jwt';

const logger = Logger.get('oauth');

/**
 * Checks if the OAuth cookie has been set by passport.
 * NOTE: Browser prefetch may call methods twice.
 */
export const isAuthenticated = (redirect=undefined, admin=false) => (req, res, next) => {
  if (req.isAuthenticated()) {
    if (admin && !req.user.admin) {
      logger.log('Attempted admin access: ' + req.user.id);
      throw new HttpError(401);
    }

    logger.log('Authenticated user: ' + req.user.id);
    next();
  } else {
    logger.warn('Not authenticated: ' + req.url);
    if (redirect) {
      res.redirect(redirect);
    } else {
      throw new HttpError(401);
    }
  }
};

/**
 * Requires JWT Auth header to be set.
 */
// TODO(burdon): Handle JWT decoding errors (JwtStrategy.prototype.authenticate)?
export const hasJwtHeader = () => passport.authenticate('jwt', { session: false });

/**
 * Returns the current User's session.
 * @param {User} user
 * @return {{id_token, id_token_exp }}
 */
export const getUserSession = (user) => {
  return user.session;
};

/**
 * Returns the (JWT) id_token from the session state (cached in the User object).
 * @param {User} user
 * @return {string}
 */
export const getIdToken = (user) => {
  let session = getUserSession(user);
  console.assert(session.id_token, 'Invalid token for user: ' + JSON.stringify(_.pick(user, ['id', 'email'])));
  return session.id_token;
};

/**
 * Handles OAuth login flow:
 *
 * => /user/login
 *   => /oauth/login/google => handler => passport.authenticate()
 *     => https://accounts.google.com (via OAuthHandler)
 *       => /oauth/callback/google => <Passport.authenticate() => authCallback> => handler
 *         => /home
 *
 * @param userManager
 * @param systemStore
 * @param oauthRegistry
 * @param {{ app }} config
 * @return {Router}
 */
export const oauthRouter = (userManager, systemStore, oauthRegistry, config={}) => {
  console.assert(userManager && systemStore && oauthRegistry && config);

  // Must be global.
  console.assert(config.app);
  config.app.use(passport.initialize());
  config.app.use(passport.session());

  let router = express.Router();

  //
  // Configure session store.
  // TODO(burdon): Session store: https://github.com/expressjs/session#compatible-session-stores
  //               https://www.npmjs.com/package/connect-redis
  //               https://www.npmjs.com/package/connect-memcached

  /**
   * Serialize User Item to session store.
   */
  passport.serializeUser((user, done) => {
//  logger.log('===>> ' + JSON.stringify(_.pick(user, ['id', 'email', 'session'])));
    done(null, _.pick(user, [ 'id', 'session' ]));
  });

  /**
   * Retrieve User Item given session state.
   * Sets req.user
   */
  passport.deserializeUser((userInfo, done) => {
//  logger.log('<<=== ' + JSON.stringify(userInfo));
    let { id, session } = userInfo;
    userManager.getUserFromId(id).then(user => {
      if (!user) {
        return done('Invalid User ID: ' + id, false);
      }

      user.session = session;

      done(null, user);
    });
  });

  //
  // Custom JWT Strategy.
  // NOTE: Doesn't use session by default.
  // https://www.npmjs.com/package/passport-jwt
  //

  passport.use(JwtUtil.createStrategy((req, payload, done) => {
    let { id } = payload.data;

    userManager.getUserFromId(id).then(user => {
      if (!user) {
        return done('Invalid User ID: ' + id, false);
      }

      done(null, user);
    });
  }));

  /**
   * Called when OAuth login flow completes.
   * TODO(burdon): Cite documentation for callback signature (params is not in the Passport docs).
   *
   * @param accessToken
   * @param refreshToken
   * @param params
   * @param profile
   * @param done
   */
  let authCallback = (accessToken, refreshToken, params, profile, done) => {
    console.assert(accessToken);

    let { id_token, token_type } = params;
    console.assert(id_token && token_type);

    let { provider, id } = profile;
    console.assert(provider && id);

    let credentials = {
      provider,
      id,
      token_type,
      access_token: accessToken
    };

    // NOTE: Only provided when first requested (unless forced).
    // https://auth0.com/docs/tokens/refresh-token
    if (refreshToken) {
      credentials.refresh_token = refreshToken;
    }

    // Get user profile.
    let userProfile = OAuthHandler.getCanonicalUserProfile(profile);

    // Register/update user.
    // TODO(burdon): Register vs update?
    systemStore.registerUser(userProfile, credentials).then(user => {
      logger.log('OAuth callback: ' + JSON.stringify(_.pick(userProfile, ['id', 'email'])));

      //
      // Create the custom JWT token.
      // https://www.npmjs.com/package/jsonwebtoken
      //
      let { token, exp } = JwtUtil.createToken(user.id);

      // Sets the transient User property (which is stored in the session store).
      _.assign(user, {
        session: {
          id_token: token,
          id_token_exp: exp
        }
      });

      done(null, user);

      // TODO(burdon): Upsert Contact (which bucket?)
      // userStore.upsertItem().then(contact => {
      //
      //   // Sets req.user.
      //   done(null, user);
      // });
    });
  };

  //
  // Register OAuth strategies.
  //
  _.each(oauthRegistry.providers, provider => {
    logger.log('Registering OAuth Strategy: ' + provider.providerId);

    // Register the strategy.
    passport.use(provider.createStrategy(authCallback));

    //
    // OAuth login.
    // @param redirect On success URL.
    // http://passportjs.org/docs/google
    //
    // TODO(burdon): Handle 401.
    router.get('/login/' + provider.providerId, (req, res, next) => {
      let { redirectType, redirectUrl='/app', requestId } = req.query;

      // Callback state.
      let state = { redirectType, redirectUrl, requestId };

      switch (redirectType) {

        //
        // Web client request (JSONP since cross-domain redirect).
        //
        case 'jsonp': {
          let { callback } = req.query;
          console.assert(callback);
          state.jsonp_callback = callback;
          break;
        }
      }

      // Dynamically configure the response.
      // https://github.com/jaredhanson/passport-google-oauth2/issues/22 [3/27/17]
      const processAuthRequest = passport.authenticate(provider.providerId, {

        // Login scopes.
        scope: provider.scopes,

        // Incremental Auth.
        include_granted_scopes: true,

        // State passed to callback.
        state: OAuthHandler.encodeState(state)
      });

      logger.log('Logging in: ' + JSON.stringify(state));
      return processAuthRequest.call(null, req, res, next);
    });

    //
    // Registered OAuth request flow callback (for each subdomain).
    // https://stackoverflow.com/questions/24342338/google-oauth-subdomains
    //
    router.get('/callback/' + provider.providerId, passport.authenticate(provider.providerId, {
      // TODO(burdon): Handle JSONP/CRX failure.
      failureRedirect: '/home'
    }), (req, res) => {
      // NOTE: authCallback (registered with passport) is called first.

      let user = req.user;
      let state = OAuthHandler.decodeState(req.query.state);
      logger.log('Logged in: ' + JSON.stringify(_.pick(user, ['id', 'email'])) + '; state=' + JSON.stringify(state));

      let { redirectType, scopes=[] } = state;

      const handleCallback = () => {
        switch (redirectType) {

          //
          // JSONP callback for cross-domain requests from client (result passed to script callback):
          //
          // /user/refresh_id_token
          //   => /oauth/login/google
          //     => accounts.google.com/o/oauth2/v2/auth
          //       => /oauth/callback/google
          //         <script>callback({ ... })</script>
          //
          case 'jsonp': {
            let { jsonp_callback } = state;

            let response = {
              credentials: _.pick(getUserSession(user), ['id_token', 'id_token_exp'])
            };

            // Send script that invokes JSONP callback.
            res.send(`${jsonp_callback}(${JSON.stringify(response)});`);
            break;
          }

          //
          // CRX Auth flow (result encoded in URL params):
          //
          // chrome.identity.launchWebAuthFlow (CRX)
          //   => /oauth/login/google
          //     => https://accounts.google.com/o/oauth2/auth
          //       => /oauth/callback/google
          //         => https://ofdkhkelcafdphpddfobhbbblgnloian.chromiumapp.org/google (CRX)
          //
          case 'crx': {
            let { redirectUrl, requestId  } = state;

            let response = {
              requestId,

              // Credentials.
              credentials: JSON.stringify(_.pick(getUserSession(user), ['id_token', 'id_token_exp'])),

              // Canonical profile.
              userProfile: JSON.stringify(_.pick(user, ['email', 'displayName', 'photoUrl'])),
            };

            // This isn't a JSON response, it needs to be encoded as URL params. It's easier to flatten the config.
            res.redirect(HttpUtil.toUrl(redirectUrl, response));
            break;
          }

          //
          // Redirect after successful callback.
          //
          default: {
            let { redirectUrl = '/home' } = state;
            res.redirect(redirectUrl);
            break;
          }
        }
      };

      // Update scope.
      // TODO(burdon): State only contains new scopes.
      let path = `credentials.${provider.providerId}`;
      _.set(user, `${path}.scopes`, _.uniq(_.concat(_.get(user, `${path}.scopes`, []), scopes)));
      _.set(user, `${path}.granted`, _.now());

      return systemStore.updateUser(user).then(() => {
        handleCallback();
      });
    });
  });

  //
  // Logout.
  //
  router.get('/logout/:providerId', isAuthenticated('/home'), (req, res) => {
    let { providerId } = req.params;
    logger.log('Logout: ' + providerId);

    // NOTE: Doesn't reset cookie (would logout all Google apps).
    // http://passportjs.org/docs/logout
    req.logout();

    // TODO(burdon): Logout/invalidate.
    let provider = oauthRegistry.getProvider(providerId);
    return provider.revoke();
  });

  return router;
};

/**
 * Registry of OAuth Providers.
 */
export class OAuthRegistry {

  constructor() {
    this._providers = new Map();
  }

  get providers() {
    return _.toArray(this._providers.values());
  }

  getProvider(providerId) {
    console.assert(providerId);
    return this._providers.get(providerId);
  }

  registerProvider(provider) {
    console.assert(provider && provider.providerId);
    this._providers.set(ID.sanitizeKey(provider.providerId), provider);
    return this;
  }
}

/**
 * OAuth Provider.
 */
export class OAuthHandler {

  // TODO(burdon): Rename Handler?

  static PATH = '/oauth';

  /**
   * Encode the OAuth state param.
   *
   * @param {object }state Redirect Url on successful OAuth.
   *
   * @return {string} Base64 encoded string.
   */
  static encodeState(state={}) {
    // TODO(burdon): State should implement CSRF protection (and be stored in memcache).
    return new Buffer(JSON.stringify(state)).toString('base64');
  }

  static decodeState(state) {
    console.assert(state);
    return JSON.parse(Buffer.from(state, 'base64'));
  }

  /**
   * Passport normalizes profile. We store an abridged version of this.
   * http://passportjs.org/docs/profile
   * https://github.com/google/google-api-nodejs-client/blob/master/apis/oauth2/v2.js
   * TODO(burdon): Document profile.
   *
   * @param userProfile
   * @returns { id, email, displayName, photoUrl }
   */
  static getCanonicalUserProfile(userProfile) {
    let { id, emails, displayName, photos } = userProfile;
    let email = _.get(_.find(emails, email => email.type === 'account'), 'value');
    let photoUrl = photos && photos[0];
    return {
      id, email, displayName, photoUrl
    };
  }

  /**
   * @param providerId Provider ID from the Passport strategy (e.g., 'google').
   * @param serverUrl
   */
  constructor(providerId, serverUrl) {
    console.assert(providerId && serverUrl);
    this._providerId = providerId;

    // Auth is limited to registered domain (e.g., app.alienlabs.io).
    this._callbackUrl = HttpUtil.joinUrl(serverUrl, '/oauth/callback/' + ID.sanitizeKey(providerId));
  }

  /**
   * Passport provider ID.
   */
  get providerId() {
    return this._providerId;
  }

  /**
   * Login scopes.
   */
  get scopes() {
    return AuthDefs.OPENID_LOGIN_SCOPES;
  }

  /**
   *
   * @param scopes
   */
  createAuthUrl(scopes) {
    throw new Error('Not implemented');
  }

  /**
   * Creates the Passport strategy.
   * http://passportjs.org/docs/google
   *
   * @param loginCallback
   */
  createStrategy(loginCallback) {
    throw new Error('Not implemented');
  }

  /**
   * Validates the (JWT) id_token.
   *
   * https://jwt.io/introduction
   * https://jwt.io (Test decoding token).
   *
   * @param idToken
   */
  verifyIdToken(idToken) {
    throw new Error('Not implemented');
  }

  /**
   * Uses the OAuth API to retrieve the user's profile.
   *
   * @param credentials
   */
  getUserProfile(credentials) {
    throw new Error('Not implemented');
  }

  /**
   * Revokes the OAuth credentials.
   */
  revokeCredentials(credentials) {
    throw new Error('Not implemented');
  }
}
