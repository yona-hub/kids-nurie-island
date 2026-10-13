# I34：ホーム同等の仕上げと輪郭の改善

2026-10-12 JST。指示元は「ホーム同等の最終品質と輪郭検査が完了するまで改善を繰り返してください」と、その後の「エラーが出ているため、再試行」。進行基準は[統合計画I34](storybook-improvement.md)。**品質の受入は未完了。改善を継続中。** P05性能停止、素材の人間採用、初期/I8の未完了、全体NOT READYを維持する。

## 実装と保全

- 全10枚のsmooth専用に、生成原画から相対光と部位別の輪郭色を制作。輪郭のalphaを一度だけ適用し、viewportの最終画素へ描く。元の線画、塗り領域、当たり判定、未着色の目は保持する。
- 姫は`gen-princess-bunny-v6-master-v4`、残る9枚は`-smooth-v3`。改善版を別作品として作り、旧ID・色・画材・元作品は残す。保存済み作品を自動で新版へ置き換えない。
- 旧眼線で孤立した肌の黒い残り、鼻/口の重複影、襟/関節/車体の白抜け、車輪の境界、動物の古い顔線を個別に修正。姫だけ制作したまつげを使い、男の子・動物・恐竜へ人間のまつげを追加しない。
- クレヨンには自動陰影を付けない。鉛筆と未着色を含め、変更前の描画との比較を別に残す。`Project`/`RegionPaint`の型は変更前とAST一致。DB migrationを追加しない。

## 候補19の検査履歴

候補19の固定buildは`1967c4d7b1dff3e9a805214e795be9cbe2b5db21543ce60343bdff8f597c0920`、sourceは`f0dc333b128b0c016c876bc1c57b5b68db2f0450a496f207e3279eed17c20658`。[前後identity](../test-results/smooth-home-i34/revision-19/identity-after.json)で同一性を照合済み。以下は候補19の結果であり、その後の修正を完了にする証拠ではない。

| 検査 | 候補19で確認した事実 | 生結果 |
| --- | --- | --- |
| 全体unit | 442/442成功 | [unit](../test-results/smooth-home-i34/revision-19/full-unit.json) |
| 実Chrome | PC全10、電話相当4、姫の部分/消去/倍率DPR、指摘画像の配色、旧作品コピー8件を含む24/24成功 | [Chrome](../test-results/smooth-home-i34/revision-19/browser/results.json) |
| Native拡大 | 全10×倍率1/2/4×DPR1/2/3＝90条件で輪郭外着色0。5色×20眼の白反射と暗瞳、tile/直接描画の列挙比較 | [native](../test-results/smooth-home-i34/revision-19/native-zoom/evidence.json) |
| 変更範囲 | 新10枚のblank/crayon/pencil30状態、旧IDの4画材状態40が変更前RGBAと一致 | [新10枚](../test-results/smooth-home-i34/revision-19/after/comparison.json)、[旧作品](../test-results/smooth-home-i34/revision-19/after/legacy-comparison.json) |
| 素材保全 | I33 r1の配信素材953ファイルを保持。変更はcatalog/upgrade-index。現在のtemplate/map/旧canonicalの40組がbuildと同一 | [scope](../test-results/smooth-home-i34/revision-19/scope-check.json) |
| 静的検査 | lint/型を含むdemo build成功。途中のunused変数3件は修正後buildで再検証 | [build](../test-results/smooth-home-i34/revision-19/build.log) |
| 独立目視 | **FAIL**。顎下の点/縞、人物眼の接地と立体感、イルカ/魚の口の段差が残る | [原文](audits/smooth-home-i34-revision-19-source-visual-20261012.md) |

## 失敗の履歴と候補20時点の作業

候補15・16・19の独立FAILを原文のまま`docs/audits/`に保持する。候補17の肌の黒い矩形と車輪の四角い継ぎ目、候補18の眉の影の残り、初期のalpha合成とtile差、白抜けの検査失敗も、それぞれのrevisionへ保存した。独立報告のFAILを実装担当がPASSへ変更しない。

候補20では、口の色が古い口線を通じて外側の顎へ広がる処理を見直し、未着色/クレヨン/鉛筆の口は元の黒線へ戻す。肌のサンプルから位置のずれた襟色を除き、人物眼の同心円状の縁と上まぶたの接地影を修正中。**候補20の技術・目視検査は未完了**。次に原寸/拡大の残件を確認し、独立目視と新しい固定buildの検証を行う。

物理端末、実外部同期、SW offlineの再試験、性能、全色×全装飾の画素一致、人間による素材採用は今回の成功範囲へ含めない。Visual基準は更新していない。

## 候補20〜23の追加記録

