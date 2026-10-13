# I34 revision 33 source 全10テーマ 独立最終目視原本

判定: **PASS — 候補33の保存 source 全10テーマの美術仕上げ・輪郭目視について、既存の I34 受入範囲で受入可。** 実 home と登録参照を比較し、材質に沿う滑らかな明暗、顔・眼・口・部材の接続、主輪郭の連続性を確認した。ブロッカーだった人物眼 B03-1 は現在の after 画像でも解消し、B01〜B08 の旧不良の再発や、新しい独立ブロッカーを認めなかった。

既存の非ブロッカーの仕上げ差は残る。下記に座標と内容を維持し、「すべての差が消えた」「全画素の漏れがゼロ」とは判定しない。この PASS は **source の美術・輪郭検査に限定**し、native・Chrome・実機・性能、全状態や全配色、利用者の採用の合格ではない。

独立担当: `/root/i34_finish_visual`。画像を実際に表示して単独で判断した。制作・描画コードや素材を編集せず、旧 FAIL 原本と候補33 prototype 限定 PASS 原本は保持した。新規保存は本報告のみ。他の担当の変更を戻していない。再委任、モデル・effort 変更、性能測定、外部通信・外部サービス・有料 API・公開は行っていない。

## 対象と採証

- 確認前 SHA256: 2026-10-12T18:47:42.4730554+09:00
- 確認後 SHA256: 2026-10-12T18:54:59.5565016+09:00
- source10、detail10、登録参照10、home参照3、指定 JSON4 の計37ファイルは、確認前後の SHA256 とサイズがすべて一致。
- 座標は world/source 1600×2000、左上 (0,0) を原点とする概略範囲。detail の2倍表示後の座標ではない。

現在の `test-results/smooth-home-i34/revision-33/after/*-source.png` 全10枚（1600×2000）を実表示した。テーマは princess、magic、animals、ocean、dinosaurs、construction、robots、space、vehicles、flowers。指定 detail の `{princess,magic,space,ocean,fish,vehicles,robots,bunny,dog,turtle}-detail.png` 全10枚も実表示した。

比較資料の `content/smooth-finish-i34/derived/*-registered.png` 全10枚も現在版を全体表示した。加えて実 home の `apps/web/public/images/islands/princess-v1.webp`、`magic-v1.webp`、`content/smooth-finish-i33/references/home-target.png` を今回あらためて表示した。private 登録原画は分析専用であり、公開・配信用にコピーしていない。

親から提供された対象識別は次の通り。これはこの担当が build や runtime の実行結果を承認したという意味ではない。

| 識別対象 | 親提供 SHA256 |
| --- | --- |
| 固定 build | `1a15263b71b2d03d2b4b3e441b78f85ca818178aef00bb1d4ca861861ba9d9db` |
| runtime source | `eda805867c572d40e172de809cec16bdb05cdfea981c640749243e1904c35794` |

## 基準と証拠の扱い

`AGENTS.md`、I34 の指定、候補23・26の独立 FAIL 原文、候補24の口限定 PASS 原文、候補28と32の原本および候補33 prototype 原本に沿う。同じ形状、構図、選択色、虹彩比率、白目幅、反射位置を複製することを条件にせず、材質・陰影・滑らかさ・顔や部材への馴染みを判断した。旧候補で非ブロッカーとした軽微な差を解消扱いにせず、基準も変更していない。

`after/evidence.json` のテーマ・palette・template/geometry 識別情報を読み取り、`comparison.json`、`legacy-comparison.json`、`prototype-equivalence.json` も読み取った。comparison は geometry と blank/crayon/pencil の不変、smooth の変更を記録し、legacy-comparison は旧版各画材の不変を記録している。これらは提供された比較記録であり、この担当が旧画材や全状態を再描画・再検証したとは主張しない。

prototype-equivalence の人物3 source SHA256 は今回の after source の SHA256 と対応している。しかし prototype の限定 PASS をハッシュ一致だけで全10の PASS に広げていない。現在の after 人物3の全体・detail・原寸眼を実表示し、さらに残り7テーマを新たに実表示して判定した。制作担当の修正説明、テスト成功、比較 JSON の成功値は美術 PASS の根拠ではない。

