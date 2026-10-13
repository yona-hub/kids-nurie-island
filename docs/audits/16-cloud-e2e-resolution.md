**A16-01 非 demo クラウド結合 E2E の実装・実行記録**

2026-10-07 09:31:05〜09:33:24 JST の最終実行は **9 件成功、失敗・skip・再試行 0 件**（139.0 秒）。Chromium 153.0.8010.12、Firefox 155.0、WebKit 26.6 で各 3 ケースを実行した。これは担当実装の検証記録であり、独立再監査の判定ではない。

`VITE_DEMO_MODE=false` の production build を `.local/cloud-e2e-dist` に作り、アプリを `127.0.0.1:4185`、ローカル HTTP fixture を `127.0.0.1:54851` で起動した。既存の 4174 / `dist-demo` は変更していない。Google ボタンから実 Supabase SDK 2.117.2 の PKCE・callback・session 永続化を通す。fixture が code verifier、一度だけ使える code、署名付き JWT を検査し、PostgREST 形の HTTP 要求を実 migrations を適用した PGlite の authenticated role / RPC / RLS に渡す。作品の作成・変更はブラウザ UI、IndexedDB は読み取りによる観測だけに用いる。アプリのサービスを差し替える test hook や Playwright の HTTP route fulfillment は使わない。

| ケース（各 3 ブラウザ） | 観測・assert |
|---|---|
| 通信不能中の編集→復旧 | クラウド内容が変わらずローカルの色と未同期 1 件を保持。復旧後に操作ボタン・reload・サービス呼び出しなしで自動送信し、サーバーの色・version と未同期 0 件を確認 |
| HTTP 503→UI 再試行 | エラーバナー、ローカル内容、未同期状態を確認。「再試行」で同じ operationId が受理され、version が 1 だけ進む |
| 独立した 2 BrowserContext の競合 | 別 IndexedDB / 認証 session で同じ原本を取得。B の通信を止めて別色を塗り、A の保存を確定。B 復旧後の実 SQL CAS conflict から原本と「別の作品」を保持。両端末への取得、reload 後の 2 作品の色・画材、一覧の件数・タイトルを確認 |

**通信断の範囲と再接続トリガー**

Chromium / Firefox は `BrowserContext.setOffline(true/false)` を使い、ブラウザの online イベントによる自動復旧を検査する。WebKit は後述の offline 注入不具合を避け、fixture が署名済み session に結びつけた当該端末の API TCP 接続だけを `socket.destroy()` で実際に切断する。アプリの `navigator.onLine` を書き換えず、実 SDK の fetch failure→認証の offline 所有者→自動 auth 再検証 / backoff→同期を通す。別端末の接続は維持する。API への到達不能の検査であり、WebKit の全ネットワーク断や OS の機内モードと同一とは扱わない。

同期件数を読む設定画面は、切断前に UI で一度開く。最終実行の切断前観測は 3 ブラウザとも `serviceWorkerSupported=true / controlled=true`。本ケースは**既読 UI での同期**を検査し、未訪問画面のキャッシュ検査とは分離する。

console / HTTP は省略せず記録する。未処理 JavaScript 例外は全 9 件で 0。許可する resource error は、意図した 503、任意サムネイルの 404、WebKit の明示した API TCP 切断の URL と一致したものだけ。無関係な blob URL や一般的な「Failed to load resource」を一括許可しない。最終ログには意図した 503 / TCP 切断だけがあり、予期しない HTTP / console エラーは 0 だった。

**最終ビルドの同一性**

ビルド日時：2026-10-07 09:23:38〜09:23:43 JST、Node.js 24.18.0 / Windows。A09 と Gallery URL 寿命の修正を含む。240 配信ファイル、harness、working source を前後で比較し、すべて一致した。HTML が参照する実 HTTP 配信 JS / CSS の bytes もローカル build と照合した。

| 対象 | SHA-256 |
|---|---|
| build 元 source aggregate | `b67b699368543c01295b565ed0fc00d8ae426445fadf9d1607f3e266f7ec3762` |
| 配信 build aggregate | `46318980d24335e01d59780567bb12b8560fb492672110205ab9af2784d13c3e` |
| test / fixture / helper / CI harness aggregate | `3def3712b5874d3609afb5e3f77ce8581ba44c483786ecb7e0bb83d00d8a9961` |
| `assets/index-ypQgl0QB.js` | `648ab3174533ccdab0fcab7abd3dad713b000462fbbe7ee4a611a7c27774d6f8` |
| `assets/index-BTbKs9sM.css` | `8204170989d98974e978eebf572396118a208096e56256cc723c9d72e14efed8` |

最終生レポートは `test-results/cloud-e2e/results.json`、HTML は同ディレクトリの `html/index.html`。`build-manifest.json` と `run-identity-start.json` は各ファイルの SHA、`run-identity.json` は開始・終了時刻と前後照合を持つ。ブラウザ別の `cloud-*-reconnect.json` / `retry.json` / `conflict.json` に HTTP 履歴、SQL 結果 / receipts、両端末の保存作品と pending 件数を保存した。画面 PNG も同名で保存している。一覧 PNG は作品件数・タイトルの観測で、サムネイルの読み込み完了や画素の検証とは扱わない。

