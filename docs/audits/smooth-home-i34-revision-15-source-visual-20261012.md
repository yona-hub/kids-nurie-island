# I34 candidate-15 source 独立目視レビュー

判定: **FAIL — source/current comparison 範囲で home 同等の最終仕上がりに未到達。**

対象: `test-results/smooth-home-i34/revision-15/after/{theme}-source.png` 全10枚（1600×2000）と診断detail全6枚。参照: `content/smooth-finish-i34/derived/{theme}-registered.png`、実homeの princess/magic island、home-target montage。座標はすべて元source画像の左上原点・ピクセル座標であり、拡大detail画像の座標ではない。

比較は輪郭・材質の光・顔/目/口のなじみを対象とし、別home場面の構図や頭身への一致は求めていない。選択色そのものの変更も要求していない。

記録時刻: 2026-10-12T15:46:57.1808928+09:00。レビュー開始時と終了時のsource全10枚SHA-256一致を確認。実装編集、追加レンダリング、テスト実行、外部アクセスは行っていない。本報告ファイルだけを新規保存した。

## 残るblocking不良

| ID | source位置 | 不足と理由 |
|---|---|---|
| B01 | vehicles 前輪 x413–505,y991–1045／後輪 x173–225,y861–891 | 両車輪上端に黒青の二段capが突出し、滑らかな円弧とフェンダー奥の影になっていない。白抜けは埋まったが、元資料の自然な赤いアーチ奥に対し、別の塊を載せた形に見える。前後とも同種。 |
| B02 | ocean イルカ x1020–1110,y595–692／魚 x565–622,y1254–1303 | 舌のピンク領域が口全体を占め、暗い口腔・口角・唇の厚みが欠けている。イルカは胴体にピンクの切り抜きを貼ったように見え、魚は開いた笑顔より外に出たピンクの唇に見える。元資料/homeの明確な口腔深度に未到達。 |
| B03 | robots 画面右の肘 x1114–1126,y1108–1134 | 肘球と前腕のつなぎ目に細い白いスリットが残る。registered masterでは暗青のジョイントでつながる箇所が背景白まで抜けている。輪郭・接合部検査上の残件。 |
| B04 | princess 左眼 x617–697,y520–597／右眼 x753–836,y553–631; magic 左眼 x690–746,y590–655／右眼 x833–893,y625–690; space 左眼 x927–1013,y927–1020／右眼 x1092–1179,y898–996 | 虹彩/瞳孔/反射の構成は改善したが、白目の外周と黒い上瞼が硬い均一境界のまま残り、柔らかい顔の皮膚に対して貼り付いた印象がある。上瞼下の影、白目の光量差、眼角から皮膚への移行がhome/registeredの仕上がりより弱い。眼の大きさや位置を問題にしているのではない。 |
| B05 | princess 鼻 x717–748,y614–635; space 鼻 x1044–1088,y986–1016 | princessの鼻は橙色の小領域が角張り、鼻先・鼻下の丸みより色patchとして見える。spaceも鼻の面が小さく分断され、鼻先の明暗と鼻下への連続性が不足。magicの鼻の丸みは候補11より明確に改善している。 |
| B06 | princess 首 x634–704,y711–754; magic 首 x734–815,y788–839 | 顔の温かい血色に対し、首が灰色に沈み、顎直下で硬く切り替わる。顔/耳/首を同じ皮膚として読むための照明の連続性が不足。これは色相を元資料と一致させる要求ではなく、局所的な光と陰の不一致。 |
| B07 | princess x615–631,y519–538 と x820–827,y617–624; magic x684–700,y577–590 | princess左まつげ脇に淡い短片、右眼外下に小さな黒い三角片が残る。magic左眼上には現在の上瞼とは別の淡い短い弧が見え、二重の瞼のように見える。候補11の大きなghostは減ったが、source最終輪郭検査では小片が残件。発生元のコード/素材は目視だけでは断定しない。 |

## 改善を確認した箇所

- magicの旧襟白抜け（x711–735,y787–810）とconstructionの旧pinhole（x856–866,y502–519）は画像上解消。
- space肩の旧白抜けと茶色の丸い突起は改善。現在はヘルメット色の領域としてつながる。
- 人物の頬の血色、鼻の見え方、口の舌と口角の陰影は候補11より明確に改善。人物口を候補11と同じ「単純な暗いfill」とは判定しない。
- princessドレス上の旧うさぎひげ片、dinosaurs鼻先の旧slashは再発を認めない。
- robots/catの表情は読める。animalsの大きな地面/枝の旧黒線は再発を認めない。淡い毛も輪郭と毛の光が読める。
- flowersの蝶の両眼は今回のsourceでは確認できる。
- 全10枚の主シルエットで広い色漏れや連続した白haloは認めない。花、髪、衣服、樹葉、車体の多くは滑らかな光が読める。

## 追加の軽微なsource清掃候補

これらだけを理由に全体FAILとしていないが、最終高解像度の清掃時には確認したい。

