//
// Copyright 2017 Alien Labs.
//

import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { AppAction } from '../common/reducers';
import { List } from '../components/list';

const SearchQuery = gql`
  query SimpleSearchQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        id
        type
        title
      }
    }
  }
`;

const mapStateToProps = (state, ownProps) => {
  let { search } = AppAction.getState(state);

  return {
    search
  };
};

/**
 * Search results list.
 */
export const SearchListContainer = compose(

  connect(mapStateToProps),

  graphql(SearchQuery, {

    options: (props) => {
      let { search: { text } } = props;

      let filter = {
        text
      };

      return {
        variables: {
          filter
        }
      };
    },

    props: ({ ownProps, data }) => {
      let { search={} } = data;
      let { items=[] } = search;

      return {
        items
      };
    }
  })

)(List);
