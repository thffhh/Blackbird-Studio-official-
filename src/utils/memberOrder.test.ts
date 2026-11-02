import test from 'node:test';
import assert from 'node:assert/strict';
import { sortMembersByOrder, moveMember, getNextDisplayOrder } from './memberOrder.ts';
import { Member } from '../types/index.ts';

const mockMembers: Member[] = [
  {
    id: 'm1',
    name: 'Sifat (BlackBird)',
    rank: 'Owner',
    avatarUrl: '/avatars/1.jpg',
    hobbies: 'Voice acting, Sound design',
    bio: 'Founder and main director.',
    joiningDate: '2023-01-15',
    isActive: true,
    displayOrder: 1
  },
  {
    id: 'm2',
    name: 'Tanvir',
    rank: 'Admin',
    avatarUrl: '/avatars/2.jpg',
    hobbies: 'Dubbing, Anime translation',
    bio: 'Production lead.',
    joiningDate: '2023-04-10',
    isActive: true,
    displayOrder: 2
  },
  {
    id: 'm3',
    name: 'Arafat',
    rank: 'Immortal',
    avatarUrl: '/avatars/3.jpg',
    hobbies: 'Voice modulation',
    bio: 'Veteran voice actor.',
    joiningDate: '2023-06-20',
    isActive: true,
    displayOrder: 3
  }
];

test('sortMembersByOrder sorts strictly by displayOrder', () => {
  const shuffled: Member[] = [
    { ...mockMembers[2], displayOrder: 10 },
    { ...mockMembers[0], displayOrder: 2 },
    { ...mockMembers[1], displayOrder: 5 }
  ];
  const sorted = sortMembersByOrder(shuffled);
  assert.equal(sorted[0].id, 'm1');
  assert.equal(sorted[1].id, 'm2');
  assert.equal(sorted[2].id, 'm3');
});

test('moveMember moves a member to top', () => {
  const result = moveMember(mockMembers, 'm3', 'top');
  assert.equal(result[0].id, 'm3');
  assert.equal(result[0].displayOrder, 1);
  assert.equal(result[1].id, 'm1');
  assert.equal(result[1].displayOrder, 2);
  assert.equal(result[2].id, 'm2');
  assert.equal(result[2].displayOrder, 3);
});

test('moveMember moves a member down', () => {
  const result = moveMember(mockMembers, 'm1', 'down');
  assert.equal(result[0].id, 'm2');
  assert.equal(result[1].id, 'm1');
  assert.equal(result[2].id, 'm3');
});

test('getNextDisplayOrder appends at the bottom', () => {
  assert.equal(getNextDisplayOrder(mockMembers), 4);
  assert.equal(getNextDisplayOrder([]), 1);
});
