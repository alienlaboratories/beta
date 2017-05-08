//
// Copyright 2017 Alien Labs.
//

import Iron from 'iron';
import uuid from 'uuid';
import { expect } from 'chai';

let password = uuid.v4();

describe('Iron encryption:', () => {

  it('Encrypt and Decrypt.', (done) => {
    let data = { value: 'hello' };

    // https://www.npmjs.com/package/iron
    Iron.seal(data, password, Iron.defaults, (err, sealed) => {
      console.log(sealed);

      Iron.unseal(sealed, password, Iron.defaults, (err, unsealed) => {
        console.log(unsealed);
        expect(unsealed).to.eql(data);
        done();
      });
    });
  });
});
