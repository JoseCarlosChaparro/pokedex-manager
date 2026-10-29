// Padding of a Pokémon card for a density. The collection card and the pack reveal both use it, so the
// hand-off from the reveal to the collection card has no jump.
export const cardPadding = (density) => (density === 'compact' ? 'p-2' : 'p-3')
