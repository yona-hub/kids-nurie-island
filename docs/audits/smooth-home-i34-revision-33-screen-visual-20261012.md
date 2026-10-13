# I34 revision 33 固定build画面・拡大・PNG 独立目視原本

- 判定: **FAIL**。通常表示の全体は成立しているが、人物の肌境界と複数テーマの材質境界が拡大時に階段状・折れた形として露出する。ホーム同等の最終仕上げ、および倍率を上げても粗い輪郭を増やさない条件を満たさない。
- 対象: revision 33 の提供済み固定build画像。source限定PASSを今回の画面判定へ転記していない。
- 独立確認者: `/root/i34_finish_visual`。単独、再委任なし、継承した主モデル/effortを維持。
- 作業ルート: `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。
- 限定レビュー開始: 2026-10-12T19:33:17.0639164+09:00。確認前hash: 2026-10-12T19:34:27.4456194+09:00。全表示後hash: 2026-10-12T19:45:47.4494963+09:00。30分の上限内。
- 固定build: `1a15263b71b2d03d2b4b3e441b78f85ca818178aef00bb1d4ca861861ba9d9db`。
- runtime source: `eda805867c572d40e172de809cec16bdb05cdfea981c640749243e1904c35794`。
- 本報告以外に書き込んでいない。旧PASS/FAIL・コード・素材・証拠画像は変更していない。

## 実際に開いた範囲

実ファイル名を先に列挙し、存在確認したものだけを表示した。指定されたPNG **66/66枚を実表示**した。全体は長辺820〜1000px以内の縮小表示、640×800以下のnative/Chrome画像は原寸のまま表示した。さらに主要輪郭と大きいPNG出力を、補間なしの原寸局所で確認した。画像の縮小・局所切出しは表示用のメモリ内処理だけで、別画像の保存・素材変更は行っていない。

以下の相対パスは `test-results/smooth-home-i34/revision-33/` を起点とする。

| 群 | 実表示した現物 | 枚数 |
| --- | --- | ---: |
| desktop編集/完成/実UI PNG | `smooth-desktop/{princess,magic,animals,ocean,dinosaurs,construction,robots,space,vehicles,flowers}/{editor,finish,actual-ui-export}.png` | 30 |
| mobile幅の編集画面 | `smooth-mobile/{dinosaurs,princess,vehicles,magic}/editor.png` | 4 |
| 利用者指摘配色の魔法 | `wizard-reproduction/face-z{1,2,4,2.65}.png` | 4 |
| Chrome倍率/DPR系列 | `browser-zoom/face-z{1,2,4,2.65}-dpr{1,2,3}.png` | 12 |
| 部分塗り/消去 | `browser-zoom/{partial,erased}.png` | 2 |
| 5色×20眼 | `native-zoom/eyes-5-colors.png`。全体に加え原寸の3分割で全100眼を表示 | 1 |
| native全10の4倍/DPR2 | `native-zoom/{全10テーマ}-z4-dpr2.png` | 10 |
| 姫の黒/青/白配色 | `native-zoom/princess-pigment-{000000,2598FF,FFFFFF}.png` | 3 |

desktop画面は1200×1000、mobile幅画面は780×1688、実UI出力は2048×2560。Chrome姫系列はDPR1:366×458、DPR2:732×916、DPR3:1098×1374。魔法系列は516×645。native4倍/DPR2は640×800。5色眼一覧は800×2400。ここでのmobileは提供されたブラウザー画面であり、実機確認を意味しない。

実ホームの `princess-v1.webp`、`magic-v1.webp` と `home-target.png` を今回も開いた。人物3のprivate登録参照は顔の原寸局所を開き、材質・陰影・顔への接続を比較した。参照の形状・色・構図の複製や白目量の一致は合格条件にしていない。private画像は分析だけに用い、公開・配布・保存コピーを行っていない。

## 不合格の根拠と最小不足

座標は別記しない限りworld 1600×2000の包含範囲。PNG出力の局所は出力ピクセル座標も併記した。原因の断定に代えて、現物で見えることと推測を分ける。

### S01: 人物の肌と隣接材質の境界 — FAIL / 主ブロッカー

**姫:** 右頬と髪の接点 `x812–834, y625–675` に短い直線・角・段差が連続する。4倍では目の下から頬へ、明るい肌の曲面が切り抜きの折れた縁につながって見える。耳と髪、額と髪の接点にも同種の角がある。広い肌・髪の陰影と眼球の曲線が滑らかなため、境界だけの粗さが目立つ。

- 現物: `browser-zoom/face-z4-dpr{1,2,3}.png`、2倍/2.65倍系列、`native-zoom/princess-z4-dpr2.png`。
- DPR3でも大きな折れと段差の位置が維持される。DPR1だけのドット粗さとは判断しない。
- 原寸の最小照合: `browser-zoom/face-z4-dpr3.png` の画像座標 `[930,630]–[1050,900]`。まつげと眼は同画像の `[390,420]–[1090,760]`。
- `smooth-desktop/princess/actual-ui-export.png` 原寸の `[1034,790]–[1085,880]` に同じ頬境界の折れが残る。顔全体局所 `[678,563]–[1107,966]` でも確認した。

**魔法:** 顎下 `x737–823, y777–790`（修正対象を含む周辺 `x730–835,y770–800`）の下縁に細い水平段と折れが残る。利用者指摘配色の黒い髪/襟と肌の組合せで明瞭になり、滑らかな顎の丸みより角張った切断面として読める。これは旧B01の点・縞の再発ではなく、残った肌境界の形の粗さである。

- 現物: `wizard-reproduction/face-z{2,2.65,4}.png`。4倍の画像座標 `[220,420]–[425,495]` を原寸で再表示した。
- `native-zoom/magic-z4-dpr2.png` と通常配色のPNGにも顎の同じ形がある。
- `smooth-desktop/magic/actual-ui-export.png` 原寸の `[930,985]–[1065,1025]`。顔局所 `[755,614]–[1184,1043]` でも確認した。

**判断:** 顔の形が参照と違うことを理由にしていない。現在の形の中で、滑らかな陰影と連続すべき境界が角張り、拡大時の輪郭品質を落としている。通常縮小表示で目立ちにくいことは、この4倍で見える不足を解消しない。

**最小修正:** 上記の肌/髪・肌/首の境界を連続する曲線と安定したcoverageで成立させる。眼の仕上げを変える必要をこの観測は示していない。境界を広くぼかして外側へ色を出す処理では、滑らかさと漏れ防止の両方を確認できない。修正後は同じ配色、倍率、DPRとPNG原寸で比較する必要がある。

### S02: 材質境界の階段状の縁 — FAIL / 拡大輪郭ブロッカー

顔以外にも、内部の色/材質境界に短い水平段が並ぶ。選択色が輪郭の外へ漏れた証拠とは別であり、`outsideContourPixels=0` と両立する見た目の不足である。

| 現物 | 実観測と位置 | 原寸照合 |
| --- | --- | --- |
| construction native4倍/DPR2 | 青い前窓の下辺が小さな水平段の連続になる。worldの修正対象包含範囲は概ね `x684–1086,y844–1129` の前窓下部。 | native `[150,350]–[640,475]`、UI PNG `[875,1080]–[1390,1445]` |
| robots native4倍/DPR2 | 首の濃青帯の上下縁と顔パネル境界が階段状。首付近world包含範囲 `x700–970,y818–865`。 | native `[300,625]–[640,755]`、UI PNG `[800,960]–[1380,1210]` |
| vehicles UI PNG / native4倍 | タイヤ前上辺の黒い隙間の縁が波状・角張った連続になる。旧残件 `x416–512,y1008–1043` を保持。窓/ボディ境界にも水平段が見える。 | UI PNG前タイヤ `[480,1200]–[730,1430]` |
| flowers native4倍/DPR2 / UI PNG | 茎・葉の濃淡境界と包装の接点で縁が角張る。world包含範囲 `x610–1040,y875–1242`。 | UI PNG `[780,1120]–[1330,1590]` |

この表は全テーマの全境界を列挙したものではなく、現物で再現した代表箇所である。vehiclesの旧「小さな波打ち」は、今回の実4倍/PNGでは粗い境界として識別できるため、拡大輪郭の残件S02へ含めた。旧source原本の分類を書き換えていない。

**最小修正:** 材質を分ける境界の粗い折れ・coverageを整え、明暗や素材感を保ったまま倍率で段を露出させない。全10テーマへ同じ問題がないか再確認が必要。広い素材を一律に平滑化したことだけでは、この境界の不足の解消は判断できない。

**原因について確認できた範囲:** 大きい段差の形がChromeの複数DPR、native、実UI PNGで共通して見えるため、単一スクリーンショットの低DPR表示だけでは説明できない。輪郭データ、マスクcoverage、元の陰影素材などの寄与は本目視では切り分けていない。「polygonが原因」「特定コードが原因」とは断定しない。上記は表示された境界の現象の記録である。

## 眼・口と旧残件の現在判定

| 項目 | 今回の現物による判断 |
| --- | --- |
| B03 人物の二重上弧/白目の台座感 | 提供画面で旧FAILの一定幅の淡い上帯は再現せず。側面/下側白目、虹彩と瞳孔、上瞼の接触影が読み分けられる。眼の局所としてPASS。顔全体はS01によりFAIL。 |
| B03 姫まつげ根元 `x828–842,y580–611` | 旧白い短冊状の切れは再現せず。原寸のDPR3とPNGで接続を確認。不要な独立まつげの新出は確認しない。隣接する肌/髪境界の段差を、この接続PASSで解消扱いにしていない。 |
| B01 魔法顎の点/縞、B02 宇宙顎の点/縞 | 点/縞は再発していない。魔法の顎の境界の段差は別のS01として残る。宇宙はnativeとPNG原寸顔でも確認した。 |
| B04 イルカ口 `x1020–1112,y595–693` | 暖色の口内が連続し、旧の白抜け/灰い枠の口は再現せず。PNG局所で確認。 |
| B05 魚口 `x568–620,y1255–1294` | 小さな口内/唇が連続し、旧の白抜けは再現せず。PNG局所で確認。 |
| B06〜08 ウサギ/犬/亀口 | 旧の白抜け・分断は再発せず。犬はnative4倍とPNG、ウサギ/亀はPNG原寸を実表示した。 |
| ウサギ/犬/亀の平坦な口縁 | 未解消。ウサギ `x1040–1121,y1404–1477`、犬 `x575–738,y1113–1236`、亀 `x706–821,y992–1068`。均一な灰/茶/緑の縁は拡大で平坦に見える。現画面では表情の読みや口内の連続を失わせる広い白抜け/漏れではなく、線による表情の表現として成立するため、これ単独を新たなブロッカーにはしない。縁の段差はS02と同じ拡大輪郭の確認対象として残す。 |
| ウサギ内耳の暗いL形の縁 | `x1253–1290,y1221–1322` を保持。PNG `[1590,1540]–[1690,1705]` 原寸で現存を確認。通常画面では耳の折れ/陰影の読みを壊さず、これ単独はブロッカーにしない。解消を主張しない。 |
| 恐竜の平坦な鼻孔と口奥 | 鼻孔 左 `x330–373,y479–541` / 右 `x440–494,y511–571`、口奥 `x598–710,y642–759` を保持。native4倍とPNG原寸で平坦さが残る。図案の表情としては成立し、形状複製を求めない基準の下ではこれ単独はブロッカーにしない。素材仕上げの改善余地は残る。歯と舌の間でシルエット外の白背景が見えることだけを漏れと判定していない。 |
| 部分塗り/消去 | `partial.png` は一部青色のドレープ、`erased.png` は当該部が白と黒の線へ戻る現物を確認。未塗り領域を色漏れと誤判定していない。 |
| 5色×20眼 / 黒青白配色 | 全100眼を原寸で確認し、白目と瞳孔の読みを保つ。提供3配色も実表示。これだけで全色・全装飾の美術合格は主張しない。白色素材が白背景へ同化することを色漏れとしていない。 |

通常のdesktop全10、mobile幅4種、完成全10、実UI出力全10の全体では、素材の立体感・色のまとまりと表情の読みは保たれる。しかし縮小表示だけでは見落とすS01/S02が実4倍とPNG原寸に残るため、最終品質の合格にはしない。

## 技術記録との区別

読み取った生記録は `browser/results.json`、`native-zoom/evidence.json`、`full-unit.json`、`identity-before.json`、`scope-check.json`、`browser-zoom/evidence.json`、`wizard-reproduction/evidence.json`。

- Chrome生結果: expected 24、unexpected 0、skipped 0、flaky 0、errors空。
- native生結果: 10テーマ各9枚、計90枚の記録があり、各 `outsideContourPixels` は0。今回目視したnative全テーマ画像は指定された4倍/DPR2の10枚で、残り80枚を目視合格にしていない。
- 眼検査生結果: 5色×20眼、100レコード。今回の一覧画像も全眼表示したが、数値検査だけで仕上げを合格にしていない。
- Unit生結果: success=true、449/449 passed、失敗0。今回の担当者はテストを再実行していない。
- identityのbuild/source aggregateは本報告冒頭の固定値に一致。scope-checkではmissing/unexpected空、Project/RegionPaint unchanged、privateSources published=false。
- lint/demo build完了は親の報告であり、この目視から独立した成功確認を追加していない。
- 検査結果が緑であることはS01/S02の美術合格を保証しない。

P05性能、実機、全色/全装飾、全倍率・全ブラウザー・全操作、人間の採用判断は別ゲートで、今回のPASS範囲に含まれない。性能測定、外部通信、素材生成、公開、モデル変更を行っていない。

## 確認前後SHA256

対象66 PNG、home比較3、private人物比較3、JSON7の計79ファイル。前後 **79/79同一**、サイズ変更0、欠落0。前後hashの同一性は現物の表示確認とは別に記録した。以下のパスは作業ルートからの相対表記。private行はハッシュ識別のためであり画像配布ではない。

| ファイル | bytes | 確認前SHA256 | 全表示後SHA256 |
| --- | ---: | --- | --- |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `content/smooth-finish-i34/derived/space-registered.png` | 2917940 | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/erased.png` | 96706 | `d5b827cca6fcb43c2b5f3ba594e57d16776be3752099274651814ab65d8201d5` | `d5b827cca6fcb43c2b5f3ba594e57d16776be3752099274651814ab65d8201d5` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/evidence.json` | 2655 | `1ff69588eb3260c81c480614578b8cb79668478e6e750a858e08f9b452d8638c` | `1ff69588eb3260c81c480614578b8cb79668478e6e750a858e08f9b452d8638c` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z1-dpr1.png` | 99009 | `771b273b5e41f02fa4ef886ca6a56b6614c59fb466092415bc9524c8d39ffd75` | `771b273b5e41f02fa4ef886ca6a56b6614c59fb466092415bc9524c8d39ffd75` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z1-dpr2.png` | 310220 | `ab51f1af34e362b2421b48237bd0087ce8e66e9d2c7542f2e66efc98c6abf89e` | `ab51f1af34e362b2421b48237bd0087ce8e66e9d2c7542f2e66efc98c6abf89e` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z1-dpr3.png` | 593286 | `860d3d5d77b480a082e3da1acfbf29c54d51bbd9c75b5d0529b85d5d53e74ed4` | `860d3d5d77b480a082e3da1acfbf29c54d51bbd9c75b5d0529b85d5d53e74ed4` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z2-dpr1.png` | 148403 | `d387adf0c76ddfb70203e6f0a63f424f80e8fe473d9ee138479d0b223c9489af` | `d387adf0c76ddfb70203e6f0a63f424f80e8fe473d9ee138479d0b223c9489af` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z2-dpr2.png` | 439438 | `3ef1417f244aa459133ca252b18af3f5ac0fc14168c5a19f43bec1c76cbce780` | `3ef1417f244aa459133ca252b18af3f5ac0fc14168c5a19f43bec1c76cbce780` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z2-dpr3.png` | 794818 | `6a16c7a662fa5081d47dea92e38bbb543ba268d06129d16f031ccab898331ac1` | `6a16c7a662fa5081d47dea92e38bbb543ba268d06129d16f031ccab898331ac1` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z2.65-dpr1.png` | 163673 | `9dcf388102a2cef7f4e06101ff093b1b766ce71e549f42418a421688ace27adc` | `9dcf388102a2cef7f4e06101ff093b1b766ce71e549f42418a421688ace27adc` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z2.65-dpr2.png` | 464552 | `cec56705ca4fcdef0479c4b19195dfa352ac4109c90fd04b56e37ad660bf9485` | `cec56705ca4fcdef0479c4b19195dfa352ac4109c90fd04b56e37ad660bf9485` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z2.65-dpr3.png` | 838127 | `939a1a19160425d6a8d4cf8ec4dcaad05bcf25c24650de745db671b3cb203b56` | `939a1a19160425d6a8d4cf8ec4dcaad05bcf25c24650de745db671b3cb203b56` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z4-dpr1.png` | 149788 | `a1b2114bcf189c6e1de196d1634b0a5304d2c6b6cff12d20d5ba1306c84ef823` | `a1b2114bcf189c6e1de196d1634b0a5304d2c6b6cff12d20d5ba1306c84ef823` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z4-dpr2.png` | 407108 | `faa209c30c3ca045d01ff6efd195323ac7d6e5988c1177ebc2ea5a4baf3d9c46` | `faa209c30c3ca045d01ff6efd195323ac7d6e5988c1177ebc2ea5a4baf3d9c46` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/face-z4-dpr3.png` | 730460 | `97d3982dcc979b004fa5a14be226a298aff675b26acd20be0047c2be7cc4270d` | `97d3982dcc979b004fa5a14be226a298aff675b26acd20be0047c2be7cc4270d` |
| `test-results/smooth-home-i34/revision-33/browser-zoom/partial.png` | 99369 | `1b36087868b56aa08653483538431aea698534d005e64a61b7a19725e5ec5826` | `1b36087868b56aa08653483538431aea698534d005e64a61b7a19725e5ec5826` |
| `test-results/smooth-home-i34/revision-33/browser/results.json` | 29394 | `0ceb76cfb06e7259044da78a7747c5c1091b78c5839bca1f960bfe82d9be281f` | `0ceb76cfb06e7259044da78a7747c5c1091b78c5839bca1f960bfe82d9be281f` |
| `test-results/smooth-home-i34/revision-33/full-unit.json` | 197628 | `e55be6628d7f903c40d7b07ffdca41174feb267c5c16c28993e363684b4d3930` | `e55be6628d7f903c40d7b07ffdca41174feb267c5c16c28993e363684b4d3930` |
| `test-results/smooth-home-i34/revision-33/identity-before.json` | 302181 | `fc7cd3d4fc721f9737d63efa195893965d0cdee4ed4f1a92384f01b7cd2889bb` | `fc7cd3d4fc721f9737d63efa195893965d0cdee4ed4f1a92384f01b7cd2889bb` |
| `test-results/smooth-home-i34/revision-33/native-zoom/animals-z4-dpr2.png` | 389560 | `6b20fe760e9f774bc97cc8e4a1fe2af20569a5875060be6ea1717cbbed40d489` | `6b20fe760e9f774bc97cc8e4a1fe2af20569a5875060be6ea1717cbbed40d489` |
| `test-results/smooth-home-i34/revision-33/native-zoom/construction-z4-dpr2.png` | 225036 | `f9ba81e0e476e285cd8ef29080af0ccb0e97141392a35b46286ad0a1fc844295` | `f9ba81e0e476e285cd8ef29080af0ccb0e97141392a35b46286ad0a1fc844295` |
| `test-results/smooth-home-i34/revision-33/native-zoom/dinosaurs-z4-dpr2.png` | 233118 | `9a7362814f89fac79435b1c9775c4381fd854ff6dedb23f2221328879ac0e77d` | `9a7362814f89fac79435b1c9775c4381fd854ff6dedb23f2221328879ac0e77d` |
| `test-results/smooth-home-i34/revision-33/native-zoom/evidence.json` | 46989 | `d7f29c896d75bdb14c29e12c6e974217b199783bf267dbfae8fe289ddd7908b2` | `d7f29c896d75bdb14c29e12c6e974217b199783bf267dbfae8fe289ddd7908b2` |
| `test-results/smooth-home-i34/revision-33/native-zoom/eyes-5-colors.png` | 916103 | `308915f8be53503099e7c48bfeac2545177c9980a1f299505e4b4719de17bb81` | `308915f8be53503099e7c48bfeac2545177c9980a1f299505e4b4719de17bb81` |
| `test-results/smooth-home-i34/revision-33/native-zoom/flowers-z4-dpr2.png` | 301888 | `38af825cb668725a354e267c39ca18ac87fc12804c59a07fbe969c47b5737a8e` | `38af825cb668725a354e267c39ca18ac87fc12804c59a07fbe969c47b5737a8e` |
| `test-results/smooth-home-i34/revision-33/native-zoom/magic-z4-dpr2.png` | 396848 | `2312246654e673cbc0c4c725eaea0195d77b5e2bd76adde8c32049642a876067` | `2312246654e673cbc0c4c725eaea0195d77b5e2bd76adde8c32049642a876067` |
| `test-results/smooth-home-i34/revision-33/native-zoom/ocean-z4-dpr2.png` | 248102 | `d839d43f530fae192adee5cbba29ef817a57a170c0e2a4a49c44b16e30b32167` | `d839d43f530fae192adee5cbba29ef817a57a170c0e2a4a49c44b16e30b32167` |
| `test-results/smooth-home-i34/revision-33/native-zoom/princess-pigment-000000.png` | 196517 | `550d59f2c864300d31dd4dbca1b1ba33e9dafa62e464b4fd336c2ee56b133ab4` | `550d59f2c864300d31dd4dbca1b1ba33e9dafa62e464b4fd336c2ee56b133ab4` |
| `test-results/smooth-home-i34/revision-33/native-zoom/princess-pigment-2598FF.png` | 290574 | `50febc317c2f8ea154b09cf0c7739d1110afe122bcd931b4828019cf1f898596` | `50febc317c2f8ea154b09cf0c7739d1110afe122bcd931b4828019cf1f898596` |
| `test-results/smooth-home-i34/revision-33/native-zoom/princess-pigment-FFFFFF.png` | 205711 | `0422b332e6bdc3d3b52c368b718ce302c31642319901c757be0ddc9804d3974c` | `0422b332e6bdc3d3b52c368b718ce302c31642319901c757be0ddc9804d3974c` |
| `test-results/smooth-home-i34/revision-33/native-zoom/princess-z4-dpr2.png` | 384291 | `828c6f9b6d5398bf6dce54edd4a956ef4fa5584f20d4462d3f4da249cc413d55` | `828c6f9b6d5398bf6dce54edd4a956ef4fa5584f20d4462d3f4da249cc413d55` |
| `test-results/smooth-home-i34/revision-33/native-zoom/robots-z4-dpr2.png` | 252585 | `de5181fbc982377248a9835b2be78d576c9f6777f93e75112ec3a89378450914` | `de5181fbc982377248a9835b2be78d576c9f6777f93e75112ec3a89378450914` |
| `test-results/smooth-home-i34/revision-33/native-zoom/space-z4-dpr2.png` | 302212 | `f5b9e350ff73c79f7697295fb8a377e6b775d968b36fe12ba8bdb1ef644975d1` | `f5b9e350ff73c79f7697295fb8a377e6b775d968b36fe12ba8bdb1ef644975d1` |
| `test-results/smooth-home-i34/revision-33/native-zoom/vehicles-z4-dpr2.png` | 235696 | `08d16f4b3a8cd97563f1b380ddf7f1cb4f29a4429df9dac8aaa4583b03011a3f` | `08d16f4b3a8cd97563f1b380ddf7f1cb4f29a4429df9dac8aaa4583b03011a3f` |
| `test-results/smooth-home-i34/revision-33/scope-check.json` | 218417 | `6f0ac57734873dde878eba426a39bd0afa0f0ee08d1f1c5ad650d363f784fafb` | `6f0ac57734873dde878eba426a39bd0afa0f0ee08d1f1c5ad650d363f784fafb` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/animals/actual-ui-export.png` | 2979188 | `b9ffb96b9bd26f4569e08d3526774607c4985136fe31beb0adf8965b8dcb31cd` | `b9ffb96b9bd26f4569e08d3526774607c4985136fe31beb0adf8965b8dcb31cd` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/animals/editor.png` | 534635 | `296bc976b0eb29b5a9ee8942ff8aa5ce2b64d36b5945bbec712525ce57e84172` | `296bc976b0eb29b5a9ee8942ff8aa5ce2b64d36b5945bbec712525ce57e84172` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/animals/finish.png` | 440956 | `3fb36486fc734ce208ad95cadcc17a245528e197ea28693806537edf56966172` | `3fb36486fc734ce208ad95cadcc17a245528e197ea28693806537edf56966172` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/construction/actual-ui-export.png` | 1681549 | `11ce7f1e8eaaf5322c78f618f5a2dd54e697c6e398062cc535b4f2daaf623ec8` | `11ce7f1e8eaaf5322c78f618f5a2dd54e697c6e398062cc535b4f2daaf623ec8` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/construction/editor.png` | 451774 | `68eeef5443e4ed9b184eac3cb7575fdc5f805e32ce447edb234f5c7919b0017d` | `68eeef5443e4ed9b184eac3cb7575fdc5f805e32ce447edb234f5c7919b0017d` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/construction/finish.png` | 342160 | `1686272c94b3c9a9b4510bfb0f2765c9dd2d7d128f7419daa7d4065b51f8d1ca` | `1686272c94b3c9a9b4510bfb0f2765c9dd2d7d128f7419daa7d4065b51f8d1ca` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/dinosaurs/actual-ui-export.png` | 1807438 | `6247c6b64f2964f0fe2b67b9eaca9a94730f8c7ce7dde984d8514410af7e8dfe` | `6247c6b64f2964f0fe2b67b9eaca9a94730f8c7ce7dde984d8514410af7e8dfe` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/dinosaurs/editor.png` | 453179 | `254cd77fa6d13247fd297e8c9366b7835c317dd9066c5a4024a464be56908e94` | `254cd77fa6d13247fd297e8c9366b7835c317dd9066c5a4024a464be56908e94` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/dinosaurs/finish.png` | 344933 | `d27e5acbdaac5a1bcaef2fec4bacb755fc8aff303e8a927d80476faf106f95a7` | `d27e5acbdaac5a1bcaef2fec4bacb755fc8aff303e8a927d80476faf106f95a7` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/flowers/actual-ui-export.png` | 2075168 | `f3f446d00e3b6a45be3e51aa3f89cdabe6c6c51476b854a41e438b123c6b925e` | `f3f446d00e3b6a45be3e51aa3f89cdabe6c6c51476b854a41e438b123c6b925e` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/flowers/editor.png` | 473438 | `ab0b231d6a685ad0e078f90fd450d77dc8d133cdd96af749a0b1001714fb6305` | `ab0b231d6a685ad0e078f90fd450d77dc8d133cdd96af749a0b1001714fb6305` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/flowers/finish.png` | 368551 | `c99ba579842954bc60025a703e8537ab80e9e36a354a7b5b3978b1bdf6a6ea3d` | `c99ba579842954bc60025a703e8537ab80e9e36a354a7b5b3978b1bdf6a6ea3d` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/magic/actual-ui-export.png` | 2463263 | `47bab72f1c9a321346a2777b764d9a26dd82e96d789eb73a7d896fa0bafadc22` | `47bab72f1c9a321346a2777b764d9a26dd82e96d789eb73a7d896fa0bafadc22` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/magic/editor.png` | 489246 | `775b1cf4e223eabd7a00c2d24fe04a597402e9023987ea695f7d7fc53f268340` | `775b1cf4e223eabd7a00c2d24fe04a597402e9023987ea695f7d7fc53f268340` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/magic/finish.png` | 388336 | `3655616c6d244a151ade32e7e8d6870463d0cd14a6722a1cd06b4aebd72443ed` | `3655616c6d244a151ade32e7e8d6870463d0cd14a6722a1cd06b4aebd72443ed` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/ocean/actual-ui-export.png` | 2078427 | `f6506aca79bfda15dc8ad713db56b91c86863ebeaf47a8b7db8f127cb5fba682` | `f6506aca79bfda15dc8ad713db56b91c86863ebeaf47a8b7db8f127cb5fba682` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/ocean/editor.png` | 475054 | `159a4f692ce8aae7dc09364e3b4788ab37127dbb5414dc6848a85ba51e7d72fc` | `159a4f692ce8aae7dc09364e3b4788ab37127dbb5414dc6848a85ba51e7d72fc` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/ocean/finish.png` | 369460 | `b5dba36e2c2b4ad605e5fad48fd58d5f5fb249a81c6e1a4a2b4f9a4f50856626` | `b5dba36e2c2b4ad605e5fad48fd58d5f5fb249a81c6e1a4a2b4f9a4f50856626` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/princess/actual-ui-export.png` | 2164098 | `b209d3f182111213db01f549ac9023520aac1b81fc51be47f4cf6f2d09783c3a` | `b209d3f182111213db01f549ac9023520aac1b81fc51be47f4cf6f2d09783c3a` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/princess/editor.png` | 479240 | `2186ccf6051162ff7788c85ea7b584ac47c69986a9a48012a68390ca2447a9a1` | `2186ccf6051162ff7788c85ea7b584ac47c69986a9a48012a68390ca2447a9a1` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/princess/finish.png` | 375679 | `d7b877da534938d291fa225893f46b3f96b9f446850fdb7859f449ae92975d9e` | `d7b877da534938d291fa225893f46b3f96b9f446850fdb7859f449ae92975d9e` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/robots/actual-ui-export.png` | 1416867 | `e533e8e3be73f04e333127d813f5622254d6e878c24bf74fbac2ac391fedf68f` | `e533e8e3be73f04e333127d813f5622254d6e878c24bf74fbac2ac391fedf68f` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/robots/editor.png` | 421723 | `0c2c187d9eb747499da1b04c922bf3a9010aa9229a4ac3e1e249be5811594d49` | `0c2c187d9eb747499da1b04c922bf3a9010aa9229a4ac3e1e249be5811594d49` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/robots/finish.png` | 307411 | `12391f22b05a1653f78b29e44489c3adf5af529905073dff0a82f60445044a6d` | `12391f22b05a1653f78b29e44489c3adf5af529905073dff0a82f60445044a6d` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/space/actual-ui-export.png` | 1632458 | `835dd83c3cdfac669dcdbc2b39f6d915335453c11fc6235655dd30a775b988a4` | `835dd83c3cdfac669dcdbc2b39f6d915335453c11fc6235655dd30a775b988a4` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/space/editor.png` | 449924 | `2e3588e7120d41fc4c6723c11c2a5af0b6d22e5d8ef453bdd620236dfa9c063e` | `2e3588e7120d41fc4c6723c11c2a5af0b6d22e5d8ef453bdd620236dfa9c063e` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/space/finish.png` | 339966 | `ae023dc6896d4d1510037993238915ed036d74ef5ba4ef78326a20c0686f75f9` | `ae023dc6896d4d1510037993238915ed036d74ef5ba4ef78326a20c0686f75f9` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/vehicles/actual-ui-export.png` | 1136133 | `89eec8f8dec9d0e071d10994be057240a99ec05d3bbe2f64bef9a700a079bf1b` | `89eec8f8dec9d0e071d10994be057240a99ec05d3bbe2f64bef9a700a079bf1b` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/vehicles/editor.png` | 403843 | `ff308017fce262193fe81394146f505208bbf5087f979a7dfcd989501c26577d` | `ff308017fce262193fe81394146f505208bbf5087f979a7dfcd989501c26577d` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/vehicles/finish.png` | 285794 | `3d47242dc866ffc82caa15846d6e60940ca614a1cd1e93f190b048c27f288e3d` | `3d47242dc866ffc82caa15846d6e60940ca614a1cd1e93f190b048c27f288e3d` |
| `test-results/smooth-home-i34/revision-33/smooth-mobile/dinosaurs/editor.png` | 580262 | `8e69d5fced367723e588c3a4b29c6c9dc2f42de3303c52ffd63ccc902d3a8a91` | `8e69d5fced367723e588c3a4b29c6c9dc2f42de3303c52ffd63ccc902d3a8a91` |
| `test-results/smooth-home-i34/revision-33/smooth-mobile/magic/editor.png` | 645409 | `c53241ceb3cf559936534cc25e2dd2be656024d26aa5724a99a652b4ebdb2677` | `c53241ceb3cf559936534cc25e2dd2be656024d26aa5724a99a652b4ebdb2677` |
| `test-results/smooth-home-i34/revision-33/smooth-mobile/princess/editor.png` | 617079 | `7c83d50b7353dc335bec799bd5fe1011f99007cd3d3382734988cfeac408ac4b` | `7c83d50b7353dc335bec799bd5fe1011f99007cd3d3382734988cfeac408ac4b` |
| `test-results/smooth-home-i34/revision-33/smooth-mobile/vehicles/editor.png` | 493792 | `65fabdf003cb6fbb40c020841d2cef34c81f3b8a7d0b9e592aefec0e926cbe37` | `65fabdf003cb6fbb40c020841d2cef34c81f3b8a7d0b9e592aefec0e926cbe37` |
| `test-results/smooth-home-i34/revision-33/wizard-reproduction/evidence.json` | 4107 | `8aa05b814580f5d361e57a1e3c11955564726513d8b5b5e0de1f85ca40ca41c4` | `8aa05b814580f5d361e57a1e3c11955564726513d8b5b5e0de1f85ca40ca41c4` |
| `test-results/smooth-home-i34/revision-33/wizard-reproduction/face-z1.png` | 177318 | `aca14e7699f51f3fb861ae35c45a24d6831134d03f0495b61ebf08bae8a11301` | `aca14e7699f51f3fb861ae35c45a24d6831134d03f0495b61ebf08bae8a11301` |
| `test-results/smooth-home-i34/revision-33/wizard-reproduction/face-z2.65.png` | 257701 | `a97a57c0cf8d24f9c8d0771cabf348fcd6e77f942d098a6e4d64b830896c96bb` | `a97a57c0cf8d24f9c8d0771cabf348fcd6e77f942d098a6e4d64b830896c96bb` |
| `test-results/smooth-home-i34/revision-33/wizard-reproduction/face-z2.png` | 269365 | `10c2dd26531fe4a155706a54fa52815ec82f0e81b7a4ddd7b974ace159649320` | `10c2dd26531fe4a155706a54fa52815ec82f0e81b7a4ddd7b974ace159649320` |
| `test-results/smooth-home-i34/revision-33/wizard-reproduction/face-z4.png` | 215450 | `466ca1aa3666d3e301d21368b355e0806e3c588271486e8421790045fc6b4d10` | `466ca1aa3666d3e301d21368b355e0806e3c588271486e8421790045fc6b4d10` |

## 先行原本の保持確認

以下は今回の終了時に読み取り確認したハッシュで、先行確認時の原本値と一致した。これらへ追記・修正していない。source限定PASSは原本のまま保持され、今回の固定build画面/拡大/PNGのFAILは本原本に記録する。

| 原本 | 保持されたSHA256 |
| --- | --- |
| `docs/audits/smooth-home-i34-revision-28-source-visual-20261012.md` | `971561eb670a67a75f434f7b2f526125dad967da5387baf6dd5b50cc234ba591` |
| `docs/audits/smooth-home-i34-revision-29-eyes-visual-20261012.md` | `bd1260d93fd0182d39b0b3bde519b99d9f43a768170af30408ca1ef019ae609c` |
| `docs/audits/smooth-home-i34-revision-31-source-visual-20261012.md` | `ca78394b48d999891573395a305012ae98597fc78e10961e282941a2742d35f9` |
| `docs/audits/smooth-home-i34-revision-32-source-visual-20261012.md` | `adf662a1fee7f95fc1bbd5051e713d08740504ba81a11e4aa6aa35839aa2729d` |
| `docs/audits/smooth-home-i34-revision-33-prototype-visual-20261012.md` | `62b7b3b10943202dcdbd39794ef1fc31da3ee43cc6518b39d75fa1ee65fd00ba` |
| `docs/audits/smooth-home-i34-revision-33-source-visual-20261012.md` | `7f7fb58d8b28e875a6a367c3d2de4387867b36928cf7f6a6f3f70e2d7e66803b` |

