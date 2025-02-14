//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { ID } from 'alien-core';

import { ReactUtil } from '../util/react';
import { List } from '../components/list';
import { ListItem } from '../components/list_item';
import { Path } from '../common/path';

import './sidepanel.less';

/**
 * Sidebar content.
 */
export class SidePanel extends React.Component {

  static ItemRenderer = (typeRegistry) => ({ item }) => {
    let { type, meta } = item;
    let { icon=typeRegistry.icon(type) } = meta || {};

    return (
      <ListItem item={ item }>
        <ListItem.Icon icon={ icon }/>
        <ListItem.Text field="title"/>
      </ListItem>
    );
  };

  static propTypes = {
    viewer: PropTypes.object.isRequired,
    navigator: PropTypes.object.isRequired,
    typeRegistry: PropTypes.object.isRequired,
  };

  onSelect(item) {
    let { navigator } = this.props;
    let { alias, link } = item;
    // TODO(burdon): Alias links not working.
    alias = null;
    navigator.push(link || (alias && Path.folder(alias)) || Path.canvas(ID.key(item)));
  }

  render() {
    return ReactUtil.render(this, () => {
      let { viewer, typeRegistry } = this.props;

      const adminItems = [
        // TODO(burdon): Admin ACL.
        {
          type: 'Folder',
          id: 'folder-admin',
          title: 'Admin',
          meta: {
            icon: 'build'
          },
          link: Path.ADMIN
        },
        // TODO(burdon): If debug set in config.
        {
          type: 'Folder',
          id: 'folder-testing',
          title: 'Testing',
          meta: {
            icon: 'bug_report'
          },
          link: Path.TESTING
        }
      ];

      const itemRenderer = SidePanel.ItemRenderer(typeRegistry);
      const FolderList = ({ items }) => (
        <List items={ items }
              itemRenderer={ itemRenderer }
              highlight={ true }
              onItemSelect={ this.onSelect.bind(this) }/>
      );

      let folders = viewer.folders;
      let groups = viewer.groups;
      let projects = _.flatten(_.map(groups, group => group.projects));

      return (
        <div className="ux-side-panel ux-column ux-grow">

          <FolderList items={ folders }/>
          <div className="ux-divider"/>

          <FolderList items={ groups }/>
          <div className="ux-divider"/>

          <FolderList items={ projects }/>
          <div className="ux-divider"/>

          <FolderList items={ adminItems }/>
        </div>
      );
    });
  }
}
