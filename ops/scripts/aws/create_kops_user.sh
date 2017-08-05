#!/usr/bin/env bash

#
# Crate IAM User for kops
# https://github.com/kubernetes/kops/blob/master/docs/aws.md#setup-iam-user
#
# Dashboard
# https://console.aws.amazon.com/iam/home?region=us-east-1#/users
#

KOPS_USER=kops
KOPS_GROUP=kops

export ARNS="
arn:aws:iam::aws:policy/AmazonEC2FullAccess
arn:aws:iam::aws:policy/AmazonRoute53FullAccess
arn:aws:iam::aws:policy/AmazonS3FullAccess
arn:aws:iam::aws:policy/IAMFullAccess
arn:aws:iam::aws:policy/AmazonVPCFullAccess"

for arn in ${ARNS}; do aws iam attach-group-policy --policy-arn "$arn" --group-name kops; done

aws iam create-user --user-name ${KOPS_USER}

aws iam create-group --group-name ${KOPS_GROUP}

aws iam add-user-to-group --user-name ${KOPS_USER} --group-name ${KOPS_GROUP}

aws iam create-access-key --user-name ${KOPS_USER}

aws iam list-users
