//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { Const, IdGenerator, QueryParser } from 'alien-core';
import { Fragments } from 'alien-api';

import { ReactUtil } from '../util/react';
import { SubscriptionWrapper } from '../util/subscriptions';

import { AppAction, ContextAction } from '../common/reducers';
import { ContextManager } from '../common/context';

import { Card } from '../components/card';

import { Connector } from './connector';
import { BasicSearchList, CardSearchList, BasicListItemRenderer } from './lists';

import './finder.less';

/**
 * Finder.
 */
class Finder extends React.Component {

  static contextTypes = {
    typeRegistry: PropTypes.object.isRequired,
    navigator: PropTypes.object.isRequired,
    mutator: PropTypes.object.isRequired
  };

  static propTypes = {
    viewer: PropTypes.object.isRequired
  };

  handleItemSelect(item) {
    this.context.navigator.pushCanvas(item);
  }

  handleItemUpdate(item, mutations) {
    this.context.mutator.batch(item.bucket).updateItem(item, mutations).commit();
  }

  render() {
    return ReactUtil.render(this, () => {
      let { typeRegistry } = this.context;
      let { contextManager, filter, listType } = this.props;

      let debug = false && (
        <div className="ux-debug ux-font-xsmall">{ JSON.stringify(filter) }</div>
      );

      // Inject items into list (via reducer) if the context manager is present.
      let itemInjector;
      if (contextManager) {
        itemInjector = (items) => contextManager.injectItems(items);
      }

      let list;
      switch (listType) {
        case 'card':
          list = <CardSearchList filter={ _.defaults(filter, { groupBy: true }) }
                                 itemInjector={ itemInjector }
                                 highlight={ false }
                                 className="ux-card-list"
                                 itemRenderer={ Card.ItemRenderer(typeRegistry) }
                                 onItemUpdate={ this.handleItemUpdate.bind(this) }/>;
          break;

        case 'list':
        default:
          list = <BasicSearchList filter={ filter }
                                  itemRenderer={ BasicListItemRenderer(typeRegistry) }
                                  onItemSelect={ this.handleItemSelect.bind(this) }
                                  onItemUpdate={ this.handleItemUpdate.bind(this) }/>;
      }

      return (
        <div className="app-finder ux-column">
          { list }
          { debug }
        </div>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

const FoldersQuery = gql`
  query FoldersQuery {
    viewer {
      folders {
        type
        id
        alias
        filter
      }
    }
  }
`;

// TODO(burdon): Same fragments as search. Defer loading of other types.
const ContextQuery = gql`
  query ContextQuery($filter: FilterInput!) {
    contextSearch: search(filter: $filter) {
      items {
        ...ItemFragment
      }
    }
  }

  ${Fragments.ItemFragment}
`;

const mapStateToProps = (state, ownProps) => {
  let { injector, config, userProfile, search } = AppAction.getState(state);

  // Required by Mutator.
  let idGenerator = injector.get(IdGenerator);

  // TODO(burdon): Move to layout config.
  let platform = _.get(config, 'app.platform');
  let listType = (platform === Const.PLATFORM.CRX) ? 'card' : 'list';

  // Construct filter (from sidebar context or searchbar).
  let queryParser = injector.get(QueryParser);
  let filter = queryParser.parse(search.text);

  // CRX app context.
  let contextManager = null;
  // TODO(burdon): Not just CRX.
  if (platform === Const.PLATFORM.CRX) {

    // Current user context (e.g., host inspector transient items).
    // TODO(burdon): Binds to context action; should trigger context to requery.
    let contextState = ContextAction.getState(state);
    contextManager = injector.get(ContextManager).updateContext(userProfile, contextState);
  }

  return {
    contextManager,
    idGenerator,
    listType,
    filter,
    search,
  };
};

export default compose(

  // Redux.
  connect(mapStateToProps),

  // Query.
  graphql(FoldersQuery, {

    props: ({ ownProps, data }) => {
      let { errors, loading, search } = data;
      let { filter } = ownProps;

      // Create list filter (if not overridden by text search above).
      if (search && QueryParser.isEmpty(filter)) {
        _.each(search.folders, folder => {
          if (folder.alias === ownProps.folder) {
            filter = JSON.parse(folder.filter);
            return false;
          }
        });
      }

      return {
        errors,
        loading,
        filter
      };
    }
  }),

  // Query.
  Connector.connect(graphql(ContextQuery, {

    options: (props) => {
      let { contextManager } = props;

      // Lookup items from context.
      let filter = {};
      if (contextManager) {
        filter = contextManager.getFilter() || {};
      }

      // TODO(burdon): Reducer.
      // const ContextListReducer = new ListReducer(ContextQuery, 'contextSearch.items');

      return {
        variables: {
          filter
        }
      };
    },

    props: ({ ownProps, data }) => {
      let { contextManager } = ownProps;
      let { contextSearch={} } = data;
      let { items } = contextSearch;

      // Update context.
      if (contextManager) {
        contextManager.updateContextItems(items);
      }

      return {
        items,

        // For subscriptions.
        refetch: () => {
          data.refetch();
        }
      };
    }
  }))

)(SubscriptionWrapper(Finder));