- 候補20は口の境界の色を改善したが、全ての口から元の線を除く処理が動物の口角を切断した。候補23の独立目視で新規退行として検出。候補19のFAILと混同せず、候補23の原文を別保存する。
- 候補21のRGB境界余白、候補22の肌用素材の分離だけでは顎の縞を解決しなかった。候補22の検査用fixtureの題材名誤り1件は修正し、候補23の対象検査41/41で再確認。
- 直接原因は、領域外の距離値65535を内側の深さとして扱い、輪郭の隙間で隣の色を陰影の有効サンプルに採ったこと。候補23で有効サンプルを実際の領域内へ制限。宇宙飛行士の顎に沿う画素差は候補19のp95=13/max=21から、候補23でp95=2/max=3へ改善した。この数値は当該局所の縞の回帰指標であり、ホーム同等の美術合格ではない。
- 肌の部位別素材は相対RGB光のみで、生成完成RGB原画を公開しない。姫/魔法/宇宙の3枚でそれぞれ4/6/1部位を分離し、口の未着色/クレヨン線と肌素材変更時のキャッシュ更新も現在版で検証。
- 候補23の独立目視はFAILとして確定。人物眼B03が残り、ウサギ/犬/亀の口線退行B06〜B08を検出。[原文](audits/smooth-home-i34-revision-23-source-visual-20261012.md)を不変で保持する。候補23のbuild成功やunitを最新修正の完了へ転記しない。

## 候補24〜26：口元の復帰と人物眼の再制作

- 候補24は完全な口腔だけを制作素材へ置換し、動物の舌だけの領域は元のマズル線を保持。全10枚の40状態と旧40状態を再描画し、線画/クレヨン/鉛筆と旧作品のRGBA不変を確認した。独立口元確認でB06/B07/B08は限定PASS。[原文](audits/smooth-home-i34-revision-24-mouth-visual-20261012.md)。人物眼と全体品質の合格には転用しない。
- 候補25は人物眼の並行する外輪を廃止し、丸い虹彩と眼球の陰影へ変更した。親の実レンダー目視で上側の白目/影が広すぎることを検出し、候補26で虹彩位置と影の濃度を調整中。候補25の新しい口元回帰テストは題材ID fixture誤り1件で失敗（37成功/1失敗）。題材の実themeIdで選ぶよう修正した。失敗JSONは上書きしない。
- 現在は候補26を制作/再検証中。独立source目視、固定build、native倍率/DPR、実Chrome、全体unit、型/lint、旧素材/保存schema保全の現在版証拠をそろえるまで品質完了にしない。

## 候補26〜28：独立FAILを受けた目の追加改善

- 候補26は固定build `779db504a44e91c95ffa436af192d0f637d84d1abe54ef21d1258c5c00560d88` / source `63a8a2f34492e75e054575f503989e73aa8cd388d596bf2ea3e6ed2a1cfea885`。前後identity一致、448Unit、lint/型を含むdemo build、native90条件の輪郭外0、5色×20眼の反射/瞳、他画材30状態と旧40状態のRGBA不変を確認した。しかし[独立source目視](audits/smooth-home-i34-revision-26-source-visual-20261012.md)はB03の二重弧・白目下縁・姫まつげ根元の欠けでFAIL。機械検査でこの美術FAILを閉じない。実Chromeの26検査は未実施。
- 候補27は外側の楕円全体のドロップシャドウを廃止し、虹彩を下縁へ寄せ、上瞼の曲線に沿う影へ変更。親の局所検査で、姫のまぶた/まつげの複合パスに逆向きの図形が重なり、37画素の穴ができる直接原因を確認した。[局所診断](../test-results/smooth-home-i34/revision-27/lash-overlap-diagnostic.json)。
- 候補28ではまぶたと制作済みまつげを図形の和集合で結合し、根元の穴を除去。上瞼の内外に沿う柔らかい接触影、眼球表面の弱い反射光を調整中。独立目視と現在版の検査は未完了。旧FAILと旧検査原本は維持する。

## 候補28の再試行と候補29

- 候補28は対象Unit46/46、lint、demo buildが成功。全10枚の40状態、線画/他画材30状態と旧40状態の比較を再生成した。固定identity、全体Unit、native、実Chromeの28検査は実施していない。
- 独立目視の既存担当は同じ設定で2回モデル混雑エラー。主モデル/effortを変えず、承認済みの独立監査枠内で別担当へ範囲を限定して再依頼した。初見では姫まつげ根元の接続は改善を確認したが、人物眼の上瞼・白目・虹彩が硬い別層に見える不足B03-1を指摘。最終報告は別原本として保存する。
- 候補29は人物ごとの生成原画に沿う反射位置を制作データへ追加。姫と宇宙飛行士は右上、魔法使いは左上。共通の反射位置を全員へ当てはめない。縦長の眼の開口に沿う虹彩投影、選択した肌色に沿う上瞼の接触影、虹彩の弱い繊維と光を調整中。未着色・クレヨン・鉛筆と旧作品は変更対象外。現在版の品質/輪郭の合格は未完了。

## 候補29〜30：白目とまぶたの接続

- 候補28の全10独立報告は[FAIL原本](audits/smooth-home-i34-revision-28-source-visual-20261012.md)として確定（SHA-256 `971561eb670a67a75f434f7b2f526125dad967da5387baf6dd5b50cc234ba591`）。人物眼B03-1だけが主要残件で、まつげ根元B03-2、顎B01/B02、口B04〜B08の改善は当該画像で再確認した。
- 候補29は対象46Unit、全体449Unit、lintが成功したが、demo buildは任意のparentRegionIdを直接添字にした型エラー2件で失敗。成功したUnitでbuild失敗を隠さない。独立初見でも魔法/宇宙の白目が細い明縁だけになり、虹彩が肌へ直接貼り付いて見えるB03が残った。29の画像・検査・実装ファイルを保存した。
- 候補30は任意parentRegionIdをガードし、白目を読める幅へ戻す。肌側の広い接触影と、上瞼から眼球へ落ちる影を修正中。新しいsource画像の独立目視、型/buildと影響検査を再実行するまで未完了。旧候補の成功を転用しない。

