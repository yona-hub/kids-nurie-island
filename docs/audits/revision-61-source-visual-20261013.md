# I34 revision61 source/art 独立目視原本

- 判定: **限定PASS**。候補61の全10テーマのsmooth source・fitと、提供された原寸部分/消去および実直接2倍局所について、今回の表示範囲にホーム同等の仕上げを妨げる必須欠陥を認めなかった。
- 対象: `test-results/smooth-home-i34/revision-61/`。別候補・実Chrome・4倍/DPR・実機・全色・全装飾・全90状態目視・P05性能・人間採用・全体READYの合格へ拡張しない。
- 開始: 2026-10-13 00:03:59 JST。入力前固定: 2026-10-13T00:05:08.7416525+09:00。表示終了後固定: 2026-10-13T00:15:45.9252483+09:00。20分以内の限定監査。
- 独立担当単独。再委任・モデル/effort変更なし。生成・外部通信・テスト/性能測定・制作コード/素材/既存証拠/旧監査編集なし。この新規原本だけを保存する。

## 1. 固定対象と判定方法

`identity-before.json` に記録されたbuildは `d080ec40ba8de2c9daa5d0a6da92996ad44bbba598e7ac2a0737403b843b165d`、runtime sourceは `74c1b959e505c5911eb697bfe8dbc543669d3223e59ebb7bb002170aaaf4dc1c`。この記録を読んだ。実行中buildを本担当で再測定したとの意味ではない。

新たに実表示した画像は63ファイル、表示操作89回。内訳は61現物39PNG（source10・smooth fit10・extra19）、実ホーム島10・私有registered10・home-target1、比較55の車3PNG。source1600×2000は全体縮小に加えて主要部を1画素対1表示で開いた。fitは320×400をそのまま表示した。extraの13直接2倍はengine3200×4000から切り出された提供PNGをその画素寸法で表示した。source cropの解析用2倍とは区別する。

私有登録参照は全10を分析表示した。報告への画像埋め込み・配布コピーを行わない。形状、選択色、構図の複製を条件にせず、材質の立体感、陰影の連続、友好的な顔、輪郭の滑らかさを実ホームと比較した。旧FAILの撤回や基準変更はしていない。

61未着色眼9PNGは、直前の独立原本 `docs/audits/revision-61-eyes-prototype-20261012.md`（SHA256 `c2c4eb52d6677a817edb59c255b1b5b215907f5da9c3302ea30a9fc087750971`、12695bytes）の実表示済み現物と9/9でSHA256・bytes同一を再確認して参照した。この段階では9枚を新たに表示したと数えない。着色済み人物眼・顔は61 sourceと姫/魔法の直接2倍を別に実表示して判定した。

今回読んだ83入力は全て開始後の前固定と表示終了後固定でSHA256・bytes一致。差分0。72画像（現在48、参照21、旧55比較3）と11文書/JSON/取得手順。現在48のうち39を新表示し、眼9を上記同一証拠として参照した。`extra-evidence.json`29レコードのSHA/bytes、`after/evidence.json`のsmooth10 SHA、眼9レコードのSHA/bytesは全件現物一致。

`comparison.json`のgeometry10同一、blank/crayon/pencil不変、`legacy-comparison.json`の旧40状態不変という記録も読んだ。これらは機械比較の記録であり美術PASSの根拠ではない。blank/crayon/pencil/旧40状態の画像全点目視は実施していない。

## 2. 全10テーマの現物所見

| テーマ | 現在の観測と主要world座標（1600×2000） | source/art判定 |
| --- | --- | --- |
| princess | 髪の明暗が面全体へつながり、肌と髪が平板な別面へ分断されない。両眼の虹彩・白目・上瞼の陰影は一体として読め、一定幅の白い二重上弧や孤立まつげ穴を認めない。顔[490,430,920,860]を原寸と直接2倍で確認。左耳522–546,519–526、左顎579–589,646–727、右頬814–835,654–711に旧帯・折れの再発を認めない。頬の形の曲がり自体と、旧輪郭の短い階段反復/貼り付いた帯は区別した。服の折り目、宝石、髪に材質差がある。 | PASS |
| magic | 顔[550,420,910,805]原寸と[550,420,910,790]直接2倍。眼の上縁から肌へ暖色の陰影がつながり、灰色の太枠や白い一定幅の上帯を認めない。顎737–823,777–790を原寸で再確認し、旧点/縞・階段状の色帯を認めない。顎の最下部790以降は提供direct2範囲外なので原寸判定のみ。衣服/帽子の折り目・灯り/小物の光沢に立体感がある。 | PASS |
| space | 顔[830,740,1250,1130]原寸。眼・頬・口・顎921–1003,1080–1104がつながり、旧顎点/縞や上瞼二重枠を認めない。ヘルメット/服/機体の素材と反射を読み分けられる。専用顔direct2は未提供。 | PASS |
| robots | 首[660,790,1040,890]原寸、[690,805,990,895]直接2倍。首上下700–970,818–865に旧水平の短い段差反復や孤立暗線を認めない。首は円筒の陰影、胸/腕は金属の反射、ゴム系部品は暗い材質として分かれる。隣接素材の色が首へ帯状に混ざる所見なし。 | PASS |
| vehicles | 窓/ボンネット[760,540,1310,1120]原寸。右窓820–1140,575–810はガラス、右ボンネット1030–1298,806–1076は連続した赤い塗り面へ復旧。タイヤ416–512,1008–1043は直接2倍でも連続。hood/bumper局所の孤立暗線を認めない。全塗りだけで部分漏れを閉じず、6状態の別判定を下記へ記録。 | PASS |
| construction | 窓[670,800,1110,1160]原寸。旧S02窓下辺684–1086,844–1129は滑らかな下弧としてつながり、色帯の小さな階段反復/白筋を認めない。ガラス、黄色い金属、ゴム履帯の質感が分かれ、丸い反射が貼り付いた平板部へ変わっていない。この窓は直接2倍未提供。 | PASS |
| flowers | 茎/葉/包装[580,850,1050,1270]原寸、[600,870,1030,1270]直接2倍。交差部と茎の付け根に白い隙間/色付き外縁/二重線を認めない。花弁、葉、包み、リボンに異なる明暗と厚みがある。丸い茎先端807–839,1130–1149は残るが包装への形状上の重なりとして読み取れ、旧段差帯の再発とは判断しない。 | PASS |
| animals | 顔[280,890,1250,1410]原寸。犬口574–741,1110–1235を含め、黒い切れ込み穴や肌/毛への色漏れを認めない。毛の柔らかい明暗と背景樹木の材質差、友好的な目と口が保たれる。口縁の均一な太さは旧観測として残す。 | PASS |
| ocean | イルカ口[960,535,1150,735]、魚口[475,1135,645,1335]、亀口[645,870,920,1110]を原寸で実表示。B04–B08関連の白穴/黒い孤立点/縁の切れを認めない。海生物の丸い体、甲羅、ヒレ、珊瑚の材質/光が分かれる。亀口の均一な縁は旧観測として残す。 | PASS |
| dinosaurs | 顔[260,220,990,900]原寸。瞳/頬/口の友好的なまとまりがあり、皮膚・卵・植物の丸みと材質差がある。鼻孔や口後方の小さな平坦部は旧所見として残るが、広い面の立体感が失われた状態ではない。未着色眼は同一9証拠中の3枚を参照。 | PASS |

