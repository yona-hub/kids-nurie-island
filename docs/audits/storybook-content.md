# 絵本調新版・独立制作監査

監査者: 独立制作監査エージェント。2026-10-08 JST。対象は `docs/storybook-improvement.md` の新版候補で、旧監査のPASSおよび旧人間採用は流用しない。

この報告の固定候補は `test-results/storybook-content-audit/evidence.json`（2026-10-07T16:04:43.862Z）の全10 `contentHash`。以後の再buildは別候補として再確認が必要。独立監査は製品コード・原画・既存監査を変更していない。

**判定: FAIL / 新版の人間採用はpending。** 17目に古い反射光の黒い輪が残る。細領域と画面操作の新版証拠が不足。生成物を技術候補として扱うことと、完成した受入検査のPASSは区別する。

## SB-C01 [P1] 17目で旧反射光の黒い輪が残る

`scripts/build-storybook-content.mjs` の `outer()` は最初の `M ... Z` を抜き出し、同じ輪郭を新版瞳maskと原画ink差分に用いる。独立検査は実際の `storybook-texture.ts` をTypeScriptからtranspileし、新版mask・automatic領域除外・最後のink描画を行った。全22目を黒 `#000000`、青 `#2598FF`、淡色 `#FFF4BF` の3色で確認した。

画像: [1/3](../../test-results/storybook-content-audit/eyes-review-1.png)、[2/3](../../test-results/storybook-content-audit/eyes-review-2.png)、[3/3](../../test-results/storybook-content-audit/eyes-review-3.png)。青/淡色では旧白いハイライトの周りに太い黒い輪が見え、そのほかに新版の白反射光が描かれる。黒では新反射光と異なる場所に旧白領域が残る。以下は実寸1600×2000の旧ハイライト中心座標。新版eye maskの `isPointInPath` も全件falseとなる。

| template（末尾 `-storybook-v1`） | 瞳ID → 旧ハイライトID | 中心 (x, y) |
| --- | --- | --- |
| gen-dinosaur-eggs-v4 | r02 → r03 | 539, 401.5 |
| gen-excavator-cones-v2 | r25 → r28 | 936.5, 918.5 |
| gen-explorer-robot-v2 | r10 → r13 | 947, 605 |
| gen-ocean-friends-v2 | r04 → r05 | 980.5, 459 |
| gen-ocean-friends-v2 | r10 → r11 | 726, 918 |
| gen-ocean-friends-v2 | r12 → r13 | 845, 945.5 |
| gen-ocean-friends-v2 | r28 → r29 | 543.5, 1180 |
| gen-princess-bunny-v6 | r12 → r14 | 787, 582 |
| gen-princess-bunny-v6 | r42 → r43 | 1052, 1320 |
| gen-princess-bunny-v6 | r44 → r45 | 1168.5, 1362 |
| gen-rocket-astronaut-v5 | r18 → r19 | 1121, 933 |
| gen-tree-friends-v4 | r13 → r14 | 690.5, 1018 |
| gen-tree-friends-v4 | r16 → r17 | 536.5, 1071.5 |
| gen-tree-friends-v4 | r22 → r23 | 920.5, 1167.5 |
| gen-tree-friends-v4 | r25 → r26 | 1059, 1215.5 |
| gen-wizard-lantern-v6 | r10 → r11 | 715, 602.5 |
| gen-wizard-lantern-v6 | r15 → r12 | 860, 638 |

原因は複合pathのサブパス削除だけでは解消しない。例えば掘削車r24には外輪郭とholeの2サブパスがあるためfirst contour抽出で旧highlight中心を含む。一方、r25は単一サブパス自体がハイライトを外側に接続した凹輪郭であり、同じ抽出で中心を包含しない。姫r10だけを比較する現行 `tests/storybook-engine.test.ts` の反射光テストでは、この相違を検出できない。

修正案: 旧eye maskとhighlight maskから、旧内部の輪・連結切れを埋めた連続した瞳包絡線を再構築する。同じ完成包絡線をeye fillとsource ink差分に用いる。highlight maskのstroke拡大によるUnionは候補だが、外眼輪に近い部分で外輪・睫毛まで削らないよう個別に確認する。22目×3色の画像と中心だけでなく輪付近のink差分を照合し、消去後の白い未着色状態も確認する。

旧輪が見えない5目（恐竜r04、掘削車r24、ロボットr08、姫r10、宇宙飛行士r17）も、再build後のhashへこの確認を転記しない。

