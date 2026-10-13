**A11-04 保存トランザクションの原子性修正・実装担当の検証記録**

2026-10-07 10:17〜10:18 JST。監査原文 `docs/audits/11-sync-consistency.md` は変更していない。本記録は独立再監査の判定ではない。

修正前に新規15ケースを実行し、**10失敗・5成功**を確認した。原文の再現対象と同じ `index.ts` SHA-256 `21d694eac62e0f967511e33bdc20a2e64fb56b76cd60dbb4fd9f1a3e0dfad9db` で実行している。

| 書き込み境界 | 修正前 | 修正後 |
|---|---|---|
| 編集先対応request成功→A→B／A→B→A | `AUTH`だがtransactionはcomplete。作品1件・孤立対応1件。原本を読み直しても`DELETED` | abort・対応0件。Aに戻って原本を読み直すと元IDへ保存できる |
| コピー作品request成功→A→B／A→B→A | `AUTH`だが作品2件と対応がcommit。原本の再読込後の保存もコピーへ転送 | 確定前に認証世代を再確認してabort。作品1件・対応0件、原本へ再保存できる |
| 対応request成功→作品putで容量例外 | `STORAGE`だが対応だけcomplete。再試行は`DELETED` | transaction全体をabortし、同じ編集状態から再試行してコピーを保存できる |

いずれもdemo/cloudの両方で検査した。アカウント切替8件は、同じデータベースに置いたBの作品と設定が変わらないことも比較する。

変更は `packages/persistence/src/index.ts` の `projects.save()` 内に限定した。作成したtransactionをcatchから参照できるように保持し、失敗時には `abort()` と `done` の終了待機を行ってから既存の `storageFailure()` へ渡す。作品putの成功後にも所有者・認証世代を確認する。保存失敗ticket、実行中保存の登録・解除、未確認クラウド操作、公開APIは変更していない。

修正後、同じテストファイルの **15ケースが成功**した。上記10ケースのほか、通常競合のコピーと対応の同時確定、transaction completeより後にsaveが解決すること、元IDからの連続8保存、499→500件でのコピー作成、500件で別の古い編集を拒否して余分な対応を作らないこと、500件でも既存コピーに保存できること、同期担当交代後も同じコピーへ保存することを含む。

テストは `fake-indexeddb` の実request/transactionスケジューラーと本体サービスを使う。`IDBObjectStore.put`自体は元の実装へ委譲し、返されたrequestのsuccessイベントで認証通知を1回だけ発生させる。容量ケースだけは、対応成功後の作品putに同期 `QuotaExceededError` を注入する。transactionをPromise mockへ置き換えたり、待ち時間だけで発生位置を推測したりしていない。認証はTestAuth、クラウドはMemoryCloudであり、実ブラウザのIDB・Google OAuth・ホスト済みSupabaseの検証とは扱わない。

関連するpersistence/sync/RLS全体は **18ファイル・149ケース成功**（新規15件を含む、10:18:02 JST開始、20.47秒）。実migrationを読み込むPGliteのSQL CAS・RLS・1/499/500件の応答消失・再起動・削除、A→B→A、設定・削除journal、HTTP本文期限、破損記録隔離を含む。A19-04の保存失敗ticketの8ケースも成功した。全体のTypeScript型検査と変更した2ファイルのESLintも成功した。build・全体Unit・ブラウザ・性能の最終再採取はroot担当に引き継いだ。

生レポート：

- `test-results/a11-04-before.json`：10:17:10 JST、旧実装10失敗・5成功。
- `test-results/a11-04-after.json`：10:17:40 JST、修正後15成功。
- `test-results/a11-04-regression.json`：関連149成功。

検証時のSHA-256：

| 対象 | SHA-256 |
|---|---|
| 修正後 `packages/persistence/src/index.ts` | `c414d4b6d8a0f0733276bbfb0c732730c614af63f8cef145d2d55fa57186284f` |
| 前後で同一の `tests/persistence-save-transaction.test.ts` | `11797cc852e651ed47ffef4c5cf3bb5d359c42b7e28f21daaE2e18df8aa27c10` |
| 不変の監査原文 | `9f073987e9aea76ff22cd1967bf2eaba7fe229d69b8d6409828f4edae65a8c7a` |

再実行コマンド：

```powershell
.\node_modules\.bin\vitest.cmd run tests/persistence-save-transaction.test.ts --no-file-parallelism --reporter verbose --reporter json --outputFile test-results/a11-04-after.json
$testFiles = @(rg --files tests -g 'persistence*.test.ts' -g 'sync*.test.ts' -g 'rls*.test.ts')
& .\node_modules\.bin\vitest.cmd run @testFiles --no-file-parallelism --reporter verbose --reporter json --outputFile test-results/a11-04-regression.json
.\node_modules\.bin\tsc.cmd --noEmit --incremental false
.\node_modules\.bin\eslint.cmd packages/persistence/src/index.ts tests/persistence-save-transaction.test.ts
```
