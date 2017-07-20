//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import PubSub from '@google-cloud/pubsub';

import { Command } from './command';

/**
 * Login and show stats.
 */
export class GCloudCommand extends Command {

  constructor(config) {
    super(config);

    // Instantiates a client
    this._pubsubClient = PubSub({
      projectId: _.get(config, 'google.projectId')
    });
  }

  // TODO(burdon): Auth.
  // https://cloud.google.com/pubsub/docs/reference/libraries
  // gcloud auth application-default login

  get command() {
    return {
      command: 'gcloud',
      aliases: ['g'],
      describe: 'Google Cloud.',
      builder: yargs => yargs

        .command('topics', 'List topics.', {}, Command.handler(argv => {
          // https://googlecloudplatform.github.io/google-cloud-node/#/docs/pubsub/0.13.1/pubsub?method=getTopics
          return this._pubsubClient.getTopics()
            .then(results => {
              let topics = results[0];
              topics.forEach(topic => console.log(topic.name));
              return topics;
            });
        }))

        // https://cloud.google.com/pubsub/docs/admin#create_a_push_subscription
        .command('subscriptions', 'List subscriptions.', {}, Command.handler(argv => {
          return this._pubsubClient.getSubscriptions()
            .then((results) => {
              const subscriptions = results[0];
              subscriptions.forEach(subscription => console.log(subscription.name));
              return subscriptions;
            });
        }))
    };
  }
}