## SB-C02 [P2] 細い領域の新版操作証拠が不足

全408領域は閉じたpathでboundsは有限。単純なbounds短辺だけでは使用可能幅・可視面積を証明できない。旧個別例外のうち、automatic highlightを除く21件は新版でpathが変更されているため旧 `hitAtZoom4/painted/erased` を流用できない。

| theme | 現行で再操作が必要な旧例外ID |
| --- | --- |
| construction | r15, r30, r31, r33, r34 |
| robots | r02 |
| ocean | r31, r33, r36 |
| princess | r04, r05, r09, r46 |
| space | r15 |
| animals | r28 |
| magic | r14, r22, r33, r43, r49, r50 |

新版の非automatic領域でbounds短辺24未満は、ocean r31（22.418×87.094）、r33（35.218×23.163）、princess r04（22.5×36.5）、r05（22.5×35.5）、animals r28（28.5×20.157）、magic r33（34.5×22.5）、r43（19.377×45.115）。実寸boundsとpath hashは `evidence.json` に記録した。

修正案: 新版の可視maskで使用可能径を再測定し、全ての新しい24未満を列挙する。この21件と新しい細領域に対して4×で `getRegionPoint → hitTest(false) → 部分paint → erase` を実行し、保存/再読込後の保持も確認する。automatic highlightは独立操作の受入から除外し、瞳へリダイレクトする受入を確認する。幼児の実機での容易さは今回未検証。

## SB-C03 [P2] builderの入力由来確認が不足（実装担当へ修正提案済み）

検査時点の `build-storybook-content.mjs` は、旧公開template・retained source・原画・画材原画を読む前後に採用hash/manifest hashを照合せず、`adoption.originalSha256` をQAの `sourceOriginalSha256` へそのまま転記する。`groupsByTheme` はthemeをキーにし、コメントの「exact adopted source IDs」に対応するID/hash guardはない。現在の入力は一致しているが、後の再生成で入力が変わった場合も以前の由来を返せる。

修正案: 全10の旧公開 `templateHash`、原画SHA256、retained sourceのid/path/detailsを採用された公開形状へ照合し、3画材原画をmanifest.sha256へ照合する。出力を書き始める前に全入力を検査し、source IDも明示対応へbindする。新hashへの人間承認は作らない。

`adoption.geometrySha256` の正規化アルゴリズムはこの監査では特定できなかった。推測したJSONのhashが一致しないことを原画変更とは扱わない。下記の旧contentHash完全一致とsource形状完全一致は確認できた。

## 確認できた事実

- 全10の旧公開template `templateHash` は `user-adoption.json` の `contentHash` と一致。全10の原画SHA256も記録と一致。全region id/pathとdetailsはretained `compiled/<旧ID>/template.json` と旧公開templateで完全一致。新IDへの出力は旧IDのJSON/原画を上書きしていない。
- 新生成manifestの39原画は全てSHA256一致（3画材、26モチーフ、10背景パーツ）。プロンプト・原画パスが記録されている。ツール実行の provenance そのものはmanifestの記録と親作業の証拠による。
- 全10に148の明示グループ。automatic highlight22件を除いた386領域を重複なしで完全に被覆。全148の名称と所属領域名を列挙し、[色分け図](../../test-results/storybook-content-audit/groups-review.png)を目視した。姫・魔法使いの全髪/露出肌は各1グループ、口・服は別。犬/猫、姫/うさぎ、イルカ/カメ/魚の毛・体・目は別グループ。宇宙飛行士の髪と露出肌は各単一領域。服・装飾の所属に明らかな解剖上の誤りは見つからない。この事実は実際のまとめ塗り操作・保存成功を証明しない。
- 新版regionのpathには曲線コマンドが存在する。全10のnative tile画像と候補線画一覧を目視し、2人/複数キャラクターのつながり・全体輪郭に明らかな背景漏れは見つからない。意味グループの色分けでも人物や口・服への誤所属は見つからない。
- 親作業の `three-media-review.png` と姫pencil/魔法使いcrayonの2048 PNGで、紙の露出するクレヨンと斜めの色鉛筆筆跡を区別できる。これは監査時点の旧texture候補であり、進行中の蝋顔料・作者陰影の修正へPASSを転記しない。

## 未確認と受入範囲

