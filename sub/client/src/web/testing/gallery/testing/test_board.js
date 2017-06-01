//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Card } from '../../../components/card';
import { Board } from '../../../components/board';

/**
 * Test board.
 */
export class TestBoard extends React.Component {

  constructor() {
    super(...arguments);

    // TODO(burdon): Extract to data/board.json. Real data (larger cards).

    this.state= {
      model: {
        columns: [
          {
            id: 'C-1',
            title: 'Column 1',
            label: 'red'
          },
          {
            id: 'C-2',
            title: 'Column 2',
            label: 'green'
          },
          {
            id: 'C-3',
            title: 'Column 3',
            label: 'blue'
          }
        ],

        items: [
          {
            id: 'I-1',
            type: 'Test',
            title: 'Item 1',
            label: 'red'
          },
          {
            id: 'I-2',
            type: 'Test',
            title: 'Item 2',
            label: 'red'
          },
          {
            id: 'I-3',
            type: 'Test',
            title: 'Item 3',
            label: 'red'
          },
          {
            id: 'I-4',
            type: 'Test',
            title: 'Item 4',
            label: 'red'
          },
          {
            id: 'I-5',
            type: 'Test',
            title: 'Item 5',
            label: 'green'
          }
        ],

        columnMapper: (columns, item) => {
          let column = _.find(columns, column => column.label === item.label);
          return column && column.id;
        }
      }
    };
  }

  handleDrop(column, item, changes) {
    console.assert(column && item);

    // Change the list.
    item.label = column.label;

    // Rerender all lists.
    this.forceUpdate();

    console.log('Mutations: ' + JSON.stringify(changes));
  }

  render() {
    let { model } = this.state;

    return (
      <div className="ux-panel ux-grow">
        <div className="ux-scroll-container ux-row ux-grow">
          <Board items={ model.items }
                 itemRenderer={ Card.ItemRenderer }
                 columns={ model.columns }
                 columnMapper={ model.columnMapper }
                 onItemDrop={ this.handleDrop.bind(this) }/>
        </div>
      </div>
    );
  }
}
