#!/usr/bin/env bash

DIR=$(dirname "${BASH_SOURCE[0]}")

source ${DIR}/config.sh

#
# Create/manage cluster(s).
# https://github.com/kubernetes/kops/blob/master/docs/aws.md
#

# NOTE: us-east-1a isn't vald.
export ZONES="us-east-1d"

aws ec2 describe-availability-zones

dig ns ${ALIEN_K8S_HOSTED_ZONE}

#
# Create cluster.
# Creates a single master and single node.
#

# TODO(burdon): Option.
#kops delete cluster --name ${CLUSTER} --yes

# TODO(burdon): Const.
kops create cluster ${CLUSTER} \
    --cloud=aws \
    --zones=${ZONES} \
    --master-count=1 \
    --node-count=1 \
    --dns-zone=${ALIEN_K8S_HOSTED_ZONE} \
    --yes

# TODO(burdon): How should this be managed? Contans secrets.
cp ~/.kube/config ./credentials/kube.conf

echo "This could take 5-10 minutes..."
echo "https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:sort=instanceId"
echo

kops get cluster ${CLUSTER}

kops validate cluster ${CLUSTER}
