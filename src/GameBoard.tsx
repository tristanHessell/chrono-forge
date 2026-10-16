import type { BoardProps } from 'boardgame.io/react'
import type { CardGameState } from './game'

type CardGameMoves = {
  playCard: (cardId: string) => void
}

export function GameBoard({ G, ctx, moves, reset }: BoardProps<CardGameState>) {
  const gameMoves = moves as CardGameMoves
  const finished = Boolean(ctx.gameover)

  return (
    <main className="game-shell">
      <header>
        <p className="eyebrow">boardgame.io starter</p>
        <h1>Card Table</h1>
        <p className="intro">
          Pick a card to play it. The rules and state transitions live in the
          boardgame.io game definition.
        </p>
      </header>

      <section className="table" aria-label="Card table">
        <div className="play-area">
          <p className="area-label">Played cards</p>
          <div className="card-row">
            {G.played.length === 0 ? (
              <p className="empty-state">The table is waiting for a card.</p>
            ) : (
              G.played.map((card) => (
                <div className="card" data-suit={card.suit} key={card.id}>
                  <span>{card.rank}</span>
                  <strong>{card.suit}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hand">
          <p className="area-label">Your hand</p>
          <div className="card-row">
            {G.hand.map((card) => (
              <button
                className="card playable"
                data-suit={card.suit}
                key={card.id}
                onClick={() => gameMoves.playCard(card.id)}
                type="button"
              >
                <span>{card.rank}</span>
                <strong>{card.suit}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <p>{finished ? 'Round complete.' : `${G.hand.length} cards remaining`}</p>
        <button className="reset" onClick={reset} type="button">
          New round
        </button>
      </footer>
    </main>
  )
}
