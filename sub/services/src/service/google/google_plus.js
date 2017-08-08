//
// Copyright 2017 Alien Labs.
//

import { ServiceProvider } from '../service';

const NAMESPACE = 'google.com/plus';

/**
 * Google Plus Service provider.
 */
export class GooglePlusServiceProvider extends ServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/plus.login'
  ];

  constructor(oauthHandler) {
    super(NAMESPACE, oauthHandler, GooglePlusServiceProvider.SCOPES);
  }

  get meta() {
    return {
      title: 'Google Plus',
      class: 'service-google-plus'
    };
  }
}
