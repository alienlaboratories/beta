#!/bin/sh

#
# brew
#

brew update
brew install node
brew install phantomjs
brew outdated

#
# npm
#

npm update
npm install -g babel-cli
npm install -g nodemon
npm install -g webpack
npm outdated
