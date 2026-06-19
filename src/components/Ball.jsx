import { ballClass } from '../utils/lotto';

export default function Ball({ n, small = false, bonus = false }) {
  const cls = [
    'ball',
    ballClass(n),
    small ? 'ball-sm' : '',
    bonus ? 'bonus-ball' : '',
  ].filter(Boolean).join(' ');

  return <div className={cls}>{n}</div>;
}
