//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil } from './type';

describe('TypeUtil:', () => {

  it('defaultMap', () => {
    let map = new Map();
    TypeUtil.defaultMap(map, 'a', Array).push('x');
    TypeUtil.defaultMap(map, 'a', Array).push('y');
    expect(map.get('a')).toHaveLength(2);
  });

  it('isEmpty', () => {
    expect(TypeUtil.isEmpty()).toBe(true);
    expect(TypeUtil.isEmpty({})).toBe(true);
    expect(TypeUtil.isEmpty([])).toBe(true);
    expect(TypeUtil.isEmpty(null)).toBe(true);
    expect(TypeUtil.isEmpty({ foo: undefined })).toBe(true);
    expect(TypeUtil.isEmpty({ foo: [] })).toBe(true);
    expect(TypeUtil.isEmpty({ foo: {} })).toBe(true);

    expect(TypeUtil.isEmpty([1])).toBe(false);
    expect(TypeUtil.isEmpty({ foo: 1 })).toBe(false);
  });

  it('traverse', () => {
    let obj = {
      a: {
        b: {
          c: [
            {
              value: { id: 100 }
            },
            {
              value: { id: 200 }
            }
          ]
        }
      }
    };

    let x = [];
    TypeUtil.traverse(obj, (value) => {
      let id = _.get(value, 'value.id');
      if (id) {
        x.push(id);
      }
    });

    expect(x).toHaveLength(2);
  });

  it('maybeSet', () => {
    let obj = {
      a: 'foo',
      b: {
        c: 'bar',
        d: 10
      }
    };

    expect(_.get(TypeUtil.maybeSet(obj, 'b.c', 'wow'), 'b.c')).toEqual('wow');
    expect(_.get(TypeUtil.maybeSet(obj, 'b.x', undefined), 'b.x')).toBeUndefined();
    expect(_.get(TypeUtil.maybeSet(obj, 'b.x', null), 'b.x')).toBeUndefined();
    expect(_.get(TypeUtil.maybeSet(obj, 'b.x', false), 'b.x')).toBe(false);
  });
});
