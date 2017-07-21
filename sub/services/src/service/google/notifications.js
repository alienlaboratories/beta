//
// Copyright 2017 Minder Labs.
//

import { Logger } from 'alien-util';

const logger = Logger.get('google.notifications');

/**
 * Google notification handlers.
 * 
 * @param req
 */
export class GoogleNotifications {

  static Gmail = (req) => {
    // Test
    // curl -i -H "Content-Type: application/json" -X POST -d '{ "message": { "data": "eyJlbWFpbEFkZHJlc3MiOiAidXNlckBleGFtcGxlLmNvbSIsICJoaXN0b3J5SWQiOiAiOTg3NjU0MzIxMCJ9" } }' http://localhost:3000/hook/83CC572F-90DE-406F-ABFB-4C770C2381EB

    // TODO(burdon): How to authenticate?

    // https://developers.google.com/webmasters/APIs-Google.html
    // https://developers.google.com/gmail/api/guides/push#receiving_notifications
    // { message: { data, message_id }, subscription } = req.body;
    let { message: { data } } = req.body;
    let payload = data ? JSON.parse(atob(data)) : {};

    // TODO(burdon): Task queue (with user ID); read all messages by user (to catch-up).
    let { emailAddress, historyId } = payload;
    logger.log('Gmail:', emailAddress, historyId);
  };
}
