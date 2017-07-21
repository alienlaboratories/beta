//
// Copyright 2017 Minder Labs.
//

/**
 * Google notification handlers.
 * 
 * @param req
 */
export class GoogleNotifications {

  static Gmail = (req) => {
    // Test
    // curl -i -H "Content-Type: application/json" -X POST -d '{ "message": { "data": "eyJlbWFpbEFkZHJlc3MiOiAidXNlckBleGFtcGxlLmNvbSIsICJoaXN0b3J5SWQiOiAiOTg3NjU0MzIxMCJ9" } }' http://localhost:3000/hook/83CC572F-90DE-406F-ABFB-4C770C2381EB

    // https://developers.google.com/gmail/api/guides/push#receiving_notifications
    let { message: { data, message_id }, subscription } = req.body;
    let payload = data ? JSON.parse(atob(data)) : {};

    // TODO(burdon): Task queue.
    let { emailAddress, historyId } = payload;
    console.log('GMAIL NOTIFICATION.', req.headers, message_id, subscription, emailAddress, historyId);
  };
}
