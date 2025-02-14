//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { FirebaseItemStore } from './firebase_item_store';

/**
 * Item store.
 *
 * https://firebase.google.com/docs/reference/js/firebase.database.Reference
 *
 * /NAMESPACE   /TYPE     /ID     => { Item }
 *
 * /system      /User     /user-1
 * /system      /Group    /group-1
 */
export class FirebaseSystemStore extends FirebaseItemStore {

  constructor(idGenerator, matcher, db, namespace) {
    super(idGenerator, matcher, db, namespace, false);
  }

  /**
   * The system root key doesn't specify a bucket.
   */
  getBucketKeys(context, type=undefined) {
    return [this.key(_.compact([ type ]))];
  }
}
