# ベクター新版：独立 engine / 旧作品互換性監査

日付：2026-10-09 JST。指示元：I15〜I17、V02/V03/V07/V09〜V11。担当：独立 engine/互換性監査。実装は変更せず、監査文書と `test-results/vector-engine-audit/` だけを作成した。

**独立 engine/互換性の限定判定：PASS（最終候補 `f3c10731…`）。全10 dataと配布718現物/57sourceを固定照合した。車の固定白2detail除去を赤/青/緑それぞれ2通りで塗る計6状態の実pixelで新規確認し、本当の3白glints・原source・9作品・runtime・旧rendererの不変を確認。実装担当の同build Unit 390件、Chrome 15件・retry0、旧v1/v2 UI copy3件、90＋30＋30 frame、face/lamp8、dynamic DPR3のrawを独立に読み取って対応付けた。先行f818のmagic・20眼、55f1の車境界、旧renderer40＋40状態は不変を示した範囲に限る履歴で、新規再実行数へ合算しない。全体 READY、主観的な造形、人間採用、本番build approvalの判定は行わない。**

## 対象と固定証拠

旧380/旧監査PASSを新証拠へ転用しない。実 SQL・cloud fixture・全体 Unit、ブラウザ、CPU4/DPR2性能は実装担当の実行範囲とし、この監査では起動しなかった。提供された最新rawを独立に読み取り、buildとの対応を記録した。物理端末・実認証/実同期は未検証。主観的なホーム原画との比較は別担当の報告を参照する。

`run-audit.mjs` は現行 TypeScript を監査フォルダへ transpile し、`@napi-rs/canvas` 1.0.9 と独立した fake IndexedDB を利用する。読み込んだ全入力を `input-snapshot/` またはラベル付き snapshot へ保存し、SHA256 を結果へ記録する。本体 renderer を模倣する代替実装は使わず、現在の renderer を直接実行する。旧比較 oracle は保持した配信済み `artwork-source-V2c1FoTm.js` の描画部分をそのまま評価する。React UI の末尾と外部 import を除き、Canvas の外部定数 1600/2000/2048 は開始時の shared-types から解決した。

| revision2段階の対象（履歴） | SHA256 / 証拠 |
| --- | --- |
| 旧配信 bundle | `6f647489fc140b5fb4491b2823e797f7ba4165f819a21e292e389861288efc65`。開始時 `identity.json` と一致 |
| 新 dispatcher | `3a007749819566c0d29b24e995b9b3073fa17047e8e5518abab47d47b9724894` |
| v3 engine | `f34abcab7e7758ccf334f80d615fc513b03702509a3685dddbf54353b0a9b0d8` |
| authored-eye | `dee7f869010462508c0432355a9123638a1f42d95a7db4fb1f023cd9e2ba09c5` |
| frozen v2 engine | `598318e8f851011ecce83efad19c54272d96929245ad9e1a178ca18b5394bebb` |
| frozen v2 texture | `0c0cb7977dd787fb8c0d708fd312b2781a09e53cc8c8a1ab2ddb3a690d7481b2` |
| persistence | `82d3ac0f6a330a0dfcee5b70606511f67699a2a48d31a2a2f019df805aa47e74` |
| revision2 catalog | `ee303614c2bb9164456d64793fcebbfc4a8f85cccb9ec1a59104ba7263169cf4` |

全 template/原画/画材/依存 source の hash は `audit-results-revision2.json` の `inputs` が正本。実行 2026-10-08T15:40:21Z〜15:45:53Z の間に `shared-types` が `932b7436…` から `0aef7fcd…` へ変わったため、この run の `success:false` を全体 PASS に変換しない。snapshot の renderer/geometry/保存試験の結果と、その後の型変更を区別する。geometry 修正後に revision2 の描画 PASS を最新へ移さない。

明示fillRule修正後の固定入力は `input-snapshot-fillrule-recheck/` と `audit-results-fillrule-recheck.json` の `inputs` に保存した。compile前後および境界・目中心再検査後の入力変更は0（`fillrule-recheck-input-stability.json`）。compileのファイルは **compile/snapshotだけ、checks=[]** であり、その `success:true` をテストPASSへ数えない。実検査は後述の境界・目中心の専用結果で確認する。

| 明示fillRule修正版の対象 | SHA256 |
| --- | --- |
| catalog | `425994517d48625a5e99096af7672a99c65d21243933396fe990de8c7cfed952` |
| v3 texture | `59c9d61b6d76cab0a9b97085127a34c5e60e2c3ccc36125b2ef283194b4abe84` |
| shared-types | `c28c558c8021f25033642a2cf47b79c46b1d1444917fea7d35ee62097c3ecebc` |

この明示fillRule段階ではv3 engine、dispatcher、frozen v2、persistence は最初の表のSHAのまま。各templateのSHAは `coverage-witnesses-fillrule-recheck.json` と `coverage-hole-probes-fillrule-recheck.json` に記録した。この段階の47,709点PASSを共有境界candidateへ転用しない。

