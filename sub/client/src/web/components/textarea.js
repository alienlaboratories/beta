//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil } from 'alien-util';

/**
 * Textarea.
 */
export class TextArea extends React.Component {

  static propTypes = {
    className:      PropTypes.string,
    onBlur:         PropTypes.func,
    onChange:       PropTypes.func,
    placeholder:    PropTypes.string,
    value:          PropTypes.string,
    rows:           PropTypes.number
  };

  static defaultProps = {
    rows:           4
  };

  constructor() {
    super(...arguments);

    this.state = {
      value: this.props.value
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value) {
      this.setState({
        value: nextProps.value
      });
    }
  }

  get value() {
    return this.state.value;
  }

  set value(value) {
    this.setState({
      value: value
    });
  }

  handleBlur(event) {
    this.props.onBlur && this.props.onBlur(this.state.value, this.state.initialValue);
  }

  handleTextChange(event) {
    this.setState({
      value: event.target.value
    }, () => {
      this.props.onChange && this.props.onChange(this.state.value);
    });
  }

  render() {
    let { rows, className, placeholder } = this.props;
    let { value } = this.state;

    return (
      <textarea className={ DomUtil.className('ux-textarea', className) }
                placeholder={ placeholder }
                spellCheck={ false }
                rows={ rows }
                value={ value || '' }
                onBlur={ this.handleBlur.bind(this) }
                onChange={ this.handleTextChange.bind(this) }/>
    );
  }
}
