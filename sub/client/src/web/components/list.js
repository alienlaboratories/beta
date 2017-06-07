//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';

import { DomUtil } from 'alien-util';

import { ItemDragSource, ItemDropTarget, DragOrderModel } from './dnd';
import { ListItemEditor, ListItem } from './list_item';

import './list.less';

//
// Drag and Drop wrappers.
//

const ListItemDragSource = ItemDragSource('ListItem');
const ListItemDropTarget = ItemDropTarget('ListItem');

/**
 * List is a super flexible component for rendering items.
 *
 * Lists can specify a custom itemRenderer that creates ListItem components.
 *
 * Inline components within each ListItem receive the List's context to access the data item,
 * and to handle events (e.g., selection, update).
 */
export class List extends React.Component {

  //
  // Default renderers.
  //

  static DefaultItemEditor = (props) => {
    return (
      <ListItemEditor { ...props }>
        <ListItem.Edit field="title"/>
        <ListItem.EditorButtons/>
      </ListItemEditor>
    );
  };

  static DefaultItemRenderer = ({ item }) => {
    return (
      <ListItem item={ item }>
        <ListItem.Text field="title"/>
      </ListItem>
    );
  };

  static DebugItemRenderer = (fields) => ({ item }) => {
    return (
      <ListItem item={ item }>
        <ListItem.Debug fields={ fields }/>
      </ListItem>
    );
  };

  //
  // Context passed to ListItem and inline widgets.
  //

  static childContextTypes = {
    onItemSelect:       PropTypes.func,
    onItemEdit:         PropTypes.func,
    onItemUpdate:       PropTypes.func,
    onItemCancel:       PropTypes.func
  };

  static propTypes = {
    data:               PropTypes.string,       // Custom data/label to identify list component.

    className:          PropTypes.string,
    highlight:          PropTypes.bool,
    showEditor:         PropTypes.bool,

    items:              PropTypes.arrayOf(PropTypes.object),
    groupedItems:       PropTypes.arrayOf(PropTypes.object),

    itemClassName:      PropTypes.string,
    itemEditor:         PropTypes.func,
    itemRenderer:       PropTypes.func,
    itemOrderModel:     PropTypes.object,       // Order model for drag and drop.

    onItemUpdate:       PropTypes.func,
    onItemSelect:       PropTypes.func,
    onItemDrop:         PropTypes.func
  };

  static defaultProps = {
    itemEditor:         List.DefaultItemEditor,
    itemRenderer:       List.DefaultItemRenderer
  };

  state = {
    itemEditor:         this.props.itemEditor   || List.DefaultItemEditor,
    itemRenderer:       this.props.itemRenderer || List.DefaultItemRenderer,

    showEditor:            this.props.showEditor,
    editingItemId:      null,

    seq:                0                       // Sequence number to reset editor.
  };

  getChildContext() {
    return {
      onItemSelect:     this.handleItemSelect.bind(this),
      onItemEdit:       this.handleItemEdit.bind(this),
      onItemUpdate:     this.handleItemUpdate.bind(this),
      onItemCancel:     this.handleItemCancel.bind(this)
    };
  }

  set itemEditor(itemEditor) {
    this.setState({
      itemEditor: itemEditor || List.DefaultItemEditor
    });
  }

  set itemRenderer(itemRenderer) {
    this.setState({
      itemRenderer: itemRenderer || List.DefaultItemRenderer
    });
  }

  /**
   * Set editor to add new item.
   */
  addItem() {
    if (!this.props.onItemUpdate) {
      console.warn('Read-only list.');
      return;
    }

    // TODO(burdon): Set focus on editor.
    if (!this.state.showEditor) {
      this.setState({
        showEditor: true,
        editingItemId: null
      });
    }
  }

  /**
   * Edit item for given ID.
   * @param {string} id
   */
  editItem(id=undefined) {
    if (!this.props.onItemUpdate) {
      console.warn('Read-only list.');
      return;
    }

    this.setState({
      showEditor: false,
      editingItemId: id
    });
  }

  /**
   * Call the List's onItemSelect callback.
   * @param {Item} item Item to select or null to cancel.
   */
  handleItemSelect(item) {
    // TODO(burdon): Factor out selection model.
    this.props.onItemSelect && this.props.onItemSelect(item);
  }

  /**
   * Set edit mode.
   * @param id
   */
  handleItemEdit(id) {
    this.editItem(id);
  }

  /**
   * Call the List's onItemUpdate callback with the given mutations.
   * @param {Item} item Null if create.
   * @param mutations
   */
  handleItemUpdate(item, mutations) {
    console.assert(mutations);
    console.assert(this.props.onItemUpdate);

    this.props.onItemUpdate(item, mutations);

    this.handleItemCancel(item);
  }