## 共有境界candidateの新しい独立検査

`shared-boundaries.mjs` は ink の白成分に接するBezierを exact region へそのまま使う。目を切り取った親領域だけはPathOpの再serializationを経る。`trace_storybook_ink.py` は1600×2000の原採用座標で1.5世界pxの小切れを閉じ、外側silhouetteに接した旧眼縁の消去が外形を破らないよう保護する。原画の編集ではない。

今回の対象を `input-snapshot-shared-boundary-recheck/` へ新規固定し、現在のrendererを再transpileした。compileだけの `audit-results-shared-boundary-recheck.json` はchecks=[]。独立検査は `audit-shared-boundaries.mjs` で別に実行した。入力は検査前後変更0。

| 対象 | 固定SHA256 |
| --- | --- |
| catalog | `ef6319fd0f85ca513fbca3b645150e5046ec312e1db62c079bf528c1ab352d86` |
| v3 engine（exact fillRule hit） | `4725f42f5fef6d9725a17c0ca1a2d989514062481fc694f0968e5e59f2ebcd41` |
| v3 texture | `59c9d61b6d76cab0a9b97085127a34c5e60e2c3ccc36125b2ef283194b4abe84` |
| authored-eye | `dee7f869010462508c0432355a9123638a1f42d95a7db4fb1f023cd9e2ba09c5` |
| shared-types | `d929aba97ce3b857330b3ef388c58a0766a2a135ef44bb4aec86686a9d89ced9` |
| builder | `51fc4297377923ef161b4241a5820b33a05c26cd8064954139573991df7afd18` |
| shared-boundaries.mjs | `5f7a31a0521a5f541017995b83dbbc745757399e6e15ce5ab966ed9ef84d7ec1` |
| trace_storybook_ink.py | `a5a8bccf2c19f1123c05ec00675018595cd07d37034e98867c6b03244974edb2` |

全template・trace-output・QA correspondence・読み込んだ source のSHAは `shared-boundary-results.json` のinputsが正本。trace/QAのproducer自己判定だけをPASSに使わず、actual pathのBezier control、Canvas包含、実engine hitを別に評価した。

| 新規検査 | 限定判定と証拠 |
| --- | --- |
| exact/inkの共有曲線 | PASS。非眼の363領域のうち目の親11を除く352領域の全Bezierが actual ink と一致。全363の12,334 segmentのうち11,500は向き/始点に依存しないcontrol比較で直接一致。親PathOp再serializationの未一致例は後述の微小差として診断した |
| exact/coverage/ink/hit | PASS。bbox内の格子と曲線法線の±0.25/±2世界pxから270,339点を新規検査。exact内のcoverage欠け0、bare外部coverage0、実exact hitの別領域化0。黒線72,975点で不要なexact hit0。evenoddをexact/coverage両方に適用する現在のengineで確認 |
| boolean外部候補 | PASS（限定）。全363領域の `coverage - exact - actual ink` と `exact - coverage` を制作fillRuleで再計算。ほぼ空/退化形状で、候補探索3点から実包含の不一致0。前回の47,709点を合算・転用しない |
| 小部位のhit | PASS。bbox短辺50世界px未満の45領域に独立interior sampleがあり、`getRegionPoint` が全て当該IDを direct hitする。花r14、恐竜r06/r07、車r03/r10/r13/r15/r16/r30/r31/r33/r34など。実タップの助勢/端末操作は別範囲 |
| 20眼の親領域の穴 | PASS（中心）。全20でparent exact/coverage/generalInk=false、direct hitは眼のregionId。親顔だけをsmooth赤で塗る前後の中心画素が20/20一致。これを旧眼縁の全成分消去・眼縁品質の合格証拠にはしない |

生結果 `shared-boundary-results.json` は初回の厳密判定で **success:false、3 observations** を保持した。花r05 `(841.9511451721191,552.3079299926758)`、花r09 `(1192.0044784545898,349.37120628356934)`、姫r31 `(677.6757125854492,974.230302810669)` が exact と ink の同時insideになった。

3点を凍結snapshotで bounded 診断した結果、最寄りink/ exact Bezierのcontrol pointsは同一で、曲線からの距離は0.000080 / 0.000140 / 0.000164世界px。inkのnonzero/evenoddの両方で同じ結果だった。各4×4世界pxを128×128点で再検査し、同時insideは各1/1/2点だけ。この観測は同じ曲線の包含判定の数値許容に一致し、独立にずれた制作境界・広がった塗り面の証拠ではない。親11領域から各2のserialization未一致例22点も、actual ink curveとの距離は最大0.000056世界pxだった。`shared-boundary-overlap-diagnostic.json`。

この診断を理由として `shared-boundary-classification.json` に3点を数値境界観測として分類した。未解決の実装観測0、入力変更0で **限定PASS**。rawのfalseを消さず、製品FAILとテストoracleの厳密判定を分離した。

