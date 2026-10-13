# I34 候補61：独立engine監査原本

判定：**限定PASS — 指定engine実装の静的監査、現行build/source・producer/public結合・保存schemaの決定論的照合、保存済みunit生結果の確認範囲。** この範囲で再現根拠のある新規ブロッカーは見つからなかった。候補61全体のREADY、美術品質、実Chrome、全操作・全状態、物理端末、人間採用、P05性能の合格ではない。58/59のFAIL原本および60のFAIL扱いを変更しない。

## 所有・固定対象

- 作業ルート：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。開始2026-10-13 00:02:06 JST、終了照合2026-10-13 00:14:10 JST。15分以内の限定監査。
- 単独担当・再委任なし・主モデル/effort変更なし。書込みは本新規報告のみ。production、tests、素材、証拠画像、旧報告は編集していない。他担当の変更を戻していない。外部サービス/API/ネット検索、commit/deploy、性能測定なし。P05はSTOPのまま。
- AGENTS.mdとharness-orchestratorの指示を確認し、指定ファイルと元証拠を必要な範囲だけ読んだ。親の自己判断・過去PASSを今回の判定根拠にしていない。
- 固定identity：`test-results/smooth-home-i34/revision-61/identity-before.json`。
- build SHA-256：`d080ec40ba8de2c9daa5d0a6da92996ad44bbba598e7ac2a0737403b843b165d`。
- runtime/source SHA-256：`74c1b959e505c5911eb697bfe8dbc543669d3223e59ebb7bb002170aaaf4dc1c`。
- independent開始inventory：2026-10-12T15:09:14.429Z。終了inventory：2026-10-12T15:13:55.226Z。build1296ファイル・runtime67ファイルをローカルで再列挙し、bytes/SHA-256・aggregateを両回とも固定identityと照合した。変更/欠落/追加は0、inspectionHarnessのhash差分も0。
- 本担当はserved URLを再fetchしていない。ここで検証したのはローカルdist-demoとsourceの同一性である。

## 現在版の確認

1. **眼・未着色瞳：限定PASS。** `authored-eye.ts`の輪郭生成、`master-eye.ts`の未着色/着色分岐、`storybook-engine.ts:127`付近の呼出しを読んだ。surfaceLightを持つ作品で親の肌だけsmooth・眼未塗りの場合は`drawUnpaintedSurfaceEye`へ進み、blankInkPathの初期輪郭内を白に戻す。完成眼の大きなopening全体を肌側まで白く塗る処理から分離されている。眼のpaintを自動追加しない。着色眼は選択色から虹彩/瞳/反射を描き、polishedの条件は当該眼のsmooth。顔smoothだけを理由に眼を着色しない。回帰testは姫の旧白帯座標(650,525)/(620,558)/(788,561)/(759,587)、旧虹彩混入(799,596)/(799,600)/(801,600)、消去で同一blankへ戻ることを確認している。これは美術としての目の自然さの合格ではない。

2. **顔の保護穴・鼻例外：限定PASS。** `scripts/chromatic-finish.mjs:23–46`では、人間のface domainへその顔ownerのprotected holeを追加し、旧瞼の孤立肌も陰影伝播の対象にする。一方、protected画素は通常のRGB seedから除外する。`isNose`はowner一致・nose ellipse内に加え、現行authored eyeOpeningのalphaがないことを要求する。鼻の低輝度例外から眼内の旧虹彩を取り込む経路を切っている。producer側は旧眼/眉の保護maskを生成して同関数へ渡している。実データ側の旧暗色混入回帰test成功も確認した。新しいdomainを絵全体の美術PASSと読み替えていない。

3. **smoothとdryの分岐：限定PASS。** `smooth-finish.ts:45–79`はsmoothだけをsurface paint/lightへ通し、dry/未塗り隣接部の元線を保持する。`storybook-texture.ts:100–133`ではcrayonの圧力/紙texture後にreturnし、形状陰影・反射へ進まない。pencilはsmoothLightを使用せず既存のpencil分岐を通る。自動眼finishは画材表現と別の既存処理である。保存unitにはcrayon/pencilでsmooth mapを替えても画像不変、skinだけのmedia差替えでsmoothだけ再描画する回帰が含まれる。`setMediumImages`はskin/surfaceも比較してmediaRevision/cacheを更新する。

