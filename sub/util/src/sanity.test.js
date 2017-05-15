//
// Copyright 2017 Alien Labs.
//

test('Sanity.', () => {
  expect(true).toBe(true);
});

/**
 * NOTE: To handle promises DO NOT include (done) in the function signature
 *       and ensure the promise is passed down at each level.
 *
 * NOTE: setTimeout must catch exceptions and return a promise.
 *
 * https://github.com/facebook/jest/issues/2441
 * https://github.com/facebook/jest/issues/3576
 */
test('Async', () => {

  function foo() {
 // return Promise.reject(100);
 // throw new Error();
    return Promise.resolve(true);
  }

  function bar() {
    console.assert(true);
    return Promise.resolve(1);
  }

  return foo().then(() => {
    return bar().then(value => {
      expect(value).toEqual(1);
    });
  });
});
