# Beta

## Getting Started.

~~~~
  ./tools/eng/
    init.sh         Configure all sub modules.
    setup.sh        Install all tools.
    test.sh         Run all unit tests.
    update.sh       Update deps in all modules.
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

- REMOVE: "minder" (clear cache first)
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
