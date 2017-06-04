//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../../util/react';
import { List, ListItem } from '../../components/list';

import { Activity } from './activity';
import { Layout } from './layout';

import './admin.less';

/**
 * Admin Activity.
 */
class AdminActivity extends React.Component {

  static ItemRenderer = (item) => (
    <ListItem item={ item }>
      <div className="ux-text">{ _.get(item, 'title') }</div>
      <div className="ux-text">{ _.get(item, 'user.title') }</div>
      <div>{ _.get(item, 'user') && 'Active' }</div>
    </ListItem>
  );

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  state = {
    // Active Group.
    groupId: null
  };

  handleSelectGroup(group) {
    this.setState({
      groupId: group && group.id
    });
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config, debug, actions, typeRegistry, eventListener, viewer, navigator } = this.props;
      if (!viewer) {
        return;
      }

      let { groupId } = this.state;
      let { groups } = this.props;

      // Join email whitelist with actual members.
      let whitelist = null;
      if (groupId) {
        let group = _.find(groups, group => group.id === groupId);
        whitelist = _.map(group.whitelist, email => {
          let user = _.find(group.members, member => member.email === email);
          return {
            id: email,
            title: email,
            user
          };
        });
      }

      let sidebar = <SidePanelContainer navigator={ navigator } typeRegistry={ typeRegistry }/>;

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                sidebar={ sidebar }
                actions={ actions }
                typeRegistry={ typeRegistry }
                eventListener={ eventListener }>

          <div className="ux-panel ux-columns ux-grow">

            {/* Master */}
            <div className="ux-admin-groups ux-column">
              <List ref="groups"
                    highlight={ true }
                    items={ groups }
                    onItemSelect={ this.handleSelectGroup.bind(this) }/>
            </div>

            {/* Detail */}
            <div className="ux-admin-whitelist ux-column ux-grow">
              <List ref="whitelist"
                    items={ whitelist }
                    itemRenderer={ AdminActivity.ItemRenderer }/>
            </div>
          </div>

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

const AdminQuery = gql`
  query AdminQuery($groupFilter: FilterInput) { 
    search(filter: $groupFilter) {
      items {
        ...GroupFragment
      }
    }
  }

  ${Fragments.GroupFragment}
`;

export default Activity.compose(

  graphql(AdminQuery, {
    options: (props) => ({
      variables: {
        groupFilter: {
          namespace: 'system',
          type: 'Group'
        }
      }
    }),

    props: ({ ownProps, data }) => {
      let { errors, loading, search={} } = data;
      let { items:groups } = search;

      return {
        errors,
        loading,
        groups
      };
    }
  })

)(AdminActivity);
