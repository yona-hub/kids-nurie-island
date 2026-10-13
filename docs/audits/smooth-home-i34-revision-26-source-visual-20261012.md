# I34 候補26 source 独立目視報告

- 判定: **FAIL — 現在sourceの美術仕上げに限定。人物眼B03の瞼・眼球・肌のつながりがまだ不十分で、home同等の最終品質としては受け入れられない。**
- レビュー担当: /root/i34_visual_review（制作・実装を変更しない独立画像診断担当）
- 証拠取得開始: 2026-10-12T17:39:54.4569791+09:00
- 証拠再取得終了: 2026-10-12T17:49:19.9046545+09:00
- 対象: `test-results/smooth-home-i34/revision-26/after/` の `*-source.png` 全10枚（1600×2000）と `{princess,magic,space,ocean,fish,vehicles,robots,bunny,dog,turtle}-detail.png` 全10枚。
- 座標: 1600×2000のsource画像上のピクセル座標、左上原点。目視上の概略範囲であり、detail画像上の座標ではない。
- 新規保存は本報告だけ。コード・素材・証拠画像・以前のFAIL報告・候補24口元報告は変更していない。再委任、性能測定、外部サービス利用、テスト再実行はしていない。

## 実際に表示した比較資料と基準

現在source全10枚と指定detail全10枚を実際に表示して確認した。比較資料も `content/smooth-finish-i34/derived/*-registered.png` 全10枚、実ホーム島の `apps/web/public/images/islands/princess-v1.webp` と `magic-v1.webp`、`content/smooth-finish-i33/references/home-target.png` を表示した。私有生成原画との比較にはsourceと同座標へ登録されたregistered画像を用いた。未登録の元生成PNGを今回別途表示したとの主張はしない。

比較したのは、瞼と眼球が肌の照明へつながること、口腔と舌の連続性、自然な材質の明暗、輪郭と表情の完成度である。構図、キャラクター比率、選択色、虹彩の大きさ、白目幅を原画へ一致させることは条件にしていない。実装者の自己判定、unit成功、build/lintや比較の数値は、美術合格の根拠としていない。

実ホームとregistered原画では、上瞼が眼球へ落とす影と肌側の丸みがつながり、まつげも瞼から連続して見える。候補26は虹彩の丸さが改善した一方、上側の灰色の縁と明色帯、下側の白目が別の層として目立つ。顔と眼球の一体感は、現在の全体表示でも不足している。

## 主なブロッカー B03

| 区分 | 対象とsource座標 | 現在画像で見える不足 | 最低限の改善条件 |
| --- | --- | --- | --- |
| B03-1 | princess 左眼x610–702,y515–602 / 右眼x749–845,y550–635; magic 左眼x686–753,y585–659 / 右眼x828–897,y620–695; space 左眼x920–1018,y922–1026 / 右眼x1086–1183,y892–1003 | 虹彩は丸くなり、虹彩下端が肌へ直接切り替わる以前の状態は減った。しかし特にmagicとspaceで、上側の灰色の輪郭と明色の帯が硬い二重の弧として読める。下側の白目は比較的均一な白い台座に見え、その外側の影で眼全体が顔へ貼り付いた部品のように浮く。上瞼の厚みや眼球の球面が周囲の肌の柔らかい照明へつながっていない。princessでも白目下縁と平たい灰黒色の上瞼帯が同じ方向の不足を残す。 | 現在の眼形状のまま、上瞼の厚みと接触影、白目の丸い面の明暗、肌側の瞼を連続した立体として読ませる。均一な外周の影で眼を持ち上げず、硬い灰色の帯と明色弧が独立した枠に見えない状態を確認する。白目幅や虹彩比率の複製は求めない。 |
| B03-2 | princess 右目尻・まつげ根元: 約x828–842,y580–611 | まつげの根元へ白目色の角張った短い切れ目が複数食い込み、上瞼からまつげが一つの暗い形としてつながらない。現在sourceの原寸cropとdetailの両方で見える。これはまつげの本数や顔の比率の差ではなく、部位の接続の不足であり、眼の貼り付け感を強める別の局所要因。 | 目尻で上瞼とまつげを自然につなぎ、根元の白い短冊状の食い込みをなくす。まつげ全体を太い塊にするのでなく、根元から先へ連続して先細る形として確認する。 |

