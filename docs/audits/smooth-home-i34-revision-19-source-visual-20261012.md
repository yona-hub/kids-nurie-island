# I34 候補19 source 独立目視報告

- 判定: **FAIL — source画像の美術仕上げに限定した判定。home同等の最終品質として不足が残る。**
- レビュー担当: /root/i34_visual_review（制作実装を変更しない独立画像診断担当）
- 証拠取得開始: 2026-10-12T16:22:43.0531108+09:00
- 証拠再取得終了: 2026-10-12T16:32:10.4906723+09:00
- 対象: `test-results/smooth-home-i34/revision-19/after/` の `*-source.png` 全10枚（1600×2000）と `{princess,magic,ocean,robots,space,vehicles}-detail.png` 全6枚。
- 座標: すべて1600×2000のsource画像上のピクセル座標、左上原点。範囲は目視上の不良を囲む概略値。
- 画像・コード・比較データの変更、テスト再実行、外部サービス利用、再委任は行っていない。本報告ファイルだけを新規保存した。候補15・16を含む以前の報告は保持した。

## 比較と判定の根拠

全10枚の現在source出力、詳細6枚、`content/smooth-finish-i34/derived/*-registered.png` 全10枚を実際に表示して確認した。実ホーム島の `princess-v1.webp` と `magic-v1.webp`、12島を含む `home-target.png` も表示した。私有生成原画の比較には、現在実装と同じ1600×2000座標へ登録されたregistered画像を用いた。manifestのmasterFileを読んで原画の対応も確認したが、元PNGそのものを追加採証したとの主張はしない。

判定は構図・キャラクター比率・選択色を原画へ一致させる要求ではない。瞼と眼球のつながり、肌と首の境界、口腔と舌の連続性、素材の立体感、輪郭の自然さを比べた。実ホームと私有原画では、目の周囲の明暗や接地影、顎下の影、口の奥行きが隣接する面へ滑らかにつながる。現在sourceには下記の点列・縞・口元の段・人物眼の浮きが残る。

source画像は保存された実レンダー出力を見たもので、生成RGB原画だけを完成品として採点していない。実装者から伝えられた修正内容や既知不良を採点根拠にせず、現在画像と参照の見た目で判定した。

## 修正が必要なブロッカー

| ID | 対象とsource座標 | 現在画像の具体的な不足 | 完了の見方 |
| --- | --- | --- | --- |
| B01 | magic 顎と首: x737–823, y777–790 | 顎の下に茶色の粒が一列に並び、首との接続が細いビーズ状の線として見える。詳細画像とsource cropの両方で確認した。参照の自然な顎下の影にはこの周期的な点列がない。 | 顎下の陰影を途切れない面として首へつなぐ。点列を単に肌色で覆って立体影まで消した状態も完了としない。 |
| B02 | space 左下顎とヘルメット内縁: x921–1003, y1080–1104 | 肌の下端に灰色と明色の短い縦筋が反復し、ヘルメットの縁に沿って櫛状の帯が出ている。参照は暗い滑らかな接触影で、この縞はない。magicの点列と同様に局所的な表面境界不良として見える。 | 肌・髪/内側の影・ヘルメットの関係を滑らかな接触影にする。縞のない連続した境界をsourceで確認する。 |
| B03 | 人物眼: princess 左x617–697,y520–597 / 右x753–840,y553–632; magic 左x689–747,y588–656 / 右x832–894,y622–692; space 左x923–1013,y924–1022 / 右x1087–1179,y894–995 | 主にmagicとspaceで、虹彩の周囲を細い白と黒の同心の縁が囲み、下端の虹彩が肌に直接切り替わる。肌側の瞼の厚み・接地影と眼球の丸い光が弱く、滑らかな頬や鼻に対して目が貼り付いて見える。princessはまつげで表情が改善したが、硬い白い側縁と上瞼の平たい黒い帯が残る。原画の目のサイズや白目幅の複製を求めているのではなく、現在の眼形状のままで周囲の肌となじませる不足である。 | 上瞼から肌への明暗、白目の陰影、眼球の丸みが一体に読めるようにする。白黒の輪郭を増やすだけではなく、現在の眼形状と顔の照明をつなぐ。 |
| B04 | ocean イルカ口: 全体x1020–1112,y595–693、特に下縁x1042–1110,y650–692と右上x1080–1099,y624–645 | 暗い口腔と舌は戻ったが、下縁に灰桃色の段・まだらな帯が付き、右上には角張った折れがある。周囲の青い肌と口内のつながりが硬く、原画の滑らかな暗い口腔と青い顎の立体的な縁に比べて、口内画像を切り貼りしたような境界が残る。候補16の白灰色矩形片がそのまま残っているとの指摘ではない。 | 口腔・舌・口の縁を連続した面にして、下縁の段と右上の角を除く。舌の立体感と口の暗い奥行きを保つ。 |
| B05 | ocean 魚口: x568–620,y1255–1294 | 口内に茶色・桃色・明色の横帯が重なり、舌と口腔が複数の短冊に切れて見える。小さな口でも現在sourceでは色の段が認識できる。参照は暗い口腔の中に丸い一つの舌としてつながっている。 | 暗い奥、舌、縁を一続きに読める明暗へ直す。単純な一色の桃色穴へ戻さない。 |

