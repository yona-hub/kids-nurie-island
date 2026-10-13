# 新版ベクターの独立目視監査（2026-10-09）

現在の独立判定：**revision 8 / build f3c10731…は監査した可視範囲でPASS。** 全150実画像（90倍率/DPR＋30途中倍率pan＋30 fit復帰）、顔/ライト8枚、動的DPR3枚と追加home/group9枚の根拠を末尾に記録した。車の固定白2点はnative3画材と実倍率2/4でも消失し、既存VV-01〜VV-06の解消も維持。最新browser159枚のうち55枚を直接目視し、104枚は以前直接確認した同一PNGとのSHA256/byte一致で継承した。旧車media4画像は最新合格から除外し、別固定の新3画材を採用した。各旧FAILは履歴として保持。Visual baseline・製品コードは変更していない。本監査は保存/性能/実機/人間採用や全体READYの判定を行わない。

判定：**FAIL / NOT READY**。以下は初回 revision 2 の固定画像に対する独立判定。目の白抜けと恐竜の黒い残片、姫のホーム原画への未到達を確認した。修正後の画像およびブラウザ90条件は再確認待ち。実装担当がこのFAILを自己判断でPASSへ変えない。

revision 3 の再監査結果を末尾へ追記した。VV-01/VV-02の主要欠け・残片はnativeで解消。VV-03の視線差を確認し、revision 4を待って最終再判定する。初回FAILは履歴として保持している。

revision 4の新しいP1も末尾へ追記した。全10を開いて、黒線周囲の白筋と犬/亀の顔部品の消失を確認した。最新版の目視ゲートは引き続きFAIL / NOT READY。実装修正後の資料を待ち、一巡を保留している。

revision 5の再監査を末尾へ追記した。白筋と犬/亀の黒線はnativeの指摘箇所で解消。男の子の画面右眼に原画の太い眼縁が復活し、新眼縁と二重化している（VV-06 / P1）。姫のVV-03は配置を改善したが、home対比の虹彩/瞳縁/反射の品質差が残る。現在の目視ゲートは **FAIL / NOT READY**。最新ブラウザは未確認で、baselineは更新していない。

## 範囲と対象

- 指示元：AGENTS.md、`docs/storybook-improvement.md` の I15/I16/I17・V01〜V08/V12、`docs/history/vector-user-plan-20261009.md`。
- 新 `*-storybook-v2` 10件、`PaintingProfile.version = 3`。旧380、旧最終PASS、旧revision 4の比較画像は最新版の合格証拠に使っていない。
- 所有：この報告と `test-results/vector-visual-audit/` の独立証拠だけ。実装・baseline・共有計画の状態を変更していない。
- 画像目視のみ。性能、保存、旧作品コピー、同期のコード監査は別担当。目視からそれらの成功を推定しない。人間の新版採用も未確認。

## 初回固定の同一性

2026-10-09 00:31:57 JST（UTC `2026-10-08T15:31:57.622Z`）に54ファイルをhash固定し、原本のbyte copyを保存した。全source・compiled 10件・native画像の完全なSHA256は [identity.json](../../test-results/vector-visual-audit/initial/identity.json)。manifest自身のSHA256は `36b7299e4aff2795127a030efde77421cad642b9b3377bfcb3f1b50ea2db0db9`。

hashは観測時の同一性であり、native検査の実行対象hashを後付けで証明するものではない。native revision 2 のJSONは11/11成功だが、以下の目視FAILを解消する証拠ではない。Git repository はこの作業場所では検出されず、Git revision は不明。

| 証拠 | SHA256 |
| --- | --- |
| home姫原本 `content/brand-generated/originals/princess-v1.png` | `c3df006d7ae944f6b46f502bf46444c6945ec3904236888563c01c526f26db01` |
| `native-revision2-vitest.json` | `f3483af507c2296130a25fbd731c8777fa617c6c934255200988265180af58d1` |
| `princess-eye-states.png` | `a64aed07999e4cb009786b13cb070391b6864e4f3b1556acb382ce9d1e45040e` |
| `princess-smooth-2048.png` | `c343c25a48ea77f127a45ccb6bf148ab2aa5c6d1bd60fef0093caa9925f995b9` |
| `magic-smooth-2048.png` | `ebc6f7b0009c00d0fd0e0fa910aa9aeda3b21767456603a731ec7ef695369f7d` |
| `dinosaurs-native-tiles.png` | `d4dabf4a8b3cf02382f9d3a3b09b38a2fb90a1b022d75d58ff98abe4ecba676f` |
| `all-eyes-review.png` | `c1577bca0fed448dfb3f1a7b62324339bb56165ae1d295e6b154bb34655e3ddd` |
| `compiled/lineart-review.png` | `6bd3eb84d420ca7f02c47c38c6ba431576b4da35e428460e64085fa58b19191c` |
| `faceless-vehicle-generation.json` | `0ad183f77ece6dcfaf2708aa4e34f74cd709caef4105ebe625991f2f675fadea` |
| `excavator-faceless-v1.png` | `6de9789ee4824f96952fa65b5b958c5096c102aed645786e4b257c3ff9f3330f` |
| `construction-v2.png` | `b3898eea5bd05fd8c59b01d0d665faec8541244dbc610e6ac006fa6634cfd34f` |

以下の座標は各原画像の左上を `(0,0)` とする。拡大cropは整数nearest-neighborのみ。描き足し・修正・平滑化はない。[cropの原画像・矩形・hash](../../test-results/vector-visual-audit/initial/crops/manifest.json)に再現条件を保存した。

旧採用線画の原本10件は構図/実部品の比較専用に [source-reference](../../test-results/vector-visual-audit/initial/source-reference/manifest.json) へ別途固定した。[比較用一覧](../../test-results/vector-visual-audit/initial/source-reference/source-reference-all10.png) のSHA256は `0b9560907da51eadb0c89354f8ef512aae15d04504a655901beec6acbfc901a8`。旧版のPASSや採用を新版へ転記するためではない。

初回実画面124ファイル（90条件＋途中倍率pan30＋home/代表画面3＋matrix1）を `2026-10-09 00:41:40 JST` に [revision2-browser](../../test-results/vector-visual-audit/revision2-browser/identity.json) へ固定した。manifestのSHA256は `2552f3ec324d95a2bddbecbe637ce6dced4ae6fd65e9fa644bb514f10f0ff544`。現時点で直接目視した実画面は姫/男の子/恐竜/車の4倍DPR3、姫/男の子/恐竜の2倍DPR3、車の1倍DPR3、姫のfractional-pan DPR3とhomeの10枚。この124枚すべてを目視済みとは扱わない。

## 不合格

### VV-01 / P1：姫と男の子の目の外に白い欠け

**FAIL — V02/V05/V06。** 「なめらか」のPNGにも出ているため、クレヨン・鉛筆の意図した紙目とは区別できる。

- 姫：`princess-smooth-2048.png` の画面右目外側および上、概ね `x1038〜1088, y705〜817`。肌を白く削った尖った帯が目と顔の輪郭の間へ伸びる。茶色の `princess-eye-states.png` 下段でも `x995〜1029, y628〜715` に同様の白い鋸歯状の欠けがある。
- 男の子：`magic-smooth-2048.png` の画面左目上、`x870〜951, y726〜789`。新しい上まぶたと離れた独立の白い半円がある。目の下 `x900〜935, y838〜846` にも小さい白い突起がある。`magic-native-tiles.png` では左目上 `x270〜305, y233〜243`。
- 影響：白目と別の白い輪郭が肌に浮き、原寸では二重の輪郭、拡大では欠けとして見える。I17の白筋/二重線/不要線を残さない受入条件に反する。
- 再現：固定PNGを開き、上記座標を等倍または整数拡大する。[姫smooth拡大](../../test-results/vector-visual-audit/initial/crops/native-princess-smooth-face.png)、[男の子smooth拡大](../../test-results/vector-visual-audit/initial/crops/native-boy-smooth-face.png)。
- 初回の実ブラウザでも同じ欠けを [姫2倍DPR3](../../test-results/vector-visual-audit/revision2-browser/frozen/test-results/vector-improvement/browser/princess-z2-dpr3.png)、[男の子2倍DPR3](../../test-results/vector-visual-audit/revision2-browser/frozen/test-results/vector-improvement/browser/magic-z2-dpr3.png) で確認した。
- 必須の最小修正：旧眼縁を消した部分を、顔の制作上の親領域の塗りで覆う。新openingの外は肌として一体化し、現在の白目/眼縁を壊さない。色や材質による推測グループ化ではなく制作部位の対応で処理する。
- 再test：姫/男の子の未着色・smooth・crayon・pencil、黒/茶/青/桃/淡色、1/2/4倍・DPR1/2/3、PNGと実画面で旧白片の消失を確認。塗った顔を未着色にしても、周囲の隣接色が削れないことを別の機能検査で確認する。

### VV-02 / P1：恐竜の下眼縁の黒い残片

**FAIL — V06。** `dinosaurs-native-tiles.png` の画面右目の右下 `x312〜322, y213〜220` に短い独立した黒いダッシュが残る。左目右下 `x217〜233, y191〜207` にも、新眼縁から離れた旧鼻先の線の端が残る。右目の残片は [all-eyes-review](../../test-results/vector-visual-audit/initial/frozen/test-results/vector-improvement/native/all-eyes-review.png) の `dinosaurs/r04` 3色とも同位置に見える。

影響：まつげはないが、目の近傍に途切れた追加線のようなものが浮いている。原画の鼻先輪郭と新版の眼縁を整合させる必要がある。

再現：[恐竜の顔crop](../../test-results/vector-visual-audit/initial/crops/native-dinosaur-eyes.png)を開く。必須の最小修正：旧下眼縁の孤立残片を除き、鼻先の線は自然な連続輪郭として残す。再test：恐竜の未着色と3画材を顔全体/拡大で比較し、鼻先の形を壊さず不要な黒片が消えていることを確認する。

初回の [実ブラウザ恐竜2倍DPR3](../../test-results/vector-visual-audit/revision2-browser/frozen/test-results/vector-improvement/browser/dinosaurs-z2-dpr3.png) の上端の眼の右下にも白片と黒ダッシュが見える。

