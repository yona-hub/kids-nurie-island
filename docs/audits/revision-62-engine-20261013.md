# I34 候補62：独立engine監査原本

最終保存前の再確認：主要51入力を2026-10-13T22:53:06.1717095+09:00に再hashし、bytes/SHA-256は全51件で開始値と同一。後続のmetadata読取後にも入力不変を確認した。その他の参照実ファイル群は下記の終了照合時点で前後同一。

判定：**限定PASS（今回のengine/producer差分の静的監査、現在版の実ファイル結合・保存済み技術生結果の照合範囲）。** この範囲で具体的な新規ブロッカーは見つからなかった。美術PASS、全状態・全操作、実機、外部同期、人間採用、P05性能、プロジェクト全体のREADYを意味しない。頬3fieldsの個別部分塗り/消去/逆明度の追加実画面は、今回の記録確定対象にまだ含まれていない。

## 所有・条件・時刻

- 作業ルート：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。開始2026-10-13 22:33:56 JST。終了の全体identity照合は22:47:05 JST。本報告保存は開始20分以内。
- 主モデル/effort継承、単独担当、再委任なし。書込みは本新規報告だけ。production/tests/素材/固定証拠/旧報告を変更せず、他担当変更を戻していない。テスト再実行、画像生成、外部通信、commit/deploy、性能測定なし。P05 STOPを維持。
- AGENTS.mdの品質継続・元資産保持とharness-orchestratorの限定監査方針を適用。旧61 engine報告のPASSを今回の差分根拠に代用せず、previous-61の実snapshot、62のsource・導出template・生JSONを読んだ。
- 58/59/60/61等の旧FAIL原本は今回変更していない。過去版の指摘を技術unit成功だけで撤回していない。
- 固定build：`a95ad6a0c04f9327eba28ed61ddc222cfc8bb4246863155a45d421eea2d17d0e`。
- 固定runtime/source：`74c1b959e505c5911eb697bfe8dbc543669d3223e59ebb7bb002170aaaf4dc1c`。
- ローカルdist-demo1297ファイル、runtime67ファイルを開始/終了に再列挙し、保存identityとbytes/hash/aggregate一致。追加・欠落・差分0、inspectionHarness30件もhash差分0。61と62のruntime67件も要素単位で一致した。served URLを本担当が再fetchしたものではない。

## 今回の実差分

`scripts/smooth-surface-layout.mjs`をprevious-61の保存実ファイルと直接diffし、fieldBoundaryOverrides処理とreport metadata追加を確認した。`authoring.json`は姫のoverride1件の追加だけで、それを取り除けば旧JSONと同一。`smooth-finish.test.ts`は61の保存実装snapshotとの直接diffでR61S-1回帰1件の追加だけだった。

別の読み取り専用計算でlocal-change-checkを再検証した。10templateのうち他9件はURL/JSON同一。姫の実差分はsurfaceFieldsのr06/r07/r17のpathだけで、再計算後boundsは3件とも旧値と同じだった。paintedByField=true、coveragePath/paintBoundsも不変。通常regions/details/opaquePath/eyes/groups、mediumAssets全10セットは不変。3fieldのpath/boundsを旧値へ戻した正規化templateは旧template全体と同一になった。

| field | 所有する部位 | 現在bounds（旧値と同一） |
| --- | --- | --- |
| r06 | 前髪と右内側の髪 | x458.1119995 / y323.5083008 / w507.1614380 / h475.4938354 |
| r07 | 顔と耳 | x499.2708740 / y401 / w375.8939819 / h313.5917969 |
| r17 | 右外側の長い髪 | x701.0980225 / y668 / w343.0018311 / h396.5759277 |

姫のIDは`gen-princess-bunny-v6-master-v4`を維持し、content URL末尾hashは`88ffffee386d3248aa17e31de8640b1e87fef9812e061179d35c4e354e133d68`から`8a047ddd7ca0729e4e2a0a841d1490f9b1c3a8c93464e294ade81d96ae0db9fc`へ更新された。古いcontent hashの実ファイルも保持されている。