## 候補31〜32：中立色の枠から肌の接触影へ

- 候補30は太い元strokeがぼかしと一緒に残り、硬い灰色の弧を親の実表示で検出して不採用。候補31は上瞼のnative曲線へ連続Gaussianの接触影を制作し、太い元strokeを廃止した。型エラーは解消し、449Unit、lint/demo buildと前後identityは成功（build `f9a93edaa06e24123277c960f9555599359dc04d4e16d0382c1d0a82fa065452`、source `e65c8a9589104f6ede41158c50ff6b25ae746b1ff30fb756b3b8e958d86ba1e2`）。しかし独立初見は、中立色のぼかしと眼球側の灰青色帯が暖かい肌の面へつながらないB03でFAIL。技術成功で閉じない。
- 候補31のnative全体検査は魔法使いの黒い目の反射サンプルでFAIL。制作データで反射位置を変えたのに、検査は旧線画用反射位置を採っていた。失敗logと90描画画像を保持。候補32で反射/瞳の採証点を実際のsmooth制作データへ追従させる。白反射>240/暗瞳<48と輪郭外0、tile差の閾値は変更しない。
- 候補32は選択した肌色の彩度を保つ接触影へ変更し、白目への肌の反射を虹彩の前に描く。虹彩には肌色を混ぜず、専用の黒い接触影だけをclipする。現在の美術・輪郭・実画面検査は未完了。

## 候補32の確定結果と候補33の試作

- 候補32のbuildは`5ffd07645ed0cbea92f3298be2b50fed6f6bf940ac3e49e1c74b949334950aec`、sourceは`eda805867c572d40e172de809cec16bdb05cdfea981c640749243e1904c35794`。[検査後identity](../test-results/smooth-home-i34/revision-32/identity-after.json)で検査前と一致。449/449Unit、lint、型を含むdemo build、[実Chrome24/24](../test-results/smooth-home-i34/revision-32/browser/results.json)が成功した。ChromeはPC全10、電話相当4、姫の部分/消去と倍率DPR、指摘画像の魔法使い配色、旧作品コピー8件を含む。物理端末や実外部同期の成功とはしない。
- [native検査](../test-results/smooth-home-i34/revision-32/native-zoom/evidence.json)は全10×倍率1/2/4×DPR1/2/3の90条件で輪郭外着色0。5色×20眼の反射/暗瞳100件も成功。tile/直接描画の最大平均差0.006062658153033032、継ぎ目の最大平均差0.041985618186035724。閾値を緩めず、31の旧採証点FAILは保持した。
- [範囲検査](../test-results/smooth-home-i34/revision-32/scope-check.json)はI33 r1の**検査後**identityを基準に、名前を限定したbuild出力10件を除く965件を照合。旧素材963件は不変、catalog/upgrade-indexの2件だけ意図した変更、欠落/意図しない変更0。43配信bindingとProject/RegionPaint AST一致、private原本20件のhash未配布。以前の953件は別基準時点であり水増ししない。新線画/他画材30状態と旧40状態のRGBA不変を現在版で再確認した。
- しかし[候補32の独立目視](audits/smooth-home-i34-revision-32-source-visual-20261012.md)は**FAIL B03-1**（SHA-256 `adf662a1fee7f95fc1bbd5051e713d08740504ba81a11e4aa6aa35839aa2729d`）。灰色の輪は暖色へ改善したが、上瞼と虹彩の間の一定幅の淡い帯が二重枠に見える。技術成功を美術合格へ転用しない。
- 候補33は`revision-33/prototype/`へ**3人だけのインメモリ試作**を保存。公開素材/runtime/buildは32のまま。虹彩を上へ寄せ、縦方向を瞼の内側まで伸ばし、側面/下の白目を残す。33の独立評価は未完了で、実装/全10/現在buildの合格とは扱わない。試作の評価後に採用候補を制作し、新hashの必要検査を行う。P05停止・全体NOT READY・Visual基準未更新は継続する。

## 候補33：制作版へ反映、現在版の検証中

- [人物3人のprototype独立目視](audits/smooth-home-i34-revision-33-prototype-visual-20261012.md)は限定PASS（SHA-256 `62b7b3b10943202dcdbd39794ef1fc31da3ee43cc6518b39d75fa1ee65fd00ba`）。上側の一定幅の帯が消え、側面/下の白目と姫まつげ根元が維持された。この結果だけで全10/現行buildを合格にしない。
- 同じ投影をproducerの制作データへ反映し、全10を再描画。人物3 sourceは[prototypeとのbyte一致](../test-results/smooth-home-i34/revision-33/prototype-equivalence.json)を確認。runtimeは候補32と同じで、虹彩/瞳/反射位置の制作metadataだけを変更した。候補32のproducer/manifest/authoring/眼rendererは`revision-32/implementation/`へ保全した。
- 現在の固定buildは`1a15263b71b2d03d2b4b3e441b78f85ca818178aef00bb1d4ca861861ba9d9db`、runtime sourceは`eda805867c572d40e172de809cec16bdb05cdfea981c640749243e1904c35794`。[検査前identity](../test-results/smooth-home-i34/revision-33/identity-before.json)へproducer/検査harness/素材manifestのhashも保存。lintと型を含むdemo build、旧素材963件/43配信binding/Project・RegionPaint AST一致は現在版で確認した。全10の独立source目視、native/実Chrome、検査後identityは進行中。

