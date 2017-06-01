//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { ReactUtil } from '../../util/react';
import { Activity } from '../../common/activity';

import { SearchListContainer, SearchPanelContainer } from '../../containers';

// TODO(burdon): Remove.
import '../../resources/css/app.less';

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

  render() {
    return ReactUtil.render(this, () => {
      let { viewer } = this.props;
      if (!viewer) {
        return;
      }

      // TODO(burdon): Factor out column. layout.

      return (
        <div className="ux-column">

          {/*TODO(burdon): HOC w/redux actions.*/}
          {/*<Navbar/>*/}

          <SearchPanelContainer/>

          <SearchListContainer className="ux-grow"/>

          {/*TODO(burdon): HOC w/redux actions.*/}
          {/*<StatusBar/>*/}
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