### VV-03 / P1：姫の目がhomeの構造・自然さへ未到達

**FAIL — V05。** 本物のhome原本を新たに開いて直接比較した。旧候補のcropでは判定していない。

- homeの白目は主に眼の外側に幅を持つ三日月として残る。丸い虹彩はその内側へ寄り、上側は上まぶたと自然に重なる。
- revision 2 は虹彩がopeningをほぼ一杯に覆い、白目が全周の細い均一な帯に近くなる。虹彩と白目の関係が単純な同心の輪となり、顔の向きと立体感がhomeほど読み取れない。
- homeの主反射は小さい不規則なまとまり。新版は正円/楕円と離れた小さい丸の組合せが明瞭で、自然な反射の形へまだ届いていない。
- 茶色の比較でも、新版の瞳縁は明瞭な黒丸、虹彩は広い滑らかな明暗で、homeの瞳から虹彩へ混ざる柔らかさと不規則な虹彩の模様が弱い。白目/虹彩/瞳/反射の配色が成立したことだけで「homeほぼ同品質」をPASSにしない。

根拠：[homeの新規crop](../../test-results/vector-visual-audit/initial/crops/home-princess-eyes.png)（原本 `x469,y195,w173,h90`）、[最新版の茶色crop](../../test-results/vector-visual-audit/initial/crops/native-princess-brown-eyes.png)（`princess-eye-states.png` の `x840,y609,w186,h112`）。

影響：I12の最優先の品質基準とI17のhome基準の姫の目が未達。必須の最小修正：姫だけ左右のirisの位置/大きさを制作し直して外側の白目を確保し、上まぶたへ自然に重ねる。主反射を小さい不規則形へ、瞳縁/虹彩模様を自然にする。全色へ茶/金を混ぜる旧処理は復活させない。再test：同じ茶色・同じ目の大きさでhome対比を保存し、黒/青/桃/淡色の色相保持も確認。1/2/4倍・実画面/PNGで独立目視を再実施する。

## 合格した限定範囲

| 対象 | 観測した範囲 | 判定と限界 |
| --- | --- | --- |
| 全10の構図・輪郭 | 比較用source原本10件一覧、新 `lineart-review.png` と全10 `*-native-tiles.png` を直接確認 | 主要な構図、角、細い手/指/蝶の触角/ロボットのアンテナ、線画の穴の形は保たれている。原寸の可視範囲では粗い矩形輪郭や大きな漏れを検出せず。上記眼周囲を除く限定PASS |
| 全10のtile | 640×800のnative合成画像10枚 | 直線状のtile継ぎ目を目視検出せず。90ブラウザ実条件・途中倍率/移動/DPR変更は未確認で、V03全体PASSではない |
| 男の子/恐竜/動物のまつげ | `all-eyes-review.png` の20眼と顔全体 | 姫以外に追加まつげを視認せず。恐竜は縦の瞳/虹彩、人間/兎/犬/猫/海の友達は元顔に沿う位置。不要線/白片についてはVV-01/VV-02が残る |
| 目の配色 | 全20眼の黒・青・淡色、姫の茶・桃、未着色 | 白い白目/反射、選択色の虹彩、同系の暗い瞳を視認。全眼を茶/金へ寄せる見た目なし。全20眼×5色すべては未確認 |
| 3画材 | 姫/男の子 `three-media-review.png`、各smooth/crayon/pencil 2048画像 | smoothは面、crayonは不規則な顔料抜け、pencilは密な斜めの紙目として区別可能。眼外の白片はsmoothにもあるため紙目と混同していない。実物参照への最終同等性/全10画材は対象外 |
| 働く車の線画 | old採用原本・新生成原本・compiled一覧・nativeを比較 | 目/眉/口を除去。前窓、側窓2枚、ドア/ハンドル、3通気口、ブーム/バケット/ヒンジ、履帯/車輪、コーン2個を視認し保持。部品を顔に見立てた新線なし。見た目のV08限定PASS。部品のhit/色copyは別検査 |
| 働く車のhome | old `construction-v1.png` と新 `construction-v2.png` 原本を比較。初回 `home-chromium-mobile.png` の4段目左カードも確認 | ショベル前面の目/口を除去し連続した黄色金属面。青い窓、作業灯、排気/通気口、履帯、消防車の窓/ライト/グリル/梯子/ホース等を保持。画像生成promptと実hashが記録に一致。初回mobile homeの可視範囲でも顔や目立つmatte縁は見えない。全配信密度/alpha全pixelの検査は未確認 |

## 未確認と再判定の条件

初回のブラウザ90画面は保存され、独立のbyte copyも完了した。今回のFAILが出たrevision 2の画像は失敗証拠として保持し、修正後のhash・build・実画像を別版で固定して確認する。旧hashの画像やnative11成功数だけで判定を更新しない。

未確認：ブラウザ全10×倍率1/2/4×DPR1/2/3の全件目視、途中倍率/移動/縮小/DPR変更、修正後の実配信home、全20眼×5色、実画面の消去/保存/再読込/同期、旧作保持、性能、Android実機、人間の新採用。保存/性能は他担当の検証範囲である。

目視ゲートはVV-01〜VV-03の修正後に独立再確認するまでFAIL。Visual baseline更新へ進める根拠は揃っていない。

## revision 3：nativeの独立再監査

`2026-10-09 00:53:29 JST` に現在の54ファイルを [revision3/identity.json](../../test-results/vector-visual-audit/revision3/identity.json) へ別固定した。manifest SHA256：`464ce02b73f4a4dc89e7dfe240bdec3cba3ae6be359cc4447d5a57e827ab4dc0`。この固定のnative画像4枚と新しい [crop](../../test-results/vector-visual-audit/revision3/crops/manifest.json) を直接開いて比較した。旧 `native-revision2-vitest.json` は固定対象の一覧に含まれるが、revision 3の検査成功として利用していない。

| revision 3 の画像 | SHA256 |
| --- | --- |
| `princess-eye-states.png` | `1f97d0cdd5fe7900b5355afb2b9931b9024dfda25da50a5ada68fc4376472f09` |
| `princess-smooth-2048.png` | `38f023d3a793e89a2606037b55d6bcdc4d350175ba67bd4e8cdbdcb43c648607` |
| `magic-smooth-2048.png` | `a13331638be9e41956c10f5f9e4d1894199124f0188f59aa81720df0ede93f78` |
| `dinosaurs-native-tiles.png` | `a71fce535e2b0f9e010d4688d0848835a6938e4fd70c6069a099dd80b414392e` |

- **VV-01：nativeの指摘箇所はPASS。** 姫の画面右目の外の鋸歯状の白帯、男の子の画面左目上の独立白半円と下の白突起は消失した。肌の面が新openingまで連続し、白は眼のopening内に収まっている。[姫のsmooth顔](../../test-results/vector-visual-audit/revision3/crops/native-princess-smooth-face.png)、[男の子のsmooth顔](../../test-results/vector-visual-audit/revision3/crops/native-boy-smooth-face.png)。ブラウザ・他画材・保存後の確認はこの時点では未実施。
- **VV-02：右目の黒残片はPASS。** `x312〜322,y213〜220` の黒いダッシュは消失した。左目の下の斜線は鼻先の原画形状から来るものとして維持されており、今回消失を確認した右目の旧下眼縁残片と分けて扱う。追加まつげはない。[恐竜顔](../../test-results/vector-visual-audit/revision3/crops/native-dinosaur-eyes.png)。ブラウザや全色への展開はまだ未確認。
- **VV-03：改善したが視線差が残り、最終判定はrevision 4へ。** 全周白帯から、片側に幅を持つ白目へ変わった。主反射も小さくなった。一方でrevision 3は両眼のirisをそれぞれ内側へ寄せ、左右が中央へ寄る見え方になっている。home原画の両眼は画面左への視線で、画面右の白目に幅がある。この方向差を解消した制作値で再比較する必要がある。

### homeの説明の訂正

初回VV-03で「homeの白目は外側」「両眼のirisを内側へ」と一括した説明・提案は正確でなかった。原本を再度crop比較し、**homeでは両眼とも画面右の白目が広く、虹彩は画面左へ寄る**ことを確認した。画面左の眼の白目は鼻側であり、左右とも解剖学的な外側へ広がるという意味ではない。元の記述は監査履歴として残し、この訂正を現在の解釈とする。実装担当にも訂正を伝えた。

根拠：[homeの同一原本crop](../../test-results/vector-visual-audit/revision3/crops/home-princess-eyes.png)、[revision 3の茶色crop](../../test-results/vector-visual-audit/revision3/crops/native-princess-brown-eyes.png)。この視線差は、初回の全周白帯とは区別できる新たな制作上の不足である。

次の再test：revision 4を新hashと画像で別固定し、3指摘と顔全体の自然さ、目の5色/3画材を再判定する。そのnative確認後、最新ブラウザ90＋途中倍率pan30を確認する。初回FAILや旧画像、自己判断を基準更新の根拠にしない。現時点でVisual baseline更新の合格条件は揃っていない。

## revision 4：native全10とhomeの独立再監査

判定：**FAIL / NOT READY**。VV-01の眼外の白片とVV-02の恐竜右目の黒片は解消状態を保っているが、新しい白筋と顔部品の消失を検出した。`2026-10-09 01:22:43 JST` の [revision4/identity.json](../../test-results/vector-visual-audit/revision4/identity.json) に54件を固定。manifest SHA256：`debc7757996a8831cad3357747e9ff83c8b143af41d6e9940c36411651393307`。原本の顔比較・all-eyes・3画材・全10 native画像を直接開いた。

ブラウザ124件は `2026-10-09 01:30:56 JST` に [revision4-browser/identity.json](../../test-results/vector-visual-audit/revision4-browser/identity.json) へ固定。manifest SHA256：`c76e5a7d98b7797bf8fbfb938f10795e6e9647623cc9757e3911619c496757fc`。nativeの新FAILが出たため、この版のブラウザ全件目視は実施していない。実装担当の機械検査成功を目視FAILの解消と扱わない。

