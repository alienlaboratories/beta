#!/usr/bin/env bash

ROOT=`pwd`

mkdir ${ROOT}/ca/intermediate

#
# Create the intermediate pair (key/certificate).
# https://jamielinux.com/docs/openssl-certificate-authority/create-the-root-pair.html
#

cd ${ROOT}/ca/intermediate

mkdir certs crl csr newcerts private
chmod 700 private
touch index.txt
echo 1000 > serial
echo 1000 > crlnumber

# Download conf and change "dir" param.
curl https://jamielinux.com/docs/openssl-certificate-authority/_downloads/intermediate-config.txt > openssl.cnf

# Use ~ as delimeter (since $ROOT contains slashes).
sed -i -e "s~\(^dir[ ]*=\).*$~\1 $ROOT/ca/intermediate~g" openssl.cnf

openssl genrsa -aes256 -out private/intermediate.key.pem 4096
chmod 400 private/intermediate.key.pem

openssl req -config openssl.cnf -new -sha256 \
    -key private/intermediate.key.pem \
    -out csr/intermediate.csr.pem

#
# Use the Root CA to create the certificate.
#

cd ${ROOT}/ca

openssl ca -config openssl.cnf -extensions v3_intermediate_ca \
    -days 3650 -notext -md sha256 \
    -in intermediate/csr/intermediate.csr.pem \
    -out intermediate/certs/intermediate.cert.pem
chmod 444 intermediate/certs/intermediate.cert.pem

# Verify.
openssl x509 -noout -text \
    -in intermediate/certs/intermediate.cert.pem

# Verify against root.
openssl verify -CAfile certs/ca.cert.pem \
    intermediate/certs/intermediate.cert.pem

#
# Create the certificate chain file.
#

cat intermediate/certs/intermediate.cert.pem \
    certs/ca.cert.pem > intermediate/certs/ca-chain.cert.pem
chmod 444 intermediate/certs/ca-chain.cert.pem
