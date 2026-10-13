# I34 候補28 source 独立目視報告

- 判定: **FAIL — 候補28のsourceによる美術仕上げに限定。人物眼B03-1の瞼・白目・虹彩・肌のつながりが不足し、home同等の最終品質には達していない。**
- 独立担当: /root/i34_finish_visual。制作・実装・証拠画像を変更せずに判定した。
- 確認前の採証: 2026-10-12T18:00:24.9405474+09:00
- 確認後の採証: 2026-10-12T18:08:13.9945462+09:00
- 対象: `test-results/smooth-home-i34/revision-28/after/*-source.png` 全10枚（1600×2000）と指定detail全10枚。
- 座標: world/source 1600×2000の左上を原点とするピクセル座標。目視による概略範囲であり、detailの拡大後の座標ではない。
- **B03-2の姫右まつげ根元の白い短冊切れは解消を確認。** B01/B02/B04/B05と、B06〜B08の接続・重大退行に関する改善も現在画像で維持している。

## 比較資料と実際の確認

source全10枚、`{princess,magic,space,ocean,fish,vehicles,robots,bunny,dog,turtle}-detail.png` 全10枚を実際に表示した。比較資料も、`content/smooth-finish-i34/derived/*-registered.png` 全10枚、実homeの `apps/web/public/images/islands/princess-v1.webp`、`magic-v1.webp`、`content/smooth-finish-i33/references/home-target.png` の3枚を表示した。私有原画はこの登録済み画像を分析に用いた。未登録の生成PNGを別途表示したという主張はしない。

比較対象は、材質に沿う明暗、顔の面と眼・口のつながり、輪郭の連続性、白抜け・漏れの見え方である。参照の構図、形状、選択色、白目幅、虹彩比率、反射位置を複製する条件にはしていない。sourceは現在の保存済み実レンダーを採点し、生成原画を完成品の代わりに評価していない。

`AGENTS.md`、`docs/storybook-improvement.md` のI34、候補26・23の独立FAIL原文、候補24の口元限定PASS原文を読んだ。過去の判定を現在版の証拠に転用せず、今回の表示画像から再判定した。実装者の修正説明、穴の画素数、unit・build・技術検査の成功は美術PASSの根拠にしていない。

## 残るブロッカー B03-1

**白い上弧が存在すること自体は不良ではない。registered参照にも白い三日月があり、原画と同じ形・幅にすることは要求しない。** 現在の不足は、その白目が上瞼の接触影と眼球の丸みによって肌へつながらず、暗い上縁・明るい白目・暗い虹彩が硬い別層として読める点である。実homeとregisteredでは、瞼の肌側に暖かい明暗があり、上縁から眼球へ落ちる影と周囲の肌の丸みが一続きに見える。

| 対象 | source座標 | 現在28で観測した不足 |
| --- | --- | --- |
| princess 人物眼 | 左x610–702,y515–602 / 右x749–845,y550–635。特に左上縁x623–692,y519–546、右上縁x762–830,y553–582 | まつげ根元の接続は回復した。しかし上側の暗い帯と細い明色弧の切り替わりは硬く、肌側に瞼の丸みをつなぐ明暗が弱い。頬・鼻・髪の柔らかい描き込みに対して、眼が独立した滑らかな部品として見える。 |
| magic 人物眼 | 左x686–753,y585–659 / 右x828–897,y620–695。特に左上縁x690–746,y587–615、右上縁x834–891,y624–650 | 暗い上瞼の直下の白い帯が比較的均一に明るく、虹彩上端へ硬く切り替わる。瞼の厚み・白目の面・周囲の肌が連続した照明として読めず、左右とも上縁が顔から浮く。 |
| space 人物眼 | 左x920–1018,y922–1026 / 右x1086–1183,y892–1003。特に左上縁x926–1008,y925–956、右上縁x1092–1172,y895–928 | 眼球上部の白い三日月と暗い虹彩との境界が硬く、その外側の暗い弧にも肌へつながる暖かい接触影が弱い。顔の丸い面と眼の照明が別々に見える。上白目が広いことだけを不合格理由にしていない。 |

