#!/usr/bin/env bash

# TODO(burdon): Options.

#
# https://console.aws.amazon.com/route53/home#hosted-zones
# https://console.aws.amazon.com/route53/home#resource-record-sets:Z2CBLP82419UJ2
# https://github.com/kubernetes/kops/blob/master/docs/aws.md#scenario-3-subdomain-for-clusters-in-route53-leaving-the-domain-at-another-registrar
#

export ROBOTIK_CLUSTERS=kube.robotik.io

aws route53 create-hosted-zone --name ${ROBOTIK_CLUSTERS} --caller-reference $(uuidgen) | jq ".DelegationSet.NameServers"

aws route53 list-hosted-zones