| revision 4 の主要画像 | SHA256 |
| --- | --- |
| `princess-eye-states.png` | `c03403b8dc59551983327cdd0d5842537002fac12f1a9aa3012b3efef24d0951` |
| `princess-smooth-2048.png` | `b2bea4923f061e021dcdc2d7df1f07305c3dfc63f50d5ecfa8714a25e49cbe37` |
| `magic-smooth-2048.png` | `ccc5437f58041949b7f510d03011a58419b9762a2c8143e4c2c455e9229deb8d` |
| `all-eyes-review.png` | `d50ccc0c73d0bd87b61ce5c0a70b2bc4e47ca877e0fcb9e3b9f1e021c4529df3` |
| `three-media-review.png` | `ab965fe0b24d532bfe401f553b2960bdff155aec6d623892ae712780459e4fa8` |
| `animals-native-tiles.png` | `9177f43939c3ebb68ea581139aff152f7e9c0592e5cb501d465a281bd2de7c31` |
| `ocean-native-tiles.png` | `78aacb870167153668cece880471fe2b92e91d7da71bd02c6720acf19f674d2f` |

### VV-04 / P1：黒線に沿う連続した白筋の退行

**FAIL — V02。** revision 4のsmooth PNGで、黒線の周囲へ約1〜2出力pxの白縁が連続して出現した。revision 3の同じ部位にはなかった。具体例：姫の眉、鼻、口、顔/髪境界。男の子の鼻、口、顔/髪境界。smoothでも出るため、紙目と区別できる。

根拠と再現：[revision 4 姫smooth顔](../../test-results/vector-visual-audit/revision4/crops/native-princess-smooth-face.png)（PNG原座標 `x760,y600,w370,h260`）、[revision 4 男の子smooth顔](../../test-results/vector-visual-audit/revision4/crops/native-boy-smooth-face.png)（`x840,y690,w350,h300`）。[crop条件とhash](../../test-results/vector-visual-audit/revision4/crops/manifest.json)。姫の鼻は概ね `x919〜953,y784〜812`、男の子の口は `x926〜1055,y884〜953` の黒線に白縁が見える。

影響：肌が黒線まで塗れていないように見え、鼻/口が白く切り抜かれた模様になる。全10共通の面/ink処理への変更後に出たため、確認した姫/男の子だけの修正で終わらせない。

必須の最小修正：線と塗り面が同じ曲線境界を共有し、黒線下を塗りが覆うよう整合する。線外/隣接領域への漏れを増やして白筋を隠さない。再test：姫/男の子のsmooth同座標と全10×1/2/4×DPR1/2/3の最新実画像を確認する。車の窓/履帯・蝶の穴などを含め、穴を埋めず白筋と漏れを同時に解消する。

### VV-05 / P1：犬の鼻/笑い口、亀の笑い口の黒線が消失

**FAIL — V01/V06。** 眼の変更で除く対象に含まれない顔部品が消えた。

- `animals-native-tiles.png`：犬の鼻 `x258〜277,y433〜453`、笑い口 `x236〜289,y461〜491`。塗りの面は残るが黒線が消えている。猫の鼻/口は残っている。
- `ocean-native-tiles.png`：亀の笑い口 `x283〜335,y403〜430`。イルカ/魚の口は残っている。
- 初回revision 2にはこれらの黒線がある。revision 4を全10目視した際に発見し、保存済みrevision 3の同画像にも既に消失していたと比較確認した。revision 3の依頼は姫/男の子/恐竜の4画像の再監査であり、その時点では犬/亀をPASSとしていない。

影響：原画の表情とキャラクターの顔を壊している。I17の原画の顔に合う目を作る変更は、鼻や笑い口を消す許可ではない。

根拠/再現：[初回の犬](../../test-results/vector-visual-audit/revision4/face-regressions/initial-dog-face.png)と[revision 4の犬](../../test-results/vector-visual-audit/revision4/face-regressions/revision4-dog-face.png)、[初回の亀](../../test-results/vector-visual-audit/revision4/face-regressions/initial-turtle-face.png)と[revision 4の亀](../../test-results/vector-visual-audit/revision4/face-regressions/revision4-turtle-face.png)。[矩形/hashの記録](../../test-results/vector-visual-audit/revision4/face-regressions/manifest.json)。

必須の最小修正：旧眼縁/反射の除去領域と、犬の鼻/口・亀の口の制作部位を区別し、鼻/口の黒線を保護・復元する。眼外の旧白片や恐竜の不要な旧眼片を復活させない。再test：全20眼を顔全体とcropで確認し、未着色・3画材・5眼色で顔の他部品を保持する。原寸と拡大、PNGと実画面で独立再確認する。

### revision 4で改善を確認した範囲と残る判定

姫の両irisが同じ画面左へ向き、画面右の白目に幅がある配置になった。初回の全周白帯とrevision 3の左右が中央へ寄る視線差は解消。主反射は小さく、両眼で共通光源。選択色の明暗と暗い中央瞳、上側の一つの眼縁・控えめな姫のまつげを視認できる。初回の単純な同心の目から、home原画の主要な組立へ近づいた。

比較根拠：[同一home原本crop](../../test-results/vector-visual-audit/revision4/crops/home-princess-eyes.png)、[revision 4の茶色crop](../../test-results/vector-visual-audit/revision4/crops/native-princess-brown-eyes.png)。ここで確認した改善は、home原画と全pixelの模様/配色が同じという主張ではない。VV-04が顔の見た目を崩しているため、V05全体の最終目視PASSは修正後の画像で判定する。

全20眼×黒/青/淡色と姫の茶/桃、姫/男の子の3画材を直接確認した。非姫に追加まつげなし。主要な全10の構図、手/指/触角/車の実部品、穴、直線状のtile継ぎ目なしは確認したが、VV-04/VV-05を除外した限定範囲である。全20眼×5色、最新版ブラウザ90＋pan30の全件目視、保存・同期・性能は未確認。

車の新生成2原本とprompt記録は初回とhash一致。顔除去と実部品保持の原本比較は有効なままだが、最新配信homeは新しい固定実画面で確認する。

実装担当へ2件を速報し、修正後のnativeが揃うまで一巡を保留した。次の固定版でVV-04/VV-05およびV05を再判定し、その後にブラウザ全件を確認する。旧FAIL・旧画像・機械検査成功から合格を転記しない。

## revision 5：共有境界修正後のnative独立再監査

判定：**FAIL / NOT READY（native範囲）**。`2026-10-09 01:48:24 JST`（UTC `2026-10-08T16:48:24.937Z`）に56件を [revision5/identity.json](../../test-results/vector-visual-audit/revision5/identity.json) へ別固定した。manifest SHA256：`b97a0a5e272f9e8cb560823f3a47c17a5a80b748d1ecc5e96337388b8f5f9dff`。旧版のFAIL・原本・各固定版は保持した。提供されたunit記録も保存したが、その成功数を独立目視のPASSへ転用していない。

| revision 5 の主要対象 | SHA256 |
| --- | --- |
| `shared-boundaries.mjs` | `5f7a31a0521a5f541017995b83dbbc745757399e6e15ce5ab966ed9ef84d7ec1` |
| `authored-eyes.mjs` | `433e4616458045a1a777cc475ea1fca9bc603cd998b0213e793e296560341f19` |
| 姫 compiled `gen-princess-bunny-v6-storybook-v2.json` | `491e86e04d93017b51962d0dd183a8b0c621e8b28021f1a128accbe55462624a` |
| 男の子 compiled `gen-wizard-lantern-v6-storybook-v2.json` | `15b33050bd2253c1466f4e80fd25b812d5584a0249cfd16c0f8cab4a9f89338c` |
| `princess-eye-states.png` | `357474e022f098ed26fe230cc17725e62f3fbcea175232636235d8af3ef44b69` |
| `princess-smooth-2048.png` | `dc85461be88df25ae9524c33466677bfe9311c3e5a80a4f8f2420653927b7746` |
| `magic-smooth-2048.png` | `198eb780156aac10943bb1577385f6b5151bc25003e177e4b89abb1efcc1d550` |
| `all-eyes-review.png` | `97f1e434e009d394043485b4706408cca5463706aa38e9085a787d5674c9ca74` |
| `dinosaurs-native-tiles.png` | `4ddfdfe7ad047b4cd64173f3e02dc969359d7c2069a364e152ffe69570670b86` |
| `animals-native-tiles.png` | `dabc7f296c8fd83035ff78b998506b0fa3e3e9120aaaeadd3d90336ab45d79e6` |
| `ocean-native-tiles.png` | `42a638d29f24ecfabb73c739da90bd9c0885f20fbe65b5b8f62d5aaea7bb3cd5` |
| `three-media-review.png` | `1001a1284ca4ae955575dbd0b93197959995f480bf29d1e26d93c708c69b03a7` |
| `unit-vector-current.json` | `a68f5a6dbf0232f59fef9ba5e72bf1ead27d9576dc067c94b251fd793e66df12` |

直接開いた範囲：全10の `*-native-tiles.png`、compiled線画一覧、全20眼×黒/青/淡色sheet、姫の未着色/桃/茶/青sheet、姫/男の子の3画材sheetと各顔crop、本物のhome姫原本と同一crop、犬/亀の初回と最新版crop。整数拡大cropは比較補助であり、アプリの倍率2/4・DPR条件を実行した証拠として扱わない。[共通cropの条件/hash](../../test-results/vector-visual-audit/revision5/crops/manifest.json)、[顔部品の比較条件/hash](../../test-results/vector-visual-audit/revision5/face-regressions/manifest.json)、[3画材の顔crop条件/hash](../../test-results/vector-visual-audit/revision5/media-faces/manifest.json)を保存した。

### 解消を確認した限定範囲