全10×1/2/4倍×DPR1/2/3の線/塗り/継ぎ目の目視は未完了。nativeの一覧画像は640×800の最終状態であり、各zoom/DPRの画面証拠ではない。全体unit/ブラウザ/CPU4-DPR2性能は実装担当が実行する。旧作品のコピー・上限・保存失敗・再読込、全色の瞳消去、ブラウザのhit/paint/erase、3画材の実ブラウザ原寸確認、人間の新画像採用は未確認。

監査時点のQA `pass:true` は「visual and interaction verification pending」と併記され、`approved:true` は無条件で設定されていた。親実装担当が実証に基づくpending/合否へ修正する予定であり、この監査ではPASSとみなさない。外部公開可能性の判定は行っていない。

## 再現

`node test-results/storybook-content-audit/inspect.mjs`。この小さな独立スクリプトは製品入力をread-onlyで読み、監査ディレクトリに画像とhash付きevidenceだけを出力する。製品エンジンの完全なブラウザ実行ではないため、描画構成に関する実証とUI/操作の実証を区別する。

## 修正後の独立再確認（2026-10-08 JST）

前節の初回FAILと初回画像・evidenceは保持した。以下は `test-results/storybook-content-audit/revision-2/evidence.json`（2026-10-07T16:13:52.755Z）にbindされた修正候補の検査結果である。全10のcontentHashは現在 `content/qa/<ID>.json` と一致する。

| template（末尾 `-storybook-v1`） | 修正候補contentHash |
| --- | --- |
| gen-bouquet-butterfly-v2 | f5a6db36e3bbf9a6cca264cf278934d7c5a3d80321c6770ff646ff2efb686e0c |
| gen-dinosaur-eggs-v4 | eff2a5c0c9aea1b0c3e5a03f065e1aecf920c22832a18f7da9a3530b3f6e81a5 |
| gen-excavator-cones-v2 | 2178ce4a7e2391487c8d6dca80cc7dce9218ab462656414c6b3202465db23a7a |
| gen-explorer-robot-v2 | 1da4e13186679f68d1c972ae90a5cac566cc1fbfea8c59e9168376529b3380b6 |
| gen-ocean-friends-v2 | 9be769012a9809c1d0f27e7b27987c7824c048e9679f9787e7e9c4685ff0574b |
| gen-princess-bunny-v6 | 59db531e0d9211a0b6e3bd1288c203ddbf4d0d7d2cb81c1eef4d7b81c78c90ef |
| gen-rocket-astronaut-v5 | 1da7929c79db747e20412587d70c3ca0249d57348da4c4e368f312c66a505202 |
| gen-round-sports-car-v2 | 3ff6d4c58b4de986dd99e1fa9d3417f12db6b1f9eeb3032ea1d8491576d037a7 |
| gen-tree-friends-v4 | 4945adf3dd597a0148f8204fbcce9cf7818b2315d2e74912c0dd8633f58ba5ed |
| gen-wizard-lantern-v6 | 56720676a7399090c4d0096eecc7bea3acdd599ca3851b62dd2d28c41c0fefe9 |

**SB-C01: 解消を独立確認（native描画の限定PASS）。** 改訂builderは旧瞳と旧highlightの全MLZ頂点から凸包を求め、連続した瞳の包絡線を作る。この包絡線をfillと原画ink差分の両方へ用いている。旧highlight中心の包含は22/22。修正hashから独立生成した黒/青/淡色全22目の [1/3](../../test-results/storybook-content-audit/revision-2/eyes-review-1.png)、[2/3](../../test-results/storybook-content-audit/revision-2/eyes-review-2.png)、[3/3](../../test-results/storybook-content-audit/revision-2/eyes-review-3.png) と、製品テストの `all-eyes-review.png` を目視した。旧白highlight＋太い黒輪は全22目で消失し、外眼輪・睫毛の明らかな破損は見つからない。瞳の傾きも保持されて見える。これはnative画像の技術確認であり、ブラウザ全zoom/DPR・人間の新版採用を代替しない。

**SB-C02: 21件のnative操作・JSON再読込を独立確認（限定PASS）、残る受入はpending。** `inspect-narrow.mjs` は実際の `StorybookEngine` とnative canvasで前節の21件を個別検査した。4倍/DPR1で選択対象を表示中央へ置き、`getRegionPoint → hitTest(false)` が対象IDへ一致し、1領域だけのpencil状態を作り、塗り色がpointのpixelへ可視反映されることを確認した。状態をJSON化して別engineへ読み込んだ後のpaint値・pixelも同一。消去で状態は空となり、pixelは操作前へ復帰した。全21件で7項目がtrue。hash・path hash・ID・point・pixel・各結果は [narrow-native.json](../../test-results/storybook-content-audit/revision-2/narrow-native.json) にある。媒体画像はこの小さい検査へ読み込んでいないため、pencilの生成紙目の品質を判定していない。IndexedDB保存・UI操作・実機・新しい使用可能径の再測定は別途未確認。