実装担当とVisual担当から、男の子r15の中心を含まない旧上眼縁1成分、瞳境界品質、イベントなしのDPR変更でlistenerが動かない問題が別に報告された。これらの修正はこの `ef6319fd…` 固定入力より後。上記中心/hit検査だけではその残線と自動DPR再描画を閉じない。後続変更の検査は次節の新固定入力で行った。白筋・鼻口消失・瞳品質の最終実画面判定はVisual担当の範囲。

## 眼/DPR固定build f818と後続変更の限定再監査

固定 build の全10 templateと読み込んだsourceを `input-snapshot-final-build-recheck/` へ新規保存した。`audit-results-final-build-recheck.json` はcompile/snapshotだけの `checks=[]` であり、テスト成功数へ含めない。全57 sourceの現物SHA、catalog/全10hash JSON/配布JSとの一致は `final-geometry-comparison.json`。局所検査の前後入力変更は0。

| 最終描画対象 | SHA256 |
| --- | --- |
| build aggregate | `f818ac59c60b5cb75965f0d30bdac3afb9ed0249703895a2a1b520f37f8961d9` |
| source aggregate | `b37beeb957ba78140d6aa931b5a804b2c7bd5dfba989b853bad975380292d6cd` |
| catalog | `4324c116d82dc5c741eb306126fcdae45b824af5aae2736b6b63fe01c409e4b9` |
| magic template | `1b6826f1d83d161f87b9a204301c148ef74219f66cb377ed4c11f941e689e9b7` |
| authored-eye | `f8ab0ed7853436221714023fb156ab2906d7fb5d4fe03c4a36fe195df8396189` |
| ArtworkCanvas | `c2b99cb190de32ad90d54a5f9b3efdcc3c418477322bab38841e3035ff6b42a0` |

9テーマの非眼321領域は、前共有境界snapshotと exact/coverage/fillRule/bounds/blackInk/opaque のgeometryが完全一致した。眼の反射pathの変更を非眼不変とは混同しない。magicは42非眼領域のうちparent `r06` のexact/coverageとgeneralInkだけが変わり、opaque下地と2眼openingは不変。非変更321領域の270,339点検査を新規反復したとは数えない。

| 新固定入力での独立検査 | 限定判定・証拠 |
| --- | --- |
| magicのboundary/coverage/exact hit | PASS。42領域、34,686点、blackInk 10,140点、小部位5、眼中心2。coverage欠け・bare外部漏れ・誤hit・穴の不一致0。`shared-boundary-results-final-build-recheck.json` |
| r15旧上眼縁の明示回収 | PASS。source parent `r06` contour5、bounds `[833,602,904,667]` を対象とし、新opening外で旧ink深部の353点を独立探索。新inkの残留0、全点が新parent exact/coverage内かつdirect hit `r06`。眼中心だけの確認とは別。`final-eye-change-results.json` |
| 新眼rendererの反復/白復帰 | PASS。全20眼×5代表色=100ケースで、固定iris素材を使う現物 `drawAuthoredEye` を実行。反復pixel完全一致、着色→blankを同じCanvasへ描き直した結果はfresh blankと完全一致、入力変更0。全engine/UI消去や色の自然さをこの直接描画試験から保証しない。`final-eye-change-results.json` |
| 旧v2/legacyの不変対象 | PASS（同一性）。frozen v2 engine/texture、legacy engine、旧配信bundleは上記開始SHAのまま。dispatcher/canvas/cache/geometry/legacy texture/sceneの6補助moduleも不変。`painting.ts` 全体変更はv3専用validatorで、v2へ到達する共通statementはTypeScript AST比較で不変。`legacy-validation-branch-evidence.json` |
| 保存型の最終snapshot | PASS。開始時原本とf818 snapshotの `Project` / `RegionPaint` / `RegionPaints` をTypeScript ASTで比較し同一。Regionのgeometry追加を保存schema追加と混同しない。SQLやmigrationの履歴はこの型比較の範囲外。`schema-final-snapshot-evidence.json` |

旧80状態の画素一致は、以前に実際に行った v2 40状態＋legacy 40状態の結果である。最新80状態の新runとは呼ばない。変更されたv3眼・v3geometryに適用しない。旧の関係source SHAと旧配信oracleが不変であるため、その旧描画範囲に限って履歴として有効と判断した。

### 実装担当の最終rawの読み取り

`final-root-evidence-classification.json` にraw元SHAを記録し、`root-evidence-final-snapshot/` にそのままコピーした。`final-verification-start.json` の開始identityは上記f818 build/sourceと一致し、Unit開始は固定時刻より後。独立担当がUnit/ブラウザ/性能を再実行した結果ではない。

| f818提供raw | 読み取った結果・適用範囲 |
| --- | --- |
| `unit-vector-final.json` | 387/387成功、失敗/保留0。最終387件だけを用い、旧380件を補充しない |
| `browser-final-results.json` | Chromium mobile全14件passed、retry0、unexpected/flaky0。7ownerのper-eye/highlight→eye/PNG、group/region/erase/reload、旧作品copy3件、DPR、90-viewを含む |
| `storybook-upgrade.spec.ts` の3件 | 旧v1姫、旧v1車、旧v2車の改善ボタン→新IDの別作品copy。旧描画/元Project/再読込を保持し、車の廃止face色を除外。最新のVE-01再test成功 |
| `density-final-results.json` | 1件passed/retry0。CDPでDPR3→2→1を変え、CSS size一定でbacking Canvasが再計算され、Project不変。変更前診断は各3/2/1でresolution/resizeイベント0かつCanvas `[320,400]` のまま。`ArtworkCanvas.tsx:149` の250ms ratio比較fallbackと `:157` のinterval cleanupを静的確認 |
| `browser/viewport-matrix.json` とPNG | 10×zoom1/2/4×DPR1/2/3の90条件に重複/欠損0。全てbacking dimensions=`round(CSS×DPR)`、CSS transformなし。90PNGとfractional pan30PNGの現物SHAを独立記録。`viewport-browser-final-evidence.json`。画面の主観的AA品質の判定ではない。現testsourceが追加出力するreturn-fit PNGはこのf818 rawでは未提供で、120PNGを150へ水増ししない |
| `performance.json` | 同f818 build/source・before/after不変・measurement script SHA一致・PASS。CPU4/DPR2、最大visible面積の姫スカート6領域と最大構成数robot14領域。3画材×12種類の初回色=各36 sample。firstCanvas p95は5.3ms / 8.8ms。2RAFはpaint opportunity proxyであり、物理端末の表示時間とは呼ばない |

### PWA修正後の最終配布との同一性

`latest-verification-start.json` のidentityを保存し、独立に配布全712ファイルの現物SHA/byte数とmanifest aggregate、記録source全57の現物SHAとsource aggregateを照合した。変更前f818と新buildの追加/削除0、不一致0。変更配布ファイルは `sw.js` 1個だけで、全描画JS/CSS/素材はbyte一致。source差分は `apps/web/src/sw.ts` と `packages/content-schema/src/asset-cache.ts` だけで、renderer/geometry/保存/型/ArtworkCanvasは不変。`latest-distribution-comparison.json`。

| PWA後続対象 | SHA256 |
| --- | --- |
| 最新build aggregate | `ebcb5e885bff48eb1c438a57c7907170a28de0309dbe0fd66bf081630a8c5e18` |
| 最新source aggregate | `0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276` |
| 旧→新sw.js | `7a64a28d47ff12a489f7f281bd8950fbd4d7ff52a717f8405509cad41deb7a52` → `24fd0420c0fb97d417a998b9310d5f93841cb4740fd629afc0a2868fab959409` |

この照合はf818の描画/互換性証拠をbyte不変の描画範囲へ結び付ける。変更したSWのhash URL cache/offline挙動は別の最新PWA検査が必要で、f818のPASSで埋めない。公開buildのapproval guardや人間採用を解除した証拠でもない。

## 車の固定白detail修正と最終候補 f3c

Visual担当のVV-07 P2を受け、車だけinkの微小closeを0にし、他9テーマの処理は維持した。55f1段階の車28領域で、新規21,736点、blackInk 6,134点、小部位3のboundary/coverage/hitを独立検査し不一致0。`shared-boundary-results-final-vehicle-recheck.json`。9作品のJSON byte不変、runtimeと旧描画sourceの不変、配布716現物一致は `vehicle-geometry-comparison-55f1.json`。この局所PASS後も実画面の2白い四角は残り、VV-07の品質FAILは閉じなかった。

`vehicle-gap-results-55f1.json` の36条件は、元pathから2/4/8倍、alpha64/128/192、問題cropと10世界px余白を独立描画した診断。inkの18条件は新閉白component0。opaque側14条件は原source白領域が外部へつながるという厳密oracleでFAILを保存した。しかし元のexact outsideを必ず「外部背景」と解釈する根拠はなく、opaqueの閉component中央は新r10 exact/coverage=trueで実際のbody色に塗れていた。このraw FAILを塗り欠け・可視白点の根拠へ転用しない。

55f1の実pixel `(1305,983)` / `(1304,992)` はr10 exact/coverage=true・hit r10でも `[255,255,255,255]`。新templateに残っていた固定 `#ffffff` detailのbounds `[1305,983,1307,987]` / `[1304,990,1306,994]` と一致した。同一geometryのままこの2detailだけを監査用メモリ上で除くと `[181,18,20,255]` / `[180,18,21,255]` に戻り、3control点は不変。`vehicle-white-detail-diagnostic-55f1.json`。このcounterfactualは原因確認用であり、新候補の採用証拠ではない。sourceのcropped-path描画で出た26 alpha差も、同じ全source rasterからcropすると差0で、原sourceの変更ではなかった。

最終f3cは車v3だけこの2source detailをSHA guard付きで除く。誤って外部背景と扱った `preserveExteriorBox` は撤去し、ink close0/opaque close1を保つ。旧原採用・配信済みv2/legacyのwhite detailは変更しない。現物を `input-snapshot-vehicle-details-recheck/` に保存した。compileだけの `audit-results-vehicle-details-recheck.json` はchecks=[]で、以下の実pixel検査とは区別する。