**初回失敗と切り分けを残した経緯**

1. 初回 fixture の CORS に `content-profile` / `accept-profile` がなく、SDK の送信が拒否された。fixture を修正し、最初の trace を `attempt01-cors/` に保持した。
2. 未訪問 Settings を `setOffline(true)` 後に初めて開くと、WebKit だけ Settings / trash chunk が内部エラーで失敗した。8 成功 / 1 失敗の元結果・trace は `attempt02-cold-settings/`。既読 UI へ揃えた初期 9 件の機能観測も残しているが、その観測器は同時に 404 があると無関係な resource error を許可する欠点があったため、最終成功の証拠には用いない（`functional-observations-before-strict-console*.json`）。
3. URL 対応を厳密化すると、WebKit の競合ケースで blob error を検出した（`attempt03-strict-blob/`）。trace では画像一覧や reload の前、編集画面が emulated offline の間に発生していた。Gallery の URL 寿命も別途修正されたが、この blob error の直接原因とは断定しない。

**未訪問 Settings の配信停止対比（09:22 JST、初期固定ビルド）**

主証拠は `cold-settings-precache-origin-unavailable.json`。4185 の HTTP listener 自体を停止し `listening=false`、ブラウザを介さない未キャッシュ probe の接続拒否も確認した。SW は activated、Settings / trash の実 precache キーがあり、Settings のキャッシュ本文は **200 / 15,876 bytes**。この状態で通常 fetch は同じ 200 / 15,876 bytes、未訪問 Settings も表示できた。両 JS 応答の `fromServiceWorker=true`、console error 0 を記録した。4174 は止めていない。

一方、同じ precache 条件で `setOffline(true)` を使うと、cache API から本文は読めても通常 fetch は `TypeError: Load failed`、Settings は import error になった（`cold-settings-precache-ready.json`）。この ready ケースの失敗は `cold-origin-comparison-results.json` にそのまま残した。即時切断ケースは観測用で、`opened=false` をテスト成功に読み替えない。この対比の build は `index-D30WhMxl.js` / source `f845a24e34c0bf509d0d14fc76870c60348233698889bf07c984c6c37a787316`、最終 build とは別。`build-manifest-initial.json` / `cold-diagnostic-identity.json` に識別を残す。

**WebKit 注入制約の独立診断**

アプリの画像実装を呼ばず、新しく作った **106 byte の SVG Blob** を fetch と `new Image()` で読んだ。online→emulated offline→online の前後は fetch 200 / 画像幅 2、offline だけ fetch failure / image error になった。URL 解放は読み取り後であり、アプリの早期 revoke による再現ではない。`blob-offline-observation.json` / `blob-diagnostic-results.json` に期待に反する失敗を保持した。

Playwright の公式 issue [#42775](https://github.com/microsoft/playwright/issues/42775) は同じ 1.63.0 で、SW が返す literal Response / cached response も WebKit の `setOffline` が妨げ、配信停止による対比では成功することを報告している。今回のローカル観測と一致する。実 Safari の一般的な offline 機能の不良や、アプリのキャッシュ欠陥とは断定しない。診断用 `*.diagnostic.ts` はこのプラットフォームの負例を残す別入口で、通常 9 ケースや CI の成功件数には加えない。

**再実行と限界**

```powershell
node scripts/build-cloud-e2e.mjs
# Windows のこの端末では既存のブラウザ保存先と局所 Firefox コピーを明示する。
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $env:USERPROFILE 'AppData\Local\ms-playwright'
$env:FIREFOX_EXECUTABLE_PATH = (Resolve-Path -LiteralPath 'test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe').Path
npx playwright test --config tests/cloud-e2e/playwright.config.mjs --workers=1
```

`.github/workflows/quality.yml` に別 job `cloud-integration` を追加した。非 demo build、3 ブラウザ実行、結果 / build identity のログ保存を行う。GitHub 上の job 自体はこの作業では実行していない。ローカルでは fixture 自己検査と通常 Unit を同じポートの E2E と同時実行しない。`fixture.test.ts` は誤 PKCE / code 再利用 / 偽 JWT の拒否と、実 SQL の CAS / receipt を確認する。最終変更範囲の ESLint、全体 TypeScript 型検査は成功した。

Windows Firefox は既存の manifest resource ID 1 byte 修正済み隔離コピーで、通常配布物の起動成功とは区別する。今回再測定した exe SHA は `425a0a0fb606f567a303bdcea727476e124c0deb589050b13668af688da17fcb`、DLL SHA は `4450708783c4114b3491d07677ae082f27a1705231ac31ce3feb9fe118c0befe`（`firefox-runtime-identity.json`）。Lightpanda の Ensure / Status 診断は `browser-readiness.json` に保存し、明示された描画ブラウザで検査した。

Hosted Supabase、Google の実 OAuth 画面、Storage の実基盤、iOS / Android 実機は本検査の対象外。外部資格情報・外部 DB を使わず、auth / storage HTTP の環境境界は fixture、SDK・UI・IndexedDB・同期・実 SQL / RLS は実装を通している。
