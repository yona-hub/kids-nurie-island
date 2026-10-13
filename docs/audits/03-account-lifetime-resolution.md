# A03-06 アカウント往復時の画面寿命 — 実装側の解消記録

2026-10-07。独立監査原文 `docs/audits/03-react-typescript.md` は変更していない。A03-06 を修正し、関連 **6 ファイル・83 件 PASS**。対象は画面 lifetime と関連する更新要求の所有期間。

## 修正前の証明

実 App / Editor / Gallery / persistence と JSDOM / fake-indexeddb を使い、画像取得、Canvas 出力、音声、ダウンロードだけを制御した。実認証 adapter に A→B→A を同期通知する。描画前の往復は 1 回の React `act` 内、対照は B を commit してから A を別の `act` で commit した。

`test-results/a03-06-before-isolated.json`：新規 10 件のうち、**描画前の往復 4 件 FAIL、描画後の往復 4 件 PASS、同一 user の認証更新 2 件 PASS**。残る既存 20 件はこの診断では対象外。

| 待機中の処理 | 描画前 A→B→A の旧実装 |
|---|---|
| Editor 初回 `projects.get` | 再取得されず loading が継続 |
| Gallery PNG 出力 | PNG ボタンが無効のまま、次の出力を開始できない |
| Editor 背景取得 | 旧 Canvas / picker が残り、新しい lifetime での背景操作ができない |
| Editor 完成時の thumbnail 出力 | 完成ボタンが無効のまま、編集を再開できない |

初回診断 `a03-06-before.json` は、失敗時に未消費の mockReturnValueOnce が次のテストへ残る fixture 問題を含むため、解消根拠に使わない。各試験前に mock 実装もリセットするようにして再測定した上記 isolated 記録を使用する。

さらに実 App の更新操作を検査した `test-results/a03-06-pwa-before.json` は **新規 3 件中 2 件 FAIL、1 件 PASS**。A→B→A 後に古い同期待ちの更新ボタンが disabled のままになる経路と、送信済み更新の古い所有期間で controllerchange に応じて reload する経路を再現。同一 user の認証更新は要求を保持し PASS。

診断中、本体 `App.tsx` / `use-account-scope.ts` は編集していない。修正前 hash を `test-results/a03-06-source-before.json` に保存。

## 修正

- Shell は認証通知の callback で実アカウント変更ごとに同期的に世代を増やし、session と世代を同じ React state へ保存する。画面の key を userId＋世代にした。React が A→B→A を一括描画しても最後の A は新しい mount となり、初回読込と操作状態を初期化する。同一 user のトークン更新では世代を変えず、Canvas・ツール・処理中の出力を保持する。
- `useAccountScope` は実アカウントの変更通知で旧 AbortController を即座に中断する。一度中断した mounted lifetime を A への復帰時に復活させず、新しい mount が新しい controller を取得する。旧取得・出力の完了で新画面の busy を解除したり、データを上書きしたりしない。
- アカウントの世代変更で旧更新要求を無効化し、更新ボタンの busy を解除する。`invalidateNavigation()` で PWA の送信済み要求も同時に無効化する。旧 controllerchange で自動 reload せず、新しい所有期間で更新を押し直せる。同一 user の認証更新はその要求を保持する。
- アカウント変更で旧 Editor の離脱確認を取り消す際、既に移動先へ変わっている URL も実表示中の route へ replace する。履歴を追加せず、新しい画面の route・URL を一致させる。保存中の離脱・通常の履歴取消し・PWA の実表示判定は維持する。

最後の URL 調整は A19 の統合回帰で必要性を確認した。初期の App 修正だけでは新 Editor の復帰後も URL が /home のまま残り、後の「もどる」が同じ hash と判定され無反応になった。`test-results/a03-06-pending-route-before.json` に FAIL を記録し、root へ範囲追加を通知して `guarded-route.tsx` の blocker cleanup のみに修正を加えた。

