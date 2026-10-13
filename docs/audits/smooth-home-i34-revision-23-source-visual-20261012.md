# I34 候補23 source 独立目視報告

- 判定: **FAIL — 現在sourceの美術仕上げに限定。人物眼のなじみが不足し、ウサギ・犬・亀に口元の明瞭な切断があるため、home同等の最終品質には届いていない。**
- レビュー担当: /root/i34_visual_review（制作・実装を変更しない独立画像診断担当）
- 証拠取得開始: 2026-10-12T17:13:37.9364447+09:00
- 証拠再取得終了: 2026-10-12T17:22:35.4023952+09:00
- 対象: `test-results/smooth-home-i34/revision-23/after/` の `*-source.png` 全10枚（1600×2000）と `{princess,magic,space,ocean,fish,vehicles,robots}-detail.png` 全7枚。
- 座標: 1600×2000のsource画像上、左上原点のピクセル座標。範囲は不良を囲む目視上の概略値。詳細画像の2倍座標ではない。
- 本報告だけを新規保存した。コード・素材・候補画像・比較JSON・以前の報告は編集していない。テスト・性能測定・外部サービス利用・再委任は行っていない。候補19のFAIL報告もそのまま保持する。

## 実際に表示した比較資料と判定の範囲

現在のsource全10枚と詳細7枚を表示した。比較資料も `content/smooth-finish-i34/derived/*-registered.png` 全10枚、実ホーム島の `apps/web/public/images/islands/princess-v1.webp` と `magic-v1.webp`、`content/smooth-finish-i33/references/home-target.png` を実際に表示した。私有生成原画との比較には、sourceと同じ座標へ登録されたregistered画像を用いた。未登録の元生成PNGをこの回で別途表示したという主張はしない。

比較したのは、顔・瞼・眼球・口腔が周囲の面につながること、肌と顎下の影、素材の立体感、輪郭の連続性である。構図、キャラクター比率、選択色、眼の大きさや白目幅を参照へ一致させる要求ではない。実ホームとregistered原画の仕上げでは、口の奥と舌、上瞼と眼球の影が連続した立体として読める。候補23では顎下とイルカ・魚口が改善した一方、下記の目と三つの口元が絵の完成度を下げている。

sourceは保存された実レンダー出力であり、生成RGB原画を完成品の代わりに採点していない。実装者の修正説明や比較JSONの数値を、美術品質のPASS根拠にしていない。独自の原寸cropもメモリ上で表示し、現在sourceとregisteredの同じ範囲を比較した。crop画像は別ファイルとして保存していないため、証拠の版は元画像のhashへ結び付ける。

## 候補19 B01〜B05の再判定

| ID | 対象とsource座標 | 候補23の判定と現在の見え方 |
| --- | --- | --- |
| B01 | magic 顎と首: x737–823, y777–790 | **旧指摘は解消。** 茶色い粒の反復は見えず、顎から首へ連続した暖色の影になっている。境界がやや均一でも、前回のビーズ状の点列とは異なるため、そのブロッカーを維持しない。 |
| B02 | space 左下顎とヘルメット内縁: x921–1003, y1080–1104 | **旧指摘は解消。** 灰色・明色の短い縦筋の反復は見えず、顎下は連続する茶色い接触影として読める。 |
| B03 | 人物眼: princess 左x617–700,y517–600 / 右x750–842,y550–634; magic 左x684–752,y584–661 / 右x826–900,y617–697; space 左x915–1017,y909–1025 / 右x1080–1184,y880–1000 | **残件あり、FAILを維持。** 上瞼の外側に薄い灰茶色の並行した弧が加わり、特にspaceとmagicでは肌に描いた均一な外輪として見える。虹彩の硬い下端、細い白い側縁、黒い上縁と周囲の柔らかい肌の間に、眼球の丸みや瞼の厚みをつなぐ明暗が弱い。princessのまつげと反射は表情に寄与しているが、上側の黒い帯と白い側縁の切り替わりがまだ平たく、眼が貼り付いた印象を残す。外輪を増やすこと自体は、立体的になじんだ証拠にならない。 |
| B04 | ocean イルカ口: x1020–1112,y595–693、特に下縁x1042–1110,y650–692 / 右上x1080–1099,y624–645 | **旧指摘は解消。** 下縁の灰桃色の段・まだらな帯は消え、暗い奥と一つの舌が連続して読める。右上の小さい内部の折れはあるが、前回の切り貼り状の粗い縁としては再現しない。現在の口が参照より狭いこと自体を不良にしない。 |
| B05 | ocean 魚口: x568–620,y1255–1294 | **旧指摘は解消。** 茶色・桃色・明色の横短冊は消え、小さい口腔と一つの丸い舌として読める。上縁に小さい角はあるが、横帯で分断される前回のブロッカーとは区別する。 |

