#!/usr/bin/env bash

#
# Create/manage cluster(s).
# https://github.com/kubernetes/kops/blob/master/docs/aws.md
#

# TODO(burdon): Options.
# TODO(burdon): Bash vars. Incl script?
# TODO(burdon): Single Python script.
# TODO(burdon): All vars (incl. AWS REGION).

export ROBOTIK_CLUSTERS=kube.robotik.io

export CLUSTER_NAME=beta

export CLUSTER=${CLUSTER_NAME}.${ROBOTIK_CLUSTERS}

export ROBOTIK_S3_BUCKET=cluster.${CLUSTER}

export KOPS_STATE_STORE=s3://${ROBOTIK_S3_BUCKET}

# NOTE: us-east-1a isn't vald.
export ZONES="us-east-1d"

aws ec2 describe-availability-zones

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
    --dns-zone=${ROBOTIK_CLUSTERS} \
    --yes

# TODO(burdon): How should this be managed? Contans secrets.
cp ~/.kube/config ./credentials/kube.conf

echo "This could take 5-10 minutes..."
echo "https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:sort=instanceId"
echo

kops validate cluster
