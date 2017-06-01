//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil } from 'alien-util';

import { TextBox } from './textbox';

import './search.less';

/**
 * Search panel includes search bar and other controls.
 */
export class SearchPanel extends React.Component {

  static propTypes = {
    search: PropTypes.object,
    onSearch: PropTypes.func.isRequired
  };

  handleSearch(text) {
    this.props.onSearch(text);
  }

  render() {
    let { search={} } = this.props;

    return (
      <div className="ux-search-panel ux-panel">
        <SearchBar className="ux-grow" value={ search.text } onSearch={ this.handleSearch.bind(this) }/>
      </div>
    );
  }
}

/**
 * Search bar.
 */
export class SearchBar extends React.Component {

  static propTypes = {
    className:  PropTypes.string,
    onSearch:   PropTypes.func.isRequired,
    value:      PropTypes.string
  };

  reset() {
    this.value = '';
  }

  set value(value) {
    this.refs.text.value = value;
  }

  handleSearch(event) {
    this.props.onSearch(this.refs.text.value);
  }

  handleClear(event) {
    this.refs.text.value = '';
    this.refs.text.focus();
  }

  render() {
    let { value, className } = this.props;

    return (
      <div className={ DomUtil.className('ux-searchbar', 'ux-toolbar', className) }>
        <TextBox ref="text"
                 className='ux-grow'
                 autoFocus={ true }
                 placeholder='Search...'
                 value={ value }
                 onCancel={ this.handleClear.bind(this) }
                 onChange={ this.handleSearch.bind(this) }/>

        <i className="ux-icon ux-icon-search" onClick={ this.handleSearch.bind(this) }/>
        <i className="ux-icon ux-icon-clear" onClick={ this.handleClear.bind(this) }/>
      </div>
    );
  }
}