## 静的engine判定

1. **共有曲線・補集合・AA underpaint：限定PASS。** `smooth-surface-layout.mjs:149–162`はregion/neighbor/complementの所属を検証し、overlapを有限0〜2 worldに制限する。現在のoverrideはr07、neighbors r06/r17、complement r06、overlapWorld=1、domain x774〜840/y644〜694。insideをregionPath∩domainとして一度作り、r07へinsideの1world幅underpaint、r06へdomain−inside、r17からinsideを除去する。r07のunderpaintはdomainで再clipする。したがって集合操作の構成上、変更はdomain内に限られ、underpaintとcomplementの和はdomainを覆う。別々に近似した境界を合わせる構成にはなっていない。C曲線の内部接続点(807.5,675)では接線方向も連続している。実ライブラリの全境界/全色の画素を本担当が再renderしたものではない。

2. **暗い色優先・部分塗り・消去：静的整合、追加実画面は未確認。** 現在の`smooth-finish.ts:45–79`は選択pigmentの輝度が高い順に描き、重なるfieldは暗い選択色を後から合成する。paintの履歴順に依存しない。smoothだけがfield/lightへ進み、`storybook-engine.ts:91–126`は未塗り/dry隣接の通常pathを白で戻し、元ink maskも保持する。色変更/消去は現在paintsから再構成され、cache keyには色/paintType/mediaRevision/関連fieldが入る。今回runtimeは不変で、境界overrideはpaintデータやhit pathを変更しない。既存の塗り順/消去/cache/隣接回帰も今回full unit内で成功。ただし新しい頬3fieldsについて任意色・個別部位・逆明度を組み合わせた実画面の網羅は、この静的判断や新回帰1件から足していない。

3. **bounds・タイル・輪郭：限定PASS。** fieldを書換えた後、paintSurfaceとの交差のtight boundsを再計算する。現在3件は全て有限・正のboundsで、上表のとおり旧値と同じ。`storybook-engine.ts:47/163`はこのfieldBoundsをtile候補に使い、変更したcurveを古い狭いboxで欠落させる差分はない。paintSurface/repair/coverage/hitの形状は今回不変。TILE=512/BLEED=2、tile interior合成、direct snapshot、surface専用clip/phaseも61から変更なし。native90条件の保存指標とPNG bindingは下記で確認した。実Chrome輪郭の美術的な滑らかさは画像目視担当の別判定が必要。

4. **画材・眼・legacy・schema：限定PASS。** runtime sourceの同一性に加え、現在の分岐を再読した。surface paintはsmooth限定、crayonはtexture後・形状陰影前に終了し、pencilはsmoothLightを使わない。顔だけsmooth/眼未塗りのblankInk分岐は残り、眼paintを自動追加しない。v1/v2/v3/4 dispatchも不変。独立AST比較でProjectとRegionPaintは元I34前の定義と同一。通常geometry不変、現在30dry状態/旧作品40状態の保存RGBA比較とも整合した。旧作品を新版へ強制変換する差分はない。

5. **thumbnail指紋：限定PASS、非ブロッカーを明記。** artwork-source.tsは61と同一で、新版smooth用runtime tokenの条件変更はない。一方でfingerprintにはsource.template全体を入れるため、姫のtemplate内容更新ではblank/dryを含むキーも更新される。これはcontent変更による再生成であり、保存paintや画材描画の変更ではない。他9templateと旧templateのキー条件は今回不変。新しいcontent URLのhashとalias/buildの一致を別計算で確認した。今回を「姫のdryサムネイルキーも61と同一」とは記録しない。

6. **producer結合/private：独立PASS。** scope-checkの主張を読むだけでなく、別の読み取り専用計算で旧public素材963件、現在public/build結合53件、全10master/smooth mapのhash、private原画/registered20件の保持とbuild内同一hash非存在を確認しissues=[]。公開templateにoriginals/finished-v1/registered.png参照はない。全10の画材画像URLと実bytesを保持し、owner/label/相対lightを今回変更しない境界修正である。私有生RGB画像を公開/添付していない。