## 候補33の確定結果：source限定PASSと実画面FAIL

- 固定build/sourceは上記のまま、[検査後identity](../test-results/smooth-home-i34/revision-33/identity-after.json)で前後一致。449/449Unit、lint/demo build、[実Chrome24/24](../test-results/smooth-home-i34/revision-33/browser/results.json)が成功。全10×倍率1/2/4×DPR1/2/3の[native90条件](../test-results/smooth-home-i34/revision-33/native-zoom/evidence.json)は輪郭外0、5色×20眼の反射/暗瞳も成功。他画材30状態/旧40状態のRGBA不変、旧素材963件・43配信binding・Project/RegionPaint AST一致を確認した。32の成功を転用した数字ではない。
- [全10source独立目視](audits/smooth-home-i34-revision-33-source-visual-20261012.md)は限定PASS（SHA-256 `7f7fb58d8b28e875a6a367c3d2de4387867b36928cf7f6a6f3f70e2d7e66803b`）。しかし[実画面/拡大/PNGの独立目視](audits/smooth-home-i34-revision-33-screen-visual-20261012.md)は**FAIL**（SHA-256 `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775`）。66画面を実表示し、姫の右頬/耳と魔法使いの顎の折れS01、窓/ロボット首/タイヤ/花の茎などの段差S02を確認。DPR3や2048PNGにも同じ形が残る。source限定PASS・輪郭外0・技術成功で、このFAILを閉じない。
- 人物眼B03、まつげ根元、旧口元白抜けの改善は実画面でも維持された。顔全体/ホーム同等の品質はS01/S02により未完了。Visual基準未更新、P05性能停止、全体NOT READYを維持する。

## 候補34：輪郭の色分けを切り分ける試作（制作版へ未反映）

- `revision-34/diagnostic/`で陰影を中立化しても段差が残り、元のink色分けを除くと基本の塗り曲線は滑らかになることを親が確認。色分け用所有セルの境界が主因と考え、通常のベクターcoverageを局所に使い、遠方だけ旧所有セルへ戻す試作を行った。公開内容/runtime/buildは33のまま。
- 初回試作は空のpathを出したため既存validatorで失敗。`prototype-failed-1.mjs`と観測したstderrを`prototype-failed-1-error.json`に保全し、空形状の正規表現`M0 0Z`へ直した。validator/受入条件は緩めていない。
- `prototype-2/`の姫/魔法使い、outset幅0/4/8を比較。独立初見は**FAIL**：幅0で魔法顎の段差は減るが、姫右頬・顎・耳の茶色帯/折れが残る。幅4/8は額などに新しい角/張り出しが出る。正式報告を別原本へ保存する。未使用helper `scripts/continuous-ink-fields.mjs` は制作処理へ接続していない。34を実装済み/検証済みにしない。
- 次は局所ベクターと旧所有セルの間に残る帯を連続曲線で分割する方法を試す。試作の合格後に全10と固定buildの影響検査を行う。旧33の成功と34の局所改善を新候補の完了証拠へ転用しない。

## 候補35〜39：境界と陰影の独立した原因（全て未公開）

- 35は距離を市街距離から正確なユークリッド距離へ変え、所有セルをベジェ曲線へ近似した。36は全塗り面へ色分けを適用したが、旧opaqueの欠けを新しい白穴として出し、親の目視で不採用。35の初回import階層誤りも失敗原本を別保存した。両候補で制作版/buildは変更していない。
- 36の陰影中立化診断で、色分けだけでなく共用light mapの隣接部位の値が茶色帯を作ることを確認。37は各部位に自身のサンプリング余白を持たせた。最初のVite試作は変換が適用されず、`prototype-ineffective-1.mjs`と失敗説明を保全。`enforce:pre`と変換対象assertを加えた`prototype-2/`だけを有効な37として扱う。
- [37の独立限定目視](audits/smooth-home-i34-revision-37-prototype-visual-20261012.md)は**FAIL**（SHA256 `a9a9b3e866b7170d8f5bfaeb613576e93da44ab6114e30c0b8d11e3ab6fb53fc`）。人物2の8画像を実表示し、21hashが前後一致。細かな段差は減るが、姫の耳周囲/顎下の髪が広く平坦になり、周囲の流れとつながらない。眼/口の旧欠陥は当該画像で再現しない。この限定結果を全10/実Chromeへ転用しない。
- 38は同じ制作グループのlightを連結。39は登録原画の適合するink部分の陰影を補ったが、親の目視で平坦面が残り、布の境界に新しい粗さも検出。両候補は不採用。37/38/39で使ったhelperの別コピーと全出力を保全している。
- 追加診断で、姫の平坦部には通常の領域ラベル内の暗い髪も含まれると確認。例: world `(770,710)` はr17、登録RGB `[73,22,1]`、髪reference `#94522E` との正規化RGB距離約0.282。従来の0.19除外が正しい髪の接触影も除き、近傍の明るい値で埋めていた。別の `(770,720)` は領域ラベルなし/ピンク服RGBで、髪のサンプルへ採らない。色相と暗部を考慮した限定試作40へ進む。

## 候補40〜42：今回の再試行（制作版へ未反映）

- 40は髪の色相が保たれた暗部と、同じ髪だけのink内サンプルから相対光を作る。姫/魔法の8画像を保存。[独立限定目視](audits/smooth-home-i34-revision-40-prototype-visual-20261012.md)はFAIL R40-1（SHA256 `9e07ecf53388a228fa8608f5db0b7add5fad14b613317a50a019312c769ad3e5`）。37の広い平坦面は改善したが、姫の左顎/右頬横/耳上に細い継ぎ目が残る。23対象の前後hash一致。2人の試作だけの結果で全10/実画面へ転用しない。共用のprivate完成RGBをアプリへ配布する方式ではない。
- 41は人物2のsmooth専用輪郭を手作業の少数の曲線で試作。初回は顔の補正で口のcoverageまで消した退行があり、画像/コードを保全。`prototype-2`では口を除外して再描画。線画/当たり判定/公開素材は未変更。
- 42は通常塗り面とink色分けに同じ曲線を使う試作。旧opaqueだけを使わず、既存の通常形状/ink/補修との和集合内に限定する。部分/消去、全10、輪郭外0、実画面の受入検証は未実施で、制作版へ採用していない。
- 現行公開/runtime/buildは候補33のまま。新規helper `scripts/continuous-ink-fields.mjs` と `scripts/relative-part-light.mjs` は未接続。33の449Unit/24Chrome/90条件はこれらの試作を検証した証拠ではない。次は有効な試作の現物を比較し、採用候補の新hashで影響検査と独立実画面確認を行う。I34未完了、P05停止、Visual基準未更新を維持する。

## 候補43〜47：細い継ぎ目の切り分け（未公開、継続中）

- 43は顔と髪の局所境界を対で制作したが、初回は第三の首領域を切る退行があり不採用。原本を保持し、対の領域内だけに制限したprototype-2でも継ぎ目は残った。顔形状の大きな変更を微小線の原因解消とは扱わない。
- 44は色分け領域の重なり幅3/8を比較。左右の頬横で未割当ink画素は両幅とも0で、耳上だけ幅3で3画素・幅8で0。幅8にも継ぎ目が残り、新たな張り出しが出るため不採用。未割当セルだけが原因という仮説を棄却した。
- 45は輪郭の着色を一度の合成にする未公開試作。40とはsourceのSHA256が変わったが、親の局所実表示では細い痕跡が残る。独立合格とはしない。
- 46は同じ試作を塗り面と輪郭の別レイヤーへ分解。左顎横の白い下地と、右頬横/耳上の白い細片が塗り面だけの画像に見える。輪郭のalpha境界との合成で下地が微小に露出する可能性を47で検査中。診断画像はテスト出力だけに保存し、制作素材には使わない。
- 制作版/runtime/buildは引き続き33。47の新しい下塗り試作はまだ実装・検証済みではない。449Unit/24Chrome/90条件は33の履歴。P05性能停止、Visual基準未更新、総合NOT READYを維持する。

## 候補47の独立FAILと48〜52の制作版修正（現在52、検証中）

- [47の独立原本](audits/smooth-home-i34-revision-47-prototype-visual-20261012.md)は限定FAIL、SHA256 `7289288911d2017fd5f0bdcd8f881801dd08338c980475443c87cb39b94aecc1`。長い継ぎ目は改善したが、耳上world x522〜546/y519〜526と右頬x814〜818/y674〜678に微小断片が残った。18証拠の前後hash/bytes一致。全10、部分塗り、実Chromeの合格ではない。
- 48で正確なユークリッド距離の色分け、曲線近似、髪の暗部サンプル、部位/制作グループの相対光素材を全10へ反映した。素材は相対光だけで内部完成RGB原画を配信しない。通常geometry/当たり判定/線画/他画材/旧素材/保存schemaは保持。最初のatlas収納2失敗を保存し、同じグループ光から領域単位に切り出す方式で解像度を下げずに収納した。
- 48の新しい継ぎ目Unitは42成功/1失敗。49の色相復元範囲の拡張だけでは微小断片を解消しなかった。50は中立光/全領域同色の直接3200描画で、通常19断片、最後の切抜きなし0と切り分けた。元の複数形状を別々にsource-over合成したalphaの隙間が直接原因。診断/失敗の画像・コード・結果を保持する。
- 51で最終切抜きを一つの結合曲線にし、下塗りと輪郭の同じ色分け曲線を使用。新しい対象Unitは43/43成功、lint/型/demo build成功。他画材30/旧40RGBA不変、旧素材963件/53配信binding/Project・RegionPaint AST一致、private20原本未配信を確認。build `323ce04fa8ec7cf46abc6242d001d2bb0a41f08dc528fe789d8ff4cd99cf780c` / runtime `1728c560f0a65f2c06808229a865c7615874649e3192a274923a56136c17a628`。ただしnative検査で花の輪郭外19pxが見つかりFAIL。43Unit成功でこの失敗を閉じない。51の制作コード30ファイルと画像を別保存している。
- 52のマスク診断では結合曲線だけの90条件で輪郭外2516サンプル、元の形状の加算被覆では0。後者は内部継ぎ目の被覆が最小252/255で、従来のsource-overは190/255だった。52では加算被覆を飽和させてから結合曲線と交差し、元の被覆が0の外側を保持しつつ滑らかな境界を描く。判定条件0pxは変更していない。
- 現在の制作版/runtimeは52。全Unit、全10/90条件、独立source目視を実行中で、実Chrome/検査後identity/独立実画面の受入は未完了。51の数値を52の合格に転用しない。P05性能停止、実機/実外部同期未確認、人間採用未受領、Visual基準未更新、全体NOT READYを維持する。

