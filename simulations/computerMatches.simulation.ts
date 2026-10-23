import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Client } from 'boardgame.io/client';
import { expect, it } from 'vitest';

import { loadCardCatalog } from '../src/cardCatalog';
import { chooseComputerAction, type ComputerAction } from '../src/computer';
import { CardGame } from '../src/game';
import { isValidBoard } from '../src/manipulationRules';
import { calculateScoreBreakdown } from '../src/scoring';
import { countActivelyDiscardedCards, playerLabel } from './statistics';

const GAME_COUNT = 100;
const MAX_MOVES = 150;
const numPlayers = Number(process.env.SIMULATION_PLAYERS ?? 2);

if (!Number.isInteger(numPlayers) || numPlayers < 2 || numPlayers > 4) {
  throw new Error('SIMULATION_PLAYERS must be 2, 3, or 4.');
}

type Score = { base: number; bonus: number; total: number };
type RecordedMove = { player: string; action: ComputerAction };
type MatchResult = {
  game: number;
  seed: string;
  completed: boolean;
  error?: string;
  winners: string[];
  scores: Record<string, Score>;
  rounds: number;
  turns: number;
  actions: number;
  playedCards: number;
  discardedCards: number;
  manipulations: number;
  remainingCards: { deck: number; hands: Record<string, number> };
  durationMs: number;
  moves: RecordedMove[];
};

