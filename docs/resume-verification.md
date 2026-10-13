# 2026-10-07 再開検証

前回停止の記録 `paused-handoff.md` は保持。正式採用10枚と瞳22個・ハイライト22個の承認は変更していない。今回の証拠は `test-results/harness-resume/` に分離する。

## ハーネス接続

AGENTS.mdと`.harness/project.json`、`.harness/lock.json`を作成し、既存の仕様・ユーザー画像指定・採用記録・監査原文・引き継ぎを参照する。共通Coreは0.1.0、SHA-256 `bc9cd158e1a97dc3c5977eb068249e37f8ecf902802110d84b217f42938ff20b`へ固定。Coreの編集・再検査は行っていない。Git/Issue/ADRの証拠は存在せずunknownとする。

検索の初回は過去生成ログが上位へ出たため、参照元だけを`project-docs` scopeへ登録した。`search-scoped.json`と`context-scoped.json`で現在の画像指定と引き継ぎを取得した。catalogのproposedは検索マッピングを人間採用済みと偽らないための状態であり、実際の画像採用の根拠は元の`user-adoption.json`。runtimeはignore対象。モデル/effort、有料サービス、外部環境、スケジュールは変更しない。

## テストと性能修正

- 最初の3build、lint/typecheckは成功。全体Unitは45ファイル373件中372件成功、ローカルHTTP fixture1件のみsandbox接続EACCES。権限を調整した該当1件が成功した。最初の失敗を消さず、全体結果と限定再検査を分けて保存した。
- 最初の最新版性能測定はLighthouse96/100/100、おひめさまPASS。恐竜r01のCPU4/DPR2描画p95は129.3ms、混在時は105.2msで100msを超えたため、その結果を保持した。
- `texture.ts`の鉛筆線を32段階の近いopacityごとにまとめ、同じ複雑なclipを線ごとに処理する回数を減らした。線座標・幅・乱数消費順は保持。正式10枚の最大領域×320/696/2048px×白/黒/桃の90ケースで、差は最大2/255、平均差最大0.019957、差8超は0。完全画素一致ではない。
- 描画関連8ファイル62件、実caller2ファイル15件を変更後に再検査し成功。変更後のdemo/本番/cloud試験3buildと型検査、変更lintも成功。
- 変更後の`pencil-fix/performance/`はbuild/source/harnessと配信HTML/JS/CSSのhashを前後照合。CPU4/DPR2のおひめさまp95 58.7ms／混在43.8ms、恐竜p95 91.5ms／混在96.7ms。3画材×12未使用色＋混在4色、描画エラー0。CPU4の操作中推定FPSは57.69/54.80であり、物理present・実機60fpsの証明ではない。
- 同じ固定版のLighthouseは96/100/100、LCP2.565秒、CLS0。初回/再訪、背景3/枠3、作品30回開閉をCPU1/4で記録。最初10回をwarmupとしたGC後JS heapの増分は145,484/146,708 bytes。短い検査から長時間の漏れ0・GPUメモリ・実Android性能を主張しない。
- 最新配布OSS40項目はpublic/3build/HTTPの10対象でbytes/hash一致。詳細は`pencil-fix/license-results.json`。

## 独立監査と残り

03と11と19の限定独立再監査がPASS。05は鉛筆変更の追加限定再監査PASS。前の監査原文はhistoryへhash一致で保存した。最新非demo同期試験は3ブラウザ9件成功（2.9分）、skip/retryなし。

本物SWの更新保護もPASS（`pwa/update-results.json`）。実旧版`index-BDz80J0o.js`から最新`index-yWC7UATR.js`への移行は、実2タブの拒否・保存保留の保護・全タブ終了後の自然activate・同一Contextで作品と2色と設定を保持・offline新規タブで再入場までPASS。配布20ファイルの前後hash不変、console/pageerror0（`pwa/migration/`）。OS/PWA実ウィンドウ・実機・外部認証の移行成功とは扱わない。旧UI単独では案内文を更新できず、外部手順が必要という制限は維持する。

17/12も独立再監査PASS。A12-02 P3（実機・物理表示・長時間heapの将来改善）1件は維持。最新固定版の全機能177成功・対象外3件・失敗0（13.3分）、画面比較5構成成功（27.5秒）、最終全体Unit45ファイル373件成功（22:54:53 JST開始、92.01秒）。各検査の前後identity一致、skip/retryを追加していない。10基準PNGは変更なし。mobile/desktop編集とhomeの実画像を目視し、白黒線画・瞳内枠・画材/色選択の収まりを確認した。最初の失敗は履歴として保持する。

09の限定独立再監査もPASS。01〜19の各最新報告と現行成果物・保存生証拠を20が独立照合し、2026-10-07に最終PASS／RELEASE-QUALITY PROTOTYPEと判定した。未解決P0/P1/P2は各0、既存P3 A12-02が1件、新規所見と追加必須修正は0件。20は成功済みの動的検査を反復せず、bytes/hash・原文・assertion・画像を照合した。根拠は`audits/20-release.md`。Supabase/Google/HTTPSの外部設定と実接続確認、一般公開、実機・長時間性能確認は今回の完了範囲に含めない。

証拠索引は最終20報告を含む28件に更新した。共通Coreのrecordで`resume-20261007-release-final`をdoneとして保存し、3受入条件の証拠を付けた（`test-results/harness-resume/final-record.json`）。このdoneは再開時のproject接続・固定版検証・独立監査統合の完了を示す。外部サービスの公開や元のusageLimited goalを再開/完了させる操作ではない。

同じ失敗2回または進展なしで停止し、引き継ぎを残す。検査は変更または失敗が根拠となる範囲だけ再実行する。commit/push/deploy・他プロジェクト・外部サービス変更は今回の範囲に含めない。
