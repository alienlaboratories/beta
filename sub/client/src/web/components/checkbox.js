//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { DomUtil } from 'alien-util';

/**
 * <Checkbox value="" label=""/>
 */
export const Checkbox = (props) => {
  let { className, value, label } = props;

  // TODO(burdon): Internalize state.

  let input = <input className={ DomUtil.className('ux-checkbox', className) } value={ value }/>;

  if (label) {
    input = <label>{ input } { label }</label>;
  }

  return label;
};
