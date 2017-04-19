#!/usr/bin/env bash

# TODO(burdon): Options.

#
# Crate IAM User for kops
# https://github.com/kubernetes/kops/blob/master/docs/aws.md#setup-iam-user
#
# Dashboard
# https://console.aws.amazon.com/iam/home?region=us-east-1#/users
#

aws iam create-group --group-name kops

export arns="
arn:aws:iam::aws:policy/AmazonEC2FullAccess
arn:aws:iam::aws:policy/AmazonRoute53FullAccess
arn:aws:iam::aws:policy/AmazonS3FullAccess
arn:aws:iam::aws:policy/IAMFullAccess
arn:aws:iam::aws:policy/AmazonVPCFullAccess"

for arn in $arns; do aws iam attach-group-policy --policy-arn "$arn" --group-name kops; done

aws iam create-user --user-name kops

aws iam add-user-to-group --user-name kops --group-name kops

aws iam create-access-key --user-name kops
