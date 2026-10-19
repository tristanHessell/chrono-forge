import { useIntl } from 'react-intl';

import messages from './en.json';

export type MessageId = keyof typeof messages;

export function useMessages() {
  const intl = useIntl();

  return (
    id: MessageId,
    values?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
  ) => intl.formatMessage({ id }, values);
}
