# AI Options for a Browser Card Game

A computer opponent can run entirely in the browser. The recommended design is to keep the game rules independent from the interface, let the AI select an ordinary legal move, and perform expensive searches inside a Web Worker.

## Recommended Architecture

```text
React or Phaser interface
        ↓ player move
Pure game engine
        ↓ updated state
Web Worker running the AI
        ↓ selected legal move
Game engine validates and applies move
        ↓
Interface renders the result
```

The game engine should provide pure, testable functions such as:

```ts
function getLegalMoves(state: GameState): Move[];
function applyMove(state: GameState, move: Move): GameState;
function isGameOver(state: GameState): boolean;
function scoreState(state: GameState): number;
```

Both human and computer players should use these same rules. The AI should return a `Move`; it should not manipulate cards or interface elements directly.

## AI Approaches

### Heuristic AI

Score each legal move and select the best one. This is the easiest option for a prototype and is usually fast enough to run immediately.

**Advantages:**

- Straightforward to implement and debug
- Fast and predictable
- Easy to tune for different play styles

**Tradeoffs:**

- Primarily considers immediate consequences
- Strategic knowledge must be encoded manually

### Minimax with Alpha-Beta Pruning

Simulate several turns into the future while assuming both players make their best moves.

**Best for:**

- Deterministic games
- Perfect-information games
- Games with a manageable number of legal moves

Search cost grows rapidly, so browser implementations should use a maximum depth or a calculation deadline.

### Monte Carlo Tree Search

Simulate many possible games and favour moves that produce more wins.

**Best for:**

- Large decision trees
- Games whose positions are difficult to score manually
- Games involving randomness
- Hidden-information games when unknown cards are appropriately sampled

MCTS can use whatever time budget is available, but its results vary and its implementation is more involved.

## Relevant Libraries

| Library           | Provides                                                                                                                                  | Best use                                                        | Main tradeoff                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **boardgame.io**  | Turn and state management, deterministic randomness, game logs, a random bot, and an MCTS bot                                             | Starting a turn-based card game from scratch                    | It influences the architecture of the entire game rather than supplying only an AI algorithm. Its published npm release is several years old, so compatibility should be tested. |
| **minimaxer**     | Minimax, negamax, alpha-beta pruning, iterative deepening, fixed-depth and time-limited searches, move ordering, and randomized selection | Adding search to an existing TypeScript game engine             | It has a small ecosystem. Review and pin the dependency before adopting it. The repository currently lists the npm package name as `minimaxmer`, with an extra `m`.              |
| **Comlink**       | A convenient RPC-style interface for Web Workers                                                                                          | Preventing AI calculations from freezing the browser interface  | It simplifies worker communication but does not provide an AI algorithm.                                                                                                         |
| **TensorFlow.js** | Browser-based neural-network inference and training                                                                                       | Experimental learned agents backed by substantial training data | It adds far more complexity than most card games require and does not automatically produce a capable opponent.                                                                  |

Regardless of the library, the game must still define legal moves, state transitions, terminal conditions, and a position evaluation or simulation policy.

## Web Workers

Search should run in a Web Worker so card dragging and animations remain responsive:

```ts
// ai.worker.ts
import { chooseMove } from './ai';

self.onmessage = (event: MessageEvent<GameState>) => {
  const move = chooseMove(event.data);
  self.postMessage(move);
};
```

```ts
// Application thread
const aiWorker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
  type: 'module',
});

aiWorker.postMessage(state);

aiWorker.onmessage = ({ data: move }: MessageEvent<Move>) => {
  // Validate the move through the game engine before applying it.
  dispatch({ type: 'PLAY_MOVE', move });
};
```

Comlink can replace explicit `postMessage` handling with asynchronous method calls if desired.

## Hidden Information

The AI must not receive private information merely because it is present in application memory. Construct a player-visible state containing only:

- The AI player's own hand
- Public cards and previous moves
- Revealed player information
- Deck information the player could reasonably know

For simulations, unknown cards can be sampled and distributed among possible hands. Generic minimax and MCTS libraries do not prevent accidental cheating automatically.

## Difficulty Levels

Difficulty can be adjusted without creating separate AI implementations:

- **Easy:** choose randomly or deliberately overlook some strong moves.
- **Normal:** use heuristic scoring with a shallow search.
- **Hard:** search deeper or perform more MCTS simulations.
- **Expert:** use a larger time budget and stronger evaluation rules.

Controlled randomness prevents the opponent from making the same decisions in every game. During development, a seeded random-number generator makes AI behaviour reproducible.

## Recommended Path

1. Begin with a heuristic that scores every legal move.
2. Add a shallow minimax search if future consequences are important.
3. Run the search in a Web Worker, optionally using Comlink.
4. Consider boardgame.io if the project has not yet established its game architecture and its broader turn-management features are useful.
5. Consider MCTS if the branching factor, randomness, or hidden information makes minimax impractical.
6. Use TensorFlow.js only if experimentation with trained models is an explicit project goal.

For a typical browser card game with a custom React interface, a pure TypeScript rules engine, shallow minimax or heuristic search, and Comlink-backed Web Worker is the most practical combination.

## References

- [boardgame.io bot tutorial](https://boardgame.io/documentation/tutorial.html)
- [boardgame.io npm package](https://www.npmjs.com/package/boardgame.io)
- [minimaxer repository](https://github.com/domw95/minimaxer)
- [Comlink repository](https://github.com/GoogleChromeLabs/comlink)
- [TensorFlow.js](https://www.tensorflow.org/js)