## 候補51独立FAIL、候補52の退行と53の切り分け

- [51全10sourceの独立原本](audits/revision-51-source-visual-20261012.md)はFAIL、26,367bytes / SHA256 `8a05416ae7260a5a67cce596faa297e2968fe60b9fc42ee0110ab7e8f7d40d5f`。55証拠の前後hash一致。47の耳/右頬の微小片と工事車の窓下辺はsource範囲で改善。一方、ロボット首world x700〜970/y818〜865、車タイヤ上辺x416〜512/y1008〜1043の段/角、車体の孤立暗色線（950〜1004/1100〜1106、1210〜1245/1180〜1192）が残る。source合格でも実画面合格でもない。
- 52の全Unitは451成功/2失敗（フレームが原画の一部へ透ける、車の部分塗りが再着色に反応しない）。実Chromeは23成功/1失敗（魔法使いのreload Canvas不一致）。before/after identity一致、build `490db38b22ef6a2a861b869f20c370a8f34b6a6f488aed21d8e1aae2a4975604` / source `b9b0d7c13f0227057f27a990ba1f80209e4546e244a6e5a9d4702bf0de9d43f4`。失敗と当時実装を保全した。
- 52のnative90条件は数値上0pxだったが、親の実表示で乗用車等の絵が空白になる退行を確認したため、全10輪郭合格の根拠として無効とする。外側0だけでは絵の存在を保証しない検査の不足も判明。53で描画が存在する前提を追加し、0px/倍率/DPR/メモリ/タイル比較の従来条件は緩めない。
- 52の独立診断では車r01の再着色差分が、通常0px、最終切抜きなし12882px、51の結合曲線2947px。加算被覆だけ2950px、source-inで複合pathを交差すると0px、別bitmapで交差すると2946px。53は別bitmapのdestination-inへ切替え、元の紙の内部被覆も保持してフレームの透けを防ぐ。対象43Unitで2退行と白い継ぎ目の検査が成功した。この限定成功を全Unit/Chromeの成功にはしない。
- 53では色分けの短い段を「角」と誤認する近似を切り分ける未公開比較試作を準備。通常geometryは変えず、色分けだけ長い基準距離と許容誤差6/10を比較する。初回data URL import解決失敗を別保存し修正。採用/全10展開/独立再目視/新hashの全検証は未完了。

## 候補54–57：形状補正と部分塗り、再読込差

- 指示元I34/再試行。54では金属・ゴムを同じ選択色でも別の相対光として導出し、技術素材の孤立インク粒を除外、曲線の角判定を長い基準距離に変更。55は車の全領域にerror6を適用した候補。
- 55の全454Unit成功、native90状態（絵の存在の前提付き）/眼100配色検査成功。Chrome23成功/1失敗（魔法使いの拡大後縮小→reload Canvas差）。before/after build be75b2b1017301703c604c081ecd27eb66d68ed27b2315ab1bffff8fb5840372 / runtime55f2ecfc7aec113086e864d54f07be7c06f0bc528a84cede0e957e31bfad38db一致。scopeは旧素材963/53binding、Project/RegionPaint AST不変、非公開原画20点のhashがbuildにないことを確認。snapshot94ファイルを保全。
- [55独立監査原本](audits/revision-55-source-visual-20261012.md) はFAIL。R55-1＝r19青とr10赤が未着色隣接面へ漏れ、R55-2＝右窓が赤い角張った面へ変形し右ボンネットが白抜け。首・タイヤ上辺等の局所改善は認めるが、全体合格にしない。原本SHA e850b6e71536e3feb59a6efde8eceec236401191d46bb32e5c1204160bff44a7、67証拠の前後一致。
- 56は未採用比較。タイヤr13/r19/r29だけerror6、他は3とする混合で窓/車体を復旧。未着色canonical面保護＋元のink内だけ線を復帰する試作で旧の漏れ帯が改善。最終原本/実2倍の判断は担当へ依頼中。
- 56のChrome診断は同一515×644・scale1・同じ保存色でも、通常GPU経路では拡大前/再読込がafa2…、拡大後が8a63…へ変化（差の最大17）。GPU加速2Dを無効にした別診断では7状態すべてbc4639…一致。見た目や許容差でreload失敗を免除しない。
- 57では新版surfaceLightの中間Canvasのみ安定したCPUラスタ経路を選択し、通常Chromeで再検証する。未着色faceを白＋内側1pxで保護し、未着色隣接線は元inkに限定して復帰。タイヤ限定補正と2件の現物回帰テストを追加。全Unit/build/全10/90/Chrome/新独立source・実画面は検証中。P05は測り直さずSTOP、性能合格を主張しない。

