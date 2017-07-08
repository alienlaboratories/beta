#!/bin/sh

#
# Find the CRX key.
# CRX must be installed from the store.
#

cd ~/Library/Application\ Support/Google/Chrome/Default/Extensions

MANIFEST=$(grep '"name": "Robotik"' --files-with-matches --include="manifest.json" -R *)

echo ${MANIFEST}

cat ${MANIFEST} | jq ".key"