B03-1は候補23と全く同じ画素の不良を残しているという意味ではない。候補26では丸い虹彩と白目が増え、肌上の薄い外輪だけだった以前とは状態が変わっている。その現在の形でも、瞼・白目・肌が連続した面としてなじんでいないためFAILを維持する。

B03-2は外周の影や虹彩位置だけを調整しても残り得る接続の問題として記録した。原因となるコード箇所はこの画像診断では確認していない。

## 旧指摘と口元の現在再判定

| ID / 対象 | source座標 | 現在の判定 |
| --- | --- | --- |
| B01 magic 顎と首 | x737–823,y777–790 | **旧点列は解消状態を維持。** 顎下は連続した暖色の影で、ビーズ状の反復を確認しない。 |
| B02 space 顎下・ヘルメット内縁 | x921–1003,y1080–1104 | **旧縞は解消状態を維持。** 灰色と明色の櫛状の縦筋を確認しない。 |
| B04 ocean イルカ口 | x1020–1112,y595–693 | **旧段差/まだらな縁は解消状態を維持。** 暗い口腔と一つの舌が読める。右上の小さい内部の折れは残るが、以前の粗い切り貼り状の縁には戻っていない。 |
| B05 ocean 魚口 | x568–620,y1255–1294 | **旧横帯は解消状態を維持。** 小さい暗い口腔の中に一つの舌として読める。 |
| B06 princess ウサギ口 | x1038–1123,y1385–1475 | **接続・重大退行チェックPASS。** 鼻下、左右マズル、口角、口腔、舌はつながる。毛色で切断され、舌が浮く候補23の状態は再現しない。 |
| B07 animals 犬口 | x574–741,y1110–1235 | **接続・重大退行チェックPASS。** 鼻下からマズル、両口角と暗い口腔、舌が連続する。候補24で確認した回復は保たれる。 |
| B08 ocean 亀口 | x705–819,y990–1068 | **接続・重大退行チェックPASS。** 左右口角と口腔が舌を囲む。緑の顔へ舌だけが置かれる切断はない。 |

B06〜B08のPASSは候補24と同じ接続・重大退行の範囲であり、太く均一な口縁の仕上げ差まで消えたとの判定ではない。候補19・23の当時のFAIL、候補24の限定PASSを改変しない。

## 非ブロッカーの仕上げ残件

| 対象 | source座標 | 現在の所見 |
| --- | --- | --- |
| ウサギ・犬・亀の口縁 | ウサギx1040–1121,y1404–1477; 犬x575–738,y1113–1236; 亀x706–821,y992–1068 | 原画の柔らかい影に比べ、口角と下縁が均一な灰色/茶色/緑色の帯として少し平たく見える。表情と口腔の接続を壊す重大退行には分類しない。 |
| vehicles 前後タイヤ上端 | 前x416–512,y1008–1043 / 後x166–227,y865–902 | capはフェンダーへつながるが、暗い空間とタイヤの境界に小さい波打ちが残る。旧突出capや純白の切断patchの再発としては見えない。 |
| princess 右頬と髪 | x812–834,y625–675 | 肌の外縁に小さい階段状の硬さが残る。広範囲の白ハローではない。 |
| princess ウサギ内耳 | x1253–1290,y1221–1322 | 内耳の暗いL字状の縁が毛の柔らかさに対して線として強い。 |
| dinosaurs 鼻孔 | 左x330–373,y479–541 / 右x440–494,y511–571 | 濃い楕円が均一で、鼻の丸い面に比べ平たい。 |
| dinosaurs 口の奥 | 主にx598–710,y642–759 | 舌には光がある一方、奥のえんじ色の面は原画より均一で、深さと歯の接触影が弱い。口角と舌の構造自体は連続し、今回の独立ブロッカーにはしない。退行が生じた時点をこの確認で確定していない。 |
| space 右肩上部 | x1186–1218,y1089–1118 | 白い穴はないが、小さい灰色の面が周囲より局所的に平たい。 |

