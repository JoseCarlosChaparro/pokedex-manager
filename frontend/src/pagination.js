export const ELLIPSIS = '…'
const NEIGHBOURS = 1
const FULL_LIST_LIMIT = 7

// [1, …, 9, 10, 11, …, 55]: first, last and the pages around the current one
export function pageItems(current, total) {
  if (total <= FULL_LIST_LIMIT) return Array.from({ length: total }, (_, index) => index + 1)
  const start = Math.max(2, Math.min(current - NEIGHBOURS, total - 2 * NEIGHBOURS))
  const end = Math.min(total - 1, Math.max(current + NEIGHBOURS, 1 + 2 * NEIGHBOURS))
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index)
  return [1, ...(start > 2 ? [ELLIPSIS] : []), ...middle, ...(end < total - 1 ? [ELLIPSIS] : []), total]
}
