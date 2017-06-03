//
// Copyright 2017 Alien Labs.
//

import { connect } from 'react-redux';

import { AppAction } from '../../common/reducers';
import { SearchPanel } from '../../components/search';

const mapStateToProps = (state, ownProps) => {
  let { search: { filter } } = AppAction.getState(state);

  return {
    filter
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSearch: (filter) => {
      dispatch(AppAction.search(filter));
    }
  };
};

/**
 * Search controls.
 */
export const SearchPanelContainer = connect(mapStateToProps, mapDispatchToProps)(SearchPanel);
