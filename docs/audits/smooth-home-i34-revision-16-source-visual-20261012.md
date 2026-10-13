# I34 candidate-16 source 独立目視レビュー

判定: **FAIL — source範囲でhome同等の最終仕上がりに未到達。**

対象は `test-results/smooth-home-i34/revision-16/after/{theme}-source.png` 全10枚（1600×2000）およびdetail全6枚。座標はすべて元source画像の左上原点・ピクセル座標。詳細cropの拡大後座標ではない。

参照は `content/smooth-finish-i34/derived/{theme}-registered.png`、実homeのprincess/magic islands、home-target montage。参照13ファイルは候補15レビュー時と同一SHA-256であることを確認した。今回は元資料の口腔・車体継ぎ目・人物の局所も再比較した。構図、頭身、目のサイズを元資料へ一致させる要求ではなく、材質の光と輪郭の仕上がりの比較である。選択色の変更も要求しない。

レビュー開始 2026-10-12T15:58:18.9055489+09:00、終了hash確認 2026-10-12T16:04:23.2270516+09:00。source全10枚の開始/終了hash一致。実装、素材、旧作品の変更、追加レンダリング、テスト実行、外部アクセスは行わず、本報告ファイルのみ保存した。

## 残るblocking不良

| ID | source位置 | 観察と理由 |
|---|---|---|
| B01 | princess x708–743,y637–657; space x1048–1105,y1011–1040 | 鼻下の顔に元の口の上唇と思われる影が重複して出る。princessには短い橙褐色の帯、spaceには太い暗褐色の弧が現在の口の上に重なる。spaceは第二の口が顔に重なったように見え、既知princess不良と同種の新不良。発生元の実装は目視だけでは断定しない。 |
| B02 | princess x820–827,y617–624 | 右眼の外下に小さな黒い三角片が残る。新しい眼の輪郭から離れた位置にあり、まつげや髪の自然な接続として読めない。候補15から残るsource輪郭不良。 |
| B03 | vehicles 前輪 x413–505,y991–1045; 後輪 x173–225,y861–891 | 黒青capの突出は赤へ戻ったが、その形と二重の暗線が赤いフェンダー上に残る。円弧の奥の自然な陰ではなく、補修patchの継ぎ目として見える。前後とも残件。 |
| B04 | vehicles x1303–1309,y981–998; 前フェンダー端 x376–382,y1126–1134; 後フェンダー端 x141–147,y956–965 | 右ヘッドライト内側の赤い車体に明確な白い縦スリット。registeredでは暗赤の継ぎ目となる位置で、白い切り欠きが見える。前後フェンダーの端にも小白点が残る。明るい車体反射とは異なる独立した白い短片として確認した。 |
| B05 | ocean イルカ口内上右 x1073–1098,y623–642、口全体 x1020–1110,y595–692 | 暗い口腔は戻ったが、上右に白灰色の四角片が混入し、暗部/舌の色が帯状に不連続。registeredの連続した暗い口腔と舌に対し、断片を継いだ見え方となる。候補15のpink切抜きより深度は改善したが、最終口腔の品質には未到達。 |
| B06 | princess 左眼 x617–697,y520–597／右眼 x753–836,y553–631; magic 左眼 x690–746,y590–655／右眼 x833–893,y625–690; space 左眼 x927–1013,y927–1020／右眼 x1092–1179,y898–996 | 白い縁の強さは弱まり、虹彩/瞳孔は調整された。一方、現在は虹彩の平坦な楕円gradientが皮膚へ直接接する印象が強く、瞼の厚み、眼角/下瞼の接触陰影、眼球の丸い光が不足する。髪/皮膚の柔らかい光に比べ、眼だけが平面の貼付部品に見える。候補15の眼球と顔の材質統合不足は形の調整だけでは解消していない。home/registered同等の光と輪郭には未到達。 |

## 改善・解消を確認した箇所

- princess/spaceの鼻先自体は丸みと鼻下の陰が戻り、候補15の角張った橙patchは改善した。B01は鼻先の改善と別の領域漏れである。
- princess/magicの首は顔と同系の温かい皮膚の陰になり、候補15の強い灰色への切替は改善。手も皮膚として自然に読め、今回の手の変更に新たなblocking不良は認めない。
- robots右肘の白スリット x1114–1126,y1108–1134 は埋まり、ジョイントとしてつながる。
- ocean魚口 x565–622,y1254–1303 は暗い上部口腔と舌が分離し、開いた笑顔として読める。以前のpink切抜き問題をそのまま未解消とは扱わない。
- magic襟白抜け、construction油圧接合部のpinhole、princessドレスひげ片、dinosaurs鼻先slashは再発を認めない。
- princess左まつげ脇の淡い短片、magic左眼上の独立した淡い弧は今回のsourceで候補15と同じ明瞭な形には認めない。princess右眼下の黒三角はB02として残る。
- 全10枚の主シルエットに広い色漏れや連続する白haloは認めない。淡い毛は読める。animalsの大きな地面/枝の旧黒線は再発を認めない。flowersの蝶の両眼も見える。
- animals/dinosaurs/construction/flowersの全sourceを確認した。下記軽微点を除き、今回新たなblocking不良は見つけていない。

## 継続する軽微なsource清掃候補

これらだけで全体FAILにしてはいない。候補15の記録も保持する。

- animals猫頬下の暗点: おおよそ x1155–1161,y1377–1383 と x1180–1186,y1353–1361。
- princessうさぎ右内耳の片側だけの硬い灰色L状境界: x1253–1290,y1221–1322。
- dinosaurs鼻孔が穴の奥行きより平坦な楕円として読める: 左 x330–373,y479–541、右 x440–494,y511–571。
- space肩の小さな灰色継ぎ足し: x1186–1218,y1089–1118。旧白抜け/茶色突起より改善したが、registeredほど連続した縁には見えない。

## 比較記録・範囲

保存済み `comparison.json` の読取ではgeometry unchanged=10、blank/crayon/pencil unchanged=30、smooth changed=10。保存済み `legacy-comparison.json` は40状態中40状態unchanged。これは記録の読取であり、本担当による再生成/実行検証ではない。比較一致はart PASSの代用にしていない。

native 1/2/4、実Chrome、実機、P05性能、操作/保存/採用、全状態/全経路の完全PASSは未判定。P05停止継続、原本・旧作品保持の方針は変更していない。既知点の修正準備中であっても、今回の判定は下表hashの候補16のみに適用する。

## SHA-256 evidence binding

| Path (project relative) | SHA-256 |
|---|---|
| test-results/smooth-home-i34/revision-16/after/animals-source.png | `0d24af39e9adc6e64911f68f3fe5effea4812c1b3f0c7797699422c194082fbc` |
| test-results/smooth-home-i34/revision-16/after/construction-source.png | `e0750d4c2a6fe3bcccd7b4049fc5f6a570e4301d56d731b03196a5b8f993486d` |
| test-results/smooth-home-i34/revision-16/after/dinosaurs-source.png | `dd094fa61f38be21f9fe532619bbc730b500068e9fc49c3ec53077d2b76a3cbe` |
| test-results/smooth-home-i34/revision-16/after/flowers-source.png | `b23213cee5b53f5dd56610ca645c9d8f4c78a9da3094805be4678f20afd386a0` |
| test-results/smooth-home-i34/revision-16/after/magic-source.png | `663d4424ea0216d744b0f45cec3e7ebe90708f4d93b738b80e6efc3d4ddf23c0` |
| test-results/smooth-home-i34/revision-16/after/ocean-source.png | `901e0670cfe1f48104606232f6b5c058dd6e8b51d7eafd852283c2154f788954` |
| test-results/smooth-home-i34/revision-16/after/princess-source.png | `ebefb6da55128a2bb0b9face60a8166c8ff4274c88b94d3d01b76d39afd2881b` |
| test-results/smooth-home-i34/revision-16/after/robots-source.png | `6d2965d0be13ce277e3c815b1d698ba49f90de86a600a74b85dac9bef0300a73` |
| test-results/smooth-home-i34/revision-16/after/space-source.png | `86ff1d298b1b08412e126dd87489084e7c58f028e1413b457f16502917f7dc26` |
| test-results/smooth-home-i34/revision-16/after/vehicles-source.png | `124ac4745b2395c3b56d739eec6718a1f0fdf2486dc847e39b2d487431f92d6c` |
| test-results/smooth-home-i34/revision-16/after/magic-detail.png | `9c2f8483cfd36ed69ec04acfaf720f6d8c9daf636dcf21987db41029971f9937` |
| test-results/smooth-home-i34/revision-16/after/ocean-detail.png | `312941ea0d82fab325b60429b8afaa29502f794a737d88413ee3fc4e8bd5d8ed` |
| test-results/smooth-home-i34/revision-16/after/princess-detail.png | `46d84fe4a4b29e845afff9456f50ae616c09a0dcab8d4700e9ab276e3d9094c0` |
| test-results/smooth-home-i34/revision-16/after/robots-detail.png | `a30108ce82db17a31ff9c50c9e018280fa6af68cdabe253b2015f4eb492a857e` |
| test-results/smooth-home-i34/revision-16/after/space-detail.png | `ab45c6f552a4502c4dc94e170881e94b336c8f3ee3640c55c0cfd30ab40ea31e` |
| test-results/smooth-home-i34/revision-16/after/vehicles-detail.png | `48f9d1e86a133dd8b8c7ec7b71fa581206ee65608ff377a9abd881a713373e2a` |
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
| test-results/smooth-home-i34/revision-16/after/comparison.json | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| test-results/smooth-home-i34/revision-16/after/legacy-comparison.json | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |

