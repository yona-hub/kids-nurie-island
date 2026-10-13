# A19-01 未保存作品の画面移動保護 — 実装側の解消記録

独立監査原文 `docs/audits/19-failure-modes.md` は変更していない。本記録は A19-01 の実装・回帰検証だけを扱う。A19-02/03 は別担当。

## 原因と修正

旧 App の `hashchange` は保存状態を確認せず route を更新し、Editor の `latest` / `unsaved` と描画キャンバスを unmount していた。`beforeunload` は同じ文書内の履歴移動を捕捉しない。

- `guarded-route.tsx` で、URL の移動要求と実際に描画する route を分けた。Editor が未保存または保存処理中なら Editor を mounted のまま維持し、移動先を保留する。
- Editor は layout effect で判定関数を登録する。判定は同期 ref を読むため、最初の `change()` が始まって React が再描画する前も保護される。
- 保存して移動は既存の保存処理を待ち、必要なら最新の全編集状態を再保存してから移動する。再失敗した場合は同じキャンバスと再試行手段を保持する。保存の完了前に移動を取り消した場合、古い完了通知は移動を再開しない。
- 明示的な「未保存の変更を破棄して移動」だけが揮発中の編集を放棄する。保存済みの作品を削除・初期化しない。実行中の IndexedDB 保存は中止 API がないため、その間は破棄ボタンを無効にして理由を表示する。保存待ち中も「ぬりえにもどる」・Escape は使える。
- アプリが作る履歴には小さな位置情報を付け、戻る／進むの取り消しは同じ履歴位置へ戻す。履歴数を増やさない。直接の hash 書換えやアプリ起動前の履歴には確実な位置情報がないため、取り消し時は現在の entry だけを Editor URL に置き換える。未知の履歴距離を推測しない。
- `beforeunload` 保護を維持。アカウントの所有期間をまたぐ保存完了では移動しない。未保存内容からの thumbnail 書込みも抑止した。

変更箇所: `App.tsx`、`pages/Editor.tsx`、新規 `navigation.ts` / `guarded-route.tsx`、`components/UI.tsx` の `navigate` re-export。AppProvider / Settings / persistence は本修正では変更していない。

## 実 React + IndexedDB 回帰

2026-10-07、`tests/ui-navigation-loss.test.tsx`。実 App / Editor / persistence、JSDOM + fake-indexeddb を使用。画像・音声・Canvas 境界だけを軽量化し、実 `IDBObjectStore.put` に容量エラーを注入する。

新規 **10 / 10 PASS**、既存 A03 の非同期所有権 **20 / 20 PASS**。`test-results/a19-navigation-after.json` に結果を保存。

1. 容量不足後の履歴戻る→進む、同じ色の保存再試行、保存後の再入場。
2. 最初の保存が pending の時点で同一操作中に hash を変更。成功確認前は Editor が残る。
3. アプリの戻る→再保存失敗→容量回復後の保存して移動。
4. 移動キャンセルで元の履歴位置・state・履歴数を維持し、再度戻る。
5. 直接 hash 書換え→Escape。色と Editor URL を保持。
6. 再入場した Editor での未保存編集→履歴進む→キャンセル。
7. 保存待ち中のキャンセル→遅い保存完了。後から移動しない。
8. 初回保存の遅い失敗→明示破棄。pending 中は破棄できず、失敗確定後だけ破棄できる。
9. 未保存の消しゴム操作を明示破棄し、以前保存した色と作品自体を保持。
10. A→B→A の所有期間変更後、古い保存完了で移動しない。

旧無条件 hash ルーターをテスト境界に復元した診断では、1 と 2 が **2 / 2 FAIL**（保護 dialog がなく Editor が取り除かれる）。アプリ全体の旧版ビルドではなく、監査対象の旧ルーティング境界を復元した比較である。`test-results/a19-navigation-legacy-routing.json`。最初の `a19-navigation-before.json` はテスト補助関数のイベント待機不良を含むため再現証拠には使わない。

