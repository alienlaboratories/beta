//
// Copyright 2017 Alien Labs.
//

import addrs from 'email-addresses';

/**
 * Data utilities.
 */
export class DataUtil {

  /**
   * @param {string} email
   * @returns {{ name, address }}
   */
  static parseEmail(email) {
    return _.pick(addrs.parseOneAddress(email), 'name', 'address');
  }
}
