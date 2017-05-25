//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-client';

import { DatabaseUtil, TestData } from 'alien-core/testing';
import { SchemaUtil } from 'alien-api/testing';
import { createFragmentMatcher } from 'alien-client';
import { LocalNetworkInterface } from 'alien-client/testing';

//
// End-to-end Apollo tests.
//

describe('End-to-end Apollo-GraphQL Resolver:', () => {

  const data = new TestData();

  let client;

  beforeAll(() => {
    // In-memory database.
    let database = DatabaseUtil.createDatabase();

    // Actual API resolvers.
    let schema = SchemaUtil.createSchema(database);

    // Apollo client with local network interface.
    client = new ApolloClient({
      networkInterface: new LocalNetworkInterface(schema, data.context),
      createFragmentMatcher: createFragmentMatcher(schema)
    });

    return DatabaseUtil.init(database, data.context, data.itemMap);
  });

  test('Viewer Query.', () => {
    client.resetStore();

    // Errors.
    // GraphQLError
    //   - Bad query.
    // Network error: Error: Schema must be an instance of GraphQLSchema.
    // Also ensure that there are not multiple versions of GraphQL installed in your node_modules directory.
    //   - Hoist graphql via lerna to the root package (lerna bootstrap --hoist graphql):
    //     - https://github.com/graphql/graphiql/issues/58

    const ViewerQuery = gql`query ViewerQuery { viewer { user { id, title } } }`;

    return client.query({
      query: ViewerQuery
    }).then(result => {
      expect(_.get(result, 'data.viewer.user.id')).toEqual(data.userId);
    });
  });

  // TODO(burdon): Query and mutations.
  test('Item Query.', () => {

  });
});
