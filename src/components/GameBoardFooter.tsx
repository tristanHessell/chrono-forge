import clsx from 'clsx';
import type { MessageValue } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { CommandAction, PlacedCard, PlayerId } from '../game';
import gameBoardStyles from '../GameBoard.module.css';
import type { PlayerSetup } from '../playerSetup';
import controlsStyles from './Controls.module.css';
import { GameResults } from './GameResults';

type GameBoardFooterProps = {
  activeOwner: PlayerId;
  activePlayer: PlayerSetup;
  commandAction: CommandAction | undefined;
  commandMode: 'replace' | 'restore' | null;
  commandTargetCount: number;
  commandTargetId: null | string;
  deckCount: number;
  draggedCard: boolean;
  finished: boolean;
  onChooseCommandMode: (mode: 'replace' | 'restore') => void;
  pending: boolean;
  played: PlacedCard[];
  playerIds: PlayerId[];
  selectedCardId: null | string;
};

export function GameBoardFooter({
  activeOwner,
  activePlayer,
  commandAction,
  commandMode,
  commandTargetCount,
  commandTargetId,
  deckCount,
  draggedCard,
  finished,
  onChooseCommandMode,
  pending,
  played,
  playerIds,
  selectedCardId,
}: GameBoardFooterProps) {
  const intl = useIntl();

  return (
    <footer className={gameBoardStyles.footer}>
      {finished ? (
        <GameResults played={played} playerIds={playerIds} />
      ) : (
        <p className={clsx(commandAction && gameBoardStyles.commandPrompt)}>
          {commandAction
            ? commandAction === 'event-reclaim'
              ? commandMode === null
                ? intl.formatMessage({
                    defaultMessage:
                      'Choose whether to replace an Event or restore a removed Event.',
                    id: 'command.event-reclaim.chooseMode',
                  })
                : commandTargetCount === 0
                  ? intl.formatMessage({
                      defaultMessage:
                        'No legal targets for this choice. Select another card or choose another mode.',
                      id: 'command.event-reclaim.noTargets',
                    })
                  : commandMode === 'replace'
                    ? commandTargetId
                      ? intl.formatMessage({
                          defaultMessage:
                            'Choose an Event card from your hand to replace the selected Event.',
                          id: 'command.event-reclaim.chooseReplacement',
                        })
                      : intl.formatMessage({
                          defaultMessage:
                            'Choose an Event on the board to replace.',
                          id: 'command.event-reclaim.chooseReplaceTarget',
                        })
                    : intl.formatMessage({
                        defaultMessage: 'Choose a removed Event to restore.',
                        id: 'command.event-reclaim.chooseRestoreTarget',
                      })
              : !commandTargetId
                ? commandTargetCount
                  ? intl.formatMessage({
                      defaultMessage:
                        'Choose an Event card on the board. The starting card cannot be targeted.',
                      id: 'command.choose',
                    })
                  : intl.formatMessage({
                      defaultMessage:
                        'No legal targets for this card. Select another card or discard it.',
                      id: 'command.noTargets',
                    })
                : commandAction === 'time-jump'
                  ? intl.formatMessage({
                      defaultMessage:
                        'Choose a highlighted empty position or removed Event to complete Time Jump.',
                      id: 'command.jumpDestination',
                    })
                  : intl.formatMessage({
                      defaultMessage:
                        'Choose a highlighted second Event card to complete Time Swap.',
                      id: 'command.swapDestination',
                    })
            : pending
              ? intl.formatMessage({
                  defaultMessage:
                    'Drag it to another slot, back to your hand, or confirm.',
                  id: 'status.pending',
                })
              : draggedCard
                ? intl.formatMessage({
                    defaultMessage: 'Drop the card on a highlighted position.',
                    id: 'status.dragging',
                  })
                : selectedCardId
                  ? intl.formatMessage({
                      defaultMessage:
                        'Choose a slot above, below, or beside a card.',
                      id: 'status.selected',
                    })
                  : activeOwner === '0'
                    ? // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                      intl.formatMessage<{ readonly count: number | bigint }>(
                        {
                          defaultMessage:
                            'Your turn — {count, plural, one {# card remains in the deck} other {# cards remain in the deck}}',
                          id: 'status.yourTurn',
                        },
                        { count: deckCount },
                      )
                    : intl.formatMessage<{
                        // eslint-disable-next-line perfectionist/sort-union-types -- TODO if we sort this alphabetically then FormatJS complains
                        readonly count: number | bigint;
                        readonly name: MessageValue;
                      }>(
                        {
                          defaultMessage:
                            "{name}'s turn — {count, plural, one {# card remains in the deck} other {# cards remain in the deck}}",
                          id: 'status.playerTurn',
                        },
                        { count: deckCount, name: activePlayer.name },
                      )}
        </p>
      )}
      {!finished && commandAction === 'event-reclaim' && (
        <>
          <button
            aria-pressed={commandMode === 'replace'}
            className={controlsStyles.historyButton}
            onClick={() => {
              onChooseCommandMode('replace');
            }}
            type="button"
          >
            <FormattedMessage
              defaultMessage="Replace Event"
              id="command.event-reclaim.replaceMode"
            />
          </button>
          <button
            aria-pressed={commandMode === 'restore'}
            className={controlsStyles.historyButton}
            onClick={() => {
              onChooseCommandMode('restore');
            }}
            type="button"
          >
            <FormattedMessage
              defaultMessage="Restore Event"
              id="command.event-reclaim.restoreMode"
            />
          </button>
        </>
      )}
    </footer>
  );
}
