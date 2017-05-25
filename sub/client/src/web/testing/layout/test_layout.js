//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import { DomUtil } from 'alien-util';

import './test_layout.less';

// TODO(burdon): Factor out test data. JSON file.
const ITEMS = [
  {
    id: 'I-1',
    type: 'Event',
    title: 'Lunch',
    location: {
      title: 'Epistrophy, NY 10013',
      mapImgUrl: '/layout/img/staticmap.png'
    },
    participants: [
      {
        id: 'C-1',
        title: 'Alice',
        imgUrl: '/layout/img/people/p1.png'
      },
      {
        id: 'C-2',
        title: 'Rich',
        imgUrl: '/layout/img/people/p2.png'
      }
    ]
  },
  {
    id: 'I-2',
    type: 'Contact',
    title: 'Alice',
    description: 'VP Product',
    avatarUrl: '/layout/img/people/p1.png',
    messages: [
      {
        id: 'M-1',
        title: 'Meeting on Thurs...'
      },
      {
        id: 'M-2',
        title: 'Getting mocks from Prod.'
      }
    ],
    tasks: [
      {
        id: 'T-2',
        title: 'UX mocks for review.'
      }
    ]
  },
  {
    id: 'I-3',
    type: 'Project',
    title: 'Test Project',
    description: 'UX Rebuild with strict CSS.',
    tasks: [
      {
        id: 'T-1',
        title: 'New CSS rules.'
      },
      {
        id: 'T-2',
        title: 'Top-level containers only (rebuild).'
      },
      {
        id: 'T-3',
        title: 'Apollo end-to-end tests.'
      }
    ]
  },
  {
    id: 'I-4',
    type: 'Contact',
    title: 'Aleksey',
    description: 'Director Engineering',
    messages: [
      {
        id: 'M-1',
        title: 'Eng candidate resumes.'
      },
      {
        id: 'M-2',
        title: 'Recruiting offers.'
      },
      {
        id: 'M-3',
        title: 'Spec starter project.'
      }
    ],
    tasks: [
      {
        id: 'T-2',
        title: 'St Petersburg trip.'
      }
    ]
  }
];

// Router Root (Activty)
class Root extends React.Component {
  render() {
    let items = ITEMS;
    return (
      <Layout>
        <div className="tx-row tx-grow">
          <div className="tx-scroll-container tx-column tx-panel-dark">
            <CardDeck items={ items }/>
          </div>
          <div className="tx-grow tx-panel-blank"/>
        </div>
      </Layout>
    );
  }
}

class Layout extends React.Component {
  render() {
    let { children } = this.props;
    return (
      <div className="tx-layout tx-fullscreen tx-column">
        <div className="tx-header">
          <h1>Header</h1>
        </div>
        <div className="tx-body">
          { children }
        </div>
        <div className="tx-header">
          <span>Footer</span>
        </div>
      </div>
    );
  }
}

class CardDeck extends React.Component {
  render() {
    let { items } = this.props;
    return (
      <div className="tx-card-deck __tx-card-deck-floating">
        {
          _.map(items, item => (
            <Card key={ item.id } item={ item }/>
          ))
        }
      </div>
    );
  }
}

class Card extends React.Component {

  state = {
    selected: ['I-1'],
    closed: {}
  };

  render() {
    let { item } = this.props;

    let selected = _.indexOf(this.state.selected, item.id) !== -1;

    // TODO(burdon): Factor out section container from content.
    const Section = (props) => {
      let { id, items, title, icon, open=true } = props;
      if (_.isEmpty(items)) {
        return <br/>; // Empty.
      }

      let closed = this.state.closed[id];
      if (closed === undefined) {
        closed = !open;
      }

      let onClick = () => {
        this.setState({
          closed: _.assign(this.state.closed, {
            [id]: !closed
          })
        });
      };

      return (
        <div className="tx-card-section">
          <div className="tx-card-section-header">
            <h2 onClick={ onClick }>{ title }</h2>
            <i className={ DomUtil.className('tx-icon', 'tx-icon-toggle', !closed && 'tx-open') } onClick={ onClick }/>
          </div>
          { !closed &&
          <div className="tx-body">
            <div className="tx-list">
              { _.map(items, item =>
              <div key={ item.id } className="tx-list-item tx-row">
                <i className="tx-icon">{ icon }</i>
                <span>{ item.title }</span>
              </div>
              ) }
            </div>
          </div>
          }
        </div>
      );
    };

    const Img = (props) => {
      let { url, className } = props;
      return (
        <div className={ DomUtil.className('tx-image', className) } style={{ backgroundImage: `url(${url})` }}/>
      );
    };

    const Participants = (props) => {
      let { items } = props;
      return (
        <div className="tx-row">
          { _.map(items, item =>
          <Img key={ item.id } className="tx-item-avatar" url={ item.imgUrl }/>
          ) }
        </div>
      );
    };

    return (
      <div className="tx-card">
        <div className="tx-header">
          <div className="tx-toolbar">
            <i className={ DomUtil.className('tx-icon', 'tx-icon-pin', selected && 'tx-selected') }/>
            <h1 className="tx-grow">{ item.title }</h1>
            <i className="tx-icon tx-icon-menu"/>
          </div>
        </div>
        <div className="tx-body">
          { item.description &&
          <div className="tx-card-section tx-padding">
            <div className="tx-row">
              <div className="tx-grow">{ item.description }</div>
              { item.avatarUrl &&
              <Img className="tx-item-avatar" url={ item.avatarUrl }/>
              }
            </div>
          </div>
          }

          { item.location &&
          <div className="tx-card-section">
            <Img className="tx-item-map" url={ item.location.mapImgUrl }/>
            <div className="tx-padding">
              { item.location.title }
            </div>

            { !_.isEmpty(item.participants) &&
            <Participants items={ item.participants }/>
            }
          </div>
          }

          { !_.isEmpty(item.participants) &&
          <Section id="participants" items={ item.participants } title="Participants" icon="person_pin" open={ false }/>
          }

          <Section id="messages" items={ item.messages } title="Messages" icon="mail"/>
          <Section id="tasks" items={ item.tasks } title="Tasks" icon="check_box_outline_blank"/>
        </div>
        <div className="tx-footer">
          <span>Modified 02:00pm</span>
        </div>
      </div>
    );
  }
}

// TODO(burdon): XMR.
ReactDOM.render(<Root/>, document.getElementById('app-root'));
