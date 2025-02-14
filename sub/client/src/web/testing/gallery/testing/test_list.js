//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Transforms } from 'alien-core';

import { List } from '../../../components/list';
import { ListItem, ListItemEditor } from '../../../components/list_item';

/**
 * Test List.
 */
export class TestList extends React.Component {

  static id = 0;
  static createid() {
    return 'I-' + ++TestList.id;
  }

  static ItemEditor = ({ item }) => (
    <ListItemEditor item={ item }>
      <ListItem.Icon/>
      <ListItem.Edit field="title"/>
      <ListItem.EditorButtons/>
    </ListItemEditor>
  );

  static ItemRenderer = ({ item }) => (
    <ListItem item={ item }>
      <ListItem.Icon icon="check_box_outline_blank"/>
      <ListItem.Text field="title"/>
      <ListItem.EditButton/>
    </ListItem>
  );

  constructor() {
    super(...arguments);

    this.state = {
      items: [{
        id: TestList.createid(),
        type: 'Test',
        title: 'A very very very very very very very long title.'
      }]
    };

    for (let i = 1; i < 50; i++) {
      this.state.items.push({
        id: TestList.createid(),
        type: 'Test',
        title: 'Item ' + i
      });
    }
  }

  handleItemAdd() {
    this.refs.list.addItem();
  }

  handleItemUpdate(item, mutations) {
    if (item) {
      Transforms.applyObjectMutations({}, item, mutations);

      this.forceUpdate();
    } else {
      item = {
        id: TestList.createid(),
        type: 'Test'
      };

      Transforms.applyObjectMutations({}, item, mutations);
      let items = this.state.items;
      items.push(item);

      this.setState({
        items
      });
    }
  }

  handleItemSelect(item) {
    this.setState({
      item: item
    });
  }

  render() {
    let { item, items } = this.state;

    return (
      <div className="ux-panel ux-column ux-grow">
        <div className="ux-toolbar">
          <div/>
          <div>
            <i className="ux-icon ux-icon-action ux-icon-add ux-icon-large" onClick={ this.handleItemAdd.bind(this) }/>
          </div>
        </div>

        <div className="ux-column ux-grow">
          <List ref="list"
                className="ux-grow"
                items={ items }
                itemEditor={ TestList.ItemEditor }
                itemRenderer={ TestList.ItemRenderer }
                onItemUpdate={ this.handleItemUpdate.bind(this) }
                onItemSelect={ this.handleItemSelect.bind(this) }/>
        </div>

        <div className="ux-toolbar">
          <div className="ux-text-nocollapse ux-text-nowrap">{ item && JSON.stringify(item) }</div>
        </div>
      </div>
    );
  }
}
