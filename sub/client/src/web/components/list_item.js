//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil } from 'alien-util';
import { MutationUtil } from 'alien-core';

import { TextBox } from './textbox';

//
// Context for child <ListItem/> components.
// Enable sub-components to access the item and list handlers.
//
const ListItemChildContextTypes = {

  // Item.
  item: PropTypes.object,

  // ListItem component.
  listItem: PropTypes.object,

  // Inherited from List component.
  onItemSelect: PropTypes.func,
  onItemEdit:   PropTypes.func,
  onItemUpdate: PropTypes.func,
  onItemCancel: PropTypes.func
};

/**
 * List item component (and sub-components).
 *
 * The ListItem makes the Item instance available via the component's context to sub components.
 * This removes the need to pass the item into each sub-component (via createInlineComponent).
 *
 * const CustomItemRenderer = ({ item }) => (
 *   <ListItem item={ item }>
 *     <ListItem.Text field="title"/>
 *   </ListItem>
 * )
 */
export class ListItem extends React.Component {

  /**
   * Creates an inline ListItem widget with the context declarations.
   * @param render
   * @returns {*}
   */
  static createInlineComponent(render) {
    render.contextTypes = ListItemChildContextTypes;
    return render;
  }

  /**
   * <ListItem.Debug/>
   */
  static Debug = ListItem.createInlineComponent((props, context) => {
    let { fields } = props;
    let { item } = context;

    let obj = fields ? _.pick(item, fields) : item;
    return (
      <div className="ux-debug">{ JSON.stringify(obj, null, 1) }</div>
    );
  });

  /**
   * <ListItem.Icon url="" icon=""/>
   */
  static Icon = ListItem.createInlineComponent((props, context) => {
    let { onClick, url, icon='crop_square' } = props;
    let { item } = context;

    let attrs = {};
    if (onClick) {
      attrs.onClick = () => { onClick(item); };
    }

    if (url) {
      return (
        <i className="ux-icon ux-icon-img" { ...attrs }>
          <img src={ url }/>
        </i>
      );
    } else if (icon) {
      return (
        <i className="ux-icon" { ...attrs }>{ icon }</i>
      );
    }
  });

  /**
   * <ListItem.Favorite/>
   */
  static Favorite = ListItem.createInlineComponent((props, context) => {
    let { item, onItemUpdate } = context;

    // TODO(burdon): Generalize to toggle any icon.
    let set = _.indexOf(item.labels, '_favorite') !== -1;
    const handleToggleLabel = () => {
      console.assert(onItemUpdate);
      onItemUpdate(item, [
        MutationUtil.createLabelMutation('_favorite', !set)
      ]);
    };

    return (
      <i className="ux-icon" onClick={ handleToggleLabel }>{ set ? 'star' : 'star_border' }</i>
    );
  });

  /**
   * <ListItem.Text field="title" select={ true }/>
   */
  static Text = ListItem.createInlineComponent((props, context) => {
    let { item, onItemSelect } = context;
    let { field='title', select=true } = props;

    let className = DomUtil.className('ux-grow', 'ux-text', select && 'ux-press');
    let attrs = {};
    if (select) {
      // NOTE: Use onMouseDown instead of onClick (happens before onBlur for focusable components).
      attrs = {
        onMouseDown: onItemSelect.bind(null, item)
      };
    }

    let value = _.get(item, field);

    return (
      <div className={ className } { ...attrs }>{ value }</div>
    );
  });

  /**
   * <ListItem.Edit field="title"/>
   */
  static Edit = ListItem.createInlineComponent((props, context) => {
    let { listItem, item, onItemUpdate, onItemCancel } = context;
    let { field='title' } = props;
    let { reset } = listItem.props;

    // Stateless functions can't use ref directly, but we can make a local reference.
    // https://facebook.github.io/react/docs/refs-and-the-dom.html#adding-a-ref-to-a-class-component
    let textbox;

    const handleSave = () => {
      let value = textbox.value;
      if (!value) {
        return onItemCancel();
      }

      onItemUpdate(item, [
        MutationUtil.createFieldMutation(field, 'string', value)
      ]);
    };

    const handleCancel = () => { onItemCancel(); };

    // Sets callback (e.g., when <ListItem.EditorButtons/> saves).
    listItem.setOnSave(() => {
      handleSave();
    });

    let value = _.get(item, field);

    return (
      <TextBox ref={ el => { textbox = el; } }
               className="ux-grow"
               autoFocus={ true }
               value={ value }
               reset={ reset }
               onEnter={ handleSave }
               onCancel={ handleCancel }/>
    );
  });

  /**
   * <ListItem.EditorButtons/>
   */
  static EditorButtons = ListItem.createInlineComponent((props, context) => {
    let { listItem, onItemCancel } = context;

    const handleSave = () => {
      listItem.save();
    };

    const handleCancel = () => { onItemCancel(); };

    return (
      <div className="ux-icons">
        <i className="ux-icon ux-icon-action ux-icon-ok" onClick={ handleSave }/>
        <i className="ux-icon ux-icon-action ux-icon-cancel" onClick={ handleCancel }/>
      </div>
    );
  });

  /**
   * <ListItem.EditButton/>
   */
  static EditButton = ListItem.createInlineComponent((props, context) => {
    let { item, onItemEdit } = context;

    const handleEdit = () => {
      onItemEdit(item.id);
    };

    return (
      <i className="ux-icon ux-icon-action ux-icon-hover ux-icon-edit" onClick={ handleEdit }/>
    );
  });

  /**
   * <ListItem.DeleteButton/>
   */
  static DeleteButton = ListItem.createInlineComponent((props, context) => {
    let { item } = context;

    const handleDelete = () => {
      context.onItemUpdate(item, [
        MutationUtil.createDeleteMutation(_.findIndex(item.labels, '_deleted') === -1)
      ]);
    };

    return (
      <i className="ux-icon ux-icon-delete" onClick={ handleDelete }>cancel</i>
    );
  });

  //
  // Provided by renderer.
  //
  static propTypes = {
    item: PropTypes.object,
    className: PropTypes.string,
  };

  //
  // From parent <List/> control.
  //
  static contextTypes = {
    onItemSelect: PropTypes.func.isRequired,
    onItemUpdate: PropTypes.func.isRequired,
    onItemCancel: PropTypes.func.isRequired
  };

  //
  // To child <ListItem/> components.
  // Enable sub-components to access the item and handlers.
  //
  static childContextTypes = ListItemChildContextTypes;

  constructor() {
    super();

    this._onSave = null;
  }

  setOnSave(callback) {
    this._onSave = callback;
  }

  save() {
    this._onSave && this._onSave();
  }

  getChildContext() {
    return {
      item: this.props.item,
      listItem: this
    };
  }

  render() {
    let { children, className } = this.props;

    return (
      <div className={ DomUtil.className('ux-list-item', className) }>
        { children }
      </div>
    );
  }
}

/**
 * ListItem editor.
 */
export class ListItemEditor extends React.Component {

  state = {
    count: 0,
    reset: false
  };

  /**
   * HACK: The parent List passes a new sequence number when the editor should be reset.
   */
  componentWillReceiveProps(nextProps) {
    this.setState({
      count: nextProps.seq,
      reset: nextProps.seq !== this.state.count
    });
  }

  render() {
    let { children, item, className } = this.props;
    let { reset } = this.state;

    return (
      <div className="ux-list-editor">
        <ListItem item={ item } reset={ reset } className={ className }>
          { children }
        </ListItem>
      </div>
    );
  }
}
