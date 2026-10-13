# I31：矢印を島と色見本に重ねる

2026-10-12 JST。進行基準は [統合計画I31/O表/E28](storybook-improvement.md)。利用者の最新指示は「スクロールする『＞』『＜』ボタンは、島やパレットにオーバーレイし、後ろの島やパレットの色は半透明で表示」。I30の左右を別列にする配置を置換する。

767px以下で左右44pxの矢印を同じ行へ重ね、背後の島/色見本だけ35%の不透明度へ落とす。中央の色は不透明、木目背景は色見本だけに残す。先頭/末尾の項目が矢印の横へ出るようスクロール端に52pxの余白を付ける。35%と52pxは実装判断。短押しは矢印を除く可視幅の80%、300ms以上の長押しは従来の360px/秒。離す/取消/blur等で止まり、両端は無効化する。

runtime変更は `apps/web/src/styles-palette.css` と `apps/web/src/components/PaletteLane.tsx` だけ。茶12色/他120HEX、保存schema/DB/RegionPaint、線画・完成画・描画エンジン、既存content/画像は変更していない。木目はI30の生成済み素材を再利用。I28/I29の単一ズーム・左モード右ズーム・完成後だけの装飾を維持する。

対象build：`8239de98aeb8f4fe4b7a8461f14454aa44d8f501f5b97fd22f7a149ed8253159`、source：`681625b74e20c2fa137658a07d647def70c240e628276be961f303a486450b5e`。[前後identity](../test-results/palette-overlay-i31/revision-1/identity-after.json)は配布/source/配信entry/検査コード一致。[差分範囲](../test-results/palette-overlay-i31/revision-1/scope-check.json)はI30版のソース/素材との比較であり、旧PASSの流用ではない。

状態：**列挙したlocal UI範囲で検証済み**。新しい証拠は [集計](../test-results/palette-overlay-i31/revision-1/verification-summary.json) に保存。

- [Chrome3件](../test-results/palette-overlay-i31/revision-1/browser/results.json)：1200×1000/DPR1、390×844/DPR2、320×568/DPR1。PCを390pxへ縮小した場合も確認。両laneの重なり/35%mask、短押し/長押し途中/先頭/末尾、release/実CDP touchCancel/blur停止、Enter/Space/focus、44px、誤塗り0。36個の茶色見本中心RGBは正確。完成後だけの背景/枠選択と再編集/reload保持も確認。
- [layout1件・8配置](../test-results/palette-overlay-i31/revision-1/layout/a18-short-chromium-mobile.json)：4電話サイズ×通知fixtureありなし。最小紙面273.984375px高、島と色見本は一段、全操作が画面内。通知fixtureは実同期通知の検証ではない。
- [実SW offline1件](../test-results/palette-overlay-i31/revision-1/offline/results.json)：既訪問23UI素材、木目の通常画像decodeとdabのCORS decode、offline editor/home/reload/別色保存/reconnect。初回未訪問素材のoffline保証ではない。
- [静的チェック](../test-results/palette-overlay-i31/revision-1/checks.json)：lint、型を含むdemo build、変更テストのlintと型が成功。既存bundleサイズ/deprecation警告は残る。

[実画面の確認](../test-results/palette-overlay-i31/revision-1/visual-review.json)は主担当が新buildの6画像を一枚ずつ開いて実施。PC縮小時の島、390/320の途中位置の色、PCの茶色、通知あり320、offline390で、矢印の背後だけ薄く中央は通常の濃さであることを確認した。独立監査・人間採用・線画や画材の芸術品質の合格ではない。Visual基準は更新しない。

今回の成功は3UI＋1layout＋1offlineの**5件**。I30の全120色選択・旧色2fixture・PNG寸法の検査を今回再実行したとは扱わず、E27は当時の履歴として保持する。全Unit/全色PNG画素/実外部同期/実機/短い横向き/性能は未検査。全体NOT READY、P05停止、初期/I8の未完了と人間採用未完了を維持する。
