//
// Copyright 2017 Minder Labs.
//

import React from 'react';

import { DomUtil } from 'alien-util';

/**
 * <Image src=""/>
 */
export const Image = (props) => {
  let { src, className } = props;

  // TODO(burdon): Clip path (https://css-tricks.com/clipping-masking-css) (for avatar)
  // TODO(burdon): https://css-tricks.com/crop-top

  return src ?
    <div className={ DomUtil.className('ux-image', className) } style={{ backgroundImage: `url(${src})` }}/> : <div/>;
};
