//
// Copyright 2017 Alien Labs.
//

import { ServiceProvider } from '../service';

// TODO(burdon): Placeholder.

/**
 * Extractor Service provider.
 */
export class AlienExtractorServiceProvider extends ServiceProvider {

  constructor() {
    super('extractor');
  }

  get meta() {
    return {
      title: 'Extractor',
      class: 'service-extractor'
    };
  }

  get link() {
    return '/services';
  }
}
