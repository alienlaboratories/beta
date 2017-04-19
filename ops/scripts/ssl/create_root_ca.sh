#!/usr/bin/env bash

ROOT=`pwd`

mkdir ${ROOT}/ca

#
# Create the Root Pair (key/certificate).
# https://jamielinux.com/docs/openssl-certificate-authority/create-the-root-pair.html
#

cd ${ROOT}/ca

mkdir certs crl newcerts private
chmod 700 private
touch index.txt
echo 1000 > serial

# Download conf and change "dir" param.
curl https://jamielinux.com/docs/openssl-certificate-authority/_downloads/root-config.txt > openssl.cnf

# Use ~ as delimeter (since $ROOT contains slashes).
sed -i -e "s~\(^dir[ ]*=\).*$~\1 $ROOT/ca~g" openssl.cnf

openssl genrsa -aes256 -out private/ca.key.pem 4096
chmod 400 private/ca.key.pem

# Create the root certificate.
# US/NY/Brooklyn/Alien Labs/Eng/Alien Labs Root CA
openssl req -config openssl.cnf \
    -key private/ca.key.pem \
    -new -x509 -days 7300 -sha256 -extensions v3_ca \
    -out certs/ca.cert.pem
chmod 444 certs/ca.cert.pem

# Verify.
openssl x509 -noout -text -in certs/ca.cert.pem