- 56独立限定PASS原本は[audits/revision-56-vehicles-prototype-20261012.md](audits/revision-56-vehicles-prototype-20261012.md)、SHA 76bdfb640ed5e7301c4e9c09ccf874f34f494eec5d8b695157b96246e0ada028。21証拠前後一致。旧の長い色帯/広い白抜けを解消、r19下部の終端接点の単画素を残すが連続したにじみとは判定しない。提供範囲と57未判定を区別。
- 57の全456Unitは453成功/3失敗。2件は20秒timeout（重いnative/review/Chromeとの同時実行）、1件は未着色眼の旧領域を白保護が上塗りし、姫の旧眼縁再利用位置651,521が[255,244,232]へ退行。判定条件を緩めず、眼領域を白保護から除外する未公開診断では同位置[255,136,0]。専用眼描画が白目/未着色眼を担当するので、canonical保護はsurface fieldを持つ制作部品に限る。
- 57通常Chromeでは魔法使いの拡大→縮小→reloadが一致。新CPU経路が問題を解消した限定証拠。全unit失敗を隠して57完了にはしない。57新source全塗りの車以外9テーマは55 sourceとhash一致を計測したが、新部分/眼/実画面の修正完了には転用しない。
- 候補58（2026-10-12 23時台JST、検証中）：57の未着色面保護から、専用の白いopeningを持つ眼の旧領域を除外した。旧眼縁外に白を再描画する退行を修正し、親の肌だけsmooth/眼未着色の姫・魔法・恐竜を新Chromeケースとnative9画像へ追加。線画の白い瞳、色を付けた時だけの眼補正は維持する。
- 58は全456Unitを他の重い検査と分けて実行し456/456成功。57の453成功/3失敗原本や20秒timeout条件を変更していない。lint/型/demo build成功。固定build `eeecf03fa8e323ccc446ad722dc46e056e7d7ded24390554a3ba834c42c14926` / runtime `a8c6d862ee9fad079779278716030715a084106f224178d69696803006bf33a0`。取得中の新Chrome25とnative90、独立source/実画面目視が終わるまで品質PASSへ更新しない。
- 58の新native比較でgeometry10、blank/crayon/pencil30、旧作品40RGBAが不変。現source10/fit10、直接2倍7、部分/消去6、未着色眼の親だけsmooth9画像を取得。scopeは旧素材963/現53binding/Project・RegionPaint AST不変、非公開原画20hashのbuild非配布を再確認。これらは技術的な列挙範囲の証拠で、美術合格や実機/実外部同期/P05性能の合格を意味しない。


## 候補58–61：未着色眼の独立不合格と肌素材の原因切分け

- 58の機械検証は完了：456/456Unit、通常Chrome25/25、native90条件・眼100配色、geometry10/blank-crayon-pencil30/旧作品40RGBA不変、lint/型/demo build、scope963旧素材/53binding/保存schema/非公開原画20点を確認。before/after identity一致、snapshot95ファイル保全。ただし[58独立source原本](audits/revision-58-source-visual-20261012.md)はFAIL、SHA 2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd（82証拠前後一致）。姫外白帯R58-1、魔法/恐竜二重輪郭R58-2。実画面合格ではない。
- 59で未着色眼は独立した初期線画の白い瞳を使い、その他の眼は一重の白い虹彩ガイドと小さい白丸へ変更。色を塗った眼/完全線画/他画材/旧版は維持。runtime変更を保存済みthumbへ反映するため、新版surfaceLightにsmoothが含まれる作品だけキーへsmooth-surface-v2を追加。保存schemaは不変。
- 59対象検査は初回61成功/1失敗を保持。早期線画の白い瞳は完成後のopeningより外へ出るため、その制作データ由来の白領域を旧眼縁再利用判定から区別した。230の閾値は維持。変更テストを記録し、新4白帯点と旧57の651,521点を追加。再検査62/62とlint成功。旧形状を新版へ厳密一致させないI18/I20/I22を根拠とし、任意の実画素で検査除外を決めない。
- [59限定独立原本](audits/revision-59-eyes-prototype-20261012.md)はFAIL、15367bytes / SHA 907163e7258a34b60158e4bcfa546a5fec88bf801bc758ebe6c63e67bf47ec95。9新眼画像と15比較画像を実表示、27証拠前後一致。58の白帯/二重輪郭は改善したが、姫右眼world x797–802/y590–603の濃茶片R59-1が残る。59の全10/実build/実Chromeの合格ではない。試作ソース7ファイルも保全。
- 60の描画分離診断：world(799,600)は通常/眼なし/既存inkなしで同じ[41,12,9]、素材なしは[242,215,189]。肌atlasの同位置RGB[21,5,3]を確認。元の眼の切抜きが最大subpathを埋めても肌domain外に残り、nearest補間で濃い色が残っていた。保護区域で同じ顔が所有する穴をdomainへ含めた60だけでは新回帰Unitがまだ失敗（G46、修正前G64、条件G>150）。失敗原本/画像/導出入力を別保存した。
- 61の追加診断では鼻の広い例外区域が眼内にも重なり、world(772,603)の[28,3,0]等119個の暗いseedを許していたと確認。制作済みeye openingを鼻の例外から除外する。鼻の制作範囲/原画/保存schemaは変更しない。61の新素材・現実画面・全検証・独立目視を取得するまで未完了。P05停止、実機/実外部同期未確認、人間採用未受領、Visual基準未更新、全体NOT READYを継続。

