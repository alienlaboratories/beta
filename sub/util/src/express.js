//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import moment from 'moment';

import { TypeUtil } from './type';

/**
 * Node express utils.
 * NOTE: No sever deps.
 *
 * https://github.com/helpers/handlebars-helpers
 */
export class ExpressUtil {

  static Helpers = {

    /**
     * Inject content from other template.
     * @param name
     * @param options
     */
    section: function(name, options) {
      // Map of sections.
      if (!this.sections) {
        this.sections = {};
      }

      this.sections[name] = options.fn(this);
    },

    /**
     * Encode URI.
     * @param {string} value
     * @return {string}
     */
    encodeURI: function(value) {
      return encodeURIComponent(value);
    },

    /**
     * Format JSON object.
     * @param {object} object
     * @param {number} indent
     * @return {string}
     */
    json: function(object, indent=0) {
      return JSON.stringify(object, null, indent);
    },

    /**
     * Abridged JSON (e.g., arrays => length only).
     * @param {object} object
     * @param {number} indent
     * @return {string}
     */
    jsonShort: function(object, indent=2) {
      return TypeUtil.stringify(object, indent);
    },

    /**
     * Short (possibly truncated) string.
     * @param {value} value
     * @return {string}
     */
    short: function(value) {
      return TypeUtil.truncate(value, 24);
    },

    /**
     * Human readable string.
     * @param value
     * @return {string}
     */
    time: function(value) {
      return value && moment.unix(value).fromNow();
    }
  };

  /**
   * Return object representing routes.
   * @return [{ root, path }]
   */
  static stack(app) {
    function comp(a, b) {
      if (a.root && b.root) {
        return a.root > b.root;
      }

      if (a.path && b.path) {
        return a.path > b.path;
      }

      return (a.path && !b.path) ? -1 : 1;
    }

    function getStack(item) {
      let { path, route, regexp, handle } = item;
      if (handle.stack) {
        let paths = Array.sort(_.compact(_.map(handle.stack, stack => getStack(stack))), comp);
        if (!_.isEmpty(paths)) {
          return {
            root: regexp.source,
            paths
          };
        }
      } else if (!_.isEmpty(path)) {
        return { path: path.source || path };
      } else if (route) {
        return { path: route.path.source || route.path };
      }
    }

    return Array.sort(_.compact(_.map(app._router.stack, item => getStack(item))), comp);
  }
}