4. **サムネイル失効：限定PASS。** `apps/web/src/artwork-source.ts:21–34`の新token `-smooth-surface-v2`はsurfaceLightを持つtemplateかつ少なくとも1領域がsmoothのときだけ加わる。mixed作品も対象になり、全面blank・crayonのみ・pencilのみ・surfaceLightのない旧作品には加わらない。Project/RegionPaintを書き換えるコードはない。`thumbnail-assets.test.ts:33–62`は全catalogでこれらのキー条件、offlineの古いsmooth thumbnail拒否と作品保持を確認する。キー失効自体を全端末同期の合格にはしていない。

5. **legacy・保存schema・タイル：限定PASS／画面検証は別。** `renderer.ts:10–18`はv1 LegacyEngine、v2 StorybookEngineV2、v3/4 StorybookEngineへ既存のversion dispatchを保つ。独立AST比較でProjectとRegionPaintは元I34前の定義と同一だった。タイルはI34 revision-1 beforeソースと同じTILE=512/ BLEED=2・tile引数方式を保持する。現在のcache keyにはscale/座標/mediaRevision/phase/関連paint/feature色が入り、tile interiorだけを合成し、snapshotは直接描画する。surface専用のclip/phase分岐があるため、タイル全処理が旧版とbyte同一とは主張しない。`canvas.ts:27–30`のwillReadFrequentlyはsurfaceの中間canvasを作るfactoryで指定され、注入factory/旧rendererの一律変更にはなっていない。CPU/GPU効果・速度は測定していない。

6. **producer結合・private非配信：独立PASS。** 保存scope-checkの文章を採用するだけでなく、読み取り専用の別実行で以下を再計算した（2026-10-12T15:11:48.679Z）：旧public素材963件のhash一致、現行public/dist-demoの53結合一致、全10 templateのcontent hash・private master hash・smooth map hash一致、private原画/registered計20件のhash保持とbuild内同一hash非存在。issues=[]。公開template文字列にoriginals/finished-v1/registered.png参照はない。producerはprivate RGBをローカルに読み、相対RGB light/skin/surface atlasを別hash URLへ公開する。原画をそのままpublicへcopyする処理は確認していない。private生RGB画像の公開/添付は行っていない。

## 生結果と実行の区別

本担当はfull unitや対象suiteを再実行していない。現在の固定コード/producer/test hashと、以下の候補61保存JSONを読み合わせた。単なる親の報告から成功数を採用していない。

| 生結果 | 観測した結果 |
| --- | --- |
| full-unit.json | 初回459件中458成功・1失敗・0skip、success=false。失敗はtests/cloud-e2e/fixture.test.tsのPKCE/署名token/SQL compare-and-swap前提testでTypeError: fetch failed。 |
| 同初回内の指定3suite | smooth-finish44、vector-revision7、thumbnail-assets11、計62件すべてstatus=passed。 |
| cloud-unit-retry.json | 失敗したfixtureの1件だけを別実行し1/1成功。require_escalatedでの再実行であることは親の実行経緯として受領。JSON自体にはsandbox設定の証明はない。 |
| regression-after.json | 44登録のうち実行1成功・43skip。44件の全成功実行ではない。 |

**初回full unitの失敗原本は残る。初回とretryを結合して「単一459/459成功」とは書かない。** fetch失敗の環境原因は本担当が再現/独立証明したものではなく、再実行成功と失敗メッセージが現在の証拠である。

build.logには生成済みbuildの出力、lint.log/typecheck-after-harness.logには該当コマンドが記録され、エラー出力は見当たらなかった。ただし本担当はこれらを新規実行せず、ログ単体から終了コードを独立復元していない。現物bundleのidentityは上記の別計算で確認した。

