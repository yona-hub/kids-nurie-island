# I34 候補51：全10テーマ source/art 独立目視原本

判定：**FAIL（source/art）**。全10テーマの表情・材質・主要境界を実表示した。人物のR47-1微小片、建機前窓の粗い縁は改善している。一方、ロボットの首と車のタイヤ上辺には旧S02に対応する角・短い段・波打つ境界がsource原寸でも残る。車体には途中だけ現れる短い暗色線もあり、ホーム同等の最終仕上げの完了とは認めない。

**別ゲート：flowers native輪郭外19px FAILは保持。** これは親から提供された検査失敗であり、このsource目視の所見でPASSへ変更しない。今回、nativeの生記録読取り・再測定はしていない。source/artの不合格根拠と数値の外周検査を分ける。

## 範囲・方法・固定

- 独立確認者：`/root/i34_finish_visual`。単独、孫agentなし、継承した主モデル/effortを変更していない。
- 開始：2026-10-12 21:38:06 JST。
- 確認前hash：2026-10-12T21:39:17.5509993+09:00。
- 実表示完了後hash：2026-10-12T21:52:01.6901721+09:00。
- 確認した証拠55ファイルはすべて前後SHA256・byte数一致。対象source10枚の同一性も個別に記録した。
- source10枚は実ファイル寸法1600×2000。全体を最大辺1000pxに縮小して表示し、主要部位を元画素の原寸局所で確認した。
- smooth10枚は320×400のfit画像で、原画素のまま全体表示した。
- detailは6枚だけ実在した。`princess` 860×860、`magic` 760×800、`construction` 860×640、`robots` 620×180、`vehicles` 300×180、`flowers` 900×840。全6枚を原画素表示した。これらは**sourceの拡大crop**であり、独立した直接2倍レンダーやnative/Chrome拡大の証拠にしていない。
- 一部局所をsourceからnearestで2倍にして解析表示した。元画素を見やすくする補助だけで、倍率を変えた実レンダーの品質を主張しない。

部分塗り、消去後、native全90、実Chrome、実機、全色/全装飾、人間採用は未確認・今回の範囲外。P05性能STOPを維持し、性能測定をしていない。実装・素材・証拠画像・旧原本は編集せず、本原本だけを追加した。他人の編集を戻していない。外部通信・画像生成・公開・モデル変更を行っていない。

### evidenceの実際の範囲

`after/evidence.json` は10テーマのtemplate/geometry hash、palette、blank/smooth/crayon/pencilのstateを記録している。smooth stateのPNG hashは、今回の320×400 `*-smooth.png` と**10/10一致**した。

ただし、今回読み取ったファイルには1600×2000 `*-source.png` のhash項目やsource stateはなかった。依頼中の「sourceはevidence.jsonでsha固定」という説明を、現JSONが示す範囲へ補っていない。source10枚は本監査の前後SHA256で別に固定し、末尾の表で識別する。これは証拠範囲の記録であり、美術FAILの理由は下記の現物で見える境界である。

`comparison.json` は10件のgeometryUnchanged=true、新smooth変更10件。`legacy-comparison.json` は10件・40stateのunchanged=trueだった。これらの記録で絵の仕上げをPASSにしていない。blank/crayon/pencilの現画像は今回表示していない。

## 実表示した全10テーマと原寸局所

以下のsource/smooth/detail相対パスは `test-results/smooth-home-i34/revision-51/after/` を起点とする。座標はすべてsourceのworld 1600×2000、`[left,top,right,bottom]`。

