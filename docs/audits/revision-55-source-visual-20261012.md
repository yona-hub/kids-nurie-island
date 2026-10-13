# I34 候補55：全10 source/art・直接2倍・部分塗り/消去 独立目視原本

判定：**FAIL（今回提供されたsource/art・部分塗りの範囲）**。全10テーマのsource/fit、直接2倍の7局所、部分塗り/消去6枚を実表示した。51の首上下・タイヤ上辺・孤立暗線は改善している。しかし車の部分塗りで、黒線を越えて未着色の隣接領域へ青/赤が出る。全塗りsourceにも広い白抜けと窓の材質を失う退行があり、ホーム同等の最終品質へ到達したとは認めない。

この判断は55の現物によるもの。51 FAIL、33 screen FAILの原本を書き換えず、実装説明・技術検査成功・部分改善から全体PASSへ拡張していない。

## 範囲・同一性・方法

- 独立確認者：`/root/i34_finish_visual`。単独、再委任/孫agentなし、主モデル/effortは継承した設定を維持。
- 作業ルート：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。
- 開始：2026-10-12 22:20 JST。`extra-evidence.json` の存在を最初の1回で確認してから、全PNG入力を固定した。生成待ちの繰返しpollはしていない。
- PNG入力・参照・旧原本・JSONの確認前hash：2026-10-12T22:20:48.2951477+09:00。
- 直接2倍cropの座標を読むための `capture-extra.mjs` 追加確認前hash：2026-10-12T22:21:24.7442543+09:00。PNG確認前固定の後で、このメタデータだけを別途固定して読んだ。
- 全表示後hash：2026-10-12T22:28:29.6374825+09:00。
- 固定した67証拠は全て前後SHA256・byte数一致。画像60ファイルを実表示し、残り7はJSON4、旧原文2、crop取得スクリプト1。
- 現対象PNGは33枚。source10枚/部分塗り・消去6枚は1600×2000、fit10枚は320×400。直接2倍cropは7枚。全33枚を表示した。
- source全体は最大辺900px、部分/消去全体は850px、home/privateは800〜900px、home-targetは1000px以内へ縮小表示した。fitは原画素320×400のまま、直接2倍cropも全7枚を元画素のまま表示した。
- 主要輪郭はsourceの元画素を補間なしの原寸局所で追加表示した。部分漏れの1局所だけnearest解析2倍も使ったが、これは1600画像の拡大補助であり、実engine直接2倍とは区別する。

本原本だけを新規追加した。制作コード、素材、画像、既存原本を変更せず、他者の編集を戻していない。表示の縮小/cropはメモリ内だけで派生画像ファイルを作っていない。private登録原画は分析表示に限り、配布/公開用複写・報告埋込みを行っていない。

全90、実Chrome、4倍、実機、全色/全装飾、P05性能、人間採用は今回の範囲外。テスト/性能測定・外部通信・画像生成・公開・モデル変更を行っていない。

### manifestの照合

`extra-evidence.json` の23件はsource10枚とextra13枚で、全23件のSHA256・bytesが現ファイルと一致した。`after/evidence.json` のsmooth state PNG hashはfit10枚と10/10一致した。51時点のsource hash不在を55へ推定転記せず、55では実際に存在するextra manifestと本監査の前後hashを使った。

`comparison.json` は10件のgeometryUnchanged=true、smooth変更10件。`legacy-comparison.json` は10件・40stateのunchanged=trueだった。記録の一致は同一性/比較範囲の証拠であり、絵や操作の美術合格の証拠にはしていない。blank/crayon/pencil画像、Unit/Chrome/native生記録は今回開いていない。

## 実表示した全10 source/fitと原寸範囲

以下のsource/fitは `test-results/smooth-home-i34/revision-55/after/` を起点とする。座標はworld 1600×2000の `[left,top,right,bottom]`。全10で `*-source.png` と `*-smooth.png` の両方を全体表示した。

