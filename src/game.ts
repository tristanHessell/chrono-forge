import type { Game } from 'boardgame.io'

export type Card = {
  id: string
  rank: string
  suit: string
}

export type CardGameState = {
  hand: Card[]
  played: Card[]
}

const starterDeck: Card[] = [
  { id: 'ace-hearts', rank: 'A', suit: '♥' },
  { id: 'king-spades', rank: 'K', suit: '♠' },
  { id: 'queen-diamonds', rank: 'Q', suit: '♦' },
  { id: 'jack-clubs', rank: 'J', suit: '♣' },
]

export const CardGame: Game<CardGameState> = {
  name: 'card-table',

  setup: () => ({
    hand: starterDeck,
    played: [],
  }),

  moves: {
    playCard: ({ G }, cardId: string) => {
      const card = G.hand.find((candidate) => candidate.id === cardId)

      if (!card) return

      G.hand = G.hand.filter((candidate) => candidate.id !== cardId)
      G.played.push(card)
    },
  },

  endIf: ({ G }) => {
    if (G.hand.length === 0) {
      return { message: 'Every card has been played.' }
    }
  },
}
