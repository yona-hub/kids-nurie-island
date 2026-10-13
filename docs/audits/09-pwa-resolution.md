# A09-04 — 更新待機と未保存画面の競合を防ぐ修正

独立監査 `09-pwa-offline.md` の原文は変更していない。本記録は追加所見 A09-04 の実装側の検証であり、独立再監査の PASS ではない。

## 再現と変更

ホームの「更新する」が待つ `sync.flush()` の完了を遅延させ、その間に Editor で初回保存を開始し、ホーム移動を保留した。実 App / Editor / GuardedRouteProvider / persistence と旧更新ハンドラ・旧PWA判定の組合せで、URL が `#/home`、実表示が Editor、保存待ちあり、`localSaveFailed` は false でも **SW 更新要求が 1 回**送られた。`test-results/a09-update-before.json` にこの回帰テストの期待失敗を保存した。SW境界を計数する再現であり、実ブラウザでのデータ損失を主張しない。

修正では URL を更新許可の根拠から外した。

- `navigation.ts` が、GuardedRouteProvider の実表示 route、遷移保留、未保存、保存待ち、世代を同期参照する窓口を提供する。未マウント・画面切替コミット前は許可しない。判定は Editor の ref を参照し、再描画を待たない。
- App の更新ボタンは同期待機の前後で要求番号・画面世代・保存条件を照合する。編集へ移動してホームに戻った場合や「あとで」を選んだ場合も、古い同期待機は更新要求を出さない。アカウント変更も要求を無効にする。
- main / pwa-updates は実表示の安全判定を使う。更新要求に画面世代を保持し、ナビゲーション通知で失効させる。`controllerchange` 直前にも同じ世代、ホーム表示、遷移／未保存／保存待ちなし、localSaveFailed なしを再確認する。外部 controllerchange だけでは reload しない。
- SW の activation 処理は `pwa-activation.ts` に切り出し、実登録ハンドラと同じ関数をテストする。管理下・未管理を含む app client が要求元 1 枚だけであることを確認し、そのページへ MessageChannel で最新状態を照会する。照会後に client 数を再取得し、最後にもう一度ページの世代・実状態を確認してから skipWaiting する。応答なし・古い requestId・編集開始・別タブ追加は拒否する。

ブラウザの別文脈間に完全な原子操作はないため、SWへの最終返答後に画面が変わる場合も、ページ側の controllerchange 再確認で reload を防ぐ。

変更: `App.tsx`、`guarded-route.tsx`、`navigation.ts`、`main.tsx`、`pwa-updates.ts`、`pwa-activation.ts`、`sw.ts`。persistence / RecoveryPanel は変更していない。

## 自動回帰結果

2026-10-07、**50 / 50 PASS**。

| 範囲 | 件数 | 内容 |
|---|---:|---|
| PWAページと実SW activation関数 | 17 | 正常更新、実表示との不一致、dirty／保存待ち／保留、世代変更、保存失敗、別タブ、2回の確認間の変化、遅いcontrollerchange、初回・外部control、timeout、旧protocol |
| 実Appの更新ボタン統合 | 3 | 同期遅延→保存中Editor→home保留、途中で別画面へ往復、「あとで」で取消 |
| A19未保存遷移回帰 | 10 | 履歴両方向、raw hash、保存失敗、pending、明示破棄、再入場、所有期間変更 |
| 既存A03非同期所有権 | 20 | 既存のasync/アカウント保護 |

実 App 統合は JSDOM と fake-indexeddb、描画・音声境界を軽量化。PWA 単体は実ページ／SW関数と、模擬 MessagePort・client一覧・reload 境界を接続している。実ブラウザとは区別する。結果: `test-results/a09-pwa-unit.json`。変更範囲 lint と TypeScript も PASS。

```powershell
npx vitest run tests/pwa-updates.test.ts tests/ui-navigation-loss.test.tsx tests/ui-async-races.test.tsx --reporter=json --outputFile=test-results/a09-pwa-unit.json
```

## 実 Service Worker とブラウザ

`scripts/check-pwa-update.mjs` を拡張した。root 固定の demo build `index-Cd4pQPIU.js` を一時localhostで配信し、SW本文にはバージョン識別コメントだけを付加して本物の waiting worker を作る。配信ファイル・本体ソースは書き換えない。

既存の2タブ拒否、Editor文書・zoom・保存色保持、1タブにして明示更新、更新後のoffline reloadを維持。追加経路では build が公開する実 service の flush **完了境界のみ**を遅延させ、実 App の更新ボタンを押す。Editor の native IndexedDB transaction は read request の連鎖で未コミットのまま保持する。URL home / 実表示 Editor / 確認dialog / 保存待ちの状態で flush を解放し、更新イベント・activation要求・controllerchange が 0、同じ文書と waiting worker が残ることを検査する。さらに登録処理へ直接更新イベントを送っても拒否されることを確認する。

**2026-10-07 09:23 JST、実Chromium検査 PASS。** 初回実行で全経路が成功し、fixture・本体の追加変更はない。保存待ちEditorを保持した時点の実測は、更新イベント 0、activation要求 0、controllerchange 0、元の文書識別子を保持、native IDB transaction は未コミット。登録処理への直接イベントも拒否。別タブ拒否、保存色・zoom保持、待機解除後の明示更新、更新後offline reloadも成功し、console error / pageerror は 0 だった。

対象SWの SHA256 は `a87ae3a516124dbb5e93b5eed40482c7643e7d7721e2f65122121766a1ea499b`。配信3ファイル＋担当ソース7ファイルの raw SHA256 を実行前後で比較し **10 / 10 不変**。`test-results/a09-pwa/build-before.json` / `build-after.json` / `build-comparison.json` に保存。再現コマンドは以下。

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\yonaf\AppData\Local\ms-playwright'
node scripts/check-pwa-update.mjs
```

出力は `test-results/pwa-update.json`（固定コピー: `test-results/a09-pwa/pwa-update.json`）と `test-results/ui/pwa-update-delayed-editor-blocked.png`。390×844の保護dialogも目視し、保存待ちの理由と戻る／保存して移動の操作が読めることを確認した。スクリプト自身が Lightpanda Ensure / Status を実行し、Docker Hyper-V backend timeoutを記録した。Chromium はユーザーの既存の指定・承認による fallback。`test-results/a09-pwa/browser-readiness.json` に診断を保存した。実Supabase障害・物理端末の強制終了は検査していない。

## 互換性とAPIの根拠

新workerは、requestId と新しいページ照会に応答できない旧clientからの強制 activation を拒否する。旧clientは全アプリタブを閉じて再入場すれば、通常のSW lifecycleで更新できる。旧workerが先にactivateした場合でも、新ページの最終判定は未保存編集のreloadを防ぐ。

[MozillaのskipWaiting説明](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting)にある通り、このAPIは待機workerのactivationを進めるため、使用前に当該ページと全app clientの条件を照合する。[matchAll](https://developer.mozilla.org/en-US/docs/Web/API/Clients/matchAll) の `includeUncontrolled` を維持し、[controllerchange](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event) を「更新の同意」ではなく、再確認が必要な通知として扱う。
