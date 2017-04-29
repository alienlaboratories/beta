#!/usr/bin/env bash

#
# Developer Tools Set-up.
#

brew update
brew outdated | xargs brew upgrade

brew install bash-completion
brew install cask
brew install docker
brew install docker-machine
brew install docker-machine-driver-xhyve
brew install hilite
brew install jq
brew install kops
brew install kubectl
brew install kubernetes-cli
brew install memcached
brew install npm
brew install python
brew install redis
brew install --HEAD xhyve

brew cask install minikube
brew cask install virtualbox

npm install -g babel-cli
npm install -g firebase-tools
npm install -g grunt
npm install -g jest
npm install -g karma-cli
npm install -g nodemon
npm install -g npm-workspace
npm install -g webpack

pip install --upgrade virtualenv

# Add credentials to ~/.aws/credentials
# export AWS_DEFAULT_PROFILE=xxx
# export PATH=$PATH:~/Library/Python/2.7/bin
pip install --upgrade --user awscli
