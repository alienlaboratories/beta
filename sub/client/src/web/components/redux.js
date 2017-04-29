//
// Copyright 2017 Alien Labs.
//

import { connect } from 'react-redux';

/**
 * Preserve access to root component via getWrappedInstance (see react.js).
 */
export function connectWithRef(mapStateToProps, mapDispatchToProps) {
  return connect(mapStateToProps, mapDispatchToProps, null, { withRef: true });
}
