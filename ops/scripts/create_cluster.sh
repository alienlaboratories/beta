#!/usr/bin/env bash

# TODO(burdon): Options.
# TODO(burdon): Bash vars. Incl script?
# TODO(burdon): Single Python script.
# TODO(burdon): All vars (incl. AWS REGION).

export CLUSTER_NAME=beta

export ROBOTIK_CLUSTERS=kube.robotik.io

export CLUSTER=${CLUSTER_NAME}.${ROBOTIK_CLUSTERS}

export ROBOTIK_S3_BUCKET=cluster.${CLUSTER}

export KOPS_STATE_STORE=s3://${ROBOTIK_S3_BUCKET}

#
# Delete cluster.
#

kops delete cluster --name ${CLUSTER} --yes

#
# Create cluster.
# Creates a single master and single node.
#

aws ec2 describe-availability-zones

# TODO(burdon): Const.
kops create cluster \
    --cloud=aws \
    --zones=us-east-1d ${CLUSTER} \
    --master-count=1 \
    --node-count=1 \
    --dns-zone=${ROBOTIK_CLUSTERS} \
    --yes

kops validate cluster

echo "This could take 5-10 minutes..."
echo "https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:sort=instanceId"
echo

