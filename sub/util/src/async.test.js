//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Async } from './async';

test('sanity', () => {

  function multiply(value, n) {
    return new Promise((resolve, reject) => {
      resolve(value * n);
    });
  }

  let values = [1, 2, 3];

  return Promise.all(_.map(values, value => multiply(value, 2)))
    .then(results => {
      expect(results).toEqual([2, 4, 6]);
    });
});

test('Promise chaining.', () => {

  const page = 10;
  const fetch = (idx, n) => {
    return new Promise((resolve, reject) => {
      resolve(_.range(idx, idx + Math.max(page, n)));
    });
  };

  const search = (count, items=undefined, idx=0) => {
    let result = [];
    return fetch(idx, count).then(items => {
      _.each(items, item => result.push(item));
      if (result.length < count) {
        return search(count - result.length, result, idx + items.length);
      }

      return items;
    });
  };

  let count = 15;
  return search(count).then(items => {
    expect(items.length).toEqual(count);
  });
});

test('iterateWithPromises', () => {
  let values = [];

  let f = (i) => {
    values.push(i);
    return Promise.resolve(i);
  };

  return Async.iterateWithPromises(_.times(5), i => f(i)).then((value) => {

    // Last value.
    expect(value).toEqual(4);

    // Test done sequentially.
    expect(values.length).toEqual(5);
  });
});