## B01〜B08 の現在画像による再判定

| ID | 現在確認した位置（world x / y） | 判定と観測 |
| --- | --- | --- |
| B01 | magic 顎下・首 x737–823 / y777–790 | **PASS（旧点列の解消）**。原寸の顎下は連続した暖色の影で、ビーズ状の点列の再発を確認しない。 |
| B02 | space 顎下・ヘルメット内縁 x921–1003 / y1080–1104 | **PASS（旧縞の解消）**。顎下の影が連続し、灰色・明色の櫛状の反復を確認しない。 |
| B03-1 | princess 左 x607–707 / y507–607、右 x744–850 / y543–640。magic 左 x682–755 / y579–666、右 x824–900 / y614–702。space 左 x918–1017 / y915–1030、右 x1084–1184 / y886–1005 | **PASS（眼と肌のつながり）**。候補32の上瞼外側の暗線と虹彩上縁の間の一定幅の淡い帯は、現在33でも独立した二重枠として読めない。上側で虹彩の暗部と瞼が接続し、肌側の影へつながる。側面・下側の白目は曲面の余白として残り、候補29の暗い楕円の貼付や、旧下白目の台座へ戻っていない。 |
| B03-2 | princess 右まつげ根元 x828–842 / y580–611 | **PASS（接続）**。上瞼からまつげ根元まで暗い形が連続する。原寸と nearest-neighbor 3倍表示で白い短冊切れ・矩形穴の再発を確認しない。 |
| B04 | ocean イルカ口 x1020–1112 / y595–693 | **PASS（旧段差・まだらな縁の解消）**。暗い口腔から一つの舌へ連続する。右上内部の小さな折れは残るが、切り貼り状の段差や口の分断へ戻っていない。 |
| B05 | ocean 魚口 x568–620 / y1255–1294 | **PASS（旧横帯の解消）**。小さい口腔内に舌が収まり、横短冊で分断される状態を確認しない。 |
| B06 | princess ウサギ口 x1038–1123 / y1385–1475 | **PASS（接続・重大退行の範囲）**。鼻下・左右マズル・口角・口腔・舌が連続し、舌だけが毛色の面へ浮く状態はない。口縁の均一さは下記の非ブロッカーとして残す。 |
| B07 | animals 犬口 x574–741 / y1110–1235 | **PASS（接続・重大退行の範囲）**。鼻下中央線から左右の弧、口腔へつながり、舌が口の内側へ収まる。毛色の広い切断はない。口縁の平たさを解消したとは判定しない。 |
| B08 | ocean 亀口 x705–819 / y990–1068 | **PASS（接続・重大退行の範囲）**。左右口角と口腔が舌を囲み、緑の顔へ舌だけを置いた状態に戻っていない。口縁の素材差は下記に残す。 |

B06〜B08 の旧指摘の閉鎖範囲は候補24・28と同じ。接続の限定 PASS を「登録参照との口縁の差がなくなった」という判定へ置き換えていない。現在の全体仕上げでは、それらの軽微な差が表情の構造や素材全体の読みを阻害する独立ブロッカーとは判断しない。

人物眼の上側に複数の弧や明るい部分があること自体は不良ではない。登録参照にも存在する。候補33で PASS とする根拠は、上瞼・虹彩・白目・肌が独立した太い枠に分離せず、一つの眼として読めること。主反射は姫・宇宙が右上、魔法が左上として読め、下側の小さな反射と虹彩の明暗が曲面を支える。反射位置の一致だけを根拠にしていない。

## 全10テーマの材質・顔・輪郭の現在確認