実装担当の修正テストコードも読み、全386 selectable IDのhit/部分paint/erase、全22の旧highlight中心リダイレクト、90回のzoom/DPR設定を検査する構造を確認した。親作業が報告した5テスト/関連unitのPASSは独立実行を反復せず、親実行の証拠と区別して扱う。zoom/DPRループは各回の画像差分をassertしておらず、最終640×800状態で継ぎ目との差を測るため、全90画面の線/塗り/継ぎ目の目視完了とは扱わない。

**SB-C03: 入力hash guard追加をコードで確認。** 改訂builderは3画材原画をmanifest.sha256へ、旧公開templateを採用contentHashへ、旧原画をoriginalSha256へ照合し、retained sourceのregion id/path/detailsを旧公開templateへ等価比較する。今回の独立読取でも旧採用hash/原画/source形状は10/10一致した。失敗時に全件の出力が一括で巻き戻る検査は行っておらず、全入力を最初の出力前に一括preflightするという前節の改善案までは実装されていない。現在の入力の由来確認不足は改善された。

新版QAは10件すべて `pass:false` / `pending technical and human visual verification` となり、未検証をPASSと扱うプレースホルダーは解消されている。templateの `approved:true` とreviewの `author-technical` は技術候補をエンジンへロードするための状態であり、人間承認ではない。人間の新画像採用、実ブラウザの全zoom/DPR、永続保存/コピー、性能の残る受入について、この制作再監査から全体PASSを出さない。

再現: `node test-results/storybook-content-audit/inspect.mjs test-results/storybook-content-audit/revision-2` と `node test-results/storybook-content-audit/inspect-narrow.mjs`。既存のrevision-2証拠を固定後に再実行する場合は別ディレクトリを使い、検査時のhashを混同しない。

## Revision 3: 未着色枠とsoft-v1瞳の独立再監査（2026-10-08 JST）

同日の追加仕様は `docs/user-art-decisions.md` と `docs/storybook-improvement.md` で確認した。未着色/消去後には枠を表示し、着色時には枠を除いて選択色の周囲グラデーション、大きな暗い瞳、輪郭なしの反射光へ切り替える。旧「自動光なし・単独ハイライト塗り」は履歴であり、この更新は単独塗りを復活させない。今回のguideは現在の自動瞳と光に一致する新geometryであり、旧原画のhighlight位置の再現ではない。現行仕様は旧位置の再現を要求していないため不一致とは判定しない。

初回とrevision 2の本文・独立画像/evidenceは保持した。共通 `test-results/storybook-improvement/` の画像は親作業によって現行へ更新されるため、履歴判定には各 `storybook-content-audit/revision-*` に固定した独立画像とhashを用いる。新検査対象は `revision-3/evidence.json` と `revision-3/eye-native.json`（2026-10-07T16:38:25.393Z）にbindされ、実行時のengine/texture source SHA256も記録している。

| template（末尾 `-storybook-v1`） | revision 3 contentHash |
| --- | --- |
| gen-bouquet-butterfly-v2 | 2bd0d37e1278ecf845ab9c8047b13561a802d6eba00f59e047aa354924d47dd1 |
| gen-dinosaur-eggs-v4 | bf348426e511c92e458343e1a514ee69d648c09c4dceb663d911eef1b8507332 |
| gen-excavator-cones-v2 | cc1705bb58f4ec9ce38f78556c6b78c4509efd16d1f2f96643bbb747529ee743 |
| gen-explorer-robot-v2 | 4e326bd6e283ed98394f30b7d274949525ac783a424cd68c07e7a43c3e5410f4 |
| gen-ocean-friends-v2 | 7517af21a282a1619d69660f2a626cbf206efbea770be3a7917437703dc00b8a |
| gen-princess-bunny-v6 | cdbedcdce5094ca0d969575ad6370da28e786e5d01eb67f5d9bcfe46ad657b29 |
| gen-rocket-astronaut-v5 | e7c8218b362c38e372ee10ae8be25bad02ed5cac5739065cef62dd2ee0af959b |
| gen-round-sports-car-v2 | 916535a2dc9110f114f485374f01a3916935031b01cb7866623b108a0a050e84 |
| gen-tree-friends-v4 | de2da8099a27035b45f67e63bcd86f572753b7cd987257e9f46cf7bcc4e7434e |
| gen-wizard-lantern-v6 | 8945d29387ba82c354a2acaa50c1ff51ae5842d6ee5adc17994d35ffb5cdd31b |