候補26で記録された幅広い下白目の「台座」は、現在28では細くなり、同じ状態を明瞭には再現しない。この改善を認めた上で、現在の上瞼と白目・肌の一体感が不足しているためB03-1をFAILとする。候補26の灰色の二重弧が同じ画素で残るという判定でもない。

受入に必要なのは、現在の形状と選択色でも、瞼の厚みと接触影、白目・虹彩の丸い面、肌の照明が一つの眼として読めること。反射や虹彩の細部を増やしたことだけでは、この接続の確認にはならない。

### 観測と原因の推測の区別

上表は表示画像で観測した所見である。この担当は描画コードを検査しておらず、原因となる関数・合成順・パラメータは未確認。白目や肌へ影が十分に及んでいない、境界の硬さが周囲の肌の明暗に合っていない可能性は画像からの推測にとどめる。

次候補で検討中と共有された「上瞼の肌側へ暖かい接触影をつなぐ」は、上記の観測点に直接対応する。虹彩の比率変更は改善手段になり得るが、参照の比率への一致は受入条件にしない。下側虹彩の細かな光の変化は補助になり得るが、瞼・白目・肌の接続とは別に確認が必要である。反射は各参照の光を個別に見る必要があり、princess registeredの主反射も現在28と同様に上側の右寄りに見えるため、一律の左上移動だけを品質条件にはできない。これらは未作成候補のPASSを予告するものではない。

## 旧指摘の現在再判定

| ID | 対象とsource座標 | 現在28の判定と根拠 |
| --- | --- | --- |
| B01 | magic 顎下・首 x737–823,y777–790 | **PASS（旧点列の解消）**。顎下は連続した暖色の影で、ビーズ状の点列を確認しない。 |
| B02 | space 顎下・ヘルメット内縁 x921–1003,y1080–1104 | **PASS（旧縞の解消）**。茶色い顎下の影は連続し、灰色・明色の櫛状の反復を確認しない。 |
| B03-2 | princess 右目尻・まつげ根元 x828–842,y580–611 | **PASS（局所接続）**。上瞼からまつげ根元まで暗い一形としてつながり、以前の白い角張った短冊切れを確認しない。原寸cropと最近傍拡大でも確認した。37画素などの穴数をこの目視で検証したわけではない。 |
| B04 | ocean イルカ口 x1020–1112,y595–693 | **PASS（旧段差・まだらな縁の解消）**。暗い口腔から一つの舌へ連続する。右上の小さい内部の折れはあるが、以前の切り貼り状の段差へ戻っていない。 |
| B05 | ocean 魚口 x568–620,y1255–1294 | **PASS（旧横帯の解消）**。小さい暗い口腔に一つの舌が収まり、横短冊による分断を確認しない。 |
| B06 | princess ウサギ口 x1038–1123,y1385–1475 | **PASS（接続・重大退行の範囲）**。鼻下・左右マズル・口角・口腔・舌が連続する。舌が毛色の面へ単独で浮く状態はない。 |
| B07 | animals 犬口 x574–741,y1110–1235 | **PASS（接続・重大退行の範囲）**。鼻下の中央線から左右の弧と口腔へつながり、舌が口の内側に収まる。毛色による広い切断はない。 |
| B08 | ocean 亀口 x705–819,y990–1068 | **PASS（接続・重大退行の範囲）**。左右口角と口腔が舌を囲み、緑の顔へ舌だけが置かれる状態はない。 |

B06〜B08は候補24と同じ、接続回復と重大退行に限定したPASSである。口縁の素材としての仕上げ差がなくなったという判定へ広げない。候補23・26の当時のFAILや候補24の限定PASSは変更していない。

## 全10テーマの仕上げと輪郭の確認

