//
// Copyright 2017 Alien Labs.
//

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