| テーマ | 実表示ファイル | 原寸sourceで追加表示した主な範囲 |
|---|---|---|
| princess | `princess-source.png` / `princess-smooth.png` / `princess-detail.png` | 顔 `[490,430,920,860]`、耳上 `[510,510,550,540]`、右頬下 `[805,650,850,720]`、ウサギ顔/耳 `[970,1190,1335,1510]` |
| magic | `magic-source.png` / `magic-smooth.png` / `magic-detail.png` | 顔/顎/襟 `[565,465,945,865]` |
| space | `space-source.png` / `space-smooth.png` | 顔/眼/顎/ヘルメット `[830,740,1250,1130]` |
| construction | `construction-source.png` / `construction-smooth.png` / `construction-detail.png` | 前窓/車体接続 `[670,800,1110,1160]` |
| robots | `robots-source.png` / `robots-smooth.png` / `robots-detail.png` | 首 `[660,790,1040,890]`、帯 `[700,812,982,870]`、左右端 `[680,805,780,880]` / `[920,805,1010,880]` |
| vehicles | `vehicles-source.png` / `vehicles-smooth.png` / `vehicles-detail.png` | タイヤ上辺 `[390,980,545,1080]`、車体 `[420,780,1420,1445]`、短い線 `[900,1070,1040,1135]` / `[1140,1140,1290,1240]` |
| flowers | `flowers-source.png` / `flowers-smooth.png` / `flowers-detail.png` | 茎/葉/包装 `[580,850,1050,1270]`、包装接点 `[770,1070,900,1190]` |
| animals | `animals-source.png` / `animals-smooth.png` | 犬/猫の顔/口/毛 `[280,890,1250,1410]` |
| ocean | `ocean-source.png` / `ocean-smooth.png` | イルカ口 `[960,535,1150,735]`、魚口 `[475,1135,645,1335]`、亀口 `[645,870,920,1110]` |
| dinosaurs | `dinosaurs-source.png` / `dinosaurs-smooth.png` | 顔/鼻孔/口/首 `[260,220,990,900]` |

現対象26 PNGを全て表示した。実在しない4テーマのdetailを推定で補っていない。

比較では、実homeの10テーマ `*-v1.webp`、construction v2の960素材、`home-target.png` を全体表示した。private登録原画10枚も全体表示し、construction窓・robots首・vehiclesタイヤ/車体・flowers茎/包装は同じworld局所を原寸表示した。材質の厚み、陰影の連続、表情、境界の滑らかさを比較し、形状・選択色・構図の複製は条件にしていない。construction v1/v2の現在の参照元指定をコードで検証したとは主張しない。

旧47 FAIL原本と33 screen FAIL原本を読み、47の姫source/detailの同座標も表示した。47の直接2倍detailと51のsource拡大cropが異なる証拠であることを保ち、R47-1は同じ原寸source密度でも比較した。

privateは分析表示だけに使用した。報告埋め込み、公開、配布用複写をしていない。表示の縮小/局所切出しはメモリ内だけで、派生画像ファイルは作っていない。

## 不合格根拠と最小不足

### R51-1：robots首の濃色帯 — 旧S02が残る

world **x700–970,y818–865**。首の濃い青色帯の上下縁に、短い水平段・小さな角・端の折れが残る。原寸 `[700,812,982,870]` で見えており、detailの拡大で新たに生じた粗さだけを数えていない。

首のハイライトは円柱の丸みとして連続するのに、上縁の左端は角張り、中央から右へ低い段が並ぶ。下縁も滑らかな円柱の縁より、短い段をつないだ切断面として見える。homeの金属/樹脂の曲面、private同部の連続した縁と比較して、現在の首の内部で境界だけの粗さが残る。

形状を参照通りにすることが不足ではない。現在の首の形を、同じ陰影の丸みに連続する縁として仕上げることが不足。

**最小不足**：首帯の上下と左右端を連続する曲線/coverageで成立させ、金属の反射と接触影を保つこと。大きい領域を平坦化したり広くぼかしたりするだけでは、この局所の形の粗さの解消を示さない。原因は本目視では未特定。

### R51-2：vehiclesタイヤ上辺と車体の短い暗色線

- **タイヤ上辺：world x416–512,y1008–1043。** 黒いタイヤ/車体間の上辺が波打ち、丸いアーチの途中に角と短い直線が残る。原寸 `[390,980,545,1080]` で再確認した。旧33 S02で記録された位置の不足を、現在sourceの現物でも認める。タイヤの模様自体と、材質を分ける上縁を区別した。
- **ボンネット下辺：概ね x950–1004,y1100–1106。** 明るい曲線状の帯の途中にだけ、短い細い暗色線が出る。原寸 `[900,1070,1040,1135]` で認め、source解析2倍でも位置を照合した。輪郭/接触影として周囲へ自然につながらず、切れた線として見える。
- **バンパー上帯：概ね x1210–1245,y1180–1192。** 赤い面に斜めの非常に細い暗色断片が残る。原寸 `[1140,1140,1290,1240]` で確認した。ボンネット同様、車体の曲面と独立して浮く小さな線として記録する。

source原寸の車体 `[420,780,1420,1445]` とprivate同範囲、実homeを比較した。現在も車体のハイライトや丸みは保たれるが、アーチの粗い縁と孤立線が、滑らかな面のつながりを弱める。参照と同じ線色やパネル構造を要求しているのではない。

