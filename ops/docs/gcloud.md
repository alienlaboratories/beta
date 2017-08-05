# Google Cloud

## Gmail Push

~~~~
    GMail =(user)=> [Topic] => [Subscription] => Web hook
~~~~

1 Create topic:
- https://console.cloud.google.com/cloudpubsub/topicList?project=alienlabs-dev

~~~~
    gcloud beta pubsub topics create "g-mail"
    gcloud beta pubsub topics list
~~~~

2 Create push subscription (to webhook):
- https://cloud.google.com/pubsub/docs/push
    - Site verification via Webmaster tools:
        - https://www.google.com/webmasters/tools/home?hl=en
    - Register domain with API manager:
        - https://console.cloud.google.com/apis/credentials/domainverification?project=alienlabs-dev
        - Add https://app.alienlabs.io
        
3. Configure subscription:
- https://cloud.google.com/pubsub/docs/push
- https://cloud.google.com/pubsub/docs/subscriber#create
- https://console.cloud.google.com/cloudpubsub/subscriptions?project=alienlabs-dev

~~~~
    gcloud beta pubsub subscriptions create "g-mail" --topic="g-mail" --push-endpoint="https://app.alienlabs.io/hook/gmail"
    gcloud beta pubsub subscriptions list
~~~~

4. Grant permissions:
- https://console.cloud.google.com/cloudpubsub/topics/g-mail?project=alienlabs-dev
    - Select topic.
    - Add `Pub/Sub Publisher` permission for `serviceAccount:gmail-api-push@system.gserviceaccount.com`

5. Use GMail API (users.watch) to send notifications to topic:
- Gmail API watch call to send Gmail notifications to the topic.
- https://developers.google.com/gmail/api/guides/push#getting_gmail_mailbox_updates