function playMatch (game: number, seed: string): MatchResult {
  const started = performance.now();
  const client = Client({ game: { ...CardGame, seed }, numPlayers });
  const expectedCount = loadCardCatalog().deck.length + 1;
  const moves: RecordedMove[] = [];
  let error: string | undefined;

  try {
    while (!client.getState()!.G.roundOver) {
      if (moves.length >= MAX_MOVES) {
        throw new Error(`Exceeded ${MAX_MOVES} moves without finishing`);
      }

      const before = client.getState()!;
      const owner = before.G.playerIds.find(
        (id) => id === before.ctx.currentPlayer,
      )!;
      const action = chooseComputerAction(before.G, owner);

      if (!action) {
        throw new Error(
          `${playerLabel(before.ctx.currentPlayer)} has no action`,
        );
      }

      moves.push({ player: before.ctx.currentPlayer, action });

      if (action.type === 'play') {
        client.moves.playCard(action.cardId, action.position);

        if (client.getState()!.G.pending?.id !== action.cardId) {
          throw new Error('Event placement was rejected');
        }
      } else if (action.type === 'confirm') {
        client.moves.confirmPlacement();

        if (
          !client
            .getState()!
            .G.played.some((card) => card.id === before.G.pending?.id) ||
          client.getState()!.G.pending
        ) {
          throw new Error('Event confirmation was rejected');
        }
      } else {
        if (action.type === 'discard') {
          client.moves.discardCard(action.cardId);
        } else {
          client.moves.manipulate(
            action.cardId,
            action.targetId,
            action.destination,
          );
        }
        if (
          client.getState()!.G.discarded.length !==
          before.G.discarded.length +
            1 +
            (before.G.played.length - client.getState()!.G.played.length)
        ) {
          throw new Error(`${action.type} action was rejected`);
        }
      }

      const { G, ctx } = client.getState()!;
      const cards = [
        ...G.played,
        ...Object.values(G.hands).flat(),
        ...G.deck,
        ...G.discarded,
      ];

      if (
        cards.length !== expectedCount ||
        new Set(cards.map((card) => card.id)).size !== expectedCount
      ) {
        throw new Error('Cards were lost or duplicated');
      }
      if (!isValidBoard(G.played)) {
        throw new Error('The board is no longer legal');
      }
      if (!G.roundOver && !G.hands[ctx.currentPlayer].length) {
        throw new Error('An empty-handed player received a turn');
      }
    }

    const { G } = client.getState()!;

    if (
      G.pending ||
      Object.values(G.hands).some((hand) => hand.length) ||
      G.deck.length
    ) {
      throw new Error('The game ended with cards still to play');
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  } finally {
    client.stop();
  }

  const { G, ctx } = client.getState()!;
  const breakdown = calculateScoreBreakdown(G.played);
  const scores: Record<string, Score> = Object.fromEntries(
    G.playerIds.map((id) => [
      id,
      breakdown[id] ?? { base: 0, bonus: 0, total: 0 },
    ]),
  );
  const completed = G.roundOver && error === undefined;
  const highest = Math.max(
    ...Object.values(scores).map((score) => score.total),
  );

  return {
    game,
    seed,
    completed,
    ...(error ? { error } : {}),
    winners: completed
      ? G.playerIds.filter((id) => scores[id].total === highest)
      : [],
    scores,
    rounds: G.round,
    turns: ctx.turn,
    actions: moves.filter(({ action }) => action.type !== 'play').length,
    playedCards: G.played.length - 1,
    discardedCards: countActivelyDiscardedCards(G.discarded, moves),
    manipulations: moves.filter(({ action }) => action.type === 'manipulate')
      .length,
    remainingCards: {
      deck: G.deck.length,
      hands: Object.fromEntries(
        Object.entries(G.hands).map(([id, hand]) => [id, hand.length]),
      ),
    },
    durationMs: Math.round(performance.now() - started),
    moves,
  };
}

it(`records and summarises 100 games with ${numPlayers} computers (manual only)`, async () => {
  const batchStarted = performance.now();
  const startedAt = new Date().toISOString();
  const baseSeed =
    process.env.SIMULATION_SEED ||
    `computer-matches-${numPlayers}p-${startedAt}`;
  const matches: MatchResult[] = [];

  for (let game = 1; game <= GAME_COUNT; game += 1) {
    matches.push(playMatch(game, `${baseSeed}-${game}`));

    if (game % 10 === 0) {
      console.log(
        `Completed ${game}/${GAME_COUNT} simulations (${numPlayers} players)`,
      );
    }
  }

  const completed = matches.filter((match) => match.completed);
  const playerIds = Array.from({ length: numPlayers }, (_, index) =>
    String(index),
  );
  const average = (value: (match: MatchResult) => number) =>
    completed.length
      ? Number(
          (
            completed.reduce((sum, match) => sum + value(match), 0) /
            completed.length
          ).toFixed(2),
        )
      : 0;
  const playerStats = Object.fromEntries(
    playerIds.map((id) => [
      id,
      {
        wins: completed.filter(
          (match) => match.winners.length === 1 && match.winners[0] === id,
        ).length,
        tiedWins: completed.filter(
          (match) => match.winners.length > 1 && match.winners.includes(id),
        ).length,
        averageBase: average((match) => match.scores[id].base),
        averageBonus: average((match) => match.scores[id].bonus),
        averageScore: average((match) => match.scores[id].total),
      },
    ]),
  );
  const summary = {
    numPlayers,
    games: GAME_COUNT,
    completed: completed.length,
    failed: matches.length - completed.length,
    draws: completed.filter((match) => match.winners.length > 1).length,
    playerStats,
    averageRounds: average((match) => match.rounds),
    averageTurns: average((match) => match.turns),
    averageActions: average((match) => match.actions),
    averagePlayedCards: average((match) => match.playedCards),
    averageDiscardedCards: average((match) => match.discardedCards),
    averageManipulations: average((match) => match.manipulations),
    averageGameMs: average((match) => match.durationMs),
    wallClockMs: Math.round(performance.now() - batchStarted),
  };
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseSeed,
    playerLabels: Object.fromEntries(
      playerIds.map((id) => [id, playerLabel(id)]),
    ),
    roundDefinition:
      'One rotation through the player seats; count includes the final partial round. Empty hands are skipped.',
    discardedCardsDefinition:
      'Cards explicitly discarded from a hand. Excludes used Manipulations and overwritten Events.',
    summary,
    matches,
  };
  const directory = resolve('simulation-results');
  const basename = `computer-matches-${numPlayers}p-${startedAt.replace(/[:.]/g, '-')}`;
  const jsonPath = resolve(directory, `${basename}.json`);
  const markdownPath = resolve(directory, `${basename}.md`);
  const markdown = [
    `# ${numPlayers}-player computer simulation`,
    '',
    `Started: ${startedAt}`,
    `Base seed: ${baseSeed}`,
    '',
    `Completed: ${summary.completed}/${GAME_COUNT}. Failed: ${summary.failed}. Draws: ${summary.draws}.`,
    `Total simulation wall-clock time: ${(summary.wallClockMs / 1000).toFixed(2)} seconds (${summary.wallClockMs} ms).`,
    `Average rounds per game: ${summary.averageRounds}. Average turns: ${summary.averageTurns}.`,
    report.roundDefinition,
    'Player 1 starts every game; all seats use the same computer strategy.',
    '',
    'Averages include completed games only. Wins exclude tied games; tied wins count each tied leader.',
    '',
    '| Player | Wins | Tied wins | Average base | Average bonus | Average score |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...playerIds.map((id) => {
      const stats = playerStats[id];

      return `| ${playerLabel(id)} | ${stats.wins} | ${stats.tiedWins} | ${stats.averageBase} | ${stats.averageBonus} | ${stats.averageScore} |`;
    }),
    '',
    `Average game wall time: ${summary.averageGameMs} ms. Actions: ${summary.averageActions}.`,
    `Average played cards: ${summary.averagePlayedCards}. Actively discarded cards: ${summary.averageDiscardedCards}.`,
    report.discardedCardsDefinition,
    `Average Manipulations used: ${summary.averageManipulations}.`,
    '',
    '## Individual games',
    '',
    `| Game | Seed | Result | Rounds | ${playerIds.map((id) => `${playerLabel(id)} points`).join(' | ')} |`,
    `| ---: | --- | --- | ---: | ${playerIds.map(() => '---:').join(' | ')} |`,
    ...matches.map(
      (match) =>
        `| ${match.game} | ${match.seed.replaceAll('|', '\\|').replaceAll('\n', ' ')} | ${match.error ? `Failed: ${match.error}` : match.winners.length > 1 ? `Tie: ${match.winners.map(playerLabel).join(', ')}` : `${playerLabel(match.winners[0])} wins`} | ${match.rounds} | ${playerIds.map((id) => match.scores[id].total).join(' | ')} |`,
    ),
    '',
    'The JSON report contains seeds, score breakdowns, action histories, timings, and failures.',
    '',
  ].join('\n');

  await mkdir(directory, { recursive: true });
  await writeFile(jsonPath, JSON.stringify(report, null, 2) + '\n');
  await writeFile(markdownPath, markdown);
  console.table(
    Object.fromEntries(
      playerIds.map((id) => [playerLabel(id), playerStats[id]]),
    ),
  );
  console.log(
    `${numPlayers} players: ${summary.completed}/${GAME_COUNT} completed; ${summary.draws} draws; ${summary.failed} failures.`,
  );
  console.log(
    `Total wall-clock time: ${(summary.wallClockMs / 1000).toFixed(2)}s; average rounds: ${summary.averageRounds}.`,
  );
  console.log(`Reports: ${jsonPath}\n${markdownPath}`);
  expect(
    summary.completed,
    'See the recorded failures in the simulation report',
  ).toBe(GAME_COUNT);
});
