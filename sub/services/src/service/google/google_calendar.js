//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';

import { Logger } from 'alien-util';

import { ServiceProvider } from '../service';
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

  watch(authClient, channelId, webhookUrl) {
    console.assert(authClient && channelId && webhookUrl);
    logger.log('Watch inbox: ' + webhookUrl);

    return new Promise((resolve, reject) => {

      // https://developers.google.com/google-apps/calendar/v3/push
      // https://github.com/google/google-api-nodejs-client/blob/master/apis/calendar/v3.ts
      let params = {
        auth: authClient,
        calendarId: 'primary',
        id: channelId,                            // X-Goog-Channel-ID (response).
        type: 'web_hook',
        address: webhookUrl,                      // HTTPS POST (webhook). TODO(burdon): Check not blocked by robots.txt
        token: 'source=google.com/calendar',      // X-Goog-Channel-Token (response).
        expiration: 3600 * 24 * 7                 // TODO(burdon): Const.
      };

      // TODO(burdon): required entity.resource
      // https://developers.google.com/google-apps/calendar/v3/reference/events/watch
      this._calendar.events.watch(params, (err, response) => {
        if (err) {
          reject(JSON.stringify(_.pick(err, ['code', 'message'])));
        } else {
          resolve(_.pick(response, ['expiration']));
        }
      });
    });
  }

  events(authClient, query, maxResults) {
    const fetcher = (pageToken, pageSize, i) => {
      return GoogleApiUtil.promisify(callback => {

        // https://developers.google.com/google-apps/calendar/v3/reference/events/list
        let params = {
          auth: authClient,
          calendarId: 'primary',
          q: query,
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
export class GoogleCalendarServiceProvider extends ServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  constructor(oauthHandler) {
    super(NAMESPACE, oauthHandler, GoogleCalendarServiceProvider.SCOPES);
  }

  get meta() {
    return {
      title: 'Google Calendar',
      class: 'service-google-calendar'
    };
  }
}