B01とB02は現物の明瞭な不良であり、これだけでもsource品質のPASSにはできない。B03は顔の中心となる部位の仕上げ差、B04・B05は口腔の表面の連続性に関する残件である。

## 今回改善を確認し、旧ブロッカーをそのまま維持しない点

- princessの新しいまつげと丸い反射で表情が改善した。以前の目尻の黒三角（約x824,y621）は現在明瞭に再現せず、独立ブロッカーから外す。鼻下の旧上唇の茶色い帯も消えている。
- spaceの鼻下の旧口に見える太い暗弧は消えている。鼻そのものは参照にもある上向きの丸い形として読め、候補16の旧影を残件として扱わない。
- 人物の額・眉周りの旧眼線由来の灰色の帯や孤立した肌の不連続は減った。首・手も暖かい顔色につながる。強い灰色の首という旧指摘は維持しない。
- イルカ口の候補16の白灰色矩形片は消えた。暗い腔と舌の情報は戻り、白片の欠損とは別の縁の連続性だけをB04で指摘している。
- 車輪上の赤い部分は周囲のフェンダーへ連続し、前後の旧突出capや二層の明暗の継ぎ目は大幅に改善した。現在の車輪の暗い空間は部材の奥として読めるため、旧「突出したcap」は独立ブロッカーから外す。
- 車の右ヘッドライト内側と前後フェンダー端の旧純白の切れ目は、現在のsourceでは明瞭な白い欠損として再現しない。
- robotの右肘は青い接続部があり、白い切断状の隙間は再現しない。口と眉も見える。
- magicの襟の白い切れ目、construction油圧部の白いピンホール、princess裾/ドレス上の分離した旧ひげ線、dinosaurs鼻上の旧黒い斜線は再現しない。
- animalsの犬・猫の表情、淡い毛並み、木の材質、地面の草の形は読み取れる。元のregistered原画にも草の輪郭があるため、その存在自体を不良にしない。
- 花びら・葉・リボン、金属・ガラス、毛・髪の基本的な陰影は保たれる。全体に広がる白いハローや色の漏れ、主シルエットの崩壊は今回確認しなかった。

## 軽微な仕上げ残件

下記は拡大時の残りであり、この表だけを理由に全体FAILとはしていない。

| 対象 | 座標 | 所見 |
| --- | --- | --- |
| vehicles 前後のタイヤ上端 | 前x416–512,y1008–1043 / 後x166–227,y865–902 | 赤いcapの突出は改善したが、タイヤと暗い空間の境界に細い波打ち・小さい角が残る。参照の輪郭はより滑らか。 |
| princess 右頬と髪の境界 | x812–834,y625–675 | 肌の外縁に小さい階段状の切り替わりがある。広範囲の白ハローではないが、source拡大では目尻から頬への輪郭がやや硬い。 |
| princess ウサギ右内耳 | x1253–1290,y1221–1322 | 内耳の暗いL字状の縁が毛の柔らかさに対して少し線として強い。 |
| animals 猫の頬 | 約x1155–1161,y1377–1383とx1180–1186,y1353–1361 | 小さい暗点が残る。口・ひげの主線と離れた点で、元の表情の欠損とは異なる。 |
| dinosaurs 鼻孔 | 左x330–373,y479–541 / 右x440–494,y511–571 | 濃い楕円が均一な面で、鼻の立体感に比べて平たく見える。顔全体の可読性を壊すほどではない。 |
| space 右肩上部 | x1186–1218,y1089–1118 | 白い穴はないが、小さい灰色の面が原画の肩・背負い物の連続した陰影より局所的に平たい。 |

## テーマ別の確認範囲

| テーマ | 今回のsource目視 |
| --- | --- |
| princess | 全体、顔/目/口、首/手、ウサギ、裾を確認。B03と軽微な輪郭残件。 |
| magic | 全体、顔/目/口、顎下/首、両手、襟を確認。B01・B03。 |
| animals | 全体、犬/猫の顔、毛並み、足元、木/枝を確認。新しい主要ブロッカーなし。 |
| ocean | 全体、イルカ/亀/魚の顔と口、外形、珊瑚/貝を確認。B04・B05。 |
| dinosaurs | 全体、顔/口/歯、鼻、手足、卵/岩を確認。新しい主要ブロッカーなし。 |
| construction | 全体、油圧部、窓、履帯/コーンを確認。新しい主要ブロッカーなし。 |
| robots | 全体、顔、肘/関節、手足、金属面を確認。新しい主要ブロッカーなし。 |
| space | 全体、顔/目/口、顎下、肩/ヘルメット、宇宙服を確認。B02・B03。 |
| vehicles | 全体、前後輪の上部、灯火/ガラス、ボディの明暗を確認。旧capの独立ブロッカーを解除し、軽微な輪郭残件として記録。 |
| flowers | 全体、花びら/葉/包み紙/リボン、蝶の体と目を確認。新しい主要ブロッカーなし。 |

