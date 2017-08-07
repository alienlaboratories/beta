#!/usr/bin/env bash

DIR=$(dirname "${BASH_SOURCE[0]}")

source ${DIR}/config.sh

#
# https://console.aws.amazon.com/route53/home#hosted-zones
# https://console.aws.amazon.com/route53/home#resource-record-sets:Z2CBLP82419UJ2
# https://github.com/kubernetes/kops/blob/master/docs/aws.md#scenario-3-subdomain-for-clusters-in-route53-leaving-the-domain-at-another-registrar
#

aws route53 create-hosted-zone --name ${ALIEN_K8S_HOSTED_ZONE} --caller-reference $(uuidgen) | jq ".DelegationSet.NameServers"
