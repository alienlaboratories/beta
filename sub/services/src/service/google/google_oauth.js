//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';

import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';

import { ErrorUtil, HttpError, Logger } from 'alien-util';
import { AuthDefs } from 'alien-core';

import { OAuthProvider } from '../../auth/oauth';

const logger = Logger.get('oauth.google');

/**
 * Google.
 *
 * https://developers.google.com/identity/protocols/OAuth2WebServer
 *
 * https://github.com/googleapis/googleapis
 * https://groups.google.com/forum/#!forum/oauth2-dev
 *
 * ### Node ###
 * Officially "supported" Node ("google") librarys:
 * https://github.com/google/google-api-nodejs-client
 * http://google.github.io/google-api-nodejs-client/18.0.0/index.html
 *
 * ### Web Client ###
 * Vs. Completely separate set of Web Client ("gapi") library:
 * https://developers.google.com/api-client-library/javascript/features/authentication
 * https://developers.google.com/api-client-library/javascript/reference/referencedocs
 *
 * ### Testing ###
 * chrome://identity-internals (revoke auth)>.
 * https://myaccount.google.com/permissions (revoke app permissions).
 * https://www.googleapis.com/oauth2/v1/tokeninfo?{id_token|access_token}=XXX (validate token).
 * https://console.developers.google.com/apis/credentials?project=alienlabs-dev
 */
export class GoogleOAuthProvider extends OAuthProvider {

  // TODO(burdon): Implement revoke.
  // https://developers.google.com/identity/protocols/OAuth2UserAgent#tokenrevoke

  // TODO(burdon): See "prompt" argument.
  // https://developers.google.com/identity/protocols/OAuth2WebServer#redirecting

  /**
   * Creates a Google APIs Auth Client.
   *
   * @param config
   * @param credentials
   * @param callback Provide callback if part of login flow.
   * @returns {google.auth.OAuth2}
   */
  static createAuthClient(config, credentials=undefined, callback=undefined) {
    console.assert(config);

    // https://github.com/google/google-api-nodejs-client/#oauth2-client
    let authClient = new google.auth.OAuth2(
      _.get(config, 'web.clientId'),
      _.get(config, 'web.clientSecret'),
      callback
    );

    if (credentials) {
      authClient.setCredentials(_.pick(credentials, ['access_token', 'refresh_token']));
    }

    return authClient;
  }

  /**
   * Refreshes the access_token if the refresh_token is set.
   * https://github.com/google/google-api-nodejs-client/#manually-refreshing-access-token
   *
   * @param {google.auth.OAuth2} authClient
   * @returns {Promise.<{tokens}>}
   */
  static refreshAccessToken(authClient) {
    return new Promise((resolve, reject) => {
      authClient.refreshAccessToken((err, tokens) => {
        if (err) {
          reject(ErrorUtil.error(logger.name, err));
        } else {
          resolve(tokens);
        }
      });
    });
  }

  static getUserProfile(authClient) {
    return new Promise((resolve, reject) => {
      // TODO(burdon): Factor out.
      // https://developers.google.com/+/web/api/rest
      let plus = google.plus('v1');
      plus.people.get({
        userId: 'me',
        auth: authClient
      }, (error, profile) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(OAuthProvider.getCanonicalUserProfile(profile));
        }
      });
    });
  }

  constructor(config, serverUrl) {
    super('google', serverUrl);

    // Contains OAuth registration.
    this._config = config;
  }

  //
  // OAuthProvider interface.
  // https://developers.google.com/identity/protocols/googlescopes
  //

  get scopes() {
    return AuthDefs.GOOGLE_LOGIN_SCOPES;
  }

  /**
   * @param credentials
   * @param callback Provide callback if part of login flow.
   * @return {google.auth.OAuth2}
   */
  createAuthClient(credentials=undefined, callback=undefined) {
    return GoogleOAuthProvider.createAuthClient(this._config, credentials, callback);
  }

  /**
   * Services use this URL to request access scopes and offline access.
   *
   * https://myaccount.google.com/permissions
   * https://github.com/google/google-api-nodejs-client
   *
   * @param scopes
   * @return {string}
   */
  createAuthUrl(scopes) {
    return this.createAuthClient(null, this._callbackUrl).generateAuthUrl({

      // NOTE: By default, the refresh_token is only returned when it is FIRST REQUESTED.
      // http://googlecode.blogspot.com/2011/10/upcoming-changes-to-oauth-20-endpoint.html (Change #3)
      // The following args force the user's consent.
      approval_prompt: 'force',
      access_type: 'offline',

      scope: scopes,

      // Incremental Auth.
      include_granted_scopes: true,

      state: OAuthProvider.encodeState({ redirectUrl: '/services', scopes })
    });
  }

  createStrategy(loginCallback) {

    // http://passportjs.org/docs/google
    // https://github.com/jaredhanson/passport-google-oauth
    // https://github.com/jaredhanson/passport-google-oauth2
    return new GoogleStrategy({
      clientID:       _.get(this._config, 'web.clientId'),
      clientSecret:   _.get(this._config, 'web.clientSecret'),
      callbackURL:    this._callbackUrl
    }, loginCallback);
  }

  /**
   * Testing:
   * https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=XXX
   */
  verifyIdToken(idToken) {
    console.assert(idToken, 'Invalid token.');

    return new Promise((resolve, reject) => {

      // https://developers.google.com/identity/sign-in/web/backend-auth
      // https://developers.google.com/identity/protocols/OpenIDConnect#obtaininguserprofileinformation
      this.createAuthClient().verifyIdToken(idToken, this._config.clientId, (err, response) => {
        if (err) {
          console.error('Invalid id_token: ' + idToken);
          throw new HttpError(401);
        }

        let { iss, aud: clientId, sub: id, email, email_verified } = response.getPayload();
        console.assert(iss.endsWith('accounts.google.com'), 'Invalid ISS: ' + iss);
        console.assert(clientId === this._config.clientId, 'Invalid client ID: ' + clientId);
        console.assert(email_verified, 'User not verified: ' + email);

        let tokenInfo = { id, email };
        logger.log('Decoded id_token:', JSON.stringify(tokenInfo));
        resolve(tokenInfo);
      });
    });
  }

  getUserProfile(credentials) {
    console.assert(credentials);
    let authClient = this.createAuthClient(credentials);
    return GoogleOAuthProvider.getUserProfile(authClient);
  }

  revokeCredentials(credentials) {
    console.assert(credentials);

    return new Promise((resolve, reject) => {
      let authClient = this.createAuthClient(credentials);

      // TODO(burdon): Not testing. Document.
      authClient.revokeCredentials((error, result) => {
        if (error) {
          throw new Error(error);
        }

        resolve();
      });
    });
  }
}

