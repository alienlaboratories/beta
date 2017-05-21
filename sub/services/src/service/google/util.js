//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

/**
 * Base class for Google APIs.
 */
export class GoogleApiUtil {

  static DEF_RESULTS = 10;

  static DEF_PAGE_SIZE = 50;

  /**
   * Iteratively retrieve pages.
   *
   * @param {function.<{ pageSize, pageToken, i }>} fetcher
   * @param maxResults
   * @returns {Promise.<Array>}
   */
  static request(fetcher, maxResults=GoogleApiUtil.DEF_RESULTS) {
    if (maxResults === 0) {
      return Promise.resolve([]);
    }

    // Collect the results.
    let i = 0;
    let results = [];

    // Get the next page (recursive promises).
    const fetch = (pageToken = undefined) => {
      let pageSize = Math.min(GoogleApiUtil.DEF_PAGE_SIZE, maxResults - results.length);
      return fetcher(pageSize, pageToken, ++i).then(response => {
        results = _.concat(results, response.items);

        // Fetch more.
        if (!_.isEmpty(response.items) && response.nextPageToken && results.length < maxResults) {
          return fetch(response.nextPageToken);
        }

        return results;
      });
    };

    return fetch();
  }
}