| 最終候補の固定対象 | SHA256 |
| --- | --- |
| build aggregate | `f3c10731370481c0235c267e41aed0b1ff4b3591ec8338544289c6d8eb3ffb29` |
| runtime source aggregate（ebcbと同一） | `0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276` |
| catalog | `c1aac635688183e80a1742c082106e763b9c4e65734370092941ca64b22959ec` |
| vehicle template | `42c8381e9e693a0d0a45f41e1d9e2f10c08fb3c81463fd5d24a590778e57325a` |
| 原vehicle source-ink（不変） | `5cf1b9eacc6e4be1658dc135316323125413e5d7af586cb97710eecc285523e3` |

`vehicle-geometry-comparison.json` は最終配布全718現物のSHA/byte数とaggregate、57sourceの現物SHAとaggregateを独立照合し、不一致0。9templateはf818とbyte完全一致。車28領域のID/name/group/upgrade対応・画材素材は保持し、55f1からexact/coverage/bounds/blackInkは完全不変。opaqueの変更と明示2white detail除去をその不変範囲へ紛れ込ませない。旧bundle/frozen v2/legacyの開始SHAも不変。

新固定入力で赤/青/緑smooth×r10のみ/全28同色=6状態を実snapshot painterへ通した。2具体点とcontrol点はexact/coverage=true・direct hit r10で白に戻らず、2白rectの16画素位置に固定白画素0。正しい3tire glintsはpathが完全保持され、代表点の描画pixelも55f1と一致した。元normalized sourceはbyte不変で、退役2source pathのSHA `4908e5fd…` / `8c18d7d2…` と実bboxを独立確認した。`vehicle-white-details-results.json`。**VV-07の固定白detail原因について独立局所PASS**。車境界21,736点は55f1の不変geometryの履歴で、f3cで新しく同じ21,736点を走らせたとは数えない。

### 最新UI/Unit rawの対応

`accepted-root-evidence-classification.json` は `vector-accepted-start.json` と独立固定identityのSHA一致を確認し、rawを `root-evidence-accepted-snapshot/` へ保存した。先行f818のcopy結果を新候補copy成功へ転用せず、新実行のrawを確認した。

| f3c実装担当raw | 独立読み取り結果・限界 |
| --- | --- |
| `unit-vector-accepted-candidate.json` | 全390/390成功、失敗/保留0、固定identityの後に開始 |
| `browser-accepted-candidate-results.json` | Chromium mobile15/15、skip/unexpected/flaky0、全retry0。7眼所有templateのper-eye/highlight/実PNG、旧姫/旧v1車/旧v2車の新copy3件、group/region/erase/reload/DPRを含む |
| viewport | 新90条件のbacking寸法/倍率/CSS transformに不一致0。matrix90＋fractional pan30＋return-fit30の**新150PNG現物SHA**を記録。先行f818の未提供return-fitを補ったことにはしない |
| face/lamp | 姫・男の子・恐竜・車×zoom2/4、DPR3の8条件/8PNG。報告backing寸法とPNG寸法一致。主観的な目の造形/AAや全pageのP2判定はVisual担当の範囲 |
| dynamic DPR | 同run3条件でbefore/after CSS不変、Canvas/PNG寸法=`round(CSS×DPR)`、Project不変。250ms fallback/cleanupのruntimeはf818と不変 |

`accepted-supplementary-evidence.json` は追加rawを読み取り、同じsnapshotへ保存した。PWAが変わった段階や新候補の未提供結果を、先行描画PASSで埋めない。

| 別scopeの最新提供raw | 読み取り結果・限界 |
| --- | --- |
| `pwa-update.json` / `pwa/build-identity.json` | PASS、エラー0、build前後はf3cで一致。本物の2tab/SW更新UI、pending IDB commit/他tab guard、editor/zoom/paint保持、更新後offline reloadを確認した提供結果。production SWの振る舞いを使い、更新を発生させる版commentだけを加えた。遅延は実service flush完了境界で、live cloud障害の試験ではない |
| `cloud-source-e2e-accepted/results.json` / `run-identity.json` | 3engineの非demo source preview9/9 passed/retry0、SDK＋HTTP＋SQLのfixture経路。独自source hash `299ca9bd…` / harness `c569b8fa…` が前後一致。`productionBuildVerified:false` を保持し、demo配布f3cの本番認証/同期または非demo本番build成功へ読み替えない |
| `browser-layout-accepted-results.json` | Desktop/narrow8/8 passed/retry0。初期desktop3列要件は未完了のままで、成功した別responsive checkへ置き換えない |
| 最新f3c `performance.json` | 全重い検査後の単独採証。固定build/source/harness/script一致、PASS、CPU4/DPR2・3画材×未使用12色×2対象=72 raw。最大面積の姫skirt6領域 firstCanvas p95 7.0ms / max10.2、最大所属数robot14領域 p95 13.3ms / max23.0。画材別の最大p95はrobot crayon23.0ms。lastCanvasの最大p95は18.2ms、2RAFの最大p95は31.5ms。姫2RAF max119.4msも保持し、物理present/60fps合格へ読み替えない |

