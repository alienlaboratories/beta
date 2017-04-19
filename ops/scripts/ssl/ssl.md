# Generate TLS Certificates.

## Create the Root Pair (key/certificate).

- https://jamielinux.com/docs/openssl-certificate-authority/create-the-root-pair.html

~~~~
  # TODO(burdon): Move out of source repo!

  mkdir root/ca
  cd root/ca
  mkdir certs crl newcerts private
  chmod 700 private
  touch index.txt
  echo 1000 > serial

  # Download conf and change "dir" param.
  curl https://jamielinux.com/docs/openssl-certificate-authority/_downloads/root-config.txt > openssl.cnf

  # Hint: "h1"
  openssl genrsa -aes256 -out private/ca.key.pem 4096
  chmod 400 private/ca.key.pem

  # Create the root certificate.
  # US/NY/Brooklyn/Alien Labs/Eng/Alien Labs Root CA
  openssl req -config openssl.cnf \
      -key private/ca.key.pem \
      -new -x509 -days 7300 -sha256 -extensions v3_ca \
      -out certs/ca.cert.pem
  chmod 444 certs/ca.cert.pem
  
  # Verify:
  openssl x509 -noout -text -in certs/ca.cert.pem
~~~~

## Create the intermediate pair (key/certificate).
  
- https://jamielinux.com/docs/openssl-certificate-authority/create-the-intermediate-pair.html

~~~~
  mkdir root/ca/intermediate  
  cd root/ca/intermediate
  mkdir certs crl csr newcerts private
  chmod 700 private
  touch index.txt
  echo 1000 > serial  
  echo 1000 > crlnumber
  
  # Download conf and change "dir" param.
  curl https://jamielinux.com/docs/openssl-certificate-authority/_downloads/intermediate-config.txt > openssl.cnf
  
  # Hint: "h1"
  openssl genrsa -aes256 -out private/intermediate.key.pem 4096
  chmod 400 private/intermediate.key.pem
  
  # Create the intermediate certificate (NOTE: Common name must be different).
  # US/NY/Brooklyn/Alien Labs/Eng/Alien Labs Intermediate CA
  openssl req -config openssl.cnf -new -sha256 \
      -key private/intermediate.key.pem \
      -out csr/intermediate.csr.pem
~~~~

## Use the Root CA to create the certificate.

~~~~
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
~~~~

## Create the certificate chain file.

~~~~
  cat intermediate/certs/intermediate.cert.pem \
      certs/ca.cert.pem > intermediate/certs/ca-chain.cert.pem
  chmod 444 intermediate/certs/ca-chain.cert.pem
~~~~
