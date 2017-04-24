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

MS1
- Run test apollo client in alien-app-server (hot mode with custom config).
- Hot mode.



- split util into client/server

MS2
- OAuth
  - Google APIs config
  - Firebase config
  - Port sub/services

Port services
Port scheduler

MS3
- Schedulder demo
- Port sub/graphql (=> sub/framework?)

MS4
- Re-org client (dfferent entry points: web, crx)
- Move ux to client.


## Cleanup

- COPYRIGHT
- REMOVE: "minder"
- JS tests (with sourcemaps)
- Update deps


## Done

- demo: merge everything into rb-config
- Port sub/ux (remove src/web/testing/apollo)
- Port sub/core
- Facgtor out sub/core/util => sub/util
- Build API and graphql plugin => sub/api