| テーマ | 原寸sourceで追加表示した主要範囲 |
|---|---|
| princess | 顔/眼/髪/耳 `[490,430,920,860]`、耳上 `[510,510,550,540]`、右頬下 `[805,650,850,720]`、ウサギ顔/耳 `[970,1190,1335,1510]` |
| magic | 顔/眼/顎/襟 `[565,465,945,865]` |
| space | 顔/眼/顎/ヘルメット `[830,740,1250,1130]` |
| construction | 前窓/車体接続 `[670,800,1110,1160]` |
| robots | 首上下/左右端 `[660,790,1040,890]` |
| vehicles | 窓/ボンネット `[760,540,1310,1120]`、タイヤ上辺 `[390,980,545,1080]`、旧孤立線 `[900,1070,1040,1135]` / `[1140,1140,1290,1240]` |
| flowers | 茎/葉/包装接点 `[580,850,1050,1270]` |
| animals | 犬/猫の顔/口/毛 `[280,890,1250,1410]` |
| ocean | イルカ口 `[960,535,1150,735]`、魚口 `[475,1135,645,1335]`、亀口 `[645,870,920,1110]` |
| dinosaurs | 顔/鼻孔/口/首 `[260,220,990,900]` |

### 直接2倍の現物と対応座標

以下は `test-results/smooth-home-i34/revision-55/extra/`。`capture-extra.mjs` に記録されたengine3200からの取得範囲を読み、実PNG寸法と照合した。取得スクリプトの説明だけで描画品質をPASSにはしていない。

| 実表示PNG | 実寸 | world対応範囲 |
|---|---:|---|
| `robots-neck-direct2.png` | 600×180 | `[690,805,990,895]` |
| `vehicles-wheel-direct2.png` | 300×180 | `[390,990,540,1080]` |
| `vehicles-hood-direct2.png` | 600×280 | `[920,1060,1220,1200]` |
| `vehicles-bumper-direct2.png` | 600×180 | `[1180,1160,1480,1250]` |
| `princess-face-direct2.png` | 860×860 | `[490,430,920,860]` |
| `magic-face-direct2.png` | 720×740 | `[550,420,910,790]` |
| `flowers-stems-direct2.png` | 860×800 | `[600,870,1030,1270]` |

姫の直接2倍画像は全体に加え、画像内 `[55,165,120,205]`（耳上）、`[665,285,720,375]`（右まつげ）、`[635,440,690,560]`（右頬）の原画素局所も再表示した。この7局所の直接2倍確認を、未提供の他テーマ/他部位の直接2倍や4倍の合格へ拡張しない。

### 部分塗り/消去の現物

全6枚を全体表示し、次の原寸局所を追加確認した。`only` と `erased` は異なる状態として扱い、全塗りで隠れる漏れを確認した。

| 実表示PNG | 追加した原寸範囲 |
|---|---|
| `robots-r19-only.png` / `robots-r19-erased.png` | 首 `[650,790,1040,895]` |
| `vehicles-r19-only.png` / `vehicles-r19-erased.png` | タイヤ `[340,970,760,1380]`、左隣接部 `[350,1100,420,1310]` |
| `vehicles-r10-only.png` / `vehicles-r10-erased.png` | ドア/ミラー/タイヤ接点 `[230,720,720,1160]`。onlyは左縁 `[240,790,320,1120]` も追加 |

r19-onlyの `[350,1130,405,1290]` は解析nearest2倍でも表示した。これは部分1600画像の表示補助であり、`*-direct2.png` とは別。

## 不合格根拠と最小不足

### R55-1：車の部分塗りで黒線の外側へ色が出る

**手前タイヤr19-only：** 概ねworld **x364–384,y1150–1290** の左側。青いタイヤ面の左端が元の黒線を越え、隣接する未着色の白い面へ細長く張り出す。全体でもタイヤ左側の張出しを認め、原寸 `[340,970,760,1380]` と狭い左縁cropで確定した。タイヤ内の反射/模様と、黒線の外へ出た青い帯を区別した。