- animals猫頬の下側にごく短い暗点: おおよそ x1155–1161,y1377–1383 と x1180–1186,y1353–1361。毛の光より線の残片として目立つ。
- princessうさぎ右内耳の一辺だけに太い灰色のL状境界: x1253–1290,y1221–1322。内耳の柔らかい材質に比べ、片側だけ線が硬い。
- dinosaurs鼻孔の平坦な灰緑の楕円: 左 x330–373,y479–541／右 x440–494,y511–571。穴の奥行きよりボタン状に読める。現行の緑を保った局所陰影で改善余地がある。
- space肩の小さな灰色継ぎ足し: x1186–1218,y1089–1118。旧茶色突起より改善したが、ヘルメット縁からストラップへの移行はregisteredほど滑らかでない。

## 範囲と未判定事項

`comparison.json`はgeometry全10とblank/crayon/pencil全30のunchanged=true、smooth全10のchangedを記録し、`legacy-comparison.json`は旧40状態のunchanged=trueを記録している。これは保存済み比較記録の読取であり、本レビューで再生成した独立実行結果ではない。これらの一致をart PASSの根拠にはしていない。

今回はsource/current comparison範囲のみ。native 1/2/4、実機、性能P05、操作・保存・採用、全状態/全経路の完全PASSを推測しない。P05停止継続と原本/旧作品保持の方針に変更を加えていない。

## SHA-256 evidence binding

下表は同一レビューで読んだ候補・比較記録・参照のファイルhash。診断cropは補助であり、主判定はsource全10枚。

| Path (project relative) | SHA-256 |
|---|---|
| test-results/smooth-home-i34/revision-15/after/animals-source.png | `0d24af39e9adc6e64911f68f3fe5effea4812c1b3f0c7797699422c194082fbc` |
| test-results/smooth-home-i34/revision-15/after/construction-source.png | `e0750d4c2a6fe3bcccd7b4049fc5f6a570e4301d56d731b03196a5b8f993486d` |
| test-results/smooth-home-i34/revision-15/after/dinosaurs-source.png | `dd094fa61f38be21f9fe532619bbc730b500068e9fc49c3ec53077d2b76a3cbe` |
| test-results/smooth-home-i34/revision-15/after/flowers-source.png | `b23213cee5b53f5dd56610ca645c9d8f4c78a9da3094805be4678f20afd386a0` |
| test-results/smooth-home-i34/revision-15/after/magic-source.png | `7f7e2ea6682f57f03fdaf546a4b50d7b64d9766de5c27e528d63957edbd43d4b` |
| test-results/smooth-home-i34/revision-15/after/ocean-source.png | `e6d15c2ed89b4c2d42d85ff097b486f4dbc06ed389f0f11f2c6dd45351d59167` |
| test-results/smooth-home-i34/revision-15/after/princess-source.png | `0c9519aa79ea86e416f6d6dc183209168dca47df64af15d807845a66a93e6f28` |
| test-results/smooth-home-i34/revision-15/after/robots-source.png | `74743e435761450e8f028f02892c4a07a9b2506eb0647b15f676858feb0f1be8` |
| test-results/smooth-home-i34/revision-15/after/space-source.png | `290f40b1f52b9713cf10062061a7245f9d0cae0c3ea62466b23f8087d2a8d326` |
| test-results/smooth-home-i34/revision-15/after/vehicles-source.png | `2ab9458cd6c54a6aebb0e1251f445babad48e86de3bcc0b8a13d0c61fcd69023` |
| test-results/smooth-home-i34/revision-15/after/construction-detail.png | `f7df62c63531c6fb3017bfafe49b740c65d1cf8ce32d3c0516690a5ebb2c7434` |
| test-results/smooth-home-i34/revision-15/after/magic-detail.png | `dcc6295229ac5d08a55406e2474b3d4e62675f1f792e194380d257d04361e015` |
| test-results/smooth-home-i34/revision-15/after/ocean-detail.png | `3be5e99e8eb33f10d77c750d71d4bba205089d18f5b67da91d7a78961887a14c` |
| test-results/smooth-home-i34/revision-15/after/princess-detail.png | `2a103a103fcbba903efcb8857521d15cb4fea3b6b6ae2bb669fde48bf8b26b4a` |
| test-results/smooth-home-i34/revision-15/after/space-detail.png | `77cc07fff082791146c26f064244ee385ccd2fc13f7db15035db36ebccc3da25` |
| test-results/smooth-home-i34/revision-15/after/vehicles-detail.png | `6964db498b76d89c413e41c239bc6e2a26c0934d366bcd2b7df81d1ac1c79271` |
| content/smooth-finish-i34/derived/animals-registered.png | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| content/smooth-finish-i34/derived/construction-registered.png | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` |
| content/smooth-finish-i34/derived/dinosaurs-registered.png | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |
| content/smooth-finish-i34/derived/flowers-registered.png | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` |
| content/smooth-finish-i34/derived/magic-registered.png | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| content/smooth-finish-i34/derived/ocean-registered.png | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |
| content/smooth-finish-i34/derived/princess-registered.png | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| content/smooth-finish-i34/derived/robots-registered.png | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` |
| content/smooth-finish-i34/derived/space-registered.png | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| content/smooth-finish-i34/derived/vehicles-registered.png | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| apps/web/public/images/islands/princess-v1.webp | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| apps/web/public/images/islands/magic-v1.webp | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| content/smooth-finish-i33/references/home-target.png | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| test-results/smooth-home-i34/revision-15/after/comparison.json | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| test-results/smooth-home-i34/revision-15/after/legacy-comparison.json | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |

