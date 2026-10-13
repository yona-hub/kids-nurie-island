**Agent 11 限定独立再監査：PASS**  
監査日：2026-10-07 22:25〜22:31 JST  
**残存A11-04は解消。今回の確認範囲に未解決の必須修正はありません。**

**範囲と証拠の扱い**

AGENTS.md、前回Agent11報告、`11-save-transaction-resolution.md`、仕様の保存・競合・500件上限・報告形式、対象実装と新規テストを読みました。今回の独立確認は`projects.save()`の例外時abort、所有者・認証世代の再確認、編集先対応と作品の原子性、再試行、容量例外と500件境界に限定しました。以前解消済みA11-01／A11-02は既存の独立証拠と現在の該当処理を照合し、全面的な再監査は行っていません。

前回のFAIL報告を変更前に[日時付き履歴](history/20261007-222602-11-sync-consistency.md)へコピー保存しました。保存元と履歴のSHA-256はともに`9f073987e9aea76ff22cd1967bf2eaba7fe229d69b8d6409828f4edae65a8c7a`でした。

実装担当の記録だけを判定根拠にせず、テストの注入位置と検証内容を読んでから、最新ソースに対して関連テストを**1回だけ独立実行**しました。[独立実行の生レポート](../../test-results/a11-independent-save-transaction-20261007-2229.json)は2026-10-07 **22:27:02.597 JST開始、15成功・0失敗、終了コード0**です。コンソール結果は1ファイル・15件成功、Vitest計測時間1.74秒でした。

**A11-04 — 保存失敗で編集先対応だけがcommitされる**

**前回Severity：P2／今回：解消（PASS）／修正必須：いいえ**

**根拠**

