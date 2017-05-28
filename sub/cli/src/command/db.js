//
// Copyright 2017 Alien Labs.
//

import * as fs from 'fs';
import _ from 'lodash';
import path from 'path';

import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';
import { Loader, TestGenerator, Firebase, FirebaseItemStore } from 'alien-services';

import { Command } from './command';

/**
 * Database commands.
 */
export class DatabaseCommand extends Command {

  constructor(config) {
    super(config);

    let firebase = new Firebase(_.get(config, 'firebase'));

    let idGenerator = new IdGenerator();
    let matcher = new Matcher();

    this._systemStore = new SystemStore(
      new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.SYSTEM, false));

    this._userDataStore =
      new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.USER, true);

    this._database = new Database()
      .registerItemStore(this._systemStore)
      .registerItemStore(this._userDataStore)
      .registerQueryProcessor(this._systemStore)
      .registerQueryProcessor(this._userDataStore);

    this._loader = new Loader(this._database);
  }

  exec(args) {
    switch (args.db_command) {

      case 'users': {
        return this._systemStore.queryItems({}, {}, { type: 'User' }).then(users => {
          _.each(users, user => {
            console.log(JSON.stringify(_.pick(user, 'id', 'email')));
          });
        });
      }

      case 'groups': {
        return this._systemStore.queryItems({}, {}, { type: 'Group' }).then(users => {
          _.each(users, user => {
            console.log(JSON.stringify(_.pick(user, 'id', 'title')));
          });
        });
      }

      case 'init': {
        let data = fs.readFileSync(path.join(global.ENV.ALIEN_SERVER_DATA_DIR, 'accounts.json'), 'utf8');
        return Promise.all([
          this._loader.parse(JSON.parse(data), Database.NAMESPACE.SYSTEM, /^(Group)\.(.+)\.(.+)$/)
        ]).then(() => {
          return this._loader.initGroups();
        });
      }

      case 'reset': {
        return this._userDataStore.clear();
      }

      case 'testing': {
        return new TestGenerator(this._database).generate();
      }
    }
  }
}
