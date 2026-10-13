# I34 revision61 固定build実画面・拡大・PNG 独立目視原本

- 判定: **FAIL**。通常の全体表示と旧大きな段差は改善しているが、姫右頬の肌/髪境界に局所的な折れと茶色の突起が残る。Chrome4倍の複数DPRと実UI PNG原寸で同位置に見え、ホーム同等の最終輪郭条件を満たさない。
- 必須残件: **R61S-1**。world 1600×2000の **x807–816,y663–675**、中心およそ **(812,668)**。
- 対象: `test-results/smooth-home-i34/revision-61/` の提供済み固定build画面。source/art限定PASSや機械検査を画面合格へ転記していない。
- 開始: 2026-10-13 00:20:56 JST。入力前固定: 2026-10-13T00:21:44.8559082+09:00。選択overlayの取得条件を確かめる2コード局所の追加前固定: 2026-10-13T00:33:15.6556215+09:00。全表示後固定: 2026-10-13T00:34:37.0317740+09:00。20分程度のbounded review。
- build: `d080ec40ba8de2c9daa5d0a6da92996ad44bbba598e7ac2a0737403b843b165d`。runtime source: `74c1b959e505c5911eb697bfe8dbc543669d3223e59ebb7bb002170aaaf4dc1c`。
- 単独・再委任なし・主モデル/effort継承。性能/外部通信/画像生成/公開/新検査なし。production/tests/素材/提供証拠/既存報告/他者編集は変更しない。この新規原本だけを保存。

## 1. 必須FAIL R61S-1: 姫右頬下の局所的な折れ

右頬の滑らかな肌の境界が髪へつながる途中で、短い縦区間から内側へ折れ、茶色が小さな突起として入り込む。頬の通常の丸みから突然変わる小段として見える。旧33 S01の長い階段列は大きく改善しているが、この局所は残る。顔の形を参照と同じにする条件を置いているのではなく、現在の曲面内で境界が滑らかに連続しないことを指摘する。

| 再現証拠 | 実表示範囲と観測 |
| --- | --- |
| `browser-contours/princess-ear-cheek-z4-dpr2.png` | 1032×1290の実Chrome4倍DPR2を原画素で全体表示。画像crop [820,670,900,780]を原寸で再表示し、小さな茶色の段を確認。 |
| `browser-zoom/face-z4-dpr2.png` | 732×916の実Chrome4倍DPR2を原寸全体表示。同じ頬境界の突起が残る。 |
| `browser-zoom/face-z4-dpr3.png` | 1098×1374の実Chrome4倍DPR3を原寸全体表示。画像crop [930,730,1070,930]でも同じ形を確認。DPRを上げても局所的な折れの形が維持される。 |
| `smooth-desktop/princess/actual-ui-export.png` | 実UI出力2048×2560。全体縮小に加え [1000,760,1100,920]、[1028,828,1060,882]、顔全体[620,540,1180,1140]を原寸で表示。画像座標 **x1036–1043,y850–861** 付近に同じ突起。 |

PNGの横2048/world1600＝1.28を位置対応に用いた。RGB閾値による肌端の位置補助では、PNG y854で肌右端x1040、y856でx1036となり、短い縦距離の中で約3world pxの横移動がある。これは位置の補助であり、正確なcoverageや「輪郭外0px」の測定ではない。判定は上記の実表示による。高倍率画面をsource画素の単純拡大で代用していない。

**1px AAとの区別:** 通常の曲線に沿う1画素の濃淡遷移を不具合として数えたものではない。複数DPRと異なる出力寸法のPNGで、頬の縦境界から内側へ向く同じ小段が維持されるため、低DPRだけのドット粗さとは判断しない。通常fitで目立たないことも、4倍時の残件を解消しない。

**最小修正:** world [807,663,816,675]と周辺の肌/髪の共有境界を連続した曲線へ整え、局所的な横段と茶色の突起を除く。広いぼかしで隣接面へ色を出すことや、眼・口・顔全体の描き直しをこの観測は求めない。修正後は同じChrome4倍DPR2/3と実UI PNG原寸で、にじみ・白筋・まつげ/眼の再退行も併せて確認する必要がある。

**原因の限界:** 輪郭曲線やcoverageの局所的な形が寄与する可能性はあるが、今回制作コードの因果診断はしていない。特定pathやrenderer処理が原因だとは断定しない。親の修正説明やテストPASSでこの現物を解消扱いにしない。

## 2. 実表示した範囲

現在画面は**81PNGを実表示**し、SHA256の異なる画面内容も81。比較は実ホーム島10、home-target1、private登録参照の姫/魔法顔局所2。合計94画像、全体表示とcrop再表示を合わせ113操作。privateは分析表示のみで、配布/コピー/報告埋め込みなし。

| 区分 | 実表示 | 表示方法 |
| --- | ---: | --- |
| browser-contours | 9/9 | 実Chrome4倍/DPR2の提供PNGを原画素寸法で表示。顔・顎・窓左右・首・タイヤ・ボンネット・花左右。 |
| smooth-desktop | editor/finish/gallery/actual-ui-exportの全10×4＝40 | 画面全体を縮小表示。実UI PNGは全体と主要顔/境界/口/旧残件の原寸cropを別に表示。fit10は未表示。 |
| smooth-mobile | princess/magic/dinosaurs/vehiclesのeditor/finish＝8 | mobile幅ブラウザー画面を全体縮小表示。実機の確認ではない。 |
| browser-zoom | 12倍率/DPR＋partial/erased＝14/14 | 1/2/4/2.65倍×DPR1/2/3を実レンダーの原画素で表示。提供scale/dpr情報を読んだ。 |
| wizard-reproduction | 1/2/4/2.65倍＝4/4 | 利用者指摘の黒髪/黒襟・紫服・肌色条件を原画素で表示。 |
| unpainted-eyes | 3テーマfit/z4＝6/6 | 親だけsmoothの姫/魔法/恐竜。fitの選択overlayを塗り本体から区別。 |

Chrome screenshotの境界JSONはcanvas幅1030×1288、CSS515×644を記録し、PNG外寸はindex/実ファイルで1032×1290。2pxの外寸差を隠さず記録する。canvas metadataを根拠にPNG寸法を推定せず、実寸は103PNG全てPILで読み取りindexと一致を確認した。

## 3. 旧S01/S02および仕上げの現61判定

| 旧対象・world座標 | 現61の実画面/PNG所見 |
| --- | --- |
| S01 姫右頬812–834,625–675、耳 | 長い階段状の反復と帯は大幅改善。耳の旧大きな段差を再現しない。一方、上記R61S-1の右頬局所が残るため人物輪郭の最終PASSにはしない。 |
| S01 魔法顎737–823,777–790 | contours4倍DPR2、利用者配色4倍率、PNG顔原寸で旧大きな水平段/折れを再現しない。顎の点/縞も認めない。姫の局所残件とは分ける。 |
| S02 construction窓684–1086,844–1129 | 左右contours4倍とPNG原寸で窓下弧は連続する。旧の短い大段の反復を再現しない。窓/ガラスの反射を保つ。 |
| S02 robots首700–970,818–865 | contours4倍とPNG原寸で旧大きな階段を再現しない。首の金属の反射と暗帯は連続する。微細な直線区間/画素単位の縁まで「完全な曲線」や色画素0と主張しない。 |
| S02 vehiclesタイヤ416–512,1008–1043 | contours4倍/PNG原寸でタイヤの大きな波状の段を再現しない。黒い材質とボディ境界がつながる。窓/ボンネットも復旧した状態が編集・完成・保存像で続く。 |
| S02 flowers接点610–1040,875–1242 | 左右contours4倍とPNG原寸で旧大きな段差や白い隙間を再現しない。茎/葉/包装/リボンの材質差を保つ。丸い茎先端807–839,1130–1149の重なりの形は残る。 |

全10の通常編集/完成/ギャラリー/実UI出力では、材料の立体感と表情の読みが保たれる。姫/魔法の髪・衣服、宇宙の服と機体、車/建設/robotの金属・ゴム・ガラス、花の葉/花弁/包み、動物の毛、海生物の体と甲羅、恐竜の皮膚/卵/岩が読み分けられる。実home島10とhome-targetを実表示して質感を比較した。構図や選択色、装飾量の複製は合格条件に置いていない。sourceの既PASSを今回の根拠として代用していない。

ギャラリー10の提供画面には今回の完成像と同じ材質/顔の作品が表示され、目視上の旧色/欠けへの戻りを認めない。ただし保存済み旧作品全体のcache更新、別端末への同期、実外部同期まで検証したという意味ではない。mobile4の編集/完成画面で絵の欠落や操作部への重なりを認めない。

## 4. 眼・口・部分/消去と残る旧観測

