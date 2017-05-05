//
// Copyright 2017 Alien Labs.
//

import { OAuthServiceProvider } from '../service';

const NAMESPACE = 'google.com/plus';

/**
 * Google Plus Service provider.
 */
export class GooglePlusServiceProvider extends OAuthServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/plus.login'
  ];

  constructor(authProvider) {
    super(authProvider, NAMESPACE, GooglePlusServiceProvider.SCOPES);
  }

  get meta() {
    return {
      title: 'Google Plus',
      class: 'service-google-plus',
      icon: '/img/service/google_plus.png'
    };
  }
}