**判定: 今回の目の変更はnative技術確認の範囲でPASS。新版の人間採用とブラウザ受入はpending。** 実装ファイルは変更していない。

独立スクリプト `inspect-eyes.mjs` は実際の `StorybookEngine` をnative canvasで実行した。全22目を個別に黒/青/淡色の66ケースで塗り、以下を確認した。

- 未着色の各目には自動guideによる黒線が存在する（元の外眼輪を除いて488〜1543画素）。公開SVGのnative rasterにも各guideが存在する。canvasの `drawStorybookEye` とbuilderの `lineartSvg` は同じ瞳/主光/補助光の中心・半径・傾き・線幅を使用している。未着色では瞳の内側は白く、目を黒く塗った初期状態にはなっていない。
- 66ケースすべてで中央の瞳は暗く、実測RGB各成分の最大は40。主反射光の中心は白（各RGB240超）。関数は反射光をfillし、着色時のstrokeは実行しない。主光に旧黒輪は残らない。
- 各目のboundsとアンチエイリアス用2pxの外側について、着色前後の全画素が完全一致。目以外の顔・髪・別キャラクターへ描画の影響はない。eye描画はeye pathでclipされる。
- 状態をJSON化して同じtemplateへ読み込むと、全体1600×2000 RGBA hashが66ケースすべて着色直後と一致。各ケースを消去すると、全体RGBA hashが最初の未着色状態へ完全復帰する。新guideは一時表示だけでなくsnapshotにも復帰する。これはengineのJSON再読込であり、IndexedDB保存/UI操作の証明ではない。

全22の未着色＋3色の独立native画像 [1/3](../../test-results/storybook-content-audit/revision-3/native-eye-states-1.png)、[2/3](../../test-results/storybook-content-audit/revision-3/native-eye-states-2.png)、[3/3](../../test-results/storybook-content-audit/revision-3/native-eye-states-3.png) を目視した。着色後の黒輪残存、外眼輪・睫毛の明らかな破損、目の外へ色が漏れる状態は見つからない。大きい暗い瞳、選択色の周囲、大きな白主光と小さな補助光を区別できる。傾斜が強いカメocean/r10とうさぎprincess/r42では主光の左側がmaskの縁で少し切れる。外への漏れや黒輪ではなく、共通配置と瞳の傾きの関係として観察した。

親作業の `princess-eye-states.png` は全体と顔の比較に用いた。同画像の顔は420×370のsourceを310×273へ縮小しているため、それだけを原寸確認とは扱わない。別に1600snapshotから420×370を無縮小で切り出し、[未着色](../../test-results/storybook-content-audit/revision-3/princess-face-blank-native.png)、[ピンク](../../test-results/storybook-content-audit/revision-3/princess-face-pink-native.png)、[茶](../../test-results/storybook-content-audit/revision-3/princess-face-brown-native.png)、[青](../../test-results/storybook-content-audit/revision-3/princess-face-blue-native.png) をnative画素で目視した。姫r10/r12では主光・補助光・大きな暗い瞳・周囲の選択色が明確で、黒輪や肌への色漏れは見つからない。ホーム用 `content/brand-generated/originals/princess-v1.png` も参照し、大きく暗い瞳と反射光という目の印象へ近づいたと判断する。人間が希望する美的印象の最終判定は代行していない。

旧10枚の公開contentHash・原画SHA256・retained source形状の一致はrevision 3でも10/10再確認した。旧作品の描画まで新版に差し替えたという証拠はない。この目の再監査は、前節の細領域・全zoom/DPR・性能・ブラウザ保存のPASSを新hashへ転記するものではない。今回のeyeStyleは `soft-v1`、新版の人間採用は引き続きpending。

再現: `inspect.mjs` の出力先を `test-results/storybook-content-audit/revision-3` として実行し、`inspect-eyes.mjs` と `inspect-princess.mjs` を実行する。固定済みの証拠を次の変更で上書きしない。

