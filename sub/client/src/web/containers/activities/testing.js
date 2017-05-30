//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { ReactUtil } from '../../util/react';

import { Activity } from '../../common/activity';
import { Navbar } from '../../components/navbar';

/**
 * Testing Activity.
 * For experimental features and components.
 */
class TestingActivity extends React.Component {

  // TODO(burdon): Extend base class.

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { viewer, typeRegistry } = this.props;
      if (!viewer) {
        return;
      }

      // let navbar = (
      //   <Navbar>
      //     <div className="ux-toolbar">
      //       <div>
      //         <i className="ux-icon ux-icon-action"
      //            onClick={ this.onAddItem.bind(this, 'list') }>add</i>
      //         <i className="ux-icon ux-icon-action"
      //            onClick={ this.onChangeView.bind(this, 'list') }>view_list</i>
      //         <i className="ux-icon ux-icon-action"
      //            onClick={ this.onChangeView.bind(this, 'card') }>view_module</i>
      //       </div>
      //     </div>
      //   </Navbar>
      // );

      return (
        <div>Testing</div>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

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
