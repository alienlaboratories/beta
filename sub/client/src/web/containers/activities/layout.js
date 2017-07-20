//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { Const, ID } from 'alien-core';

import { Path } from '../../common/path';
import { AppDefs } from '../../../common/defs';
import { ReactUtil } from '../../util/react';

import { DebugPanel } from '../../components/debug';
import { NavBar, NavButtons } from '../../components/navbar';
import { StatusBar } from '../../components/statusbar';
import { Sidebar, SidebarToggle } from '../../components/sidebar';
import { SidePanel } from '../../components/sidepanel';

import { SearchPanelContainer } from '../search/search_panel';

import './layout.less';

/**
 * Split panel (for open/closed search panel).
 */
export class SplitPanel extends React.Component {

  render() {
    let { left, right } = this.props;

    return (
      <div className="ux-row ux-grow">
        { left &&
        <div className="ux-layout-side-panel">
          { left }
        </div>
        }

        <div className="ux-grow">
          { right }
        </div>
      </div>
    );
  }
}

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

  static propTypes = {
    config:         PropTypes.object.isRequired,
    debug:          PropTypes.object.isRequired,
    viewer:         PropTypes.object.isRequired,
    navigator:      PropTypes.object.isRequired,
    typeRegistry:   PropTypes.object.isRequired,
    eventListener:  PropTypes.object.isRequired,
    actions:        PropTypes.object.isRequired,
    nav:            PropTypes.bool,
    header:         PropTypes.object
  };

  static defaultProps = {
    nav: true
  };

  render() {
    return ReactUtil.render(this, () => {
      let {
        config, debug, viewer, navigator, typeRegistry, eventListener, actions, header, nav, children
      } = this.props;

      let title = AppDefs.APP_NAME;
      let version = _.get(config, 'app.version');
      let platform = _.get(config, 'app.platform');

      let links;
      let navbar;
      let debugPanel;

      switch (platform) {
        case Const.PLATFORM.WEB: {
          links = <Links viewer={ viewer }/>;
          navbar = nav && <Layout.WebNavbar navigator={ navigator }>{ header }</Layout.WebNavbar>;
          if (debug.showPanel) {
            debugPanel = <DebugPanel/>;
          }
          break;
        }

        default: {
          links = <NavButtons navigator={ navigator }/>;
          navbar = nav && <Layout.MobileNavbar/>;
          break;
        }
      }

      let sidebar = <SidePanel viewer={ viewer } navigator={ navigator } typeRegistry={ typeRegistry }/>;

      return (
        <div className="ux-fullscreen">
          <div className="ux-layout">

            {/*
              * Header
              */}
            <header className="ux-column">
              <div className="ux-row ux-grow">
                <SidebarToggle sidebar={ () => this.refs.sidebar }/>

                <div className="ux-grow">
                  <h1>{ title }</h1>
                </div>

                { links }
              </div>

              { navbar }
            </header>

            {/*
              * Main
              * TODO(burdon): Option for sidebar to shove over display (e.g., like Inbox, mobile, etc.)
              */}
            <main className="ux-row">
              <Sidebar ref="sidebar" autoClose={ true }>{ sidebar }</Sidebar>

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
        </div>
      );
    });
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