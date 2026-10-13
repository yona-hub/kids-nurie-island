# I34 revision62 source/art 独立目視原本

- 判定: **限定PASS**。候補62の全10テーマのsmooth source・fit、提供された部分塗り/消去、未着色眼、直接2倍局所を今回新たに表示し、表示範囲にホーム同等の仕上げを妨げる必須欠陥を認めなかった。姫右頬の旧R61S-1相当位置は、sourceの直接1倍/2倍比較では連続した曲線へ改善している。
- **実画面の合格ではない。** 現在版Chrome、DPR、実UI出力、実機は今回未表示。61のscreen原本のFAILを撤回せず、R61S-1の実画面での解消を未確認として残す。全体はNOT READY。
- 対象: `test-results/smooth-home-i34/revision-62/`。build `a95ad6a0c04f9327eba28ed61ddc222cfc8bb4246863155a45d421eea2d17d0e`、runtime source `74c1b959e505c5911eb697bfe8dbc543669d3223e59ebb7bb002170aaaf4dc1c`。`identity-before.json`の記録を読んだ値であり、本担当による実行中build再測定ではない。
- 表示前固定: **2026-10-13T22:37:11.7651231+09:00**。表示終了後固定: **2026-10-13T22:44:32.7198016+09:00**。全85入力のSHA256・bytesは前後一致、差分0。原記録は [`revision-62-source-visual-20261013.inputs.json`](revision-62-source-visual-20261013.inputs.json)。今回新表示73画像の各行に`displayed: true`を記録した。
- 独立担当単独、主モデル/effort継承、再委任なし。AGENTS.mdとgame-playtestの目視・証拠分離手順を確認した。画像生成、性能測定、テスト実行、production/tests/素材/提供証拠/旧報告の変更なし。この新規原本と付属入力inventoryだけを保存する。

## 1. R61S-1相当位置のsource再確認

world座標は1600×2000基準。`prototype-shared-joined/`の比較4cropはworld **[740,620,130,110]**（left,top,width,height）、直接1倍130×110pxおよび直接2倍260×220px。旧`before-61`と`prototype-62`をそれぞれ原画素寸法で開いた。`extra/princess-face-direct2.png`はengineの3200×4000出力からworld **[490,430,430,430]**を切り出した860×860pxで、拡大補間ではない。取得手順`capture-extra.mjs`も読んだ。

旧61cropでは、右頬 **x807–816,y663–675** の滑らかな縦寄りの境界が短く折れ、茶色が突起として入る形を今回も確認できた。62の両cropではその突起がなく、頬下から顎へ曲率が連続する。顔全体の直接2倍でも同じ改善が見え、周囲を広くぼかして隣の髪へ肌色を出した状態には見えない。

| 確認位置 | 62での今回の観測 | 限定判定 |
| --- | --- | --- |
| 旧R61S-1 x807–816,y663–675 | 旧短い横段と茶色の突起を認めず、頬の曲線へつながる。 | source改善を確認 |
| 上端 y644付近、x816–819と周囲 | 修正域の上下で色境界がつながり、水平の白筋・縫い目・色付き外縁を認めない。 | 提供1倍/2倍範囲PASS |
| 下端 y694付近、x772–783と周囲 | 顎下への接続に白筋・段差・二重縁を認めない。肌の内側の明暗と輪郭の連続性を区別して見た。 | 提供1倍/2倍範囲PASS |
| 両眼、右まつげ根元 x828–842,y580–611、口、耳 | 顔直接2倍で虹彩・白目・上瞼・肌のつながりを再確認。一定幅の白い二重上帯、まつげ根元の白短冊、口周りの穴の再発を認めない。 | 提供顔範囲PASS |

`prototype-shared-joined/evidence.json`に記録されたprototype62の1600出力SHA256は、今回固定した現在の`after/princess-source.png`のSHA256 `861fa4abbd4d421abc84b0a510f2c99c0c1d4aba60bb61bde2380cd4e91f1547`と一致する。同JSONの「productionは61」という文言はprototype取得時点の説明として扱った。現在buildの説明へ転記していない。**不採用の`prototype-overlap/`は今回未表示で、joined/currentの証拠に混ぜていない。**

ここで旧screen FAILをPASSへ変更しない。61の実Chrome4倍DPR2/3と実UI PNGで指摘された形を、62の同条件で確認することが次の最小手順である。

