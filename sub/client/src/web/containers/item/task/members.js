//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';
import { compose, graphql } from 'react-apollo';

import { Picker } from '../../../components/picker';

const MembersQuery = gql`
  query MembersQuery($key: KeyInput!) {
    group: item(key: $key) {
      ... on Group {
        members {
          type
          id
          title
        }
      }
    }
  }  
`;

export const MembersPicker = compose(

  // TODO(burdon): Internalize state.

  graphql(MembersQuery, {
    options: (props) => {
      let { groupId } = props;
      console.assert(groupId);

      return {
        variables: {
          key: { type: 'Group', id: groupId }
        }
      };
    },

    props: ({ ownProps, data }) => {
      let { errors, loading, group={} } = data;
      let { members:items } = group;

      return {
        errors,
        loading,
        items
      };
    }
  })

)(Picker);
