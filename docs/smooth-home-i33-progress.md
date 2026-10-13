# I33：なめらか塗りの品質改善

2026-10-12 JST。指示元は「なめらか塗りのクオリティを、添付のホーム画面のクオリティまで引き上げてください」。比較資料は添付 `codex-clipboard-e81e9ec9-70a5-4c71-a615-ca8dd926a460.png` と実際のホーム島原画。進行基準は[統合計画I33-S表/E30](storybook-improvement.md)。**陰影・細部の改善版は実装し限定検証済み。ホーム同等品質の最終受入は未完了。輪郭の追加調整は同じ検査2回FAILで停止した。** 全体NOT READY、P05性能停止、人間未採用を継続する。

現10枚すべてのsmoothへ展開することは今回の実装判断。I19の姫1枚限定をsmoothだけ拡張し、I32のクレヨン自動陰影なし、未着色の白い瞳/初期線画、鉛筆、自由色を保持する。通常の線画・塗り境界・当たり判定・group・目の制作geometryは変えないため、同じIDへ任意のsmooth専用データを追加した。旧hashのテンプレート・旧素材は保持。Project/RegionPaint/schema/DB migrationの変更はない。

## 現行に採用した実装

- 標準built-in image_genで姫以外9枚の内部完成原画を制作。姫は既存の完成原画1点を再利用した。`content/smooth-finish-i33/generation-batch-{1,2,3}.json` に逐語prompt、`tool-outputs.json` に生成元、`originals/` に9原本を保管。既存原本も保持した。モデル/effort/有料APIは変更していない。
- `scripts/build-smooth-finish.mjs` で同じ4:5座標へ登録し、実際の部位ベクターでサンプルを制限する。目・口・境界・隣の色を除外し、補間して各意味groupに相対的な影/反射を制作。mapは2048×2560の無彩色で、選択色を入力として形の明暗だけを合成する。これは完成RGBからの完全なPSD自動分離ではない。
- `PaintingProfile.smoothArtwork` と `mediumAssets.smooth` をv3/v4へ任意追加。生成RGB原本はprivateのままpublic/dist/ユーザー見本へ配布しない。各原本/map/テンプレートhash・登録情報・参照配色・直接サンプル不足部位は[manifest](../content/smooth-finish-i33/manifest.json)に記録。恐竜r06は直接サンプル不足の中立fallbackで、推定成功とは書かない。
- smoothだけ新しい照明へ分岐し、選択した色相/鮮やかさを残す。黒い輪郭を既存opaque ink内で選択色に沿った暗色へ置換。現在は太さを保つ `pigment-v1`。既存v3のsmooth眼にもnativeベクター眼を使い、虹彩は選択色、瞳はほぼ黒、白い反射を描く。車の眼/口は追加しない。
- tileのink cacheへ関連色/画材とsmooth画像revisionを含め、塗り替え/消去で再描画する。テンプレート指紋に新素材を含むため古いthumbを再利用しない。既存作品の選択色や画材を別色へ変換しない。旧バージョンで同じIDに保存された作品も、現在のsmooth仕上げで再表示する。

## 最新の有効な検証

対象は **revision-1の復帰後**。build `6ff8dd087f1efa5e6e9fdeea404af9cf5975adccb49450c46b6a49d3fe91a7fe`、source `5d718711ca5cfea4ba24b49827330e1193267b7cb21e833ee742fa1710779c51`。検査前/後とrevision-2撤回後の[identity](../test-results/smooth-home-i33/revision-1/identity-after.json)でbuild/source/配信entry/検査コードが一致した。publicの現行template/mapとbuildのbytesも照合した。前候補の成功を別ソースへ転用していない。

| 検査 | 結果と範囲 | 生証拠 |
| --- | --- | --- |
| 静的検査 | 型/lint/demo build成功。復帰後にもlint成功。既存bundleサイズ/deprecation警告は継続 | [checks](../test-results/smooth-home-i33/revision-1/checks.json) |
| 関連Unit | **37成功＝新15＋既存22**。進行中に新16と説明した件数は、生結果の15へ訂正。新map/hash/gray・group対応・任意色・cache/消去・thumb・混合色保存を検査 | [新15](../test-results/smooth-home-i33/revision-1/unit-smooth.json)、[既存22](../test-results/smooth-home-i33/revision-1/unit-existing.json) |
| 変更前後40状態 | 10枚×blank/smooth/crayon/pencil。smooth10だけ変化、他30RGBAと通常geometryは完全一致 | [比較](../test-results/smooth-home-i33/revision-1/after2/comparison.json) |
| native描画 | 全10×倍率1/2/4×DPR1/2/3の90条件。32MiB tile cache上限、640pxでtileと直接snapshot比較。眼20×5色の100反射/瞳検査 | [native結果](../test-results/smooth-home-i33/revision-1/native-zoom/evidence.json) |
| Chrome実操作 | **15成功、skip/retryなし**。PC1200×1000/DPR1全10、390×844/DPR2の姫/魔法/恐竜/車4、専用倍率/部分塗り1。実選択色/保存/reload Canvas一致、完成、実320thumb decode、2048PNGダウンロード。専用試験はDPR1/2/3、倍率1/2/4/2.65/縮小、移動、部分塗り/消去 | [Chrome結果](../test-results/smooth-home-i33/revision-1/browser/results.json)、[zoom](../test-results/smooth-home-i33/revision-1/browser-zoom/evidence.json) |
| 旧素材/保存 | 旧immutable素材を保持し、意図したcanonical10＋catalog以外の旧content/画像bytesが不変。保存schema不変。混合色/任意HEXの隔離fixture、旧fingerprint拒否を新実行 | [scope](../test-results/smooth-home-i33/revision-1/scope-check.json) |

