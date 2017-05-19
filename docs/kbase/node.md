# Node

~~~~
    npm list
    npm list --depth=0 --dev
    npm list --depth=0 --prod
     
    npm outdated

    # Update to latest minor version.
    npm update karma --save-dev
    
    # Update to specified (major) version
    npm install karma@^1.0.0 --save-dev 
    
    ncu -g
    npm update -g webpack
~~~~

## Dependencies

- http://stackoverflow.com/questions/16073603/how-do-i-update-each-dependency-in-package-json-to-the-latest-version

- Peer dependencies (break cycles)
  - http://codetunnel.io/you-can-finally-npm-link-packages-that-contain-peer-dependencies
  - http://webpack.github.io/docs/troubleshooting.html#npm-linked-modules-doesn-t-find-their-dependencies
  

## Troubleshooting

- Error initializing new module (i.e., npm update)
  - Must ensure virtual env is already present and current (virtualenv tools/python)


## Workspaces

https://www.npmjs.com/package/npm-workspace
https://github.com/lerna/lerna
https://github.com/yarnpkg/yarn/issues/3294					
https://yarnpkg.com/lang/en/docs/dependency-types
https://gist.github.com/thejameskyle/1e0f781de728ec1f2597a0bdbe071675					


TODO(burdon): lerna (see babel)
TODO(burdon): sub repos ("repository": "https://github.com/alienlabs/beta/tree/master/sub/alien-api")
TODO(burdon): Remove grunt npm-update (yarn upgrade-interactive)
TODO(burdon): circleci/travis?
TODO(burdon): Github repo (with circle badge) Summarize toolchain (node, yarn, webpack/babel, jest, grunt)
TODO(burdon): flow? gulp?
https://github.com/palantir/yerna / https://github.com/lerna/lerna/issues/371 