**最小不足**：タイヤ上辺を連続するアーチとして仕上げ、短い暗色断片を残さず、必要なパネル境界なら曲面に沿った連続する接触影へつなぐこと。単に短い断片を太くしたり、車体全体を一律にぼかしたりする必要を本観測は示さない。どの素材/geometry/合成が原因かは未特定。

以上の2項目によりsource/art全体をFAILとした。flowersの外周検査19pxをsource/art FAILの代用根拠にしていない。

## 改善・旧残件・テーマ別の現在所見

| 項目/テーマ | 今回のsource現物による所見 |
|---|---|
| R47-1 姫耳上 x522–546,y519–526 | 原寸sourceと同じsource密度での解析2倍比較では、47にあった淡色の短い断片2つを認めなくなった。**source範囲で改善確認**。51の独立2倍実レンダーPASSは主張しない。 |
| R47-1 姫右頬下 x814–818,y674–678 | 47に残った明るい小片を現在sourceでは認めない。髪の長い毛流れ・暗部の階調は保たれる。**source範囲で改善確認**。 |
| 33 S01 姫右頬 x812–834,y625–675 | 旧の太い茶色帯/大きな階段状の縁の再出現を、今回の原寸顔では認めない。耳→左顎の短い形状の折れは保持されるが、形状差だけを独立した追加FAILにはしない。4倍実画面の判定は未確認。 |
| 33 S01 魔法顎 x737–823,y777–790 | 顎から首への縁は現在sourceで連続して見え、旧の点/縞と大きい階段帯の再発は認めない。 |
| princess | 肌、毛流れ、衣装の階調はつながる。瞼/虹彩/白目の旧B03、まつげ根元 x828–842,y580–611 の白い短冊穴や不要な独立まつげは再発していない。ウサギの口は白抜けなく連続する。 |
| magic | 顔/眼/口/襟のつながりは保たれる。均一な白い上帯・灰色の二重枠の再発は認めない。首の陰影も連続する。今回原寸範囲で独立した追加ブロッカーなし。 |
| space | 顔、眼、髪、顎、ヘルメットと宇宙服の階調を確認。旧B02顎点/縞、旧B03の二重帯を認めない。今回原寸範囲で独立した追加ブロッカーなし。 |
| construction | 前窓下辺 world x684–1086,y844–1129 の旧S02は、現在原寸sourceでは連続した曲線へ明確に改善。窓の反射、車体・履帯・金属の丸みは保たれる。4倍実画面へ解消判定を拡張しない。 |
| robots | 目/口の表情、胴体の反射、関節の丸みは保たれる。首のR51-1が残るため、source最終品質は未達。 |
| vehicles | 窓/ライト/車体の立体感は保たれるが、R51-2の粗いアーチと暗色線断片が残る。source最終品質は未達。 |
| flowers | 花弁/葉/リボン/包装の素材感は保たれる。原寸 world x610–1040,y875–1242 の茎/葉/包装を確認。広い旧階段帯だけが強く露出するとは認めないが、概ね x807–839,y1130–1149 に丸い緑の茎終端が包装紙の斜めの折り目へ突き出す形は残る。重なり/終端の観察残件として保持し、参照との形状差だけで独立した追加FAILには数えない。4倍でのS02判定は未確認。native19px輪郭外FAILは別に継続。 |
| animals | 犬/猫の顔、毛、目、口内を原寸表示。犬口の旧白抜け/分断は再発していない。口縁の均一な灰/茶の表現は残るが、表情・口内の連続は保つ。今回それ単独を新たなブロッカーへ変更しない。 |
| ocean | イルカ・魚・亀の旧B04/B05/B08口元白抜けは再発していない。口内/舌の色が連続し、イルカの光、甲羅、魚の材質も保たれる。亀の均一な口縁は残るが、それ単独で追加FAILとはしない。 |
| dinosaurs | 鼻孔/口奥の平坦な表現は残る。歯・舌・口内・肌の連続を確認し、現在の図案の表情を壊す新しい白抜けは認めない。旧原本同様、平坦な鼻孔/口奥だけを追加ブロッカーへ変更しない。 |
| 旧非ブロッカー | ウサギ口縁の均一な灰色表現、内耳の暗いL形の縁 x1253–1290,y1221–1322、犬/亀口縁、恐竜鼻孔/口奥は解消と主張しない。今回表示では表情の読みや口内を失わせる広い漏れではなく、それだけで追加FAILに分類変更しない。ホーム同等の全体完了はR51-1/2で未達。 |