## 2026-10-13：61実画面FAILと62共有境界の試作

進行基準は[統合計画I34](storybook-improvement.md)、詳細は[I34進行記録](smooth-home-i34-progress.md)。候補61の固定build d080ec40… / runtime 74c1b959…で全459Unit中458成功・local SQL fixture1失敗、同一fixtureのローカル通信許可付き再試行1成功を別保存。Chrome26/26、native90/眼100、lint/型/demo build、前後identity一致を確認した。独立source/engine/未着色眼は限定PASSだが、[実画面原本](audits/revision-61-screen-visual-20261013.md)は姫右頬の折れR61S-1（world x807–816,y663–675）でFAIL。I34は未完了。62は共有境界のin-memory試作で、本番は61のまま。旧失敗原本、P05性能停止・人間採用未受領・実機/実外部同期未確認・全体NOT READY・Visual基準未更新を保持する。

- 61 screen原本SHA256 fa510bcc0aa21bc8a4229774cf6d5653534b3cf1dae7e226ae6e7317eca975ff、76,654bytes。81PNGを新表示、同一byte5パス参照、17未表示。入力150件の前後一致。未表示を合格に数えない。
- 62 exact-cut試作は頬の折れを減らしたが細い白縁が出たため不採用。1world px重ねる別試作を同じnative1/2で限定独立比較中。production/runtime/buildは61のまま。
- R61S-1の新回帰Unitは3200px実描画で色境界の二階差を測り、61は1.3499で上限0.5を超えてFAIL。同じ検査条件を修正後も保持。白縁の明度突出も検査する。独立目視の代用にはしない。

### 62制作データへ反映、現在版の検証中

- exact-cut/overlap/sharedの白縁・矩形線・両端段差を不採用で保持。最終joined試作では肌を髪の下へ1world pxだけ重ね、髪の補集合を同じ曲線から生成し、両端を元の境界/接線へ接続。制作データfieldBoundaryOverridesとして姫のr06/r07/r17だけを変更。通常geometry/全10の画材画像と他9templateは同一（local-change-check.json）。
- 新全Unitは460/460成功（local fixtureのlocalhost通信許可付き実行）、lint/型/demo build成功。build a95ad6a0c04f9327eba28ed61ddc222cfc8bb4246863155a45d421eea2d17d0e / runtime74c1b959e505c5911eb697bfe8dbc543669d3223e59ebb7bb002170aaaf4dc1c。描画基礎30/旧40不変、旧963素材/53binding/schema/private20保全を新照合。新Chrome/90条件/独立目視は進行中で、I34未完了を維持する。
- 停止していたlocalhost4174プレビューを再起動。前候補の原本と生結果は上書きしない。

## 2026-10-13：62逆明度/部分塗りFAIL、63全顔の共有曲線試作

進行基準は[統合計画I34](storybook-improvement.md)、詳細は[I34進行記録](smooth-home-i34-progress.md)。候補62のbuild a95ad6a0… / runtime74c1b959…で全460Unit/主Chrome26＋補足1/90native/眼100と保全検査は成功。source73画像とengineは独立限定PASS。しかし[実画面原本](audits/revision-62-screen-final-visual-20261013.md)は、逆明度で段付き境界R62S-1、未着色眼端の淡い矩形帯R62S-2によりFAIL。通常色の旧R61S-1改善と新FAILを分ける。現在は63の顔全体の共有曲線/肌の相対光をin-memory比較中で、productionは62。I34未完了、旧FAIL/不採用案/補足初回harnessFAIL、P05 STOP/人間採用未受領/実機・実外部同期未確認/全体NOT READY/Visual基準未更新を保持する。

- 62screen最終原本9,248bytes/SHA316466855b99d69cc398eb009a969574e99e701d3f55ef91b6d87e4bb0988df3、inputs78,380bytes/SHA0e03773e84ea1a2cd48f6d64cf433abc1e92cc19eb22a6904cec1b0e136a5ad0。157入力前後一致、15PNGパス/14内容と原寸crop7を表示、index残97PNG未表示。
- 新R62S-1：逆明度で画像x550–587/y350–463の段、x437–475/y577–596の尖った横段。R62S-2：未着色眼端x530–561/y348–386の淡色矩形帯。保存metadataにpan offsetがなくworldは近似位置のみ、正確な画像ROIを一次証拠として保持。次の取得ではview x/yを記録する。
- 63は制作データ未変更のin-memory試作。局所矩形を継ぎ足す代わりに顔の外周を連続Bezierにし、全hair fieldと共有する。暗色肌での緑/赤の色転びもparent実表示で観測し、相対RGB光と選択色の影響を分離して比較。明るい自然肌の色味を維持し、暗色/非肌色では相対輝度と選択色相へ切り替える候補を比較中。未採用/未検証を完了扱いにしない。
