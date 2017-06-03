//
// Copyright 2017 Alien Labs.
//

import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { AppAction } from '../../common/reducers';
import { TypeRegistry } from '../../common/type_registry';
import { List } from '../../components/list';

//-------------------------------------------------------------------------------------------------
// Search HOC.
//-------------------------------------------------------------------------------------------------

export const SearchQuery = gql`
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
  let { injector, search: { filter } } = AppAction.getState(state);

  let typeRegistry = injector.get(TypeRegistry);    // TODO(burdon): Remove?

  return {
    typeRegistry,
    filter
  };
};

/**
 * Creates a graphql HOC that binds a search result to a list.
 *
 * @param query
 * @param path
 */
export function SearchContainer(query, path='search') {
  console.assert(query && path);

  return compose(

    connect(mapStateToProps),

    graphql(query, {
      withRef: 'true',

      options: (props) => {
        let { filter } = props;

        return {
          variables: {
            filter
          }
        };
      },

      props: ({ ownProps, data }) => {
        let { filter, itemInjector } = ownProps;
        let { errors, loading, refetch } = data;

        let search = _.get(data, path, {});
        let { items=[], groupedItems=[] } = search;

        // Inject additional items (e.g., from context).
        if (itemInjector) {
          items = itemInjector(items);
        }

        return {
          errors,
          loading,
          refetch,

          items,
          groupedItems,

          // Paging.
          // TODO(burdon): Hook-up to UX.
          // http://dev.apollodata.com/react/pagination.html
          // http://dev.apollodata.com/react/cache-updates.html#fetchMore
          fetchMoreItems: () => {
            return data.fetchMore({
              variables: {
                filter
              },

              // TODO(burdon): Grouped items.
              updateQuery: (previousResult, { fetchMoreResult }) => {
                return _.assign({}, previousResult, {
                  items: [..._.get(previousResult, path), ..._.get(fetchMoreResult.data, path)]
                });
              }
            });
          }
        };
      }
    })
  );
}

/**
 * Basic list.
 */
export const BasicSearchListContainer = SearchContainer(SearchQuery)(List);
