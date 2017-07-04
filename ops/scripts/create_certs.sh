#!/bin/sh

#
# Create SSL Certs.
# Re-entrant for same values (need to validate).
#
# Validation sent to admin@
# http://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request.html
# NOTE: When creating the cert from the web site, resend auth email and uncheck *.domain addresses.
#
# Dashboard:
# https://console.aws.amazon.com/acm/home?region=us-east-1#
#

create_cert()
{
  DOMAIN=$1
  ALT=($2)

  ALT_NAMES=""
  DOMAIN_NAMES=""

  for sub in "${ALT[@]}"
  do
    ALT_NAMES="$ALT_NAMES $ALT"
    DOMAIN_NAMES="$DOMAIN_NAMES DomainName=$ALT,ValidationDomain=$DOMAIN"
  done

  aws acm request-certificate \
    --domain-name $DOMAIN \
    --subject-alternative-names $ALT_NAMES \
    --domain-validation-options $DOMAIN_NAMES
}

# Prevent wildcard expansion.
set -f

create_cert alienlabs.io "*.alienlabs.io robotik.io *.robotik.io minderlabs.com *.minderlabs.com"
