import styles from './AriaDescription.module.css';

type Props = React.PropsWithChildren<{
  id: string;
}>;

export function AriaDescription({ id, children }: Props) {
  return (
    <div id={id} className={styles.ariaDescription}>
      {children}
    </div>
  );
}
