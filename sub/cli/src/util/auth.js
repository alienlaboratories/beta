//
// Copyright 2017 Alien Labs.
//

import request from 'request';
import url from 'url';

import GoogleAuth from 'google-cli-auth';

// TODO(burdon): Const.
const GET_ID_TOKEN_URL = '/user/get_id_token';

/**
 * Google authenticator.
 */
export class Authenticator {

  // TODO(burdon): Reimplement GoogleAuth (understand events and streams).
  // Creates http.server to received callback URL from Google.
  // https://www.npmjs.com/package/google-cli-auth

  constructor(config, server) {
    console.assert(config && server);
    this._config = config;
    this._server = server;
  }

  /**
   * Get the Google credentials (either from the stored settings or via the browser) then request a JWT token
   * from the Alien frontend.
   * @returns {Promise}
   */
  authenticate() {
    return new Promise((resolve, reject) => {
      let { clientId, clientSecret } = this._config;

      GoogleAuth({
        name: 'alien',                // Name of config file ~/.config/alien/token.json
        client_id: clientId,
        client_secret: clientSecret,
        scope: [
          'email'
        ]
      }, (error, credentials) => {
        if (error) {
          reject(error);
        } else {
//        console.log(JSON.stringify(credentials, null, 2));

          let options = {
            url: url.resolve(this._server, GET_ID_TOKEN_URL),
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





























