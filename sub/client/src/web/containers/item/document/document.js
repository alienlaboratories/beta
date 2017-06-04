//
// Copyright 2017 Minder Labs.
//

import React from 'react';

export const DocumentColumn = (props, context) => {
  let { item: { externalUrl } } = props;

  return (
    <a target="ALIEN_OPEN" href={ externalUrl }>
      <i className="ux-icon">open_in_new</i>
    </a>
  );
};