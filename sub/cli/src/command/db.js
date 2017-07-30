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

    this._dataStore =
      new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.USER, true);

    this._database = new Database()
      .registerItemStore(this._systemStore)
      .registerItemStore(this._dataStore)
      .registerQueryProcessor(this._systemStore)
      .registerQueryProcessor(this._dataStore);

    this._loader = new Loader(this._database);
  }

  get command() {
    return {
      command: 'db <cmd>',
      describe: 'Database managment.',
      builder: yargs => yargs

        .command('users', 'List users.', {}, Command.handler(argv => {
          return this._systemStore.queryItems({}, {}, { type: 'User' }).then(users => {
            console.log();
            _.each(users, user => {
              console.log(JSON.stringify(_.pick(user, 'id', 'email')));
            });
          });
        }))

        .command('groups', 'List groups.', {}, Command.handler(argv => {
          return this._systemStore.queryItems({}, {}, { type: 'Group' }).then(users => {
            console.log();
            _.each(users, user => {
              console.log(JSON.stringify(_.pick(user, 'id', 'title')));
            });
          });
        }))

        .command('reset', 'Reset database.', {}, Command.handler(argv => {
          return this._dataStore.clear();
        }))

        .command('init', 'Initialize database.', {}, Command.handler(argv => {
          let data = fs.readFileSync(path.join(global.ENV.ALIEN_SERVER_DATA_DIR, 'accounts.json'), 'utf8');
          return Promise.all([
            this._loader.parse(JSON.parse(data), Database.NAMESPACE.SYSTEM, /^(Group)\.(.+)\.(.+)$/)
          ]).then(() => {
            return this._loader.initGroups();
          });
        }))

        .command('testing', 'Generate test data.', {}, Command.handler(argv => {
          return new TestGenerator(this._database).generate();
        }))

        .help()
    };
  }
}
