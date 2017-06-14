//
// Copyright 2017 Alien Labs.
//

import React from 'react';

/**
 * React utils.
 */
export class ReactUtil {

  /**
   * React.Component render wrapper.
   * Returns empty <div> if loading; wraps errors.
   *
   * NOTE: Same-key warning is not caught here.
   *
   * @param obj Component instance.
   * @param {function} render Render function.
   * @param showLoading
   * @return {Element}
   */
  static render(obj, render, showLoading=true) {
    console.assert(obj && render);
    let { errors, loading } = obj.props;

    const blank = () => {
      if (showLoading) {
        return (
          <div className="ux-loading">
            <div><span/></div>
          </div>
        );
      } else {
        return <div/>;
      }
    };

    if (errors) {
      // Network errors are already logged.
      // Internal Apollo errors are swallowed.
      return (
        <div className="ux-error">{ obj.constructor.name + ': ' + String(errors) }</div>
      );
    } else if (loading) {
      // React components are rendered before and after requesting Apollo queries.
      return blank();
    } else {
      try {
        // Call the component's renderer.
        let dom = render(obj.props, obj.context);
        return dom || blank();
      } catch(error) {
        // TODO(burdon): Log if prod and show standard error.
        console.error(error);
        let message = error.message || 'Error rendering.';
        return (
          <div className="ux-error">{ obj.constructor.name + ': ' + message }</div>
        );
      }
    }
  }
}

/**
 * Redux and Apollo provide a withRef option to enable access to the contained component.
 * This cascades down through the connect() chain, so depending on how deeply nested the components are,
 * getWrappedInstance() needs to be called multiple times.
 *
 * @param container Higher-Order Component (Redux container).
 */
export function getWrappedInstance(container) {

  // https://github.com/apollostack/react-apollo/issues/118
  // http://dev.apollodata.com/react/higher-order-components.html#with-ref
  // https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options
  while (container.getWrappedInstance) {
    container = container.getWrappedInstance();
  }

  return container;
}