非demo本番buildの人間素材approval gateは、この局所監査とsource previewの成功だけで満たしたとは判断しない。

`accepted-performance-evidence.json` は提供72 sampleから3指標と画材別統計を独立再計算し、reported statsと完全一致を確認した。146groupのrankingで対象が最大面積/最大所属数であること、各画材12異なる色、36 sample×2、エラー0、f3cの配布/source/harness一覧とscript SHAの一致を確認した。監査担当は性能測定を起動していない。旧f818性能は `root-evidence-final-snapshot/performance.json` に保持し、新f3c rawは `root-evidence-accepted-snapshot/performance.json` と分離した。

## 各変更段階の検査履歴

| 対象 | 判定 | 新しく実行した内容・限界 |
| --- | --- | --- |
| 原採用素材と旧v2 public bytes | PASS | 原採用10原画の承認 SHA、開始時 catalog が指す旧v2 JSON/SVG20点の URL SHA、旧v2 ID の非hash JSON を確認。30現物の保持。新採用の承認ではない |
| 配信済み旧v2 renderer | PASS | 全10×未着色/smooth/crayon/pencil=40状態、400px snapshot と通常/2.35倍小数 pan の画素が、旧 bundle `Q` と現在 frozen v2 で完全一致 |
| 配信済み legacy renderer | PASS | 全10×同4状態=40 snapshot が旧 bundle `W` と完全一致。`audit-results-legacy-recheck.json` は前後入力変更0。旧v2との混同なし |
| v3 exact hit | PASS（revision2） | 正確な制作 path の独立 oracle と32,898点を比較。coverage-only 1,899点も hit が拡張面を利用しないことを確認。新 geometry は別再検査が必要 |
| タイル/倍率/DPR/cache | PASS（revision2、限定） | 全10×倍率1/1.375/2.35/4/1復帰×DPR1/3/2/1=200状態。小数 pan、DPR切替、復帰後 snapshot 不変、32MiB上限、タイル境界の追加誤差なし。native raster と direct raster の平均差最大5.49なので画素同一とは呼ばない。実画面/端末/性能 PASS ではない |
| smoothの白い上書き | PASS（revision2、限定） | 全10の exact 非eye内側を4世界px間隔で検査、意図した白 detail/目/ink を除き白画素0。塗り面に含まれない目周囲の白片はこの検査の外で、別担当のP1を解消扱いにしない |
| coverageの構造的漏れ/目中心 | PASS（明示fillRule修正版、限定） | 以前の漏れ124点はすべて実coverage/exact/ink外。王冠はblankとの画素一致。363非eye領域の追加47,709点探索で新候補0。20眼の親領域塗り前後の中心画素はすべて完全一致。全画素/全倍率の白筋・主観的AA品質のPASSではない |
| 共有境界candidate V02 | PASS（`ef6319fd…`、限定） | 新規270,339点と20眼中心、小部位45。3 native境界包含観測は同一Bezier・0.0002世界px未満と独立診断。旧47,709点は転用なし。後続変更は最終固定build節で確認 |
| 共通 PNG/thumb | PASS（revision2、限定） | 姫pencilの PNG 2048×2560 が同じ snapshot painter の全画素と一致。thumb320×400。PNG/thumb/画面は同じ base/paint/details/eye/scene 関数を使う。WebPはlossy、全作品/scene/browser は別検査 |
| 旧/旧v2→別作品copy | PASS（局所保存） | 旧10＋旧v2 10=20入力の新ID/v3 metadata/draft化、全 mapped paint、custom metadata と原Project完全保持、旧thumb非流用を確認 |
| 車の削除色 | PASS（局所保存） | `r24/r25/r27/r28/r32` の全対応除外。元に5種類の専用 sentinel 色を入れ、新copyの窓/車体等のどこにも出ないことを旧・旧v2双方で確認 |
| 500/quota原作保持 | PASS（局所保存） | 500件境界、new add の実 `QuotaExceededError`、add成功後のtransaction abortの3ケース。元Project/全既存row/原thumbnailを完全保持。実ブラウザ容量・クラウド quota は未検証 |
| 保存schema | PASS（型定義比較）、DB履歴は限定 | 開始snapshotと現在の `Project` / `RegionPaint` / `RegionPaints` 定義が空白除去後完全一致。schemaVersion=1、IDB版3。migrationは20261006の既存3点を観測。開始時migration一覧がないため「migration追加なし」の完全な履歴証明とは呼ばない |

詳細・生結果：`audit-results-revision2.json`、`audit-results-legacy-recheck.json`、`viewport-comparisons-revision2.json`、`schema-evidence.json`。

## 所見

