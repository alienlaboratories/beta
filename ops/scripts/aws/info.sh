#!/usr/bin/env bash

DIR=$(dirname "${BASH_SOURCE[0]}")

source ${DIR}/config.sh

# TODO(burdon): CLI/options.

#
# AWS
#

echo "AWS_PROFILE=${AWS_PROFILE}"

#aws iam get-user kops

aws s3 ls ${KOPS_STATE_STORE}

#
# DNS
#

ZONES='.HostedZones[] | select(.Name=="'${ALIEN_K8S_HOSTED_ZONE}'.") | .Id'

echo "### Route 53 Name Servers [${ALIEN_K8S_HOSTED_ZONE}] ###" && echo

aws route53 list-hosted-zones

HOSTED_ZONE=$(aws route53 list-hosted-zones | jq -r '.HostedZones[] | select(.Name=="'${ALIEN_K8S_HOSTED_ZONE}'.") | .Id')

aws route53 get-hosted-zone --id ${HOSTED_ZONE} | jq .DelegationSet.NameServers

echo
echo "### DNS Name Servers [${ALIEN_K8S_HOSTED_ZONE}] ###"
dig ns ${ALIEN_K8S_HOSTED_ZONE}

echo "Check NS Records for hosted zone:"
echo "https://console.aws.amazon.com/route53/home?region=us-east-1#hosted-zones:"
echo "https://domains.google.com/registrar#z=a&d=1022025,alienlabs.io&chp=z,d"
echo

#
# Kube
#

kops validate cluster ${CLUSTER}

#kops toolbox dump --name=${CLUSTER} --state=${KOPS_STATE_STORE}