## Revision 4: ホーム原画との独立した見た目の比較（2026-10-08 JST）

**SB-C04 [P1]: 改善は明確だが「ホーム画像とほぼ同じクオリティ」には未到達。** ユーザーはrevision 3の姫見本を明示的に却下した。前節の技術PASSは当時のhashに対する履歴であり、美的基準の達成・この新版の再検証成功ではない。今回の基準は `content/brand-generated/originals/princess-v1.png` と最新 `docs/user-art-decisions.md` のホーム原画の特徴である。新候補を人間採用済みとは扱わない。

完成通知後の `princess-eye-states.png`（未着色・ピンク・茶・青）と全22眼×黒/青/淡色の `all-eyes-review.png` を確認した。長い一覧は無縮小で3つに分割して目視した（[1/3](../../test-results/storybook-content-audit/revision-4/all-eyes-native-section-1.png)、[2/3](../../test-results/storybook-content-audit/revision-4/all-eyes-native-section-2.png)、[3/3](../../test-results/storybook-content-audit/revision-4/all-eyes-native-section-3.png)）。全22眼の画像では、旧反射光の黒輪・主光の明らかな切断・色の明らかな外漏れは見つからない。ただし画像の目視だけから、画素マスク不変・消去・保存/再読込・ブラウザ操作の新版PASSを出さない。

姫は最新の実際の `StorybookEngine` と4画材画像（虹彩含む）を読み、1600×2000 snapshotから420×370の顔を1:1で切り出した。[未着色](../../test-results/storybook-content-audit/revision-4/princess-face-blank-native.png)、[ピンク](../../test-results/storybook-content-audit/revision-4/princess-face-pink-native.png)、[茶](../../test-results/storybook-content-audit/revision-4/princess-face-brown-native.png)、[青](../../test-results/storybook-content-audit/revision-4/princess-face-blue-native.png) が独立の原寸比較画像である。[ホームと茶の2眼の比較](../../test-results/storybook-content-audit/revision-4/home-vs-princess-brown-eyes.png) はホームの `(480,195,65,65)` を4倍、候補r10の `(614,514,86,96)` とr12の `(750,548,86,92)` を3倍にして並べた。補間を使わず、それぞれの縦横比を保持した。異なる倍率なので絶対画素サイズの一致判定には使わない。

前回の9指摘との比較は次のとおり。P1は現在の見た目の目標に対する必須改善、P2は仕上げの改善であり、一般的な機能障害の深刻度とは分けている。

| 前回の指摘 | 新候補の改善と残る不足 | 優先度・具体的な次の改善 |
| --- | --- | --- |
| 1. 実際の白目の三日月がない | 白目は明確に追加された。ただし姫r10/r12では下側が幅広いU字の帯となり、原画の主に外側に沿う三日月より大きい。虹彩が上・左に浮いた印象が残る。 | P1。虹彩の中心 `.40,.42` と半径 `.40,.44` を開口の原画比較で調整し、下側の白目を減らして外側の余白を中心にする。目の中心・傾きは保持する。 |
| 2. 上濃く下が黄金に透ける虹彩がない | 上の暗さ・茶の下側の金色、青/ピンクの下側の明るさは追加された。茶は原画の広い蜂蜜色の透過光より、狭い均一な暗い金色の帯に見える。 | P2。原寸で下側の面積と明度変化を調整し、暗い縁から内部へ自然につなぐ。 |
| 3. 放射繊維・斑・瞳周囲の細部がない | 新生成繊維は存在し、拡大した青/淡色の全眼で放射方向を確認できる。姫の原寸では茶の繊維が細かな粒状に潰れ、原画の下側の明るい繊維の読みやすさは弱い。 | P2。素材の細部を増やすだけでなく、50〜65px程度の実描画へ縮小したときに読める太さ・明暗と `.55` multiplyの強さを調整する。 |
| 4. 瞳が平たい縦長の黒楕円 | 大きさは改善したが、姫r10/r12は依然として縦長。開口幅/高さは `.86`、虹彩は約 `.782`、中央瞳は約 `.726`。黒の外縁も硬く、生成虹彩の柔らかな瞳縁の上に均一な楕円を重ねた見え方。 | P1。開口と独立した虹彩/瞳の縦横比をホームの丸さに合わせ、中央瞳の境界へ透明度の羽根を入れる。現在の `.19w,.225h` の全不透明ellipseと不透明radial gradientでは縁のぼかしを生まない。 |
| 5. 厚い暖色の上まぶた・睫毛・影がない | 影と茶系の上縁は追加された。睫毛は旧形状の黒い三角状の数本のまま。原画の厚い連続した暖色の上まぶた、睫毛根元から虹彩へ落ちる曲面の影には届かない。 | P1。旧inkへ上下の色をつける処理だけでなく、姫2眼の上弧に沿う厚み・睫毛根元・軟らかい影の形を作る。参照原画の上弧の比率を比較する。 |
| 6. 全周が硬く均一な黒輪郭 | 下側は薄い茶色に変わり改善した。一方、上側が硬い枠に見え、下側にも細い二重の縁が残る。顔へ柔らかく接続するホームの眼縁とは異なる。 | P1（5と一緒に改善）。開口の曲面に沿う上縁と下縁を別に調整する。`drawDetails` のbounds全体の縦gradientは形状や傾きを表現する上弧の代用にならない。 |
| 7. 反射光が大きい左上にある | 右上の配置は改善。各目の傾きにも追従しており、前回の左上配置は解消して見える。ただし主光は原画より丸く強く、補助光との合計の面積が大きい。 | P2。原画と同じ開口高さへ正規化した比較で主光の面積を調整する。 |
| 8. 一様な白い丸2つで湿った反射に見えない | 薄いglowが加わった。ただし主光と補助光が接触し、白い二段の丸い塊に見える。姫2眼とも原画の小さな不規則な光とは差がある。 | P1。主光と補助光の接触を避け、主光のわずかな非対称形状・縁の柔らかさを作る。枠を戻す修正ではない。 |
| 9. 共通bbox配置が目の傾きに合わない | 各目の中心/軸を測ったgeometryと回転が加わり、姫/兎の幅も変更された。反射光の明らかな縁切れは今回見つからない。ただし姫/兎とも縦長の虹彩・下の広い白帯という共通形状が残る。 | P1（1・4に統合）。少なくとも姫r10/r12、兎r42/r44の丸さ・余白を個別に原画と比較する。全22の色・傾きが違っても同じ見え方になることは未確認。 |

先に改善すべき順序は、**姫2眼の丸さと白目の量 → 厚い上まぶた/柔らかい眼縁 → 瞳の境界 → 反射光の形と面積 → 下側の透過光/繊維**。白目や繊維が追加された事実を、ホームの品質達成と読み替えない。

検査時のbind記録（SHA256、contentHashは別の値）:

| 対象 | 検査時の値 |
| --- | --- |
| ホーム原画 SHA256 | `c3df006d7ae944f6b46f502bf46444c6945ec3904236888563c01c526f26db01` |
| 姫QA記録のcontentHash | `4c3ef840eb2917ceadcab05413b18c90b0661a7e17ec779486c198aaff446e66` |
| 姫compiled JSON file SHA256 | `15b648c7e325c9e669143686141edf79d7b66ffef3ebf40be3c313c794e19bb4` |
| 親作業 princess-eye-states.png SHA256 | `0efc6fa427b31fa4cd7d298cf188ff6d556b1217348dbd0a64fe6e3116676dc2` |
| 親作業 all-eyes-review.png SHA256 | `fa7be60e360852e4dab9b358b096ada9e1856f963c5d7af5871e5b797edcb4dd` |
| 親作業 princess-smooth-2048.png SHA256 | `f15d24f33a0cf365144e01b95c89c6b2662f160730adf9808e0bf320b81e67ad` |
| storybook-texture.ts SHA256 | `d79c4fd68cb1924255f2f860c87fbc27869bb66595ce07ad89509a2c2be0aa78` |
| storybook-engine.ts SHA256 | `703f2deee7a6af6e88c97efa4d65ab8996e86e4b5ad58a20174dd3bba3e5d250` |
| build-storybook-content.mjs SHA256 | `4f745903d46267ac069798d6c5c0799cca104b4fc44830f671ed541e65f5ab30` |
| 独立比較画像 SHA256 | `879e9ef571b2264891e137b3c82ec097dac3b4188eeab9984d8ac03c14bc0cfb` |

今回の独立作業は参照・最新ソースの読取、比較用画像出力とこの追記のみ。実装/承認ファイル、以前の監査原文は変更していない。全体テスト、ブラウザ、消去/永続保存、新しいhashの全体技術QA、人間の採用判断は実行していない。