- **VV-04：姫/男の子のsmooth指摘箇所はPASS。** 眉、鼻、口、顔/髪境界で、revision 4の連続した白縁は消失。肌が黒線へ連続している。[姫smooth](../../test-results/vector-visual-audit/revision5/crops/native-princess-smooth-face.png)、[男の子smooth](../../test-results/vector-visual-audit/revision5/crops/native-boy-smooth-face.png)。crayon/pencilでは不規則な紙目が残り、黒線全周へ連続する白筋とは区別できる。新しい大きな隣色/背景漏れは、今回開いた全10 nativeの可視範囲で検出していない。最新ブラウザ全条件のV02合格を意味しない。
- **VV-05：犬の鼻/笑い口、亀の笑い口のnative指摘箇所はPASS。** 犬の鼻の閉じた縁と口の黒線、亀の笑い口が復元した。[最新版の犬](../../test-results/vector-visual-audit/revision5/face-regressions/revision5-dog-face.png)、[最新版の亀](../../test-results/vector-visual-audit/revision5/face-regressions/revision5-turtle-face.png)。猫、イルカ、魚の鼻/口にも今回新たな部品消失を視認していない。提供された動物/海のfull画像はpencilであり、両テーマの他2画材の最新実画像は未確認。
- **VV-01の旧白片、VV-02の恐竜右目の黒ダッシュ：native指摘箇所はPASS。** 姫の眼外の鋸歯状白片、男の子の左目上/下の旧白片は再発していない。恐竜右目下の孤立黒ダッシュもない。左目下の原画の鼻先線は維持され、鼻/口/牙の形を保っている。眼周囲の不要線全体は次のVV-06によりFAILである。

全10の主要な構図、花/星/帽子/卵/岩の角、蝶の穴/触角、指/手、ロボットのアンテナ、ロケット/ヘルメット、兎の耳などの細い部位は、原本比較と今回のfull画像で保持を確認した。直線状のtile継ぎ目は目視検出していない。非姫に追加まつげは見えず、恐竜の縦長の瞳、各顔に沿う眼の位置も保持される。これらはVV-06を除くnativeの限定PASSであり、V01/V03/V06の全実条件完了ではない。

### VV-06 / P1：男の子の画面右眼で太い原眼縁が復活

**FAIL — V05/V06、I17の二重眼縁禁止。** `magic-smooth-2048.png` の画面右の眼に、細い新版眼縁とは別の太い黒い弧がある。弧の範囲は概ね `x1067〜1155,y772〜852`。`magic-native-tiles.png` では概ね `x333〜361,y241〜267`。上側から眼の外側へ回り、肌色の隙間を挟んで二重線になる。smooth/crayon/pencilの3画像と `all-eyes-review.png` の `magic/r15` 全3色で同じ形を視認した。

根拠と再現：[新版の右眼crop](../../test-results/vector-visual-audit/revision5/face-regressions/revision5-boy-right-eye.png)（原画像 `x1050,y757,w115,h140`、4倍nearest）、[原画の顔crop](../../test-results/vector-visual-audit/revision5/face-regressions/source-boy-face.png)。原画では髪際の眉が別位置にあり、この弧は原画の右眼の上/外側眼縁に対応する。眉を不要線と誤判定したものではない。原画hash：`08eb9d02b3017b130bce97820a3c76ff7247487db559273fdb18dc0d4f0015b0`。新版の [smooth顔全体](../../test-results/vector-visual-audit/revision5/crops/native-boy-smooth-face.png) でも区別可能。

影響：右眼だけ太い元の縁が外へ浮き、左右のまぶたの自然さが崩れる。白筋と犬/亀の口が解消した事実で、この新しい二重線をPASSにしない。

必須の最小修正：男の子のこの眼の原眼縁と新版opening/lidの制作対応を再整合し、上/外側の旧縁を除去して一つの自然な眼縁にする。髪際の眉、鼻/口、犬/亀の復元を維持し、眼外の白片を再発させない。reclaim方法そのもののコード適否は本監査の対象外である。

再test：男の子の未着色と5眼色、smooth/crayon/pencilの顔全体/右眼crop。姫/恐竜の旧眼片、犬/亀の顔部品の比較も再実施する。その新hash版で全10×倍率1/2/4×DPR1/2/3、途中倍率/移動/縮小/DPR変更の実画像を独立確認する。

### VV-03 / P1：配置は改善、home対比の質感差は残る

**FAIL継続 — V05。** 本物のhome原本（SHA256 `c3df006d7ae944f6b46f502bf46444c6945ec3904236888563c01c526f26db01`）を今回も直接開き、[同一home crop](../../test-results/vector-visual-audit/revision5/crops/home-princess-eyes.png) と [新版の茶色crop](../../test-results/vector-visual-audit/revision5/crops/native-princess-brown-eyes.png) を比較した。初回の全周白帯とrevision 3の中央へ寄る視線差は解消。両眼は画面左へ向き、画面右に白目の幅がある。上まぶたとの重なり、控えめまつげ、小さい白反射は改善している。

残る具体不足：homeでは瞳の暗部が虹彩の上側へ柔らかく混ざり、下側の虹彩にも不規則な細かい明暗がある。新版の茶色は、黒い正円の瞳縁と広い均一グラデーションがまだ強く、細かい虹彩模様の存在感が弱い。新版の反射は規則的な楕円と小丸の組合せで、homeの小さい不規則な反射ほど自然には見えない。これは色相の茶/金差や全pixel一致を要求しているものではなく、同じ大きさで比較できる眼の立体感・自然さの差である。

影響：白目/虹彩/瞳/反射の配色と位置が成立しただけで「homeほぼ同品質」を達成したと扱えない。必須の最小修正：選択色内の細かい不規則な明暗、瞳から虹彩への接続、主反射の形を制作調整する。全色へ茶/金を混ぜる処理や色付き下眼縁は復活させない。白目の片側幅と現在の視線を保持する。

再test：同じhome原本と最新版茶色の原寸/整数拡大を保存して比較し、黒/青/桃/淡色の色相保持も確認。姫の3画材・最新実画像の倍率1/2/4とPNGを独立確認する。現在のブラウザが旧質感のまま成功しても、この判定の解消証拠にはならない。

### 車の部品と未確認範囲

今回の `construction-native-tiles.png` でも顔表現はなく、前窓/側窓2枚、ドア/ハンドル、3通気口、作業アーム/バケット/ヒンジ、履帯/車輪、コーン2個を保持。窓や履帯の穴を塗りつぶしたような新たな破壊は見えない。顔なし2原本とprompt記録のhashは初回と一致し、原本比較の見た目のV08限定PASSを維持する。最新配信homeの実画面は今回まだ未確認。

未確認：最新ブラウザ90＋途中倍率pan30＋DPR変更、最新配信home、全20眼×5色、残る8テーマのsmooth/crayon実画像、全10×3画材の未着色/色変更、保存・同期・旧作保持・性能・実機・人間の新採用。姫/男の子の3画材確認を全10の3画材確認へ拡大して記録しない。

VV-03/VV-06を実装担当へ速報した。次は修正した新しい固定版でこの2件と解消済み箇所の退行を確認する。今回のnativeゲートはFAILで、最新ブラウザ全件の最終目視やVisual baseline更新へ進める合格条件は揃っていない。本監査で製品コード・基準・他担当の文書を編集していない。

## revision 6：眼縁・虹彩修正後のnative独立再監査

判定：**PASS（以下のnative範囲）。全体はNOT READY、ブラウザ目視待ち。** `2026-10-09 02:08:19 JST`（UTC `2026-10-08T17:08:19.382Z`）に108件を [revision6/identity.json](../../test-results/vector-visual-audit/revision6/identity.json) へ別固定した。manifest SHA256：`6a6d593756ef1da00913ce773ff9bd502d5c29fe9a33b47c5ae972f3fbd6e7d8`。画像から保存/性能の合格を推定していない。

| revision 6 の主要対象 | SHA256 |
| --- | --- |
| 姫 compiled `gen-princess-bunny-v6-storybook-v2.json` | `706dc1c61411cc36f0d1f7a63e8605837ffe5a69f47ee8f181020e04db804206` |
| 男の子 compiled `gen-wizard-lantern-v6-storybook-v2.json` | `1b6826f1d83d161f87b9a204301c148ef74219f66cb377ed4c11f941e689e9b7` |
| `authored-eye.ts` | `f8ab0ed7853436221714023fb156ab2906d7fb5d4fe03c4a36fe195df8396189` |
| `authored-eyes.mjs` | `5f3836764ca22a914152ce3dbddcd5ba5f609151f1e0fdd7981508ba169a14fe` |
| `princess-eye-states.png` | `4715667782d29e86216b6388dcbd5ad22ecdb304c0c09b74f149af32bcded093` |
| `princess-smooth-2048.png` | `42ddb722a5880b1d714bfc6739168737ae44d0d2846c0d1c3e7eb576d55b5cf1` |
| `magic-smooth-2048.png` | `ff2d850d986ae2ea1c723ea9d12b5697c92ff159019259f5ef35350b3b2b7801` |
| `all-eyes-review.png`（20眼×5色） | `5ca7ba11a5a9d3995ee7b60b0da705fe7090f224eef11bdd9e4f741c4802ce51` |
| `all-template-media-evidence.json`（30枚の生成記録） | `0f0929d7b43c97b000f67297fb92ce8cb3c8a412c444da588f5e90cfd294fb5b` |
| `current-build-identity.json` 記録ファイル | `3275ae6f4e745b39367fb036ed723909925eb3b47dbca73b48c45629784f302c` |

固定したbuild記録内のaggregateは `f818ac59c60b5cb75965f0d30bdac3afb9ed0249703895a2a1b520f37f8961d9`。この記録ファイルとその値を固定したもので、本担当がbuild全ファイルや性能を再検査したという意味ではない。`unit-vector-current.json` はrevision 5と同hashの旧記録で、最新387成功の証拠には使っていない。実装担当から最新結果は別の `unit-vector-final.json` と連絡を受けており、ブラウザの実行記録とともに別固定する。

### VV-03/VV-06の再判定

- **VV-06：PASS（nativeの5眼色/3画材）。** 男の子r15の上/外側の太い旧弧は消失。細い新版眼縁が一つだけ残り、画面左眼との自然さが揃った。髪際の眉、鼻、笑い口は保持。[右眼crop](../../test-results/vector-visual-audit/revision6/face-regressions/revision6-boy-right-eye.png)、[smooth顔全体](../../test-results/vector-visual-audit/revision6/crops/native-boy-smooth-face.png)。`all-eyes-review.png` のmagic/r15の黒/茶/青/桃/淡色でも弧は再発していない。
- **VV-03：PASS（home対比のnative目視）。** [本物のhome原本crop](../../test-results/vector-visual-audit/revision6/crops/home-princess-eyes.png) と [新版茶色crop](../../test-results/vector-visual-audit/revision6/crops/native-princess-brown-eyes.png)、[20眼sheetからの茶色眼crop](../../test-results/vector-visual-audit/revision6/eye-pages/manifest.json) を比較。黒い正円を貼ったような強い瞳縁が柔らかく虹彩へ接続し、虹彩の細い明暗が見える。小さい主反射とさらに小さい反射片になり、旧い大きい規則形の反射の目立ち方を解消。画面左向きの両視線、画面右の幅を持つ白目、虹彩に重なる上まぶた、姫だけの控えめまつげを保持している。指摘していた配列・瞳縁・虹彩・反射の不足が解消し、顔全体でも自然さを確認したため、現在のnative範囲ではhome基準への近さをPASSとする。人間の採用承認や最新ブラウザの倍率/DPR確認を兼ねるものではない。

### 解消済み箇所と新しい確認範囲

**VV-01/VV-02/VV-04/VV-05：解消状態を維持。** 姫と男の子の眼外の旧白片、恐竜右目下の旧黒ダッシュは再発していない。smoothの眉/鼻/口/髪の黒線は塗り面へ連続し、revision 4の白筋なし。犬の鼻/笑い口と亀の笑い口はsmooth/crayon/pencilの全3枚で保持。紙目は不規則に面内へ抜け、黒線に沿う連続白筋とは区別可能。新しい大きな隣色/背景漏れ、顔部品の消失、非姫の追加まつげを視認していない。

全10テーマの `*-smooth-640.png`、`*-crayon-640.png`、`*-pencil-640.png` **30枚をすべて原画像の解像度で直接開いた**。生成記録の各30画像hashと各templateContentHashは、独立固定のPNG/compiled hashと全件一致した。[直接目視した画像一覧と範囲](../../test-results/vector-visual-audit/revision6/native-review-coverage.json)。姫/男の子だけの3画材確認を全10へ転記したものではない。`*-three-media.png` 下段の拡大cropはアプリのzoom検証へ数えない。

全20眼×黒/茶/青/桃/淡色は [4分割の原pixel crop](../../test-results/vector-visual-audit/revision6/eye-pages/manifest.json) で100組を直接確認。選択色の色相を保つ虹彩、同系の暗い中央瞳、白い白目/反射を視認し、全色への強制茶/金や色付き下眼縁は見えない。恐竜の縦長の瞳と、犬/猫/兎/海の友達の顔に沿う位置を保つ。

全10の主要構図、角、蝶の穴/触角、指/手、アンテナ、車の窓/ライト/履帯などの実部品も30画像で保持。顔なしショベルの3窓、ドア/ハンドル、3通気口、作業アーム/バケット/ヒンジ、履帯/車輪、2コーンが維持されている。直線状のtile継ぎ目や低解像度の矩形輪郭をnative原画像内では検出していない。働く車の顔なし2原本とpromptは初回と同hash。

この範囲に追加のP1/P2や必須修正はない。再testとして残るのは、固定build `f818ac59…` の最新ブラウザ90条件、途中倍率/pan/縮小30条件、実DPR変更、配信homeの独立目視である。全眼色×全画材の組合せ、保存/同期/旧作保持、性能、実機、人間の新採用はここでは未確認。本担当は実装・Visual baseline・共有計画の状態を変更していない。

## revision 6：ブラウザ全123 PNGの独立目視と追加指摘

判定：**FAIL / NOT READY（VV-07 / P2）。** `2026-10-09 02:17:14 JST` に [revision6-browser/identity.json](../../test-results/vector-visual-audit/revision6-browser/identity.json) へ124ファイルを固定。manifest SHA256：`6ff3bc8ef1b8cf5121109941f75e80b1f9b5fa60be2772a4a2ee3705bed5e547`。内訳は **90倍率/DPR PNG＋途中倍率pan30 PNG＋home/group3 PNG＝123 PNG** と `viewport-matrix.json` 1件であり、124枚の画像という数え方はしない。

全123 PNGを1枚ずつ原pixel解像度で直接開いた。contact sheetだけを確認したものではない。[目視対象と個別判定](../../test-results/vector-visual-audit/revision6-browser/reviewed-images.json) に全123件、未確認0件を記録。117件は可視範囲の限定PASS。車の右ライト脇が写る倍率1/途中倍率panの各DPR計6件はVV-07を記録した。拡大frameの外や操作ボタンに覆われた部位を、見えていたとしてPASSへ数えていない。

### 可視範囲で維持を確認した事項

全10の描画面は、倍率1/2/4、DPR1/2/3で直線状のtile継ぎ目、矩形状の低解像度輪郭、大きな隣色/背景漏れを視認していない。姫/男の子の眉・鼻・口・髪にrevision 4の連続白縁は再発せず、犬の鼻/笑い口、亀の笑い口、猫/イルカ/魚の顔部品も保持した。窓・ライト・車輪・履帯・花の細い茎・蝶の穴/触角・指・ロケット/ヘルメット・アンテナなど、各frame内の原画部品が維持されている。

姫の両irisは画面左を向き、画面右側に幅のある白目がある。男の子の太い旧上眼縁や恐竜右目下の孤立黒ダッシュは、顔が写るframeで再発していない。非姫の追加まつげも視認していない。倍率4の中央frameでは姫/男の子の顔がframe外、恐竜は倍率2でも眼の大部分が上端外になるため、顔の倍率2/4×DPR3の追加pan6 PNGを実装担当へ依頼した。これらの補完前に眼の全拡大条件が完了したとは扱わない。

途中倍率PNGは1.7倍＋実pointer pan後の30枚を直接確認。提供したtest sourceはその後にfitへ戻すscale確認も行うが、縮小後の全10画像は今回の123 PNGにはない。動的DPRの提供結果は成功だが画像attachmentが空で、DPR3→2→1の変更後の3 PNGと寸法記録を追加依頼した。機械検査の成功から目視を転記しない。

[配信home](../../test-results/vector-visual-audit/revision6-browser/frozen/test-results/vector-improvement/browser/home-chromium-mobile.png) と [働く車crop](../../test-results/vector-visual-audit/revision6-vehicle-details/home-faceless-construction.png) は顔なしショベル/消防車。青い窓、アーム/バケット、履帯/車輪、消防車の梯子/窓/ライト/グリルをカードの可視解像度で保つ。口や眼を部品へ重ねた顔表現はない。カード156×120pxの整数拡大は追加情報や細部の解像度を増やすものではない。原本hash/promptの比較と配信homeの見た目を合わせて、V08の画像範囲はPASS。

### VV-07 / P2：車の右ライト脇に孤立した白い四角2個

**FAIL — V01/V02。** [vehiclesの途中倍率pan・DPR3実画面](../../test-results/vector-visual-audit/revision6-browser/frozen/test-results/vector-improvement/browser/vehicles-fractional-pan-dpr3.png) の `x801〜806,y341〜356` 付近で、フード右端線と右ライト外周線の間に白点2個が孤立している。[実画面crop](../../test-results/vector-visual-audit/revision6-vehicle-details/browser-right-lamp.png)。倍率1・DPR2/3でも視認でき、[native640 crop](../../test-results/vector-visual-audit/revision6-vehicle-details/native-right-lamp.png) の `x521〜524,y393〜399` にも同じ欠けがある。

原画照合：[生成原本](../../test-results/vector-visual-audit/revision6-vehicle-details/original-right-lamp.png)、[normalized原本](../../test-results/vector-visual-audit/revision6-vehicle-details/normalized-right-lamp.png)、[元inkを白背景へ合成したcrop](../../test-results/vector-visual-audit/revision6-vehicle-details/ink-right-lamp-white-backdrop.png) は細い連続隙間。2個の反射を描いたものではない。曲線が接近する原画の隙間が、現行では黒い橋を挟む四角い白点へ変化して見える。元のタイヤ上の白い反射やライト本体の穴と区別する。具体的な変換コードの原因は本監査では判定しない。

影響：小さい範囲で車の構図や操作を壊してはいないが、拡大時の線の自然さが損なわれる。native限定監査の「追加P1/P2なし」はブラウザ拡大の後に判明したこのP2を反映して訂正する。既存VV-01〜VV-06の解消を撤回する理由ではないが、全10の最終目視PASSを維持する理由にもならない。

必須の最小修正：このフード/ライトの制作部位に限定し、原画に対応する細い隙間と塗り面・黒線の境界を整合して孤立白点をなくす。実際の窓/ライトの穴、タイヤ上の原画反射を一括で埋めない。再test：新hashの同部位をnativeの3画材、倍率1/途中倍率pan×DPR1/2/3、右ライトへpanした倍率4×DPR3で独立確認する。無変更テーマへ不要な再testを広げる必要はなく、描画source/compiled差分とhashで影響を限定する。

| VV-07の主要対象 | SHA256 |
| --- | --- |
| `vehicles-fractional-pan-dpr3.png` | `6cbee72a1a7fbeaa14056c07fadb72d42cf7ef29ac96cbb1ed331ff657ab088c` |
| `vehicles-smooth-640.png` | `194f6e6c685f770b7a1cad7a484cd5d93c5fdd86f6050b7d4cc0d170db402d1d` |
| 生成原本 `vehicles-v2.png` | `535c8f0d875dc757fef66f512930896adbc18342c4e33782f93e18175bd4beaf` |
| `normalized-lineart.png` | `215c7c0888be5fef18dd57e789bf5d2c86a2aada69c0ab8602e84a837db7b1f2` |
| `source-ink.png` | `5cf1b9eacc6e4be1658dc135316323125413e5d7af586cb97710eecc285523e3` |
| 実画面crop | `5184bc1306eca9e08761df0f8aad4f49552476c29451431c246bdb27221a704a` |
| home実画面 | `2731c7d2ab50c927ff978f3f8dc89fec5af0d2f001a5f0d2b1a5d1bf5b9f7c68` |

原本3件を `2026-10-09 02:31:57 JST` に [revision6-vehicle-reference/identity.json](../../test-results/vector-visual-audit/revision6-vehicle-reference/identity.json) へ固定（manifest SHA256 `232311124438cd168f80ef0f5101a77951f079e6e2b391bdcb7e3cbe4f0fe709`）。[cropの原矩形/変換/hash](../../test-results/vector-visual-audit/revision6-vehicle-details/manifest.json) には、整数nearest拡大とinkの白背景合成のみを明記した。黒線/白点の修整はしていない。

### 提供された実行記録・build移行と未確認

[revision6-run-records-final/identity.json](../../test-results/vector-visual-audit/revision6-run-records-final/identity.json) にunit最終記録、Chrome14成功、動的DPR結果、f818build記録とdensity test sourceの5件を固定した（manifest SHA256 `322a77eedcd76c1c42e49cd1c00dc9087228747d3e5ef1e6691d2d0ed770c658`）。これらは実行記録を保存するもので、VV-07や未取得画像をPASSへ変えない。

配布buildはその後 `ebcb5e885bff48eb1c438a57c7907170a28de0309dbe0fd66bf081630a8c5e18` へ移行したと実装担当から連絡。[移行記録の別固定](../../test-results/vector-visual-audit/revision6-build-transition/identity.json)（manifest SHA256 `b944f3cfbd143514cf0d16dbe109d126cdde7656d10eb55ce8103a196d056eb2`）に、f818との差分は `sw.js` 1件、削除0件、描画JS/CSS/素材byte一致という提供inventoryを保存した。本担当がbuild全内容を独立再計算したとの主張ではない。新しい描画修正や追加画像は、さらに別hashで判定する。

現在未確認：VV-07修正後の画像、顔の倍率2/4追加6画面、実DPR3→2→1追加3画面、縮小後の全10実画像、全眼色×全画材の全組合せ、保存/同期/旧作保持、性能、実機、人間の新版採用。Visual baseline・製品コード・他担当の文書は変更していない。

## revision 6補完：実顔pan6画面と動的DPR3画面

`ebcb5e88…` で提供された顔6 PNGを `2026-10-09 02:39:38 JST` に [revision6-face-zoom/identity.json](../../test-results/vector-visual-audit/revision6-face-zoom/identity.json) へ固定（7ファイル、manifest SHA256 `135ab9fd6037021275c3d3105bc5f2b0dec9678cec3e537de5c6c46f6e1ab9da`）。全6枚は960×1200 PNGで、320×400 CSSの倍率2/4×DPR3、pan後の顔が両眼ともframe内にある。[個別目視記録](../../test-results/vector-visual-audit/revision6-face-zoom/reviewed-images.json)。

**PASS（この追加顔の画像範囲）。** 姫の [倍率4](../../test-results/vector-visual-audit/revision6-face-zoom/frozen/test-results/vector-improvement/face-zoom/princess-face-z4-dpr3.png) では両irisが画面左向き、画面右側に幅のある白目を保つ。柔らかい瞳縁、細い虹彩の明暗、小さい2反射、上まぶたと控えめなまつげが、実画面の拡大でも保持される。nativeのhome比較PASSの根拠となった構成が退行していない。男の子の [倍率4](../../test-results/vector-visual-audit/revision6-face-zoom/frozen/test-results/vector-improvement/face-zoom/magic-face-z4-dpr3.png) に太い旧上眼縁/二重線/追加まつげなし。恐竜の [倍率4](../../test-results/vector-visual-audit/revision6-face-zoom/frozen/test-results/vector-improvement/face-zoom/dinosaurs-face-z4-dpr3.png) に右目下の旧黒片なし。原画の鼻先の斜線、鼻孔、牙、笑い口は保持。3顔の眉/鼻/口/髪で白筋や新しい漏れを視認していない。VV-01/VV-02/VV-03/VV-04/VV-06の実顔拡大範囲の再testはPASS。

| 追加顔4倍実画像 | SHA256 |
| --- | --- |
| `princess-face-z4-dpr3.png` | `d0719bca8ca963388ad984bd12f8a423f1f6a3f72170863aeeb272a6e3284bac` |
| `magic-face-z4-dpr3.png` | `d394e87bc6db507b13f6de9912a4e09d0d5828d62b3cb20a328ba23a489d3380` |
| `dinosaurs-face-z4-dpr3.png` | `f75d647998d6eec990ffc41663203fae90b08eee7e21c2e1dde1e548f9d50aaa` |

動的DPR3 PNGは `2026-10-09 02:39:37 JST` に [revision6-dynamic-density/identity.json](../../test-results/vector-visual-audit/revision6-dynamic-density/identity.json) へ固定（4ファイル、manifest SHA256 `9648875102e4571efd5cad838c71b753cc381422b748760113e9cdb739f36637`）。3枚とも320×400 PNGで、すべてSHA256 `dd0a1f967eb1f0696364c655d0e61be1a4c52d53082a3646971feae8e38fe880` と完全一致。[個別目視記録](../../test-results/vector-visual-audit/revision6-dynamic-density/reviewed-images.json)。CSS構図/線/着色が変化しない画像範囲はPASS。

ただし、`measurements.json` のcanvas960×1200→640×800→320×400に対し、PNGはDPR2/3の全physical pixelを含んでいない。提供test sourceではDPR/canvas寸法を記録してから `stage.screenshot` を呼び、撮影後のDPR/canvas寸法は記録していない。撮影時にもDPR3/2を保持したかは本画像だけでは判断できないため、動的DPRの原pixel目視完了へ転記しない。実装担当へ一致hashと寸法を報告し、DPR維持captureと撮影後の寸法記録を依頼した。これは描画のFAILを新たに断定するものではなく、証拠の限定範囲である。

Chromeの追加6成功は [revision6-face-density-run/identity.json](../../test-results/vector-visual-audit/revision6-face-density-run/identity.json) に別固定（manifest SHA256 `7e3f638258115ea41b887dc47ac4583888c679113a6b6dcbdf6fe5ca440756e7`）。機械成功をVV-07の解消には使わない。現在の追加必須再testは、車の修正版、動的DPR維持の追加証拠、全10のfitへ戻した後の画像。以前の未確認リストの「顔追加6画面」は本節で解消した。

## revision 7候補：車の隙間修正と原pixel動的DPRの再監査

判定：**VV-07はFAIL継続 / P2。動的DPRの追加画像範囲はPASS。全150実画面の最終判定は保留。** build記録は `55f1ea6ded2b9ef3c136bcc4bd9fcebcc70ffd605124d65f7f812720f17ebd74`。そのsourceAggregateは `0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276` と提供され、ebcbのruntime sourceと同一という実装担当の説明がある。本担当はcompiled画像のbyte比較を行い、runtime/性能の再監査はしていない。

| 独立固定 | ファイル数 / 取得時刻JST | manifest SHA256 |
| --- | --- | --- |
| [revision7-native](../../test-results/vector-visual-audit/revision7-native/identity.json) | 5 / 02:54:43 | `1106506f271907c94946791e266397eb969e8509991dde60c44fed050f34d896` |
| [revision7-geometry](../../test-results/vector-visual-audit/revision7-geometry/identity.json) | 17 / 02:55:27 | `93299feea07b2f8cb969e50f5a4f0a8c756c7b9e71499291d4223dfc0cefae09` |
| [revision7-face-zoom](../../test-results/vector-visual-audit/revision7-face-zoom/identity.json) | 9 / 02:57:01 | `6e2cc5594ccd903f62737fe142cdafebcd73d641ad81f2e7278297a31017ee95` |
| [revision7-dynamic-density](../../test-results/vector-visual-audit/revision7-dynamic-density/identity.json) | 4 / 02:57:02 | `d2f4979a257670cd8d7b7813b401c79f726c3d060850384c2a707a03d5c6a45a` |

車のsmooth/crayon/pencil 640×800の3画像を原pixelで直接開き、各ライトcropも比較した。新しい窓/ライト/グリル/車輪/タイヤ反射/ドア/ミラー/バンパーの消失や大きな漏れは視認していない。紙目と区別できる同位置の小さい白い切れ目が、3画材とも接点に残る。[3画材の個別記録](../../test-results/vector-visual-audit/revision7-native/reviewed-images.json)、[crop条件/hash](../../test-results/vector-visual-audit/revision7-vehicle-details/manifest.json)。

### VV-07の実倍率2/4での再現

[右ライト4倍・DPR3](../../test-results/vector-visual-audit/revision7-face-zoom/frozen/test-results/vector-improvement/face-zoom/vehicles-lamp-z4-dpr3.png)（960×1200）の約 `x393〜402,y415〜442` に、黒線を挟む白い四角2個が残る。[右ライト2倍・DPR3](../../test-results/vector-visual-audit/revision7-face-zoom/frozen/test-results/vector-improvement/face-zoom/vehicles-lamp-z2-dpr3.png) でも約 `x604〜609,y448〜462` に同じ形を視認した。いずれも本担当が原pixelで直接開いた。

原本と `general.png` のcropには2本の黒線の間を通る細い連続隙間がある。現在のnative/実画面はまだ孤立した白片になり、VV-07の見た目の解消条件を満たさない。ここは車の外周より内側のボディ面であり、原画の未着色白をそのまま外部背景と扱うことはできない。原画に沿う線/連続隙間を保ち、着色したボディ面の色へ繋げる必要がある。実際の外部背景、窓/ライトの穴、タイヤ上の反射を一括で埋める修正を求めているものではない。

必須修正と影響：VV-07の部位限定修正を継続。拡大時の不自然な白点が残るP2であり、原画の穴の機械検査7/7成功では解消しない。再testは新hashのこの接点、3画材、ライトpan倍率2/4×DPR3と倍率1/途中倍率pan×DPR1/2/3。150画像の完成やunit/browser成功をこのFAILの解消に転記しない。

| revision 7主要画像/compiled | SHA256 |
| --- | --- |
| 車compiled | `d6ba4de39e66f6cbf302299d64b3d14c921a01e07aa71f94ba1011048c846435` |
| `vehicles-smooth-640.png` | `f03a90af947497722ef284d90d8b115f130dcefd1ce0c794988711b18f5b7b2e` |
| `vehicles-crayon-640.png` | `cf190665b22016eb69758b36e587232439e4ca721c1974b49e28a4a21a37d5c5` |
| `vehicles-pencil-640.png` | `9013500f672b72764db16b841084282f9dd477061f0f81e3914e2961a7dd7e01` |
| `vehicles-lamp-z2-dpr3.png` | `a73997f3f186aab43e01aab33b22391e2f4b218440f0e9740d9f78e5b7c55ecc` |
| `vehicles-lamp-z4-dpr3.png` | `14b4537cda07bf146ccea8365a2a1fed49a0fff4b71066aefdb48b78ad64465b` |

