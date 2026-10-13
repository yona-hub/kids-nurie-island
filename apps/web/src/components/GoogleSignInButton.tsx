type Props = { busy: boolean; onSignIn: () => void };

export function GoogleSignInButton({ busy, onSignIn }: Props) {
  return (
    <button
      className="google-signin-button login-button"
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={onSignIn}
    >
      <span className="google-signin-state" aria-hidden="true" />
      <span className="google-signin-content">
        <img src="/images/google-signin/g-logo.png" width="20" height="20" alt="" />
        <span>Googleでログイン</span>
      </span>
    </button>
  );
}
