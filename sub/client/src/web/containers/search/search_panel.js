//
// Copyright 2017 Alien Labs.
//

import { QueryParser } from 'alien-core';

import { ReduxUtil } from '../../util/redux';
import { AppAction } from '../../common/reducers';
import { SearchPanel } from '../../components/search';

/**
 * The search container bind the redux state (filter) to the serach controls.
 * The components are dumb (i.e., do not deal with the filter directly).
 */
export const SearchPanelContainer = ReduxUtil.connect({

  mapStateToProps: (state, ownProps) => {
    let { injector, search: { filter: { text } } } = AppAction.getState(state);

    let queryParser = injector.get(QueryParser);

    return {
      queryParser,
      text
    };
  },

  mergeProps: (stateProps, dispatchProps, ownProps) => {
    let { dispatch } = dispatchProps;
    let { queryParser } = stateProps;

    return _.merge({}, stateProps, ownProps, {

      /**
       * @param {string} text
       */
      onSearch: (text) => {
        let filter = queryParser.parse(text);
        dispatch(AppAction.search(filter));
      }
    });
  }

})(SearchPanel);
