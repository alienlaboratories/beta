#!/usr/bin/env bash

DIR=$(dirname "${BASH_SOURCE[0]}")

source ${DIR}/config.sh

#
# AWS
#

echo "AWS_PROFILE=${AWS_PROFILE}"

aws s3 ls

aws iam get-user kops

aws route53 list-hosted-zones

dig ns ${ALIEN_CLUSTERS}

#
# Kube
#

kops validate cluster ${CLUSTER}