| テーマ | 実際に確認した範囲と現在の所見 |
| --- | --- |
| princess | 全体、人物の顔・眼・眉・鼻・口、顎・首・両手、髪、服・リボン・裾、ウサギを確認。髪の光とドレスの折り目、毛の明暗は読める。人物眼の接続が最終仕上げを阻害する。まつげの白い短冊切れとウサギ口の切断は解消状態。右頬・髪の境界には局所的な硬さが残る。 |
| magic | 全体、顔・眼・眉・鼻・口、顎下・首・耳、襟、手、杖、ランタン、布・靴を確認。布・革・金属・ガラスの明暗は読める。人物眼の接続が最終仕上げを阻害する。顎下の点列と旧襟gapは確認しない。 |
| animals | 全体、犬・猫の顔・眼・鼻・口・耳、毛・足・尾、木・葉・枝・地面の草を確認。毛流れと木・葉の丸みは読める。犬口の接続回復と猫の口・ひげの可読性を確認。口縁の均一な帯は軽微な仕上げ差として残るが、新しい独立ブロッカーは確認しない。 |
| ocean | 全体、イルカ・亀・魚の眼・口と主輪郭、尾・ひれ・甲羅、泡・珊瑚・貝・ヒトデを確認。水面光・甲羅・貝などの素材光は読める。B04/B05/B08の改善を維持。亀口縁の平たさは軽微な残件で、新しい口の切断や主輪郭の欠損は確認しない。 |
| dinosaurs | 全体、顔・眼・鼻・口・歯・舌、手足・爪、体・尾、卵・岩を確認。皮膚と卵・岩の丸みは読める。鼻孔と口の奥は参照より平たいが、歯・舌・口角は連続し、今回の独立ブロッカーにはしない。 |
| construction | 全体、油圧部・接続・金属、窓・車体、履帯・車輪、コーンを確認。金属の反射、ガラス、車体の明暗は読める。旧油圧部ピンホールの明瞭な再発や主要輪郭の切断は確認しない。 |
| robots | 全体、顔・眼・眉・口、アンテナ、肘・肩・関節・手足、胸部と金属面を確認。表情と部材の丸みが読め、肘の青い接続は保たれる。旧白gapの明瞭な再発や新しい独立ブロッカーは確認しない。 |
| space | 全体、人物の顔・眼・眉・鼻・口、顎下、髪・ヘルメット・肩、服・手・靴、ロケット・惑星・星を確認。服・金属・ガラスの明暗は読める。人物眼の接続が最終仕上げを阻害する。顎下の縞と以前の二重口に見える鼻下弧は確認しない。 |
| vehicles | 全体、前後輪と上端、フェンダー/cap、灯火・窓・鏡、車体の明暗を確認。ガラス・灯火・金属・ゴムの素材は読める。旧capの突出や純白の切断patchは確認しない。タイヤ上端と暗い空間の境界の小さい波打ちは残る。 |
| flowers | 全体、花びら・花芯・葉・茎、包み紙・リボン、蝶の体・眼・触角・翅を確認。花びら、紙と布の光・折り目は読める。主要輪郭の欠損や新しい独立ブロッカーは確認しない。 |

全体に広がる色の漏れ、白いハロー、主シルエットの大きな崩壊は、今回の表示範囲では確認しなかった。これは全倍率・全配色で輪郭外画素が0という技術判定ではない。「新しい独立ブロッカーを確認しない」は、そのテーマの全状態や人間採用を承認する意味ではない。

## 非ブロッカーの残件

