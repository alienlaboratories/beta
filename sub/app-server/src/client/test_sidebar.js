//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Logger } from 'alien-util';
import { AppDefs } from 'alien-client';

import { TestSidebarApp } from 'alien-client/crx/sidebar_test';

const logger = Logger.get('sidebar-test');

/**
// Test config.
 */
const config = _.defaultsDeep(window.config, {
  debug: true,
  app: {
    platform: AppDefs.PLATFORM.CRX
  }
});

//
// App instance.
//

const app = new TestSidebarApp(config);

const render = () => {
  const App = require('alien-client/crx/sidebar/root');
  app.render(App);
};

//
// React Hot Loader.
// https://github.com/gaearon/react-hot-boilerplate/pull/61
// https://webpack.github.io/docs/hot-module-replacement.html
//

if (module.hot && _.get(config, 'env') === 'hot') {
  module.hot.accept('alien-client/crx/sidebar/root', () => render());
}

//
// Start app.
//

app.init().then(root => {
  render();

  setupTestContext(document.body);
});

//
// Test context data.
// TODO(burdon): Factor out with CRX test page.
//

window.ITEMS = {
  t1: { type: 'Contact', title: 'Alice',          email: 'alice.braintree@gmail.com'  },
  t2: { type: 'Contact', title: 'Bob',            email: 'bob@example.com'            },
  t3: { type: 'Contact', title: 'Catherine',      email: 'catherine@example.com'      },
  t4: { type: 'Contact', title: 'David',          email: 'david@example.com'          },
  t5: { type: 'Contact', title: 'Emiko',          email: 'emiko@example.com'          },

  t6: { type: 'Contact', title: 'Rich',           email: 'rich.burdon@gmail.com'      },
  t7: { type: 'Contact', title: 'Lucas',          email: 'lucas.geiger@gmail.com'     },
  t8: { type: 'Contact', title: 'Rich (Alien)',   email: 'rich@alienlabs.io'          },

//t9: { title: 'slack_channel 1', context: [{ key: 'slack_channel', value: { string: 'XXX' }}] },
};

/**
 * Set-up test context.
 * @param root
 */
function setupTestContext(root) {
  let select = $('<select>').appendTo(root)
    .append($('<option>').text('<null context>'))
    .css('position', 'absolute')
    .css('bottom', 0)
    .change(event => {
      let item = window.ITEMS[$(event.target).val()];
      let context = null;
      if (item && item.context) {
        context = { context: item.context };
      } else if (item) {
        context = { items: [item] };
      }
      let action = {
        type: 'ALIEN_CONTEXT/UPDATE',
        context: context
      };

      window.alien.store.dispatch(action);
      logger.log(`window.alien.store.dispatch(${JSON.stringify(action)})`);
    });

  _.each(window.ITEMS, (value, key) => {
    $('<option>').appendTo(select).attr('value', key).text(value.title);
  });
}