//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../../../util/react';
import { Card, CardCanvas } from '../../../components/card';
import { Image } from '../../../components/image';

import { QueryItem } from '../item_container';
import { TaskList } from '../task/task_list';

import './contact.less';

/**
 * Contact card.
 */
export class ContactCard extends React.Component {

  static propTypes = {
    mutator:    PropTypes.object.isRequired,
    viewer:     PropTypes.object.isRequired
  };

  render() {
    return ReactUtil.render(this, () => {
      let { mutator, viewer, item:contact, sections } = this.props;
      if (!contact) {
        return;
      }

      let { meta, email, tasks } = contact;

      return (
        <Card mutator={ mutator } viewer={ viewer } item={ contact } showLabels={ true } sections={ sections }>

          <Card.Section id="contact" title="Contact">
            <div className="ux-row ux-grow ux-card-padding">
              <div className="ux-grow">{ email }</div>
              <Image className="ux-avatar" src={ _.get(meta, 'thumbnailUrl') }/>
            </div>
          </Card.Section>

          <Card.Section id="tasks" title="Tasks">
            <TaskList mutator={ mutator } viewer={ viewer } parent={ contact } tasks={ tasks }/>
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

export const ContactCardContainer = QueryItem(ContactItemQuery)(CardCanvas(ContactCard));
