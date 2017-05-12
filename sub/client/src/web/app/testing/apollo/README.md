# Apollo


#### PHONE JAMMER
#### OPERA BOXING
#### HEADPHONE


TODO(burdon): Ids (global/local)
TODO(burdon): Ids/items
TODO(burdon): Optimistic responses and reducers.

## Data Model

- The data model consists of Items that have fields that contain vectors of Item IDs (references).
- The server-side resolver converts these references into Item objects that are returned to the client.
- The Apollo client maintains a map of Items by ID.

### Mutations

- Mutations (Item upserts) are applied to Item instances on the client and server.
- Mutations return the mutated Items, which are resolved according to the mutation's query spec. 
  I.e., mutations return fully formed Items.
- By default, Apollo identifies objects based on two properties: The __typename and an ID field, either id or _id.
- This allows consistent local caching. 
  - This can be overridden by `dataIdFromObject`.
    - http://dev.apollodata.com/react/cache-updates.html#normalization
    - https://dev-blog.apollodata.com/the-concepts-of-graphql-bc68bd819be3
- NOTE: Only fields that are declared within the mutation's query spec are updated in the cache.    
- ISSUE: Expensive for the mutation to return the entire updated item (e.g., adding Task to Project with many Tasks).
  Return deltas? Or just item with IDs for 'tasks' field.

### Optimisic Responses

- The graphql mutation spec's mutate function takes an `optimisticResponse` parameter which predicts the entire
  server mutation result.
  - ISSUE: does this need to match the query spec of the mutation?
  
### Reducer

- Each graphql query spec defines a `reducer`, which is passed the previous query result and the mutation response.
- The reducer is called twice: once for the optimistic response, and again with the server's response.
- The reducer returns an `update` transformation which is applied to the previous result and patched into the cache.

- ISSUE: The Apollo framework automatically patches Items returned from mutation results into the cache?
