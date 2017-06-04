//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';
import React from 'react';

import { Fragments } from 'alien-api';

import { Card } from '../../../components/card';

import { QueryItem } from '../item_container';

/**
 * Contact card.
 */
export class ContactCard extends React.Component {

  render() {
    let { item:contact={} } = this.props;
    let { email } = contact;

    return (
      <Card item={ contact }>
        <div className="ux-card-section">
          <div className="ux-card-padding">{ email }</div>
        </div>
      </Card>
    );
  }
}

const ContactItemQuery = gql`
  query ContactItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...ContactFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.ContactFragment}  
`;

export const ContactCardContainer = QueryItem(ContactItemQuery)(ContactCard);