- [transaction生成・保持](../../packages/persistence/src/index.ts#L541)：`projects`、`leases`、`editorRoutes`を同じreadwrite transactionへ含め、対応putと作品putを一体で確定・取消します。
- [所有者の再確認](../../packages/persistence/src/index.ts#L578)：作品put直前、成功直後、transaction完了後に`checkOwner()`を呼びます。[ownerCheck](../../packages/persistence/src/index.ts#L89)は利用者IDと認証世代を比較し、[世代更新](../../packages/persistence/src/index.ts#L167)によってA→B→Aも検知します。
- [例外処理](../../packages/persistence/src/index.ts#L587)：catchで保持したtransactionの`abort()`を試み、`done`の終了を待ってから既存の失敗処理へ渡します。対応成功後のAUTHや後続putの容量例外による部分commitを防ぎます。
- [境界の観測](../../tests/persistence-save-transaction.test.ts#L41)：`IDBObjectStore.put`は元の実装へ委譲し、実requestのsuccessで認証変更を1回発生させます。transactionをPromise mockへ置き換えていません。容量ケースのみ対応成功後の作品put直前に同期`QuotaExceededError`を注入します。

**再現方法と独立実行結果**

同じIndexedDBを共有する2サービスでAの原本を開き、一方の赤保存後に、他方の古い状態から青保存を行います。競合コピーの対応put成功、またはコピー作品put成功でA→B／A→B→Aを発生させます。中断後にAへ戻り、原本を読み直して青を再保存します。容量例外では古い編集状態を保持したまま再試行します。

| 確認項目 | ケース数 | 結果 |
|---|---:|---|
| 対応／作品put成功後のA→B／A→B→A、demo/cloud | 8 | `AUTH`・abort。Aの原本1件、対応0件、孤立対応0件。赤を保持し、再読込後は原本IDへ青保存成功。Bの作品・設定も一致 |
| 対応成功後の作品put容量例外、demo/cloud | 2 | `STORAGE`・abort・対応0件。同じ古い編集状態から再試行成功、作品2件、保存失敗表示を解除 |
| 通常競合・元IDからの連続8保存、demo/cloud | 2 | 対応とコピーがcomplete、save解決よりcompleteが先。8保存は同一コピーID、原本の赤を保持 |
| 499→500件・500件で新しい退避拒否・既存コピー継続、demo/cloud | 2 | 500件維持、追加退避は`LIMIT`、対応は増えない。既存コピーへの保存は成功 |
| 同期担当交代後の連続8保存 | 1 | 同じコピーID。MemoryCloudの2作品に原本の赤、コピーの青・最終タイトルを保持。未同期0件 |

認証切替テストは、対応境界の`route-success → abort`と作品境界の`route-success → project-success → abort`も比較します。保存Promiseの拒否だけを成功条件としていません。

**影響・推奨修正・必須修正**

前回の「AUTHを返したのに存在しないコピーへの対応がcommitされ、原本再読込後もDELETED」という障害は、今回の8境界ケースで再現しません。対応と作品を同時に取消して再保存でき、通常成功時の確定順序と上限保護も維持しています。追加の推奨修正・必須修正はありません。

**以前解消済み事項との照合**

- **A11-01（前回P1）：前回の解消判定を維持。** 実migration/PGliteによる応答消失・再起動・1/499/500件の前回独立結果を履歴に保持しました。現在の`prepareCommit()`は未確認snapshotを再利用し、`acknowledge()`は後続編集がある場合に受領済みbaseVersionだけを進める処理を保持しています（`index.ts:265`、`286`）。今回はSQL経路を独立再実行していません。
- **A11-02（前回P2）：前回の解消判定を維持。** 利用者ID・認証世代付きの取得予約と、実行中同期後に予約を処理するループを現行ソースで照合しました（`index.ts:114`、`459`）。前回のA保留応答→B自動取得の独立結果を保持し、今回はdebounce経路を再実行していません。

既存JSONも読取り照合し、修正前15件中10失敗・5成功、修正後15成功、関連149成功という記録と一致しました。既存149成功は今回の独立実行数へ合算していません。作業ディレクトリにGit repositoryがないため、旧ソースとのGit diffは取得できませんでした。現行実装・テストhashは修正記録に一致し、独立実行前後でも一致しました。

**SHA-256**

| 対象 | SHA-256 |
|---|---|
| `packages/persistence/src/index.ts`（実行前後一致） | `c414d4b6d8a0f0733276bbfb0c732730c614af63f8cef145d2d55fa57186284f` |
| `tests/persistence-save-transaction.test.ts`（実行前後一致） | `11797cc852e651ed47ffef4c5cf3bb5d359c42b7e28f21daae2e18df8aa27c10` |
| 今回の独立JSON | `0e3985f8e2a6759d0170cf3bc717413c7ab9d06abfa02562d295481bcc7d3c8f` |

実行コマンド：

```powershell
.\node_modules\.bin\vitest.cmd run tests/persistence-save-transaction.test.ts --no-file-parallelism --reporter verbose --reporter json --outputFile test-results/a11-independent-save-transaction-20261007-2229.json
```

**再テスト項目・未確認**

今回の15ケースを保存処理変更時の回帰対象として維持してください。実ブラウザIDBでの同じ認証変更境界、実容量枯渇／非同期quota request失敗、実Google OAuth・実Supabase、独立Postgresセッションの競争、実機は今回未確認です。既に孤立対応を持つ旧DBの修復は、今回の生成防止・中断後回復の確認対象に含めていません。

全体build・全体Unit・lint・typecheck・E2E・性能測定は実施していません。プロダクトソース・テストソース、資格情報、外部サービス、他プロジェクト、モデル／effortを変更せず、追加エージェントも起動していません。変更はこの報告、前回報告の履歴コピー、今回の限定テスト生レポートです。

**最終判定：PASS（残存A11-04の限定独立再監査）。今回範囲の未解決件数：P0＝0、P1＝0、P2＝0、P3＝0。プロジェクト全体のQuality Gate判定ではありません。**
