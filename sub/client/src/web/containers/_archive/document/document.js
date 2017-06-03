//
// Copyright 2017 Alien Labs.
//

import React from 'react';

//-------------------------------------------------------------------------------------------------
// Components.
//-------------------------------------------------------------------------------------------------

/**
 * Custom list column.
 */
export const DocumentColumn = (props, context) => {
  return (
    <a target="ALIEN_OPEN" href={ props.item.url }>
      <i className="ux-icon">open_in_new</i>
    </a>
  );
};
