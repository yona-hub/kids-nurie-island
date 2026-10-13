# I32：クレヨンの自動陰影をなくす

2026-10-12 JST。利用者の最新指示：「クレヨン塗りのときは、自動で立体感や陰影をつけないでください」。進行基準は [統合計画I32/C表/E29](storybook-improvement.md)。全3画材に形状の陰影を足す従来仕様を、クレヨンだけ撤回する。

クレヨンは選択色、固定seedの筆圧、蝋顔料の抜け、紙目を描いたところで終了する。姫の内部完成原画由来のformマップ、一般的な陰影gradient、髪の光、服の折り目、金属等の照りはクレヨンに合成しない。筆跡の濃淡は残る。目の自動補正は別の指定として維持し、なめらか/いろえんぴつの陰影は変えない。

実装判断として共通のPaintingProfile v3/v4描画へ適用するため、既存のv3/v4クレヨン作品も再表示・PNG・サムネイルの再描画時に新しい表現になる。作品のID/色/画材/領域/装飾/保存データを置き換えたり削除したりしない。旧v1/v2の描画はそのまま保持する。従来の「旧v3クレヨンもRGBA不変」は今回の表現変更の合格条件にはせず、最新指示による変更として区別する。

変更は `packages/coloring-engine/src/storybook-texture.ts` と `apps/web/src/artwork-source.ts`。後者はv3/v4でクレヨンを含む作品だけサムネイルの描画キーを更新し、古い陰影付き画像を再利用しない。schema/RegionPaint/DB migration/テンプレート/生成素材/UI配置は不変。新しい画像生成は不要。

対象build：`3909dc392aef4dcea3a2e77d149b56588afe3ec3d846ffd1e73caf9807e3a882`、source：`ab85288a1f9751925af5cef3978cc213b4d4811a2e26345ded6651f8bb2340d3`。[前後identity](../test-results/crayon-flat-i32/revision-1/identity-after.json)の配布/source/配信/検査コードは一致。状態は**列挙local範囲で検証済み**。

- [描画Unit13件](../test-results/crayon-flat-i32/revision-1/unit-results.json)：新5件と既存姫8件。v3/v4の材質・折り目・光マップを変えてもクレヨン画素が変わらず、紙目が残る。smooth/pencilは光マップに応答し、クレヨンの目は自動補正/消去復帰を維持する。この13件の後にサムネイルキーだけを変更し、次の9件で検査した。
- [サムネイルUnit9件](../test-results/crayon-flat-i32/revision-1/unit-thumbnails.json)：既存5件＋新4件。古いv3/v4クレヨンのキーを拒否し、作品データを保持。v1/v2とsmooth/pencilの旧キーは不変。隔離MemoryCloud/IndexedDB fixtureであり実外部同期ではない。
- [変更前後48状態](../test-results/crayon-flat-i32/revision-1/native-after.json)：現10枚のblank/smooth/pencilの30RGBA、旧v1/v2姫の4状態ずつ8RGBAが完全一致。現10枚のクレヨン10RGBAだけが意図どおり変わる。320×400の固定配色検査で、全色/全解像度の網羅ではない。変更前画像とhashを保持。
- [Chrome2件](../test-results/crayon-flat-i32/revision-1/browser/results.json)：PC1200×1000/DPR1、390×844/DPR2。姫を全グループでクレヨン着色し、保存/reload後のCanvas完全一致、完成画面、実320pxサムネイルdecode、実2048×2560PNGダウンロードを確認。
- [静的チェックと範囲](../test-results/crayon-flat-i32/revision-1/checks.json)、[差分](../test-results/crayon-flat-i32/revision-1/scope-check.json)：lint/型を含むdemo build成功。配信content/画像は不変。既存bundle/deprecation警告は残る。

[目視記録](../test-results/crayon-flat-i32/revision-1/visual-review.json)：変更前後native、PC編集、電話相当の完成画面、実PNG、galleryの6画像を主担当が開いて確認した。服の皺の影・髪の反射が消え、蝋のかすれは残る。PNGはツールが1407×1760へ縮小表示したため、原寸全画素目視とは呼ばない。独立監査や人間による芸術品質の受入、Visual基準更新とは区別する。

新しい成功は関連Unit22件＋Chrome2件。48状態の比較をテスト件数へ重複加算しない。実機/実外部同期/offline/性能/全Unit/全色PNG画素は今回未検査。全体NOT READY、P05性能停止、残る9枚の内部完成原画方式や初期/I8の未完了は維持する。性能改善としての再測定は行っていない。