## 2. 全10テーマの材質・顔・口・輪郭

全10のsource1600×2000、fit320×400、実ホーム島、私有registered参照を全て新表示した。材質の丸み、陰影の連続、友好的な顔、輪郭の滑らかさを比較した。構図・色・形状・眼の大きさを参照と同じにする条件にはしていない。私有RGBは内部の分析表示だけに用い、画像コピー・報告埋め込み・公開は行っていない。

| テーマ | 今回の現物所見と主なworld位置 | source/art |
| --- | --- | --- |
| princess | 髪の流れ、肌、衣服の折り目、宝石、ウサギの毛に材質差があり、fitでも顔を読める。右頬は上記の直接比較。顔[490,430,430,430]の眼・口・耳は直接2倍でもつながる。 | 限定PASS |
| magic | 顔[550,420,360,370]直接2倍で上瞼から肌へ暖色の陰影がつながり、太い白い二重枠を認めない。顎x737–823,y777–790に旧点/縞の再発なし。布、帽子、木の杖、灯りの金属を読み分けられる。顎790より下はこのdirect2範囲外。 | 限定PASS |
| space | 顔x830–1250,y740–1130、顎x921–1003,y1080–1104を含むsource全体を表示。眼・頬・口が友好的にまとまり、ヘルメット、服、機体の反射が保たれる。顔の専用直接2倍は今回提供範囲にない。 | 限定PASS |
| robots | 首x690–990,y805–895を直接2倍で確認。円筒の陰影がつながり、上/下縁に白筋や短い階段反復を認めない。胸、関節、手足に金属/暗色部品の材質差がある。 | 限定PASS |
| vehicles | 窓x820–1140,y575–810はガラス、ボンネットx1030–1298,y806–1076は連続した赤い塗り面として読める。タイヤ/hood/bumperの直接2倍に孤立暗線・大きな白欠けを認めない。部分塗りは次節で別確認。 | 限定PASS |
| construction | 窓下辺x684–1086,y844–1129を含むsource全体を表示。下弧がつながり、色帯の階段反復や白筋を認めない。ガラス、黄色い金属、履帯の材質が分かれる。専用直接2倍は今回未表示。 | 限定PASS |
| flowers | 茎/包装x600–1030,y870–1270を直接2倍で確認。交差部と付け根に白い隙間・二重線を認めない。花弁、葉、包み、リボンに厚みと異なる反射がある。丸い茎先端の観測は下記に残す。 | 限定PASS |
| animals | 犬口x574–741,y1110–1235を含むsource全体を表示。毛の柔らかい陰影と背景樹木の材質差、友好的な眼・口を保つ。黒い切れ込み穴や毛への色漏れを認めない。口の均一な縁は残る。 | 限定PASS |
| ocean | イルカ口x1020–1112,y595–693、魚口x568–620,y1255–1294、亀口x705–819,y990–1068を含むsource全体を表示。旧口周りの白穴・黒い孤立点・縁の切れの再発を認めない。甲羅、ヒレ、体、珊瑚に材質差がある。 | 限定PASS |
| dinosaurs | 顔x260–990,y220–900を含むsource/fitを表示。眼・頬・開いた口がまとまり、体・卵・岩に丸みと材質差がある。鼻孔と口後方の小さな平坦部は観測として残る。 | 限定PASS |

全体sourceは`view_image detail=original`で提供ファイルを全体表示した。全ての局所を別cropで原寸再表示したとはしない。追加のメモリ内crop表示はNodeのsharp読み込みがEPERMとなり出力されず、表示件数・判定根拠に数えていない。実際に直接2倍で確認したのは次節と実表示一覧に列挙した提供PNGだけである。

## 3. 部分塗り・消去と未着色眼

部分塗り/消去6つの1600×2000全体と、対応する直接2倍6cropを全て表示した。

