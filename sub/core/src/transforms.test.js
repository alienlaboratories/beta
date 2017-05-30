//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Transforms } from './transforms';

test('Apply object mutation.', () => {
  let object = {};

  let mutations = [{
    field: 'title',
    value: { string: 'Alien' }
  }];

  let result = Transforms.applyObjectMutations({}, object, mutations);
  expect(_.get(result, 'title')).toEqual('Alien');
});

test('Apply object mutation to remove field.', () => {
  let object = {
    title: 'Alien'
  };

  let mutations = [{
    field: 'title'
  }];

  let result = Transforms.applyObjectMutations({}, object, mutations);
  expect(_.get(result, 'title')).toEqual(undefined);
});

test('Apply nested object mutation.', () => {
  let object = {};

  let mutations = [{
    field: 'foo',
    value: {
      object: [{
        field: 'bar',
        value: {
          string: 'X'
        }
      }]
    }
  }];

  let result = Transforms.applyObjectMutations({}, object, mutations);
  expect(_.get(result, 'foo.bar')).toEqual('X');
});

test('Apply multiple object mutations.', () => {
  let object = {};

  let mutations = [{
    field: 'foo',
    value: {
      object: [{
        field: 'bar',
        value: {
          object: [{
            field: 'x',
            value: {
              object: [
                {
                  field: 'listId',
                  value: {
                    string: 'a'
                  }
                },
                {
                  field: 'order',
                  value: {
                    float: 0.5
                  }
                }
              ]
            }
          }]
        }
      }]
    }
  }];

  let result = Transforms.applyObjectMutations({}, object, mutations);
  expect(_.get(result, 'foo.bar.x.listId')).toEqual('a');
  expect(_.get(result, 'foo.bar.x.order')).toEqual(0.5);
});

test('Apply set mutations.', () => {
  let object = {
    labels: ['red', 'green']
  };

  let mutations = [
    {
      field: 'labels',
      value: {
        set: [
          { value: { string: 'blue' } },
          { value: { string: 'blue' } },
          { value: { string: 'red' }, add: false }
        ]
      }
    }
  ];

  let result = Transforms.applyObjectMutations({}, object, mutations);
  expect(_.get(result, 'labels').length).toEqual(2);
  expect(_.findIndex(_.get(result, 'labels'), 'red')).toEqual(-1);
  expect(_.indexOf(_.get(result, 'labels'), 'green')).not.toEqual(-1);
  expect(_.indexOf(_.get(result, 'labels'), 'blue')).not.toEqual(-1);
});

test('Apply array mutations.', () => {
  let object = {
    scores: [1, 2, 3]
  };

  let mutations = [
    {
      field: 'scores',
      value: {
        array: [
          { value: { null: true }, index: 1 },    // Remove
          { value: { int: 1 }, index: -1 },       // Append
          { value: { int: 2 }, index: 0 }         // Prepend
        ]
      }
    }
  ];

  let result = Transforms.applyObjectMutations({}, object, mutations);
  expect(_.get(result, 'scores').length).toEqual(4);
});

test('Apply map mutations.', () => {
  let object = {
    colors: [
      {
        alias: 'red',
        labels: ['a', 'b', 'c']
      },
      {
        alias: 'blue'
      }
    ]
  };

  let mutations = [
    {
      field: 'colors',
      value: {
        map: [
          {
            // Update existing.
            predicate: {
              key: 'alias',
              value: {
                string: 'red'
              }
            },
            value: {
              object: [{
                field: 'labels',
                value: {
                  set: [{ value: { string: 'd' } }]
                }
              }]
            }
          },
          {
            // Insert new element.
            predicate: {
              key: 'alias',
              value: {
                string: 'green'
              }
            },
            value: {
              object: [{
                field: 'labels',
                value: {
                  set: [{ value: { string: 'x' } }]
                }
              }, {
                field: 'labels',
                value: {
                  set: [{ value: { string: 'y' } }]
                }
              }]
            }
          },
          {
            // Remove
            predicate: {
              key: 'alias',
              value: {
                string: 'blue'
              }
            },
            value: {
              null: true
            }
          }
        ]
      }
    }
  ];

  let result = Transforms.applyObjectMutations({}, object, mutations);

  expect(_.get(_.find(_.get(result, 'colors'), color => color.alias === 'red'), 'labels')).toHaveLength(4);
  expect(_.get(_.find(_.get(result, 'colors'), color => color.alias === 'green'), 'labels')).toHaveLength(2);
  expect(_.findIndex(_.get(result, 'colors'), color => color.alias === 'blue')).toEqual(-1);
});
