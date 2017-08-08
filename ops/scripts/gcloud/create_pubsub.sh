#!/usr/bin/env bash

# https://cloud.google.com/sdk/gcloud/reference/beta/pubsub

WEBHOOK_GMAIL="83CC572F-90DE-406F-ABFB-4C770C2381EB"

# https://console.cloud.google.com/cloudpubsub/topicList?project=alienlabs-dev
gcloud beta pubsub topics create "gmail"
gcloud beta pubsub topics list

# Endpoint must match.
# ERROR: The supplied HTTP URL is not registered in the subscription's parent project.
# https://console.cloud.google.com/apis/credentials/domainverification?project=alienlabs-dev

# https://cloud.google.com/pubsub/docs/access_control
# TODO(burdon): Permissions: `Pub/Sub Publisher` for `serviceAccount:gmail-api-push@system.gserviceaccount.com` (from console only).

# https://console.cloud.google.com/cloudpubsub/subscriptions?project=alienlabs-dev
gcloud beta pubsub subscriptions create "gmail" --topic="gmail" --push-endpoint="https://app.alienlabs.io/hook/${WEBHOOK_GMAIL}"
gcloud beta pubsub subscriptions list
