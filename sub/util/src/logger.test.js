//
// Copyright 2017 Alien Labs.
//

import { expect } from 'chai';

import { Logger } from './logger';

describe('Logger:', () => {

  it('Formats a string.', () => {
    let str = Logger.format('[%s][%d]:%o', '123', 123, { id: 2 });
    expect(str).to.equal('[123][123]:{"id":2}');
  });
});
