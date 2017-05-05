//
// Copyright 2017 Alien Labs.
//

import { ServiceProvider } from '../service';

// TODO(burdon): Placeholder.

/**
 * Analyer Service provider.
 */
export class AlienAnalyzerServiceProvider extends ServiceProvider {

  constructor() {
    super('analyzer');
  }

  get meta() {
    return {
      title: 'Analyzer',
      class: 'service-analyzer'
    };
  }

  get link() {
    return '/services';
  }
}
