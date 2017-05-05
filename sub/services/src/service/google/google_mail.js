//
// Copyright 2017 Alien Labs.
//

import { OAuthServiceProvider } from '../service';

const NAMESPACE = 'google.com/mail';

/**
 * Google Mail Service provider.
 */
export class GoogleMailServiceProvider extends OAuthServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  constructor(authProvider) {
    super(authProvider, NAMESPACE, GoogleMailServiceProvider.SCOPES);
  }

  get meta() {
    return {
      title: 'Gmail',
      class: 'service-google-mail',
      icon: '/img/service/google_mail.png'
    };
  }
}
