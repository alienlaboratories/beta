//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Transforms } from 'alien-core';

import { List, ListItem, ListItemEditor } from '../../components/list';

/**
 * Test List.
 */
export default class TestList extends React.Component {

  static id = 0;
  static createid() {
    return 'I-' + ++TestList.id;
  }

  static ItemEditor = (item, list) => (
    <ListItemEditor item={ item }>
      <ListItem.Icon icon="`"/>
      <ListItem.Edit field="title"/>
      <ListItem.EditorButtons/>
    </ListItemEditor>
  );

  static ItemRenderer = (item, list) => (
    <ListItem item={ item }>
      <ListItem.Icon icon="check_box_outline_blank"/>
      <ListItem.Text value={ item.title }/>
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
      Transforms.applyObjectMutations(item, mutations);

      this.forceUpdate();
    } else {
      item = {
        id: TestList.createid(),
        type: 'Test'
      };

      Transforms.applyObjectMutations(item, mutations);
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
      <div className="ux-column">
        <div className="ux-bar">
          <i className="ux-icon ux-icon-action ux-icon-large ux-icon-add" onClick={ this.handleItemAdd.bind(this) }/>
        </div>

        <div className="ux-expand">
          <List ref="list"
                items={ items }
                itemEditor={ TestList.ItemEditor }
                itemRenderer={ TestList.ItemRenderer }
                onItemUpdate={ this.handleItemUpdate.bind(this) }
                onItemSelect={ this.handleItemSelect.bind(this) }/>
        </div>

        <div className="ux-bar">
          <div className="ux-text-nocollapse ux-text-nowrap">{ item && JSON.stringify(item) }</div>
        </div>
      </div>
    );
  }
}
