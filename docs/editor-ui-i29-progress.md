# I28/I29：単一ズームと完成後の装飾

2026-10-10 JST。進行基準は [統合計画Z表](storybook-improvement.md)。I28のズーム重複修正中にI29の配置/装飾時期の変更を受け、後の指示を合わせて実装する。今回の対象はUIと関連する操作検査。線画・完成画・renderer・保存schema・DBを変更しない。

指示元：

- I28：「拡大率ボタンが二重」「パレットとかぶっているほうが不要」。添付 `67d3af4f…png` / `de036422…png`。
- I29：「添付のような構成」「黒矢印は塗り絵エリアを縦長にする提案」「はいけい、かざりわく…色を塗っている最中の変更はできない…完成後に」。添付 `88dc61f6…png`。

変更・撤回：

- 二か所のズームDOMをCSSで切り替えるI27実装を撤去し、画材の下に単一の操作列を配置する。左は塗りモード、右はズーム。PC/スマホ共通で一組だけ。
- 下のズーム予約空間と背景/枠の列を外し、色の島と色見本だけを各一段にする。紙面/原画/PNGの4:5を保ち、絵に割り当てる縦の空間を増やす。添付の黒矢印を操作として追加しない。
- 編集中の背景/枠入口を撤去し、完成画面でのみ選択できるようにする。再編集では現在の装飾を表示したまま変更操作は出さない。
- I27の木の本体なし/肌12色/スマホ横スクロール、旧作品/旧素材保持は継続する。

確認した原因は同じズーム操作を二組描いていたコード構造。利用者の画面でCSS切替が効かなかった理由は未特定で、cache等を推測で原因にしない。隠れたDOMを含む一組の検査を追加する。旧E25は当時の可視要素だけの検査で、この修正の合格証拠ではない。

変更前のソース・検査・計画とSHAは `test-results/editor-ui-i29/revision-1/before/` に保存。旧結果は上書きしない。

状態：**列挙したlocal範囲で検証済み**。build `2a4585a12b29db2e453c83b19b4216b9ea45b60deb7cc323365e706fecc7bf42`、source `a783d9621fc60f84c331fd4b4a21ff0d3909dd1cd59de841e27bb1d5089dc1fb`。[検査前後identity](../test-results/editor-ui-i29/revision-1/identity-after.json)のbuild/source/配信entry/検査コードは同一。[変更範囲](../test-results/editor-ui-i29/revision-1/scope-check.json)はEditorとstyles-editorの2runtimeソースだけ、配信content869ファイルはI27と同一。

新しい検査：

- [Chrome生結果](../test-results/editor-ui-i29/revision-1/browser/results.json)：1200×1000/DPR1、390×844/DPR2、320×568/DPR1の3件成功。隠れたDOMを含めズーム一組/各操作一個、モード左・ズーム右の一列、絵より上、44px、誤塗り0、zoom/resetを確認。2スマホで島/色の実touch横スクロール、肌12色の中心RGBとfocus/Spaceも確認。
- 3サイズで編集中の背景/枠ボタンが0個、完成後に「あおぞらのしま」背景とカラードット枠を選択/保存、再編集で入口が再び0個、再読込でも塗りと装飾を保持した。
- [短画面の8配置](../test-results/editor-ui-i29/revision-1/layout/a18-short-chromium-mobile.json)：320×568/390×568/320×740/390×844、通知fixtureありなしを1件のテストで成功。ズーム一組が絵の上、全対象44px以上、島/色各一段、横overflowなし、最小紙面285px高。通知はCSS fixtureで実同期の証拠ではない。
- [表示寸法の比較](../test-results/editor-ui-i29/revision-1/layout-comparison.json)：I27に比べPCの紙面高+53.984375px、320×568は+43.984375px。390×844の紙面は横幅の上限で457.5px高のまま、絵に使えるstageは567px。縦の配置空間を広げたが、原画を伸ばしてはいない。
- lintとTypeScriptを含むdemo buildが成功。今回Unit全体、性能、PNG、offline、全装飾の再検査は実行していない。旧結果をこの4テストへ加算しない。

実際に開いて目視確認した新画像：3サイズのeditor-default、390×844のfinish-decorations/editor-decorated、320×568通知fixture。モード/ズームの一列、ズームが紙面/パレットに重ならないこと、編集中に色の島と色見本だけ残ること、完成後の装飾入口を確認した。通常電話では原画比率のためstage内に上下の余白がある。これは線画や完成画の品質合格、独立監査、人間受入ではない。Visual基準は更新しない。

既存のprojects/pwa/scene-art/layoutの装飾操作とproject-localのlifecycle性能スクリプトは、先に完成画面へ進む手順に合わせた。今回実行したのは上の3UI＋1layoutだけで、残る検査/性能スクリプトの成功を記録しない。P05の性能停止は解除しない。

今回のUI修正はこの範囲で完了。実機、短い横向き画面、実外部同期、本物の同期通知、全10線画、全体NOT READY、残る初期/I8要件は継続する。