[compiled10件の独立比較](../../test-results/vector-visual-audit/revision7-vehicle-details/compiled-comparison.json) では車のみ変更し、他9件はrevision 6とbyte一致。今回の姫/男の子/恐竜の6顔PNGも、直接確認済みrevision6-face-zoomの6 PNGと全件byte一致を確認し、その同一画像の限定PASSを保持した。[8 PNGの判定と継承根拠](../../test-results/vector-visual-audit/revision7-face-zoom/reviewed-images.json)。同じ6画像を今回新たに直接開いたとは記録しない。

### 動的DPRの証拠不足は解消

新しい [DPR3](../../test-results/vector-visual-audit/revision7-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/dpr-3.png)、[DPR2](../../test-results/vector-visual-audit/revision7-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/dpr-2.png)、[DPR1](../../test-results/vector-visual-audit/revision7-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/dpr-1.png) を全3枚、原pixelで直接開いた。実PNGはそれぞれ960×1200、640×800、320×400。CSS320×400を保持し、構図/髪の着色/顔/兎の形を維持する。新しい白筋/漏れ/継ぎ目や縮小後の粗い残像を視認していない。髪の破線と円は選択表示であり、描画線の欠けと区別した。

[測定記録](../../test-results/vector-visual-audit/revision7-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/measurements.json) は各撮影前後ともDPR3/2/1とcanvas960/640/320を同じ値に保持し、PNG寸法も一致する。今回の3 PNGは異なるDPR2/3のphysical pixelを含むため、revision6補完の3同一PNGにあった証拠の不足を解消した。姫のこの動的DPR実画像範囲をPASSとする。全10の動的DPRや保存の独立成功を意味しない。

DPR3 PNG SHA256：`c4487b86b3a05bf69c500605c8ad618361560ac2c67f0955abc88781d8570fd9`。DPR2：`863eb97257f89897ef8b874d78b3babc8652691724e7d910f1f718c0c59c11fb`。DPR1：`dd0a1f967eb1f0696364c655d0e61be1a4c52d53082a3646971feae8e38fe880`。[画像別目視記録](../../test-results/vector-visual-audit/revision7-dynamic-density/reviewed-images.json)。

150 PNG（90倍率/DPR＋30途中倍率pan＋30 return-fit）の生成は連絡時点で進行中。完了前に一式を固定/目視済みとは扱わず、最終判定を保留している。車の修正候補はその完成を待つ前にVV-07のFAILを速報した。旧原本/固定画像/FAILを保持し、製品コード・baseline・他担当の文書は変更していない。

実装担当の後続説明：旧compiler由来の固定白detail 2件（原座標bounds `[1305,983,1307,987]` / `[1304,990,1306,994]`）が、r10の塗り面の後に重なっている原因を特定したと連絡があった。[paint-probeの独立固定](../../test-results/vector-visual-audit/revision7-paint-probe/identity.json)（manifest SHA256 `880cb273ee81cebbb86ad7dd6f44df26f23b424f127bf6ecfd571dbfa96a8062`）には、2点がink/opaque外でr10 coverage内にもかかわらずRGBA白になる記録がある。これは原因調査の提供記録であり、本担当がrender順序のコードを監査したものではない。新しい候補は曲線をさらに変形せず、この2白detailだけを除外して本来のタイヤ反射3件を保持する方針。修正完了の合格は、次の新hash画像の独立目視で判定する。

## revision 8：固定白detail除去後の車native再監査

判定：**VV-07はPASS（車nativeの3画材の修正範囲）。新build実画面の最終判定は保留 / NOT READY。** `2026-10-09 03:06:52 JST` に5ファイルを [revision8-native/identity.json](../../test-results/vector-visual-audit/revision8-native/identity.json) へ固定（manifest SHA256 `05f492262f5973a2a6b16d5b21cd4814d142b448ffc8205dc5a7bc8e6b409f47`）。`03:06:53 JST` にbuild記録・生成script2件・compiled10件を [revision8-geometry/identity.json](../../test-results/vector-visual-audit/revision8-geometry/identity.json) へ固定（13ファイル、manifest SHA256 `7250032c5123831b2c8a252afac186939fd79ebe4739c9e864b040e6bd96d299`）。

記録build：`f3c10731370481c0235c267e41aed0b1ff4b3591ec8338544289c6d8eb3ffb29`。runtime/source aggregate記録は `0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276` で前候補と同値。車compiled SHA256：`42c8381e9e693a0d0a45f41e1d9e2f10c08fb3c81463fd5d24a590778e57325a`。[10compiledの独立byte比較](../../test-results/vector-visual-audit/revision8-vehicle-details/compiled-comparison.json) でも車だけ変更・他9件一致を確認した。

車のsmooth/crayon/pencil 640×800 **3枚を原pixelで直接開き、同じ矩形の6倍nearest cropも直接比較**した。[smooth接点](../../test-results/vector-visual-audit/revision8-vehicle-details/native-smooth-right-lamp.png)、[crayon接点](../../test-results/vector-visual-audit/revision8-vehicle-details/native-crayon-right-lamp.png)、[pencil接点](../../test-results/vector-visual-audit/revision8-vehicle-details/native-pencil-right-lamp.png)。旧い2白点は3画材とも消失し、接点の細い隙間はボディ色へ連続する。原画に沿うフードとライトの2黒線、ライト本体の輪郭と塗り分けを保つ。紙目の不規則な面内の白抜けと、同座標に残っていた固定白点を区別した。

full画像では窓/ミラー/ドア/バンパー/グリル/車輪とタイヤの元の白反射も保持。新しい大きな漏れ、連続した白筋、直線状の継ぎ目を視認していない。この修正範囲に新しいP1/P2と必須修正はない。[直接確認した3full PNGの記録](../../test-results/vector-visual-audit/revision8-native/reviewed-images.json) と [cropの条件/hash](../../test-results/vector-visual-audit/revision8-vehicle-details/manifest.json) を保存。3画材composite sheet自体はこの時点で新たに直接開いておらず、確認済み3full画像を代用して拡大アプリ条件へ数えない。

| revision 8の車native | SHA256 |
| --- | --- |
| `vehicles-smooth-640.png` | `88caf1dd01761d134e3aa311a47c8853540b64a0c64aaf97ce5117105d316af3` |
| `vehicles-crayon-640.png` | `3a72e612a59f91a2fe272daf42d15cc3106906e51e7b49d7e81fa13aab33c4a4` |
| `vehicles-pencil-640.png` | `a049dc1a264b9e4f8800bb35d4883afde30714b2cf89b3b408d527ab6b57aa2b` |

次の必須再testはこのbuildの全150実画像、右ライトへpanした倍率2/4の実画像、顔6画像、動的DPR3画像を別固定し、新しい退行と縮小後の画質を判定すること。旧revision 7のFAILを残し、native修正のPASSだけでVisual baseline更新へ進めない。保存・性能・同期・実機・人間採用の未確認範囲も維持する。

## revision 8最終：実倍率・pan・fit復帰・動的DPRの独立判定

判定：**PASS（以下の固定画像の可視範囲）。VV-01〜VV-07について残る必須の目視修正なし。** 対象buildの提供記録は `f3c10731370481c0235c267e41aed0b1ff4b3591ec8338544289c6d8eb3ffb29`、source aggregateは `0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276`。本担当は画像/compiledの同一性を独立確認したが、runtime全体の再監査やbuild inventoryの独立再計算はしていない。これまでのFAIL画像、原本、指摘と修正経緯はすべて保持する。

| 最終資料の独立固定 | ファイル数 / 取得時刻JST | manifest SHA256 |
| --- | --- | --- |
| [revision8-browser](../../test-results/vector-visual-audit/revision8-browser/identity.json) | 160（159 PNG＋測定JSON）/ 03:12:43 | `e28a428321ddfd796fcb4ca3e775e3f23de46769dceac1b4ae3afe3a04d8b842` |
| [revision8-face-zoom](../../test-results/vector-visual-audit/revision8-face-zoom/identity.json) | 9（8 PNG＋測定JSON）/ 03:12:45 | `b4ee8dd308e5fac00d633baaf9b00b9e8ea24a70968e51e993591b89a89ebbe5` |
| [revision8-dynamic-density](../../test-results/vector-visual-audit/revision8-dynamic-density/identity.json) | 4（3 PNG＋測定JSON）/ 03:12:47 | `f32eda160bdfbab81b211b518ec81ae023436b0d73cb7527abcf88dd89c7a043` |
| [revision8-run-records](../../test-results/vector-visual-audit/revision8-run-records/identity.json) | 3 / 03:12:48 | `ec72558fdbc9863f6e9f88a075d9f2629d0fa734171b5cddd82165f2d99d6e12` |
| [revision8-native-all](../../test-results/vector-visual-audit/revision8-native-all/identity.json) | 71（60 PNG＋11 JSON）/ 03:13:30 | `216afa826c48b873fc70eda554776271182575a0b754337ad24c65467261b908` |

### 実画像159枚の確認方法と可視範囲

[個別画像の判定](../../test-results/vector-visual-audit/revision8-browser/reviewed-images.json) に159枚を記録した。全10×倍率1/2/4×DPR1/2/3の90枚、全10×途中倍率1.7/pan×DPR1/2/3の30枚、全10×fitへ戻した後×DPR1/2/3の30枚を含む。追加9枚はChrome home/group3枚とFirefox/WebKit desktop home/group6枚。別エンジンの6追加画像は画像としての目視判定であり、その取得実行のbuild同一性を本担当が独立証明したとは扱わない。

revision6の直接目視済み画像との [byte比較](../../test-results/vector-visual-audit/revision8-browser/byte-comparison.json) により、104枚は完全一致する以前の可視範囲PASSを継承。SHA256とbyte数を照合し、過去のFAIL画像は継承していない。変更19枚と追加36枚の計55枚は今回、各原寸PNGを直接開いて目視した。新しい画像をcontact sheetだけで合格にせず、同一画像104枚を今回もう一度開いたとも記録しない。

変更19枚は車の倍率9枚/pan3枚と、animalsの2倍DPR2/3・4倍DPR2、dinosaursの2倍DPR2、magicの2倍DPR2、oceanの2倍DPR2/3。追加36枚はreturn-fit30枚と別エンジン6枚。**return-fit30枚は全件を今回直接確認**した。線の粗い残像、欠けた形の残留、白筋、隣の領域や背景への大きな漏れ、直線状のtile継ぎ目を視認していない。fitへ戻った各テーマの構図と、姫/男の子/恐竜・動物・海生物の顔部品、働く車/普通車/ロボットの部品、花/宇宙の細い輪郭を保持する。canvas外やzoom操作UIが覆う箇所はそのPNGで見えたとは主張しない。同じ色で塗った隣接面だけでは微小な色境界の漏れを判別できないため、異なる色を含むnative原寸の30画材画像も補完根拠とした。

homeの働く車カードは、ショベルの窓/アーム/バケット/履帯と消防車の窓/ライト/はしご/車輪を保ち、顔を視認しない。Chrome homeは以前の直接確認済みPNGとbyte一致。Firefox/WebKitのhomeは今回直接確認し、同じ顔なしの素材を視認した。WebKit homeには更新案内のoverlayがあり、下部の花/玩具カードの隠れた箇所はこの画像の確認範囲から除外する。homeカードの小さな表示を車の詳細な原画部品検査へ代用しない。

### VV-07：車の実倍率2/4・pan・fit復帰もPASS

車の倍率1/2/4×DPR1/2/3の9枚、途中倍率pan3枚、return-fit3枚、ライト中心の倍率2/4×DPR3の2枚を直接開いた。native3画材に加え、**実画面17枚の可視範囲でもPASS**。旧revision7の `x393〜402,y415〜442`（4倍DPR3）と `x604〜609,y448〜462`（2倍DPR3）の固定白い四角2個が消失。接点がボディ色に繋がり、フードとライトに沿う2本の黒線、ライト本体の境界と青の塗り分けを保つ。

最新 [ライト4倍](../../test-results/vector-visual-audit/revision8-face-zoom/frozen/test-results/vector-improvement/face-zoom/vehicles-lamp-z4-dpr3.png) / [ライト2倍](../../test-results/vector-visual-audit/revision8-face-zoom/frozen/test-results/vector-improvement/face-zoom/vehicles-lamp-z2-dpr3.png) では、細い接点を埋めた結果の新しい黒塊や輪郭の欠落も視認しない。窓/ドア/ミラー/グリル/バンパー/車輪とタイヤの本来の白反射を保持。[車のreturn-fit DPR3](../../test-results/vector-visual-audit/revision8-browser/frozen/test-results/vector-improvement/browser/vehicles-return-fit-dpr3.png) でも白点の復活なし。原本に元からある外部背景や反射の白を一括で消したとの主張ではない。

| 最終の車実画面 | SHA256 |
| --- | --- |
| `vehicles-lamp-z2-dpr3.png` | `00fe1ec7cfeaa723722696d1456338cee374e39b663b042808f0cd1fd199d9d3` |
| `vehicles-lamp-z4-dpr3.png` | `efc1c3a014cab3ef4e958851049dc716a4505755501b79d885b47bf864141cba` |
| `vehicles-fractional-pan-dpr3.png` | `77948ca3b16fd0b259d17487666f13bfc5a2c640d29ea7a602448c4632fc316b` |
| `vehicles-return-fit-dpr3.png` | `5744a28f7a19d3f200b9e3f6215148626c61e16a3f17c59d7cd59b12b1530779` |

影響と必須修正：拡大時に不自然だったVV-07 / P2はこの候補で解消。今回の可視範囲に新しいP0/P1/P2は検出していない。部位限定の必要な修正と再testは完了し、機械成功の件数で以前のFAILを消していない。

### 全20眼・native3画材と既存解消の維持

新 [顔/ライト8枚の記録](../../test-results/vector-visual-audit/revision8-face-zoom/reviewed-images.json) で、ライト2枚は今回直接目視。姫/男の子/恐竜の顔pan2/4倍×DPR3の6枚はrevision6で直接目視した画像と全件byte一致を独立確認し、その限定PASSを継承した。姫の両目はhome原画と同じ画面左向き、画面右側の白目を広く保つ。選択色の虹彩、同系の暗い瞳、柔らかい瞳縁、細い不規則な虹彩の明暗、小さい反射、上まぶたと控えめなまつげが実拡大でも維持され、home原画へのほぼ同品質というV05の目視条件はPASSを保持する。home原画とのpixel同一性や人間の採用を意味しない。男の子/恐竜に追加まつげや太い旧眼縁の二重化なし。

全20眼×黒/茶/青/桃/淡色の100眼を含む `all-eyes-review.png` はrevision6の4つのpixel-exactページで直接確認したsheetとbyte一致（SHA256 `5ca7ba11a5a9d3995ee7b60b0da705fe7090f224eef11bdd9e4f741c4802ce51`）。VV-01/VV-02の旧眼由来の白欠け/黒片、VV-04の眉/鼻/口/髪の白筋、VV-05の犬の鼻/口と亀の口、VV-06の男の子右眼の旧上眼縁の解消は、同一compiled/原寸画像/顔拡大画像で維持を確認した。全20眼はsmoothの5色を確認しており、全5色×全3画材の300眼は未確認。

[現在のnative30枚と100眼の根拠](../../test-results/vector-visual-audit/revision8-native-all/native-review-coverage.json) は、他9テーマ×3画材の27原寸640×800 PNGがrevision6の直接確認済み画像とbyte一致し、compiled9件も同一であることを記録。車の3原寸は別固定の `revision8-native` の新しい直接確認済み画像を採用し、各media JSONのtemplateContentHashとcompiled hashを照合した。これで現候補の全10×3画材を覆う。

注意する履歴資料：今回固定した共通 `native/` には旧車の `vehicles-smooth/crayon/pencil-640.png` と `vehicles-three-media.png` がrevision6のまま残り、共通media JSONの車3件も旧template hash `e62abf4980622fcf2f4092aa56e75d18c396b2541d98d681ed57f75cd9ecca4b` を指す。この4 PNGと3 JSON entryは今回の最新版合格根拠から除外した。修正後の車3画材は `vehicle-fixed-details/native/`、compiledは `42c8381e9e693a0d0a45f41e1d9e2f10c08fb3c81463fd5d24a590778e57325a`。古いフォルダ名や資料の生成時刻だけで新候補に読み替えていない。

共通nativeで変わった [車tile PNG](../../test-results/vector-visual-audit/revision8-native-all/frozen/test-results/vector-improvement/native/vehicles-native-tiles.png)（SHA256 `61d0b362cc3827388f074d6b4a89be642a8b53d722a107eaa6a504f4392f08b9`）は今回原pixelで直接開いてPASS。新車の3画材sheetも後続で直接開き、先のnative節で未確認だったsheet自体の確認を完了した。sheet下段の拡大cropをアプリのzoom条件へ数えていない。全10の実倍率/DPR画像と合わせ、可視のtile継ぎ目・輪郭の粗さ・白筋・漏れに新しい指摘なし。

### 最新buildの動的DPR3→2→1

最新版の [DPR3](../../test-results/vector-visual-audit/revision8-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/dpr-3.png)、[DPR2](../../test-results/vector-visual-audit/revision8-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/dpr-2.png)、[DPR1](../../test-results/vector-visual-audit/revision8-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/dpr-1.png) を今回全3枚原pixelで直接開いた。[画像別記録](../../test-results/vector-visual-audit/revision8-dynamic-density/reviewed-images.json)。姫の構図・髪の着色・顔と兎の形を維持し、新しい白筋/漏れ/継ぎ目や粗い残像を視認していない。髪のcyan破線/円は選択表示として区別した。

[測定JSON](../../test-results/vector-visual-audit/revision8-dynamic-density/frozen/test-results/vector-improvement/dynamic-density/measurements.json) は各撮影前後とも同じDPRとcanvas寸法を保持。PNG headerのphysical寸法も960×1200、640×800、320×400で、CSS320×400に対応する。revision6の3同一320×400 PNGにあった証拠不足は解消した。現在のDPR3 PNGは `357253e33430932290722edc3361e5ad5a6962a00930f3fe2107f7036d845876`、DPR2は `863eb97257f89897ef8b874d78b3babc8652691724e7d910f1f718c0c59c11fb`、DPR1は `dd0a1f967eb1f0696364c655d0e61be1a4c52d53082a3646971feae8e38fe880`。姫のこの動的DPR3画像範囲をPASSとする。全10テーマの動的DPR変化を直接検証したとの主張ではない。

### 再現・再test・未確認

再現/再testの条件は新 `*-storybook-v2`、CSS320×400、全10の倍率1/2/4×DPR1/2/3、途中倍率1.7のpan、fit復帰、姫/男の子/恐竜の顔pan2/4倍×DPR3、車ライトpan2/4倍×DPR3、姫のDPR3→2→1。固定PNG名と測定JSON、各画像のSHA256を保存し、再取得した画像に変更があればそのbyteを別revisionとして再判定する。旧画像と同じhashの画像にだけ限定して、直接目視済みの判断を継承する。

提供されたChrome15件の結果はexpected15/skipped0/unexpected0/flaky0、unitは390/390成功。[結果3件の固定](../../test-results/vector-visual-audit/revision8-run-records/identity.json) にunit JSON SHA256 `6b8d612d82aa82d3abe8602ab9fc56a7f8160428ed2fb75f821c75cb8c86b60f` とbrowser JSON SHA256 `274a173776d596a48b182e93d9913e45daaedccc4d3d8d3d8675c84978bc70db` を保存した。本担当は全体テストを再実行せず、これらの件数を目視PASSの理由にしない。

監査した可視範囲で残る必須修正/必須再testはない。未確認は、全眼色×全画材の全組合せ、全10テーマの動的DPR、各zoom PNGのframe外/UI下の箇所、実Android/iOS端末、保存/同期/旧作品保持、性能、全体READYと人間の新版採用。Visual baselineの更新可否について本監査の画像ゲートはPASSに達したが、baseline/製品ファイル/他担当の文書は本担当が変更していない。