  /**
   * Cancel adding or editing item.
   * @param item Undefined if triggered from hanging editor.
   */
  handleItemCancel(item=undefined) {
    this.setState({
      showEditor: this.props.showEditor,
      editingItemId: null,

      // Bump the sequence number to reset the editor.
      seq: this.state.seq + (item ? 0 : 1)
    });
  }

  /**
   * Handle item drop.
   * @param dropItem
   * @param data
   * @param order
   */
  handleItemDrop(dropItem, data, order) {
    console.assert(dropItem && dropItem.id);

    // Update the order.
    let changes = this.props.itemOrderModel.setOrder(this.props.items, dropItem.id, data, order);

    // Repaint and notify parent.
    this.forceUpdate(() => {
      this.props.onItemDrop(this.props.data, dropItem.id, changes);
    });
  }

  /*
  handleMore() {
    this.props.fetchMoreItems().then(() => {
      // Glue to bottom.
      // TODO(burdon): Scroll-container.
      let el = $(this.refs.items);
      el[0].scrollTop = el[0].scrollHeight;
    });
  }
  */

  render() {
    // NOTE: data is a user-label to identify the list.
    let { items, className, itemClassName, highlight, itemOrderModel, groupedItems, data } = this.props;
    let { itemRenderer:ItemRenderer, itemEditor:ItemEditor, showEditor, editingItemId } = this.state;

    //
    // Group/merge items.
    //

    if (groupedItems) {

      // Create Set of all grouped items.
      let ids = new Set();
      _.each(groupedItems, groupedItem => {
        ids.add(groupedItem.id);
        _.each(groupedItem.groups, group => {
          _.each(group.ids, id => ids.add(id));
        });
      });
    }

    //
    // Sort items by order model.
    //

    if (itemOrderModel) {
      items = itemOrderModel.getOrderedItems(items);
    }

    //
    // Rows.
    //

    // Debug-only.
    let keyMap = new Map();

    let previousOrder = 0;
    let rows = _.map(items, item => {
      console.assert(item && item.id, 'Invalid Item: ' + JSON.stringify(item, 0, 2));

      let itemKey = item.id;
      if (keyMap.get(itemKey)) {
        console.warn('Repeated item [' + itemKey + ']: ' +
          JSON.stringify(_.pick(item, ['type', 'title'])) + ' == ' +
          JSON.stringify(_.pick(keyMap.get(itemKey), ['type', 'title'])));
      } else {
        keyMap.set(itemKey, item);
      }

      // Primary item.
      let listItem;
      if (item.id === editingItemId) {
        listItem = (
          <ItemEditor key={ itemKey } item={ item }/>
        );
      } else {
        listItem = (
          <ItemRenderer key={ itemKey } className={ itemClassName } item={ item }/>
        );
      }

      // If supports dragging, wrap with drag container.
      // TODO(burdon): Drop target isn't necessarily required on list.
      if (itemOrderModel) {
        // Get the order from the state (if set); otherwise invent one.
        let actualOrder = itemOrderModel.getOrder(item.id);
        let itemOrder = actualOrder || previousOrder + 1;

        // Calculate the dropzone order (i.e., midway between the previous and current item).
        let dropOrder = (previousOrder === 0) ? previousOrder : DragOrderModel.split(previousOrder, itemOrder);

        // Drop zone above each item.
        listItem = (
          <ListItemDropTarget key={ itemKey }
                              data={ data }
                              order={ dropOrder }
                              onDrop={ this.handleItemDrop.bind(this) }>

            <ListItemDragSource data={ item.id } order={ actualOrder }>
              { listItem }
            </ListItemDragSource>
          </ListItemDropTarget>
        );

        previousOrder = itemOrder;
      }

      return listItem;
    });

    // Drop zone at the bottom of the list.
    let lastDropTarget = null;
    if (itemOrderModel) {
      lastDropTarget = <ListItemDropTarget data={ data }
                                           order={ previousOrder + .5 }
                                           onDrop={ this.handleItemDrop.bind(this) }/>;
    }

    //
    // Layout.
    //

    return (
      <div className={ DomUtil.className('ux-list', className, highlight && 'ux-list-highlight') }>

        <div className="ux-list-items ux-scroll-container">
          <div className="ux-column">
            { rows }
            { lastDropTarget }
          </div>
        </div>

        { showEditor &&
        <ItemEditor seq={ this.state.seq }/>
        }
      </div>
    );
  }
}

export const DragDropList = DragDropContext(HTML5Backend)(List);
