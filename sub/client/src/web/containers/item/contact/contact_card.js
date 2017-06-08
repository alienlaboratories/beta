//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import { MutationUtil } from 'alien-core';
import { Fragments } from 'alien-api';

import { ReactUtil } from '../../../util/react';
import { Card } from '../../../components/card';
import { Image } from '../../../components/image';
import { LabelPicker } from '../../../components/labels';

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

  handleLabelUpdate(label, add) {
    let { mutator, item:contact } = this.props;

    mutator
      .batch(contact.bucket)
      .updateItem(contact, [
        MutationUtil.createSetMutation('labels', 'string', label, add)
      ])
      .commit();
  }

  render() {
    return ReactUtil.render(this, () => {
      let { mutator, viewer, item:contact } = this.props;
      if (!contact) {
        return;
      }

      let { labels, meta, email, tasks } = contact;

      return (
        <Card mutator={ mutator } viewer={ viewer } item={ contact }>

          <Card.Section id="labels">
            <LabelPicker labels={ labels } onUpdate={ this.handleLabelUpdate.bind(this) }/>
          </Card.Section>

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

export const ContactCardContainer = QueryItem(ContactItemQuery)(ContactCard);
