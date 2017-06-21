//
// Copyright 2017 Alien Labs.
//

import { ServiceProvider } from '../service';

/**
 * Slack Service.
 */
export class EvernoteServiceProvider extends ServiceProvider {

  constructor() {
    super('evernote');
  }

  get meta() {
    return {
      title: 'Evernote',
      class: 'service-evernote'
    };
  }
}
