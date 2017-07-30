//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { QueryRegistry } from 'alien-core';

/**
 * Wraps Component adding subscriptions.
 * The component must expose a graphql options.props.refetch() method.
 *
 * HOC: https://facebook.github.io/react/docs/higher-order-components.html
 */
export const SubscriptionWrapper = (Component) => {

  // TODO(burdon): Subscriptions?
  // addGraphQLSubscriptions(networkInterface, wsClient) SubscriptionNetworkInterface
  // http://dev.apollodata.com/react/subscriptions.html
  // https://github.com/apollographql/graphql-subscriptions
  // https://dev-blog.apollodata.com/a-proposal-for-graphql-subscriptions-1d89b1934c18#.23j01b1a4

  // TODO(burdon): Move out of core.
  return class extends React.Component {

    static defaultProps = {
      cid: QueryRegistry.createId()
    };

    static contextTypes = {
      queryRegistry: PropTypes.object.isRequired
    };

    componentWillMount() {
      let { cid, refetch } = this.props;
      this.context.queryRegistry.registerQuery(cid, refetch);
    }

    componentWillUnmount() {
      let { cid } = this.props;
      this.context.queryRegistry.unregisterQuery(cid);
    }

    render() {
      return <Component { ...this.props }/>;
    }
  };
};
