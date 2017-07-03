//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';
import { compose, graphql } from 'react-apollo';

import { Fragments } from 'alien-api';

import { ReduxUtil } from '../../util/redux';
import { Card, CardCanvas } from '../../components/card';

//-------------------------------------------------------------------------------------------------
// Card HOC.
//-------------------------------------------------------------------------------------------------

const ItemQuery = gql`
  query ItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
    }
  }

  ${Fragments.ItemFragment}  
`;

/**
 * Creates a graphql HOC that binds an item query to a Card.
 *
 * @param query
 * @param path
 */
export function QueryItem(query, path='item') {
  console.assert(query && path);

  return compose(

    ReduxUtil.connect({
      mapStateToProps: (state, ownProps) => {
        return {};
      }
    }),

    graphql(query, {
      // withRef: true,   // TODO(burdon): Causes error.

      // Map properties to query.
      // http://dev.apollodata.com/react/queries.html#graphql-options
      options: (props) => {
        let { itemKey:key } = props;
        console.assert(key);

        return {
          variables: {
            key
          }
        };
      },

      // Map query result to component properties.
      // http://dev.apollodata.com/react/queries.html#graphql-props
      props: ({ ownProps, data }) => {
        let { errors, loading, refetch } = data;
        let item = _.get(data, path);

        // https://github.com/apollographql/apollo-client/issues/1830
        // Create repro.
        // TODO(burdon): Null after mutation: query called x2. Project in cache; same if opt on/off.
        // Repro: New Project > Create Task > Move Task. OK after refresh page. Only IF UPDATE PROJECT (i.e., drag)
        // Both queries happen after first batch cache write, but before the second. FILE BUG.
        if (!loading && !item) {
          console.warn('Invalid item: ' + JSON.stringify(ownProps.itemKey));
          loading = true;
        }

        // TODO(burdon): Prevent flickering while loading.
        // https://stackoverflow.com/questions/31016130/preventing-ui-flicker-when-loading-async-data-in-react-js
        return {
          errors,
          loading,
          refetch,
          item
        };
      }
    })

  );
}

/**
 * Default container.
 */
export const ItemCardContainer = QueryItem(ItemQuery)(CardCanvas(Card));
