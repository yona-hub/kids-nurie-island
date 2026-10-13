# Googleログイン表示の来歴

2026-10-07、独立監査A17-01を受け、Google専用ボタンへ分離した。[Google公式ブランドガイド](https://developers.google.com/identity/branding-guidelines)のLight配色を使い、公式配布のグラデーションGを未加工のまま同梱する。画像は20pxの枠にobject-fit:containで表示し、縦横比を維持する。旧4色pathと汎用primaryボタンの黄色hoverは使用しない。

通常時は白・1pxの#747775境界・#1f1f1f文字。公式HTML設定例のhover 8%、focus/pressed 12%の状態レイヤーを採用し、キーボードfocusの輪郭はアプリ共通のまま保つ。ラベルを日本語化し、既存の54px高と100%幅で操作領域を確保する。Googleの文字は公式Google Sans Medium、日本語は端末フォントで表示する。

取得URL、取得日、原本SHA-256は`content/third-party/google-signin/sources.json`。ロゴはGoogleの商標・ブランド使用条件に従う認証用途の素材であり、アプリ独自素材やOSSとして扱わない。公式ZIPは来歴確認専用で配布しない。Googleの承認・提携を意味しない。

Google Sansは公式Fonts APIが生成した「Google」の文字だけの3,116 bytesを未変更で配布。OFL-1.1全文を`public/legal/google-sans-OFL.txt`とアプリのOSS一覧・ライセンス全文へ含めた。OSへのフォント導入や、アプリ実行時のGoogle Fontsへの通信はない。

CSS状態表示はGoogle Developersの公式HTML設定例（Apache-2.0）を基に実装した。参照CSSを`content/third-party/google-signin/official-button-styles.css`へ保存。元ページの解析用コードや公開クライアントキー等は不要なため保存しない。改変内容と配布元、Apache-2.0全文はアプリのOSS一覧・ライセンス全文に含める。

本番・デモのbuildは毎回ライセンス生成を先に実行する。A17-02で指摘されたデモの古い38項目を更新し、39項目の一覧・通知全文がソース公開物、本番、デモ、4174のHTTP応答で一致することをSHA-256で確認した。証拠は`test-results/a17-license-build-parity.json`。監査原文は保持する。

`tests/ui/check-google-branding.mjs`で本番コンポーネントと全CSSを使った独立fixtureを3ブラウザで検証した。通常・hover・focus・pressed・busyの配色、ロゴ比率、フォント読込、44px以上、focus輪郭、マウス/Enterの認証ハンドラ呼出し、busy中の重複操作拒否がPASS。アプリ実行時の外部フォント通信0、console error 0。証拠は`test-results/google-branding/results.json`と各ブラウザ画像。Firefoxは既存の隔離診断版であり、実Google認証の送信は行っていない。