| 対象 | source座標 | 現在の所見 |
| --- | --- | --- |
| ウサギ・犬・亀の口縁 | ウサギx1040–1121,y1404–1477 / 犬x575–738,y1113–1236 / 亀x706–821,y992–1068 | 接続は保つが、灰色・茶色・緑色の縁が均一な帯として目立ち、参照の柔らかいマズル・肌・口腔の影より平たい。接続を壊す重大退行とは区別する。 |
| vehicles 前後タイヤ上端 | 前x416–512,y1008–1043 / 後x166–227,y865–902 | フェンダーとcapはつながる。暗い空間との境界に小さい波打ちがあり、輪の曲線に対して少し硬い。旧突出・切断の再発にはしない。 |
| princess 右頬と髪、ウサギ内耳 | 頬x812–834,y625–675 / 内耳x1253–1290,y1221–1322 | 顔外縁の局所的な段差と内耳の暗いL字状の線が、周囲の柔らかい明暗に比べ強い。広範囲の漏れ・白ハローではない。 |
| dinosaurs 鼻孔と口の奥 | 鼻孔 左x330–373,y479–541 / 右x440–494,y511–571、口の奥 主にx598–710,y642–759 | 鼻孔の濃い楕円と口の奥のえんじ色が比較的均一で、丸い面の深さや歯の接触影に差がある。表情の構造を切断する新規不良とは判定しない。 |

## 原寸cropと未確認範囲

指定detailに加え、現在sourceとregisteredの同座標cropをメモリ上で表示した。人物眼はprincess `600,505,255,150`、magic `670,570,245,150`、space `905,875,290,170`（左x,上y,幅,高さ）。姫右目尻はsource `740,540,115,115` の原寸と、根元 `818,570,32,50` の最近傍3倍表示で確認した。口元はprincess `1020,1370,130,130`、animals `560,1095,200,170`、ocean `690,970,145,120` のsource/registered原寸crop。顎下はmagic `720,750,125,65`、space `905,1060,120,65` のsource原寸cropで確認した。cropファイルは作成せず、証拠の版は元画像のhashへ結び付ける。

detailや最近傍拡大は保存sourceの分析表示であり、アプリのnative zoom 1/2/4倍を検査した証拠ではない。native/tiledとdirectの一致、実Chromeの表示・操作、物理端末、性能、保存/reload/PNG/旧作品コピー、全配色・全状態、ユーザー採用はこの担当では**未確認**。親が行う別の技術検査も、この報告でPASSとはしない。P05性能停止は保持する。

主モデルとeffortを変更していない。再委任・性能測定・テスト再実行・外部サービス・有料API・外部公開を行っていない。私有原画を公開・配信先へコピーしていない。保存したのは本報告だけであり、コード・画像・素材・以前の報告は編集していない。

## 確認前後のSHA-256

対象33ファイル（source10、detail10、registered10、home参照3）は確認前後で**全件一致**。以下のhashが開始/終了の双方に対応する。パスは `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド` からの相対パス。

