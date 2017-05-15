//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import moment from 'moment';

import { Matcher } from './matcher';

const items = _.keyBy([
  {
    id: 'a',
    type: 'User',
    title: 'Alice Braintree'
  },
  {
    id: 'b',
    type: 'User',
    title: 'Alien Admin'
  },
  {
    id: 'c',
    type: 'Task',
    title: 'Test matchers.',
    owner: 'a'
  },
  {
    id: 'd',
    type: 'Task',
    title: 'Implement simple expressions.',
    owner: 'a',
    assignee: 'b'
  },
  {
    id: 'e',
    type: 'Task',
    title: 'Implement boolean expressions.',
    owner: 'b',
    assignee: 'a'
  },
  {
    id: 'f',
    bucket: 'a',
    type: 'Task',
    title: 'Test matcher.',
    labels: ['foo']
  }
], item => item.id);

/**
 * Match buckets.
 */
test('Matches bucket filters.', () => {
  let matcher = new Matcher();

  // TODO(burdon): console.assert is ignored by node (use node assert module?)

  let root = {};
  expect(matcher.matchItems({ buckets: ['a'] }, root, { type: 'Task' }, items)).toHaveLength(4);
  expect(matcher.matchItems({ buckets: ['b'] }, root, { type: 'Task' }, items)).toHaveLength(3);
});

/**
 * Bucket filter.
 */
test('Matches bucket id.', () => {
  let matcher = new Matcher();

  let context = {
    buckets: ['a']
  };
  let root = {};
  let filter = {
    bucket: 'a',
    matchAll: true
  };

  expect(matcher.matchItem(context, root, filter, items.f)).toBe(true);
  expect(matcher.matchItems(context, root, filter, items)).toHaveLength(1);
});

/**
 * Bsaic filters.
 */
test('Matches basic filters.', () => {
  let matcher = new Matcher();

  // TODO(burdon): console.assert is ignored by node (use node assert module?)

  let context = {
    buckets: ['a']
  };
  let root = {};

  expect(matcher.matchItem(context, root, { type: 'User' }, items.a)).toBe(true);
  expect(matcher.matchItem(context, root, { type: 'Task' }, items.a)).toBe(false);

  expect(matcher.matchItems(context, root, {}, null)).toHaveLength(0);
  expect(matcher.matchItems(context, root, {}, items)).toHaveLength(0);
  expect(matcher.matchItems(context, root, { type: 'User' }, items)).toHaveLength(2);

  // TODO(burdon): Different types!
  expect(matcher.matchItems(context, root, { ids: ['a', 'b', 'z'], type: 'Task' }, items)).toHaveLength(6);
});

/**
 * Empty filters match nothing by default.
 */
test('Matches nothing or everything.', () => {
  let matcher = new Matcher();

  let context = {
    buckets: ['a']
  };
  let root = {};

  expect(matcher.matchItems(context, root, {}, items).length).toEqual(0);
  expect(matcher.matchItems(context, root, { matchAll: true }, items).length).toEqual(_.size(items));
});

/**
 * Simple expressions.
 */
test('Matches simple expressions.', () => {
  let matcher = new Matcher();

  let context = {
    buckets: ['a']
  };
  let root = {};

  expect(matcher.matchItems(
    context, root, { expr: { field: 'owner', value: { string: 'a' } } }, items)).toHaveLength(2);
});

/**
 * Labels and negated labels.
 */
test('Matches labels and negated labels.', () => {
  let matcher = new Matcher();

  let context = {
    buckets: ['a']
  };
  let root = {};

  expect(matcher.matchItem(context, root, { type: 'Task', labels: ['foo'] }, items.f)).toBe(true);
  expect(matcher.matchItem(context, root, { type: 'Task', labels: ['!foo'] }, items.f)).toBe(false);
  expect(matcher.matchItem(context, root, { type: 'Task', labels: ['!foo'] }, items.e)).toBe(true);
});

/**
 * Boolean expressions.
 */
test('Matches boolean expressions.', () => {
  let matcher = new Matcher();

  let context = {
    userId: 'a',
    buckets: ['a']
  };
  let root = {};

  let filter = {
    expr: {
      op: 'OR',
      expr: [
        { field: 'owner',     ref: '$CONTEXT.userId' },
        { field: 'assignee',  ref: '$CONTEXT.userId' }
      ]
    }
  };

  // TODO(burdon): Implement tree.
  expect(matcher.matchItems(context, root, filter, items)).toHaveLength(3);
});

/**
 * References.
 */
test('Matches references.', () => {
  let matcher = new Matcher();

  let context = {
    userId: 'a',
    buckets: ['a']
  };
  let root = {
    id: 'b'
  };

  expect(matcher.matchItems(
    context, root, { expr: { field: 'owner', ref: '$CONTEXT.userId'} }, items)).toHaveLength(2);

  expect(matcher.matchItems(
    context, root, { expr: { field: 'assignee', ref: 'id'} }, items)).toHaveLength(1);
});

/**
 * Comparators
 */
test('Matches comparators.', () => {
  let matcher = new Matcher();

  let context = {};
  let root = {};

  let now = moment().unix();
  let anHourAgo = moment().subtract(1, 'hr').unix();

  let item1 = {
    modified: anHourAgo
  };

  expect(matcher.matchItem(context, root,
    { expr: { comp: 'GTE', field: 'modified', value: { timestamp: anHourAgo } } }, item1)).toBe(true);
  expect(matcher.matchItem(context, root,
    { expr: { comp: 'GT',  field: 'modified', value: { timestamp: anHourAgo } } }, item1)).toBe(false);

  expect(matcher.matchItem(context, root,
    { expr: { comp: 'GT',  field: 'modified', value: { timestamp: now } } }, item1)).toBe(false);
  expect(matcher.matchItem(context, root,
    { expr: { comp: 'GT',  field: 'modified', value: { timestamp: -3600 * 2 } } }, item1)).toBe(true);
});
