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
    className:  PropTypes.string,
    filter:     PropTypes.object,                       // GQL filter.
    onSearch:   PropTypes.func.isRequired
  };

  handleSearch(text) {
    let filter = {
      text
    };

    this.props.onSearch(filter);
  }

  render() {
    let { className, filter={} } = this.props;

    return (
      <div className={ DomUtil.className('ux-search-panel', 'ux-panel', className) }>
        <SearchBar className="ux-grow" value={ filter.text } onSearch={ this.handleSearch.bind(this) }/>
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
    text:       PropTypes.string,
    onSearch:   PropTypes.func.isRequired
  };

  reset() {
    this.value = '';
  }

  set value(value) {
    this.refs.textBox.value = value;
  }

  handleSearch(event) {
    this.props.onSearch(this.refs.textBox.value);
  }

  handleClear(event) {
    this.refs.textBox.value = '';
    this.refs.textBox.focus();
  }

  render() {
    let { text, className } = this.props;

    return (
      <div className={ DomUtil.className('ux-searchbar', 'ux-toolbar', className) }>
        <i className="ux-icon ux-icon-search" onClick={ this.handleSearch.bind(this) }/>

        <TextBox ref="textBox"
                 className='ux-grow'
                 autoFocus={ true }
                 placeholder='Search...'
                 value={ text }
                 onCancel={ this.handleClear.bind(this) }
                 onChange={ this.handleSearch.bind(this) }/>

        <i className="ux-icon ux-icon-clear" onClick={ this.handleClear.bind(this) }/>
      </div>
    );
  }
}
