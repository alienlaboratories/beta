//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Card } from '../../../components/card';
import { List } from '../../../components/list';

import Data from '../data/cards.json';

/**
 * Test List.
 */
export class TestCards extends React.Component {

  constructor() {
    super(...arguments);

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
      <List className="ux-card-deck ux-grow"
            itemRenderer={ Card.ItemRenderer }
            items={ items }/>
    );
  }
}
