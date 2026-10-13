# A19-04 明示破棄後の保存失敗状態 — 実装側の解消記録

2026-10-07。独立監査 `docs/audits/19-failure-modes.md` の原文は変更していない。本記録は新規 A19-04 だけを扱う。

## 再現と修正

実 App / Editor / persistence の既存破棄テストに、ホーム到着後の `localSaveFailed === false` を追加した。旧実装では保存済み色は保持されたがフラグが true のままで **1 件 FAIL**。`test-results/a19-discard-before.json` に失敗位置・値を保存した。

`projects.discardFailedSave(error)` を追加した。保存処理が実際に返した保存エラーを、内部 WeakMap でアカウント ID・認証の所有期間・入力作品 ID に結び付ける。エラー自体が識別子となり、作品 ID を知っているだけでは解除できない。対象で最後に記録された同一エラーだけを受け付ける。

- 保存呼出しの最初の await より前に対象の実行数を増やし、finally で減らす。同じ対象に保存中の処理があれば解除を拒否する。
- 別アカウント、A→B→A を含む古い所有期間、古い失敗、別サービスで作ったエラー、設定や削除のエラー、破棄済みサービスは拒否する。
- Editor は観測した保存失敗を作品ごとに保持する。ユーザーが移動確認で明示破棄し、同じアカウントの保存待ちがない場合だけ上記 API を呼ぶ。
- 保存済みの IndexedDB レコードや色は変更しない。他作品・設定の失敗は残す。通常の再保存成功は既存どおり対象の失敗を解除する。
- 保存開始時とトランザクション前後の所有期間を確認し、古い保存の遅い失敗が現在のアカウントへ失敗状態を発行しないようにした。

変更本体は `apps/web/src/pages/Editor.tsx` と `packages/persistence/src/index.ts`。更新の条件を緩めたり、失敗を一括解除したりしていない。

## 自動検証

`test-results/a19-discard-unit.json` は **51 / 51 PASS**。実 App / Editor / 保存を使った破棄・保留ルーティング、PWA 更新ガード、既存保存テスト、新規の対象限定破棄 8 件を含む。追加の関連回帰 `test-results/a19-discard-related.json` は **47 / 47 PASS**。A03 の非同期所有権、認証競合、設定の整合性、A02 の保存・競合ルーティングを含む。合計 **98 件 PASS**、型検査と変更箇所 ESLint も PASS。

実 App の検査では、保存済みピンク色→容量不足で消去失敗→明示破棄→ホームで警告消去→更新ボタン→更新イベント／待機 Worker への要求、再入場時のピンク色保持を確認した。他作品の失敗がある場合は、同じ明示破棄後も警告・更新ブロックを保持する。SW 境界は EventTarget と MessageChannel の fixture であり、実 Service Worker の activate / reload ではない。

```powershell
npx vitest run tests/persistence-discard.test.ts tests/persistence.test.ts tests/ui-navigation-loss.test.tsx tests/pwa-updates.test.ts --reporter=json --outputFile=test-results/a19-discard-unit.json
npx vitest run tests/ui-async-races.test.tsx tests/persistence-audit02.test.ts tests/persistence-settings-consistency.test.ts tests/persistence-auth-races.test.ts --reporter=json --outputFile=test-results/a19-discard-related.json
npm run typecheck
npx eslint packages/persistence/src/index.ts apps/web/src/pages/Editor.tsx tests/persistence-discard.test.ts tests/ui-navigation-loss.test.tsx tests/e2e/navigation-loss.spec.ts --max-warnings 0
```

## 実ブラウザ検証

root が固定した demo build `index-DNdAfd3s.js` / `Editor-tnkJGW3l.js` / `index-BTbKs9sM.css` を使用し、2026-10-07 09:51–09:53 JST に **12 / 12 PASS**（Chromium / Firefox / WebKit 各 4 件、78 秒、workers=1）。skip / retry / flaky / console error / pageerror は 0。初回の固定 build 検証で全件成功し、本体・fixture の追加変更はない。旧結果を上書きせず `test-results/a19-discard-browser/results.json` に保存した。

今回の明示破棄ケースは、別の領域を正常保存してから容量不足を注入し、未保存色だけを破棄した。全 3 ブラウザでホームの実サービス `localSaveFailed=false`、警告 0 件、更新イベント 1 件、Worker への更新要求 1 件、再入場後の保存済みピンク色と破棄した白領域の画素を確認した。待機 Worker だけを synthetic fixture とし、実 App / navigation / persistence / PWA 登録ロジックを通して要求を観測した。本物の SW activate / reload 成功とは区別する。

他の 3 シナリオは、容量不足からの履歴往復・保存再試行・reload、初回ネイティブ IDB transaction の保存中にキャンセル、同 transaction の commit 後に移動する経路。保存中の破棄ボタン無効化と、キャンセル後の遅い commit が画面を移動させないことも維持した。

`build-before.json` / `build-after.json` / `build-comparison.json` で本体・テスト・配信 HTML / JS / CSS / SW の **14 / 14 SHA256 不変**を確認。ブラウザごとの `a19-discard-update-proof` 添付に保存領域と更新要求数を記録した。`artifacts/**/discarded-home-no-warning.png` は明示破棄後のホームと更新通知の証拠。Chromium の画像を目視し保存警告がないことを確認した（ホーム登場アニメーションの途中を含み、画面全体の visual baseline ではない）。

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\yonaf\AppData\Local\ms-playwright'
$env:FIREFOX_EXECUTABLE_PATH=(Resolve-Path 'test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe').Path
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4174'
npx playwright test -c test-results/a19-discard-diagnostics/playwright.config.ts
```

Firefox は従来と同じ workspace 内 manifest ID 修正済み診断コピーを明示指定する。元の browser cache、ホスト全体の runtime は変更しない。実容量枯渇、OS 強制終了、外部アカウントでの実運用の確認は本検査に含まれない。

Lightpanda の Ensure / Status を global setup で実行し、開始時のコンソールで Ensure 失敗と許可済み fallback の使用を確認した。同時間帯の共有診断では Docker backend が Hyper-V socket timeout、Status は CDP ready=true と backend timeout を併記した。共有ファイルは親の並列検査からも更新されるため、結果ディレクトリの `browser-readiness.json` は 09:52:24 の同時間帯診断コピーとして扱い、この 12 件専用の生出力とはしない。未修正の公式 Firefox binary のこの Windows ホストでの起動成功とは扱わない。コピーの修正範囲・hash は `docs/testing-browser.md` の既存 Firefox 記録を参照。
