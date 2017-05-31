//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { TypeRegistry } from '../../../common/type_registry';

import { CardDeck } from '../../../components/card';

import Data from '../data/data.json';

/**
 * Test List.
 */
export class TestCards extends React.Component {

  constructor() {
    super(...arguments);

    this._typeRegistry = new TypeRegistry();

    let { items } = Data;
    _.each(items, item => {
      item.modified = Date.now();
    });

    this.state = {
      items
    };
  }

  render() {
    let { items } = this.state;

    return (
      <CardDeck className="ux-grow" typeRegistry={ this._typeRegistry } items={ items }/>
    );
  }
}