**ドア/前面r10-only：** 概ねworld **x255–315,y795–1105** の左ドア縁。赤い塗りが黒線の左側へ細い帯として続き、白い隣接領域へ出る。原寸 `[230,720,720,1160]` と `[240,790,320,1120]` で確認した。車体の赤いハイライトや線画のアンチエイリアスだけではなく、黒線を挟んだ外側に有彩色の帯が存在する。

目視で見えた位置を元画素の色で照合した代表点は以下。これは外周検査の再実行/全画素の輪郭外判定ではなく、現物の位置を示す補助である。

| 状態/行 | 黒線の強い画素x | その左側の有彩色画素x |
|---|---|---|
| r19-only / y1180 | 372–377 | 青 367–371 |
| r19-only / y1220 | 369–375 | 青 368 |
| r19-only / y1260 | 368–373 | 青 367 |
| r10-only / y850 | 275–278 | 赤 270–274 |
| r10-only / y920 | 266–269 | 赤 260–265 |
| r10-only / y1000 | 273–276 | 赤 264–272 |

色画素の照合では黒をRGB各50未満、青/赤を他成分との差で識別した。これをcoverage数値試験やoutsideContourPixelsへ読み替えていない。FAILの根拠は、only状態で白く残るべき隣接面へ塗りが見えて出る現物である。

**最小不足：** 塗られた面の滑らかな境界を保ちながら、未着色の隣接面を紙の白として残す必要がある。全塗り時に隣接色で隠すことや、黒線を太くして帯を覆うことでは、部分塗り時の不足は解消したと示せない。どの合成/所有判定が原因かは本目視では未特定。

robots-r19-onlyの首では同種の明確な外側色帯を認めなかった。これはその首/状態/配色の観測であり、全領域の部分塗りPASSではない。

### R55-2：全塗り車の白抜けと窓の材質退行

`after/vehicles-source.png` と320×400 fitの両方に現れ、source原寸 `[760,540,1310,1120]` でも確認した。

- **ボンネット右側：概ねworld x1030–1298,y806–1076。** 赤い車体の面の中に、背景と同じ広い白い領域が空く。上端には黒い線の一部が残り、周囲の車体の反射/陰影が途切れる。小さい光の反射として連続しておらず、縮小全体でも白抜けとして見える。
- **右側フロントガラス：概ねworld x820–1140,y575–810。** ガラスの反射/階調が失われ、青灰の細い外周の内側が赤い三角形/多角形の平坦な面へ変わる。隣のガラスは反射のある面のままで、この窓だけ材質の読みと面の連続が崩れる。

51の同じ全体像、private同world原寸、実homeと比較した。51では当該部に反射のある窓と連続した車体陰影があった。参照と同じ色相/形状/パネル構成の複製が条件なのではない。現在の車の中で、1枚の窓の材質が失われ、広い車体の陰影が白い空白で切られていることが不足である。

この退行は `vehicles-r19-erased.png` / `vehicles-r10-erased.png` の全体でも見えるが、消去した領域そのものの白戻りとは区別する。r19/r10の消去対象ではない右窓/ボンネットの同じ場所に残る。

**最小不足：** 全塗り状態で当該車体面を欠落なく表示し、窓の材質と陰影の連続を回復すること。原因がsource zone除外、色分け、合成順などのどれかは未特定。実装説明を原因の確定や現物解消の根拠にはしていない。

## 51/33残件の現在所見・全10の品質

