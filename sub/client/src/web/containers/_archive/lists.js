//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import { Fragments } from 'alien-api';

import { List, ListItem } from '../components/list';

import { SubscriptionWrapper } from '../util/subscriptions';

import { Connector } from './connector';

//-------------------------------------------------------------------------------------------------
// List renderers.
//-------------------------------------------------------------------------------------------------

const CustomIcon = ListItem.createInlineComponent((props, context) => {
  let { item } = context;
  let { typeRegistry } = props;

  return (
    <ListItem.Icon icon={ item.iconUrl || typeRegistry.icon(item.type) }/>
  );
});

const CustomColumn = ListItem.createInlineComponent((props, context) => {
  let { item } = context;
  let { typeRegistry } = props;

  let Column = typeRegistry.column(item.type);

  return (
    <div className="ux-noshrink">
      { Column &&
        <Column item={ item }/>
      }
    </div>
  );
});

/**
 * NOTE: Depends on ItemFragment fields.
 */
export const BasicListItemRenderer = (typeRegistry) => (item) => {
  return (
    <ListItem item={ item }>
      <ListItem.Favorite/>
      <ListItem.Text value={ item.title } select={ true }/>
      <CustomColumn typeRegistry={ typeRegistry }/>
      <div className="ux-icons ux-noshrink">
        <CustomIcon typeRegistry={ typeRegistry }/>
        <ListItem.DeleteButton/>
      </div>
    </ListItem>
  );
};

/**
 * Debug.
 */
export const DebugListItemRenderer = (item) => {
  return (
    <ListItem item={ item } className="ux-column">
      <ListItem.Favorite/>
      <div>
        <ListItem.Text value={ item.title }/>
        <ListItem.Debug/>
      </div>
    </ListItem>
  );
};

//-------------------------------------------------------------------------------------------------
// Query.
//-------------------------------------------------------------------------------------------------

/**
 * List query.
 *
 * @param query
 * @param path
 */
function searchQuery(query, path='search') {
  console.assert(query && path);
  Connector.registerQuery(query);

  // Return HOC.
  return graphql(query, {
    withRef: 'true',

    // Configure query variables.
    // http://dev.apollodata.com/react/queries.html#graphql-options
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient\.query
    options: (props) => {
      let { filter } = props;

      // TODO(burdon): Generates a new callback each time rendered. Create property for class.
      // https://github.com/apollostack/apollo-client/blob/master/src/ApolloClient.ts
      return {
        variables: {
          filter,
        }
      };
    },

    // Configure props passed to component.
    // http://dev.apollodata.com/react/queries.html#graphql-props
    props: ({ ownProps, data }) => {
      let { matcher, filter, itemInjector } = ownProps;
      let { errors, loading, refetch } = data;

      // Get query result.
      let items = _.get(data, path + '.items', []);
      let groupedItems = _.get(data, path + '.groupedItems');

      // Inject additional items (e.g., from context).
      if (itemInjector) {
        items = itemInjector(items);
      }

      return {
        errors,
        loading,
        refetch,
        matcher,

        // Data from query.
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
  });
}

//-------------------------------------------------------------------------------------------------
// Basic List.
//-------------------------------------------------------------------------------------------------

const BasicSearchQuery = gql`
  query BasicSearchQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        ...ItemFragment
      }
    }
  }

  ${Fragments.ItemFragment}
`;

export const BasicSearchList = Connector.connect(searchQuery(BasicSearchQuery))(SubscriptionWrapper(List));

//-------------------------------------------------------------------------------------------------
// Card List.
//-------------------------------------------------------------------------------------------------

const CardSearchQuery = gql`
  query CardSearchQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        ...ItemMetaFragment
      }
      
      groupedItems {
        id
        groups {
          field
          ids
        }
      }      
    }
  }

  ${Fragments.ItemMetaFragment}
`;

export const CardSearchList = Connector.connect(searchQuery(CardSearchQuery))(SubscriptionWrapper(List));
