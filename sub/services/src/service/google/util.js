//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import request from 'request';
import split from 'split';
import multiparty from 'multiparty';

import { Logger } from 'alien-util';

const logger = Logger.get('google.util');

/**
 * Base class for Google APIs.
 */
export class GoogleApiUtil {

  static API = 'https://www.googleapis.com';

  // TODO(burdon): Increase in prod.
  static DEF_PAGE_SIZE = 50;

  // Should be >= DEF_PAGE_SIZE.
  static DEF_RESULTS = 100;

  // TODO(burdon): Max or throttling trigger?
  // https://cloud.google.com/bigquery/quota-policy
  static MAX_BATCH_SIZE = 100;

  /**
   * Promisify Google API requests.
   * @param {Function} f Function to invoke with standard (err, response) callback.
   * @returns {Promise.<{Result}>}
   */
  // TODO(burdon): Use uniformly.
  static promisify(f) {
    return new Promise((resolve, reject) => {
      f((err, response) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Iteratively process requests (pages) to collect a single result.
   *
   * @param {function.<pageToken, pageSize, i>} fetcher Returns { nextPageToken, objects, meta }
   * @param maxResults
   * @returns {Promise.<{ objects, meta }>}
   */
  static request(fetcher, maxResults=GoogleApiUtil.DEF_RESULTS) {
    if (maxResults === 0) {
      return Promise.resolve([]);
    }

    //
    // Array of results.
    //
    let result = {
      objects: []
    };

    //
    // Get the next page (recursive promises).
    //
    const fetch = (i=0, pageToken=undefined) => {
      let pageSize = Math.min(GoogleApiUtil.DEF_PAGE_SIZE, maxResults - _.size(result.objects));
      logger.info(`Fetching [${i}]: ${_.size(result.objects)}/${maxResults}`);

      //
      // Invoke the fetcher.
      //
      return fetcher(pageToken, pageSize, i).then(response => {
        let { nextPageToken, objects, meta } = response;
        _.assign(result, { meta });

        // Append results.
        result.objects = _.concat(result.objects, objects);
        logger.info(`Results [${i}]: ${_.size(result.objects)}/${maxResults} ${JSON.stringify(meta)}`);

        // Recursively fetch more.
        if (nextPageToken && _.size(objects) === pageSize && _.size(result.objects) < maxResults) {
          return fetch(i + 1, nextPageToken);
        }

        return result;
      });
    };

    return fetch();
  }

  /**
   *
   * @param authClient
   * @param {[{ ContentType, body }]} requests Array of requests to batch.
   * @returns {Promise.<[{ message }]>}
   */
  static batch(authClient, requests) {
    console.assert(authClient);
    if (!_.size(requests)) {
      return Promise.resolve([]);
    }

    // https://github.com/google/google-api-nodejs-client/blob/master/lib/apirequest.ts
    // https://github.com/google/google-api-nodejs-client/blob/548263fe8e64b9af27c9b21cc7a1179f8d0601dc/MIGRATING.md#batch-requests

    const fetchBatch = (requests) => {
      console.assert(_.size(requests) <= GoogleApiUtil.MAX_BATCH_SIZE);

      return new Promise((resolve, reject) => {
        let { token_type, access_token } = _.get(authClient, 'credentials');

        // https://cloud.google.com/storage/docs/json_api/v1/how-tos/batch
        let options = {
          url: GoogleApiUtil.API + '/batch',
          multipart: requests,
          headers: {
            'Content-Type': 'multipart/mixed',
            'Authorization': `${token_type} ${access_token}`
          }
        };

        let messages = [];

        // Process multi-part response stream.
        request.post(options)

          .on('error', err => {
            // TODO(burdon): Reject and close?
            logger.error(err);
          })

          .on('response', res => {
            if (res.statusCode !== 200) {
              reject(res.statusMessage);
              return;
            }

            res.headers['content-type'] =
              res.headers['content-type'].replace('multipart/mixed', 'multipart/related');

            let form = new multiparty.Form()

              .on('error', err => {
                reject(err);
              })

              .on('part', part => {
                part
                  .pipe(split('\r\n'))
                  .on('data', data => {
                    try {
                      let json = JSON.parse(data);
                      messages.push(json);
                    } catch(ex) {
                      // Ignore.
                      // The multi-part encoded message contains HTTP meta data and JSON strings.
                    }
                  });

                part.resume();
              })

              .on('close', () => {
                resolve(messages);
              });

            form.parse(res);
          });
      });
    };

    let results = [];
    let chunks = _.chunk(requests, GoogleApiUtil.MAX_BATCH_SIZE);

    const fetchNext = (i=0) => {
      logger.log('Batch: ' + i);

      return fetchBatch(chunks[i]).then(messages => {
        results = _.concat(results, messages);
        if (i < chunks.length - 1) {
          return fetchNext(i + 1);
        }

        return results;
      });
    };

    return fetchNext();
  }
}
