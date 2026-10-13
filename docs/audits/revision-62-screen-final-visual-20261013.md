# I34 revision62 実画面最終・独立目視原本

- 最終判定: **FAIL**。通常色の旧R61S-1は改善しているが、追加の逆明度で段付き境界、部分塗りの未着色眼端で淡い矩形帯が見える。source限定PASS・engine限定PASS・テスト成功は美術判定へ転用しない。
- 開始: 2026-10-13 14:07:44 UTC / 23:07:44 JST。20分以内の限定監査。
- build: `a95ad6a0c04f9327eba28ed61ddc222cfc8bb4246863155a45d421eea2d17d0e`。runtime: `74c1b959e505c5911eb697bfe8dbc543669d3223e59ebb7bb002170aaaf4dc1c`。
- 入力前固定: 2026-10-13T23:09:12.6698522+09:00。入力後固定: **2026-10-13T23:26:10.8683576+09:00**。最初の154入力と座標対応用の追加3入力、計**157入力すべてbytes/SHA256前後一致、差分0**。追加3入力は各読取前に別時刻を固定した。付属 `revision-62-screen-final-visual-20261013.inputs.json` に全件を保存。
- AGENTS.mdとgame-playtestの必要範囲を読んだ。単独・再委任なし・主モデル/effort継承。テスト/性能/画像生成/有料API/production/tests/素材/提供証拠/既存原本の変更なし。

## 最優先の観測

最優先の `browser-contours/princess-ear-cheek-z4-dpr2.png`、`browser-zoom/face-z4-dpr2.png`、`browser-zoom/face-z4-dpr3.png` を `view_image detail=original` で新表示した。`smooth-desktop/princess/actual-ui-export.png` も全体を原画素寸法で開き、元PNGの画像座標 [970,800,110,115]（left,top,width,height）を補間なしの110×115cropとしてメモリ内で再表示した。

この表示では旧R61S-1 world x807–816,y663–675の短い横段・茶色の突起を認めず、右頬の縦寄りの曲線が顎へ連続する。修正両端 (817.55,644)/(777.015,694) 周辺にも白筋・二重線・大きな折れを認めない。頬内側の明暗は残るが、隣の髪へ広く肌色が漏れた輪郭には見えない。実UI PNGの対応は2048/1600=1.28、旧残件は画像x1033–1045,y849–864、上端(1046.464,824.32)、下端(994.5792,888.32)。Chromeの眼・まつげ・口にも旧白短冊/二重上帯の再発をこの範囲では認めない。

この段階はWORKINGの局所観測であり、残りの指定画面を未表示のまま最終PASSにしていない。crop用に一度sandbox内TEMPへ保存した画像はview_imageからパスが見えず未表示。その後、元PNGをSystem.Drawingでメモリ内cropして表示できたものだけを上記根拠に数えた。元画像を変更していない。

## 新しい必須残件の先行保存

### R62S-1: 逆明度で右頬境界に段付き突出と尖った横段

`partial-cheek-browser-2/dark-face-pale-hair.png`（r07 #4A2B17、r06/r17 #FFF4BF）と `black-face-white-hair.png`（r07 #000000、r06/r17 #FFFFFF）を実Chrome4倍DPR2、1032×1290の原画素で新表示した。どちらにも右頬の顔側が髪へ突き出す角と、下側の尖った横段が同じ形で見える。

- 画像座標: 上側 **x550–587,y350–463** の境界に複数の段、下側 **x437–475,y577–596** に細長い尖り/水平区間。worldの近似位置は上側 **x824–839,y601–646**、下側 **x780–795,y689–697**。下記の対応方法と誤差を参照し、画像座標を一次証拠にする。
- 元画像を補間せずメモリ内crop **[520,335,90,145]** と **[415,555,90,60]** で各状態を再表示し、段と尖りを確認した。白背景や未塗り眼そのものではない。暗い顔と明るい髪の共有境界で見えている形の欠点。
- 再現: 同一candidate62で顔r07を暗色、前髪/右外髪r06/r17を明色へ個別塗りし、提供手順の4倍DPR2で右頬を表示する。取得原本のregionsと一致する条件。
- 影響: 通常の頬の丸みから急に角/横段へ変わり、輪郭の最終品質条件を満たさない。色を入れ替えただけで連続性が崩れるため、通常色のR61S-1改善だけでは輪郭完了にできない。
- 最小手順: この二色条件で共有境界と修正域の接続を診断し、色の描画順にかかわらず滑らかな輪郭になるよう局所修正。その後同条件の現画面を再取得して原寸確認。制作コードの原因までは本担当が断定しない。

### R62S-2: 部分塗り・未着色眼の右端に淡い矩形帯

`partial-cheek-browser-2/three-regions.png` と `blue-face-pink-hair.png` で、右側未着色眼の目尻近く **画像x530–561,y348–386** に、隣の髪の陰影と連続しない淡い矩形帯が見える。通常肌/茶髪では淡い黄褐色、青肌/桃髪では淡い桃色の帯として残る。眼の内部を白のままにする意図条件と、眼の外端にあるこの角張った帯を区別した。

この2状態を元画像の **[510,330,75,75]** の補間なしcropでも再表示し、淡い帯の直線的な上/右端を確認した。近似worldは **x816–829,y600–616**。白紙/白目は仕様条件として欠陥へ数えない。矩形帯を目の白い内部そのものと扱って消去済みにはしない。未着色眼単独の6画面は今回未表示であり、その別条件での再現までは断定しない。

再現は提供のthree-regions（r06/r17 #8C5A35、r07 #F8D8C6）、blue-face-pink-hair（r06/r17 #E83E8C、r07 #2598FF）を4倍DPR2で表示する条件。最小手順は眼端の描画/隣接面の接続をこの条件で診断し、角張った淡色帯を除いた現在画面を原寸で再確認すること。眼全体を塗ることで現象を隠す処置を完了判定にしない。

## 座標対応の根拠と限界

追加画面のevidenceはscale4/DPR2、canvas1030×1288、CSS515×644、transform=none、取得時の意図focus(812,668)を記録するが、最終pan x/yを保存していない。ArtworkCanvasのfocus/reveal動作もあるため、意図focusだけから正確なoffsetを断定しなかった。

現在templateのr07の元の鼻subpath（world bounds x718.790674–744.168376,y612.978516–632.502446）と、r06-onlyで残る鼻の黒線（画像x280–344,y381–430、R/G/B<20）を位置補助に使った。CSS×scale×DPRの倍率x2.575/y2.576から、近似offset(-1571.5598,-1198.6795)を得た。上記world範囲は少なくとも±2world程度の誤差を持つ近傍対応で、厳密なcoverage測定ではない。別の少数テクスチャ照合ではoffsetが安定せず、判定根拠に採用していない。欠点自体は原寸画像とcropで確認しており、近似world値だけから推測したものではない。

## 実表示・未表示と技術記録

今回は**15PNGパス、SHA256の異なる内容14**を新表示した。r06-r17-onlyとface-erasedは同一SHAなので重複内容を数えない。原寸crop7操作を加え、成功した画像表示操作は22。全103PNG、全native90条件、全10UI出力、全47予定画面を見たとはしない。必須FAILの原本確定を優先する親の指示で残り表示を停止した。

| 実表示区分 | パス数 | 範囲 |
| --- | ---: | --- |
| browser-contours | 3/9 | princess-ear-cheek、magic-chin、robots-neck、各z4-dpr2 |
| browser-zoom | 2/14 | face-z4-dpr2、face-z4-dpr3 |
| smooth-desktop actual-ui-export | 1/10 | princess全体と頬原寸crop |
| partial-cheek-browser-2 | 9/9 | r06-only、r06-r17-only、three-regions、face-erased、r06-erased、all-three-erased、dark-face-pale-hair、black-face-white-hair、blue-face-pink-hair |

browser-image-indexの103PNG中、今回表示したのは6パス。**残97PNGは未表示**。partial-cheekの追加9パスと合わせた全入力のdisplayed/viewsおよび未表示パス一覧を付属JSONへ保存した。未着色眼6、wizard4、mobile3、残りのzoom/他9テーマのUI PNG、残contours6を今回のPASS範囲へ入れない。

source原本 `revision-62-source-visual-20261013.md` は新73画像/85入力によるsource限定PASSとして参照した。全10ホーム比較はその原本の範囲だけで、今回新たにホーム画像を表示した数へ足していない。engine原本も静的/技術結合の限定PASSであり、本報告の実画面FAILを撤回する根拠にしていない。

保存済みtechnical-verificationは460unit成功、Chrome26成功、native90条件、眼100条件を記録する。identity-before/afterのbuild/runtime aggregateは指定値と一致し、after.unchanged=true。browser-image-indexは121件=103PNG+18JSON、SHA256 `992d71082a4bb8326df282779b194b2e3212fee31c2e0735f796aa9e2aea3be8`。supplementalは追加Chrome1成功/9状態/reload一致、最初のeraser toggle harnessFAILを別保持する。今回これらを再実行せず、技術成功と目視FAILを分けた。

## 境界

旧 `revision-61-screen-visual-20261013.md` のFAIL原本を保持する。通常色の旧局所改善と今回の新しい2件のFAILを分ける。P05 STOP、人間採用未受領、実機・実外部同期未確認、全体NOT READY、Visual基準未更新は別ゲートとして維持する。本担当が完了したのは、この固定入力・この表示範囲の独立原本保存である。