## 3. 部分塗り・消去の独立確認

6つの1600×2000状態を全体表示し、車の原寸境界を追加で開いた。さらに**今回新提供の6実直接2倍cropを全て原画素寸法で開いた**。以下の直接2倍範囲だけを2倍確認済みとする。

| 状態対 | 色/消去の現物 | 実直接2倍のworld範囲 | 判定 |
| --- | --- | --- | --- |
| robots-r19-only / erased | onlyは首の青#2598FF、隣接面は白い初期線画。erasedは対象首が白へ戻り周囲の材質が残る。上下の旧黒線が途切れず、色の外縁や白い線状欠けを認めない。 | [690,805,990,895]、各600×180px | 限定PASS |
| vehicles-r19-only / erased | onlyはタイヤ青#2598FF。旧55の黒線左側へ長く伸びる青帯が再現しない。erasedはタイヤが白へ戻り、隣接ボディ/ホイールの材質と線画が残る。 | [340,980,640,1330]、各600×700px | 限定PASS |
| vehicles-r10-only / erased | onlyはボディ赤#E96759（56の青条件とは異なる）。旧55のドア左側の赤帯が再現しない。erasedはボディが白へ戻り、タイヤ/下部周辺の塗りが残る。外側の白領域と黒線が連続。 | [240,780,540,1200]、各600×840px | 限定PASS |

R55-1の比較として55のr19を[350,1140,410,1290]、r10を[250,795,315,1105]で実表示した。55は旧黒線の白面側に長い青/赤帯が見える。61の同位置を原寸と提供native2で照合し、その長い帯を認めない。代表y1180 x367–371を含む旧箇所に新しい連続した外側色縁がない。r19下端接合周辺x365–379,y1255–1268は塗り端/黒線の接合として読める。この目視を輪郭外色画素0の測定結果と呼ばない。

車のr10下部長辺[330,1030,1470,1240]、r19下部接合[460,1430,590,1500]はonly/erasedそれぞれを原寸で開き、白筋・着色による線の縁取り・消去欠けを認めなかった。ただしr10のx540より右/1200より下、r19の1330より下は新direct2cropの外にあり、これらは原寸の確認に限る。部分塗り全周の2倍/4倍合格へ拡張しない。

## 4. 旧所見の再判定と残る観測

- **R55-2改善を61現物で確認。** 旧55の右窓/ボンネットcropも今回開き、赤く平板になった窓と大きな白欠けを確認した上で、61のガラス/連続するボディへの復旧を判定した。
- **R55-1改善を61現物で確認。** 56限定PASSを自動転記せず、61の新しい部分/消去6状態とnative2局所で再確認した。色条件の違いとcrop外を上記の通り限定した。
- **R58-1/R58-2、R59-1は61眼限定PASSの同一証拠を参照。** 姫の旧白帯代表(650,525),(620,558),(788,561),(759,587)は同一61証拠で肌色へつながることが記録され、R59-1 x797–802,y590–603の暗い突出も解消済みとした原本/現物が今回前後不変。魔法/恐竜の二重外輪郭も同原本の限定PASS範囲。旧58/59のFAIL原本を変更しない。
- **B01/B02/B03の着色済み顔は今回sourceで再確認。** 魔法の顎点/縞、宇宙顎点/縞、上瞼の二重枠、姫右まつげ根元828–842,580–611の白短冊切れを認めない。眼球の反射/白目量は参照と寸法や配置を一致させる条件ではない。
- **B04–B08再発なし（今回原寸）。** イルカ1020–1112,595–693、魚568–620,1255–1294、ウサギ1038–1123,1385–1475、犬574–741,1110–1235、亀705–819,990–1068で旧口周りの穴/点/切れを認めない。
- **33 S01/S02のsource相当位置では改善を観測。** 姫右頬812–834,625–675、耳、魔法顎737–823,777–790、construction窓下辺、robot首、carタイヤ、flowers接点を上述の原寸/提供2倍で確認した。33の実Chrome4倍でのFAILを本source評価で撤回しない。61 browser-contours等の新画面は今回未表示。