B01・B02・B04・B05の解除は候補23の保存済みsourceについての所見であり、候補19の当時のFAILを改変するものではない。

## 現在修正が必要なブロッカー

| ID | 対象とsource座標 | 現在画像で確認した不良 | 最低限の改善条件 |
| --- | --- | --- | --- |
| B03 | 人物眼。上表の範囲、特にspaceの上瞼外側とmagicの左右眼周囲 | 上側の薄い外輪と黒い縁が平行に重なり、虹彩の下端は肌へ硬く切り替わる。顔・鼻・頬の柔らかい照明に対して、眼だけが平たい楕円部品として浮く。現在の眼形状のままでも改善が必要な、瞼・眼球・肌のつながりの問題。 | 上瞼の厚みと接触影、白目/眼球の面の明暗を顔の照明へつなぐ。均一な薄い輪を追加するだけでなく、外縁が肌へ自然につながり、眼球として丸く読める状態をsourceで確認する。参照の比率の複製は条件にしない。 |
| B06 | princess ウサギの鼻下・口: x1038–1123,y1385–1475 | 鼻の下から口角へ続く線と口腔の上側がほぼ消え、灰色の短い断片が左右に残る。鼻と舌の間に毛色の面が入り、赤い舌/口の切り抜きが独立して浮く。registeredでは鼻下の丸いマズル、暗い口腔、舌が一続きに読める。現在の欠損はsource全体でも顔の表情の崩れとして見える。 | 鼻下のマズルと両口角、口の暗い奥、舌を一つの表情としてつなぐ。離れた灰色片と毛色の切断をなくし、舌が口腔の中に収まる状態にする。元の太い線をただ増やすことは条件ではない。 |
| B07 | animals 犬の鼻下・口: x574–741,y1110–1235 | 鼻下の中央線と左右の笑顔の弧が途中で止まり、舌との間が毛色で切断される。舌の上側に口腔の暗さがつながらず、ピンクの形が鼻・口角から離れて浮く。毛並みの照明はあるのに、口だけが欠けた表情になる。 | 鼻下からマズル、両口角、暗い口腔、舌の連続性を戻す。現在の選択色を保ちながらも、口角が舌の上方の口腔へ自然につながる状態を確認する。 |
| B08 | ocean 亀の口: x705–819,y990–1068 | 左右の緑色の口角が断片として分離し、その間の暗い口腔が失われている。桃色の舌が緑の顔の面へ単独で置かれたように見える。registeredでは口角が暗い奥を囲み、その内側に舌がある。 | 左右口角から口腔の縁を連続させ、舌を囲む暗い奥を戻す。緑の肌と桃色の舌が直接切り替わる穴を、連続した口の立体として読めるようにする。 |

B06〜B08は今回新たに確認した明瞭な口元の退行である。三つの口の切断だけでも、現在sourceをhome相当の仕上げとしてPASSにはできない。原因となる実装箇所はこの画像診断では検証していない。

## 原寸cropの比較範囲

以下の範囲を現在sourceと同テーマregisteredから取り出して表示した。上表の座標確認と、口元の欠損が単なる詳細画像の拡大補間ではないことの確認に用いた。

| 対象 | crop範囲（左x,上y,幅,高さ） |
| --- | --- |
| princess ウサギ | 1020,1370,130,130 |
| animals 犬 | 560,1095,200,170 |
| ocean 亀 | 690,970,145,120 |
| princess 人物眼 | 600,505,255,150 |
| magic 人物眼 | 670,570,245,150 |
| space 人物眼 | 905,875,290,170 |
| ocean イルカ口 | 1000,580,130,130 |
| ocean 魚口 | 550,1230,95,90 |

magic顎下は720,750,125,65、space顎下は905,1060,120,65の現在source cropでも確認した。

## 改善点と非ブロッカー

- 人物の鼻・口・首の暖色の照明は保たれ、旧上唇の影、目尻の黒三角、顎下の点列/縞は明瞭に再現しない。人間の口は、今回のウサギ・犬・亀のような切断とは区別する。
- イルカの口腔と舌、魚の小さい口腔は前回より連続している。魚上縁の小さい角やイルカ口内の小さい折れは、今回は独立ブロッカーにしない。
- 車の赤いcapは周囲のフェンダーとつながっている。前後タイヤ上端（前x416–512,y1008–1043 / 後x166–227,y865–902）の細い波打ちは軽微な仕上げ残件で、旧突出capの再発とは判定しない。純白の切断状patchも明瞭には再現しない。
- princess右頬と髪の境界（x812–834,y625–675）はやや硬く、ウサギの内耳（x1253–1290,y1221–1322）にも線の強さが残る。ただし今回の口の欠損とは別の軽微な残件とする。
- dinosaursの濃い楕円の鼻孔（左x330–373,y479–541 / 右x440–494,y511–571）は平たいが、表情全体の可読性を壊すほどではない。
- robotの肘の接続、口、金属面は読める。以前の白い肘gapは再現しない。magic襟の白い切れ目とconstruction油圧部のピンホールも再現しない。
- 猫の口とひげ、淡い毛並みは読める。犬の口の退行をanimals全体の輪郭・毛の失敗へ広げない。木の枝、地面の草、花びら・葉・リボン、ガラス・金属の基本的な明暗は保たれる。
- 全体に広がる白いハロー、色の漏れ、主シルエットの大きな崩壊は今回確認しなかった。局所の口元の切断はこれとは別にブロッカーとして残る。

## 全10テーマの確認

| テーマ | source全体と局所の現在所見 |
| --- | --- |
| princess | 全体、人物の顔/眼/眉/口、肌、首/手、ウサギ、裾を確認。人物眼B03、ウサギ口B06。 |
| magic | 全体、人物の顔/眼/眉/口、顎下/首、手、襟を確認。顎下B01は解消。人物眼B03が残る。 |
| animals | 全体、犬/猫の顔と口、毛、足元、木/枝を確認。犬口B07。猫・木/草に新しい主要ブロッカーは確認しない。 |
| ocean | 全体、イルカ/亀/魚の顔と口、輪郭、珊瑚/貝を確認。イルカB04・魚B05は解消。亀口B08。 |
| dinosaurs | 全体、顔/口/歯、鼻、手足、卵/岩を確認。鼻孔は軽微な残件。新しい主要ブロッカーは確認しない。 |
| construction | 全体、油圧部、窓、履帯/コーンを確認。新しい主要ブロッカーは確認しない。 |
| robots | 全体、顔/口、肘/関節、手足、金属面を確認。旧肘gapは再現せず、新しい主要ブロッカーは確認しない。 |
| space | 全体、人物の顔/眼/眉/口、顎下、肩/ヘルメット、宇宙服を確認。顎下B02は解消。人物眼B03が残る。 |
| vehicles | 全体、前後輪上部、灯火/ガラス、ボディの明暗を確認。旧capのブロッカーは再発せず、軽微な境界の波打ちが残る。 |
| flowers | 全体、花びら/葉/包み紙/リボン、蝶の体と目を確認。新しい主要ブロッカーは確認しない。 |

「新しい主要ブロッカーは確認しない」は、この候補のsource目視に限る所見であり、各テーマの全状態や実機の承認ではない。

## 比較JSONと未確認範囲

保存済み `comparison.json` と `legacy-comparison.json` は読み取りのみ行った。記録内容はgeometry unchanged 10件、blank/crayon/pencil unchanged 30件、smooth changed 10件、旧作品states unchanged 40/40件だった。これらを美術PASSの代わりにはしていない。比較処理の再実行もしていない。

