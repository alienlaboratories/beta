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



- whitelist user
- userRouter (profile)





MS2
- Port services (OAuth)
  - OAuth server routers
  - Google APIs config
  - Firebase config
  - Port sub/services



MS3
- API server router
- move API framework to core.

MS4
- Port scheduler





MS5
- Re-org client (dfferent entry points: web, crx)
- Move ux to client.
- split util into client/server

- reach-router (4) backwards compat?
- react-hot-loader (latest vs beta?) file issue.




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
- Hot mode.
- Run test apollo client in alien-app-server (hot mode with custom config).


