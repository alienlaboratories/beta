#!/bin/sh

#
# Create SSL Certs.
# Re-entrant for same values (need to validate).
#
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

  echo "Primary: ${DOMAIN}"
  echo "Additional:"
  for sub in "${ALT[@]}"
  do
    echo ${sub}

    ALT_NAMES="$ALT_NAMES ${sub}"
    DOMAIN_NAMES="$DOMAIN_NAMES DomainName=${sub},ValidationDomain=${sub}"
  done

  echo
  echo "Requesting Cert"
  echo "https://console.aws.amazon.com/acm/home?region=us-east-1#"
  echo

  # http://docs.aws.amazon.com/cli/latest/reference/acm/request-certificate.html
  set -x
  aws acm request-certificate \
    --domain-name ${DOMAIN} \
    --subject-alternative-names ${ALT_NAMES} \
    --domain-validation-options ${DOMAIN_NAMES}
}

# Prevent wildcard expansion.
set -f

#
# NOTE: Validation sent to admin@ (must confirm each).
#

create_cert alienlabs.io "*.alienlabs.io robotik.io *.robotik.io minderlabs.com *.minderlabs.com"