## 生結果の照合

本担当は既存unit/browser/producerを再実行していない。以下は候補62の保存済み生結果を読み、関連実ファイルのbytes/hashを結び付けて確認したもの。

| 対象 | 現在62で確認した結果・限界 |
| --- | --- |
| full-unit.json | **単一現在版460/460成功、0失敗・0skip、success=true**。smooth-finish45/vector-revision7/thumbnail-assets11の計63件も成功。61の458+retry結果を合算していない。 |
| cheek-before-unit.json | 新回帰1件FAIL、44skip。localized cheek notch=1.3499073205303649に対して閾値0.5。 |
| cheek-after-unit.json | 同1件PASS、44skip。45件の全成功実行とは呼ばない。 |
| native-zoom/evidence.json | 全10×zoom1/2/4×DPR1/2/3の90PNGをhash/PNG寸法と照合。記録outsideContourPixelsは全0、最低visibleInteriorRatio=0.9798369165339306、seamAverage最大0.047088842495940614、otherAverage最大0.0024115728784536547。保存された各値は既存harnessの閾値を満たす。 |
| native眼配色 | 20眼×5色=100条件。記録のreflection各channel>240、pupil各channel<48を確認。眼100枚の個別PNGを再renderした検査ではない。 |
| after/evidence・comparison | I34 before基準とのgeometry10同一、blank/crayon/pencil計30RGBA同一、smooth10差分。after40PNGを記録pngSha256と照合。これは61との40状態比較を示すJSONではない。 |
| after/legacy-comparison | 元before作品の4状態×10=40RGBA一致を生JSON間で再照合。 |
| implementation | snapshot97件・対応current97件、previous-61保存53件をbytes/hash照合し全一致。 |
| build/lintログ | 現在ログを読取。エラー出力なし、bundle現物は上記identityで確認。本担当の新規build/lint実行ではない。 |
| Chrome追加結果 | 開始時は進行中だったが、22:43:14 JSTに新規3JSONを別固定して読取へ追加。browser/results.jsonの26testを再帰列挙し全expected・全result passed、unexpected/flaky/skipped=0を確認。browser-image-indexの121実ファイル=103PNG+18JSONのbytes/hash/PNG寸法を照合して全一致。実Chromeを本担当が再操作したものではない。 |

technical-verification.jsonの要約値も上記生JSONと整合した。そこに記載されたrequire_escalated/localhost fixtureの実行環境説明は元実行側の記録であり、本担当が再実行して証明したものではない。identity-afterはunchanged=trueかつ現在のbuild/runtime hashと一致した。

新回帰は3200pxのdirect snapshotでROI(1590,1300,57,61)、worldのbox x795〜823.5/y650〜680.5を測る。skin/hairの遷移量>80、白fringe増加≤8、遷移位置の2階差分≤0.5を確認するテストで、curve文字列との一致を試すだけのテストではない。ただしauthor domain全体y644〜694や任意配色/部分状態の全体をその1件だけで保証しない。

## 残る範囲

- 指定diff/engine・結合の静的範囲で新しいブロッカーはなし。
- 頬3fieldsの個別r06/r07/r17部分塗り・消去、暗い肌/淡い髪の追加Chrome画面は、今回確定した入力に未収録。static整合と実画面合格を区別し、ここは未確認とする。追加撮影の成功を先取りしない。
- 実ホーム相当の絵の自然さ、共有curve両端やAAの見え方、全source/部分状態の美術は本担当の今回範囲外。unit/native/Chrome成功を美術PASSへ転用しない。
- Chromeの26件/103画像は定義済みsuiteの範囲であり、全スマホ実機・全状態・全操作・live外部同期を意味しない。
- 私有原画保持、旧FAIL保持、P05 STOP、人間採用未受領など既存の制約を変更しない。全体のNOT_READYを解除しない。

