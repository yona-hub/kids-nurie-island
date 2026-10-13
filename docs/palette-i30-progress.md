# I30：茶色への統合と矢印式の一段パレット

2026-10-12 JST。進行基準は [統合計画I30/N表](storybook-improvement.md)。今回は色選択UIだけを変更。I28/I29の単一ズーム・左モード右ズーム・完成後だけの装飾は継続する。

利用者の最新指示は、肌島を茶色へ統合し、薄い側を肌色・濃い側を茶色にすること。色見本だけに角丸四角の木目を敷き、狭い画面ではネイティブ横スクロール表示を両端矢印の短押し/長押し操作へ変更する。PCのブラウザ幅を狭くした場合も同じにする。

茶色12色は、旧肌12色の明るい6色と旧茶色12色の暗い6色を採用した。12色と6/6の選定は実装判断。他の10島120HEXは変えず、11島132色となる。独立した肌島、旧12島144色、ネイティブ横スクロール表示はI30で置換した。選択肢から外れた色を保存済み作品から置換/削除する処理は追加しない。旧skin既定値は表示の初期化だけbrownへ対応し、保存RegionPaint/DB/rendererを変えない。

木目は標準image_genで新規生成した不透明の平らな素材。島の列やパレット全体に敷かず、色見本の列だけに角丸四角として表示する。大きい旧木の本体は引き続き非表示。原本 [palette-wood.png](../content/palette-i30/originals/palette-wood.png)、完全な指示 [prompt.json](../content/palette-i30/prompt.json)、原本/派生SHA [compiled.json](../content/palette-i30/compiled.json) を保持。原本2172×724から1200×400のlossless WebPへサイズ変換のみ。再生成/再変換は scripts/build-palette-i30.mjs。新素材の正式な人間採用は未受領。

767px以下では島/色見本それぞれの両端に44pxの操作矢印を表示する。短押しは見えている幅の80%、300ms以上の長押しは360px/秒で端まで移動する。待機時間・移動量・速度は実装判断。pointer release/cancel/capture喪失、blur、非表示、完成画面移行/unmountで連続移動を止める。左端/右端ではその方向を無効化し、キーボードEnter/Spaceの移動と色ボタンのfocusは維持する。

対象build：`1a4e9f9bd42be04caf7acb1a0540a0059af7dbb59f729c08b1c03f2a4a5003df`、source：`cf7af89008c583ae86f0a7067c67cf733081ef34752fdfcccc58f72153ca7098`。最初のrevision-1は旧色fixture投入のキー選択に不備があり中断。store.get(projectId)では取得できず、callback例外後にpromiseが完了しなかった。利用者のデータやアプリコードの不具合とは区別する。[中断原記録](../test-results/palette-i30/revision-1/interruption.json) とtrace/前後hashを保持。revision-2ではgetAllでproject.idを照合し、abortをrejectする。app/build/sourceは同一、テストの修正だけ。

状態：**列挙したlocal範囲で検証済み**。最終revision-3の[前後identity](../test-results/palette-i30/revision-3/identity-after.json)はbuild/source/配信entry/検査コード一致。旧E25/E26をこの版のPASSへ転用しない。

revision-2ではPCの色/保存検査1件が成功し、矢印検査はblur停止後のテストのreset仮定だけが失敗した。停止位置が一ページを超えていたため、一回の左短押しでは先頭に届かないことが正しい。期待値を緩めず、先頭へ戻す操作を左長押しに変更し、端の無効化/scrollLeft=0を確認した。[FAIL原結果](../test-results/palette-i30/revision-2/browser/results.json)、[原因と修正](../test-results/palette-i30/revision-2/failure-analysis.json)を保持する。app/source/buildの変更はない。

新しい検査と証拠：

- [3サイズ6Chrome](../test-results/palette-i30/revision-3/browser/results.json)：1200×1000/DPR1、390×844/DPR2、320×568/DPR1。各サイズで他120HEXの全選択、茶色12HEX/固有名と12smooth描画保存、crayon/pencil各1、reload/2048×2560PNG寸法を確認。36中心RGBが正確。旧選択肢2色は明示的IndexedDB fixtureでreload/別の領域のUI編集後も保持（全保存世代の実データ監査ではない）。
- 同6件のUI検査：島/色各一段、11島、木目は色見本だけ、44px、PC縮小390と電話2幅の両lane。マウスclickと実touch tap、長押しの途中/末尾/先頭、release/touchCancel停止、blurイベントでの停止、Enter/Space/focus、誤塗り0。単一ズーム/完成後のみの装飾と再編集/reload保持も同buildで検査した。
- [短画面8配置](../test-results/palette-i30/revision-3/layout/a18-short-chromium-mobile.json)：4電話サイズ×通知fixtureありなしをlayout1件で成功。最小紙面273.984375px高で、最低240pxを維持する。I29より木目の余白分11pxを使う。通知は配置fixtureで、本物の同期通知の検証ではない。
- [実SW offline1件](../test-results/palette-i30/revision-3/offline/results.json)：既訪問23素材のcache、木目背景の通常画像decode/不透明480000pixel、paint-dabのCORS decode、offline editor/home/reload/鉛筆の別色保存/reconnectを確認。初回未訪問素材のoffline保証ではない。
- [白系の追加2画面](../test-results/palette-i30/revision-3/white-visibility.json)：PCと390pxの白12色の画面を実Chromeで撮影。白中心RGB=255/255/255を保持し、木目上で見分けられることを目視。これは追加の画面確認で、8件のテスト数へ加算しない。
- [静的チェック](../test-results/palette-i30/revision-3/checks.json)：lint、型を含むdemo build、修正したテストのlint/typecheckが成功。[差分範囲](../test-results/palette-i30/revision-3/scope-check.json)：既存ソース3変更と新component/CSSの3追加。配信content869、旧UI素材25点、renderer/shared-types/保存形式/DBは不変。新木目1点だけ追加。

[実画面の確認](../test-results/palette-i30/revision-3/visual-review.json)は主担当が原画面を開いたlocal UI検査。茶色のPC/390/320、通知あり320、offline390、白系PC/390で木目の範囲・淡色の見やすさ・一段/矢印・重なりなしを確認した。独立監査や人間の採用、線画/目/画材の芸術品質の合格とは呼ばない。Visual基準は更新しない。

全体NOT READY、P05性能停止、初期/I8の未完了、残る9枚のmaster展開・人間採用を維持する。実機・実外部同期・短い横向き画面・全10/全色PNG画素・性能・Visual基準更新は今回の検証ではない。