| 項目 | 現物による所見・範囲 |
| --- | --- |
| 人物B03 着色眼/まつげ | 姫倍率/DPR系列、魔法倍率、宇宙PNG顔原寸で、旧の一定幅の淡い二重上弧/眼縁の灰色太枠を認めない。白目/虹彩/反射と上瞼の接触影は読み分けられる。姫右まつげ根元828–842,580–611に旧白短冊切れを認めない。不要な独立まつげの新出なし。形/反射配置の複製を条件にしていない。顔境界R61S-1は別FAIL。 |
| B01/B02顎点・縞 | 魔法の顎と宇宙PNG顔で再発を認めない。魔法の旧大きな顎段差も今回再現しない。 |
| R58/R59 未着色眼 | 6画面を今回新たに表示。姫の旧外白帯、魔法/恐竜の二重外輪郭、姫右眼の茶色nub x797–802,y590–603を認めない。姫は初期線画の白い瞳、魔法/恐竜は白い虹彩と反射の単純ガイドとして読め、親の肌smoothとつながる。未着色眼の限定目視として改善を確認する。 |
| fitの青破線 | 肌面に青い破線が見える。`tests/e2e/smooth-finish.spec.ts`のstage.focus→ArrowRight/Enter直後のfit取得、`ArtworkCanvas.tsx`のCanvasと別SVG `region-focus-overlay`・selected.path・strokeDasharrayを読み、keyboard selectionと確認した。z4では消える現物とも整合する。塗り漏れと判定しない。 |
| 部分/消去 | `browser-zoom/partial.png`は一部ドレープが青、`erased.png`は同部が白い初期線画へ戻る。隣接ドレス/肌を欠かず、提供fitの範囲で連続した外色帯を認めない。この2画面から全消去組合せ/4倍部分塗りを合格にしない。車の部分/消去6状態は先行source監査の別範囲で、今回同状態のChrome画像は提供されていない。 |
| B04/B05/B06–08口 | 実UI PNG原寸でイルカ1020–1112,595–693、魚568–620,1255–1294、ウサギ1038–1123,1385–1475、犬574–741,1110–1235、亀705–819,990–1068を含む局所を開いた。旧白穴/孤立黒点/分断を認めない。 |

以下は旧観測の現存を維持し、解消済みへ書き換えない。今回の通常画面/PNG原寸では、この所見単独が表情や材質の読みを失わせる必須欠陥とは判断しなかった。

- ウサギ/犬/亀の均一な口縁: worldウサギ1040–1121,1404–1477、犬575–738,1113–1236、亀706–821,992–1068。口内は連続し、線の表情として読める。全倍率で完全に陰影へなじむとの主張はしない。
- ウサギ耳内の暗いL形: x1253–1290,y1221–1322。PNG原寸で残る。耳の折れの読みを失わせる孤立線/漏れではない。
- 恐竜の平坦な鼻孔と口後方: 左330–373,479–541、右440–494,511–571、口598–710,642–759。PNG原寸でも残る。小面積の形のアクセントとして読み、広い材質の立体感を失わせる退行とは区別する。
- 花の丸い茎先端807–839,1130–1149: 形状上の重なりを保持。白抜け/外色帯の再発と混同しない。

## 5. 未表示・同一byte参照の区別

indexの103PNGのうち81を実表示した。以下5パスは既表示画面とSHA256/bytesが完全同一なので、その内容を参照するが新規表示枚数へ加えない。残り17は未表示で、その個別画面の美術PASSを主張しない。

| 未再表示ファイル | 同一byteで実表示したファイル | SHA256 |
| --- | --- | --- |
| `smooth-mobile/dinosaurs/actual-ui-export.png` | `smooth-desktop/dinosaurs/actual-ui-export.png` | `e97c2e46aaf9337e4f4d0291b3513a6cff54d1f5fe026fb0ea2a36abe4117238` |
| `smooth-mobile/magic/actual-ui-export.png` | `smooth-desktop/magic/actual-ui-export.png` | `869067ec1c83dcbc556d283e92d673d982361aeb7ce55248fa9daf9ab1ee1844` |
| `smooth-mobile/princess/actual-ui-export.png` | `smooth-desktop/princess/actual-ui-export.png` | `f55065c6472ae7d6af1d443ef922406909196e035357274317d8badcf10fe2f7` |
| `smooth-mobile/princess/fit.png` | `browser-zoom/face-z1-dpr2.png` | `7f30f99e207b465449c4941e939f495757664600adc0edb54141ce44bb181138` |
| `smooth-mobile/vehicles/actual-ui-export.png` | `smooth-desktop/vehicles/actual-ui-export.png` | `6b33fc9b9228b49fa6276597e1b66808c4478c2f67306be3df152684d5579da8` |

| 未表示ファイル | 状態 |
| --- | --- |
| `smooth-desktop/animals/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/construction/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/dinosaurs/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/flowers/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/magic/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/ocean/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/princess/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/robots/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/space/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-desktop/vehicles/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-mobile/dinosaurs/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-mobile/dinosaurs/gallery.png` | 未表示・今回の個別画面PASSなし |
| `smooth-mobile/magic/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-mobile/magic/gallery.png` | 未表示・今回の個別画面PASSなし |
| `smooth-mobile/princess/gallery.png` | 未表示・今回の個別画面PASSなし |
| `smooth-mobile/vehicles/fit.png` | 未表示・今回の個別画面PASSなし |
| `smooth-mobile/vehicles/gallery.png` | 未表示・今回の個別画面PASSなし |

今回sourcePNGと同SHAの参照で代用した実画面は0。既source原本は履歴・scopeの区別のため読んだ。private登録参照は姫/魔法の顔局所2枚のみ新表示し、残り8は前後hashを固定したがこの段階では未表示。source段階の全10表示歴を今回の追加表示件数へ水増ししない。

## 6. 技術記録と別ゲート

`browser/results.json`を読んだ結果はexpected26、unexpected/skipped/flaky0、errors空。`identity-before.json`/afterを読み、before既存11フィールドは全て同一、inspectionHarness30件も同一、afterのunchanged=trueを確認した。提供index121レコード（PNG103＋JSON18）のSHA256/bytesは全件実ファイル一致。103PNGの実寸も全件index一致。

これらは取得/固定/機械検査の記録であり、R61S-1の美術合格を保証しない。本担当でブラウザーの操作/テストの再実行はしていない。目視は提供されたChrome実レンダー・PNGに限る。未提供/未表示の全倍率/全ブラウザー/全操作/全色・全装飾・全90状態の目視は未確認。

**P05 STOP、実機未確認、実外部同期未確認、人間採用未受領、Visual基準未更新、全体NOT READYを維持する。** 58/59/60および旧33FAIL原本、61source限定PASS原本を変更しない。62以降の試作は今回の証拠へ混ぜない。

## 7. indexの現物照合と表示状態

index SHA256前後: `9305734426ed80abe2b929d78d54c063b7c6f8241d1779cbd00c48c37f57311b`。レコード121/121 SHA256・bytes一致。PNG実寸103/103一致。