### VE-01 — P1 — 旧v2の改善コピー導線が隠れる

- 初回判定：FAIL。`apps/web/src/pages/Gallery.tsx` の旧条件 `!template.paintingProfile` は profile.version=2 の保存作品を除外する。`upgrade-index` と `upgradeSources` に20入力の対応があっても、子どもが旧v2から新v3 copyへ進めない。
- 再現：旧v2 IDの完成作品を開く。「もういちどぬる」は出るが「改善版をつくる」は出ない。
- 影響：V10/I17 の旧v2→別作品改善版の経路を利用できない。原作品を壊す問題ではない。
- 必須修正：対応元 legacy とv2へ改善導線を表示し、v3を対象外にする。旧・旧v2の UI copy 後に原作を再読込して保持を確認する。
- 修正状態：実装担当が `version < 3` へ変更済み。revision4では `Gallery.tsx:483` で静的確認した。revision4の実装担当UI証拠 `test-results/vector-improvement/revision4-root/browser-results.json` を読み取り、旧v1・旧v2車の2件が chromium-mobile / passed / retry0 と確認した。raw SHA `0a6bb64c10410c0c6ac62e22121902129674fb50eb7294b71ecec63b03c50e44`。分類は `gallery-ui-revision4-evidence.json`。この2件を最新へ流用せず、f818の3件、さらにf3cの `browser-accepted-candidate-results.json` で姫・旧v1車・旧v2車の新copy3件を確認した。**VE-01は最終候補f3cで修正再test成功**。独立20ケースのAPI保存履歴と実装担当UI結果を区別する。

### VE-02 — P1 — coverage が黒線の外に色を出す

- 初回判定：FAIL。revision2 `scripts/build-vector-content.mjs` の `exact path ∪ 5.5px stroke` は塗り面を全周2.75世界px拡張するが、黒線または元の塗り面へ制限していない。
- 再現：`node test-results/vector-engine-audit/probe-coverage-holes.mjs`。保持したrevision2入力、現在の production renderer、単一領域 smooth `#CC1111`、snapshot1600。probeの探索だけは PathOp の EvenOdd を使い、最終根拠は production nonzero path と実画素。
- 具体例：姫 `r01` 王冠 `(759.5,192.5)` は exactHit=null、exactPath=false、blackInk=false、実画素 `[204,17,17,255]`。花 `r01` `(1313.5,204.5)` は `[138,12,12,255]`。全10の非eye363領域で各1 sparse候補を再現した。候補数を漏れの全画素数へ読み替えない。
- 根拠：`coverage-hole-probes-revision2.json`、`revision2-princess-coverage-leak.png`、ほか10枚のPNG。型注釈 `Region.coveragePath` の「opaque ink のみ」とV02にも不一致。
- 影響：背景または未着色の隣接部へ選択色が出る。高倍率でも構造的な色縁が残る。
- 必須修正：拡張面を `(exactRegion ∪ fittedInk)` へ交差制限し、制作pathの実際のfillRuleを描画時にも保持する。exact hit は変更しない。
- 関連：PathOp結果は EvenOdd。`toSVGString()` のみで穴の同方向contourを既定nonzeroへ渡すと穴が埋まる。`path-op-fillrule-evidence.json` の単純矩形は `asWinding()` で中心がfalseになったが、以下の実際の複雑pathでは変換後にも nonzero=true が残る。単純矩形の成功を全pathの保証へ読み替えない。
- intersection + asWinding 修正後の再判定：**FAIL**。`node test-results/vector-engine-audit/probe-coverage-holes.mjs apps/web/public geometry-recheck`。同じoracleで10作品の124領域に1点ずつ visible leak を再現した。王冠の初回座標は解消したが、同じ王冠 `r01` の `(751.5,244.5)` は exactHit=null / exact=false / ink=false / 実画素 `[161,14,14,255]`。根拠は `coverage-hole-probes-geometry-recheck.json` と10枚の対応PNG。rendererは最初の固定transpile入力を利用し、この時点のgeometryの SHA は結果に保存した。
- 目中心の bounded 診断：20眼すべてで parent exact=false / general blackInk=false / eye opening=true。姫うさぎ右眼 `r44` / parent `r38` の `(1174.705484353183,1382.0923439875617)` だけ coverage nonzero=true / evenodd=false。同じcoverageを再計算して `.asWinding()` しても nonzero=true が残った。黒線の残留ではなく穴の塗り規則の不一致である。`eye-coverage-diagnostic.json` に全20と単純図形を保存。
- fillRuleの bounded 診断：上記124 witnessすべて coverage nonzero=true / evenodd=false、exact=false / ink=false。同じgeometry SHAの一致を確認してから全点を再評価した。`coverage-fill-rule-diagnostic.json`。明示evenoddは全既存witnessを除外するが、このmembership検査だけで全領域の描画PASSとは呼ばない。
- 追加修正状態：実装担当が `scripts/build-vector-content.mjs:85` の `coverageFillRule:'evenodd'` と `packages/coloring-engine/src/storybook-texture.ts:92` の明示clipを追加済み。frozen v2 textureは変更なし。
- 明示fillRule段階の局所再判定：**PASS（明示fillRule修正版）**。新rendererを再transpileし、上記catalog SHAを固定。旧124点すべてが明示evenodd coverage=false / exact=false / ink=false。王冠 `(751.5,244.5)` のblank/painted画素はどちらも `[202,202,202,255]`。新探索は363非eye領域・47,709点で実production coverageかつexact/ink外の候補0。26領域に極小/退化boolean差分が残るため、疎な探索の候補0を全画素の数学的保証にはしない。
- 20眼centerも全て parent coverage=false / exact=false / generalInk=false。親顔だけをsmoothで塗る前後の中心画素が20/20完全一致し、うさぎr44の穴も除外された。`coverage-witnesses-fillrule-recheck.json`、`coverage-hole-probes-fillrule-recheck.json`。
- 境界AA：124点中88点のpixelはblankと異なる。構造coverage外でも画素の一部分をinkが覆うため、全境界画素の完全一致を要求しない。赤比>2の残り1点、ショベルr21 `(1131.5,697.5)` の64×64 subpixelを確認。4,096点のうちcoverage=1,971点、ink=1,971点、exact=0、coverageかつexact/ink外=0。許容した黒線の部分被覆と一致し、別の構造漏れは再現しない。`boundary-subpixel-diagnostic.json`。
- 最終局所再判定：**PASS（f818描画、ebcb描画配布不変）**。共有境界の新規270,339点を取得し、後続変更では321非眼領域のgeometry不変とmagic34,686点を別に検査した。旧中心-onlyの検査をr15上眼縁の証拠へ移さず353点を追加確認。DPR/途中zoom/pan/PNGの実装担当rawは最終固定build節。smooth白筋・回収した顔mask・実画面AA/瞳品質の最終判断はVisual担当の証拠に依存し、この局所判定からは保証しない。
- f3cへの結び付け：9作品の全template byte不変。車は55f1の新21,736点検査を経たexact/coverage/blackInkの不変を確認し、固定白detailの原因はVE-03の新pixelで別検査した。元の47,709点や先行browser copyをf3c新実行数へ合算しない。