## 入力の前後SHA-256/bytes

主要入力51件は最初の30件を2026-10-13T22:34:40.6209624+09:00、追加11件を22:39:52.6189381+09:00、新Chrome等6件を22:43:14.4692224+09:00、追加4件を22:45:31.7358151+09:00に固定。終了は2026-10-13T22:47:01.1724923+09:00で51/51のbytes/hash一致。主要表のhashは前=後。パスは冒頭作業ルート基準。

大量の参照実ファイルも、各行を`{path,bytes,sha256}`として固定し、JSON配列のSHA-256を前後再計算した。各群には重複があるため、件数は合算しない。単なるindex JSONのhash確認だけではなく、参照先の実bytesを再読している。

| 入力群 | 行数 | bytes合計（前=後） | 前→後（UTC） | manifest SHA-256（前=後） | 比較 |
| --- | ---: | ---: | --- | --- | --- |
| 97実装snapshot・current97・previous53 | 247 | 39520835 | 2026-10-13T13:38:34.446Z → 2026-10-13T13:47:03.353Z | 9af35ce658c13d733f9b3f9073cbf3660f0c3a0b7687431dc126e22509ad9da0 | 同一 |
| 旧素材・現行binding・private・schema入力 | 1091 | 565110686 | 2026-10-13T13:41:42.908Z → 2026-10-13T13:47:05.694Z | ddc635a9754cb5fa0012ed819dc137578b87c124b43c7bb32f5c282024a7059a | 同一 |
| native/after/Chromeなどの証拠実ファイル | 309 | 100338933 | 2026-10-13T13:44:20.396Z → 2026-10-13T13:47:03.588Z | e59f5b1594972793f34e243a4b8d269efa2c85b6089c999e7bd5ee640773492d | 同一 |

snapshot群はprevious-61/evidence.files順の53保存先と、implementation/evidence97件の保存先/対応current順。binding群はscope-check.unchanged順→catalog順の旧/現template・public/build結合→privateSources→schema元/currentの順にpath重複を除いた配列。artifact群はafter40PNG→native90PNG→extra/eyes→browser-index→raw browser result→technical.evidence順にpath重複を除いた配列である。全群で個々のbytes/hashおよび配列aggregateの前後差分0。