| 状態対 | 実直接2倍のworld範囲（left,top,width,height） | 今回の観測 |
| --- | --- | --- |
| robots-r19-only / erased | [690,805,300,90]、600×180px | onlyは首の青#2598FF。erasedは首が白へ戻り、周囲の材質と黒線が残る。上下に白い線状欠け/新たな色付き外縁を認めない。 |
| vehicles-r19-only / erased | [340,980,300,350]、600×700px | onlyはタイヤ青#2598FF、erasedはタイヤが白へ戻る。旧R55-1の黒線左の白面側へ伸びる長い青帯を認めない。タイヤ上部の黒線接合の小さな尖り/隙間は現物に残るが、長い外側色帯とは区別した。 |
| vehicles-r10-only / erased | [240,780,300,420]、600×840px | onlyはボディ赤#E96759、erasedは対象ボディが白へ戻る。ドア左の白面側へ伸びる旧長い赤帯を認めない。周囲のタイヤ/下部の材質を保つ。 |

これは提示色・提示cropの限定判定であり、部分塗り全周の2倍/4倍、全色、輪郭外着色画素0の測定ではない。黒線接合の形を消去/解消済みとは記録しない。

未着色眼は姫/魔法/恐竜それぞれ320、1600、直接2倍の**9PNGを全て今回新表示**した。`eyes-native-evidence.json`のpaintsと取得手順`capture-eyes.mjs`を読み、親regionを肌色#F2D7BDで塗り、眼regionは塗らない提供条件を確認した。姫の上弧内は肌色へつながり、旧白帯や右まつげの白い短冊の再発を認めない。魔法/恐竜の未着色眼外周も、旧の太い二重外輪郭へ戻っていない。白い眼領域そのものは未着色条件として扱い、欠損と数えない。

## 4. 残る観測と次の最小手順

今回のsource/art範囲では必須修正を要求する欠陥を認めなかった。以下の観測を「消えた」とは書き換えない。

| 残る観測 | world座標 | 限定評価・必要なら行う最小改善 |
| --- | --- | --- |
| ウサギの片耳暗縁 | x1253–1290,y1221–1322 | 耳内側の陰影として読め、孤立暗線/白抜けとは判断しない。磨くなら連続性を保って周囲の光へなじませる。 |
| ウサギ/犬/亀の均一な口縁 | ウサギx1040–1121,y1404–1477／犬x575–738,y1113–1236／亀x706–821,y992–1068 | 縁は残る。今回の表示では友好的な表情と曲面を崩す必須欠陥とは判断しない。磨くなら同じ面の光源に沿って縁の強さを局所的に整える。 |
| 恐竜の鼻孔・口後方の小さな平坦部 | 鼻孔x330–373,y479–541およびx440–494,y511–571／口後方x598–710,y642–759 | 小面積の形のアクセントとして残る。広い顔/体の材質平板化と区別。さらに磨くなら隣接する曲面陰影へつなぐ。 |
| 丸い茎先端の重なり | x807–839,y1130–1149 | 包装折り目へ重なる形として残る。直接2倍で白い隙間/二重線の再発は認めない。 |
| 車タイヤ上部の黒線接合 | x414–497,y1008–1043付近 | only/erasedの直接2倍で小さな尖り/隙間を観測。黒線の接合と旧外側色帯を混同しない。全塗りだけで部分塗り全周の輪郭完了にはしない。 |

**次の最小手順は現在版の実画面確認。** 同じbuildのChrome4倍DPR2/3と実UI PNG原寸で、R61S-1のworld x807–816,y663–675、修正両端y644/694、にじみ/白筋、眼/まつげの再退行を確認する。sourceの曲線改善だけを根拠にscreen FAILを解消扱いにしない。実画面で残件が出ればその座標と現物を根拠に局所修正へ戻す。

P05性能停止、人間の素材採用未受領、実機・実外部同期未確認、全体NOT READY、Visual基準未更新は別の状態として維持する。テスト成功、geometry同一、画材画像同一は美術合格の代用にしていない。

## 5. 今回の実表示一覧

**73画像、全て新表示。** 現62画像48（source10・fit10・extra19・eyes9）、比較25（ホーム島10・private登録10・home-target1・joined比較4）。各ファイルを`view_image detail=original`で開いた。提供cropの実直接2倍と、1600sourceの全体表示を区別する。

`test-results/smooth-home-i34/revision-62/`を以下の相対パスの先頭に付ける。

