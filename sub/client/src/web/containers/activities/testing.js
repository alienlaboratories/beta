//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { ReactUtil } from '../../util/react';
import { Activity } from '../../common/activity';

import { SearchListContainer, SearchPanelContainer } from '../../containers';

import { NavBar } from '../../components/navbar';
import { StatusBar } from '../../components/statusbar';

/**
 * Testing Activity.
 *
 * For experimental features and components.
 */
class TestingActivity extends React.Component {

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  handleAction(action) {
    console.log(action);
  }

  // TODO(burdon): Factor out column. layout.

  render() {
    return ReactUtil.render(this, () => {
      let { config, viewer, navigator } = this.props;
      if (!viewer) {
        return;
      }

      let version = _.get(config, 'app.version');

      return (
        <div className="ux-fullscreen ux-column">
          <header>
            <div className="ux-grow">
              <h1>Alien</h1>
            </div>

            <NavBar navigator={ navigator }/>
          </header>

          <SearchPanelContainer/>

          <SearchListContainer className="ux-grow"/>

          <footer>
            <StatusBar onAction={ this.handleAction.bind(this) }>
              <span className="ux-font-xsmall">{ version }</span>
            </StatusBar>
          </footer>
        </div>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Remove.

//
// Tasks are merged (i.e., status + assigee); sub Tasks of Project are isolated with separate/munged "project/task" IDs.
//
const TestQuery = gql`
  query TestQuery {
    search: search(filter: { type: "Task", expr: { field: "status", value: { int: 1 } } }) {
      items {
        id
        type
        title

        ... on Task {
          status
        }
      }
    }
  }  
`;

export default Activity.compose(

  graphql(TestQuery, {

    options: (props) => ({
      variables: {
        filter: { type: 'Task' }
      }
    }),

    props: ({ ownProps, data }) => {
      let { errors, loading, search={} } = data;
      let { items } = search;

      return {
        errors,
        loading,
        items
      };
    }
  })

)(TestingActivity);
