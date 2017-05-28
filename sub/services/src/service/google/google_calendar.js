//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
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

  // TODO(burdon): syncToken
  list(authClient, query, maxResults) {
    return new Promise((resolve, reject) => {
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
        if (err) {
          reject(err);
        } else {
          let items = _.map(response.items, item => GoogleCalendarClient.toItem(item));
          resolve(items);
        }
      });
    });
  }

  /**
   * Convert Drive result to a schema object Item.
   */
  static toItem(event) {
    console.log(JSON.stringify(event, null, 2));

    let item = {
      namespace: NAMESPACE,
      type: 'Event',
      id: event.id,
      title: event.summary,
      description: event.description
    };

    // TODO(burdon): start: date/dateTime (as ID?)
    // TODO(burdon): { location, status, start, end, recurringEventId, attendees }

    return item;
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
