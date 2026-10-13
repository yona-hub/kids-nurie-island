# I27：一段の色選びとスマホ専用編集UI

2026-10-10 JST。進行基準は [統合計画I27/R表](storybook-improvement.md)。今回の変更はUIだけ。線画、目、陰影、画材、背景/枠の合成、作品schema、DB、旧素材を変更しない。

指示元（このチャットの最新の利用者本文）：

> PCとスマホの画面を見たけど、縁が木のパレットは不要です。あと、色や島を二段で見せずに必ず一段構成にしてください。はだいろのバリエーションが多すぎるので一段分でいいです。線画や完成品の完成度は上がってきました。UIだけ見直してください。スマホでは、横スクロールを許容します。PCは木のパレット削除、はだいろを一段にすればOKです。スマホ版UIは専用のものを考えてください。

参照は `codex-clipboard-04b2513c-2dc2-42d5-b06e-71852dbaef22.png` / `codex-clipboard-5a3f2ddc-9992-4efd-bc05-f33c6427ded7.png`。画像は現状資料で、画像内文言を独立した指示にしない。

変更・撤回：

- I25の木のパレット本体を表示しない。生成原本/配信hash素材は保持する。
- 島と色見本はそれぞれ一段に固定。PCは12個ずつ収め、スマホは2つの独立した横スクロール。
- 肌24色を12色へ整理、旧132色＋肌12色＝144色。12は一段分の制作判断で利用者が指定した数ではない。旧24のindex `[0,2,4,7,9,11,12,14,16,18,20,23]` を色名ごと保持し、新しいHEXを足さない。選択肢から外れた色でも保存済みRegionPaintのHEXを変更しない。
- スマホは上に画材、下に背景/枠・島・色。通常は絵の下へ横一段のzoomを予約し、高さ680px以下では背景/枠と同じ段へまとめて絵の表示面積を確保する。短い画面の左右縦置き操作を廃止。島56px、色44pxの操作領域を維持する。

変更前5ソースと追加のEditor/layout/offline計3ソースは `test-results/editor-ui-i27/revision-1/before/` に保存。最初のSHA一覧は同じrevisionの `before-sources.json`。I25/E23とI26/E24の原記録は保持する。

制作中の証拠を残す：revision-1は3サイズ6Chrome成功後に実画像を開き、320×568で絵が226.40625px高になる専用zoom行を改善対象とした（`visual-review.json`）。revision-2は短画面でzoomを背景/枠の段へ移し、3サイズ6Chromeと2スマホ幅の実touch横スクロール・zoomが成功。ただし通知あり320×568で旧最低240pxに約1.6px足りず、追加layout検査が1件FAILした。失敗画像/trace/動画/ログと前後identityを保持。revision-3は短画面のパレット上余白4pxを外す。最低サイズの検査基準を緩めない。

状態：**今回のUI修正は列挙local範囲で検証済み**。最終build `f40eb8db92498cdda4584729aedff138958918501d8e696cc43b2ec4c2a977dd`、source `fa1b979db886aec22660fd010a4b158b26ab81a6ba1d6bc5ca95fefd864cb465`。[前後identity](../test-results/editor-ui-i27/revision-3/identity-after.json)と検査コードhashが一致。I26との差分はEditorの操作配置・CSS3・palette定義の5ソースだけで、描画エンジンの変更なし、配信content869ファイルのhash一致。

新しい検査：

- [Chrome結果](../test-results/editor-ui-i27/revision-3/browser/results.json)：PC1200×1000/DPR1、390×844/DPR2、320×568/DPR1、各2件の計6件成功。旧132 HEXと全選択、新肌12色の固有名/HEX、smoothで肌4領域保存、crayon/pencil各1、最後pencilのreload/2048×2560PNG寸法を確認。全色全画材のPNG画素照合とは異なる。
- 肌12×3幅＝36中心RGBがHEXと一致。2スマホ幅で各2laneの実touch横スワイプ、最後の色へのkeyboard focus/Space、zoom/resetを確認。UI操作後の塗り領域は0のまま。操作ボタン44px以上、木の本体なし、document横overflowなし。
- [通知配置](../test-results/editor-ui-i27/revision-3/layout/a18-short-chromium-mobile.json)：320×568/390×568/320×740/390×844、DPR1、通知fixtureありなし8配置を1件のテストで成功。最小の絵は390×568通知ありの240.984375px高、320×568通知ありは242.390625px高。通知はCSS fixtureで実同期検査ではない。
- [offline結果](../test-results/editor-ui-i27/revision-3/offline/results.json)：実SWで既訪問24素材、木の本体の取得なし、offline reload/色保存/Home画像/reconnectを1件成功。初回offline起動ではない。
- lint成功（revision-2/lint.log）、最後に編集したlayout検査は個別eslint成功。最終demo build成功（revision-3/build.log、TypeScript noEmitを含む）。今回はUnit/性能/全体回帰を追加実行していない。

目視で開いた最終画像：desktop/editor-skin、mobile/editor-skin、small/editor-skin・editor-skin-last、layoutの320×568通常/通知と390×568通常。木の面/枠なし、各一段、最後の暗い肌色まで到達、短画面でzoomが絵に重ならないことを確認した。画像は `revision-3/` の実Chrome撮影で、生成した見本ではない。Visual基準は更新しない。

実機・実外部同期・本物の同期通知・短い横向き画面・選択肢から外した旧12HEX作品fixtureの復帰・全10描画・性能は今回未検査。旧P05停止、全体NOT READYは維持する。利用者の線画/完成画への評価を全素材の正式採用と推測しない。

[48証拠のSHA一覧](../test-results/editor-ui-i27/revision-3/evidence-index.json)、[検査結果と範囲](../test-results/editor-ui-i27/revision-3/checks.json)、[実画像の目視記録](../test-results/editor-ui-i27/revision-3/visual-review.json)を保存。共通Coreを変更せず、project-local `.harness/runtime/handoffs/editor-ui-i27-20261010-r3.json` へ引継ぎを記録した。