## 残る範囲・非ブロッカー

- 指定engineコードで具体的に再現根拠を挙げられる新規不具合はなし。この報告に修正要求は追加しない。
- native.logでは全10テーマ各9状態と計100眼配色の記録を観測したが、90状態の全PNG/各assertionを本担当が独立再検証していない。review40/legacy40の比較成功は親から通知されたが、本報告の独立PASS根拠には足していない。
- Chrome26、9つの4×DPR2輪郭画像、全10美術/source、物理端末、全色/全操作、人間採用は今回未判定。今後の原本で別判定が必要。未到着の生結果を待ったり、以前のPASSで補ったりしていない。
- 58/59 FAIL原本は前後hash一致を確認した。60のFAIL扱いも撤回/上書きしていない。今回の限定engine PASSで旧目視FAILを変更しない。
- 新版の中間canvasによるメモリ/性能は今回測定していない。P05 STOPを維持した。

## 読み取り対象の開始・終了hash/bytes

最初の20件は2026-10-13T00:03:52.7935683+09:00、追加11件は00:09:16.3051063+09:00、追加renderer/check-scope/shared-typesは00:11:50.6777295+09:00に固定した。終了は2026-10-13T00:14:10.5678185+09:00。34/34でbytes/hash同一。表のhashは開始・終了共通（SHA-256）。build/runtime全体は上のinventoryで別途前後固定。行のパスは作業ルート相対。