証拠表の32ファイルすべてについて、目視確認の前後でSHA-256が一致した。source10枚、詳細7枚、registered10枚、home参照3枚、比較JSON2枚を同じ版として結び付ける。参照13画像は候補19の採証時からもhash不変だった。

native/tiledとdirectの一致、1/2/4状態、実Chromeの表示/操作、物理端末、性能、ユーザー採用/承認はこの依頼では未確認。親が別途採証中の技術ゲートを本報告でPASSにはしていない。P05性能停止の扱いに変更はない。

## 証拠SHA-256

パスはプロジェクト `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド` からの相対パス。開始/終了のhashは全件一致。

| ファイル | SHA-256 |
| --- | --- |
| test-results/smooth-home-i34/revision-23/after/animals-source.png | `722ea753e4aee88bf94c3ac05fbb2f96b76635a22fcb5e2a54bc2a3951c21da8` |
| test-results/smooth-home-i34/revision-23/after/comparison.json | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| test-results/smooth-home-i34/revision-23/after/construction-source.png | `a6a1522b4d972746e4518dbbed11dd4b2895ced1300bb56cc052c9d7f62cbe3d` |
| test-results/smooth-home-i34/revision-23/after/dinosaurs-source.png | `0967954718e3f3942e93f466c6a6634a65f7b33af4cb98f06bc829d70579b884` |
| test-results/smooth-home-i34/revision-23/after/fish-detail.png | `f86123de767aea3e6b6011551df2303e4914817785f7154e522845664705d68a` |
| test-results/smooth-home-i34/revision-23/after/flowers-source.png | `f214c8454b9c2ca6f6442ccef0aaf299ec05ba4c79c66d30edddf6497414e4c7` |
| test-results/smooth-home-i34/revision-23/after/legacy-comparison.json | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |
| test-results/smooth-home-i34/revision-23/after/magic-detail.png | `4bbf1fdbe708531d05b63cbc56d6a09b20df9ee395f4b389327387f0d852b110` |
| test-results/smooth-home-i34/revision-23/after/magic-source.png | `875968b3cf8eb05d58dd6da191e35677364fc52a174f33988ce01a9c1cc71903` |
| test-results/smooth-home-i34/revision-23/after/ocean-detail.png | `00490f680e042252cabb2414fdf6561f0604437e6c63a64157b1c3c820eb736b` |
| test-results/smooth-home-i34/revision-23/after/ocean-source.png | `c493fe498d2381f251fffc9949aa40dca7d35874fbc31abfc370c8dab01018d4` |
| test-results/smooth-home-i34/revision-23/after/princess-detail.png | `209008bfa85059a8537382a24f999d98a5bb6a5db3ea62c991318543bda73919` |
| test-results/smooth-home-i34/revision-23/after/princess-source.png | `42a19c380235ad43a7bc224c30d53c8572fc2f9c2be3b9997f16a4534ae8be89` |
| test-results/smooth-home-i34/revision-23/after/robots-detail.png | `6bef3018ddc261ad769a1c0032bea38e26034d5213fcc1f3b7e8a9b12e7a9b02` |
| test-results/smooth-home-i34/revision-23/after/robots-source.png | `16535c770a2f82d09ad782232f5b20abc964441e0ea415fe0877dd0a0cd5f4d6` |
| test-results/smooth-home-i34/revision-23/after/space-detail.png | `41479012bbcf2fe88a1eafa14be612ff787e603a49245f86faa8e99f19caa18d` |
| test-results/smooth-home-i34/revision-23/after/space-source.png | `30897ea46fe69d49d1a81e93162525a1b9cf97cd1df94e66c9fa4e26f81a1bac` |
| test-results/smooth-home-i34/revision-23/after/vehicles-detail.png | `7257d1e6025c4e7bce53ecdcb98cbb465f71f7470970738864193d7459ba22ea` |
| test-results/smooth-home-i34/revision-23/after/vehicles-source.png | `038baba072f3fbd9aee0ee23e76f6c98a3bc48c81459115a0a22b37c27852665` |
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

