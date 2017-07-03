# Alien Beta

## Getting Started

### Development Tools

| ----------- | --------------------------------------------------------------------------- |
| `yarn`      | Node package manager (replaces `npm`)                                       |
| `lerna`     | Monorepo workspace manager (to be deprecated by `yarn`)                     |
| `webpack`   | Build JS assets                                                             |
| `jest`      | Client/server test framework (uses `jasmine`; replaces `mocha`, `karma`)    |
| `grunt`     | Misc. build tools.                                                          |


NOTE: `lerna` is deprecated; `yarn` may subsume capabilities:
  - https://github.com/lerna/lerna/issues/408
  - https://github.com/lerna/lerna/issues/884 [burdon]
  - https://github.com/yarnpkg/yarn/issues/946 [burdon]
  - https://github.com/yarnpkg/yarn/issues/3294
  - https://github.com/yarnpkg/yarn/issues/2863
    - https://github.com/yarnpkg/rfcs/pull/34

07-03-17 tried learn with npm: still doesn't work


### Cold start

~~~~
git clone git@github.com:alienlabs/beta.git

cd beta

./tools/install_tools.sh

lerna bootstrap
~~~~

### Running tests

~~~~
lerna run test
~~~~

















## TODO

- Script to run node dist/server.bundle.js (with ENV)

MS2
- site webpack (home, profile, admin, etc.) part of app-server projct.

MS3
- API router (with trivial apollo app: query, mutate).
- graphiql

MS4
- Scheduler (null demo).

MS5
- Re-org client (dfferent entry points: web, crx).
- Move ux to client (shared less defs; redo CSS layout?).
- Look at Parabol (component/container).

MS6
- Deploy CRX.

MS7
- D3 demo for sidebar (see NYTimes charts: https://www.nytimes.com/2017/04/01/business/media/bill-oreilly-sexual-harassment-fox-news.html)

## Cleanup

- NOTE: googleapis must be declared in app-server (Document)

- REMOVE Firebase Auth (and remove auto gen API keys from Google APIs)

- move API framework to core.
- split util into client/server
- ItemStore/QueryProcessor
- db start-up/admin tool

- JS tests (with sourcemaps)

- reach-router (4) backwards compat?
- react-hot-loader (latest vs beta?) file issue.

## Done

- demo: merge everything into rb-config
- Port sub/ux (remove src/web/testing/apollo)
- Port sub/core
- Facgtor out sub/core/util => sub/util
- Build API and graphql plugin => sub/api
- Hot mode.
- Run test apollo client in alien-app-server (hot mode with custom config).
- Port sub/services (OAuth)
- OAuth server routers
- Google APIs config
- Firebase config
- db init; whitelist user