| テーマ | 実際に確認した範囲 | 仕上げ・輪郭の判断 |
| --- | --- | --- |
| princess | 顔・眼・眉・鼻・口・顎・首・耳、髪、両手、袖・ドレス・リボン・裾、ウサギの眼・鼻・口・耳・毛・足・尾 | **受入可。** 髪の束の光、布の折り目、肌と毛の明暗が読める。人物眼の独立した太い枠が解消し、表情が顔に馴染む。まつげ・ウサギ口の接続を維持。頬と髪、内耳の局所的な硬さは非ブロッカーとして残る。 |
| magic | 顔・眼・眉・鼻・口・顎下・首・耳、髪・帽子・襟、手・杖、ランタンの金属・ガラス・炎、布・靴 | **受入可。** 布・革・木・金属・ガラスの滑らかな明暗が区別でき、眼から肌へのつながりを維持する。顎下点列と旧襟 gap の明瞭な再発はない。 |
| animals | 犬・猫の顔・眼・眉・鼻・口・耳、毛・足・尾、木・葉・枝・地面の草 | **受入可。** 毛流れと木・葉の丸みが読み取れ、鼻・口と顔の接続を保つ。犬口縁の均一な帯は残るが、口腔・舌・マズルを切断する退行ではない。 |
| ocean | イルカ・亀・魚の眼・口・主輪郭、尾・ひれ・甲羅、泡・珊瑚・貝・ヒトデ | **受入可。** 水面光、甲羅の面、ひれ、貝・珊瑚・泡の素材光が読める。B04/B05/B08 の改善を維持。亀口縁の平たさは残るが、口の切断や主シルエットの欠損はない。 |
| dinosaurs | 顔・眼・眉・鼻孔・口・歯・舌、手足・爪、皮膚・腹・尾、卵・岩 | **受入可。** 皮膚・卵・岩の丸みと表面が読める。鼻孔と口の奥の平たさは以前と同じ非ブロッカー。歯・舌・口角の接続を保ち、表情の構造を切断する新規不良は認めない。参照との開口形状の差だけで白抜けとは判定しない。 |
| construction | アーム・油圧部・ピン・接続、車体・窓・金属、履帯・車輪、コーン | **受入可。** 金属の反射、ガラスと塗装の明暗、履帯の厚みが読める。油圧部の原寸確認でも旧ピンホールの明瞭な再発や主要接続の切断はない。 |
| robots | 顔・眼・眉・口、アンテナ、肩・肘・関節・手足、胸部・ボタン・金属面 | **受入可。** 表情が読め、球面・金属面と関節の丸みが続く。肘の青い接続を保ち、白 gap の明瞭な再発はない。 |
| space | 人物の顔・眼・眉・鼻・口・顎下、髪・ヘルメット・肩、服・手・靴、ロケット・窓・惑星・星 | **受入可。** 人物眼の二重枠と顎下縞が解消状態。肌・服・金属・ガラスの明暗が読め、眼が顔の中でつながる。旧二重口に見える鼻下弧は認めない。 |
| vehicles | 前後輪と上端、フェンダー・cap、灯火・窓・鏡、ボンネット・車体・バンパー | **受入可。** ガラス・灯火・塗装・金属・ゴムの素材が読める。旧 cap 突出や純白の切断 patch の再発はない。タイヤ上端の小さい波打ちを非ブロッカーとして維持する。 |
| flowers | 花びら・花芯・葉・茎、包み紙・リボン、蝶の眼・体・触角・翅 | **受入可。** 花びらの面と筋、紙・布の折り目と光が読める。主要な重なりと輪郭は連続し、新しい欠損・白筋・独立ブロッカーを認めない。 |

全体に広がる色のにじみ、白いハロー、素材間を切る大きい白筋、主シルエットの崩壊は、現在の表示範囲では認めなかった。原寸で局所的な縁の硬さや小さい段差は見えるため、それらを隠して無欠陥とは記録しない。

## 維持する非ブロッカーの残件

今回も解消扱いにせず、候補28以来の分類を維持する。座標は不良画素マスクではなく、所見を視認できる概略範囲。