## 判定の限界

全10のsource、fit、存在するdetail、主要原寸局所を見た美術判断である。原寸sourceで不足が見えるため、source/artはFAIL。一方、原寸で改善が見えた部位を、実4倍・異なるDPR・実Chrome/native・部分塗り/消去後の成功に読み替えていない。

flowersの輪郭外19pxという検査失敗は保持し、source目視で外周0を主張しない。全10の外周数値再測定、全90画像、現行buildの合格、性能、人間採用を補っていない。33 screen FAIL/47 prototype FAIL原本もその対象版の判断としてそのまま保持した。

## 確認前後SHA256・bytes

現対象26 PNG、JSON3、旧原文2、旧47比較PNG2、home比較12、private比較10、計55ファイル。全対象で前後SHA256一致、byte数変更0。privateはパス/hashの識別だけであり、画像配布ではない。

| ファイル（project相対） | bytes | 確認前 SHA256 | 確認後 SHA256 |
|---|---:|---|---|
| `test-results/smooth-home-i34/revision-51/after/princess-source.png` | 1064546 | `00f254c149b02b684d4a7be0d4fe4a46aac4400837eece21d753965b2c9768dd` | `00f254c149b02b684d4a7be0d4fe4a46aac4400837eece21d753965b2c9768dd` |
| `test-results/smooth-home-i34/revision-51/after/princess-smooth.png` | 92538 | `05daa759c47e9ff38b3de3948e87af3fb580f2a5fb99dc705ba5ff7d1af04b81` | `05daa759c47e9ff38b3de3948e87af3fb580f2a5fb99dc705ba5ff7d1af04b81` |
| `test-results/smooth-home-i34/revision-51/after/magic-source.png` | 1069783 | `7b083a2b85486d0f5cd2f3c848e70ae43fdf3783abc1aa5fc1daf48a760a3113` | `7b083a2b85486d0f5cd2f3c848e70ae43fdf3783abc1aa5fc1daf48a760a3113` |
| `test-results/smooth-home-i34/revision-51/after/magic-smooth.png` | 94602 | `7a921680ed7cabfe08209eed90c43d577e007921d26e5f76dfd42f9583d75834` | `7a921680ed7cabfe08209eed90c43d577e007921d26e5f76dfd42f9583d75834` |
| `test-results/smooth-home-i34/revision-51/after/animals-source.png` | 1309552 | `f0ebbe53aa9f85f41eaf8ff1269313cb0094cd723a3475893aeb0791a0dd0e70` | `f0ebbe53aa9f85f41eaf8ff1269313cb0094cd723a3475893aeb0791a0dd0e70` |
| `test-results/smooth-home-i34/revision-51/after/animals-smooth.png` | 112621 | `90efc77e706ce1ccce3c91d782e7e2b8f6310f81756c612c750a468cab639abc` | `90efc77e706ce1ccce3c91d782e7e2b8f6310f81756c612c750a468cab639abc` |
| `test-results/smooth-home-i34/revision-51/after/ocean-source.png` | 1050649 | `23d9f0093922249f34e4c0c7121a7cd422f2876eba62a4bc69345b3bb5514bdc` | `23d9f0093922249f34e4c0c7121a7cd422f2876eba62a4bc69345b3bb5514bdc` |
| `test-results/smooth-home-i34/revision-51/after/ocean-smooth.png` | 91660 | `5e6b7f09039e9cb1be0fe86bca8a240d533a068e944f0a169d097c8a6c65cdf9` | `5e6b7f09039e9cb1be0fe86bca8a240d533a068e944f0a169d097c8a6c65cdf9` |
| `test-results/smooth-home-i34/revision-51/after/dinosaurs-source.png` | 908545 | `d8c2c580cfc7d56f0bc7dc7decc976be57cf82a5b0274211f505f08acb0acdcd` | `d8c2c580cfc7d56f0bc7dc7decc976be57cf82a5b0274211f505f08acb0acdcd` |
| `test-results/smooth-home-i34/revision-51/after/dinosaurs-smooth.png` | 77843 | `de59a15d85db0cb85d6ad5fc0ef1eaa970eaf2ccf0589ed034dc18fa079a065b` | `de59a15d85db0cb85d6ad5fc0ef1eaa970eaf2ccf0589ed034dc18fa079a065b` |
| `test-results/smooth-home-i34/revision-51/after/construction-source.png` | 751369 | `92977e98f17ec517770a792bace51a76cfa419ae8fb3b23e34ab1869d4c6f5d4` | `92977e98f17ec517770a792bace51a76cfa419ae8fb3b23e34ab1869d4c6f5d4` |
| `test-results/smooth-home-i34/revision-51/after/construction-smooth.png` | 78620 | `889654d91b5e641c0ddc65b5f8088cf9546b3b9b899803e3ca28ec92c010826b` | `889654d91b5e641c0ddc65b5f8088cf9546b3b9b899803e3ca28ec92c010826b` |
| `test-results/smooth-home-i34/revision-51/after/robots-source.png` | 630874 | `9f13e6761630fbb3966d4a2c5f7022cd934fe25bea8cb871eacbe834bbbc99be` | `9f13e6761630fbb3966d4a2c5f7022cd934fe25bea8cb871eacbe834bbbc99be` |
| `test-results/smooth-home-i34/revision-51/after/robots-smooth.png` | 64843 | `0cc6eebb520e87dd9f4955017075c4e74a0dfc402abf68001d6408b5e3109f26` | `0cc6eebb520e87dd9f4955017075c4e74a0dfc402abf68001d6408b5e3109f26` |
| `test-results/smooth-home-i34/revision-51/after/space-source.png` | 758040 | `9672a118673917339729fe4eae09326612f8b232f2a48d403a35f81203347976` | `9672a118673917339729fe4eae09326612f8b232f2a48d403a35f81203347976` |
| `test-results/smooth-home-i34/revision-51/after/space-smooth.png` | 78791 | `ea739fbb286b32ae733f8efe7f0014ee44dbb2fac5f060a87f9b0ab4a3827d4d` | `ea739fbb286b32ae733f8efe7f0014ee44dbb2fac5f060a87f9b0ab4a3827d4d` |
| `test-results/smooth-home-i34/revision-51/after/vehicles-source.png` | 538942 | `218a3d796dd16210aa2763ef6d9bae72870ca0d1a1a3e3e591edfa4be44f336c` | `218a3d796dd16210aa2763ef6d9bae72870ca0d1a1a3e3e591edfa4be44f336c` |
| `test-results/smooth-home-i34/revision-51/after/vehicles-smooth.png` | 58128 | `9133b96866265d646f3ea3b1b5245498e2ed75e152be6624bd807c4bca6bd6ec` | `9133b96866265d646f3ea3b1b5245498e2ed75e152be6624bd807c4bca6bd6ec` |
| `test-results/smooth-home-i34/revision-51/after/flowers-source.png` | 928211 | `4e9a774e4053357879708e2a4255f7a39bf9c040fc59027795047759b676f3a1` | `4e9a774e4053357879708e2a4255f7a39bf9c040fc59027795047759b676f3a1` |
| `test-results/smooth-home-i34/revision-51/after/flowers-smooth.png` | 86529 | `1521d20f4c69880ed5f4c493ec4734f46e0db537185288445abdce31e2813916` | `1521d20f4c69880ed5f4c493ec4734f46e0db537185288445abdce31e2813916` |
| `test-results/smooth-home-i34/revision-51/after/princess-detail.png` | 770247 | `5fb9a1cc92c3b7ad545e57eeb5cac949f466b294c29c3deda8eeb688044d1d9f` | `5fb9a1cc92c3b7ad545e57eeb5cac949f466b294c29c3deda8eeb688044d1d9f` |
| `test-results/smooth-home-i34/revision-51/after/magic-detail.png` | 632633 | `1e39872db40c447d3374ba8036fea5d7a34b6eb6b2c2ddfbd48b0c8b02e12a24` | `1e39872db40c447d3374ba8036fea5d7a34b6eb6b2c2ddfbd48b0c8b02e12a24` |
| `test-results/smooth-home-i34/revision-51/after/construction-detail.png` | 243951 | `64988af78806d5cee1f30ca11dab74f2fcde485d3285b2f41f16b9495fd8dfeb` | `64988af78806d5cee1f30ca11dab74f2fcde485d3285b2f41f16b9495fd8dfeb` |
| `test-results/smooth-home-i34/revision-51/after/robots-detail.png` | 52221 | `b1e47d4172a80288a52af0861ba045c898fafda098703ed9bc06d354f6a8826f` | `b1e47d4172a80288a52af0861ba045c898fafda098703ed9bc06d354f6a8826f` |
| `test-results/smooth-home-i34/revision-51/after/vehicles-detail.png` | 42549 | `7a6e3749ce70ff8b75b3aefced0135bf65eb4dbaf22a09c4592bdebb241ce3c0` | `7a6e3749ce70ff8b75b3aefced0135bf65eb4dbaf22a09c4592bdebb241ce3c0` |
| `test-results/smooth-home-i34/revision-51/after/flowers-detail.png` | 434393 | `9cc6c4d07db39a69fc17472825681bdb9b22e6e8289243af756fc98323a0a127` | `9cc6c4d07db39a69fc17472825681bdb9b22e6e8289243af756fc98323a0a127` |
| `test-results/smooth-home-i34/revision-51/after/evidence.json` | 15834 | `aaf222062f4f625ae6888b3d3e0dc742ac3256b5b6bcabf19b1dff604aec2562` | `aaf222062f4f625ae6888b3d3e0dc742ac3256b5b6bcabf19b1dff604aec2562` |
| `test-results/smooth-home-i34/revision-51/after/comparison.json` | 4388 | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| `test-results/smooth-home-i34/revision-51/after/legacy-comparison.json` | 7134 | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |
| `docs/audits/smooth-home-i34-revision-47-prototype-visual-20261012.md` | 14510 | `7289288911d2017fd5f0bdcd8f881801dd08338c980475443c87cb39b94aecc1` | `7289288911d2017fd5f0bdcd8f881801dd08338c980475443c87cb39b94aecc1` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |
| `test-results/smooth-home-i34/revision-47/prototype/princess-error3-source.png` | 1056556 | `332e6fb67a938c6d9c742f72ff7b2ef5ccc14f11091be0e46fe8d0c56270f4d4` | `332e6fb67a938c6d9c742f72ff7b2ef5ccc14f11091be0e46fe8d0c56270f4d4` |
| `test-results/smooth-home-i34/revision-47/prototype/princess-error3-detail.png` | 614590 | `621f77e3f1da3969ab256dc4a3d5ed1d8884da8f72d984cd44dc42ecec914683` | `621f77e3f1da3969ab256dc4a3d5ed1d8884da8f72d984cd44dc42ecec914683` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `apps/web/public/images/islands/animals-v1.webp` | 116844 | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` |
| `apps/web/public/images/islands/ocean-v1.webp` | 117204 | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` |
| `apps/web/public/images/islands/dinosaurs-v1.webp` | 112290 | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` |
| `apps/web/public/images/islands/construction-v1.webp` | 120460 | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` |
| `apps/web/public/images/islands/robots-v1.webp` | 104158 | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` |
| `apps/web/public/images/islands/space-v1.webp` | 101528 | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` |
| `apps/web/public/images/islands/vehicles-v1.webp` | 100210 | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` |
| `apps/web/public/images/islands/flowers-v1.webp` | 115326 | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` |
| `apps/web/public/images/islands/construction-v2-960.1e5145fc07cfbe62fe94ed6b20e3a5db96c4e42ab7a0c410ff9bc7af0c255446.webp` | 247732 | `1e5145fc07cfbe62fe94ed6b20e3a5db96c4e42ab7a0c410ff9bc7af0c255446` | `1e5145fc07cfbe62fe94ed6b20e3a5db96c4e42ab7a0c410ff9bc7af0c255446` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `content/smooth-finish-i34/derived/animals-registered.png` | 4086290 | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| `content/smooth-finish-i34/derived/ocean-registered.png` | 3201467 | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |
| `content/smooth-finish-i34/derived/dinosaurs-registered.png` | 3137029 | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |
| `content/smooth-finish-i34/derived/construction-registered.png` | 2921595 | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` |
| `content/smooth-finish-i34/derived/robots-registered.png` | 2654867 | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` |
| `content/smooth-finish-i34/derived/space-registered.png` | 2917940 | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| `content/smooth-finish-i34/derived/vehicles-registered.png` | 2422677 | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| `content/smooth-finish-i34/derived/flowers-registered.png` | 3312036 | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` |

本原本だけを追加し、旧FAILの自己上書きや判定基準の緩和をしていない。

