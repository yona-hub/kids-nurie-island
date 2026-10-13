**Agent 09（PWA / Offline）限定独立再監査：PASS**

対象：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`  
確認日：2026-10-07 JST  
判定対象：固定済み現行 `index-yWC7UATR.js` への、**公開前の旧preview限定の安全な運用移行**。A09-05はこの範囲で解消。新規所見0件、未解決P0＝0、P1＝0、P2＝0、P3＝0。製品全体のREADY判定ではない。

AGENTS.md、仕様6節・監査／品質ゲート節、前回A09報告、`09-migration-resolution.md`、README、`docs/pwa.md`を参照し、現行ソース・保存済み生JSON／ログ・4画像を独立に照合した。今回ブラウザー、build、性能検査、unitを追加実行していない。プロダクト・旧配布物・外部サービスを変更していない。モデル／effortは継承し、孫エージェントは起動していない。

前回FAIL原文は [history/09-pwa-offline-20261007-resume-agent09-225423394.md](history/09-pwa-offline-20261007-resume-agent09-225423394.md) にバイト単位で保存。コピー元・保存先のSHA-256はともに `faa2f7610dad21d7a940621d42b40b3fcb5257ed6e1335665719bc85691c0451`。

**A09-05 — 旧previewの復帰案内と安全な移行経路**

- 前回Severity：P2。今回判定：**解消（公開前previewの運用移行に限定）**。
- 修正必須：この範囲で追加の修正なし。旧更新要求の拒否を維持する。
- 旧画面単独の改善ではない。保存された実旧JSはrequestIdなしの `{ type: "ISLAND_ACTIVATE_UPDATE" }` を送り、busy／other-tabsの固定2文だけを選ぶ。Workerの返答だけで新しい移行文を旧画面へ表示できない制約は残る。

[pwa-activation.ts](../../apps/web/src/pwa-activation.ts) はrequestIdなし要求をblocked/busyとし、現行要求には唯一の要求元window clientと2回の確認応答を要求する。[pwa-updates.ts](../../apps/web/src/pwa-updates.ts) と [navigation.ts](../../apps/web/src/navigation.ts) は実表示ホーム、遷移保留、未保存・保存中、世代の照合を維持。旧要求だけにskipWaitingを許す互換経路は追加されていない。

[README](../../README.md) は「編集を終えて保存失敗がないことを確認→このアプリの全タブとインストールPWAウィンドウを閉じる→再入場」を明記し、保存エラー中は閉じず保存をやり直す案内もある。[docs/pwa.md](../pwa.md) は旧固定文の制約、外からの案内が必要、サイトデータ消去不要、公開前preview限定を説明する。メイン担当の利用者向け会話にもこの手順を伝える運用が必要であり、旧画面から自動案内できるという判定ではない。

**固定buildに対する証拠と再現**

根拠：[migration/results.json](../../test-results/harness-resume/pwa/migration/results.json)、[network.json](../../test-results/harness-resume/pwa/migration/network.json)、[build-before.json](../../test-results/harness-resume/pwa/migration/build-before.json)、[build-after.json](../../test-results/harness-resume/pwa/migration/build-after.json)、[migration.log](../../test-results/harness-resume/pwa/migration.log)。保存済み実行は2026-10-07 13:45:21〜13:45:42 UTC、Chromium on Windowsの通常ブラウザー、390×844 viewport。

| 対象 | 独立照合結果 |
| --- | --- |
| 旧版／新版の実bytes | 実旧index-BDz80J0o.js→現行index-yWC7UATR.js。旧SW fafec581…57488、現行SW 90f25d6b…447ef。networkの66記録は実ファイルのサイズ・SHA-256に不一致0 |
| 配布物の維持 | before／afterの20ファイルは完全一致。現在の実ファイルも20件すべて保存hashと一致。対象は両版のHTML・SW・manifest・JS／CSSであり全素材の包括検査ではない |
| 保存済み旧ホーム | 実旧更新UIを3回操作。requestIdなし要求3、blocked/busy応答3、文書marker保持、documentLoads 1、waiting installed。controllerChanges 1は初回制御分で更新による増加ではない |
| 保存保留旧Editor | native IndexedDB readwrite transactionをrequest連鎖で保留。旧登録handlerへの合成更新イベントによる要求増加0。直接旧protocolの負検査もblocked。文書markerとwaitingを維持 |
| 実旧2タブ | commit完了後に2タブ。旧UI要求はblocked、両文書markerとwaiting保持。理由はrequestId欠落によるbusyであり、旧要求でother-tabs分岐を実証したとは扱わない |
| 全タブ終了 | BrowserContextを維持して両タブを閉じpagesRemaining 0。受動listenerと状態照会でwindowClients 0、自然activate 1、waiting null、active activated。skipWaiting／unregisterなし |
| 同じContextで再入場 | 新JS・同作品ID・同所有者・template ID・保存情報を保持。r01 #F64C91／r02 #FF6AA3、reducedMotion true、soundEffects false、tapAssist falseを確認 |
| offline新規タブ復帰 | onlineタブを閉じoffline新規タブで同作品を開く。新JS・IndexedDB内容一致・両着色画素を確認。storage-state移植／cache消去なし、console error／pageerror 0 |

[check-pwa-migration.mjs](../../scripts/check-pwa-migration.mjs) とJSONのassertionを照合。同一の隔離localhost originで配信rootを切り替え、HTML・JS・CSS・SWの実bytesを返す。参照が残る旧immutable assetも配信できる。観測用MessageChannel／postMessageラッパーは要求と応答を記録し、SWのactivate listenerは観測のみ。Editorの検査は存在しない更新ボタン操作ではなく、合成イベントと直接旧protocol送信を区別している。

再現手順：実旧ビルドで作品・設定を保存→現行SWをinstall→旧ホームで更新3回→native commit保留Editorで負検査→commit完了後の2タブ拒否→全タブ終了→同じContextで現行版へ再入場→offline新規タブ復元。保存完了前に閉じる経路は合格条件に含めない。

4画像を今回view_imageで目視した。[legacy-home-rejected.png](../../test-results/harness-resume/pwa/migration/legacy-home-rejected.png) と [legacy-multiple-tabs-rejected.png](../../test-results/harness-resume/pwa/migration/legacy-multiple-tabs-rejected.png) は旧固定文のまま。[legacy-editor-save-held.png](../../test-results/harness-resume/pwa/migration/legacy-editor-save-held.png) と [migrated-offline-artwork.png](../../test-results/harness-resume/pwa/migration/migrated-offline-artwork.png) は同作品の冠の着色を保持。静止画像はtransaction保留・2タブ存在・offline成立の単独証拠とはせず、生JSONとスクリプトを併用した。

**以前に解消したA09-01〜04**

[cloud-e2e/build-manifest.json](../../test-results/harness-resume/cloud-e2e/build-manifest.json) のsourceと現行App、main、navigation、pwa-activation、pwa-updates、SW、authの7ファイルをSHA-256照合し全一致。Git repositoryはないため、以前の監査時点からのGit差分による無変更証明は取得できない。保護条件を現行ソースで確認し、前回所見と保存済み対象検査を対応づけて再利用した。

| ID | 前回Severity | 今回の扱い |
| --- | --- | --- |
| A09-01 | P1 | 解消維持。offline即時localSessionと再検証・失効処理を確認。保存済みunitのA09-01 6シナリオPASS。実Google認証とは区別 |
| A09-02 | P2 | 解消維持。単一要求元照合と外部controllerchangeでの自動reload抑止を確認。現行更新結果の実2タブ拒否、文書・zoom・色保持PASS |
| A09-03 | P2 | 解消維持。build-brandのflattenを確認。公開元とdist-demo maskable PNGは同hash 5456efe9…155f2。保存済み更新結果の非不透明画素0を再利用 |
| A09-04 | P2 | 解消維持。flush後の実表示・世代・保存失敗照合、2回確認、reload直前再照合を確認。遅延flush・native IDB保留・URL home背後のEditorで更新要求／controllerchange 0の保存済み結果PASS |

[update-results.json](../../test-results/harness-resume/pwa/update-results.json) は同じSW SHA-256 `90f25d6bc0fffec23824e1a24e1ff9b9e38249d2befc4616ad67fb16f58447ef` を対象とする。[check-pwa-update.mjs](../../scripts/check-pwa-update.mjs) は末尾version commentで更新を発生させ、アプリ本体・native SWと実2タブを使う。別タブ終了後の明示更新、作品保持、offline reload、error 0を記録。クラウド遅延は実サービスのflush完了境界を保留し、実外部クラウド障害ではない。

[unit-results.json](../../test-results/harness-resume/unit-results.json) の関連5ファイル（assets-cache、persistence-auth-races、persistence-auth、pwa-updates、ui-navigation-loss）は計63件PASS。総体は372/373、fixture1件FAILであり総体PASSへ読み替えない。同fixtureは [unit-fixture-results.json](../../test-results/harness-resume/unit-fixture-results.json) で再検査PASS。最終全体unit・他専門監査・全品質ゲートはメイン担当が進行中で、この限定監査で完了とは宣言しない。

**必須修正・再テスト・未実施**

この限定範囲の必須修正なし。旧preview利用者に保存完了→全appタブ／PWAウィンドウ終了→再入場を外から案内する運用を維持する。今後の公開版で更新protocolを変更する場合は、先行版から案内と互換移行を用意し、実旧配布物からの移行を再検査する。

実インストール済みPWAウィンドウからの移行、OS再起動、Android／iOS実機、Firefox／WebKitの旧版移行、外部Supabase／Google認証による移行は未確認。実証したのは通常Chromiumタブの全window client終了経路であり、実PWAウィンドウ操作の成功へ置き換えない。実機・外部接続では作品・設定保持とoffline再起動を再テストする必要がある。

保存済みLightpanda readinessはHyper-V backend timeoutによる起動不能を含み、Chromium実行結果と区別した。実旧Firefox用隔離配布物には以前のmanifest metadata診断変更の来歴があり、一般公開された過去リリース全体の互換保証へ拡張しない。今回ブラウザー／unit／build／lint／性能検査の追加実行、外部サービス操作は行っていない。

**最終判定：PASS（公開前旧previewの安全な運用移行に限定）。未解決件数：P0＝0、P1＝0、P2＝0、P3＝0。**