| 対象 | world 座標 | 現在の所見と最小の調整単位 |
| --- | --- | --- |
| ウサギ・犬・亀の口縁 | ウサギ x1040–1121 / y1404–1477、犬 x575–738 / y1113–1236、亀 x706–821 / y992–1068 | 灰色・茶色・緑色の縁が均一な帯として見え、参照のマズルや口腔の影より平たい。追加で仕上げる場合は縁の明暗・終端の馴染みが最小単位。口の接続や舌を作り直す必要があるという観測ではない。 |
| vehicles 前後タイヤ上端 | 前 x416–512 / y1008–1043、後 x166–227 / y865–902 | 暗い空間との境界に小さい波打ちがある。追加調整は上端の曲線をなじませる局所範囲。旧突出・切断へ戻っていない。 |
| princess 右頬と髪、ウサギ内耳 | 頬 x812–834 / y625–675、内耳 x1253–1290 / y1221–1322 | 頬外縁の小さい段差と、内耳の暗い L 字の縁が周囲より硬い。局所の縁の強さをなじませる範囲で、広い色漏れや白ハローではない。 |
| dinosaurs 鼻孔・口の奥 | 鼻孔 左 x330–373 / y479–541、右 x440–494 / y511–571、口の奥 主に x598–710 / y642–759 | 濃い楕円とえんじ色の面が比較的均一。追加で深さを出す場合は鼻孔内と口奥の明暗・歯の接触影が最小単位。表情の構造の切断とは判定しない。 |
| 人物上瞼の側端の細い外縁 | magic 左 x742–749 / y606–636、右 x886–894 / y640–673、space 左 x1003–1013 / y951–978、右 x1171–1178 / y921–947 | 細い外縁は残るが、候補32の上中央から続く太い淡い帯と区別する。追加調整の最小単位は側端の縁・影の終端。B03 合格に追加修正が必要な残件とはしない。 |

## 原寸確認の補足

指定 detail に加え、以下をメモリ内の source / registered 原寸 crop として実表示した。範囲は xyxy、右端・下端を含まない。出力画像ファイルは作成していない。

| 対象 | 切り出し範囲 |
| --- | --- |
| 人物眼 source / registered | princess (600,505)–(855,655)、magic (670,570)–(915,720)、space (905,875)–(1195,1045) |
| 顎下 source / registered | magic (720,750)–(845,815)、space (905,1060)–(1025,1125) |
| 口元 source / registered | イルカ ocean (1000,570)–(1145,725)、魚 ocean (550,1240)–(635,1310)、ウサギ princess (1020,1370)–(1150,1500)、犬 animals (560,1095)–(760,1265)、亀 ocean (690,970)–(835,1090) |
| 恐竜顔 source / registered | dinosaurs (315,470)–(750,875) |
| 油圧接続 source | construction (620,240)–(920,555)、(200,535)–(410,755) |
| 車輪・窓縁 source | vehicles (400,990)–(540,1085)、(140,850)–(245,930)、(675,785)–(760,835) |
| 姫頬・ウサギ内耳 source | princess (800,615)–(850,685)、(1240,1200)–(1305,1340) |
| 姫まつげ根元 source | princess (818,570)–(850,620) を nearest-neighbor 3倍表示 |

## 未確認と判定の限界

この報告は保存済み source の全10テーマの独立美術・輪郭目視を完了した記録である。アプリの native/tiled/direct 一致、Chrome 表示・操作、ブラウザの1・2・4倍、物理端末、性能・P05、保存/reload/PNG/旧作品コピー、全配色・全状態、利用者の採用はこの担当では **未確認**。

別担当が進行中の Chrome/native 検査について、未提供の結果を成功扱いしていない。P05 性能停止は維持する。source crop と detail は保存画像の分析表示であり、ブラウザの倍率検証の代わりではない。旧 FAIL を自己上書きせず、候補33の現在の実画像に対する別原本として残す。

## 確認前後 SHA256

37ファイルはすべて確認前後で一致。表の SHA256 が開始・終了双方に対応する。パスはリポジトリルート相対。

