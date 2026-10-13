**A19-03 HTTP 本文停止の実装修正・ローカル検証記録**

実施日時：2026-10-07 08:58〜09:02 JST。独立再監査の判定ではない。

修正前は、実 Supabase SDK を通す `projects` の HTTP 応答でヘッダーと本文先頭 `[` だけを返すと、15,001ms 後も transport の `AbortSignal.aborted` が `false` だった。従来の wrapper は `fetch()` がヘッダーを返した時点でタイマーを解除し、SDK の本文読み取りが期限を持たなかった。新規回帰の最初のケースで失敗を確認してから修正した。

`auth.ts` の通信境界に `http-deadline.ts` を追加した。一つの 15 秒 deadline でヘッダー取得、本文の最後、JSON 応答の構文検証まで待つ。SDK には元の Response を返すため、URL・status・headers・本文の読み取り契約を維持する。失敗時は内部 signal を abort し、tee の両側を cancel する。呼び出し側の中断、完了時の timer/listener 解除、abort を無視して遅れて到着する応答の破棄も含む。JSON の同期 parse が実行スレッドを占有する間の強制中断はできないため、parse 後にも deadline 超過を検査する。

保存の本文停止により認証側が offline と判定した後、不要な pull を SDK が GET 再試行する経路も検出した。`index.ts` の担当者が `cloud.list()` 前に offline guard を追加した。`finally` の lease 解放と未同期件数更新は継続する。保存内容・operationId・未確認 payload は変更しない。

| 検査 | 結果 |
|---|---|
| ヘッダー後に本文停止 | 14 秒時点では待機、15 秒で abort、同期待ちを解放 |
| サーバー保存確定後に本文停止、待機中に追記、再起動 | 元 payload と operationId を再送して receipt を回収し、その後に新しい編集を保存。クラウド作品 1 件・version 2・未同期 0 |
| 本文途中切断／壊れた JSON | ローカル pendingCommit を保持し、再接続後の同一 operationId 再送で複製せず復旧 |
| 同期待機中のログアウト／アカウント削除 | deadline 後に待機終了。削除は再接続後に本人の要求を 1 回送信 |
| caller abort／通常応答 | caller 中断で offline 誤判定なし。通常 Response の URL/本文を保持し timer/listener を解除 |
| Auth 500／fetch error | 現所有者の offline 利用を保持し、再検証成功時に online に復帰 |

新規 `tests/persistence-http-deadline.test.ts` は **10 件成功**。実 Supabase SDK と本体サービスを使用し、HTTP transport は ReadableStream stub、IndexedDB は fake-indexeddb、deadline は既定 15,000ms を fake timer で進めた。サーバー保存は receipt を持つ MemoryCloud を用いる。外部通信やホスト済み Supabase の測定とは区別する。

関連回帰は **8 ファイル 61 件成功**。Auth callback/offline/race、削除 API と削除 journal、Storage、未確認操作の再起動と A→B→A、PGlite 実 SQL の 1/499/500 件・応答喪失後の receipt 回収・後続削除を含む。`tsc --noEmit --incremental false` と変更範囲の ESLint も成功した。

生レポート：`test-results/http-regression-results.json`。再実行コマンド：

```powershell
.\node_modules\.bin\vitest.cmd run tests/persistence-http-deadline.test.ts tests/persistence-auth.test.ts tests/persistence-auth-races.test.ts tests/persistence-cloud.test.ts tests/persistence-account.test.ts tests/persistence-deletion-recovery.test.ts tests/sync-audit11-retry.test.ts tests/sync-audit11-retry-sql.test.ts --no-file-parallelism --reporter verbose --reporter json --outputFile test-results/http-regression-results.json
```

検証時の SHA-256：

| ファイル | SHA-256 |
|---|---|
| `packages/persistence/src/auth.ts` | `d98b25a670bff7dc130bf025498ff1d3142058b0b000ce186942dd555fdee625` |
| `packages/persistence/src/http-deadline.ts` | `5395046e09727e5a1091e423196eb71bc58dcc25385da2b8bda041667fef4521` |
| `tests/persistence-http-deadline.test.ts` | `060d8347a55d7163525cb6ebbfaa3186ac60d50bf000ee7227c232d38655a532` |

本記録の範囲ではブラウザ実 HTTP の本文停止や実 Supabase/Google は未実施。非 demo の実ブラウザ結合検査は別の A16 記録に分離する。
