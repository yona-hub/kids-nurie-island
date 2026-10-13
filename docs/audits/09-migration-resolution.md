# A09-05 旧 preview の安全な更新手順 — 実装側の記録

2026-10-07。独立監査 `docs/audits/09-pwa-offline.md` は変更していない。現行 SW / 認証 / App の安全条件も変更していない。

## 移行の設計判断

保存されている旧 preview の実 JS `index-BDz80J0o.js` は `requestId` なしの更新要求を送り、応答の表示も busy / other-tabs の固定文 2 種類しか持たない。新しい案内文を Worker が返しても、その旧 JS は表示できない。旧ページには実表示画面・保存待ちを照合する確認 protocol もない。

この旧版の要求だけを許可して `skipWaiting()` を実行すると、保存中の画面を保護する A09-04 の条件を緩める。そのため旧要求の拒否を維持し、**未公開の旧 preview の移行は「保存完了を確認→このアプリの全タブと PWA ウィンドウを閉じる→もう一度開く」**という手順を README / PWA 文書と利用者への会話で案内する。README / 共通 PWA 文書・利用者への案内はメイン担当が行う。

旧画面の更新ボタンだけで復帰手順を表示・実行できるようになった、という修正ではない。これは公開前 preview に限定した運用移行の判断である。旧画面内の固定文制約と、外から届く手順案内が必要なことを明記する。

全旧 client を閉じた後に waiting worker が有効化される流れは、[Google の Service Worker lifecycle 説明](https://web.dev/articles/service-worker-lifecycle) と照合した。同資料は通常の reload では新旧文書が重なるため waiting が解消しない場合も説明している。

## 検査の構成

`scripts/check-pwa-migration.mjs` は実旧配布物 `test-results/firefox-validation-fixed/site` と最新 `dist-demo` を、同一の隔離した localhost origin で切り替える。HTML / JS / CSS / SW はファイルの実 bytes を配信し、コメント追加や関数の置き換えはしない。通常の段階的更新と同じく、旧版の hash 付き immutable asset だけは参照が残っている間も配信できるようにする。

- 旧版の実 UI で作品を作成・着色し、設定の reducedMotion / soundEffects / tapAssist を操作。実 IndexedDB transaction の commit を待つ。
- 実旧 Worker がページを制御する状態で、現行 Worker をインストールする。保存済みホームの実「更新する」を 3 回操作し、旧要求の requestId 欠落と実 SW の `blocked / busy` 応答、旧固定文を記録する。
- Editor で native readwrite transaction の commit を request 連鎖で保留し、着色した画面を保持。旧登録 handler への合成更新イベントは request 0、同じ旧 protocol を待機 Worker へ直接送る負検査は blocked。これは Editor に実在しない更新ボタンを操作したものではない。
- commit を完了して別の実タブを開く。旧ホームの更新ボタンで再び拒否され、両方の文書と Worker 待機を維持することを確認する。
- 全タブを閉じる。BrowserContext、Cookie、IndexedDB、CacheStorage は保持。Worker の activate は受動的な listener と状態照会だけで観測し、`skipWaiting` / `unregister` / cache 消去 / storage-state の移植を使わない。
- 同じ Context で再入場し、新しい JS、同じ作品 ID・所有者・2 色、設定を確認。offline にしてタブを閉じ、さらに新規タブで同じ作品を開き直して画素も確認する。

Chromium の通常のデスクトップブラウザを 390×844 viewport、実 2 タブで操作する。実インストール済み PWA ウィンドウ、OS の再起動、実端末、外部 Google 認証での移行を検証したとは扱わない。全ウィンドウを閉じる lifecycle の browser-tab 経路を実証する。

## 手順デバッグ

`test-results/a09-migration-debug` に最初の実行を保存した。実旧 `index-BDz80J0o.js` → `index-lQ-HfX9u.js` で **PASS**。ホーム旧要求 3 回を拒否、保存保留 Editor と 2 タブで activate / reload 0、全タブ終了後に window client 0 で自然 activate 1 回、保存済み作品・2 色・設定 3 項目・最新 JS・offline 新規タブ再起動を確認した。配布 20 ファイルの前後 SHA256 は不変、console error / pageerror は 0。

これは手順デバッグの結果である。並行して A11 の本体修正が進んでいたため、最終 build の証拠とは区別し、次の固定 build で `test-results/a09-migration` へ採証し直す。

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\yonaf\AppData\Local\ms-playwright'
# デバッグ時だけ出力先を分離
$env:PWA_MIGRATION_OUTPUT='test-results/a09-migration-debug'
node scripts/check-pwa-migration.mjs
# 最終実行では PWA_MIGRATION_OUTPUT を削除し既定の a09-migration へ記録
```

実行前の `check-browser.mjs` が Lightpanda Ensure / Status を確認し、その戻り値を各実行固有の `browser-readiness.json` に直ちに保存する。Hyper-V backend timeout による不能時は、既に利用者が指定・許可した Chromium で実描画を検証する。
