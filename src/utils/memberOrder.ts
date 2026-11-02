import { Member } from '../types/index.ts';

/**
 * Returns members sorted strictly by displayOrder in ascending order.
 * Never sorts by name, joining date, or rank.
 */
export function sortMembersByOrder(members: Member[]): Member[] {
  return [...members].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Calculates the next display order index so new members are strictly appended at the bottom.
 */
export function getNextDisplayOrder(members: Member[]): number {
  if (members.length === 0) return 1;
  const maxOrder = Math.max(...members.map((m) => m.displayOrder || 0));
  return maxOrder + 1;
}

/**
 * Moves a member within the list to 'up' | 'down' | 'top' | 'bottom'
 * and returns the re-indexed array with contiguous displayOrder values (1, 2, 3...).
 */
export function moveMember(
  members: Member[],
  memberId: string,
  direction: 'up' | 'down' | 'top' | 'bottom'
): Member[] {
  const sorted = sortMembersByOrder(members);
  const index = sorted.findIndex((m) => m.id === memberId);
  if (index === -1) return members;

  const target = sorted[index];
  const listWithoutTarget = sorted.filter((m) => m.id !== memberId);

  let newIndex = index;
  if (direction === 'top') {
    newIndex = 0;
  } else if (direction === 'bottom') {
    newIndex = listWithoutTarget.length;
  } else if (direction === 'up') {
    newIndex = Math.max(0, index - 1);
  } else if (direction === 'down') {
    newIndex = Math.min(listWithoutTarget.length, index + 1);
  }

  listWithoutTarget.splice(newIndex, 0, target);

  // Re-index display orders cleanly
  return listWithoutTarget.map((m, idx) => ({
    ...m,
    displayOrder: idx + 1
  }));
}

/**
 * Re-indexes a list of members after a custom manual reordering
 */
export function reindexMembers(members: Member[]): Member[] {
  return members.map((m, idx) => ({
    ...m,
    displayOrder: idx + 1
  }));
}