native条件とChrome件数を重複加算しない。ChromeはPC上の電話相当表示で、物理スマートフォンではない。PNGの寸法/ダウンロードと列挙目視を確認したが、全10×全色×全surfaceの画素一致ではない。全Unit、実外部同期、SW offline、実機、性能、独立目視、人間による品質採用は今回未確認。identity helperはhash固定だけに使い、P05性能測定は再開していない。本番の素材採用gateとVisual基準は更新/迂回していない。

## 見た目と残る不足

主担当は現在の全10renderer出力、[比較画像](../test-results/smooth-home-i33/revision-1/before-after.png)、PC魔法編集画面、電話相当の姫完成画面、車の実UI出力PNG、姫4倍/DPR3を開いて確認した。車PNGは表示ツールが1407×1760へ縮小したため原寸全画素目視とは呼ばない。原本の美しさとアプリの出力の合格は分ける。

服の折り目/重なり、髪の毛束、動物の毛、葉脈/鱗、金属と窓の反射は改善した。一方、4倍では以下が残り、**ホームと同等品質という最終判定はしない**。

1. 外周や髪の境界が太く均一で、生成原画の自然な縁に比べて平面的。
2. 眉/鼻など顔の内線が灰色寄りで硬く、光に溶け込んでいない。
3. 目は滑らかなベクターだが、太い上まぶたと下の細い灰色縁がホーム原画より図形的。
4. 選択色に明暗を戻す方式なので、原画の色相の微妙な変化をそのまま再現するものではない。有限解像度mapの細部とベクター輪郭の品質も区別する。

初期候補の肌/毛の彩度低下は選択色のchroma合成で改善し、最初の比較 `after/` を保存した。現在は `after2/`。これらの確認は独立監査でもユーザーの採用でもない。

## 細線化の失敗と停止

revision-2では元opaque inkの内部だけに薄い輪郭と表面色を作る制作試作を行った。通常geometryは変えず、offline PathKitで幅5の境界を差し引く方式。

- 1回目：関連39中38成功/1失敗。花800×1000で候補maskの19724画素が元ink外。`asWinding()`→SVGの変換で穴が保たれないことを診断し、診断画像/候補を保存。
- 2回目：evenoddを明示して穴は改善したが、同じ0画素の範囲検査で33画素が残り39中38成功/1失敗。実行時はさらに元inkでclipするため、これは実画面に33画素漏れたという結果ではない。AA差か形状逸脱かの原因は未確定。
- [AGENTS.md](../AGENTS.md)の「同じ失敗が2回続くか進展のない反復になったら、証拠と次の最小手順を残して停止する」を適用。以後の輪郭変更/再試験は行わず、技術検証済みrevision-1のコード/素材へ戻した。復帰後の同一hashを確認した。検査条件を緩めてPASSにはしていない。

[停止記録](../test-results/smooth-home-i33/revision-2/stop.json)、[初回FAIL](../test-results/smooth-home-i33/revision-2/unit-contour-failure.json)、[2回目FAIL](../test-results/smooth-home-i33/revision-2/unit.json)、`rejected-source/`、`rejected-assets/`、失敗候補の画像を保持。2回目native検査は途中で停止し、部分結果を成功90条件へ加算しない。失敗候補のテンプレートはpublic配信から外し、証拠内へ保管した。

その他の実行上の問題も残す：最初のmap制作では不正なraster labelでTypeErrorとなり、完全alpha/label範囲の確認を追加して制作完了。Chrome初回起動はsandbox境界で既存previewを認識できずport使用中で0試験、`browser/startup-failure.json`を保持。ローカル読み取り/実行の自動承認後の15成功と区別する。証拠集計の旧identity wrapper読み違いも修正し、scope照合の結果を保存した。

再開時の最小作業は、残る33画素の座標・候補alpha・元ink alphaを単独記録してAA差か実形状逸脱かを切り分けること。原因が分かる前に再生成/再調整/閾値緩和/全試験の反復はしない。既存P05性能停止と他の初期/I8未完了もこの作業で閉じない。
