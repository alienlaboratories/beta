//
// Copyright 2017 Alien Labs.
//

import * as fs from 'fs';
import marked from 'marked';

// TODO(burdon): Generalize.
const input = './src/resources/markdown/hiring.md';
const output = './src/views/partials/hiring.hbs';

fs.readFile(input, 'utf8', (err, data) => {
  let html = marked(data);
  fs.writeFile(output, html, (err) => {
    console.log(err || 'Generated: ' + output);
  });
});
