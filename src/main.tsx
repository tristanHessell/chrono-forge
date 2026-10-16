import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Client } from 'boardgame.io/react'
import { GameBoard } from './GameBoard'
import { CardGame } from './game'
import './styles.css'

const CardGameClient = Client({
  game: CardGame,
  board: GameBoard,
  debug: import.meta.env.DEV,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CardGameClient />
  </StrictMode>,
)
