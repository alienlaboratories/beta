//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import readline from 'readline';

import { ArgumentParser } from 'argparse';

import { TypeUtil } from 'alien-util';

import { Command, DatabaseCommand, LoginCommand, QueryCommand, StatusCommand, TaskCommand } from './command';

/**
 * Command line app.
 */
export class App {

  constructor(config) {
    console.assert(config);
    this._config = config;

    //
    // Configure args parser.
    // http://nodeca.github.io/argparse
    // https://www.npmjs.com/package/argparse
    //

    this._parser = new ArgumentParser({
      version: '0.0.1',
      addHelp: true,
      description: 'Alien CLI.',
      debug: true   // Throw Error rather than exit.
    });

    let commands = this._parser.addSubparsers({ title: 'commands', dest: 'command' });

    commands.addParser('config',    { addHelp: true });
    commands.addParser('login',     { addHelp: true });
    commands.addParser('stats',     { addHelp: true });

    //
    // Query commands.
    // TODO(burdon): Sub-sub parser's help isn't shown.
    //

    let query = commands.addParser('query', { addHelp: true, aliases: ['q'] });
    query.addArgument('query_str', { action: 'store', type: 'string', nargs: '?' });

    let db = commands.addParser('db', { addHelp: true, help: '{users, groups, init, reset, testing}' });
    let dbCommand = db.addSubparsers({ title: 'database', dest: 'db_command' });

    dbCommand.addParser('users',    { addHelp: true });
    dbCommand.addParser('groups',   { addHelp: true });
    dbCommand.addParser('init',     { addHelp: true });
    dbCommand.addParser('reset',    { addHelp: true });
    dbCommand.addParser('testing',  { addHelp: true });

    let task = commands.addParser('task', { addHelp: true, help: '{list}' });
    let taskCommand = task.addSubparsers({ title: 'task', dest: 'task_command' });

    taskCommand.addParser('list', { addHelp: true });

    //
    // Handlers.
    //

    // TODO(burdon): Trigger admin commands (as from web site).
    // TODO(burdon): Aliases don't preserve the command.

    this._handlers = new Map();

    this._handlers.set(['config'],      Command.of(config, (args) => { console.log(TypeUtil.stringify(config, 2)); }));
    this._handlers.set(['stats'],       new StatusCommand(config));
    this._handlers.set(['login'],       new LoginCommand(config));

    this._handlers.set(['db'],          new DatabaseCommand(config));
    this._handlers.set(['task'],        new TaskCommand(config));
    this._handlers.set(['query', 'q'],  new QueryCommand(config));
  }

  processCommand(args) {
    let handler;
    this._handlers.forEach((value, key) => {
      if (_.indexOf(key, args.command) !== -1) {
        // Lazy instantiation.
        if (_.isFunction(value)) {
          console.log('Initializing...');
          handler = value();
          console.log();
          this._handlers.set(key, handler);
        } else {
          handler = value;
        }
      }
    });

    if (!handler) {
      return Promise.reject('No handler.');
    } else {
      return Promise.resolve(handler.exec(args));
    }
  }

  close() {
    // TODO(burdon): Close all commands.
  }

  run() {
    console.log();
    if (process.argv.length === 2) {
      return this.runLoop();
    } else {
      return this.runOnce();
    }
  }

  runOnce() {
    const args = this._parser.parseArgs();
    return this.processCommand(args);
  }

  runLoop() {
    // https://nodejs.org/api/readline.html
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `[${global.__ENV__}]> `
    });

    return new Promise((resolve, reject) => {
      rl.prompt();
      rl.on('line', (input) => {
        let words = input.split(/\W+/);
        switch (words[0]) {
          case 'quit': {
            rl.close();
            break;
          }

          case 'h':
          case 'help': {
            this._parser.printHelp();
            console.log();
            rl.prompt();
            break;
          }

          default: {
            try {
              console.log();
              const args = this._parser.parseArgs(words);
              this.processCommand(args).then(() => {
                console.log();
                rl.prompt();
              }).catch(err => {
                console.error(err);
                rl.prompt();
              });
            } catch(err) {
              console.error(err.message, '\n');

              this._parser.printHelp();
              console.log();
              rl.prompt();
            }
          }
        }
      }).on('close', () => {
        resolve();
      });
    });
  }

  start() {
    return this.run().then(() => {
      this.close();
    }).catch(err => {
      console.error(err);
      this.close();
    });
  }
}
