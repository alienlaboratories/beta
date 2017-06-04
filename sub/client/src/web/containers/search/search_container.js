//
// Copyright 2017 Alien Labs.
//

import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { QueryParser } from 'alien-core';
import { Fragments } from 'alien-api';

import { ReduxUtil } from '../../util/redux';
import { AppAction } from '../../common/reducers';
import { TypeRegistry } from '../../common/type_registry';

//-------------------------------------------------------------------------------------------------
// Search HOC.
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Broaden fragments, or lazily load them.

export const SearchQuery = gql`
  query SearchQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        ...ItemFragment
        ...ContactFragment
        ...DocumentFragment
        ...TaskFragment
        ...ProjectFragment
      }
    }
  }

  ${Fragments.ItemFragment}
  ${Fragments.ContactFragment}
  ${Fragments.DocumentFragment}
  ${Fragments.TaskFragment}
  ${Fragments.ProjectFragment}
`;

/**
 * Creates a graphql HOC that binds a search result to a list.
 *
 * @param query
 * @param path
 */
export function SearchContainer(query, path='search') {
  console.assert(query && path);

  return compose(

    ReduxUtil.connect({
      mapStateToProps: (state, ownProps) => {
        let { injector, search } = AppAction.getState(state);

        // Required by list renderer for custom types.
        let typeRegistry = injector.get(TypeRegistry);

        return {
          typeRegistry,
          search
        };
      }
    }),

    graphql(query, {
      withRef: 'true',

      options: (props) => {
        let { filter, search } = props;

        // Override the default filter with a valid search.
        if (!QueryParser.isEmpty(search.filter)) {
          filter = search.filter;
        }

        return {
          variables: {
            filter
          }
        };
      },

      props: ({ ownProps, data }) => {
        let { search: { filter }, itemInjector } = ownProps;
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
