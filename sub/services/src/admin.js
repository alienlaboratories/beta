//
// Copyright 2017 Alien Labs.
//

import * as fs from 'fs';
import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';
import readline from 'readline';

import { TypeUtil } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';

import { Loader } from './data/loader';
import { TestGenerator } from './data/testing';

import { Firebase } from './db/firebase/firebase';
import { FirebaseItemStore } from './db/firebase/firebase_item_store';

global.__ENV__            = _.get(process.env, 'NODE_ENV', 'development');
global.__PRODUCTION__     = __ENV__ === 'production';
global.__DEVELOPMENT__    = __ENV__ === 'development';
global.__TESTING__        = __ENV__ === 'testing';

const ENV = {
  ALIEN_CONFIG_FIREBASE: __PRODUCTION__ ? 'firebase/alienlabs-beta.yml' : 'firebase/alienlabs-dev.yml',

  APP_SERVER_CONF_DIR: path.join(__dirname, '../../../conf'),
  APP_SERVER_DATA_DIR: path.join(__dirname, '../../../data')
};

async function config(baseDir) {
  return await {
    'firebase': await yaml.read(path.join(baseDir, ENV.ALIEN_CONFIG_FIREBASE)),
  };
}

config(ENV.APP_SERVER_CONF_DIR).then(config => {
  let firebase = new Firebase(_.get(config, 'firebase'));

  let idGenerator = new IdGenerator();
  let matcher = new Matcher();

  let systemStore = new SystemStore(
    new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.SYSTEM, false));

  let userDataStore =
    new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.USER, true);

  let database = new Database()
    .registerItemStore(systemStore)
    .registerItemStore(userDataStore)
    .registerQueryProcessor(systemStore)
    .registerQueryProcessor(userDataStore);

  let loader = new Loader(database);

  // https://nodejs.org/api/readline.html
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  const commands = [
    {
      cmd: 'help',
      exec: (args) => {
        console.log('\nCommands: ' + _.map(commands, command => command.cmd).join(', ') + '\n');
      }
    },
    {
      cmd: 'config',
      exec: (args) => {
        console.log('Config = ' + TypeUtil.stringify(config, 2));
      }
    },
    {
      cmd: 'users',
      exec: (args) => systemStore.queryItems({}, {}, { type: 'User' }).then(users => {
        _.each(users, user => {
          console.log(JSON.stringify(_.pick(user, 'id', 'email')));
        });
      })
    },
    {
      cmd: 'groups',
      exec: (args) => systemStore.queryItems({}, {}, { type: 'Group' }).then(users => {
        _.each(users, user => {
          console.log(JSON.stringify(_.pick(user, 'id', 'title')));
        });
      })
    },
    {
      cmd: 'init',
      exec: (args) => {
        return Promise.all([
          loader.parse(JSON.parse(fs.readFileSync(path.join(ENV.APP_SERVER_DATA_DIR, 'accounts.json'), 'utf8')),
            Database.NAMESPACE.SYSTEM, /^(Group)\.(.+)\.(.+)$/)
        ]).then(() => {
          return loader.initGroups();
        });
      }
    },
    {
      cmd: 'testdata',
      exec: (args) => {
        return new TestGenerator(database).generate();
      }
    },
    {
      cmd: 'reset',
      exec: (args) => {
        return userDataStore.clear();
      }
    },
    {
      cmd: 'quit',
      exec: (args) => rl.close()
    }
  ];

  commands[0].exec();

  rl.prompt();
  rl.on('line', (input) => {
    let words = input.split(/\W+/);
    let handler = _.find(commands, command => command.cmd === words[0]);
    if (handler) {
      words.splice(0, 1);
      Promise.resolve(handler.exec(words)).then(() => {
        console.log();
        rl.prompt();
      });
    } else {
      commands[0].exec();
      rl.prompt();
    }
  }).on('close', () => {
    firebase.close();
    process.exit(0);
  });
});
