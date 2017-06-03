//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { Const, ID } from 'alien-core';

import { Path } from '../../common/path';
import { AppDefs } from '../../../common/defs';

import { DebugPanel } from '../../components/debug';
import { NavBar } from '../../components/navbar';
import { StatusBar } from '../../components/statusbar';
import { Sidebar, SidebarToggle } from '../../components/sidebar';

import { SearchPanelContainer } from '../search/search_panel';

import './layout.less';

/**
 * Main column layout.
 */
export class Layout extends React.Component {

  static WebNavbar = ({ navigator, children }) => (
    <NavBar navigator={ navigator }>
      <div className="ux-web-search-panel">
        <SearchPanelContainer/>
      </div>

      <div className="ux-grow">
        { children }
      </div>
    </NavBar>
  );

  static MobileNavbar = () => (
    <NavBar>
      <SearchPanelContainer className="ux-grow"/>
    </NavBar>
  );

  // TODO(burdon): Use classes directly.
  static navbar(platform, navigator) {
    switch (platform) {
      case Const.PLATFORM.WEB: {
        return (
          <Layout.WebNavbar navigator={ navigator }/>
        );
      }

      case Const.PLATFORM.CRX:
      case Const.PLATFORM.MOBILE:
      default: {
        return (
          <Layout.MobileNavbar/>
        );
      }
    }
  }

  static propTypes = {
    config:         PropTypes.object.isRequired,
    debug:          PropTypes.object.isRequired,
    viewer:         PropTypes.object.isRequired,
    eventListener:  PropTypes.object.isRequired,
    actions:        PropTypes.object.isRequired,
    navbar:         PropTypes.object,
    sidebar:        PropTypes.object
  };

  render() {
    let { config, debug, viewer, eventListener, actions, navbar, sidebar, children } = this.props;

    let title = AppDefs.APP_NAME;
    let version = _.get(config, 'app.version');

    let debugPanel = debug.showPanel && <DebugPanel/>;

    return (
      <div className="ux-fullscreen ux-layout ux-column">

        {/*
          * Header
          */}
        <header className="ux-column">
          <div className="ux-row ux-grow">
            { sidebar &&
            <SidebarToggle sidebar={ () => this.refs.sidebar }/>
            }

            <div className="ux-grow">
              <h1>{ title }</h1>
            </div>

            <Links viewer={ viewer }/>
          </div>

          { navbar }
        </header>

        {/*
          * Main
          * TODO(burdon): Option for sidebar to shove over display (e.g., like Inbox, mobile, etc.)
          */}
        <main className="ux-row">
          { sidebar &&
          <Sidebar ref="sidebar">
            { sidebar }
          </Sidebar>
          }

          { children }
        </main>

        {/* Debug */}
        <div>
          { debugPanel }
        </div>

        {/*
          * Footer
          */}
        <footer>
          <StatusBar eventListener={ eventListener } actions={ actions }>
            <span className="ux-font-xsmall ux-text-noselect">{ version }</span>
          </StatusBar>
        </footer>

      </div>
    );
  }
}

/**
 * Header links.
 */
class Links extends React.Component {

  static propTypes = {
    viewer: PropTypes.object.isRequired,
  };

  render() {
    let { viewer } = this.props;

    let links = _.compact(_.map(viewer.groups, group => {
      // Don't show private group.
      if (group.bucket !== viewer.user.id) {
        return (
          <li key={ group.id }>
            <Link to={ Path.canvas(ID.key(group)) }>{ group.title }</Link>
          </li>
        );
      }
    }));

    return (
      <ul className="ux-inline">
        { links }

        <li>
          <a target="ALIEN_PROFILE" href="/profile">{ _.get(viewer, 'user.title') }</a>
        </li>
        <li>
          <a href="/user/logout">Logout</a>
        </li>
      </ul>
    );
  }
}