```powershell
npx vitest run tests/ui-navigation-loss.test.tsx tests/ui-async-races.test.tsx --reporter=json --outputFile=test-results/a19-navigation-after.json
$env:A19_NAVIGATION_BASELINE='1'
npx vitest run tests/ui-navigation-loss.test.tsx -t 'retains failed edits|blocks the first save' --reporter=json --outputFile=test-results/a19-navigation-legacy-routing.json
Remove-Item Env:A19_NAVIGATION_BASELINE
```

本体と新規テストの TypeScript / ESLint は PASS。

## 固定ビルドの実ブラウザ結果

`tests/e2e/navigation-loss.spec.ts` の 4 シナリオを Chromium / Firefox / WebKit の計 12 ケースで実行。quota は実 browser の `IDBObjectStore.put` に `QuotaExceededError` を注入した。pending は実ネイティブ readwrite transaction に readonly request を連鎖し、テスト側が解放するまで commit 自体を保留した。待ち時間だけを延ばす検査ではない。色はキャンバスの画素、保存は実 IndexedDB、再入場は実履歴と reload で検査した。

2026-10-07 09:05–09:06 JST、**12 / 12 PASS**、68.7 秒、workers=1。skip / retry / flaky / browser console error / pageerror はすべて 0。初回の固定ビルド検査が全件成功し、検査中の本体・fixture 修正はない。

| ブラウザ | 容量不足→履歴往復→回復→reload | アプリ戻る・再失敗・hash・明示破棄 | 保存中にキャンセル→遅い commit | 保存中に保存して移動 |
|---|---|---|---|---|
| Chromium | PASS | PASS | PASS | PASS |
| Firefox（下記の診断コピー） | PASS | PASS | PASS | PASS |
| WebKit | PASS | PASS | PASS | PASS |

root が固定した 4174 の配信は `index-_UtDte8t.js` / `index-BTbKs9sM.css` / `Editor-CocDlI79.js`。HTML と上記 3 ファイル、担当本体 5 ファイルの raw SHA256 を実行前後で比較し **9 / 9 不変**。担当から build / preview は変更していない。`test-results/a19-navigation-browser/build-before.json`、`build-after.json`、`build-comparison.json` に全 hash を保存。固定前の dev 事前実行は root の通知に従い global setup 直後に中止し、結果には数えていない。

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\yonaf\AppData\Local\ms-playwright'
$env:FIREFOX_EXECUTABLE_PATH=(Resolve-Path 'test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe').Path
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4174'
npx playwright test -c test-results/a19-navigation-diagnostics/playwright.config.ts
```

診断 config: `test-results/a19-navigation-diagnostics/playwright.config.ts`。結果: `test-results/a19-navigation-browser/results.json`。各ブラウザの容量不足後の保護 dialog 画像は同ディレクトリの `artifacts/**/quota-history-retained.png`。Chromium 画像を目視し、編集画面の保持と選択肢の可読性を確認した。

Lightpanda の Ensure / Status を global setup で実行。Ensure は Docker の Hyper-V socket 接続 timeout、Status は CDP ready=true と同時に backend timeout を返した。`test-results/a19-navigation-browser/browser-readiness.json` に保存し、既にユーザーが指定した 3 ブラウザへの fallback を使用した。

Firefox は公式 cache 不変の workspace 診断コピー `test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe`。`mozglue.dll` の manifest resource ID 2→1 を 1 byte だけ変更したローカル起動経路で、未修正の公式 binary がこの Windows ホストで起動することは証明していない。実行コピーの詳細・元 DLL と修正後 DLL の SHA256 は `docs/testing-browser.md` と既存 `test-results/firefox-launch-result.json` を参照。本修正では browser binary やホスト全体の runtime を変更していない。

## API 挙動の照合と限界

[Mozilla の pushState 説明](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) にある通り、pushState 自体は hashchange を発火しないため、アプリの navigate が明示的に通知する。[hashchange](https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event) と [beforeunload](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event) は別の離脱経路として扱う。OS の強制終了、モバイル OS による強制破棄、ユーザーがブラウザの終了警告を無視する操作まで容量不足の保存を保証するものではない。
