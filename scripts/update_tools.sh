#!/usr/bin/env bash

#
# OS/X Developer Tools Set-up.
#

brew update
brew outdated | xargs brew upgrade

brew install cask
brew cask outdated | xargs brew cask reinstall

brew cask install java
brew cask install minikube
brew cask install virtualbox

brew install bash-completion
brew install docker
brew install docker-machine
brew install docker-machine-driver-xhyve
brew install hilite
brew install jq
brew install kops
brew install kubectl
brew install kubernetes-cli
brew install memcached
brew install node
brew install python
brew install redis
brew install watchman
brew install yarn
brew install --HEAD xhyve

# NOTE: npm 4 required for lerna
# https://github.com/lerna/lerna/issues/903
npm install -g npm@4

#
# Requires Java.
#

brew install elasticsearch
brew install logstash

#
# Node
# NOTE: "npm install -g" may conflict with yarn so uninstall first.
# npm ls -g --depth=0
# npm ls -g --depth=0 --parseable | grep node_modules | awk -F "/" '{print $NF}' | xargs npm uninstall -g
# yarn global ls
#

yarn config set prefix /usr/local/

yarn global add babel-cli
yarn global add babel-eslint
yarn global add eslint
yarn global add eslint-plugin-import
yarn global add eslint-plugin-react
yarn global add firebase-tools
yarn global add grunt
yarn global add jest
yarn global add node-inspector
yarn global add nodemon
yarn global add npm
yarn global add serverless
yarn global add webpack

yarn global upgrade

#
# Python
#

pip install --upgrade virtualenv

#
# AWS
# ~/.aws/credentials
# export AWS_DEFAULT_PROFILE=xxx
# export PATH=$PATH:~/Library/Python/2.7/bin
#

pip install --upgrade --user awscli

#
# Extensions:
# https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm
# https://chrome.google.com/webstore/detail/chrome-apps-extensions-de/ohmmkhmmmpcnpikjeljgnaoabkaalbgc
# https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid
# https://chrome.google.com/webstore/detail/jetbrains-ide-support/hmhgeddbohgjknpmjagkdomcpobmllji
# https://chrome.google.com/webstore/detail/clear-cache/cppjkneekbjaeellbfkmgnhonkkjfpdn?hl=en
#
