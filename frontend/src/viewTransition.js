import { VIEWS } from './urlState'

// Tabs sit in this order on screen, so the grid slides toward the tab that was picked
const VIEW_ORDER = [VIEWS.all, VIEWS.favorites]

export function viewDirection(from, to) {
  return Math.sign(VIEW_ORDER.indexOf(to) - VIEW_ORDER.indexOf(from))
}
