#!/usr/bin/env bash

#
# Include this in ~/.bash_profile
#

#
# Tools
#

# https://blog.fabric8.io/enable-bash-completion-for-kubernetes-with-kubectl-506bc89fe79e
[ -f /usr/local/etc/bash_completion ] && . /usr/local/etc/bash_completion
source <(kubectl completion bash)

#
# ENV
#

export PROJECTS_HOME=${PROJECTS_HOME:-$HOME/projects}
export PROJECT_HOME=${PROJECTS_HOME}/src/alienlabs/beta

# ~/.aws/credentials
export AWS_PROFILE="robotik"

export ROBOTIK_S3_BUCKET="cluster.beta.kube.robotik.io"

#
# Docker
#

alias dps='docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"'

alias dock='eval $(minikube docker-env)"'

#
# Kubernetes
#

alias m='minikube'

alias k='kubectl'

alias kc='kubectl config get-contexts'
alias kc-mini='kubectl config use-context minikube'
alias kc-beta='kubectl config use-context beta.kube.robotik.io'

# Remote shell.
function ksh() {
  POD=$(kubectl get pods -l run="$@" -o name | sed 's~pods/~~g')
  echo ${POD}
  kubectl exec ${POD} -ti bash
}

alias k-sh=ksh

function EXEC { echo; echo "##"; echo "## $@"; echo "##"; echo; $@; }

function kstats() {
  EXEC minikube status
  EXEC kubectl config get-contexts
  EXEC kubectl get services
  EXEC kubectl get pods
  echo
}

alias k-stats=kstats

alias k-help='cat ${PROJECT_HOME}/ops/docs/cheatsheet.md'
