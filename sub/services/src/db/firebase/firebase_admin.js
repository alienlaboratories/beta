//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import moment from 'moment';
import path from 'path';
import yaml from 'node-yaml';

import admin from 'firebase-admin';

const CONF_DIR = path.join(__dirname, '../../../../../conf');

// TODO(burdon): Config via ENV.
async function config(baseDir) {
  return await {
    'firebase': await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev.yml')),
  };
}

config(CONF_DIR).then(config => {
  console.log('Config = ' + JSON.stringify(config, null, 2));

  const app = admin.initializeApp({
    databaseURL: _.get(config, 'firebase.app.databaseURL'),
    credential: admin.credential.cert(_.get(config, 'firebase.serviceAccount'))
  });

  const db = app.database();

  //
  // Data migration.
  //

  // TODO(burdon): Process command line options.

  db.ref('/users').once('value', data => {
    let oldUsers = data.val();

    Promise.all(_.map(oldUsers, (oldUser, id) => {
      let { created, credentials, profile } = oldUser;
      let { email, name:title } = profile;

      if (!created) {
        created = moment().unix();
      }

      let newUser = {
        type: 'User',
        id,
        active: true,
        created,
        credentials,
        title,
        email
      };

      return new Promise((resolve, reject) => {
        let key = '/system/User/' + id;
        console.log(key + ' => ' + JSON.stringify(_.pick(newUser, ['email'])));
        db.ref(key).set(newUser, error => {
          if (error) { reject(); } else { resolve(key); }
        });
      });

    }))
      .then(() => {
        console.log('OK');
        app.delete();
      })
      .catch(error => {
        console.log('ERROR:', error);
        app.delete();
      });
  });
});