| indexファイル | 実寸/種類 | SHA・bytes照合 | 目視/読取状態 |
| --- | --- | --- | --- |
| `smooth-desktop/animals/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/animals/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/animals/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/animals/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/animals/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/animals/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/construction/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/construction/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/construction/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/construction/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/construction/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/construction/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/dinosaurs/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/dinosaurs/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/dinosaurs/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/dinosaurs/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/dinosaurs/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/dinosaurs/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/flowers/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/flowers/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/flowers/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/flowers/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/flowers/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/flowers/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/magic/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/magic/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/magic/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/magic/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/magic/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/magic/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/ocean/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/ocean/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/ocean/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/ocean/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/ocean/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/ocean/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/princess/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/princess/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/princess/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/princess/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/princess/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/princess/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/robots/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/robots/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/robots/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/robots/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/robots/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/robots/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/space/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/space/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/space/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/space/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/space/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/space/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/vehicles/actual-ui-export.png` | 2048×2560 | 一致 | 実表示済み |
| `smooth-desktop/vehicles/editor.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/vehicles/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-desktop/vehicles/finish.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-desktop/vehicles/fit.png` | 516×645 | 一致 | 未表示 |
| `smooth-desktop/vehicles/gallery.png` | 1200×1000 | 一致 | 実表示済み |
| `smooth-mobile/dinosaurs/actual-ui-export.png` | 2048×2560 | 一致 | 同一byte参照・未再表示 |
| `smooth-mobile/dinosaurs/editor.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/dinosaurs/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-mobile/dinosaurs/finish.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/dinosaurs/fit.png` | 732×916 | 一致 | 未表示 |
| `smooth-mobile/dinosaurs/gallery.png` | 780×1688 | 一致 | 未表示 |
| `smooth-mobile/magic/actual-ui-export.png` | 2048×2560 | 一致 | 同一byte参照・未再表示 |
| `smooth-mobile/magic/editor.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/magic/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-mobile/magic/finish.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/magic/fit.png` | 732×916 | 一致 | 未表示 |
| `smooth-mobile/magic/gallery.png` | 780×1688 | 一致 | 未表示 |
| `smooth-mobile/princess/actual-ui-export.png` | 2048×2560 | 一致 | 同一byte参照・未再表示 |
| `smooth-mobile/princess/editor.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/princess/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-mobile/princess/finish.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/princess/fit.png` | 732×916 | 一致 | 同一byte参照・未再表示 |
| `smooth-mobile/princess/gallery.png` | 780×1688 | 一致 | 未表示 |
| `smooth-mobile/vehicles/actual-ui-export.png` | 2048×2560 | 一致 | 同一byte参照・未再表示 |
| `smooth-mobile/vehicles/editor.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/vehicles/evidence.json` | JSON | 一致 | 読取済み |
| `smooth-mobile/vehicles/finish.png` | 780×1688 | 一致 | 実表示済み |
| `smooth-mobile/vehicles/fit.png` | 732×916 | 一致 | 未表示 |
| `smooth-mobile/vehicles/gallery.png` | 780×1688 | 一致 | 未表示 |
| `browser-zoom/erased.png` | 366×458 | 一致 | 実表示済み |
| `browser-zoom/evidence.json` | JSON | 一致 | 読取済み |
| `browser-zoom/face-z1-dpr1.png` | 366×458 | 一致 | 実表示済み |
| `browser-zoom/face-z1-dpr2.png` | 732×916 | 一致 | 実表示済み |
| `browser-zoom/face-z1-dpr3.png` | 1098×1374 | 一致 | 実表示済み |
| `browser-zoom/face-z2-dpr1.png` | 366×458 | 一致 | 実表示済み |
| `browser-zoom/face-z2-dpr2.png` | 732×916 | 一致 | 実表示済み |
| `browser-zoom/face-z2-dpr3.png` | 1098×1374 | 一致 | 実表示済み |
| `browser-zoom/face-z2.65-dpr1.png` | 366×458 | 一致 | 実表示済み |
| `browser-zoom/face-z2.65-dpr2.png` | 732×916 | 一致 | 実表示済み |
| `browser-zoom/face-z2.65-dpr3.png` | 1098×1374 | 一致 | 実表示済み |
| `browser-zoom/face-z4-dpr1.png` | 366×458 | 一致 | 実表示済み |
| `browser-zoom/face-z4-dpr2.png` | 732×916 | 一致 | 実表示済み |
| `browser-zoom/face-z4-dpr3.png` | 1098×1374 | 一致 | 実表示済み |
| `browser-zoom/partial.png` | 366×458 | 一致 | 実表示済み |
| `wizard-reproduction/evidence.json` | JSON | 一致 | 読取済み |
| `wizard-reproduction/face-z1.png` | 516×645 | 一致 | 実表示済み |
| `wizard-reproduction/face-z2.65.png` | 516×645 | 一致 | 実表示済み |
| `wizard-reproduction/face-z2.png` | 516×645 | 一致 | 実表示済み |
| `wizard-reproduction/face-z4.png` | 516×645 | 一致 | 実表示済み |
| `unpainted-eyes/dinosaurs-fit.png` | 516×645 | 一致 | 実表示済み |
| `unpainted-eyes/dinosaurs-z4.png` | 516×645 | 一致 | 実表示済み |
| `unpainted-eyes/evidence.json` | JSON | 一致 | 読取済み |
| `unpainted-eyes/magic-fit.png` | 516×645 | 一致 | 実表示済み |
| `unpainted-eyes/magic-z4.png` | 516×645 | 一致 | 実表示済み |
| `unpainted-eyes/princess-fit.png` | 516×645 | 一致 | 実表示済み |
| `unpainted-eyes/princess-z4.png` | 516×645 | 一致 | 実表示済み |
| `browser-contours/construction-window-left-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/construction-window-right-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/evidence.json` | JSON | 一致 | 読取済み |
| `browser-contours/flowers-stems-left-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/flowers-stems-right-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/magic-chin-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/princess-ear-cheek-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/robots-neck-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/vehicles-hood-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |
| `browser-contours/vehicles-tyre-z4-dpr2.png` | 1032×1290 | 一致 | 実表示済み |

## 8. 実表示ログ

画像cropは画像自体の[left,top,right,bottom]ピクセル座標。private registeredはworldと同じ1600×2000、UI exportは2048×2560。他のChromeスクリーンショットcropはその画像座標であり、worldと混同しない。wholeでは指定最大辺へ縮小する場合だけ表示用に再標本化し、元画像を変更/保存しない。高倍率の主要画面は最大辺1600以内なので原画素で開いている。

| No. | 実表示ファイル | 表示範囲 |
| --- | --- | --- |
| 1 | `test-results/smooth-home-i34/revision-61/browser-contours/princess-ear-cheek-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 2 | `test-results/smooth-home-i34/revision-61/browser-contours/magic-chin-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 3 | `test-results/smooth-home-i34/revision-61/browser-contours/construction-window-left-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 4 | `test-results/smooth-home-i34/revision-61/browser-contours/construction-window-right-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 5 | `test-results/smooth-home-i34/revision-61/browser-contours/robots-neck-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 6 | `test-results/smooth-home-i34/revision-61/browser-contours/vehicles-tyre-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 7 | `test-results/smooth-home-i34/revision-61/browser-contours/vehicles-hood-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 8 | `test-results/smooth-home-i34/revision-61/browser-contours/flowers-stems-left-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 9 | `test-results/smooth-home-i34/revision-61/browser-contours/flowers-stems-right-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 10 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/editor.png` | 全体、最大辺1000px（縮小のみ） |
| 11 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/finish.png` | 全体、最大辺1000px（縮小のみ） |
| 12 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/gallery.png` | 全体、最大辺1000px（縮小のみ） |
| 13 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/actual-ui-export.png` | 全体、最大辺800px（縮小のみ） |
| 14 | `apps/web/public/images/islands/princess-v1.webp` | 全体、最大辺500px（縮小のみ） |
| 15 | `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/editor.png` | 全体、最大辺1000px（縮小のみ） |
| 16 | `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/finish.png` | 全体、最大辺1000px（縮小のみ） |
| 17 | `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/gallery.png` | 全体、最大辺1000px（縮小のみ） |
| 18 | `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/actual-ui-export.png` | 全体、最大辺800px（縮小のみ） |
| 19 | `apps/web/public/images/islands/magic-v1.webp` | 全体、最大辺500px（縮小のみ） |
| 20 | `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/editor.png` | 全体、最大辺950px（縮小のみ） |
| 21 | `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/finish.png` | 全体、最大辺950px（縮小のみ） |
| 22 | `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 23 | `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 24 | `apps/web/public/images/islands/vehicles-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 25 | `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/editor.png` | 全体、最大辺950px（縮小のみ） |
| 26 | `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/finish.png` | 全体、最大辺950px（縮小のみ） |
| 27 | `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 28 | `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 29 | `apps/web/public/images/islands/robots-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 30 | `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/editor.png` | 全体、最大辺950px（縮小のみ） |
| 31 | `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/finish.png` | 全体、最大辺950px（縮小のみ） |
| 32 | `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 33 | `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 34 | `apps/web/public/images/islands/construction-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 35 | `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/editor.png` | 全体、最大辺950px（縮小のみ） |
| 36 | `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/finish.png` | 全体、最大辺950px（縮小のみ） |
| 37 | `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 38 | `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 39 | `apps/web/public/images/islands/flowers-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 40 | `test-results/smooth-home-i34/revision-61/smooth-desktop/space/editor.png` | 全体、最大辺950px（縮小のみ） |
| 41 | `test-results/smooth-home-i34/revision-61/smooth-desktop/space/finish.png` | 全体、最大辺950px（縮小のみ） |
| 42 | `test-results/smooth-home-i34/revision-61/smooth-desktop/space/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 43 | `test-results/smooth-home-i34/revision-61/smooth-desktop/space/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 44 | `apps/web/public/images/islands/space-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 45 | `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/editor.png` | 全体、最大辺950px（縮小のみ） |
| 46 | `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/finish.png` | 全体、最大辺950px（縮小のみ） |
| 47 | `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 48 | `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 49 | `apps/web/public/images/islands/animals-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 50 | `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/editor.png` | 全体、最大辺950px（縮小のみ） |
| 51 | `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/finish.png` | 全体、最大辺950px（縮小のみ） |
| 52 | `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 53 | `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 54 | `apps/web/public/images/islands/ocean-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 55 | `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/editor.png` | 全体、最大辺950px（縮小のみ） |
| 56 | `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/finish.png` | 全体、最大辺950px（縮小のみ） |
| 57 | `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/gallery.png` | 全体、最大辺950px（縮小のみ） |
| 58 | `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/actual-ui-export.png` | 全体、最大辺750px（縮小のみ） |
| 59 | `apps/web/public/images/islands/dinosaurs-v1.webp` | 全体、最大辺450px（縮小のみ） |
| 60 | `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/editor.png` | 全体、最大辺1200px（縮小のみ） |
| 61 | `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/finish.png` | 全体、最大辺1200px（縮小のみ） |
| 62 | `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/editor.png` | 全体、最大辺1200px（縮小のみ） |
| 63 | `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/finish.png` | 全体、最大辺1200px（縮小のみ） |
| 64 | `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/editor.png` | 全体、最大辺1200px（縮小のみ） |
| 65 | `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/finish.png` | 全体、最大辺1200px（縮小のみ） |
| 66 | `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/editor.png` | 全体、最大辺1200px（縮小のみ） |
| 67 | `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/finish.png` | 全体、最大辺1200px（縮小のみ） |
| 68 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z4-dpr1.png` | 全体、最大辺1600px（縮小のみ） |
| 69 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z4-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 70 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z4-dpr3.png` | 全体、最大辺1600px（縮小のみ） |
| 71 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2.65-dpr1.png` | 全体、最大辺1600px（縮小のみ） |
| 72 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2.65-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 73 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2.65-dpr3.png` | 全体、最大辺1600px（縮小のみ） |
| 74 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/actual-ui-export.png` | 画像座標crop [1000, 760, 1100, 920]、原寸 |
| 75 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z4-dpr3.png` | 画像座標crop [930, 730, 1070, 930]、原寸 |
| 76 | `test-results/smooth-home-i34/revision-61/browser-contours/robots-neck-z4-dpr2.png` | 画像座標crop [130, 430, 840, 610]、原寸 |
| 77 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z1-dpr1.png` | 全体、最大辺1600px（縮小のみ） |
| 78 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z1-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 79 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z1-dpr3.png` | 全体、最大辺1600px（縮小のみ） |
| 80 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2-dpr1.png` | 全体、最大辺1600px（縮小のみ） |
| 81 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2-dpr2.png` | 全体、最大辺1600px（縮小のみ） |
| 82 | `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2-dpr3.png` | 全体、最大辺1600px（縮小のみ） |
| 83 | `test-results/smooth-home-i34/revision-61/browser-zoom/partial.png` | 全体、最大辺1600px（縮小のみ） |
| 84 | `test-results/smooth-home-i34/revision-61/browser-zoom/erased.png` | 全体、最大辺1600px（縮小のみ） |
| 85 | `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z1.png` | 全体、最大辺1600px（縮小のみ） |
| 86 | `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z2.png` | 全体、最大辺1600px（縮小のみ） |
| 87 | `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z4.png` | 全体、最大辺1600px（縮小のみ） |
| 88 | `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z2.65.png` | 全体、最大辺1600px（縮小のみ） |
| 89 | `test-results/smooth-home-i34/revision-61/unpainted-eyes/princess-fit.png` | 全体、最大辺1600px（縮小のみ） |
| 90 | `test-results/smooth-home-i34/revision-61/unpainted-eyes/princess-z4.png` | 全体、最大辺1600px（縮小のみ） |
| 91 | `test-results/smooth-home-i34/revision-61/unpainted-eyes/magic-fit.png` | 全体、最大辺1600px（縮小のみ） |
| 92 | `test-results/smooth-home-i34/revision-61/unpainted-eyes/magic-z4.png` | 全体、最大辺1600px（縮小のみ） |
| 93 | `test-results/smooth-home-i34/revision-61/unpainted-eyes/dinosaurs-fit.png` | 全体、最大辺1600px（縮小のみ） |
| 94 | `test-results/smooth-home-i34/revision-61/unpainted-eyes/dinosaurs-z4.png` | 全体、最大辺1600px（縮小のみ） |
| 95 | `test-results/smooth-home-i34/revision-61/browser-contours/princess-ear-cheek-z4-dpr2.png` | 画像座標crop [820, 670, 900, 780]、原寸 |
| 96 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/actual-ui-export.png` | 画像座標crop [1028, 828, 1060, 882]、原寸 |
| 97 | `content/smooth-finish-i34/derived/princess-registered.png` | 画像座標crop [490, 430, 920, 860]、原寸 |
| 98 | `content/smooth-finish-i34/derived/magic-registered.png` | 画像座標crop [550, 420, 910, 805]、原寸 |
| 99 | `content/smooth-finish-i33/references/home-target.png` | 全体、最大辺1000px（縮小のみ） |
| 100 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/actual-ui-export.png` | 画像座標crop [620, 540, 1180, 1140]、原寸 |
| 101 | `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/actual-ui-export.png` | 画像座標crop [700, 530, 1200, 1050]、原寸 |
| 102 | `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/actual-ui-export.png` | 画像座標crop [850, 1030, 1420, 1470]、原寸 |
| 103 | `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/actual-ui-export.png` | 画像座標crop [840, 1020, 1310, 1150]、原寸 |
| 104 | `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/actual-ui-export.png` | 画像座標crop [510, 1260, 720, 1400]、原寸 |
| 105 | `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/actual-ui-export.png` | 画像座標crop [760, 1110, 1340, 1610]、原寸 |
| 106 | `test-results/smooth-home-i34/revision-61/smooth-desktop/space/actual-ui-export.png` | 画像座標crop [1060, 950, 1600, 1450]、原寸 |
| 107 | `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/actual-ui-export.png` | 画像座標crop [680, 1360, 1040, 1630]、原寸 |
| 108 | `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/actual-ui-export.png` | 画像座標crop [1240, 720, 1460, 920]、原寸 |
| 109 | `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/actual-ui-export.png` | 画像座標crop [700, 1580, 815, 1690]、原寸 |
| 110 | `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/actual-ui-export.png` | 画像座標crop [890, 1230, 1070, 1400]、原寸 |
| 111 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/actual-ui-export.png` | 画像座標crop [1290, 1720, 1470, 1920]、原寸 |
| 112 | `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/actual-ui-export.png` | 画像座標crop [1580, 1510, 1690, 1720]、原寸 |
| 113 | `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/actual-ui-export.png` | 画像座標crop [400, 600, 930, 1000]、原寸 |

## 9. 確認前後SHA256/bytes原記録

初期148入力の前固定: 2026-10-13T00:21:44.8559082+09:00。取得条件確認の2コード局所の追加前固定: 2026-10-13T00:33:15.6556215+09:00。後固定: 2026-10-13T00:34:37.0317740+09:00。**150/150前後一致、欠落/bytes変更/hash変更0**。JSON/コードは読み取りのみ。下記private行は識別と改変有無の記録であり、画像の配布ではない。

| 入力ファイル | bytes前 | bytes後 | SHA256前 | SHA256後 |
| --- | ---: | ---: | --- | --- |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/actual-ui-export.png` | 2666506 | 2666506 | `590e51775ba7cedb65341193a7001ebedea78ba7c10a4bf0b5e98ff0d5c91b24` | `590e51775ba7cedb65341193a7001ebedea78ba7c10a4bf0b5e98ff0d5c91b24` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/editor.png` | 531532 | 531532 | `facbcb6208e17da72436bf1f9b9241fa94fd4755d5bb0cf80ccc4915b58a67fa` | `facbcb6208e17da72436bf1f9b9241fa94fd4755d5bb0cf80ccc4915b58a67fa` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/evidence.json` | 2992 | 2992 | `91dddb08c75e32d1ca7c455d091572adeb244da1def5f207a1a6b96f19d5ca12` | `91dddb08c75e32d1ca7c455d091572adeb244da1def5f207a1a6b96f19d5ca12` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/finish.png` | 435031 | 435031 | `0a5f968867646ac5ee6edcaed58e57f950e7b56185c7b939904f6af2b873804d` | `0a5f968867646ac5ee6edcaed58e57f950e7b56185c7b939904f6af2b873804d` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/fit.png` | 221090 | 221090 | `7826303ce818b137398f99a65c0912eebf4f7894f1d1e7ee293d5d1b8aa62a70` | `7826303ce818b137398f99a65c0912eebf4f7894f1d1e7ee293d5d1b8aa62a70` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/animals/gallery.png` | 409632 | 409632 | `743e62a71a76a896ccad4de4ef1e09bdbf66e691b6d63ead8d407cab32bd86a9` | `743e62a71a76a896ccad4de4ef1e09bdbf66e691b6d63ead8d407cab32bd86a9` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/actual-ui-export.png` | 1374007 | 1374007 | `bfd7b0b094822e27d9c19149e28fce61c4e829616c997e7f54480b91f505091d` | `bfd7b0b094822e27d9c19149e28fce61c4e829616c997e7f54480b91f505091d` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/editor.png` | 435854 | 435854 | `06644bbe86b076052d9367f1395c8d951e294add49399e4bc4d589f950f2755b` | `06644bbe86b076052d9367f1395c8d951e294add49399e4bc4d589f950f2755b` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/evidence.json` | 4966 | 4966 | `cd9ebe469aada3237c9832f825dc67e4a592c5c389ad03672863eba0da7814bc` | `cd9ebe469aada3237c9832f825dc67e4a592c5c389ad03672863eba0da7814bc` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/finish.png` | 321836 | 321836 | `544b53906f787fcff143ed03ff5c7e2ac46dd0d27bd6d41ed15f3a2f032f8830` | `544b53906f787fcff143ed03ff5c7e2ac46dd0d27bd6d41ed15f3a2f032f8830` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/fit.png` | 130625 | 130625 | `987316597bdf0f3261e6b654dba50240afdea5c282770916bb50f9de667dcba1` | `987316597bdf0f3261e6b654dba50240afdea5c282770916bb50f9de667dcba1` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/construction/gallery.png` | 397852 | 397852 | `4b136690107d774f642cef674c19bd06a4bb0c8bbba1714696db4ef529a66669` | `4b136690107d774f642cef674c19bd06a4bb0c8bbba1714696db4ef529a66669` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/actual-ui-export.png` | 1796811 | 1796811 | `e97c2e46aaf9337e4f4d0291b3513a6cff54d1f5fe026fb0ea2a36abe4117238` | `e97c2e46aaf9337e4f4d0291b3513a6cff54d1f5fe026fb0ea2a36abe4117238` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/editor.png` | 452908 | 452908 | `a4f81ca3cdabd2e9ec6e160b79e1c8a9ba0f9aa08b6c655ae87c3b90c6c8ecee` | `a4f81ca3cdabd2e9ec6e160b79e1c8a9ba0f9aa08b6c655ae87c3b90c6c8ecee` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/evidence.json` | 2666 | 2666 | `107b157a736a21e764227324a5c76442b9062af1abc8cd6d5fd1ca1604306762` | `107b157a736a21e764227324a5c76442b9062af1abc8cd6d5fd1ca1604306762` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/finish.png` | 344773 | 344773 | `f44500a90d28d0667f4267a095c50496ba07cd46988b3af305cadf041c511e97` | `f44500a90d28d0667f4267a095c50496ba07cd46988b3af305cadf041c511e97` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/fit.png` | 149880 | 149880 | `5e71c389d155311f25cc25dbed9f4dd3a51b7fe84a586033b7820af72cd188d7` | `5e71c389d155311f25cc25dbed9f4dd3a51b7fe84a586033b7820af72cd188d7` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/dinosaurs/gallery.png` | 392719 | 392719 | `3b2845278e962a422d0dd11e25b1340feed51d6bd689e4faf1cbe214a4b37f77` | `3b2845278e962a422d0dd11e25b1340feed51d6bd689e4faf1cbe214a4b37f77` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/actual-ui-export.png` | 1702205 | 1702205 | `92b974b55240ef8fc79a82423c0406b1162bcbe63c4712984781f208aca6153f` | `92b974b55240ef8fc79a82423c0406b1162bcbe63c4712984781f208aca6153f` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/editor.png` | 457332 | 457332 | `421e15e10b96e234533728004c6dfcab87b6e171ec6709390f80a7119bca344e` | `421e15e10b96e234533728004c6dfcab87b6e171ec6709390f80a7119bca344e` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/evidence.json` | 4560 | 4560 | `7e2857879ce351ccbbc9972d406bfefadcdbf4f8b0600c295fbe68da3508356f` | `7e2857879ce351ccbbc9972d406bfefadcdbf4f8b0600c295fbe68da3508356f` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/finish.png` | 350199 | 350199 | `103b324c4c6265e319e64c6bce8f19aee782b600048063db01be3d8db7e04f2b` | `103b324c4c6265e319e64c6bce8f19aee782b600048063db01be3d8db7e04f2b` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/fit.png` | 152326 | 152326 | `02e25a0f2a00e6553281dede17a837b5ae2b2ef789949faf4c39a2ffefa257e3` | `02e25a0f2a00e6553281dede17a837b5ae2b2ef789949faf4c39a2ffefa257e3` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/flowers/gallery.png` | 398095 | 398095 | `d97e86c45b6deded422f24dc44dd805e26fc87d9f96e1bcd1ef99d7b0566b2ec` | `d97e86c45b6deded422f24dc44dd805e26fc87d9f96e1bcd1ef99d7b0566b2ec` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/actual-ui-export.png` | 2070177 | 2070177 | `869067ec1c83dcbc556d283e92d673d982361aeb7ce55248fa9daf9ab1ee1844` | `869067ec1c83dcbc556d283e92d673d982361aeb7ce55248fa9daf9ab1ee1844` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/editor.png` | 479010 | 479010 | `f6bfd323471a2349684dfe20ed3a31d5312badeb10463817e2f6dc8d995d460e` | `f6bfd323471a2349684dfe20ed3a31d5312badeb10463817e2f6dc8d995d460e` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/evidence.json` | 4557 | 4557 | `8c9ca5eb66b384c20c52bf3c04b6248f5f1175812a54b02d57835b4075d2994f` | `8c9ca5eb66b384c20c52bf3c04b6248f5f1175812a54b02d57835b4075d2994f` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/finish.png` | 377988 | 377988 | `7b0eb1bd8772cc05c8d41f070eb164bb67fd0c62d60380b946e8fb3381b07e34` | `7b0eb1bd8772cc05c8d41f070eb164bb67fd0c62d60380b946e8fb3381b07e34` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/fit.png` | 174088 | 174088 | `9d33c65afc679eb22c723a1b81102eb2fa5aed811f9503aca803e79e718fd061` | `9d33c65afc679eb22c723a1b81102eb2fa5aed811f9503aca803e79e718fd061` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/magic/gallery.png` | 402073 | 402073 | `d3f230d47f1099c9afdaf7e2a64c394a8864b69e6e51574eb6777a23e3fe5968` | `d3f230d47f1099c9afdaf7e2a64c394a8864b69e6e51574eb6777a23e3fe5968` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/actual-ui-export.png` | 1989528 | 1989528 | `b66b7310933bf462ee55ccfb95a372fcffb7aa6281bc3ffff989f4ca883fbdae` | `b66b7310933bf462ee55ccfb95a372fcffb7aa6281bc3ffff989f4ca883fbdae` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/editor.png` | 467522 | 467522 | `3d965be03356659dda6ba76a069943adbb68e53decb7f373e360c872967f2515` | `3d965be03356659dda6ba76a069943adbb68e53decb7f373e360c872967f2515` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/evidence.json` | 3972 | 3972 | `40a54364f6f146132cecdb5d405cf544bdbf47efad81f9b3eaac40c33b732dcd` | `40a54364f6f146132cecdb5d405cf544bdbf47efad81f9b3eaac40c33b732dcd` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/finish.png` | 365090 | 365090 | `d3a5445389b3611566bcf6e062895b3b3c3f4cf922d2ef68021064291fbacd01` | `d3a5445389b3611566bcf6e062895b3b3c3f4cf922d2ef68021064291fbacd01` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/fit.png` | 165453 | 165453 | `747bd5fe7758c33286d3907fc23257f7d10b7e4382feb9970bde61b8321622f7` | `747bd5fe7758c33286d3907fc23257f7d10b7e4382feb9970bde61b8321622f7` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/ocean/gallery.png` | 401444 | 401444 | `bd6ae7e4ebd934ced0b9d652c0fab70bec08ba8e2582f15f4532231be895ed71` | `bd6ae7e4ebd934ced0b9d652c0fab70bec08ba8e2582f15f4532231be895ed71` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/actual-ui-export.png` | 2021565 | 2021565 | `f55065c6472ae7d6af1d443ef922406909196e035357274317d8badcf10fe2f7` | `f55065c6472ae7d6af1d443ef922406909196e035357274317d8badcf10fe2f7` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/editor.png` | 480041 | 480041 | `f9592ffb0951667252be679b9b518c31c68f410514d38d5446202c5818c0f32f` | `f9592ffb0951667252be679b9b518c31c68f410514d38d5446202c5818c0f32f` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/evidence.json` | 4797 | 4797 | `7a242d3d432c54f13a1b109914df0e651efee27f99c6a388117bb87048b78a9c` | `7a242d3d432c54f13a1b109914df0e651efee27f99c6a388117bb87048b78a9c` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/finish.png` | 373920 | 373920 | `8e1ab80b7928d4bb0c5a027613e2df0cb07872a58cf043694bb2b6f5b38f6205` | `8e1ab80b7928d4bb0c5a027613e2df0cb07872a58cf043694bb2b6f5b38f6205` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/fit.png` | 172994 | 172994 | `caad4ce9e9ec6840d0b3e804553b964b7f2c22c893cd9bdf3d1bce9de5749707` | `caad4ce9e9ec6840d0b3e804553b964b7f2c22c893cd9bdf3d1bce9de5749707` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/princess/gallery.png` | 397017 | 397017 | `9627017f0c10b42fa69fba93fff6f6391cf0b9ed8ab2cef0827805425f32b6a3` | `9627017f0c10b42fa69fba93fff6f6391cf0b9ed8ab2cef0827805425f32b6a3` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/actual-ui-export.png` | 1146464 | 1146464 | `b40a19d24f139734a15ae3d6710968a8e9e932a5f4c57d2c45c67c77aa551792` | `b40a19d24f139734a15ae3d6710968a8e9e932a5f4c57d2c45c67c77aa551792` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/editor.png` | 405157 | 405157 | `27ac6542c3c4ded8fc67c6c339995268bce9512170c9a34f34c0ef162ebe877b` | `27ac6542c3c4ded8fc67c6c339995268bce9512170c9a34f34c0ef162ebe877b` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/evidence.json` | 4548 | 4548 | `9829ad6d94325b90e12ef564aa27e0347e57aa6699779edceca64ef7cbfb889a` | `9829ad6d94325b90e12ef564aa27e0347e57aa6699779edceca64ef7cbfb889a` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/finish.png` | 287047 | 287047 | `9d7f6de7dd9ac6658e0de3689b0b5c1157473563b701c260f3ae20a1e78ea662` | `9d7f6de7dd9ac6658e0de3689b0b5c1157473563b701c260f3ae20a1e78ea662` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/fit.png` | 106854 | 106854 | `a4856a59c6391ed4c1e3fc23a2105e9ed287c340d3f7f1e38281578acbf26642` | `a4856a59c6391ed4c1e3fc23a2105e9ed287c340d3f7f1e38281578acbf26642` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/robots/gallery.png` | 385537 | 385537 | `f88ec92f44ae1245b25c69d856d338e7464b24b25755bb3e9b337c89730bd863` | `f88ec92f44ae1245b25c69d856d338e7464b24b25755bb3e9b337c89730bd863` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/space/actual-ui-export.png` | 1364754 | 1364754 | `91cae0ac940d12924e38739c732c005fef181826320810a215bb127461601bc0` | `91cae0ac940d12924e38739c732c005fef181826320810a215bb127461601bc0` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/space/editor.png` | 431321 | 431321 | `e3dcce955bb9bdf6da0af3f811b3405d5ba5d69e5c607fb87bcb838dbd4b25af` | `e3dcce955bb9bdf6da0af3f811b3405d5ba5d69e5c607fb87bcb838dbd4b25af` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/space/evidence.json` | 4567 | 4567 | `a097fd8c52f2f54e774b2eb4e646d4bf68c4a1594591ab4659eed3753a8a3739` | `a097fd8c52f2f54e774b2eb4e646d4bf68c4a1594591ab4659eed3753a8a3739` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/space/finish.png` | 319039 | 319039 | `1a9af7aebd2dc55208922140f7602c03d2e939252d621e51f89ab7351a03b5b0` | `1a9af7aebd2dc55208922140f7602c03d2e939252d621e51f89ab7351a03b5b0` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/space/fit.png` | 130293 | 130293 | `45d2fb725a350e7908cf043426c2dcc957563fce0e31002bffb99fd1eb3324ed` | `45d2fb725a350e7908cf043426c2dcc957563fce0e31002bffb99fd1eb3324ed` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/space/gallery.png` | 396209 | 396209 | `1e7bfe440868a258d44656910a8652fb15f04d5e882e3993bc0354692496c974` | `1e7bfe440868a258d44656910a8652fb15f04d5e882e3993bc0354692496c974` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/actual-ui-export.png` | 973996 | 973996 | `6b33fc9b9228b49fa6276597e1b66808c4478c2f67306be3df152684d5579da8` | `6b33fc9b9228b49fa6276597e1b66808c4478c2f67306be3df152684d5579da8` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/editor.png` | 390251 | 390251 | `18a2ebc6479e0d5d85a8d06f0779d63f12a384fb61297e101ac670ccde6e13fa` | `18a2ebc6479e0d5d85a8d06f0779d63f12a384fb61297e101ac670ccde6e13fa` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/evidence.json` | 3243 | 3243 | `3d40f8d00a088dc06980688dc1aa7fc96c76103643671dcd67a7cfcca92c969a` | `3d40f8d00a088dc06980688dc1aa7fc96c76103643671dcd67a7cfcca92c969a` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/finish.png` | 268290 | 268290 | `e2bc8a91411afbf6e807f84d915251fa2e19195594732001945087f4ebb05cfc` | `e2bc8a91411afbf6e807f84d915251fa2e19195594732001945087f4ebb05cfc` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/fit.png` | 94695 | 94695 | `17c37c5266bc521ccf690d7c8234cb35da21eaecd3b17a5aa7fe96781944bf09` | `17c37c5266bc521ccf690d7c8234cb35da21eaecd3b17a5aa7fe96781944bf09` |
| `test-results/smooth-home-i34/revision-61/smooth-desktop/vehicles/gallery.png` | 375000 | 375000 | `8984378fc890fd1ab80486b9140358d918baad114dd8c2fd861d54cc2b396fee` | `8984378fc890fd1ab80486b9140358d918baad114dd8c2fd861d54cc2b396fee` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/actual-ui-export.png` | 1796811 | 1796811 | `e97c2e46aaf9337e4f4d0291b3513a6cff54d1f5fe026fb0ea2a36abe4117238` | `e97c2e46aaf9337e4f4d0291b3513a6cff54d1f5fe026fb0ea2a36abe4117238` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/editor.png` | 566730 | 566730 | `be844a650bf873ba7debe96bf758571fffb8c87dff7e42cfd829a4c194bbf102` | `be844a650bf873ba7debe96bf758571fffb8c87dff7e42cfd829a4c194bbf102` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/evidence.json` | 2664 | 2664 | `1636dc4e7d315da4922766ad62142532c7972866d4ac88789e52d0d29142df43` | `1636dc4e7d315da4922766ad62142532c7972866d4ac88789e52d0d29142df43` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/finish.png` | 400457 | 400457 | `ae8063a3cf88c96179e1be5b51a2357abfdb6f83fa42916856529e98d30d7d6b` | `ae8063a3cf88c96179e1be5b51a2357abfdb6f83fa42916856529e98d30d7d6b` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/fit.png` | 256541 | 256541 | `fcca832df2070546c7ed0af2e6e252b769c9b3d6d830c1567b31c09537071200` | `fcca832df2070546c7ed0af2e6e252b769c9b3d6d830c1567b31c09537071200` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/dinosaurs/gallery.png` | 514810 | 514810 | `9ecebeb1464cb7ac251ca40d81fa86b315e75e7dc2067c492a34712bf8915e4f` | `9ecebeb1464cb7ac251ca40d81fa86b315e75e7dc2067c492a34712bf8915e4f` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/actual-ui-export.png` | 2070177 | 2070177 | `869067ec1c83dcbc556d283e92d673d982361aeb7ce55248fa9daf9ab1ee1844` | `869067ec1c83dcbc556d283e92d673d982361aeb7ce55248fa9daf9ab1ee1844` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/editor.png` | 609776 | 609776 | `5feaaf305a21cb2d71b7536c9238b029787bc1a91f67a91fa11124d1ae4e4975` | `5feaaf305a21cb2d71b7536c9238b029787bc1a91f67a91fa11124d1ae4e4975` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/evidence.json` | 4555 | 4555 | `aae77e4493d5161240918099acda061b37e056f2690f1dd47fef714066570c38` | `aae77e4493d5161240918099acda061b37e056f2690f1dd47fef714066570c38` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/finish.png` | 444960 | 444960 | `feb8596b70a6d8b00df0f966092adb2783d65f727c4a1d68aa8b6b5450948536` | `feb8596b70a6d8b00df0f966092adb2783d65f727c4a1d68aa8b6b5450948536` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/fit.png` | 300394 | 300394 | `ba2c1c9c5a7f3c85bbffa5db41dbc1f3255049f439913e14444044289e30df67` | `ba2c1c9c5a7f3c85bbffa5db41dbc1f3255049f439913e14444044289e30df67` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/magic/gallery.png` | 534859 | 534859 | `6b4d077c2eb5e80b5df44806697fb2388745c50b6fcb93eed6a54ef742b7efd4` | `6b4d077c2eb5e80b5df44806697fb2388745c50b6fcb93eed6a54ef742b7efd4` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/actual-ui-export.png` | 2021565 | 2021565 | `f55065c6472ae7d6af1d443ef922406909196e035357274317d8badcf10fe2f7` | `f55065c6472ae7d6af1d443ef922406909196e035357274317d8badcf10fe2f7` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/editor.png` | 600597 | 600597 | `0ee49ce9d40b1a214aed65f8cc6a95fd3f70092217639029cdabba11ea1bb7b7` | `0ee49ce9d40b1a214aed65f8cc6a95fd3f70092217639029cdabba11ea1bb7b7` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/evidence.json` | 4795 | 4795 | `daac3fbaa6d234d7f124cbe606f5b882842b5f50afa4dcf2135abf940cbf93f4` | `daac3fbaa6d234d7f124cbe606f5b882842b5f50afa4dcf2135abf940cbf93f4` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/finish.png` | 438168 | 438168 | `ab85d5112b32f8f846606fd789e5f46e89fffd3fe36f8537caa8ba4de13f0e9f` | `ab85d5112b32f8f846606fd789e5f46e89fffd3fe36f8537caa8ba4de13f0e9f` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/fit.png` | 294465 | 294465 | `7f30f99e207b465449c4941e939f495757664600adc0edb54141ce44bb181138` | `7f30f99e207b465449c4941e939f495757664600adc0edb54141ce44bb181138` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/princess/gallery.png` | 523473 | 523473 | `3d81095cb95762fd2a58ddc89af5272b3eb78432fb3a302b83870f2144afdf49` | `3d81095cb95762fd2a58ddc89af5272b3eb78432fb3a302b83870f2144afdf49` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/actual-ui-export.png` | 973996 | 973996 | `6b33fc9b9228b49fa6276597e1b66808c4478c2f67306be3df152684d5579da8` | `6b33fc9b9228b49fa6276597e1b66808c4478c2f67306be3df152684d5579da8` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/editor.png` | 459301 | 459301 | `84e852da22e0b3ae1b65d7abc3bd129c22b989db0a35df3543c9c47f78229e9c` | `84e852da22e0b3ae1b65d7abc3bd129c22b989db0a35df3543c9c47f78229e9c` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/evidence.json` | 3241 | 3241 | `98b7098ddf67c4868923d1b60e69877f59ec0d3c277ff9b5f9037321d3316964` | `98b7098ddf67c4868923d1b60e69877f59ec0d3c277ff9b5f9037321d3316964` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/finish.png` | 294163 | 294163 | `75886e6212925066a137154fd213894d403041c7efa7012b2cd3d62adc1ec08d` | `75886e6212925066a137154fd213894d403041c7efa7012b2cd3d62adc1ec08d` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/fit.png` | 152520 | 152520 | `0f98e6ee3520217ec6e6aaf8432ae520581c7585aa1163073292381205eb4c4c` | `0f98e6ee3520217ec6e6aaf8432ae520581c7585aa1163073292381205eb4c4c` |
| `test-results/smooth-home-i34/revision-61/smooth-mobile/vehicles/gallery.png` | 491880 | 491880 | `7c0814933ea36fd3b754e0cd0e1c03cba7b5fda3c32f71c6cffb902376479722` | `7c0814933ea36fd3b754e0cd0e1c03cba7b5fda3c32f71c6cffb902376479722` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/erased.png` | 96185 | 96185 | `932f7aa1dbe2a022b280419d36d7358170e9abcc24c176238dc8f209415e51c0` | `932f7aa1dbe2a022b280419d36d7358170e9abcc24c176238dc8f209415e51c0` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/evidence.json` | 2655 | 2655 | `1ff69588eb3260c81c480614578b8cb79668478e6e750a858e08f9b452d8638c` | `1ff69588eb3260c81c480614578b8cb79668478e6e750a858e08f9b452d8638c` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z1-dpr1.png` | 98190 | 98190 | `927c8db11dc340f09f4bbea40a56d9af2570aac330370f308e372f5fdb3e28b8` | `927c8db11dc340f09f4bbea40a56d9af2570aac330370f308e372f5fdb3e28b8` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z1-dpr2.png` | 294465 | 294465 | `7f30f99e207b465449c4941e939f495757664600adc0edb54141ce44bb181138` | `7f30f99e207b465449c4941e939f495757664600adc0edb54141ce44bb181138` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z1-dpr3.png` | 544226 | 544226 | `d1b6bbeed34ce73b4a94ec1944db4a69638e28e07fd7c5cc97ce2c016b137008` | `d1b6bbeed34ce73b4a94ec1944db4a69638e28e07fd7c5cc97ce2c016b137008` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2-dpr1.png` | 151081 | 151081 | `9d46a268a4308df5fda75556acef123f41f64af75ba8763e89f81bdc1eb39ad9` | `9d46a268a4308df5fda75556acef123f41f64af75ba8763e89f81bdc1eb39ad9` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2-dpr2.png` | 429931 | 429931 | `91cf32f677ed789c7c6151fd25a45eed6228bd3ab25bb0d006ff6dc4a9b02ecf` | `91cf32f677ed789c7c6151fd25a45eed6228bd3ab25bb0d006ff6dc4a9b02ecf` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2-dpr3.png` | 759441 | 759441 | `7788aa1d1ab88e6d0c0cab67d7e18c21eb672ef207ff1330db06ab18f1001bba` | `7788aa1d1ab88e6d0c0cab67d7e18c21eb672ef207ff1330db06ab18f1001bba` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2.65-dpr1.png` | 167155 | 167155 | `1e908ee49875bbc531a1ef48a180951f2a89f61202752467a255690366a5154b` | `1e908ee49875bbc531a1ef48a180951f2a89f61202752467a255690366a5154b` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2.65-dpr2.png` | 469077 | 469077 | `5deabddbcb546be48d1cc8e71ef66c49444229898eb8feb64eb3312fe5fc176c` | `5deabddbcb546be48d1cc8e71ef66c49444229898eb8feb64eb3312fe5fc176c` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z2.65-dpr3.png` | 830756 | 830756 | `6b4a3871d3d2b4666bfb8ed08ff4b54959d3b9467e6476db1ed1aab245dbc6e9` | `6b4a3871d3d2b4666bfb8ed08ff4b54959d3b9467e6476db1ed1aab245dbc6e9` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z4-dpr1.png` | 157910 | 157910 | `0ee05962132de354967808472478f24cc2e691da94f29f52175f42f961249133` | `0ee05962132de354967808472478f24cc2e691da94f29f52175f42f961249133` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z4-dpr2.png` | 423715 | 423715 | `54dfbb1c20cf86cc3055b51107b99fd1a1bb60ab830eba8f00ff10b900d3cda0` | `54dfbb1c20cf86cc3055b51107b99fd1a1bb60ab830eba8f00ff10b900d3cda0` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/face-z4-dpr3.png` | 747269 | 747269 | `edfcc1eccde221291f48b8622123d44b80e094531f5b120eecbda7c2ac993796` | `edfcc1eccde221291f48b8622123d44b80e094531f5b120eecbda7c2ac993796` |
| `test-results/smooth-home-i34/revision-61/browser-zoom/partial.png` | 98272 | 98272 | `9e8e05164631c9a4e5a8b48082aa26fb9a6f725d37e4dddc981bbcc6e58a0b7a` | `9e8e05164631c9a4e5a8b48082aa26fb9a6f725d37e4dddc981bbcc6e58a0b7a` |
| `test-results/smooth-home-i34/revision-61/wizard-reproduction/evidence.json` | 4107 | 4107 | `8aa05b814580f5d361e57a1e3c11955564726513d8b5b5e0de1f85ca40ca41c4` | `8aa05b814580f5d361e57a1e3c11955564726513d8b5b5e0de1f85ca40ca41c4` |
| `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z1.png` | 165999 | 165999 | `97f071148ced7d55bcc717c76809e54796109e9237b6a51ed64238272a5cdfff` | `97f071148ced7d55bcc717c76809e54796109e9237b6a51ed64238272a5cdfff` |
| `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z2.65.png` | 220314 | 220314 | `8822bbab9fe2b811a6809937257722722db5c201d8243238e4381695717aefd9` | `8822bbab9fe2b811a6809937257722722db5c201d8243238e4381695717aefd9` |
| `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z2.png` | 236747 | 236747 | `71fed6bbc8dd2fb980b832f5bd02f1613214e752b33b626f65ed5826682d836d` | `71fed6bbc8dd2fb980b832f5bd02f1613214e752b33b626f65ed5826682d836d` |
| `test-results/smooth-home-i34/revision-61/wizard-reproduction/face-z4.png` | 182520 | 182520 | `e5aa7ddf6a133608e8782bfe5e887713f02cbdbb0314fc07c0f2c1f6f298821d` | `e5aa7ddf6a133608e8782bfe5e887713f02cbdbb0314fc07c0f2c1f6f298821d` |
| `test-results/smooth-home-i34/revision-61/unpainted-eyes/dinosaurs-fit.png` | 125256 | 125256 | `e14e563da8c0680e843cf4697f79ae149824a7fcfbd1d0e927d153e8de1b87f6` | `e14e563da8c0680e843cf4697f79ae149824a7fcfbd1d0e927d153e8de1b87f6` |
| `test-results/smooth-home-i34/revision-61/unpainted-eyes/dinosaurs-z4.png` | 96889 | 96889 | `d3e94890febc12effef2c0b41c8edeba34ed2946f6cf1cb1582dcf8be1aff11d` | `d3e94890febc12effef2c0b41c8edeba34ed2946f6cf1cb1582dcf8be1aff11d` |
| `test-results/smooth-home-i34/revision-61/unpainted-eyes/evidence.json` | 1682 | 1682 | `8b814966904ad6f93a465328324aec7510dd32bc0249c460efeed26114445356` | `8b814966904ad6f93a465328324aec7510dd32bc0249c460efeed26114445356` |
| `test-results/smooth-home-i34/revision-61/unpainted-eyes/magic-fit.png` | 83146 | 83146 | `ccd83272f87d0dc97731a39ef05dd4b55b597fc005794330914cb69f37a32164` | `ccd83272f87d0dc97731a39ef05dd4b55b597fc005794330914cb69f37a32164` |
| `test-results/smooth-home-i34/revision-61/unpainted-eyes/magic-z4.png` | 118583 | 118583 | `f6c8214944e534f146b6992da4fce75d01ec97cfc620f8f062d416311d21af9f` | `f6c8214944e534f146b6992da4fce75d01ec97cfc620f8f062d416311d21af9f` |
| `test-results/smooth-home-i34/revision-61/unpainted-eyes/princess-fit.png` | 83081 | 83081 | `0b65c987423e3f77f37aa0fea3ae64c1958abe1064bbd4a67463db9935841886` | `0b65c987423e3f77f37aa0fea3ae64c1958abe1064bbd4a67463db9935841886` |
| `test-results/smooth-home-i34/revision-61/unpainted-eyes/princess-z4.png` | 118877 | 118877 | `4c5fb2f0e07ff41cc405a6a02cb138cc964732de2c66b30efeb288d234ec0491` | `4c5fb2f0e07ff41cc405a6a02cb138cc964732de2c66b30efeb288d234ec0491` |
| `test-results/smooth-home-i34/revision-61/browser-contours/construction-window-left-z4-dpr2.png` | 219906 | 219906 | `9106b6f7145be4ecaa5b5dd959ccbbb2ab9f0d246e33636950d2d7353bd0d41b` | `9106b6f7145be4ecaa5b5dd959ccbbb2ab9f0d246e33636950d2d7353bd0d41b` |
| `test-results/smooth-home-i34/revision-61/browser-contours/construction-window-right-z4-dpr2.png` | 225548 | 225548 | `899183b081965cea4c9599a71679b84bbb1434c15332185d1fc31f796a2857f0` | `899183b081965cea4c9599a71679b84bbb1434c15332185d1fc31f796a2857f0` |
| `test-results/smooth-home-i34/revision-61/browser-contours/evidence.json` | 2927 | 2927 | `56b9a667bb50594772042fa6b99dc0ded139099860eaae55a6e4ca6290b6ff87` | `56b9a667bb50594772042fa6b99dc0ded139099860eaae55a6e4ca6290b6ff87` |
| `test-results/smooth-home-i34/revision-61/browser-contours/flowers-stems-left-z4-dpr2.png` | 385067 | 385067 | `95662400c11e342895737a55697e59ec3d9c0641d7976e438db6db85f093a6b9` | `95662400c11e342895737a55697e59ec3d9c0641d7976e438db6db85f093a6b9` |
| `test-results/smooth-home-i34/revision-61/browser-contours/flowers-stems-right-z4-dpr2.png` | 389630 | 389630 | `1c04990ec3a124c6fc8c8363751d20244d8d2b2a209d1f5fd069fc58181b2079` | `1c04990ec3a124c6fc8c8363751d20244d8d2b2a209d1f5fd069fc58181b2079` |
| `test-results/smooth-home-i34/revision-61/browser-contours/magic-chin-z4-dpr2.png` | 591189 | 591189 | `034eae908020539a5586c9da32cf3255328a4dcab116fa544fbb2f551a32099b` | `034eae908020539a5586c9da32cf3255328a4dcab116fa544fbb2f551a32099b` |
| `test-results/smooth-home-i34/revision-61/browser-contours/princess-ear-cheek-z4-dpr2.png` | 671116 | 671116 | `c9bd318382ff0841a52620e59dc1701f63595bfa2b98af12a32c16a990e8e64b` | `c9bd318382ff0841a52620e59dc1701f63595bfa2b98af12a32c16a990e8e64b` |
| `test-results/smooth-home-i34/revision-61/browser-contours/robots-neck-z4-dpr2.png` | 331659 | 331659 | `c253c6d6735a31cdaa1ad8970864b1a63e0e07ec57e15d96e7ab1fc2c6d3316c` | `c253c6d6735a31cdaa1ad8970864b1a63e0e07ec57e15d96e7ab1fc2c6d3316c` |
| `test-results/smooth-home-i34/revision-61/browser-contours/vehicles-hood-z4-dpr2.png` | 139680 | 139680 | `d588b5c7e654fe249c544985a899bb52149b68b84e54272fa77638cf7f2bb577` | `d588b5c7e654fe249c544985a899bb52149b68b84e54272fa77638cf7f2bb577` |
| `test-results/smooth-home-i34/revision-61/browser-contours/vehicles-tyre-z4-dpr2.png` | 295499 | 295499 | `f3dac48d897d4f86e8c5168cef9c2e73b3b7b1c3f055380469fc4a729621f4ea` | `f3dac48d897d4f86e8c5168cef9c2e73b3b7b1c3f055380469fc4a729621f4ea` |
| `test-results/smooth-home-i34/revision-61/browser-image-index.json` | 26136 | 26136 | `9305734426ed80abe2b929d78d54c063b7c6f8241d1779cbd00c48c37f57311b` | `9305734426ed80abe2b929d78d54c063b7c6f8241d1779cbd00c48c37f57311b` |
| `test-results/smooth-home-i34/revision-61/identity-before.json` | 323511 | 323511 | `86eefbd161783cd9a08435fc684a6c91d93686e8221d1133942a3bb96120c30b` | `86eefbd161783cd9a08435fc684a6c91d93686e8221d1133942a3bb96120c30b` |
| `test-results/smooth-home-i34/revision-61/identity-after.json` | 323532 | 323532 | `6577e47b5b1a226ca216506a56a0117d7aceab05110ef086c2074d259359068d` | `6577e47b5b1a226ca216506a56a0117d7aceab05110ef086c2074d259359068d` |
| `test-results/smooth-home-i34/revision-61/browser/results.json` | 31619 | 31619 | `91c2f824d0a5caa127556d7c0e1cab4c966bfc95ade97d6859756cbfc3b59aa6` | `91c2f824d0a5caa127556d7c0e1cab4c966bfc95ade97d6859756cbfc3b59aa6` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |
| `docs/audits/revision-61-source-visual-20261013.md` | 48543 | 48543 | `a8d25f4f0c90b23f53ef318f62087c8b60b3b27b79427e43887f4b2d67038774` | `a8d25f4f0c90b23f53ef318f62087c8b60b3b27b79427e43887f4b2d67038774` |
| `apps/web/public/images/islands/animals-v1.webp` | 116844 | 116844 | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` |
| `content/smooth-finish-i34/derived/animals-registered.png` | 4086290 | 4086290 | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| `apps/web/public/images/islands/construction-v1.webp` | 120460 | 120460 | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` |
| `content/smooth-finish-i34/derived/construction-registered.png` | 2921595 | 2921595 | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` |
| `apps/web/public/images/islands/dinosaurs-v1.webp` | 112290 | 112290 | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` |
| `content/smooth-finish-i34/derived/dinosaurs-registered.png` | 3137029 | 3137029 | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |
| `apps/web/public/images/islands/flowers-v1.webp` | 115326 | 115326 | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` |
| `content/smooth-finish-i34/derived/flowers-registered.png` | 3312036 | 3312036 | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `apps/web/public/images/islands/ocean-v1.webp` | 117204 | 117204 | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` |
| `content/smooth-finish-i34/derived/ocean-registered.png` | 3201467 | 3201467 | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `apps/web/public/images/islands/robots-v1.webp` | 104158 | 104158 | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` |
| `content/smooth-finish-i34/derived/robots-registered.png` | 2654867 | 2654867 | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` |
| `apps/web/public/images/islands/space-v1.webp` | 101528 | 101528 | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` |
| `content/smooth-finish-i34/derived/space-registered.png` | 2917940 | 2917940 | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| `apps/web/public/images/islands/vehicles-v1.webp` | 100210 | 100210 | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` |
| `content/smooth-finish-i34/derived/vehicles-registered.png` | 2422677 | 2422677 | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `apps/web/src/components/ArtworkCanvas.tsx` | 18013 | 18013 | `3646223dd3d89ef9eadae9338f188bbd2844533915c2a2301c4c3e03015cba41` | `3646223dd3d89ef9eadae9338f188bbd2844533915c2a2301c4c3e03015cba41` |
| `tests/e2e/smooth-finish.spec.ts` | 13038 | 13038 | `b7a8a5db19de46c435fd4b3c6fde112da36ed6ccbf65bdba1aacebd2d9e35f2f` | `b7a8a5db19de46c435fd4b3c6fde112da36ed6ccbf65bdba1aacebd2d9e35f2f` |

候補61画面の確定判定はFAIL。既source限定PASSを上書きせず、今回見えたR61S-1を別原本に保存する。

