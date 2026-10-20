import clsx from 'clsx';

import type { PlayerId } from '../game';
import type { PlayerType } from '../playerSetup';
import ownershipStyles from './Ownership.module.css';
import playerAvatarStyles from './PlayerAvatar.module.css';

type Props = {
  owner: PlayerId;
  type: PlayerType;
  name: string;
};

export function PlayerAvatar({ owner, type, name }: Props) {
  return (
    <span
      aria-label={`${name}, ${type === 'computer' ? 'AI' : 'human'}`}
      className={clsx(
        playerAvatarStyles.avatar,
        ownershipStyles[`owner${owner}`],
      )}
      role="img"
    >
      {type === 'computer' ? (
        <svg aria-hidden="true" viewBox="0 0 48 48">
          <path d="M24 8v5M20 8h8M12 17h24v22H12z" />
          <circle cx="19" cy="26" r="3" />
          <circle cx="29" cy="26" r="3" />
          <path d="M19 34h10M8 23v10M40 23v10" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 48 48">
          <circle cx="24" cy="17" r="9" />
          <path d="M9 42c1-10 6-15 15-15s14 5 15 15" />
        </svg>
      )}
    </span>
  );
}
