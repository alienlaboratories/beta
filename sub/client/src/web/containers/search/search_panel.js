//
// Copyright 2017 Alien Labs.
//

import { connect } from 'react-redux';

import { AppAction } from '../../common/reducers';
import { SearchPanel } from '../../components/search';

// TODO(burdon): AppState should contain filter (not text).

const mapStateToProps = (state, ownProps) => {
  let { search } = AppAction.getState(state);

  return {
    search
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSearch: (text) => {
      dispatch(AppAction.search(text));
    }
  };
};

/**
 * Search controls.
 */
export const SearchPanelContainer = connect(mapStateToProps, mapDispatchToProps)(SearchPanel);