| 証拠 | SHA256 | 前後 |
| --- | --- | --- |
| `apps/web/public/images/islands/magic-v1.webp` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | 一致 |
| `apps/web/public/images/islands/princess-v1.webp` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | 一致 |
| `content/smooth-finish-i33/references/home-target.png` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | 一致 |
| `content/smooth-finish-i34/derived/animals-registered.png` | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` | 一致 |
| `content/smooth-finish-i34/derived/construction-registered.png` | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` | 一致 |
| `content/smooth-finish-i34/derived/dinosaurs-registered.png` | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | 一致 |
| `content/smooth-finish-i34/derived/flowers-registered.png` | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` | 一致 |
| `content/smooth-finish-i34/derived/magic-registered.png` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | 一致 |
| `content/smooth-finish-i34/derived/ocean-registered.png` | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` | 一致 |
| `content/smooth-finish-i34/derived/princess-registered.png` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | 一致 |
| `content/smooth-finish-i34/derived/robots-registered.png` | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` | 一致 |
| `content/smooth-finish-i34/derived/space-registered.png` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | 一致 |
| `content/smooth-finish-i34/derived/vehicles-registered.png` | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/animals-source.png` | `521c0ad90b593e8aa1536448bab5842194540f0ad9ccdde33659d601f41313ed` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/bunny-detail.png` | `25e969564d8bf9abfe08bcd6e46e7908c1fae6c8ba5ed34e332402fe4e208b5a` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/comparison.json` | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/construction-source.png` | `a6a1522b4d972746e4518dbbed11dd4b2895ced1300bb56cc052c9d7f62cbe3d` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/dinosaurs-source.png` | `0967954718e3f3942e93f466c6a6634a65f7b33af4cb98f06bc829d70579b884` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/dog-detail.png` | `e874f6ca29fd65ff6084d6e0f3b9af0850a04f89f45f43f804382ce24a28ee55` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/evidence.json` | `b7d52bea7fbf948bfcab15646e454e30cf05c52bd078623638c53d2deca34be3` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/fish-detail.png` | `f86123de767aea3e6b6011551df2303e4914817785f7154e522845664705d68a` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/flowers-source.png` | `f214c8454b9c2ca6f6442ccef0aaf299ec05ba4c79c66d30edddf6497414e4c7` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/legacy-comparison.json` | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/magic-detail.png` | `c7ea6be521c430eea37b71f5958b7e64a72c1f606f90e75604dfcc2204767f6e` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/magic-source.png` | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/ocean-detail.png` | `00490f680e042252cabb2414fdf6561f0604437e6c63a64157b1c3c820eb736b` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/ocean-source.png` | `738f2d800afda938e80e17eff3455f58900f913a8b9a98fd2efcc652b162b059` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/princess-detail.png` | `178d06cd0e3ef760fb18a8ba74afbbed49d3f8d5092cac9d9c86721dba85eb6f` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/princess-source.png` | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/robots-detail.png` | `6bef3018ddc261ad769a1c0032bea38e26034d5213fcc1f3b7e8a9b12e7a9b02` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/robots-source.png` | `16535c770a2f82d09ad782232f5b20abc964441e0ea415fe0877dd0a0cd5f4d6` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/space-detail.png` | `7ad5ce767d4f9a5905f43592beb9858e7fd43f299e77a52b98038b016c053ee4` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/space-source.png` | `6faee3c90ff10e1d007a05e8a8aa734730b44b75b72697f587b36a3394f9d338` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/turtle-detail.png` | `ab2bbbb52ea0d9b36caa69daf4a2762d5a1b9195aa4830742ad7cc4b9ba62e8d` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/vehicles-detail.png` | `7257d1e6025c4e7bce53ecdcb98cbb465f71f7470970738864193d7459ba22ea` | 一致 |
| `test-results/smooth-home-i34/revision-33/after/vehicles-source.png` | `038baba072f3fbd9aee0ee23e76f6c98a3bc48c81459115a0a22b37c27852665` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype-equivalence.json` | `06443eb18dcfbe22b7b83f135e649c2356356a3cbe61f0856cc0d5830f96202d` | 一致 |

