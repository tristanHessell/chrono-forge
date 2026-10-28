import styles from './AriaDescription.module.css';

type Props = React.PropsWithChildren<{
  id: string;
}>;

export function AriaDescription({ children, id }: Props) {
  return (
    <div className={styles.ariaDescription} id={id}>
      {children}
    </div>
  );
}
