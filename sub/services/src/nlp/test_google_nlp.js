//
// Copyright 2017 Alien Labs.
//

// https://cloud.google.com/natural-language/docs/reference/libraries#client-libraries-install-nodejs

// https://cloud.google.com/docs/authentication#getting_credentials_for_server-centric_flow
// > gcloud auth application-default login

// Imports the Google Cloud client library
import Language from '@google-cloud/language';

// Your Google Cloud Platform project ID
const projectId = '933786919888';

// Instantiates a client
const language = Language({
  projectId: projectId
});

// The text to analyze
const text = 'Google sucks!';

// Detects the sentiment of the text
language.detectSentiment(text)
  .then((results) => {
    const sentiment = results[0];

    console.log(`Text: ${text}`);
    console.log(`Sentiment score: ${sentiment.score}`);
    console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
  })
  .catch((err) => {
    console.error('ERROR:', err);
  });
