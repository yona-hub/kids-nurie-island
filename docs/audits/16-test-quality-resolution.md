**A16-02 / A16-03 実装修正・再検証記録（独立再監査の判定ではない）**

2026-10-07。元の独立報告 `16-test-quality.md` は変更していない。A16-01の非demoクラウドE2Eは `16-cloud-e2e-resolution.md` に別記する。

A16-02は、既定1500msと指定100msの両方で、期限1ms前の変更を2回挟むテストへ置き換えた。最初と2回目の期限では送信0、最後の変更から所定時間が経過した時点で1回、最新の色と名前のみ送信されることを確認する。IndexedDBのsetImmediateは実時計、アプリの期限時計だけをVitestで制御し、検証からflushを強制しない。

同一テストに対し、Vite変換時だけ2種類の誤った実装を与えた。本体ファイルは書き換えていない。タイマーの取消を欠落させた負例は2ケースとも、最初の期限の送信数で失敗。既定値を500msへ変えた負例は既定ケースが期限前に失敗し、設定100msのケースは成功した。`tools/quality-audit/debounce-mutation.config.ts` と `test-results/a16-debounce/{omit-reset,wrong-default}.{json,log}` が証拠。これらの意図したFAILと、正しい実装の成功を混同しない。対象を絞るtestNamePatternによる除外は負例専用実行であり、通常の全体テストでは全件実行する。

A16-03は `tests/assets-generated-review.mjs` を現行の下書き保持へ合わせた。領域名を編集→別線画→戻る操作で編集内容を保持し、`QA 未検査` と「未保存・未承認」を検査。確認が不足した承認ボタンからのPOSTは0件、CSRFなしの直接要求は403となる。生成原画の表示画素も照合した。

2026-10-07 08:49:47–49 JST、Chromium 153.0.8010.12の実制作UIで成功。全10件の公開素材と人間承認記録20ファイルは前後SHA-256が一致し、承認・原画・作品へ変更を加えていない。結果は `tools/asset-pipeline/output/generated-review-result.json`。開始・終了時刻、対象コード3ファイルのhash、保護対象20ファイルのhash、UI POST件数を含む。旧結果は `test-results/a16-review/previous-result.json` に保存した。

この時点の全体Unitは36ファイル282件成功、型・lint成功（`test-results/unit-results.json`、08:45:25 JST開始）。以後のA19修正は最終統合検証で更新する。ブラウザ結果はデスクトップ自動実行であり、実機の操作とは表現しない。

A16-01の実ブラウザ検証で、Galleryのthumbnail再取得中に現在表示中のblob URLを解放する経路も発見した。`Thumbnail`の取得処理とURL寿命を分離し、Reactが次の画像srcをコミットしてから前のURLを解放する。カードが消える直前にstateへ積まれたURLもアンマウントで解放する。`tests/ui-thumbnail-lifetime.test.tsx`の2件で、再取得待機中に元画像が有効なこと、src切替後の旧URL解放、カード削除後の遅延結果から新URLを作らないことを確認した。結果は `test-results/a16-thumbnail-lifetime.json`。この修正を含む固定buildで非demo 9ケースと最終全機能検証を実施する。

その後のtraceでは、観測したWebKitのblob errorはGalleryを開く前の編集画面で、`context.setOffline(true)`の直後に発生していた。したがって上記のGallery修正はコード確認とDOM回帰検査で確認した別経路であり、このブラウザログの直接原因だったとは扱わない。WebKitのオフライン注入と実配信停止の対比、および最終クラウド検査の通信障害条件は `16-cloud-e2e-resolution.md` に記録する。

## 10:04以降のブラウザ検査の待機条件

`test-results/final-a19-04/functional/` は175成功・3対象外・2失敗。生結果、trace、画面、開始/終了時のbuild/source/hashを保持した。成功へ書き換えていない。

- 復元のキーボード検査では、バックアップのdownload通知直後に、まだ `disabled` の復元ボタンへ `press('Enter')` していた。WebKit traceの `call@188` がdisabled要素の解決とキー送信を記録している。`press`は`click`と異なり有効化を待たないため、復元ボタンの有効化をassertしてからキー操作へ進む。Enter/Space→実filechooserとキャンセル・focus帰還の要求は維持。
- 設定の再読込検査では、チェック状態は楽観表示であり、保存commitの完了を表していなかった。最後のタップ補助OFF直後のreloadで旧値を観測した。既定のsleepで延長せず、native IndexedDBの設定をread transactionのcomplete後に読み、変更した3項目すべてを照合してからreloadする。書き込み自体が失敗すればこのassertが失敗する。

変更後の `final-review-v2/focused-ui/` はChromium desktop/mobile・Firefox診断コピー・WebKitの8/8成功（45.6秒、skip/retryなし）。本体Settings/AppProviderをこの2件のために変更していない。全体E2Eの成功は別途、最新固定buildで取り直す。
