//
// Copyright 2017 Alien Labs.
//

import { Logger } from './logger';

test('Formats a string.', () => {
  let str = Logger.format('[%s][%d]:%o', '123', 123, { id: 2 });
  expect(str).toEqual('[123][123]:{"id":2}');
});