残る旧観測は以下の通り。いずれも位置を消去/解消済みと書き換えない。本段階の実表示では、素材の立体感・表情・輪郭の連続を崩してホーム品質を下回らせる必須欠陥とは判断しなかった。

| 残る観測 | world座標 | 現在の評価と最小改善の方向 |
| --- | --- | --- |
| ウサギの片耳暗縁 | x1253–1290,y1221–1322 | 耳の連続した陰影として読め、孤立暗線/白抜けではない。もし明暗をさらに整えるなら耳内側の連続性を保って暗縁を薄くつなぐ。 |
| ウサギ/犬/亀の均一な口縁 | ウサギ1040–1121,1404–1477／犬575–738,1113–1236／亀706–821,992–1068 | 単純な形の口を読む縁として残る。黒穴/二重線/切れではなく友好的な表情を損なわない。必要なら同じ面の光源へ縁の強さをなじませる。 |
| 恐竜の小さな平坦部 | 鼻孔330–373,479–541と440–494,511–571／口後方598–710,642–759 | 小面積の形のアクセントとして残る。体や顔の広い材質が平板化した退行とは区別。さらに磨くなら周囲の曲面陰影に局所的に接続する。 |
| 丸い茎先端の重なり | x807–839,y1130–1149 | 包装折り目に重なる形状が残る。色付き外縁/白筋ではなく、茎と包装の材質は読める。形状を整えるなら重なりの終端だけを滑らかに接続する。 |

今回の必須残件: **なし（上記限定範囲）**。未確認の実Chrome4倍でこれらが粗さ/段差として現れる場合は、その画面の別判定を優先し、本PASSを流用しない。

## 5. 観測と原因推測・未確認ゲート

観測は表示された輪郭、色帯、白抜け、材料の光、顔のつながりに基づく。親から説明された顔所有domain/鼻例外やbitmap合成の修正が今回改善の原因である可能性はあるが、制作コードを編集/実行/因果検証していないため、その説明をPASS根拠としない。`capture-extra.mjs`は取得手順として読んだのみで、本担当では実行していない。

通常Chrome26/26完了やidentity-after一致は親から通知されたが、今回その生結果・画面は確認していない。native90/眼100/Unitの成否もこの目視PASSの根拠としていない。source10の全体と主要部、提供局所13直接2倍、部分/消去6状態の実表示に限る。専用直接2倍がないspace/construction等の顔や窓の2倍、全体4倍/DPR、全色、全装飾、全90画像目視、全消去組合せ、実機、保存済みthumbnailの現画面、P05性能、人間採用は未確認。P05 STOPは維持。

## 6. 実表示ログ

cropは[left,top,right,bottom]。source cropはworld座標。旧55の解析用2倍だけは1600source画素を拡大した表示で、実engine3200由来のextra direct2とは異なる。全体表示では原画像より拡大しない。

