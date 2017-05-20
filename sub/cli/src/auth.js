//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import url from 'url';
import GoogleAuth from 'google-cli-auth';
import request from 'request';

// TODO(burdon): Const.
const GET_ID_TOKEN_URL = '/user/get_id_token';

/**
 * Google authenticator.
 */
export class Authenticator {

  // https://github.com/villadora/google-auth-cli
  // https://www.npmjs.com/package/google-cli-auth
  // https://github.com/google/google-api-nodejs-client#using-jwt-service-tokens

  constructor(config) {
    console.assert(config);
    this._config = config;
  }

  /**
   * Get the Google credentials (either from the stored settings or via the browser) then request a JWT token
   * from the Alien frontend.
   * @returns {Promise}
   */
  authenticate() {
    return new Promise((resolve, reject) => {
      let {
        clientId:client_id,
        clientSecret:client_secret
      } = _.get(this._config, 'google');

      GoogleAuth({
        name: 'alien',      // Name of config file ~/.config/alien/token.json
        client_id,
        client_secret,
        scope: [
          'email'
        ]
      }, (error, credentials) => {
        if (error) {
          reject(error);
        } else {
//        console.log(JSON.stringify(credentials, null, 2));

          let options = {
            url: url.resolve(_.get(this._config, 'server'), GET_ID_TOKEN_URL),
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              credentials
            })
          };

          // TODO(burdon): Cache the token.
          console.log('Requesting Token...');
          request.post(options, (error, response, body) => {
            if (error) {
              reject(error);
            } else {
              let { email, token } = JSON.parse(body);
              console.log('Got token for ' + email);
              resolve(token);
            }
          });
        }
      });
    });
  }
}