### VE-03 / VV-07 — P2 — 車の塗った隙間へ固定白detailが重なる

- 初回局所判定：FAIL（55f1）。`scripts/build-vector-content.mjs:103` が原compilerの白detailをv3へ持ち込み、r10 coverage内の2白四角を塗りの後に描いた。原source exact outsideだけで外部背景と決めるのは不十分だった。
- 再現：55f1の車全bodyをsmooth同色にし、world `(1305,983)` / `(1304,992)` を確認する。r10 hit/coverageは正常なのに、2具体pixelがwhiteのまま。
- 影響：狭い2黒線の間でbody色が続かず、白い四角が高倍率で見える。旧作品への破壊はない。
- 必須修正：未採用v3だけレビューした2白detailを正確なsource path guardで除き、3tire glintsと旧原作を保持する。墨/opaqueの位相診断だけで可視白点が解消したと判断しない。
- 修正：`tools/asset-pipeline/vector-detail-retirements.mjs:11` のsource ID/白fill/2path SHA guardをbuilderで適用。最終f3cの新pixel6状態/白rect16位置、残り3glints/原source byte/9枚/runtime/旧SHAを独立確認し、**限定PASS**。最終実画面品質の総合判定はVisual担当の証拠に依存する。

## 監査ハーネスの失敗と排除

最初の起動では「開始snapshotにtemplates実体がある」と誤認し、旧catalogが指すimmutable hash URLの検査へ修正した。同じ起動で旧bundleのUI末尾呼出を取り除き不足stubを解消した。次のrunで legacy oracle のCanvas外部定数不足が出たが、legacyのみ再実行し40ケースが成功した。これらは本体のFAILではない。

最終配布照合はidentity envelopeの `identity` を `build` と誤読した起動失敗を修正後、全712/57現物の再照合を成功させた。viewport出力の分類では現testsourceの追加return-fit PNGをf818にもあると仮定してENOENTになり、実際に提供された90＋30PNGだけへ範囲を修正した。これらを製品FAILや未提供の画像証拠へ読み替えない。

`coverage-extra-probes.json` は exploratory boolean 差分に既定nonzero判定を使った不正診断で、**INVALID / 使用不可**と明記した。数値を製品所見・PASS/FAILへ利用しない。後の `probe-coverage-holes.mjs` は正しいevenodd探索と、現物のnonzero renderer画素を別に確認してVE-02を再現した。

## 未確認範囲

実認証/実同期・実端末、5眼色の自然さ、画材の主観的品質、Visual baseline更新・人間採用、本番build approvalは未判定。この監査の局所PASS、実装担当rawの成功、配布同一性だけで全体 READYにはしない。f3c新150画像を先行f818の未提供return-fitへ読み替えず、開始時migration一覧も補完・推測しない。
