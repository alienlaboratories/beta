//
// Copyright 2017 Alien Labs.
//

// import _ from 'lodash';
import google from 'googleapis';

import { OAuthServiceProvider } from '../service';

const NAMESPACE = 'google.com/calendar';

/**
 * Google Calendar API wrapper.
 *
 * https://developers.google.com/google-apps/calendar/v3/reference
 */
export class GoogleCalendarClient {

  constructor() {
    this._calendar = google.calendar('v3');
  }

  list(authClient, query, maxResults) {

    // TODO(burdon): syncToken

    // https://developers.google.com/google-apps/calendar/v3/reference/events/list
    this._calendar.events.list({
      auth: authClient,
      q: query,
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    }, (err, response) => {
      console.log(err, response);
    });
  }
}

/**
 * Google Plus Service provider.
 */
export class GoogleCalendarServiceProvider extends OAuthServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  constructor(authProvider) {
    super(authProvider, NAMESPACE, GoogleCalendarServiceProvider.SCOPES);
  }

  get meta() {
    return {
      title: 'Google Calendar',
      class: 'service-google-calendar'
    };
  }
}