| No. | 実表示ファイル | 表示範囲 |
| --- | --- | --- |
| 1 | `test-results/smooth-home-i34/revision-61/after/princess-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 2 | `test-results/smooth-home-i34/revision-61/after/princess-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 3 | `apps/web/public/images/islands/princess-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 4 | `content/smooth-finish-i34/derived/princess-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 5 | `test-results/smooth-home-i34/revision-61/extra/princess-face-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 6 | `test-results/smooth-home-i34/revision-61/after/magic-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 7 | `test-results/smooth-home-i34/revision-61/after/magic-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 8 | `apps/web/public/images/islands/magic-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 9 | `content/smooth-finish-i34/derived/magic-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 10 | `test-results/smooth-home-i34/revision-61/extra/magic-face-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 11 | `test-results/smooth-home-i34/revision-61/after/princess-source.png` | crop [490, 430, 920, 860]・1倍（原寸） |
| 12 | `test-results/smooth-home-i34/revision-61/after/magic-source.png` | crop [550, 420, 910, 805]・1倍（原寸） |
| 13 | `test-results/smooth-home-i34/revision-61/after/vehicles-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 14 | `test-results/smooth-home-i34/revision-61/after/vehicles-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 15 | `apps/web/public/images/islands/vehicles-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 16 | `content/smooth-finish-i34/derived/vehicles-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 17 | `test-results/smooth-home-i34/revision-61/after/robots-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 18 | `test-results/smooth-home-i34/revision-61/after/robots-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 19 | `apps/web/public/images/islands/robots-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 20 | `content/smooth-finish-i34/derived/robots-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 21 | `test-results/smooth-home-i34/revision-61/extra/vehicles-wheel-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 22 | `test-results/smooth-home-i34/revision-61/extra/vehicles-hood-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 23 | `test-results/smooth-home-i34/revision-61/extra/vehicles-bumper-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 24 | `test-results/smooth-home-i34/revision-61/extra/robots-neck-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 25 | `test-results/smooth-home-i34/revision-61/after/vehicles-source.png` | crop [760, 540, 1310, 1120]・1倍（原寸） |
| 26 | `test-results/smooth-home-i34/revision-61/after/robots-source.png` | crop [660, 790, 1040, 890]・1倍（原寸） |
| 27 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-only.png` | 全体・最大辺650px（原画像より拡大しない） |
| 28 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-only-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 29 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-erased.png` | 全体・最大辺650px（原画像より拡大しない） |
| 30 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-erased-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 31 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-only.png` | 全体・最大辺650px（原画像より拡大しない） |
| 32 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-only-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 33 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-erased.png` | 全体・最大辺650px（原画像より拡大しない） |
| 34 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-erased-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 35 | `test-results/smooth-home-i34/revision-61/extra/robots-r19-only.png` | 全体・最大辺650px（原画像より拡大しない） |
| 36 | `test-results/smooth-home-i34/revision-61/extra/robots-r19-only-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 37 | `test-results/smooth-home-i34/revision-61/extra/robots-r19-erased.png` | 全体・最大辺650px（原画像より拡大しない） |
| 38 | `test-results/smooth-home-i34/revision-61/extra/robots-r19-erased-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 39 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-only.png` | crop [340, 970, 690, 1500]・1倍（原寸） |
| 40 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-erased.png` | crop [340, 970, 690, 1500]・1倍（原寸） |
| 41 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-only.png` | crop [250, 790, 410, 1220]・1倍（原寸） |
| 42 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-erased.png` | crop [250, 790, 410, 1220]・1倍（原寸） |
| 43 | `test-results/smooth-home-i34/revision-61/after/flowers-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 44 | `test-results/smooth-home-i34/revision-61/after/flowers-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 45 | `apps/web/public/images/islands/flowers-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 46 | `content/smooth-finish-i34/derived/flowers-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 47 | `test-results/smooth-home-i34/revision-61/after/construction-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 48 | `test-results/smooth-home-i34/revision-61/after/construction-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 49 | `apps/web/public/images/islands/construction-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 50 | `content/smooth-finish-i34/derived/construction-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 51 | `test-results/smooth-home-i34/revision-61/extra/flowers-stems-direct2.png` | 全体・最大辺1600px（原画像より拡大しない） |
| 52 | `test-results/smooth-home-i34/revision-61/after/flowers-source.png` | crop [580, 850, 1050, 1270]・1倍（原寸） |
| 53 | `test-results/smooth-home-i34/revision-61/after/construction-source.png` | crop [670, 800, 1110, 1160]・1倍（原寸） |
| 54 | `test-results/smooth-home-i34/revision-61/after/space-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 55 | `test-results/smooth-home-i34/revision-61/after/space-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 56 | `apps/web/public/images/islands/space-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 57 | `content/smooth-finish-i34/derived/space-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 58 | `test-results/smooth-home-i34/revision-61/after/animals-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 59 | `test-results/smooth-home-i34/revision-61/after/animals-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 60 | `apps/web/public/images/islands/animals-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 61 | `content/smooth-finish-i34/derived/animals-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 62 | `test-results/smooth-home-i34/revision-61/after/space-source.png` | crop [830, 740, 1250, 1130]・1倍（原寸） |
| 63 | `test-results/smooth-home-i34/revision-61/after/animals-source.png` | crop [280, 890, 1250, 1410]・1倍（原寸） |
| 64 | `test-results/smooth-home-i34/revision-61/after/princess-source.png` | crop [970, 1190, 1335, 1510]・1倍（原寸） |
| 65 | `test-results/smooth-home-i34/revision-61/after/ocean-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 66 | `test-results/smooth-home-i34/revision-61/after/ocean-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 67 | `apps/web/public/images/islands/ocean-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 68 | `content/smooth-finish-i34/derived/ocean-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 69 | `test-results/smooth-home-i34/revision-61/after/dinosaurs-smooth.png` | 全体・最大辺700px（原画像より拡大しない） |
| 70 | `test-results/smooth-home-i34/revision-61/after/dinosaurs-source.png` | 全体・最大辺750px（原画像より拡大しない） |
| 71 | `apps/web/public/images/islands/dinosaurs-v1.webp` | 全体・最大辺600px（原画像より拡大しない） |
| 72 | `content/smooth-finish-i34/derived/dinosaurs-registered.png` | 全体・最大辺650px（原画像より拡大しない） |
| 73 | `test-results/smooth-home-i34/revision-61/after/ocean-source.png` | crop [960, 535, 1150, 735]・1倍（原寸） |
| 74 | `test-results/smooth-home-i34/revision-61/after/ocean-source.png` | crop [475, 1135, 645, 1335]・1倍（原寸） |
| 75 | `test-results/smooth-home-i34/revision-61/after/ocean-source.png` | crop [645, 870, 920, 1110]・1倍（原寸） |
| 76 | `test-results/smooth-home-i34/revision-61/after/dinosaurs-source.png` | crop [260, 220, 990, 900]・1倍（原寸） |
| 77 | `content/smooth-finish-i33/references/home-target.png` | 全体・最大辺1000px（原画像より拡大しない） |
| 78 | `test-results/smooth-home-i34/revision-61/after/princess-source.png` | crop [510, 510, 550, 540]・1倍（原寸） |
| 79 | `test-results/smooth-home-i34/revision-61/after/princess-source.png` | crop [805, 650, 850, 720]・1倍（原寸） |
| 80 | `test-results/smooth-home-i34/revision-61/after/magic-source.png` | crop [730, 770, 835, 805]・1倍（原寸） |
| 81 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-only.png` | crop [330, 1030, 1470, 1240]・1倍（原寸） |
| 82 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-erased.png` | crop [330, 1030, 1470, 1240]・1倍（原寸） |
| 83 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-only.png` | crop [460, 1430, 590, 1500]・1倍（原寸） |
| 84 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-erased.png` | crop [460, 1430, 590, 1500]・1倍（原寸） |
| 85 | `test-results/smooth-home-i34/revision-55/after/vehicles-source.png` | crop [760, 540, 1310, 1120]・1倍（原寸） |
| 86 | `test-results/smooth-home-i34/revision-55/extra/vehicles-r19-only.png` | crop [350, 1140, 410, 1290]・2倍（旧55 source画素の解析用拡大） |
| 87 | `test-results/smooth-home-i34/revision-55/extra/vehicles-r10-only.png` | crop [250, 795, 315, 1105]・2倍（旧55 source画素の解析用拡大） |
| 88 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-only.png` | crop [350, 1140, 410, 1290]・1倍（原寸） |
| 89 | `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-only.png` | crop [250, 795, 315, 1105]・1倍（原寸） |

眼9のこの段階での追加再表示はなし。上記同一SHA/bytesの直前限定原本を参照した。

## 7. manifest照合

| ファイル | SHA一致 | manifest bytes一致 |
| --- | --- | --- |
| `extra/robots-neck-direct2.png` | true | true |
| `extra/robots-r19-only.png` | true | true |
| `extra/robots-r19-only-direct2.png` | true | true |
| `extra/robots-r19-erased.png` | true | true |
| `extra/robots-r19-erased-direct2.png` | true | true |
| `extra/vehicles-wheel-direct2.png` | true | true |
| `extra/vehicles-hood-direct2.png` | true | true |
| `extra/vehicles-bumper-direct2.png` | true | true |
| `extra/vehicles-r19-only.png` | true | true |
| `extra/vehicles-r19-only-direct2.png` | true | true |
| `extra/vehicles-r19-erased.png` | true | true |
| `extra/vehicles-r19-erased-direct2.png` | true | true |
| `extra/vehicles-r10-only.png` | true | true |
| `extra/vehicles-r10-only-direct2.png` | true | true |
| `extra/vehicles-r10-erased.png` | true | true |
| `extra/vehicles-r10-erased-direct2.png` | true | true |
| `extra/princess-face-direct2.png` | true | true |
| `extra/magic-face-direct2.png` | true | true |
| `extra/flowers-stems-direct2.png` | true | true |
| `after/flowers-source.png` | true | true |
| `after/dinosaurs-source.png` | true | true |
| `after/construction-source.png` | true | true |
| `after/robots-source.png` | true | true |
| `after/ocean-source.png` | true | true |
| `after/princess-source.png` | true | true |
| `after/space-source.png` | true | true |
| `after/vehicles-source.png` | true | true |
| `after/animals-source.png` | true | true |
| `after/magic-source.png` | true | true |
| `after/flowers-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/dinosaurs-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/construction-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/robots-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/ocean-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/princess-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/space-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/vehicles-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/animals-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `after/magic-smooth.png` | true | manifest記載なし／本報告で前後記録 |
| `eyes-native/princess-parent-only-320.png` | true | true |
| `eyes-native/princess-parent-only-1600.png` | true | true |
| `eyes-native/princess-parent-only-direct2.png` | true | true |
| `eyes-native/magic-parent-only-320.png` | true | true |
| `eyes-native/magic-parent-only-1600.png` | true | true |
| `eyes-native/magic-parent-only-direct2.png` | true | true |
| `eyes-native/dinosaurs-parent-only-320.png` | true | true |
| `eyes-native/dinosaurs-parent-only-1600.png` | true | true |
| `eyes-native/dinosaurs-parent-only-direct2.png` | true | true |