これらの軽微な残件を、B03によるFAILの理由へ一括して水増ししていない。今回の主要な不足は人物眼の一体感と目尻の接続である。

## 全10テーマの確認

| テーマ | 実際に確認した範囲と所見 |
| --- | --- |
| princess | 全体、人物の顔/眼/眉/鼻/口、首/手、髪、ウサギ、裾を確認。B03が残る。B06の口切断は再現せず、主シルエットや裾の旧ひげ断片に新しい主要不良は確認しない。 |
| magic | 全体、人物の顔/眼/眉/鼻/口、顎下/首、両手、襟、杖/ランタンを確認。B03が残る。B01の点列と旧襟gapは再現しない。 |
| animals | 全体、犬/猫の顔と口、淡い毛並み、足元、木/枝と地面の草を確認。B07の接続回復を維持。猫の口とひげ、毛の可読性は保たれ、新しい主要な切断は確認しない。 |
| ocean | 全体、イルカ/亀/魚の眼と口、外形、泡を確認。B04・B05の改善を維持。B08の接続回復も維持し、舌の浮きは再現しない。 |
| dinosaurs | 全体、顔/眼/鼻/口/歯、手足、卵/岩を確認。鼻孔と口の奥の平たさを軽微な残件として記録。主輪郭、歯と舌の接続に新しい主要な切断は確認しない。 |
| construction | 全体、油圧部/金属、窓、履帯、コーンを確認。旧ピンホールは再現せず、ガラスと金属の基本的な立体感は読める。 |
| robots | 全体、顔/口/眉、肘/関節、手足、金属面を確認。口は見え、肘の青い接続も保たれる。旧白gapの再発は確認しない。 |
| space | 全体、人物の顔/眼/眉/鼻/口、顎下/肩/ヘルメット、宇宙服、ロケット/星を確認。B03が残る。B02の縞と旧二重口に見える鼻下弧は再現しない。 |
| vehicles | 全体、前後輪、cap、灯火、窓/ガラス、ボディの明暗を確認。旧capの独立ブロッカーは再発せず、軽微なタイヤ境界の波打ちが残る。 |
| flowers | 全体、花びら/葉/茎、包み紙/リボン、蝶の体/目を確認。基本的な素材光と輪郭は保たれ、新しい主要な欠損は確認しない。 |

全体に広がる色の漏れ、白いハロー、主シルエットの崩壊は今回確認しなかった。「新しい主要不良は確認しない」はsource目視の範囲の所見であり、そのテーマの全状態や実機採用を承認する意味ではない。

## 原寸cropと証拠の版

指定画像に加え、メモリ上で現在sourceとregisteredの同位置cropを表示した。人物眼はprincessの600,505,255,150、magicの670,570,245,150、spaceの905,875,290,170（左x,上y,幅,高さ）。姫の右目尻は740,540,115,115、恐竜の口は420,620,330,260でも比較した。magic左眼は680,580,85,90、space右眼は1080,880,110,130のsource原寸cropで確認した。cropは別の証拠ファイルとして保存せず、元画像のhashに結び付ける。

確認開始と終了で、証拠表の33ファイルすべてのSHA-256が一致した。source10枚、detail10枚、registered10枚、home参照3枚が同じ版だった。参照13画像は候補23の採証時からもhash不変だった。

本依頼では比較JSONを再生成・再実行していない。native/tiledとdirectの一致、1/2/4状態、実Chromeの表示/操作、物理端末、性能、ユーザーによる採用/承認も未確認であり、このsource判定に含めない。P05性能停止の扱いは変更していない。

## 証拠SHA-256

パスはプロジェクト `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド` からの相対パス。開始/終了hashは全件一致。

