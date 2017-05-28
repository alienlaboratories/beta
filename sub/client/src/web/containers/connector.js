//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

import { Logger } from 'alien-util';
import { Fragments, Matcher } from 'alien-core';

import { AppAction } from '../common/reducers';

const logger = Logger.get('connector');

//-------------------------------------------------------------------------------------------------
// Query HOC utils.
//-------------------------------------------------------------------------------------------------

const mapStateToProps = (state, ownProps) => {
  let { injector, config, client } = AppAction.getState(state);

  let matcher = injector.get(Matcher);

  // Get from cache.
  const { viewer } = client.readQuery({
    query: Fragments.ViewerQuery
  });

  let userId = _.get(viewer, 'context.user.id');
  let buckets = _.map(_.get(viewer, 'groups'), group => group.id);

  return {

    // Required by HOC reducers.
    config,
    matcher,

    // Matcher's context used by HOC reducers.
    context: {
      userId,
      buckets
    }
  };
};

/**
 * Creates HOC for queries.
 */
export class Connector {

  // TODO(burdon): Debug only.
  static registerQuery(query) {
    let name = _.get(query, 'definitions[0].name.value');
    let queries = _.get(window, 'alien.queries', {});
    queries[name] = query;
    _.set(window, 'alien.queries', queries);

    logger.log('Query: ' + name);
  }

  /**
   * HOC wrapper for reducers.
   * Adapts Redux state from the App to the alien-core reducers.
   */
  static connect(containers) {
    containers = _.concat([
      // withRef provides Access component via getWrappedInstance()
      // http://dev.apollodata.com/react/higher-order-components.html#with-ref
      // https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options
      connect(mapStateToProps, null, null, { withRef: true }),
    ], containers);

    return compose(...containers);
  }

  /**
   * Item query.
   *
   * @param query
   * @param path
   */
  static itemQuery(query, path='item') {
    console.assert(query && path);
    Connector.registerQuery(query);

    return graphql(query, {
      withRef: 'true',

      // Map properties to query.
      // http://dev.apollodata.com/react/queries.html#graphql-options
      options: (props) => {
        let { itemKey:key } = props;

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

        if (!loading && !item) {
          console.warn('Invalid item: ' + JSON.stringify(ownProps.key));
        }

        return {
          errors,
          loading,
          refetch,
          item
        };
      }
    });
  }

  /**
   * List query.
   *
   * @param query
   * @param path
   */
  static searchQuery(query, path='search') {
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
}
