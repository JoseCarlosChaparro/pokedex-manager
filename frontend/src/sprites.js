const SPRITES_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

// PokéAPI sprite URLs follow the Pokémon id, so lists don't need one detail request per card
export const spriteUrl = (id) => `${SPRITES_BASE_URL}/${id}.png`
export const artworkUrl = (id) => `${SPRITES_BASE_URL}/other/official-artwork/${id}.png`