| 項目/テーマ | 55の現物による所見 |
|---|---|
| R51-1 robots首 x700–970,y818–865 | 51原寸と55原寸/直接2倍を比較。旧の短い水平段が並ぶ上下縁は、55では連続した曲線へ明確に改善。金属の反射も残る。左右端の現在の形状を参照と同形にすることは要求しない。この局所改善はR55-1/2を解消しない。 |
| R51-2 vehiclesタイヤ上辺 x416–512,y1008–1043 | 51原寸と55原寸/直接2倍を比較し、旧の波打つ/角張る材質上縁は今回範囲では再現しない。ゴム表面の模様・凹凸は区別して保持。部分塗りの外側漏れは別にR55-1。 |
| R51-2 ボンネット孤立線 x950–1004,y1100–1106 | 51/55原寸と55直接2倍で照合。51の短い暗色線を現在55では認めず、明るい帯へ連続する。車の別位置の白抜けR55-2は残る。 |
| R51-2 バンパー孤立線 x1210–1245,y1180–1192 | 51/55原寸と55直接2倍で照合。旧の短い斜め暗線は今回画像では認めない。 |
| R47-1 姫耳上 x522–546,y519–526 / 右頬下 x814–818,y674–678 | source原寸と直接2倍の局所で、旧の孤立した淡色断片/短冊を認めない。51で見えなかった状態を直接2倍の今回現物でも確認した。 |
| 33 S01 姫右頬 x812–834,y625–675 / 耳・顎 | source原寸と直接2倍で旧の太い粗い茶色帯/大きな階段の再発を認めない。耳→左顎の現在の短い形状の折れは残るが、形状差だけで追加FAILにしていない。4倍実画面の解消は未確認。 |
| 33 S01 魔法顎 x737–823,y777–790 | source原寸と直接2倍の範囲で旧の大きな階段帯、点/縞を認めない。直接2倍cropの下端はworld y790であり、そこより下の襟/首はsource原寸で確認した。 |
| princess | 肌・髪の毛流れ/暗部・衣装の階調と表情を確認。旧B03の一定幅の上白帯/二重枠、まつげ根元 x828–842,y580–611 の白い短冊穴、不要な独立まつげの再発を認めない。髪に37の広い平板領域/継ぎ目の再発も認めない。ウサギ口は連続する。 |
| magic | 顔/瞼/白目/虹彩/口/髪/襟はつながる。旧B03の二重枠を認めず、白目量の参照一致を合格条件にしていない。生地、靴、金属の階調を全体で確認。追加の明確なブロッカーは今回範囲で検出しなかった。 |
| space | source原寸の顔/眼/顎/髪/ヘルメットと全体の宇宙服/ロケットを確認。旧B02顎点/縞、旧B03の二重帯は再発していない。直接2倍の顔画像は今回提供されておらず、sourceからその合格を補っていない。 |
| construction | 前窓下辺の旧S02 x684–1086,y844–1129 はsource原寸で連続する。51の改善を保ち、車体/履帯/金属の立体感は全体で読める。直接2倍/4倍の窓は今回未提供・未確認。 |
| robots | 目/口の表情、円柱・関節の反射は保たれる。首は原寸/直接2倍で改善。r19-only/erasedの原寸では線画が連続し、明確な漏れ/消去線欠落を認めない。 |
| vehicles | 窓の一部と車体にR55-2、部分塗りにR55-1があり、最終品質FAIL。タイヤ上辺と旧孤立線だけの改善から車全体のPASSへ拡張しない。 |
| flowers | 花弁/葉/リボン/包装の素材感は保たれる。原寸と直接2倍で茎/葉/包装接点を確認し、旧の大きな段が並ぶ境界は今回範囲で目立たない。概ね x807–839,y1130–1149 の丸い緑の終端が包装の折り目へ入る形は残る。旧の重なり/終端の観察残件を保持し、形状差だけの追加FAILにしていない。 |
| animals | 犬/猫の顔/毛/目/口内を原寸表示。旧犬口の白抜け/分断は再発せず、表情と素材の連続を保つ。均一な口縁表現は残る。 |
| ocean | イルカ/魚/亀の原寸口を確認。旧B04/B05/B08白抜けは再発していない。口内/舌が連続し、イルカの反射/甲羅/魚の材質も保たれる。 |
| dinosaurs | 顔/鼻孔/歯/舌/口内の原寸を確認。平坦な鼻孔/口奥の表現は残るが、新しい漏れ/白抜けとして分類していない。肌と卵/岩の質感は全体で保つ。 |

旧の非ブロッカーであるウサギ/犬/亀の均一な口縁、ウサギ内耳L形の暗い縁 x1253–1290,y1221–1322、恐竜の平坦な鼻孔（左 x330–373,y479–541 / 右 x440–494,y511–571）・口奥 x598–710,y642–759 は解消したと主張しない。今回も表情と口内の連続は保たれ、それ単独を新しいブロッカーへ変更していない。全体完了はR55-1/2により未達。

