**Agent 14 — Security / Privacy：PASS（修正後再監査）**

対象はXSS、CSRF相当、secret混入、認証、データ隔離、削除、バックアップ入力、CSP、ローカル制作サーバー。仕様29節・33〜36節、後続ユーザー指示、前回の担当報告を確認し、現在のソースと独立検査で判定した。実装・承認記録の編集、外部サービス変更、他エージェント起動は行っていない。

**A14-01 — 前回Severity P2：解消**

「クラウド削除の成功応答を失い、その後セッションも失効すると、端末データを削除完了できない」という前回所見を再検証した。

- **再現**：実Supabase SDK・HTTPスタブ・fake-indexeddbでAのデータを用意。サーバー削除後の応答だけを失わせ、終了→時計を2時間進める→再起動→`refresh_token_not_found`を返した。
- **実測**：再起動後セッションは`null`。Aの作品・サムネイル・設定・編集経路はすべて**0件**。削除状態は`local=complete / cloud=unknown`。削除HTTP要求は初回の**1回のみ**。
- **根拠**：[account-deletion.ts:45](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/persistence/src/account-deletion.ts:45)が所有者に結び付いた削除同意を検証し、関連データを同一トランザクションで消去する。[index.ts:187](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/persistence/src/index.ts:187)で認証初期化と独立して回復を開始する。[DeletionRecoveryNotice.tsx:22](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/apps/web/src/components/DeletionRecoveryNotice.tsx:22)は端末消去とクラウド完了未確認を区別して表示する。
- **影響の再確認**：Bの作品・画像・設定・編集経路・認証は保持された。削除途中の失敗では全体がロールバックされ、未ログインでも再試行できた。
- **推奨修正・修正必須か**：前回推奨の永続同意、認証に依存しない端末消去、クラウド状態との分離を確認した。追加修正不要。
- **再テスト**：応答喪失と期限切れ、5ストアそれぞれでの消去失敗、Bへの切替、共有IDBを使う2インスタンスの同時回復、通知を受け取らない状態での遅い同期・画像応答を検証した。実ブラウザの複数タブ試験とは区別する。

今回の独立検査は、ファイルを書き出さないNode一時ハーネスで実施した。

| 検査 | 結果 |
|---|---|
| 削除復旧・バックアップ入力・端末隔離 | **24項目PASS**。不正入力拒否、復元時の所有者・ID変更、A→B→A切替時の拒否を確認 |
| 復旧UI・遅延応答 | **5項目PASS**。実React＋jsdomで再試行、表示、HTML文字列のエスケープ、消去後の復活防止を確認 |
| SQL・RLS・Storage | 現在の3 migrationをメモリ内PGliteで実行し、**16項目PASS** |
| 削除HTTP・制作API・キー設定 | **19項目PASS**。Origin、Bearer、対象ID、同意、本文上限、制作トークン等を検証。制作記録への書込・再生成は**0回** |
| secret混入 | **348テキストファイル**を検査。唯一の候補は`tests/persistence-auth.test.ts:58`の拒否テスト用偽キー。実secretの検出は**0件** |
| XSS・制作サーバー | 調査した本番経路に危険なHTML挿入・`eval`を検出せず。制作UIのテキスト出力、loopback限定待受、Host検査を確認 |
| 採用記録・公開gate | 新10件の採用記録、現在・human承認・QA・公開データのhash、原画hashが一致。公開gate PASS、旧手描き素材のカタログ掲載0件 |

独立検査は合計**64項目PASS**。既存`test-results/unit-results.json`の282/282成功も確認したが、現在の`index.ts`更新前の記録であり、現行コードの全テスト再実行結果とは扱っていない。

**未実施・適用範囲**：実Google認証、実Supabase、配備済みEdge Function・Storageは未検証で、指定された外部Credentials例外として扱う。新規実ブラウザE2E・CSP強制動作は未実施。読み取り専用条件下で既存の`test-results/ui/detail-chromium-desktop.png`を確認したが、動的セキュリティ検査の代替にはしていない。

4174番へのHTTP検査は200応答だったが、CSP・X-Frame-Optionsは存在しなかった。[公開用ヘッダー設定](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/apps/web/public/_headers:6)は確認済みで、公開ホストでの適用は未検証。既存Firefox証跡はworkspace内のmanifestを1byte変更した診断コピーの結果として扱い、未変更の公式配布版や実機の成功とはしていない。素材は承認整合性のみ確認し、全領域幅・描画品質の再監査は行っていない。

**新規発見：0件。最終判定：PASS（Agent 14担当範囲）。未解決件数：P0＝0、P1＝0、P2＝0、P3＝0。**