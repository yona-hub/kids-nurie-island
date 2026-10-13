import { useEffect, useRef, useState } from 'react';
import type { UnreadableProject } from '@island/persistence';
import { services, useApp } from '../app-context';
import { useAccountScope, type AccountScope } from '../use-account-scope';
import { Modal, downloadBlob, errorMessage, navigate } from './UI';

export function UnreadableWorksHint({ count = 0 }: { count?: number }) {
  if (!count) return null;
  return <aside className="inline-error" role="status">
    <p>読み取れない作品が{count}件あります。元データはこの端末に残しています。</p>
    <button className="button" onClick={() => navigate('/settings')}>設定で確認する</button>
  </aside>;
}

export function UnreadableWorksPanel() {
  const { toast } = useApp();
  const ownerId = services.auth.session?.userId ?? '';
  const captureScope = useAccountScope(ownerId);
  const [records, setRecords] = useState<UnreadableProject[]>([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<UnreadableProject | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef<AccountScope | null>(null);
  useEffect(() => {
    let request = 0, owner = services.auth.session?.userId;
    const update = () => {
      const current = ++request, scope = captureScope();
      void services.recovery.list().then(next => {
        if (scope.isActive() && current === request) { setRecords(next); setError(''); }
      }).catch(cause => { if (scope.isActive() && current === request) setError(errorMessage(cause)); });
    };
    update();
    const stop = services.projects.subscribe(update);
    const stopAuth = services.auth.subscribe(session => {
      if (session?.userId !== owner) {
        owner = session?.userId; request++; running.current = null;
        setBusy(false); setSelected(null); setRecords([]); setError('');
      }
    });
    return () => { request++; stop(); stopAuth(); };
  }, [captureScope]);
  const run = async (record: UnreadableProject, remove: boolean) => {
    const scope = captureScope();
    if (running.current?.isActive() || !scope.isActive()) return;
    running.current = scope; setBusy(true);
    try {
      if (remove) {
        await services.recovery.removeLocal(record.key);
        if (scope.isActive()) { setSelected(null); toast('読み取れない端末データを整理しました'); }
      } else {
        const blob = await services.recovery.export(record.key);
        if (!scope.isActive()) return;
        await downloadBlob(blob, `ぬりえアイランド-元データ-${record.id.replace(/[^a-z0-9-]/gi, '').slice(0, 36)}.json`);
        if (scope.isActive()) toast('元データをファイルに保存しました');
      }
    } catch (cause) { if (scope.isActive()) setError(errorMessage(cause)); }
    finally { if (running.current === scope) running.current = null; if (scope.isActive()) setBusy(false); }
  };
  if (!records.length && !error) return null;
  return <section className="settings-section recovery-section" aria-label="読み取れない作品">
    <h2>読み取れない作品</h2>
    <div className="settings-card">
    <div className="recovery-intro">
    <p>通常のバックアップには、読み取れる作品を保存します。読み取れない元データは端末に残して、編集と同期を止めています。</p>
    <p>作品を戻すには、正常なバックアップを上の「復元」から選んでください。下の元データのファイルは、調査・修復用に保管できます。</p>
    </div>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {records.map(record => <article key={record.key} className="setting-row">
      <span><strong>{record.title}</strong><small>{record.id}</small></span>
      <div className="dialog-actions">
        <button className="button" disabled={busy} onClick={() => { void run(record, false); }}>元データを保存</button>
        <button className="button" disabled={busy} onClick={() => setSelected(record)}>この端末から整理</button>
      </div>
    </article>)}
    </div>
    {selected && <Modal title="読み取れないデータを整理しますか？" onClose={() => { if (!busy) setSelected(null); }}>
      <p>この作品の読み取れないデータと画像を端末から削除します。元にもどせません。必要なら先に元データを保存してください。</p>
      <p>クラウドに正常な作品があれば、次の同期で表示されます。</p>
      <div className="dialog-actions">
        <button className="button" disabled={busy} onClick={() => setSelected(null)}>やめる</button>
        <button className="button button-danger" disabled={busy} onClick={() => { void run(selected, true); }}>このデータを削除</button>
      </div>
    </Modal>}
  </section>;
}
