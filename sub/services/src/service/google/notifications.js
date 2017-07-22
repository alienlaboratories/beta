//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';
import { Logger } from 'alien-util';

import { AWSQueue } from '../../util/aws/aws';

const logger = Logger.get('google.notifications');

/**
 * Google (webhook) notification handlers.
 */
export class GoogleNotifications {

  /**
   * Gmail webhook.
   *
   * curl -i -H "Content-Type: application/json" -X POST -d '{ "message": { "data": "eyJlbWFpbEFkZHJlc3MiOiAidXNlckBleGFtcGxlLmNvbSIsICJoaXN0b3J5SWQiOiAiOTg3NjU0MzIxMCJ9" } }' http://localhost:3000/hook/83CC572F-90DE-406F-ABFB-4C770C2381EB
   *
   * @param config
   * @param systemStore
   * @returns {Promise}
   * @constructor
   */
  static Gmail = (config, systemStore) => {
    let queue = new AWSQueue(_.get(config, 'aws.sqs.tasks'));

    // TODO(burdon): Authenticate client?
    // https://developers.google.com/webmasters/APIs-Google.html
    // https://developers.google.com/gmail/api/guides/push#receiving_notifications
    // { message: { data, message_id }, subscription } = req.body;
    return (req) => {
      let { message: { data } } = req.body;

      let payload = data ? JSON.parse(atob(data)) : {};
      let { emailAddress, historyId } = payload;

      // Look-up user ID.
      logger.log('Gmail:', emailAddress, historyId);
      return systemStore.getUserByEmail(emailAddress).then(user => {
        queue.add({
          type: 'sync.google.mail',
          userId: user.id
        }, {
          historyId
        });
      });
    };
  };
}
