//
// Copyright 2017 Alien Labs.
//

import { Logger, TypeUtil } from 'alien-util';

const logger = Logger.get('inspector');

/**
 * Registry of inspectors.
 */
export class InspectorRegistry {

  constructor() {
    this._inspectors = [];
  }

  add(inspector) {
    console.assert(inspector);
    this._inspectors.push(inspector);

    return this;
  }

  /**
   * Select and initialize inspectors.
   * @param callback
   * @returns {InspectorRegistry}
   */
  init(callback) {

    // TODO(burdon): Wait for load. Match URL and dynamically find root each time.
    setTimeout(() => {
      logger.log('Finding inspector...');
      _.each(this._inspectors, inspector => {
        if (inspector.shouldObservePage()) {
          logger.log('Inspector: ' + inspector.constructor.name);
          inspector.start(callback);
        }
      });
    }, 1000);  // TODO(burdon): Time to load page.

    return this;
  }

  update() {
    logger.log('Update...');
    _.each(this._inspectors, inspector => {
      if (inspector.shouldObservePage()) {
        logger.log('Inspector: ' + inspector.constructor.name);
        inspector.update();
      }
    });
  }
}

/**
 * Base class for DOM inspectors.
 *
 * TODO(burdon): Make declarative and load dynamic rules from server.
 */
export class Inspector {

  constructor() {
    this._callback = null;

    // DOM mutation observer.
    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    this._observer = new MutationObserver(mutations => {
      let context = this.getContext();

      _.each(mutations, mutation => {
        TypeUtil.deepMerge(context, this.getItems(context, mutation.target));
      });

      if (this._callback) {
        this._callback(context);
      }
    });
  }

  /**
   * Being listening for DOM changes.
   * @param {Function.<{context}>} callback
   */
  start(callback) {
    console.assert(callback);
    this._callback = callback;

    let rootNode = this.getRootNode();
    this._observer.observe(rootNode, {
      subtree: true,
      childList: true
    });

    this.update();
  }

  update() {
    let rootNode = this.getRootNode();
    let context = this.getContext();

    TypeUtil.deepMerge(context, this.getItems(context, rootNode));

    this._callback(context);
  }

  stop() {
    this._observer.disconnect();
    this._callback = null;
  }

  /**
   * @return {boolean} Returns true if this inspector should start observers for the current page.
   *
   * Note that this is only called once, but in dynamic web apps, window.location.href can change
   * without reloading the page. Observers are responsible for handling that.
   */
  shouldObservePage() {
    return false;
  }

  /**
   * @return the CSS selector for the root of mutation changes.
   */
  getRootNode() {
    return $('body')[0];
  }

  /**
   * Gets the initial page context.
   * @returns {{}}
   */
  getContext() {
    return {};
  }

  /**
   * Process updates to the given DOM node.
   * @param context
   * @param node
   * @return {[{Item}]} Context object.
   */
  getItems(context, node) {
    return null;
  }
}