| ファイル | 確認前/確認後 SHA-256 | 前後 |
| --- | --- | --- |
| apps/web/public/images/islands/magic-v1.webp | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | 一致 |
| apps/web/public/images/islands/princess-v1.webp | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | 一致 |
| content/smooth-finish-i33/references/home-target.png | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | 一致 |
| content/smooth-finish-i34/derived/animals-registered.png | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` | 一致 |
| content/smooth-finish-i34/derived/construction-registered.png | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` | 一致 |
| content/smooth-finish-i34/derived/dinosaurs-registered.png | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | 一致 |
| content/smooth-finish-i34/derived/flowers-registered.png | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` | 一致 |
| content/smooth-finish-i34/derived/magic-registered.png | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | 一致 |
| content/smooth-finish-i34/derived/ocean-registered.png | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` | 一致 |
| content/smooth-finish-i34/derived/princess-registered.png | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | 一致 |
| content/smooth-finish-i34/derived/robots-registered.png | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` | 一致 |
| content/smooth-finish-i34/derived/space-registered.png | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | 一致 |
| content/smooth-finish-i34/derived/vehicles-registered.png | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | 一致 |
| test-results/smooth-home-i34/revision-28/after/animals-source.png | `521c0ad90b593e8aa1536448bab5842194540f0ad9ccdde33659d601f41313ed` | 一致 |
| test-results/smooth-home-i34/revision-28/after/bunny-detail.png | `25e969564d8bf9abfe08bcd6e46e7908c1fae6c8ba5ed34e332402fe4e208b5a` | 一致 |
| test-results/smooth-home-i34/revision-28/after/construction-source.png | `a6a1522b4d972746e4518dbbed11dd4b2895ced1300bb56cc052c9d7f62cbe3d` | 一致 |
| test-results/smooth-home-i34/revision-28/after/dinosaurs-source.png | `0967954718e3f3942e93f466c6a6634a65f7b33af4cb98f06bc829d70579b884` | 一致 |
| test-results/smooth-home-i34/revision-28/after/dog-detail.png | `e874f6ca29fd65ff6084d6e0f3b9af0850a04f89f45f43f804382ce24a28ee55` | 一致 |
| test-results/smooth-home-i34/revision-28/after/fish-detail.png | `f86123de767aea3e6b6011551df2303e4914817785f7154e522845664705d68a` | 一致 |
| test-results/smooth-home-i34/revision-28/after/flowers-source.png | `f214c8454b9c2ca6f6442ccef0aaf299ec05ba4c79c66d30edddf6497414e4c7` | 一致 |
| test-results/smooth-home-i34/revision-28/after/magic-detail.png | `873fbe3dda024d16d2d5b523c113e296ef4790d540dd9d22e27201eabfd6ffe4` | 一致 |
| test-results/smooth-home-i34/revision-28/after/magic-source.png | `e62696f65c25bcb2b0615a62baa362f383f3ddb60c6d27a8311abf5f17be078d` | 一致 |
| test-results/smooth-home-i34/revision-28/after/ocean-detail.png | `00490f680e042252cabb2414fdf6561f0604437e6c63a64157b1c3c820eb736b` | 一致 |
| test-results/smooth-home-i34/revision-28/after/ocean-source.png | `738f2d800afda938e80e17eff3455f58900f913a8b9a98fd2efcc652b162b059` | 一致 |
| test-results/smooth-home-i34/revision-28/after/princess-detail.png | `d0ab3f44842af1cd4850b57150a648063ea35eeea72e03461a597cf124eafde0` | 一致 |
| test-results/smooth-home-i34/revision-28/after/princess-source.png | `823273de79699c392f7d441ae1034a256f92ff7987ff0a8fe01e827c206df86f` | 一致 |
| test-results/smooth-home-i34/revision-28/after/robots-detail.png | `6bef3018ddc261ad769a1c0032bea38e26034d5213fcc1f3b7e8a9b12e7a9b02` | 一致 |
| test-results/smooth-home-i34/revision-28/after/robots-source.png | `16535c770a2f82d09ad782232f5b20abc964441e0ea415fe0877dd0a0cd5f4d6` | 一致 |
| test-results/smooth-home-i34/revision-28/after/space-detail.png | `a8f463d535904785f0fc3652a2c97771574fc51c5b58501a99e8a4f5d911d67c` | 一致 |
| test-results/smooth-home-i34/revision-28/after/space-source.png | `d40adafbd7212b2cea67edde146205220063e9f48c37ad63e29663a5973e3388` | 一致 |
| test-results/smooth-home-i34/revision-28/after/turtle-detail.png | `ab2bbbb52ea0d9b36caa69daf4a2762d5a1b9195aa4830742ad7cc4b9ba62e8d` | 一致 |
| test-results/smooth-home-i34/revision-28/after/vehicles-detail.png | `7257d1e6025c4e7bce53ecdcb98cbb465f71f7470970738864193d7459ba22ea` | 一致 |
| test-results/smooth-home-i34/revision-28/after/vehicles-source.png | `038baba072f3fbd9aee0ee23e76f6c98a3bc48c81459115a0a22b37c27852665` | 一致 |

