import { useEffect, useRef, useState } from 'react';
import type { IslandServices } from '@island/persistence';
import { errorMessage } from './UI';

/** Prior account-deletion consent survives logout. This notice has no current-account actions. */
export function DeletionRecoveryNotice({ recovery }: { recovery: IslandServices['deletionRecovery'] }) {
  const [states, setStates] = useState(recovery.state);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const unsubscribe = recovery.subscribe(next => setStates([...next]));
    return () => { active.current = false; unsubscribe(); };
  }, [recovery]);
  const act = async (userId: string, complete: boolean) => {
    setBusy(true); setError('');
    try {
      if (complete) await recovery.dismiss(userId);
      else await recovery.retryLocal(userId);
    } catch (cause) { if (active.current) setError(errorMessage(cause)); }
    finally { if (active.current) setBusy(false); }
  };
  return <>{states.map(state => <aside className="sync-banner sync-error" role="status" key={state.userId}>
    <span>
      {state.local === 'complete' ? '以前に削除を依頼したアカウントのデータを、この端末から削除しました。' : '以前に削除を依頼したアカウントのデータが、この端末に残っています。'}
      {state.cloud === 'unknown' && <span className="sync-detail">クラウド側の削除完了は確認できていません。</span>}
      {state.error && <span className="sync-detail">{state.error}</span>}
    </span>
    <button type="button" disabled={busy} onClick={() => { void act(state.userId, state.local === 'complete'); }}>
      {state.local === 'complete' ? '確認した' : '端末データの削除を再試行'}
    </button>
  </aside>)}{error && <p className="inline-error" role="alert">{error}</p>}</>;
}
