//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import readline from 'readline';
import yargs from 'yargs';

import { DatabaseCommand, LoginCommand, QueryCommand, StatusCommand, TaskCommand } from './command';

/**
 * Command line app.
 */
export class App {

  constructor(config) {
    // TODO(burdon): '*' default command.
    // https://github.com/yargs/yargs/blob/master/docs/advanced.md#commands
    this._yargs = yargs
      .option('env', {
        default: 'dev'
      })
      .exitProcess(false)
      .help();

    _.each([
      new LoginCommand(config),
      new StatusCommand(config),
      new DatabaseCommand(config),
      new TaskCommand(config),
      new QueryCommand(config)
    ], module => {
      this._yargs.command(module.command);
    });

    // https://nodejs.org/api/readline.html
    // https://nodejs.org/api/readline.html#readline_example_tiny_cli
    this._rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `[${global.__ENV__}]> `
    });
  }

  start() {
    // http://yargs.js.org/docs/#api-parseargs-context-parsecallback
    return new Promise((resolve, reject) => {

      // Command line mode.
      if (process.argv.length > 2) {
        process.argv.splice(0, 2);
        this._yargs.parse(process.argv, (err, argv, output) => {
          Promise.resolve(argv._result).then(result => {
            resolve(result);
          });
        });
      } else {
        // CLI mode.
        this._rl.prompt();
        this._rl.on('line', (input) => {
          // TODO(burdon): Prevent echo of input?
          let words = input.split(/\W+/);
          this._yargs.parse(words, (err, argv, output) => {
            if (err) {
              console.error(err);
              process.exit(1);
            }

            // TODO(burdon): Async? https://github.com/yargs/yargs/issues/918
            Promise.resolve(argv._result).then(result => {
              console.log();

              // TODO(burdon): How to set output?
              console.log(output);
              console.log();

              // Next command.
              this._rl.prompt();
            });
          });
        }).on('close', () => {
          resolve();
        });
      }
    });
  }
}