| 主要入力 | bytes（前=後） | SHA-256（前=後） |
| --- | ---: | --- |
| scripts/smooth-surface-layout.mjs | 15832 | d6488989d89218f347a82ab06a37366a88e34e1b1f8fc2270a3f73c03ae587af |
| content/smooth-finish-i34/authoring.json | 5812 | 80d4e3be5ebf5070f88c1239b1f6526669b44050cb248c4e361bb65aa7bf3b57 |
| tests/smooth-finish.test.ts | 30255 | 28ddd266428e0474077719344350352bcabb3df4307ad24820dd7ae48f4a6fc3 |
| tests/vector-revision.test.ts | 12392 | 3a8ca2015484cc1ef2fb7a5271fda8269904d83917848b66ddbe563b23a393d5 |
| tests/thumbnail-assets.test.ts | 12027 | cb83fd0f5914e7cfebfa923643f9a8262d350b975ca2bf128a74c8289cf7825d |
| scripts/build-smooth-finish-v2.mjs | 19188 | 6c7e115b290ae61fed3d2c3739d443f53806be8630b889c70916f9c60a340e66 |
| scripts/chromatic-finish.mjs | 6803 | e72d0e8f484e812806304f1cec9325b698db62a217bb36f9288d68f5487baa6a |
| packages/coloring-engine/src/smooth-finish.ts | 8158 | 750da1c07b611f62f87cf307d2fe6a5ff10aec6969ed3f3928ef62c3944cfc31 |
| packages/coloring-engine/src/storybook-engine.ts | 23757 | f8f01c95c251d1a1a3dfcc47739c7c102971d75be4bc687a124af32253e38c7e |
| apps/web/src/artwork-source.ts | 1994 | 0004bd25508e3932539897ac14f52130354073a93e130746d563f15e0f02b3b7 |
| content/smooth-finish-i34/manifest.json | 196908 | e3cd577914e90d7a479ddc44317984d1a115be4bbe1b1ca9ff0b54580342a8c4 |
| apps/web/public/content/catalog.json | 6244 | e821375724bb479921dae5fb941e99a71e5b6cd14ccf471bcbd9397991192bc5 |
| test-results/smooth-home-i34/revision-62/identity-before.json | 323767 | e3555d85dfadbf51c4257941b733546e159bcd73099df092bc093d73384a5ae5 |
| test-results/smooth-home-i34/revision-62/full-unit.json | 202279 | 9c0272a8c876896501c955259c3e216a872c10fbd44102548488026805837dc4 |
| test-results/smooth-home-i34/revision-62/cheek-before-unit.json | 18455 | 34e6df5be7da3a65fe2fda06ba8efb0f0513577acb33bbd554cf5d8fd35d5fe7 |
| test-results/smooth-home-i34/revision-62/cheek-after-unit.json | 18060 | f2e2ebfb8cfb7596bd84bca65bdec176bd7dd5b102b9759931bba3daf84579fd |
| test-results/smooth-home-i34/revision-62/local-change-check.json | 2878 | 6ec144a72e4bad91f4b08ec388d3ca283bab506b68b809153d85b620358fa53f |
| test-results/smooth-home-i34/revision-62/previous-61/evidence.json | 29883 | 4321e07349585f9f892f67159461a36cf036f1d56208546e27f7985b37e72134 |
| test-results/smooth-home-i34/revision-62/previous-61/scripts__smooth-surface-layout.mjs | 14244 | d26b8edee4112affd93ba680f85eb3669fb2e8600b665396136a926b421dd284 |
| test-results/smooth-home-i34/revision-62/previous-61/content__smooth-finish-i34__authoring.json | 5464 | 7122f7c620de09a60a6f5213106773392e2dd4e29419cca5eba2140500f6e906 |
| test-results/smooth-home-i34/revision-62/previous-61/content__smooth-finish-i34__manifest.json | 196136 | 2b146f29247bfe20aa87b0a5cae1947a7bec76fc4a23d4b445b43e2e8eb5258d |
| test-results/smooth-home-i34/revision-62/scope-check.json | 221096 | f7771da6e6e2e239b96f765b8196b139406ebc71cb13a6f32295d95d37005d9a |
| test-results/smooth-home-i34/revision-62/check-local-change.mjs | 2288 | c9e75a395df950ea2e9c6bf9e49bd0d22513f3dc499469689701d2e8aeff2a74 |
| test-results/smooth-home-i34/revision-62/check-scope.mjs | 4132 | 0b802b60f3e396a7a64a0179b36c8b6fe83ea468b5a1bbdfda19b612eec51c6b |
| test-results/smooth-home-i34/revision-62/native-zoom/evidence.json | 51273 | 6dc4e32a9ec8e8eb782e7bc86d17ac84176691c94f474636533e6a3a04a23daf |
| test-results/smooth-home-i34/revision-62/after/evidence.json | 15834 | 34dd37ce6d39b5472809c7c72420f53c6fae3611112b2f18e36527caadf62d02 |
| test-results/smooth-home-i34/revision-62/implementation/evidence.json | 21136 | 8c6a076c1535e02289987a86e9f3ffa7177ed7325687a5600a5af17e21686224 |
| test-results/smooth-home-i34/revision-62/build.log | 2435 | 4f645d151b43f3fe8c988f454be947e9b7eaccb40d7fb9c6b99af6b160764a11 |
| test-results/smooth-home-i34/revision-62/lint.log | 65 | ac8942a006f958a19d8b4cdee7b14587c4375eb1e4f7e15dcc5f7f62fb9e385f |
| AGENTS.md | 3243 | 48765c3480352eb9a0ad696874dd192465cac5cfd0ff2d5025e3840fb170c1e7 |
| test-results/smooth-home-i34/revision-62/after/comparison.json | 4388 | a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584 |
| test-results/smooth-home-i34/revision-62/after/legacy-comparison.json | 7134 | e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07 |
| test-results/smooth-home-i34/revision-62/extra-evidence.json | 5776 | c3117078159a4378cb1ab4c4c9c160caf000351200a70ee49dec92174ef4e0c5 |
| test-results/smooth-home-i34/revision-62/eyes-native-evidence.json | 6255 | 2615468745cc365d0ce82ee251e51ccb396a3526408b03ab17a900a367a25393 |
| test-results/smooth-home-i34/revision-61/implementation/tests__smooth-finish.test.ts | 28491 | ac49047086ca9b5e2c5478ec51b4884dfc38b79a38833c082f5a5d33c72729b3 |
| scripts/review-smooth-finish.mjs | 5879 | aea940650e449849b70b7fcab8584093d5d0f13a6ab8ed3d831b903f904276fe |
| scripts/verify-smooth-zoom.mjs | 7411 | f11420fff128b9757c9fb4ec8ed0b8c9f6a3086e3cc1c14cf9704e8dad5c13e5 |
| packages/shared-types/src/index.ts | 7302 | 0a93fb60e012c1c3ff39ee87158fddd50fe148667d792205766730219a160fbe |
| packages/coloring-engine/src/canvas.ts | 5920 | fc587c7d85e27b5ab81b60236589591ee1aae5bc3d23a7106b38a775961d79e0 |
| packages/coloring-engine/src/renderer.ts | 2858 | 4c7c928b2844674b23a465f0e269b3b6a091f62991a0fdffb3cc4c5dea5d34a9 |
| packages/coloring-engine/src/storybook-texture.ts | 13871 | 14ccbc1386fc3d7bb821dbcf06ea3d968b8ffa439cfea7467067855d7ebfa925 |
| test-results/smooth-home-i34/revision-62/identity-after.json | 323788 | e277a656533f53b290a5941a6d0c7609fd0a8eadad223564bb6f775fb034064f |
| test-results/smooth-home-i34/revision-62/browser-image-index.json | 26129 | 992d71082a4bb8326df282779b194b2e3212fee31c2e0735f796aa9e2aea3be8 |
| test-results/smooth-home-i34/revision-62/technical-verification.json | 5787 | 128421a57b9d0b38ad79831c50db86f0a238dc18182b303f82ae209761308c92 |
| test-results/smooth-home-i34/revision-62/before/evidence.json | 15300 | 2f0b4311a7fb3a6e531f58ba369d5853b03920ce65cde9ae6141e45ccb882a00 |
| test-results/smooth-home-i34/revision-61/identity-before.json | 323511 | 86eefbd161783cd9a08435fc684a6c91d93686e8221d1133942a3bb96120c30b |
| test-results/smooth-home-i34/revision-62/native-zoom/eyes-5-colors.png | 916454 | 43c8479895bb49c659580d82b6bd18c84664a382978fe1db8adfd263fe86d65f |
| test-results/smooth-home-i34/revision-62/browser/results.json | 31636 | 49c164d5e7df6a24b60d212ab8aa4f0222c4a5fab338ccf79274b5a837e6cc95 |
| test-results/smooth-home-i34/revision-62/current-map-dimensions.json | 8942 | 7455c8be276fe6fcdab778b0aa8062e454ad5af44a130a42e8c248c41bfbba8e |
| test-results/smooth-home-i34/revision-62/derive.log | 713 | a91ec59261d355f91cbdfce2775359c3f5fd46153bd60901b7e9478102bdcf74 |
| test-results/smooth-home-i34/revision-62/browser.log | 4602 | 5c4c4251e8089238de6a4670f42972152cec577d8d1c3dc6a0b958082e49f572 |

