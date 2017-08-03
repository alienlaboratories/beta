//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';

import { Logger } from 'alien-util';

import { OAuthServiceProvider } from '../service';
import { GoogleApiUtil } from './util';

const logger = Logger.get('google.calendar');

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

  events(authClient, query, maxResults) {

    const fetcher = (pageToken, pageSize, i) => {
      return GoogleApiUtil.promisify(callback => {

        // https://developers.google.com/google-apps/calendar/v3/reference/events/list
        let params = {
          auth: authClient,
          q: query,
          calendarId: 'primary',
          timeMin: (new Date()).toISOString(),
          maxResults: pageSize,
          singleEvents: true,
          orderBy: 'startTime'
        };

        this._calendar.events.list(params, callback);
      }).then(response => {
        // TODO(burdon): syncToken
        let { nextPageToken, events } = response;
        return { nextPageToken, objects: events };
      });
    };

    return GoogleApiUtil.request(fetcher, maxResults).then(result => {
      let { objects } = result;
      return _.map(objects, object => GoogleCalendarClient.toItem(object));
    });
  }

  /**
   * Convert Drive result to a schema object Item.
   */
  static toItem(event) {
//  console.log(JSON.stringify(event, null, 2));

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
