//
// Copyright 2017 Alien Labs.
//

import { ID } from './id';

describe('Data', () => {

  it('Convert between glocal to local IDs', () => {
    let globalId = ID.toGlobalId('User', 'alien');
    let { type, id } = ID.fromGlobalId(globalId);
    expect(type).to.equal('User');
    expect(id).to.equal('alien');
  });
});
