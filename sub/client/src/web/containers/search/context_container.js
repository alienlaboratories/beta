//
// Copyright 2017 Alien Labs.
//

import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { BatchMutationName, Const } from 'alien-core';
import { Fragments } from 'alien-api';

import { ReduxUtil } from '../../util/redux';
import { AppAction } from '../../common/reducers';
import { ContextAction, ContextManager } from '../../common/context';

//-------------------------------------------------------------------------------------------------
// Context HOC.
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Merge with main query?
// TODO(burdon): Broaden fragments, or lazily load them.

export const ContextQuery = gql`
  query ContextQuery($filter: FilterInput) {
    context: search(filter: $filter) {
      items {
        ...ItemFragment

        # TODO(burdon): Required for match.
        ...ContactFragment
      }
    }
  }

  ${Fragments.ItemFragment}
  ${Fragments.ContactFragment}
`;

export function ContextContainer(query, path='context') {
  console.assert(query && path);

  return compose(

    ReduxUtil.connect({
      mapStateToProps: (state, ownProps) => {
        let { injector, config, userProfile } = AppAction.getState(state);

        let contextFilter;
        let contextManager;
        let itemInjector;
        let platform = _.get(config, 'app.platform');
        if (platform === Const.PLATFORM.CRX) {
          let contextState = ContextAction.getState(state);
          contextManager = injector.get(ContextManager).updateContext(userProfile, contextState);
          contextFilter = contextManager.getFilter() || {};
          itemInjector = (items) => contextManager.injectItems(items);
        }

        return {
          contextManager,
          contextFilter,
          itemInjector
        };
      }
    }),

    graphql(query, {
      withRef: true,

      options: (props) => {
        let { contextFilter } = props;

        return {
          variables: {
            filter: contextFilter
          },

          /**
           * Transform the current result on mutation
           * (e.g., replace local namespace context items with the permanent item).
           *
           * http://dev.apollodata.com/react/cache-updates.html#resultReducers
           */
          // TODO(burdon): Deprecated.
          reducer: (previousResult, action, variables) => {
            if (action.type === 'APOLLO_MUTATION_RESULT' && action.operationName === BatchMutationName) {
              // TODO(burdon): Replace local item; Read item (fragment) from cache? Or transform existing?
            }

            return previousResult;
          }
        };
      },

      props: ({ ownProps, data }) => {
        let { contextManager } = ownProps;
        let search = _.get(data, path, {});
        let { items } = search;

        // TODO(burdon): Disable this HOC for non-CRX.
        // TODO(burdon): Currently contextManager caches items. Instead merge here.
        // TODO(burdon): Inject item getter property that encapsulates merging (so no logic in render).
        if (contextManager) {
          contextManager.updateContextItems(items);
        }

        return {
          contextItems: items
        };
      }
    })
  );
}