React が同じ位置の同じ key で state を保持し、別 key で初期化する挙動は [React の state 保持・リセット説明](https://react.dev/learn/preserving-and-resetting-state) と照合。旧非同期結果は cleanup と所有期間の確認で破棄する方針を維持する。[React useEffect](https://react.dev/reference/react/useEffect)

本体変更は `App.tsx` / `use-account-scope.ts` / `guarded-route.tsx` の 3 ファイル。AppProvider / Settings / packages は変更していない。root の固定ビルド検査完了通知後に編集し、関連検証後に再びソース固定を通知した。最終 hash は `test-results/a03-06-source-after.json`。

## 修正後の結果

`test-results/a03-06-after.json`：**83 / 83 PASS、skip 0、FAIL 0**。

- 新規 A03-06 の画面回帰 10 件が PASS。初回 get、PNG、背景、完成待ちを描画前／後の往復でそれぞれ確認。同一 user の初回 get / PNG 継続も確認した。
- 新規 PWA 3 件が PASS。古い同期待ちと送信済み要求を無効化し、新要求は開始可能。同一 user 更新では元の要求を保持した。
- A19 の既存「往復後も旧 Editor を保持する」期待は、今回の正しい新 mount と矛盾するため更新した。実保存後の応答だけを遅延し、新画面で保存済みピンク色を復旧→新しくクレヨンで編集→旧応答到着→表示・保存を上書きせず、旧移動も再開しないことを確認した。
- A03 の既存非同期回帰 20 件、設定の表示・保存整合性、A19 明示破棄の失敗対象限定、既存 PWA 更新・離脱 guard を含む。

その後、URL が /paint、履歴数不変、新 Editor で PWA 更新不可という明示 assertion を加えた最終 `ui-navigation-loss` **17 / 17 PASS**を `test-results/a03-06-navigation-final.json` に保存した。上記 83 件と重複する回帰であり、合計 100 件とは数えない。全体 TypeScript と担当ソース・テストの ESLint も PASS。

ビルド・全機能 E2E・性能検証はメイン担当へ引き継いだ。この記録の成功件数は下記の実 React / IndexedDB テストであり、新 build のブラウザ確認を済ませたという主張ではない。

全体統合で `ui-unreadable.test.tsx` の単体 Settings mount による不一致を検出した。この fixture は App のアカウント世代 key を通らず、実際には新画面になる A→B→A 後も同じ Settings を操作していた。2 ケースとも実 App と `#/settings` を使う形へ変更し、旧出力の破棄、回復領域 DOM の新 mount、新しい出力の成功を確認した。`test-results/a03-06-recovery-final.json` は **2 / 2 PASS**、当該 ESLint も PASS。本体の追加変更はない。

## 検証コマンド

```powershell
npx vitest run tests/ui-async-races.test.tsx -t A03-06 --reporter=json --outputFile=test-results/a03-06-before-isolated.json
npx vitest run tests/ui-navigation-loss.test.tsx -t A03-06 --reporter=json --outputFile=test-results/a03-06-pwa-before.json

# 修正後
npx vitest run tests/ui-async-races.test.tsx tests/ui-navigation-loss.test.tsx tests/pwa-updates.test.ts tests/persistence-discard.test.ts tests/ui-settings-consistency.test.tsx tests/persistence-settings-consistency.test.ts --reporter=json --outputFile=test-results/a03-06-after.json
npx vitest run tests/ui-navigation-loss.test.tsx --reporter=json --outputFile=test-results/a03-06-navigation-final.json
npm run typecheck
npx eslint apps/web/src/App.tsx apps/web/src/use-account-scope.ts apps/web/src/guarded-route.tsx tests/ui-async-races.test.tsx tests/ui-navigation-loss.test.tsx --max-warnings 0
```

この段階は実 React + IndexedDB による競合条件の診断。PNG byte の描画品質、実 OAuth の切替、実ブラウザの account UI、実 Service Worker の activate は検証していない。SW の境界は制御した EventTarget / MessageChannel、reload は spy としている。
