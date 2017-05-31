//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import { DomUtil } from 'alien-util';

import { Image } from '../../components/image';

import Data from './data/data.json';

import './test_layout.less';

// Router Root (Activty)
class Root extends React.Component {
  render() {
    let { items } = Data;

    return (
      <div className="ux-fullscreen">
        <Layout>
          <div className="ux-row ux-grow">
            <div className="ux-scroll-container ux-column">
              <CardDeck items={ items }/>
            </div>

            <div className="ux-grow"/>
          </div>
        </Layout>
      </div>
    );
  }
}

class Layout extends React.Component {
  render() {
    let { children } = this.props;
    return (
      <div className="ux-column ux-grow">
        <header>
          <h1>Header</h1>
        </header>

        <main>
          { children }
        </main>

        <footer>
          <span>Footer</span>
        </footer>
      </div>
    );
  }
}

class CardDeck extends React.Component {
  render() {
    let { items } = this.props;
    return (
      <div className="ux-card-deck __ux-card-deck-floating">
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
        <div className="ux-card-section">
          <div className="ux-card-section-header">
            <h2 onClick={ onClick }>{ title }</h2>
            <i className={ DomUtil.className('ux-icon', 'ux-icon-toggle', !closed && 'ux-open') } onClick={ onClick }/>
          </div>
          { !closed &&
          <div className="ux-main">
            <div className="ux-list">
              { _.map(items, item =>
              <div key={ item.id } className="ux-list-item ux-row">
                <i className="ux-icon">{ icon }</i>
                <span>{ item.title }</span>
              </div>
              ) }
            </div>
          </div>
          }
        </div>
      );
    };

    const Participants = (props) => {
      let { items } = props;
      return (
        <div className="ux-row">
          { _.map(items, item =>
          <Image key={ item.id } className="ux-item-avatar" src={ item.imgUrl }/>
          ) }
        </div>
      );
    };

    return (
      <div className="ux-card">
        <div className="ux-header">
          <div className="ux-toolbar">
            <i className={ DomUtil.className('ux-icon', 'ux-icon-pin', selected && 'ux-selected') }/>
            <h1 className="ux-grow">{ item.title }</h1>
            <i className="ux-icon ux-icon-menu"/>
          </div>
        </div>
        <div className="ux-main">
          { item.description &&
          <div className="ux-card-section ux-padding">
            <div className="ux-row">
              <div className="ux-column ux-grow">
                <div>{ item.description }</div>
                <div className="ux-font-small">{ item.email }</div>
              </div>
              { item.avatarUrl &&
              <Image className="ux-item-avatar" src={ item.avatarUrl }/>
              }
            </div>
          </div>
          }

          { item.location &&
          <div className="ux-card-section">
            <Image className="ux-item-map" src={ item.location.mapImgUrl }/>
            <div className="ux-padding">
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
        <div className="ux-footer">
          <span>Modified 02:00pm</span>
        </div>
      </div>
    );
  }
}

// TODO(burdon): XMR.
ReactDOM.render(<Root/>, document.getElementById('app-root'));
