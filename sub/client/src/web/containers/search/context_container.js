//
// Copyright 2017 Alien Labs.
//

import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { Const } from 'alien-core';
import { Fragments } from 'alien-api';

import { ReduxUtil } from '../../util/redux';
import { AppAction } from '../../common/reducers';
import { ContextAction, ContextManager } from '../../common/context';

//-------------------------------------------------------------------------------------------------
// Context HOC.
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Broaden fragments, or lazily load them.

export const ContextQuery = gql`
  query ContextQuery($filter: FilterInput) {
    context: search(filter: $filter) {
      items {
        ...ItemFragment
      }
    }
  }

  ${Fragments.ItemFragment}
`;

export function ContextContainer(query, path='context') {
  console.assert(query && path);

  return compose(

    ReduxUtil.connect({
      mapStateToProps: (state, ownProps) => {
        let { injector, config, userProfile } = AppAction.getState(state);

        let contextFilter;
        let contextManager;
        let platform = _.get(config, 'app.platform');
        if (platform === Const.PLATFORM.CRX) {
          let contextState = ContextAction.getState(state);
          contextManager = injector.get(ContextManager).updateContext(userProfile, contextState);
          contextFilter = contextManager.getFilter() || {};
        }

        return {
          contextManager,
          contextFilter,
          itemInjector: (items) => contextManager.injectItems(items)
        };
      }
    }),

    graphql(query, {
      withRef: 'true',

      options: (props) => {
        let { contextFilter } = props;

        return {
          variables: {
            filter: contextFilter
          }
        };
      },

      props: ({ ownProps, data }) => {
        let { contextManager } = ownProps;
        let search = _.get(data, path, {});
        let { items } = search;

        // TODO(burdon): Currently contextManager caches items. Instead merge here.
        // TODO(burdon): Inject item getter property that encapsulates merging (so no logic in render).
        contextManager.updateContextItems(items);

        return {
          contextItems: items
        };
      }
    })
  );
}
