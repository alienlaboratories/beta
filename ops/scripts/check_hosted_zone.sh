#!/usr/bin/env bash

# TODO(burdon): Options.

export ROBOTIK_CLUSTERS=kube.robotik.io

ZONES='.HostedZones[] | select(.Name=="'${ROBOTIK_CLUSTERS}'.") | .Id'

echo "### Route 53 Name Servers [${ROBOTIK_CLUSTERS}] ###" && echo
aws route53 list-hosted-zones | jq "$ZONES" | \
  xargs -I % aws route53 get-hosted-zone --id % | jq ".DelegationSet.NameServers"

echo
echo "### DNS Name Servers [${ROBOTIK_CLUSTERS}] ###"
dig ns ${ROBOTIK_CLUSTERS}

echo "Update NS Records"
echo "https://console.aws.amazon.com/route53/home?region=us-east-1#hosted-zones:"
echo "https://domains.google.com/registrar#z=a&d=1022025,robotik.io&chp=z,d"
echo
