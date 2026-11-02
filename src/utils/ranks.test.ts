import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidRank, getRankBadgeStyle } from './ranks.ts';
import { OFFICIAL_RANKS } from '../types/index.ts';

test('validates only the official 9 ranks', () => {
  assert.equal(OFFICIAL_RANKS.length, 9);
  assert.deepEqual(OFFICIAL_RANKS, [
    'D', 'C', 'B', 'A', 'S', 'Immortal', 'Moderator', 'Admin', 'Owner'
  ]);

  assert.equal(isValidRank('Owner'), true);
  assert.equal(isValidRank('Admin'), true);
  assert.equal(isValidRank('Immortal'), true);
  assert.equal(isValidRank('S'), true);
  assert.equal(isValidRank('D'), true);
  
  // Non-existent ranks must be rejected
  assert.equal(isValidRank('SS'), false);
  assert.equal(isValidRank('VIP'), false);
  assert.equal(isValidRank('SuperAdmin'), false);
  assert.equal(isValidRank(''), false);
});

test('returns custom badge style for each rank', () => {
  const ownerStyle = getRankBadgeStyle('Owner');
  assert.match(ownerStyle.text, /yellow/i);
  assert.equal(ownerStyle.label, 'Owner');

  const immortalStyle = getRankBadgeStyle('Immortal');
  assert.match(immortalStyle.text, /cyan/i);
  assert.equal(immortalStyle.label, 'Immortal');

  const rankDStyle = getRankBadgeStyle('D');
  assert.equal(rankDStyle.label, 'Rank D');
});