## 8. 確認前後のSHA256/bytes原記録

前: 2026-10-13T00:05:08.7416525+09:00。後: 2026-10-13T00:15:45.9252483+09:00。83/83同一、変化0。参照画像についても識別と改変有無の記録だけで、画像を報告に添付していない。

| 入力ファイル | bytes前 | bytes後 | SHA256前 | SHA256後 |
| --- | ---: | ---: | --- | --- |
| `test-results/smooth-home-i34/revision-61/after/animals-smooth.png` | 111941 | 111941 | `ea2aaf98cfb69866c2891300863f678cb05b2eb9dcf928878c8fa22dc75aa6d7` | `ea2aaf98cfb69866c2891300863f678cb05b2eb9dcf928878c8fa22dc75aa6d7` |
| `test-results/smooth-home-i34/revision-61/after/animals-source.png` | 1307762 | 1307762 | `75fed69e507ea6115d486abfb8f8ba0e53fc51bf270e78af4fd10d83ed7e9b63` | `75fed69e507ea6115d486abfb8f8ba0e53fc51bf270e78af4fd10d83ed7e9b63` |
| `test-results/smooth-home-i34/revision-61/after/construction-smooth.png` | 76522 | 76522 | `f396438c456b2ead79d758e6d0dd56d4e113a4b7c17e22b85ed5729278695508` | `f396438c456b2ead79d758e6d0dd56d4e113a4b7c17e22b85ed5729278695508` |
| `test-results/smooth-home-i34/revision-61/after/construction-source.png` | 718990 | 718990 | `ca7523f33d8a0ed995ccbb5b5b901a086bd5f5dc5e2517de1c3308dd5f129f29` | `ca7523f33d8a0ed995ccbb5b5b901a086bd5f5dc5e2517de1c3308dd5f129f29` |
| `test-results/smooth-home-i34/revision-61/after/dinosaurs-smooth.png` | 77894 | 77894 | `5a416774727172b42ddfe2512d32e4faf6b07b34cf107142ff849650c3905be3` | `5a416774727172b42ddfe2512d32e4faf6b07b34cf107142ff849650c3905be3` |
| `test-results/smooth-home-i34/revision-61/after/dinosaurs-source.png` | 912909 | 912909 | `9789bc9f83b866a7bc339c3e649efbfc5d6ca13f69d7fd94ea11debed3a8316a` | `9789bc9f83b866a7bc339c3e649efbfc5d6ca13f69d7fd94ea11debed3a8316a` |
| `test-results/smooth-home-i34/revision-61/after/flowers-smooth.png` | 85698 | 85698 | `60ebbfdac30888b421f8083e7b6b1f3ef8d3ec4dffe9587dc39b2f41b8b9e9e4` | `60ebbfdac30888b421f8083e7b6b1f3ef8d3ec4dffe9587dc39b2f41b8b9e9e4` |
| `test-results/smooth-home-i34/revision-61/after/flowers-source.png` | 925558 | 925558 | `182fd8812d382b8cbb3f295a553ddd6fe27ab6d1557f5713d5cc94cbb0d7f693` | `182fd8812d382b8cbb3f295a553ddd6fe27ab6d1557f5713d5cc94cbb0d7f693` |
| `test-results/smooth-home-i34/revision-61/after/magic-smooth.png` | 93735 | 93735 | `dc1dd2442b12b6a7a8ae8720940122dfbfb2ebbfa0c332acd809cd19ffbd58ff` | `dc1dd2442b12b6a7a8ae8720940122dfbfb2ebbfa0c332acd809cd19ffbd58ff` |
| `test-results/smooth-home-i34/revision-61/after/magic-source.png` | 1062036 | 1062036 | `3a43416116543ab9dc3ca2d02a26670f6a4874a5fa5957ea789c54df692183f1` | `3a43416116543ab9dc3ca2d02a26670f6a4874a5fa5957ea789c54df692183f1` |
| `test-results/smooth-home-i34/revision-61/after/ocean-smooth.png` | 91283 | 91283 | `171286902f5f994e77cce6dcfead703c824198b7b6e119e65c187ecf33cb3710` | `171286902f5f994e77cce6dcfead703c824198b7b6e119e65c187ecf33cb3710` |
| `test-results/smooth-home-i34/revision-61/after/ocean-source.png` | 1047611 | 1047611 | `0d7160767e64be0be7216c9fdde014dc39f3f32e2c05a0fc2009f203a354c33a` | `0d7160767e64be0be7216c9fdde014dc39f3f32e2c05a0fc2009f203a354c33a` |
| `test-results/smooth-home-i34/revision-61/after/princess-smooth.png` | 92050 | 92050 | `7e44448ac18e40de60d85d6cabd252d445349822ba622cacedc920f80c6b4ae5` | `7e44448ac18e40de60d85d6cabd252d445349822ba622cacedc920f80c6b4ae5` |
| `test-results/smooth-home-i34/revision-61/after/princess-source.png` | 1065587 | 1065587 | `7122d46a606fa0ec629097414364c7347b1b83abe7a26a259532555fa63724fd` | `7122d46a606fa0ec629097414364c7347b1b83abe7a26a259532555fa63724fd` |
| `test-results/smooth-home-i34/revision-61/after/robots-smooth.png` | 62729 | 62729 | `7dd0c6b3c8a365d839fd12aafbcb29cddb90a472555ee171f78f1b82f811b842` | `7dd0c6b3c8a365d839fd12aafbcb29cddb90a472555ee171f78f1b82f811b842` |
| `test-results/smooth-home-i34/revision-61/after/robots-source.png` | 601357 | 601357 | `c7914a0394ebad5ee1d7590afa3629c856df82272534e08e1c6daf63362b1d31` | `c7914a0394ebad5ee1d7590afa3629c856df82272534e08e1c6daf63362b1d31` |
| `test-results/smooth-home-i34/revision-61/after/space-smooth.png` | 76858 | 76858 | `fa8dc144c3f73df985979d3998b80ab64acaad3409ab799e778b3eeae68a6854` | `fa8dc144c3f73df985979d3998b80ab64acaad3409ab799e778b3eeae68a6854` |
| `test-results/smooth-home-i34/revision-61/after/space-source.png` | 733174 | 733174 | `99007889e85f2d6282b016aeb854b4233193b0e02a15b4e1c980acb805b45f3f` | `99007889e85f2d6282b016aeb854b4233193b0e02a15b4e1c980acb805b45f3f` |
| `test-results/smooth-home-i34/revision-61/after/vehicles-smooth.png` | 55020 | 55020 | `a1d049d21d493780621ac7118f4a882e27b6bb7a30d2464818205e7171bdb06e` | `a1d049d21d493780621ac7118f4a882e27b6bb7a30d2464818205e7171bdb06e` |
| `test-results/smooth-home-i34/revision-61/after/vehicles-source.png` | 508721 | 508721 | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` |
| `test-results/smooth-home-i34/revision-61/extra/flowers-stems-direct2.png` | 304297 | 304297 | `ebe394bd96e6a03c39bc26f0a775362d63d9c8e8c4e39daff9e292ac69dce88d` | `ebe394bd96e6a03c39bc26f0a775362d63d9c8e8c4e39daff9e292ac69dce88d` |
| `test-results/smooth-home-i34/revision-61/extra/magic-face-direct2.png` | 452810 | 452810 | `baf9a6889adf855354d180176c049f907bd367438a01e5f2347738d16157af8a` | `baf9a6889adf855354d180176c049f907bd367438a01e5f2347738d16157af8a` |
| `test-results/smooth-home-i34/revision-61/extra/princess-face-direct2.png` | 616869 | 616869 | `bd13196f7012eee6bf50ec6f92de137383793c6ff033a63f3e8db2fcce05f765` | `bd13196f7012eee6bf50ec6f92de137383793c6ff033a63f3e8db2fcce05f765` |
| `test-results/smooth-home-i34/revision-61/extra/robots-neck-direct2.png` | 32137 | 32137 | `42c6f49b12bb007bc7fdfc91970f83b91d51caadc195e58eb11020452e01277d` | `42c6f49b12bb007bc7fdfc91970f83b91d51caadc195e58eb11020452e01277d` |
| `test-results/smooth-home-i34/revision-61/extra/robots-r19-erased-direct2.png` | 26959 | 26959 | `1822184eca528c9f927c97ade6f1cbf6955484530fe5a48385e5040357a0c741` | `1822184eca528c9f927c97ade6f1cbf6955484530fe5a48385e5040357a0c741` |
| `test-results/smooth-home-i34/revision-61/extra/robots-r19-erased.png` | 600205 | 600205 | `a552317673313895fce8d25da479cdbda8ad6d89c8d21f1487db89758de71e04` | `a552317673313895fce8d25da479cdbda8ad6d89c8d21f1487db89758de71e04` |
| `test-results/smooth-home-i34/revision-61/extra/robots-r19-only-direct2.png` | 16529 | 16529 | `2b84c8b7c49ae5f817055a06836f76c965783cceb4a768de0d37c76aa0a13be9` | `2b84c8b7c49ae5f817055a06836f76c965783cceb4a768de0d37c76aa0a13be9` |
| `test-results/smooth-home-i34/revision-61/extra/robots-r19-only.png` | 257266 | 257266 | `2fe188a02e7670116399eb60e9744fae3929bac8804622bdb29e90c75e1405a8` | `2fe188a02e7670116399eb60e9744fae3929bac8804622bdb29e90c75e1405a8` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-bumper-direct2.png` | 19698 | 19698 | `5ed191db96eede2b59301721b85b658d87f4dac80263495f6700672975673c21` | `5ed191db96eede2b59301721b85b658d87f4dac80263495f6700672975673c21` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-hood-direct2.png` | 24376 | 24376 | `43a8acefbfad119ab590f154b007d694c871f4633ff42cceccea186df24276fe` | `43a8acefbfad119ab590f154b007d694c871f4633ff42cceccea186df24276fe` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-erased-direct2.png` | 131833 | 131833 | `162e37197887bb44d3fc81937cb0aa091fd10de9769c972e3f0e80738deddcd3` | `162e37197887bb44d3fc81937cb0aa091fd10de9769c972e3f0e80738deddcd3` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-erased.png` | 474657 | 474657 | `322cc549df4dd4f9b3fe02c976a78ea865e9e5b320dddc36fef84e492138b0f5` | `322cc549df4dd4f9b3fe02c976a78ea865e9e5b320dddc36fef84e492138b0f5` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-only-direct2.png` | 112072 | 112072 | `e0afc27d2039dbe3d739c32cda112f075630bbe323260450e37706d64989ce3d` | `e0afc27d2039dbe3d739c32cda112f075630bbe323260450e37706d64989ce3d` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r10-only.png` | 285783 | 285783 | `59fedd3f4cb3767ab242c922e5ae316ca32749fb9463f6416cd52cc097147bc3` | `59fedd3f4cb3767ab242c922e5ae316ca32749fb9463f6416cd52cc097147bc3` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-erased-direct2.png` | 123054 | 123054 | `29fe1ab76edd796243f0da281580de98d5aef3fd80b2aab7a5f7be0c3a558d8f` | `29fe1ab76edd796243f0da281580de98d5aef3fd80b2aab7a5f7be0c3a558d8f` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-erased.png` | 506253 | 506253 | `fbd57623fe8781aff379b97d5230c0e1406a2ae759db4e0eafa31d119f86e7a3` | `fbd57623fe8781aff379b97d5230c0e1406a2ae759db4e0eafa31d119f86e7a3` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-only-direct2.png` | 93548 | 93548 | `85ccb16db70c476c039ffb8d356486e400c966b1d678436cbb0bfdb8bb7597d5` | `85ccb16db70c476c039ffb8d356486e400c966b1d678436cbb0bfdb8bb7597d5` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-r19-only.png` | 243045 | 243045 | `8d53efaad99ace4a8ff77410b9f2e5d4a7e291a3cd0ca7699cf7f922c560e25e` | `8d53efaad99ace4a8ff77410b9f2e5d4a7e291a3cd0ca7699cf7f922c560e25e` |
| `test-results/smooth-home-i34/revision-61/extra/vehicles-wheel-direct2.png` | 27236 | 27236 | `87080fcf97341556398a1eeaedd4c103198415fdf32e2ec88b15a0214932eca6` | `87080fcf97341556398a1eeaedd4c103198415fdf32e2ec88b15a0214932eca6` |
| `test-results/smooth-home-i34/revision-61/eyes-native/dinosaurs-parent-only-1600.png` | 640100 | 640100 | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` |
| `test-results/smooth-home-i34/revision-61/eyes-native/dinosaurs-parent-only-320.png` | 63830 | 63830 | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` |
| `test-results/smooth-home-i34/revision-61/eyes-native/dinosaurs-parent-only-direct2.png` | 515213 | 515213 | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` |
| `test-results/smooth-home-i34/revision-61/eyes-native/magic-parent-only-1600.png` | 381571 | 381571 | `dea65702c335816ce0b1f186a32e12ca49543b792510168bb638a9485f5d5814` | `dea65702c335816ce0b1f186a32e12ca49543b792510168bb638a9485f5d5814` |
| `test-results/smooth-home-i34/revision-61/eyes-native/magic-parent-only-320.png` | 50304 | 50304 | `c81087f712b63910f5e1e5ed716bb0b8bad832a49b8ea0ebfc0edc94fcb9b44a` | `c81087f712b63910f5e1e5ed716bb0b8bad832a49b8ea0ebfc0edc94fcb9b44a` |
| `test-results/smooth-home-i34/revision-61/eyes-native/magic-parent-only-direct2.png` | 224671 | 224671 | `4670f721a376ed0d40bcc481850d30d3b841de0d54e9612a65e7a40ec37bbeab` | `4670f721a376ed0d40bcc481850d30d3b841de0d54e9612a65e7a40ec37bbeab` |
| `test-results/smooth-home-i34/revision-61/eyes-native/princess-parent-only-1600.png` | 387407 | 387407 | `6857e57eee22d2dbe71db6fffe1867e9f96dbf64f3b1870fee81156d5f637cde` | `6857e57eee22d2dbe71db6fffe1867e9f96dbf64f3b1870fee81156d5f637cde` |
| `test-results/smooth-home-i34/revision-61/eyes-native/princess-parent-only-320.png` | 49056 | 49056 | `ca41f96239aeb53baf9b8f3b9b9c6be43eb963ebffe90d9781463faa071e2267` | `ca41f96239aeb53baf9b8f3b9b9c6be43eb963ebffe90d9781463faa071e2267` |
| `test-results/smooth-home-i34/revision-61/eyes-native/princess-parent-only-direct2.png` | 263012 | 263012 | `8127562b40dd74c1406efcbd6ee3b98c649557a2861d4d44fa9ae46e86af48dd` | `8127562b40dd74c1406efcbd6ee3b98c649557a2861d4d44fa9ae46e86af48dd` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `apps/web/public/images/islands/animals-v1.webp` | 116844 | 116844 | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` |
| `content/smooth-finish-i34/derived/animals-registered.png` | 4086290 | 4086290 | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| `apps/web/public/images/islands/ocean-v1.webp` | 117204 | 117204 | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` |
| `content/smooth-finish-i34/derived/ocean-registered.png` | 3201467 | 3201467 | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |
| `apps/web/public/images/islands/dinosaurs-v1.webp` | 112290 | 112290 | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` |
| `content/smooth-finish-i34/derived/dinosaurs-registered.png` | 3137029 | 3137029 | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |
| `apps/web/public/images/islands/construction-v1.webp` | 120460 | 120460 | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` |
| `content/smooth-finish-i34/derived/construction-registered.png` | 2921595 | 2921595 | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` |
| `apps/web/public/images/islands/robots-v1.webp` | 104158 | 104158 | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` |
| `content/smooth-finish-i34/derived/robots-registered.png` | 2654867 | 2654867 | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` |
| `apps/web/public/images/islands/space-v1.webp` | 101528 | 101528 | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` |
| `content/smooth-finish-i34/derived/space-registered.png` | 2917940 | 2917940 | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| `apps/web/public/images/islands/vehicles-v1.webp` | 100210 | 100210 | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` |
| `content/smooth-finish-i34/derived/vehicles-registered.png` | 2422677 | 2422677 | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| `apps/web/public/images/islands/flowers-v1.webp` | 115326 | 115326 | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` |
| `content/smooth-finish-i34/derived/flowers-registered.png` | 3312036 | 3312036 | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `test-results/smooth-home-i34/revision-61/after/evidence.json` | 15834 | 15834 | `ee1cb76c4e028540e2806cbb041cfde191884472065ee8dba4ddecf618d33a06` | `ee1cb76c4e028540e2806cbb041cfde191884472065ee8dba4ddecf618d33a06` |
| `test-results/smooth-home-i34/revision-61/after/comparison.json` | 4388 | 4388 | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| `test-results/smooth-home-i34/revision-61/after/legacy-comparison.json` | 7134 | 7134 | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |
| `test-results/smooth-home-i34/revision-61/identity-before.json` | 323511 | 323511 | `86eefbd161783cd9a08435fc684a6c91d93686e8221d1133942a3bb96120c30b` | `86eefbd161783cd9a08435fc684a6c91d93686e8221d1133942a3bb96120c30b` |
| `test-results/smooth-home-i34/revision-61/extra-evidence.json` | 5776 | 5776 | `68fd7ecaf0b5707a3242aa4a20c0fecef5ca27e7da241168ed25c4e21e8d55fb` | `68fd7ecaf0b5707a3242aa4a20c0fecef5ca27e7da241168ed25c4e21e8d55fb` |
| `test-results/smooth-home-i34/revision-61/eyes-native-evidence.json` | 6255 | 6255 | `0e90158f69d9fc43a17ae4f7cb0d720d8b436f8e36092f2819192dacf81a4d25` | `0e90158f69d9fc43a17ae4f7cb0d720d8b436f8e36092f2819192dacf81a4d25` |
| `test-results/smooth-home-i34/revision-61/capture-extra.mjs` | 3593 | 3593 | `4cb4f0796ac1aead267e1bfbf6366a3b56fcb958fe83e4bd2050e1eb7f3233da` | `4cb4f0796ac1aead267e1bfbf6366a3b56fcb958fe83e4bd2050e1eb7f3233da` |
| `docs/audits/revision-58-source-visual-20261012.md` | 36645 | 36645 | `2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd` | `2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd` |
| `docs/audits/revision-61-eyes-prototype-20261012.md` | 12695 | 12695 | `c2c4eb52d6677a817edb59c255b1b5b215907f5da9c3302ea30a9fc087750971` | `c2c4eb52d6677a817edb59c255b1b5b215907f5da9c3302ea30a9fc087750971` |
| `docs/audits/revision-55-source-visual-20261012.md` | 31884 | 31884 | `e850b6e71536e3feb59a6efde8eceec236401191d46bb32e5c1204160bff44a7` | `e850b6e71536e3feb59a6efde8eceec236401191d46bb32e5c1204160bff44a7` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |
| `test-results/smooth-home-i34/revision-55/after/vehicles-source.png` | 490623 | 490623 | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r19-only.png` | 251147 | 251147 | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r10-only.png` | 312490 | 312490 | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` |

この報告は候補61に対する新しい限定source/art原本。過去のFAIL/PASS原本は変更していない。