## 消去と判定の限界

提供された3領域のerased画像では、消した対象が白へ戻り、黒い線画が残る。首/タイヤ/ドアの原寸で、線が丸ごと欠落したり消去対象の塗りが広く残る現象を認めなかった。これは3領域・提供状態・配色に限る所見で、全消去操作の成功やフレーム/アニメーション/Unitの合格ではない。車の右窓/ボンネットのR55-2は消去以外にも存在し、消去対象の正常な白戻りと混同していない。

全10source/fitと今回7局所の直接2倍、3領域×only/erasedに基づく独立目視である。全90・Chrome・4倍・実機・全色/装飾・人間採用の判定は未確認。51原本に記録したflowers native輪郭外19px FAILはその旧版原本として保持し、55のnative再検査が0になったとは本監査から主張しない。未読の技術結果を成功扱いにしていない。P05性能STOPは維持。

今回も実home10テーマのv1、home-target、private登録10テーマを全体表示した。privateのrobots首、vehicles窓/ボンネット、flowers茎/包装、construction窓は同world原寸も表示した。比較目的は材質/陰影/顔のつながり/滑らかさであり、形・色・構図の複製ではない。51の6source（princess/magic/robots/vehicles/flowers/construction）と51/33原文を現物比較に用いた。

## 確認前後SHA256・bytes

現対象PNG33、home/private比較21、旧51比較PNG6、JSON4、旧原文2、cropメタデータコード1、計67ファイル。全て前後SHA256一致、byte数変更0。画像を報告に埋め込まず、privateはパス/hashの識別だけを記録した。

