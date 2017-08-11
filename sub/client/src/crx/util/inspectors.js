//
// Copyright 2017 Alien Labs.
//

import { ID } from 'alien-core';

import { Inspector } from './inspector';

/**
 * Test inspector.
 */
export class TestInspector extends Inspector {

  static PATH = '/testing/crx';

  shouldObservePage() {
    return document.location.pathname.startsWith(TestInspector.PATH);
  }

  getRootNode() {
    return $('#content')[0];
  }

  /*
   * <div id="content">
   *   <div email="__EMAIL__">__NAME__</div>
   */
  getItems(context, node) {
    let root = $(node).find('> div');
    if (root[0]) {
      let name = root.text();
      let email = root.attr('email');
      let thumbnailUrl = root.find('img').attr('src');

      if (name && email) {
        return {
          items: [{
            type: 'Contact',
            title: name,
            meta: {
              thumbnailUrl
            },
            email
          }]
        };
      }
    }
  }
}

/**
 * Gmail
 */
export class GmailInspector extends Inspector {

  static PATH = 'https://mail.google.com';

  shouldObservePage() {
    return document.location.href.startsWith(GmailInspector.PATH);
  }

  getRootNode() {
    return $('div[role="main"]')[0];
  }

  /*
   * <div role="main">
   *   <table role="presentation">
   *     <div role="list">
   *       <div role="listitem">
   *         <h3 class="iw">
   *           <span email="__EMAIL__" name="__NAME__">__NAME__</span>
   */
  getItems(context, node) {
    // TODO(burdon): Get closest parent for thread ID.
    let root = $(node).find('div[role="listitem"] h3 span');
    if (root[0]) {
      let name = root.text();
      let email = root.attr('email');
      if (name && email) {
        return {
          items: [{
            type: 'Contact',
            title: name,
            email: email
          }]
        };
      }
    }
  }
}

/**
 * Google Inbox inspector.
 */
export class GoogleInboxInspector extends Inspector {

  static PATH = 'https://inbox.google.com';

  shouldObservePage() {
    return document.location.href.startsWith(GoogleInboxInspector.PATH);
  }

  getRootNode() {
    // TODO(burdon): Document where this is and how stable it is.
    return $('.yDSKFc')[0];
  }

  /*
   * <div role="list" data-item-id="#gmail:thread-f:1557184509751026059">
   *   <div role="listitem" data-msg-id="#msg-f:1557184509751026059">
   *     ...
   *     <div>
   *       ...
   *       <div>
   *         <img email="__EMAIL__" src="__THUMBNAILURL__">  [40x40]
   *
   *       <div role="heading">
   *         ...
   *           <div email="__EMAIL__">__NAME__</div>
   */
  getItems(context, node) {
    let listItems = $(node).find('div[role=list] div[role=listitem][data-msg-id]');
    if (listItems.length) {
      let emails = new Set();
      let items = _.compact(_.map(listItems, listItem => {
        let header = $(listItem).find('div[role=heading] div[email]:first');
        let email = header.attr('email');

        // De-dupe.
        if (!emails.has(email)) {
          emails.add(email);

          let title = header.text();

          // TODO(burdon): First time opening a thread, the img.src is invalid.
          let img = $(listItem).find('img[email]:first');
          let thumbnailUrl = $(img).attr('src');
          if (thumbnailUrl && thumbnailUrl.startsWith('//')) {
            thumbnailUrl = 'https:' + thumbnailUrl;
          }

          return {
            type: 'Contact',
            title,
            meta: {
              thumbnailUrl
            },
            email
          };
        }
      }));

      return { items };
    }
  }
}

/**
 * Slack Inspector.
 */
export class SlackInspector extends Inspector {

  // eslint-disable-next-line no-useless-escape
  static PATH_RE = /https:\/\/([^\.]+)\.slack\.com\/messages\/([^\/]+)\//;

  shouldObservePage() {
    return document.location.href.match(SlackInspector.PATH_RE);
  }

  getRootNode() {
    return $('#client_header')[0];
  }

  getItems(context, node) {
    let match = document.location.href.match(SlackInspector.PATH_RE);
    if (match && match.length === 3) {
      return {
        meta: [
          {
            key: 'slack_team',
            value: {
              string: match[1]
            }
          },
          {
            key: 'slack_channel',
            value: {
              string: match[2]
            }
          }
        ]
      };
    }
  }
}

/**
 * LinkedIn Inspector.
 *
 * <section class="pv-profile-section pv-top-card-section">
 *   <img class="pv-top-card-section__image"/>
 *   <div class="mt3">
 *     <h1>Name</h1>
 */
export class LinkedInInspector extends Inspector {

  static DOMAIN = 'linkedin.com';

  static PATH = 'https://www.linkedin.com';

  // linkedin.com/in/xxxx
  // eslint-disable-next-line no-useless-escape
  static PATH_RE = /\/in\/([^\/]*)/;

  shouldObservePage() {
    return document.location.href.startsWith(LinkedInInspector.PATH);
  }

  getItems(context, node) {
    let root = $(node).find('section.pv-profile-section.pv-top-card-section');
    if (root.length) {
      let match = document.location.href.match(LinkedInInspector.PATH_RE);
      if (match && match.length === 2) {
        let id = match[1];
        let title = $(root).find('.mt3 h1').text();
        let thumbnailUrl = $(root).find('img.pv-top-card-section__image').attr('src');

        return {
          items: [
            {
              type: 'Contact',
              title,
              meta: {
                thumbnailUrl
              },
              fkeys: [
                // TODO(burdon): Must have FK to math.
                ID.sanitizeKey(LinkedInInspector.DOMAIN) + '/' + id
              ]
            }
          ]
        };
      }
    }
  }
}