「新しい主要ブロッカーなし」は、このsource目視の範囲における所見であり、各テーマの全状態や実機承認を意味しない。

## 比較記録と未確認範囲

保存済みのcomparison.json / legacy-comparison.jsonは読み取っただけで、再生成やテストの代替としていない。今回読んだ記録はgeometry unchanged 10件、blank/crayon/pencil unchanged 30件、smooth changed 10件、旧作品states unchanged 40/40件だった。

確認開始と終了で、証拠表の31ファイルすべてのSHA-256が一致した。source10枚、詳細6枚、registered原画10枚、home参照3枚、比較JSON2枚を同じ版として結び付ける。参照13画像は候補15で採証したものからもhash不変だった。

native/tiledとdirectの一致、1/2/4状態、実Chromeの表示/操作、物理端末、性能、ユーザーによる採用/承認は本報告では未確認。親が別途採証中の技術ゲートをPASSにしていない。P05性能停止の扱いにも変更はない。

## 証拠SHA-256

パスはプロジェクト `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド` からの相対パス。取得時刻は冒頭の開始/終了記録を参照。

| ファイル | SHA-256 |
| --- | --- |
| test-results/smooth-home-i34/revision-19/after/animals-source.png | `a63a9f8b99f514ab3343ae51026e26a3ea8602f5795673396273bab4d7569f07` |
| test-results/smooth-home-i34/revision-19/after/construction-source.png | `a6a1522b4d972746e4518dbbed11dd4b2895ced1300bb56cc052c9d7f62cbe3d` |
| test-results/smooth-home-i34/revision-19/after/dinosaurs-source.png | `69497ed60bea0e0e6c703b074c313d6de55b140b63c7c5a5af71e44457809422` |
| test-results/smooth-home-i34/revision-19/after/flowers-source.png | `f214c8454b9c2ca6f6442ccef0aaf299ec05ba4c79c66d30edddf6497414e4c7` |
| test-results/smooth-home-i34/revision-19/after/magic-source.png | `1712f0d8be8c63275a18b2a89d5f9fc2f56f8a99e745a22c09d1a600cd64da87` |
| test-results/smooth-home-i34/revision-19/after/ocean-source.png | `0de455e214c882dd7184980f8bc8237101d5c7fc627cde848176df6b61aca772` |
| test-results/smooth-home-i34/revision-19/after/princess-source.png | `2d6d282e0ae7a28df499d5aa853b3c1a3442071236cdcc9571927908062d4c52` |
| test-results/smooth-home-i34/revision-19/after/robots-source.png | `360be574b63c880f7acb161e94f13317b79ec542445e2322f8e50ef93e7de724` |
| test-results/smooth-home-i34/revision-19/after/space-source.png | `a7e91c66dbe8949ad0e0c810e80f215d98a33541f8cbd8d39fbbe423ad84ae26` |
| test-results/smooth-home-i34/revision-19/after/vehicles-source.png | `038baba072f3fbd9aee0ee23e76f6c98a3bc48c81459115a0a22b37c27852665` |
| test-results/smooth-home-i34/revision-19/after/magic-detail.png | `3cde620ebfe91f5da9b2fabf95acdb12c091ef1750ba0753327dbd1f3a4ece47` |
| test-results/smooth-home-i34/revision-19/after/ocean-detail.png | `b0618e333fa3d86c2d4f1b0f44c046c609432d0e582a33cec6ddb0e31c73c059` |
| test-results/smooth-home-i34/revision-19/after/princess-detail.png | `4170957ca587b73fb64f26cbfb87c3c35425e65988e69734c4ebe1ad2893011a` |
| test-results/smooth-home-i34/revision-19/after/robots-detail.png | `6bef3018ddc261ad769a1c0032bea38e26034d5213fcc1f3b7e8a9b12e7a9b02` |
| test-results/smooth-home-i34/revision-19/after/space-detail.png | `43cb70f1a565129a7a8e14945e11336ee3c4203f09d5548b2f5cf19c593b601b` |
| test-results/smooth-home-i34/revision-19/after/vehicles-detail.png | `7257d1e6025c4e7bce53ecdcb98cbb465f71f7470970738864193d7459ba22ea` |
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
| test-results/smooth-home-i34/revision-19/after/comparison.json | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| test-results/smooth-home-i34/revision-19/after/legacy-comparison.json | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |

