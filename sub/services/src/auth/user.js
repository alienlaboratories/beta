//
// Copyright 2017 Alien Labs.
//

import express from 'express';

import { HttpUtil } from 'alien-util';

import { JwtUtil } from './jwt';

/**
 * Manage authentication.
 */
export class UserManager {

  /**
   * @param loginAuthProvider OAuth provider.
   * @param systemStore The system store manages Users and Groups.
   */
  constructor(loginAuthProvider, systemStore) {
    console.assert(loginAuthProvider && systemStore);
    this._loginAuthProvider = loginAuthProvider;
    this._systemStore = systemStore;
  }

  /**
   * Gets the login OAuthProvider.
   *
   * @returns {OAuthProvider}
   */
  get loginAuthProvider() {
    return this._loginAuthProvider;
  }

  /**
   * Gets the User item.
   *
   * @param userId
   * @return {User}
   */
  getUserFromId(userId) {
    return this._systemStore.getUser(userId);
  }
}

/**
 * Manage user authentication.
 *
 * @param userManager
 * @param oauthRegistry
 * @param systemStore
 * @param {{ home }} options
 * @returns {Router}
 */
export const loginRouter = (userManager, oauthRegistry, systemStore, options) => {
  console.assert(userManager && oauthRegistry && systemStore);

  let router = express.Router();

  // OAuth provider used for login.
  let loginAuthProvider = userManager.loginAuthProvider;

  //
  // Login.
  //
  router.get('/login', (req, res) => {
    res.redirect(HttpUtil.toUrl('/oauth/login/' + loginAuthProvider.providerId, req.query));
  });

  //
  // Logout.
  //
  router.get('/logout', (req, res) => {
    // http://passportjs.org/docs/logout
    req.logout();
    res.redirect(options.home);
  });

  //
  // Refresh (JWT) id_token (jsonp request).
  //
  router.get('/refresh_id_token', (req, res) => {
    let { callback } = req.query;
    console.assert(callback);

    res.redirect(HttpUtil.toUrl('/oauth/login/' + loginAuthProvider.providerId, {
      redirectType: 'jsonp',
      callback
    }));
  });

  //
  // Request (JWT) id_token (e.g., from CLI).
  //
  router.post('/get_id_token', (req, res) => {
    let { credentials } = req.body;

    loginAuthProvider.getUserProfile(credentials).then(userProfile => {
      systemStore.getUserByEmail(userProfile.email).then(user => {
        let { token } = JwtUtil.createToken(user.id);
        res.send({ email: userProfile.email, token });
      });
    });
  });

  return router;
};
