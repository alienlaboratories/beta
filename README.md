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


### Cold start

~~~~
git clone git@github.com:alienlabs/beta.git

cd beta

./tools/install_tools.sh

lerna bootstrap
~~~~


### Running tests

~~~~
lerna run test [-scope "alien-util"]
~~~~


### Troubleshooting

NOTE: `lerna` is deprecated; `yarn` may subsume capabilities:
  - https://github.com/lerna/lerna/issues/408
  - https://github.com/lerna/lerna/issues/884 [burdon]
  - https://github.com/yarnpkg/yarn/issues/946 [burdon]
  - https://github.com/yarnpkg/yarn/issues/3294
  - https://github.com/yarnpkg/yarn/issues/2863
    - https://github.com/yarnpkg/rfcs/pull/34
    
  - https://discuss.circleci.com/t/building-monorepo-projects-with-circleci/1923

Looked at: yarna, yall, oao, monorepo

06/27/17: Fails (silently) to install winston.
  - Trying lerna + npm (not yarn)