| ファイル（project相対） | bytes（前後同じ） | 確認前 SHA256 | 確認後 SHA256 |
|---|---:|---|---|
| `test-results/smooth-home-i34/revision-55/after/princess-source.png` | 1065490 | `75220106c483a82e47564c385f4be21c0aafdac88380f4de2604fea3a41cbb2b` | `75220106c483a82e47564c385f4be21c0aafdac88380f4de2604fea3a41cbb2b` |
| `test-results/smooth-home-i34/revision-55/after/princess-smooth.png` | 92049 | `d14ce24235de99492e00b45d2c452ad11572418bb414346eb5fa8641e02b1a2d` | `d14ce24235de99492e00b45d2c452ad11572418bb414346eb5fa8641e02b1a2d` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `test-results/smooth-home-i34/revision-55/after/magic-source.png` | 1062044 | `92c3cd0234ec1d500b90f38daf950c53f8cc8b128d896dcb0529669d07d71205` | `92c3cd0234ec1d500b90f38daf950c53f8cc8b128d896dcb0529669d07d71205` |
| `test-results/smooth-home-i34/revision-55/after/magic-smooth.png` | 93727 | `b97255221d232f81e8684e6af61562e560d3d4ff2b217aef5f04bb896a6a2f7c` | `b97255221d232f81e8684e6af61562e560d3d4ff2b217aef5f04bb896a6a2f7c` |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `test-results/smooth-home-i34/revision-55/after/animals-source.png` | 1307762 | `75fed69e507ea6115d486abfb8f8ba0e53fc51bf270e78af4fd10d83ed7e9b63` | `75fed69e507ea6115d486abfb8f8ba0e53fc51bf270e78af4fd10d83ed7e9b63` |
| `test-results/smooth-home-i34/revision-55/after/animals-smooth.png` | 111941 | `ea2aaf98cfb69866c2891300863f678cb05b2eb9dcf928878c8fa22dc75aa6d7` | `ea2aaf98cfb69866c2891300863f678cb05b2eb9dcf928878c8fa22dc75aa6d7` |
| `apps/web/public/images/islands/animals-v1.webp` | 116844 | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` |
| `content/smooth-finish-i34/derived/animals-registered.png` | 4086290 | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| `test-results/smooth-home-i34/revision-55/after/ocean-source.png` | 1047611 | `0d7160767e64be0be7216c9fdde014dc39f3f32e2c05a0fc2009f203a354c33a` | `0d7160767e64be0be7216c9fdde014dc39f3f32e2c05a0fc2009f203a354c33a` |
| `test-results/smooth-home-i34/revision-55/after/ocean-smooth.png` | 91283 | `171286902f5f994e77cce6dcfead703c824198b7b6e119e65c187ecf33cb3710` | `171286902f5f994e77cce6dcfead703c824198b7b6e119e65c187ecf33cb3710` |
| `apps/web/public/images/islands/ocean-v1.webp` | 117204 | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` |
| `content/smooth-finish-i34/derived/ocean-registered.png` | 3201467 | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |
| `test-results/smooth-home-i34/revision-55/after/dinosaurs-source.png` | 912909 | `9789bc9f83b866a7bc339c3e649efbfc5d6ca13f69d7fd94ea11debed3a8316a` | `9789bc9f83b866a7bc339c3e649efbfc5d6ca13f69d7fd94ea11debed3a8316a` |
| `test-results/smooth-home-i34/revision-55/after/dinosaurs-smooth.png` | 77894 | `5a416774727172b42ddfe2512d32e4faf6b07b34cf107142ff849650c3905be3` | `5a416774727172b42ddfe2512d32e4faf6b07b34cf107142ff849650c3905be3` |
| `apps/web/public/images/islands/dinosaurs-v1.webp` | 112290 | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` |
| `content/smooth-finish-i34/derived/dinosaurs-registered.png` | 3137029 | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |
| `test-results/smooth-home-i34/revision-55/after/construction-source.png` | 718990 | `ca7523f33d8a0ed995ccbb5b5b901a086bd5f5dc5e2517de1c3308dd5f129f29` | `ca7523f33d8a0ed995ccbb5b5b901a086bd5f5dc5e2517de1c3308dd5f129f29` |
| `test-results/smooth-home-i34/revision-55/after/construction-smooth.png` | 76522 | `f396438c456b2ead79d758e6d0dd56d4e113a4b7c17e22b85ed5729278695508` | `f396438c456b2ead79d758e6d0dd56d4e113a4b7c17e22b85ed5729278695508` |
| `apps/web/public/images/islands/construction-v1.webp` | 120460 | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` |
| `content/smooth-finish-i34/derived/construction-registered.png` | 2921595 | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` |
| `test-results/smooth-home-i34/revision-55/after/robots-source.png` | 601357 | `c7914a0394ebad5ee1d7590afa3629c856df82272534e08e1c6daf63362b1d31` | `c7914a0394ebad5ee1d7590afa3629c856df82272534e08e1c6daf63362b1d31` |
| `test-results/smooth-home-i34/revision-55/after/robots-smooth.png` | 62729 | `7dd0c6b3c8a365d839fd12aafbcb29cddb90a472555ee171f78f1b82f811b842` | `7dd0c6b3c8a365d839fd12aafbcb29cddb90a472555ee171f78f1b82f811b842` |
| `apps/web/public/images/islands/robots-v1.webp` | 104158 | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` |
| `content/smooth-finish-i34/derived/robots-registered.png` | 2654867 | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` |
| `test-results/smooth-home-i34/revision-55/after/space-source.png` | 732732 | `7cd3fccfdd196fa0c271c6aadd62c77bbd4186ec9b3d80758ac87b3861efb35f` | `7cd3fccfdd196fa0c271c6aadd62c77bbd4186ec9b3d80758ac87b3861efb35f` |
| `test-results/smooth-home-i34/revision-55/after/space-smooth.png` | 76888 | `e39569ad47613465d5510d94cd35b3bbaaf860ee7bf4434c45e5b66b27d1c751` | `e39569ad47613465d5510d94cd35b3bbaaf860ee7bf4434c45e5b66b27d1c751` |
| `apps/web/public/images/islands/space-v1.webp` | 101528 | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` |
| `content/smooth-finish-i34/derived/space-registered.png` | 2917940 | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| `test-results/smooth-home-i34/revision-55/after/vehicles-source.png` | 490623 | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` |
| `test-results/smooth-home-i34/revision-55/after/vehicles-smooth.png` | 53792 | `e3e7ec4066ce618f130eb25c3beec7983d145d4727052ebe8e32b95caec40edc` | `e3e7ec4066ce618f130eb25c3beec7983d145d4727052ebe8e32b95caec40edc` |
| `apps/web/public/images/islands/vehicles-v1.webp` | 100210 | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` |
| `content/smooth-finish-i34/derived/vehicles-registered.png` | 2422677 | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| `test-results/smooth-home-i34/revision-55/after/flowers-source.png` | 925558 | `182fd8812d382b8cbb3f295a553ddd6fe27ab6d1557f5713d5cc94cbb0d7f693` | `182fd8812d382b8cbb3f295a553ddd6fe27ab6d1557f5713d5cc94cbb0d7f693` |
| `test-results/smooth-home-i34/revision-55/after/flowers-smooth.png` | 85698 | `60ebbfdac30888b421f8083e7b6b1f3ef8d3ec4dffe9587dc39b2f41b8b9e9e4` | `60ebbfdac30888b421f8083e7b6b1f3ef8d3ec4dffe9587dc39b2f41b8b9e9e4` |
| `apps/web/public/images/islands/flowers-v1.webp` | 115326 | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` |
| `content/smooth-finish-i34/derived/flowers-registered.png` | 3312036 | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` |
| `test-results/smooth-home-i34/revision-55/extra/flowers-stems-direct2.png` | 304297 | `ebe394bd96e6a03c39bc26f0a775362d63d9c8e8c4e39daff9e292ac69dce88d` | `ebe394bd96e6a03c39bc26f0a775362d63d9c8e8c4e39daff9e292ac69dce88d` |
| `test-results/smooth-home-i34/revision-55/extra/magic-face-direct2.png` | 452859 | `a030d816de059cabed1c7fbf6fbb606e5892ab122edf624548c9d87c814d2757` | `a030d816de059cabed1c7fbf6fbb606e5892ab122edf624548c9d87c814d2757` |
| `test-results/smooth-home-i34/revision-55/extra/princess-face-direct2.png` | 616521 | `5f5c8b4ab28389d5a749fdb7340a149cb483e3f73b2f21dd3b7c9555178cef5f` | `5f5c8b4ab28389d5a749fdb7340a149cb483e3f73b2f21dd3b7c9555178cef5f` |
| `test-results/smooth-home-i34/revision-55/extra/robots-neck-direct2.png` | 32137 | `42c6f49b12bb007bc7fdfc91970f83b91d51caadc195e58eb11020452e01277d` | `42c6f49b12bb007bc7fdfc91970f83b91d51caadc195e58eb11020452e01277d` |
| `test-results/smooth-home-i34/revision-55/extra/robots-r19-erased.png` | 600512 | `ab1d87c35c86aea6db68a47fb37579d086589ff29afe28fec634031687626d8a` | `ab1d87c35c86aea6db68a47fb37579d086589ff29afe28fec634031687626d8a` |
| `test-results/smooth-home-i34/revision-55/extra/robots-r19-only.png` | 257864 | `7b287b132dced964ef6dbb50a15e4f983c4462ae7c58ac4deb5942f9979821d5` | `7b287b132dced964ef6dbb50a15e4f983c4462ae7c58ac4deb5942f9979821d5` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-bumper-direct2.png` | 19437 | `3413c9c34c36f081d9d4f9b5be16d77ad7f242f552cf2c73e0e21bd9fb76be5e` | `3413c9c34c36f081d9d4f9b5be16d77ad7f242f552cf2c73e0e21bd9fb76be5e` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-hood-direct2.png` | 24302 | `3bfb7e7fc369226d37bbb0b5779ca7d81438477eaf76c7fe2e67008b516efc22` | `3bfb7e7fc369226d37bbb0b5779ca7d81438477eaf76c7fe2e67008b516efc22` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r10-erased.png` | 482648 | `fcac993ff0a74a686a5924871b040af809418430e6439b1e598c7d819591564a` | `fcac993ff0a74a686a5924871b040af809418430e6439b1e598c7d819591564a` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r10-only.png` | 312490 | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r19-erased.png` | 496592 | `24efc2aee85353c4f267ee5dc1c820b40b53d0b73204507c629d20fc73cdd4a3` | `24efc2aee85353c4f267ee5dc1c820b40b53d0b73204507c629d20fc73cdd4a3` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r19-only.png` | 251147 | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-wheel-direct2.png` | 27236 | `87080fcf97341556398a1eeaedd4c103198415fdf32e2ec88b15a0214932eca6` | `87080fcf97341556398a1eeaedd4c103198415fdf32e2ec88b15a0214932eca6` |
| `test-results/smooth-home-i34/revision-55/extra-evidence.json` | 3545 | `f457e2b9973928120b96f7614bd844a870a813cbe227c2165aeb8a6e98c1d361` | `f457e2b9973928120b96f7614bd844a870a813cbe227c2165aeb8a6e98c1d361` |
| `test-results/smooth-home-i34/revision-55/after/evidence.json` | 15834 | `fefdbe85d57e06a86ca4682028319d2a5fa7550cec8db00c739e16e81fe29bcb` | `fefdbe85d57e06a86ca4682028319d2a5fa7550cec8db00c739e16e81fe29bcb` |
| `test-results/smooth-home-i34/revision-55/after/comparison.json` | 4388 | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| `test-results/smooth-home-i34/revision-55/after/legacy-comparison.json` | 7134 | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `docs/audits/revision-51-source-visual-20261012.md` | 26367 | `8a05416ae7260a5a67cce596faa297e2968fe60b9fc42ee0110ab7e8f7d40d5f` | `8a05416ae7260a5a67cce596faa297e2968fe60b9fc42ee0110ab7e8f7d40d5f` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |
| `test-results/smooth-home-i34/revision-51/after/princess-source.png` | 1064546 | `00f254c149b02b684d4a7be0d4fe4a46aac4400837eece21d753965b2c9768dd` | `00f254c149b02b684d4a7be0d4fe4a46aac4400837eece21d753965b2c9768dd` |
| `test-results/smooth-home-i34/revision-51/after/magic-source.png` | 1069783 | `7b083a2b85486d0f5cd2f3c848e70ae43fdf3783abc1aa5fc1daf48a760a3113` | `7b083a2b85486d0f5cd2f3c848e70ae43fdf3783abc1aa5fc1daf48a760a3113` |
| `test-results/smooth-home-i34/revision-51/after/robots-source.png` | 630874 | `9f13e6761630fbb3966d4a2c5f7022cd934fe25bea8cb871eacbe834bbbc99be` | `9f13e6761630fbb3966d4a2c5f7022cd934fe25bea8cb871eacbe834bbbc99be` |
| `test-results/smooth-home-i34/revision-51/after/vehicles-source.png` | 538942 | `218a3d796dd16210aa2763ef6d9bae72870ca0d1a1a3e3e591edfa4be44f336c` | `218a3d796dd16210aa2763ef6d9bae72870ca0d1a1a3e3e591edfa4be44f336c` |
| `test-results/smooth-home-i34/revision-51/after/flowers-source.png` | 928211 | `4e9a774e4053357879708e2a4255f7a39bf9c040fc59027795047759b676f3a1` | `4e9a774e4053357879708e2a4255f7a39bf9c040fc59027795047759b676f3a1` |
| `test-results/smooth-home-i34/revision-51/after/construction-source.png` | 751369 | `92977e98f17ec517770a792bace51a76cfa419ae8fb3b23e34ab1869d4c6f5d4` | `92977e98f17ec517770a792bace51a76cfa419ae8fb3b23e34ab1869d4c6f5d4` |
| `test-results/smooth-home-i34/revision-55/capture-extra.mjs` | 2934 | `d89304a9a07d111eba18ba264886bbbcb4bcd07aace12834be4f4d86c29bdc4a` | `d89304a9a07d111eba18ba264886bbbcb4bcd07aace12834be4f4d86c29bdc4a` |

