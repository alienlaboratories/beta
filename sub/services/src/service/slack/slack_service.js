//
// Copyright 2017 Alien Labs.
//

import { ServiceProvider } from '../service';

/**
 * Slack Service.
 */
export class SlackServiceProvider extends ServiceProvider {

  constructor() {
    super('slack');
  }

  get meta() {
    return {
      title: 'Slack',
      class: 'service-slack',
      icon: '/img/service/slack.png'
    };
  }

  get link() {
    return '/services';
//  return '/botkit/login';
  }
}
