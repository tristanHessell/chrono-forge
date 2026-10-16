# Browser Card Game

A browser-based card game starter built with React, TypeScript, Vite, and
[boardgame.io](https://boardgame.io/).

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Commands

- `npm run dev` starts the development server.
- `npm run build` type-checks and creates a production build.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build locally.

## Project structure

- `src/game.ts` defines boardgame.io state, moves, and end conditions.
- `src/GameBoard.tsx` renders the current game state and dispatches moves.
- `src/main.tsx` connects the game definition to the React client.

The included single-player card table is deliberately small: it provides a
working foundation on which to add the real deck, rules, turn structure, and
multiplayer or computer opponents.
