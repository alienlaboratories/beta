#!/usr/bin/env babel-node

// TODO(burdon): Webpack.

// http://nodeca.github.io/argparse
// https://www.npmjs.com/package/argparse
// https://www.npmjs.com/package/inquirer
// https://www.npmjs.com/package/node-cli-google

import { ArgumentParser } from 'argparse';

import { LoginCommand } from './src/login';
import { QueryCommand } from './src/query';

// TODO(burdon): Config.
// https://console.developers.google.com/apis/credentials?project=alienlabs-dev
// Created 05/19/17
const config = {
  google: {
    clientId: '933786919888-5p4cnpnqb1fjnkikq6ge6opqu2iljne7.apps.googleusercontent.com',
    clientSecret: 'cc0vDu-8rQ6PER7Q012iE10g'
  },

  // TODO(burdon): Runtime switch.
  server: 'http://localhost:3000'
};

let parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Alien CLI.'
});

let commands = parser.addSubparsers({
  title: 'commands',
  dest: 'command'
});

commands.addParser('login',   { addHelp: true });
commands.addParser('version', { addHelp: true });
commands.addParser('status',  { addHelp: true, aliases: ['stat'] });

let query = commands.addParser('query',   { addHelp: true, aliases: ['q'] });
query.addArgument('query', { action: 'store', type: 'string' });

const args = parser.parseArgs();

// TODO(burdon): Move services admin here.

const handlers = {
  'login': new LoginCommand(config),
  'query': new QueryCommand(config)
};

let handler = handlers[args.command];
if (handler) {
  handler.exec(args);
}
