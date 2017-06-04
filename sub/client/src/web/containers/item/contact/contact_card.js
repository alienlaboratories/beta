//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';
import React from 'react';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../../../util/react';
import { Card } from '../../../components/card';
import { Image } from '../../../components/image';

import { QueryItem } from '../item_container';

import './contact.less';

/**
 * Contact card.
 */
export class ContactCard extends React.Component {

  render() {
    return ReactUtil.render(this, () => {
      let { item:contact } = this.props;
      if (!contact) {
        return;
      }

      let { meta, email } = contact;
      let { thumbnailUrl } = meta || {};

      return (
        <Card item={ contact }>

          <Card.Section id="contact" title="Contact">
            <div className="ux-row ux-grow ux-card-padding">
              <div className="ux-grow">{ email }</div>
              <Image className="ux-avatar" src={ thumbnailUrl }/>
            </div>
          </Card.Section>

        </Card>
      );
    });
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