```text
after/princess-source.png
after/princess-smooth.png
after/magic-source.png
after/magic-smooth.png
after/space-source.png
after/space-smooth.png
after/robots-source.png
after/robots-smooth.png
after/vehicles-source.png
after/vehicles-smooth.png
after/construction-source.png
after/construction-smooth.png
after/flowers-source.png
after/flowers-smooth.png
after/animals-source.png
after/animals-smooth.png
after/ocean-source.png
after/ocean-smooth.png
after/dinosaurs-source.png
after/dinosaurs-smooth.png
extra/princess-face-direct2.png
extra/magic-face-direct2.png
extra/robots-neck-direct2.png
extra/vehicles-wheel-direct2.png
extra/vehicles-hood-direct2.png
extra/vehicles-bumper-direct2.png
extra/flowers-stems-direct2.png
extra/robots-r19-only.png
extra/robots-r19-erased.png
extra/vehicles-r19-only.png
extra/vehicles-r19-erased.png
extra/vehicles-r10-only.png
extra/vehicles-r10-erased.png
extra/robots-r19-only-direct2.png
extra/robots-r19-erased-direct2.png
extra/vehicles-r19-only-direct2.png
extra/vehicles-r19-erased-direct2.png
extra/vehicles-r10-only-direct2.png
extra/vehicles-r10-erased-direct2.png
eyes-native/princess-parent-only-320.png
eyes-native/princess-parent-only-1600.png
eyes-native/princess-parent-only-direct2.png
eyes-native/magic-parent-only-320.png
eyes-native/magic-parent-only-1600.png
eyes-native/magic-parent-only-direct2.png
eyes-native/dinosaurs-parent-only-320.png
eyes-native/dinosaurs-parent-only-1600.png
eyes-native/dinosaurs-parent-only-direct2.png
prototype-shared-joined/before-61-cheek-direct1.png
prototype-shared-joined/before-61-cheek-direct2.png
prototype-shared-joined/prototype-62-cheek-direct1.png
prototype-shared-joined/prototype-62-cheek-direct2.png
```

比較参照21画像は次の通り。privateは内部分析表示のみ。

```text
apps/web/public/images/islands/princess-v1.webp
apps/web/public/images/islands/magic-v1.webp
apps/web/public/images/islands/space-v1.webp
apps/web/public/images/islands/robots-v1.webp
apps/web/public/images/islands/vehicles-v1.webp
apps/web/public/images/islands/construction-v1.webp
apps/web/public/images/islands/flowers-v1.webp
apps/web/public/images/islands/animals-v1.webp
apps/web/public/images/islands/ocean-v1.webp
apps/web/public/images/islands/dinosaurs-v1.webp
content/smooth-finish-i34/derived/princess-registered.png
content/smooth-finish-i34/derived/magic-registered.png
content/smooth-finish-i34/derived/space-registered.png
content/smooth-finish-i34/derived/robots-registered.png
content/smooth-finish-i34/derived/vehicles-registered.png
content/smooth-finish-i34/derived/construction-registered.png
content/smooth-finish-i34/derived/flowers-registered.png
content/smooth-finish-i34/derived/animals-registered.png
content/smooth-finish-i34/derived/ocean-registered.png
content/smooth-finish-i34/derived/dinosaurs-registered.png
content/smooth-finish-i33/references/home-target.png
```

**今回未表示:** 全てのChrome実画面・browser-contours・browser-zoom・実UI export・gallery、native-zoom全90状態、全色、全装飾、blank/crayon/pencil全状態、実機、および不採用overlap案。これらの合格へ拡張しない。

## 6. 入力固定と記録の限界

85入力は73画像と12文書/JSON/取得手順。全件の表示前後SHA256・bytes、画像の実表示有無、privateフラグを付属inputsに保存した。85/85前後同一、変更0。`extra-evidence.json`29レコードと`eyes-native-evidence.json`9レコードのSHA256/bytesも全件現物一致、各不一致0。`after/evidence.json`は10テーマの記録として読んだ。

`local-change-check.json`の姫r06/r07/r17だけのsmooth塗り面path/bounds変更、他9template・全10通常geometry・全画材画像同一という機械記録を読んだ。本担当が制作コードの因果診断を行った、またはこの同一性で美術判定を代替したという意味ではない。

61 source原本の冒頭・参照入力を特定する部分と61 screen原本のR61S-1記述を読み、旧観測と座標の出所にした。過去のFAIL/PASS原本を変更していない。本報告は候補62の新しい限定source/art原本である。