| 読取対象 | bytes（前=後） | SHA-256（前=後） | 終了 |
| --- | ---: | --- | --- |
| packages/coloring-engine/src/authored-eye.ts | 5220 | ce291dbda73a5c4744d8541f52e69a1a1b6f217a748ee993d14b2b0f0b949404 | 同一 |
| packages/coloring-engine/src/master-eye.ts | 11543 | ab4218b2a2229b6526a5e9ed7af1c104fd319a9b9c89416d147ace1dd4be0313 | 同一 |
| packages/coloring-engine/src/storybook-engine.ts | 23757 | f8f01c95c251d1a1a3dfcc47739c7c102971d75be4bc687a124af32253e38c7e | 同一 |
| packages/coloring-engine/src/smooth-finish.ts | 8158 | 750da1c07b611f62f87cf307d2fe6a5ff10aec6969ed3f3928ef62c3944cfc31 | 同一 |
| packages/coloring-engine/src/canvas.ts | 5920 | fc587c7d85e27b5ab81b60236589591ee1aae5bc3d23a7106b38a775961d79e0 | 同一 |
| apps/web/src/artwork-source.ts | 1994 | 0004bd25508e3932539897ac14f52130354073a93e130746d563f15e0f02b3b7 | 同一 |
| scripts/chromatic-finish.mjs | 6803 | e72d0e8f484e812806304f1cec9325b698db62a217bb36f9288d68f5487baa6a | 同一 |
| scripts/build-smooth-finish-v2.mjs | 19188 | 6c7e115b290ae61fed3d2c3739d443f53806be8630b889c70916f9c60a340e66 | 同一 |
| tests/smooth-finish.test.ts | 28491 | ac49047086ca9b5e2c5478ec51b4884dfc38b79a38833c082f5a5d33c72729b3 | 同一 |
| tests/vector-revision.test.ts | 12392 | 3a8ca2015484cc1ef2fb7a5271fda8269904d83917848b66ddbe563b23a393d5 | 同一 |
| tests/thumbnail-assets.test.ts | 12027 | cb83fd0f5914e7cfebfa923643f9a8262d350b975ca2bf128a74c8289cf7825d | 同一 |
| content/smooth-finish-i34/authoring.json | 5464 | 7122f7c620de09a60a6f5213106773392e2dd4e29419cca5eba2140500f6e906 | 同一 |
| content/smooth-finish-i34/manifest.json | 196136 | 2b146f29247bfe20aa87b0a5cae1947a7bec76fc4a23d4b445b43e2e8eb5258d | 同一 |
| test-results/smooth-home-i34/revision-61/identity-before.json | 323511 | 86eefbd161783cd9a08435fc684a6c91d93686e8221d1133942a3bb96120c30b | 同一 |
| test-results/smooth-home-i34/revision-61/full-unit.json | 201964 | cb04063889af5306521d1bf62d36fe486cc9114b33fb8205c2648de8c1ce09c7 | 同一 |
| test-results/smooth-home-i34/revision-61/cloud-unit-retry.json | 1048 | 4df1a89aafbfe4b7e32d991f87ee3f90b9f82fb82e5dce028a65d3cac739f647 | 同一 |
| AGENTS.md | 3243 | 48765c3480352eb9a0ad696874dd192465cac5cfd0ff2d5025e3840fb170c1e7 | 同一 |
| docs/storybook-improvement.md | 111707 | 8c6357a81451e4d6d1aac3dfbbf187d4b0f6aeef051b0dc634fe98f6df46855a | 同一 |
| docs/testing.md | 19976 | 290e8d9f76e970e75e89ebf7aa80b889cbdfbab09ad116d3b6522e43dbb63055 | 同一 |
| package.json | 2135 | 37c982c2e5fd0c709cb058313e278ff021651757bf85b6de067a52afd6e45a17 | 同一 |
| packages/coloring-engine/src/storybook-texture.ts | 13871 | 14ccbc1386fc3d7bb821dbcf06ea3d968b8ffa439cfea7467067855d7ebfa925 | 同一 |
| packages/coloring-engine/src/engine.ts | 23485 | 27d96c7b006f69c8799987c4e30a461130787976c56106ef793acf980665d33f | 同一 |
| test-results/smooth-home-i34/revision-61/regression-after.json | 17724 | 6055cb7cd200c25465bb4a5a0b4ce3445488305a971481d8503f5d1e0096caf3 | 同一 |
| test-results/smooth-home-i34/revision-61/scope-check.json | 221096 | aca1b6d96fc7f1e7ab7a6a51412b953bb1fcbeb5c3545288eae10ef3fc4fa583 | 同一 |
| test-results/smooth-home-i34/revision-61/extra-evidence.json | 5776 | 68fd7ecaf0b5707a3242aa4a20c0fecef5ca27e7da241168ed25c4e21e8d55fb | 同一 |
| test-results/smooth-home-i34/revision-61/eyes-native-evidence.json | 6255 | 0e90158f69d9fc43a17ae4f7cb0d720d8b436f8e36092f2819192dacf81a4d25 | 同一 |
| test-results/smooth-home-i34/revision-61/build.log | 2681 | bf225d0a5988d1062f73296f2e0013404d862065381e213278c37dd205ce8382 | 同一 |
| test-results/smooth-home-i34/revision-61/lint.log | 65 | ac8942a006f958a19d8b4cdee7b14587c4375eb1e4f7e15dcc5f7f62fb9e385f | 同一 |
| test-results/smooth-home-i34/revision-61/typecheck-after-harness.log | 57 | f6896d0c193a37c9a5cf814a6658801e489b77396d733c945118791755e6dbe6 | 同一 |
| docs/audits/revision-58-source-visual-20261012.md | 36645 | 2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd | 同一 |
| docs/audits/revision-59-eyes-prototype-20261012.md | 15367 | 907163e7258a34b60158e4bcfa546a5fec88bf801bc758ebe6c63e67bf47ec95 | 同一 |
| packages/coloring-engine/src/renderer.ts | 2858 | 4c7c928b2844674b23a465f0e269b3b6a091f62991a0fdffb3cc4c5dea5d34a9 | 同一 |
| test-results/smooth-home-i34/revision-61/check-scope.mjs | 4132 | c1dca97d24f5fd54dfaa57c7dd06344989be18d16cacda73aa31b7899d47b637 | 同一 |
| packages/shared-types/src/index.ts | 7302 | 0a93fb60e012c1c3ff39ee87158fddd50fe148667d792205766730219a160fbe | 同一 |

