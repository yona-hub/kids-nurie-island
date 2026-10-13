import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleSignInButton } from '../../apps/web/src/components/GoogleSignInButton';

let finish: () => void;
export function finishSignIn() { finish(); }
function Fixture() {
  const [busy, setBusy] = useState(false);
  const [calls, setCalls] = useState(0);
  finish = () => setBusy(false);
  return <main className="login-page"><div className="login-card">
    <h1>ログイン</h1>
    <GoogleSignInButton busy={busy} onSignIn={() => { setCalls(n => n + 1); setBusy(true); }} />
    <output aria-label="認証呼出し数">{calls}</output>
  </div></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