| ファイル | SHA-256 |
| --- | --- |
| test-results/smooth-home-i34/revision-26/after/princess-source.png | `c619befe4250746e5f2a726d187ab038b8bbc2b5781bc7905103773da716a4f8` |
| test-results/smooth-home-i34/revision-26/after/magic-source.png | `77b4b26a15139026f46bfa4809cb5754f2cf7cc889113b326ade668d3ef73c51` |
| test-results/smooth-home-i34/revision-26/after/animals-source.png | `521c0ad90b593e8aa1536448bab5842194540f0ad9ccdde33659d601f41313ed` |
| test-results/smooth-home-i34/revision-26/after/ocean-source.png | `738f2d800afda938e80e17eff3455f58900f913a8b9a98fd2efcc652b162b059` |
| test-results/smooth-home-i34/revision-26/after/dinosaurs-source.png | `0967954718e3f3942e93f466c6a6634a65f7b33af4cb98f06bc829d70579b884` |
| test-results/smooth-home-i34/revision-26/after/construction-source.png | `a6a1522b4d972746e4518dbbed11dd4b2895ced1300bb56cc052c9d7f62cbe3d` |
| test-results/smooth-home-i34/revision-26/after/robots-source.png | `16535c770a2f82d09ad782232f5b20abc964441e0ea415fe0877dd0a0cd5f4d6` |
| test-results/smooth-home-i34/revision-26/after/space-source.png | `43eca9caed55f6df8ab7d79ffeb87e5cb0872e51d818f9fcc7f2abe7d35fcf3b` |
| test-results/smooth-home-i34/revision-26/after/vehicles-source.png | `038baba072f3fbd9aee0ee23e76f6c98a3bc48c81459115a0a22b37c27852665` |
| test-results/smooth-home-i34/revision-26/after/flowers-source.png | `f214c8454b9c2ca6f6442ccef0aaf299ec05ba4c79c66d30edddf6497414e4c7` |
| test-results/smooth-home-i34/revision-26/after/princess-detail.png | `de177d0ddd7d588d22bc3b1ff0d46d256e8e6c6f8aee1de8ec5f155cf7b344ab` |
| test-results/smooth-home-i34/revision-26/after/magic-detail.png | `0d43ad29b981ed1781141543f60603d9f827b50631e855b912be4317457b95d0` |
| test-results/smooth-home-i34/revision-26/after/space-detail.png | `e550ac9ae409130ea12f4443e5485951fc4f1f650d6ab3f318ba65c0b3bba2f6` |
| test-results/smooth-home-i34/revision-26/after/ocean-detail.png | `00490f680e042252cabb2414fdf6561f0604437e6c63a64157b1c3c820eb736b` |
| test-results/smooth-home-i34/revision-26/after/fish-detail.png | `f86123de767aea3e6b6011551df2303e4914817785f7154e522845664705d68a` |
| test-results/smooth-home-i34/revision-26/after/vehicles-detail.png | `7257d1e6025c4e7bce53ecdcb98cbb465f71f7470970738864193d7459ba22ea` |
| test-results/smooth-home-i34/revision-26/after/robots-detail.png | `6bef3018ddc261ad769a1c0032bea38e26034d5213fcc1f3b7e8a9b12e7a9b02` |
| test-results/smooth-home-i34/revision-26/after/bunny-detail.png | `25e969564d8bf9abfe08bcd6e46e7908c1fae6c8ba5ed34e332402fe4e208b5a` |
| test-results/smooth-home-i34/revision-26/after/dog-detail.png | `e874f6ca29fd65ff6084d6e0f3b9af0850a04f89f45f43f804382ce24a28ee55` |
| test-results/smooth-home-i34/revision-26/after/turtle-detail.png | `ab2bbbb52ea0d9b36caa69daf4a2762d5a1b9195aa4830742ad7cc4b9ba62e8d` |
| content/smooth-finish-i34/derived/princess-registered.png | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| content/smooth-finish-i34/derived/magic-registered.png | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| content/smooth-finish-i34/derived/animals-registered.png | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| content/smooth-finish-i34/derived/ocean-registered.png | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |
| content/smooth-finish-i34/derived/dinosaurs-registered.png | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |
| content/smooth-finish-i34/derived/construction-registered.png | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` |
| content/smooth-finish-i34/derived/robots-registered.png | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` |
| content/smooth-finish-i34/derived/space-registered.png | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| content/smooth-finish-i34/derived/vehicles-registered.png | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| content/smooth-finish-i34/derived/flowers-registered.png | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` |
| apps/web/public/images/islands/princess-v1.webp | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| apps/web/public/images/islands/magic-v1.webp | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| content/smooth-finish-i33/references/home-target.png | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |

