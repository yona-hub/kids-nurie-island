# 姫1枚の内部完成原画候補：独立 engine / 証拠監査

日付：2026-10-10 JST。対象：I19 / P01〜P05、継続するI8の旧作品保全・保存schema・32MiB・共通描画条件。監査中にI20「現状の添付のこれも怖いからね？線画は一番最初か二番目くらいのやつでいいんだよ。色塗った時だけ、きれいに加工してあげれば」が伝達されたため、未着色眼の受入は撤回された状態で判定する。

**初回判定：限定FAIL／未完了。I19固定候補の着色・保存・旧作品保全には下記の技術的証拠があるが、P01はI20で明示却下された。P05には不要なiris画像取得のP2が残る。全10の受入、正式採用、全体READYを判定しない。I20修正版は新identityを受領してから別に再確認する。**

監査担当が実行したのは読み取り、保存snapshotとのdiff、SHA256照合、JSON構造比較、陰影PNGの全画素無彩色検査だけ。Unit、Chrome、offline、性能、lint、typecheck、buildはこの担当では実行していない。下記のテスト結果は実装担当が保存した生ログのレビューであり、この担当による再実行数へ数えない。実装・承認・評価基準・旧監査原文は変更していない。

## 固定対象と実差分

| 対象 | 値 / 照合結果 |
| --- | --- |
| 固定identity | `test-results/princess-master/identity-before-audit.json:7` |
| build SHA256 | `ba4dd4f7f275cbcfbece77308ef4e340c2837a6aaa7120d0ff40de9cd1fe5fc9` |
| source SHA256 | `1996e8f12f3316619d02ea3071b7517ec79a23c750c50ce7bddb2c3ed18db5fe` |
| template / JSON bytes SHA256 | `gen-princess-bunny-v6-master-v1` / `0a8e01460d68f2094ded77f2276130fce4c28f74188b0eb915417e4a3ae026df` |
| canonical contentHash | `720c1bd87f0689d3b2aea4a5ef48095f66b87dab4b1dcd8b9f14e2b7ae67841d` |
| 内部原画 / 相対光map SHA256 | `a1b87bc1f7f1491ed99d874f282a420381dce9c176ec0e16090f6a1a7bcff8c6` / `247e2f2f64403528fb181be24ef6f6ff033708c86ae4cef59e547f3c0172c0bb` |
| 独立の現物照合 | source59件、identity harness4件、pilot harness10件、配布725件の不一致0。性能結果のbuild/sourceも一致。2026-10-09T15:55Zまでに読み取ったI19固定現物についての結果 |
| 比較元 | `test-results/vector-improvement/vector-accepted-end.json` の旧f3c identity。`test-results/vector-engine-audit/input-snapshot-vehicle-details-recheck/` の57source全てがそのSHAと一致していることを確認してから比較 |

旧f3cとの差分は12source変更、`master-eye.ts` / `painting-media.ts` の2source追加、source削除0。変更された保存層 `packages/persistence/src/index.ts:643` はduplicate引数のrenderer型にv4を加えたものだけで、transaction本体は不変。新旧metadataの指定は `Home.tsx:145`、`Editor.tsx:417`、`Gallery.tsx:488`。旧のhash付きcontent522現物は全て現在のpublicに同一bytesで保持されている。

姫の51regions、details、15groups、opaquePathは旧v3の `gen-princess-bunny-v6-storybook-v2` と完全一致。4眼の制作データはblankGuide追加以外同一。旧v1/v2のupgradeSourcesは同一で、旧v3の51IDを同じIDへ対応させる追加mapがある。catalogの姫slotだけが新候補に変わり、姫の旧3入力のupgrade-indexは新IDを指す。`scripts/build-princess-master.mjs:101`〜119、`apps/web/src/pages/Gallery.tsx:483`〜490。

## 指摘と必要な次の確認

### PM-E01 — P1 — 未着色眼はI20で明示却下済み

- 対象：`packages/coloring-engine/src/master-eye.ts:38`〜45、`scripts/build-princess-master.mjs:105`〜111。白いopeningの中に小白丸1個だけを置き、着色時と同じ上下まぶた・まつげを外枠に使っている。
- 再現対象：I19候補を未着色で開く、または両眼を消去する。保存済み `test-results/princess-master/browser/screens/blank-dpr1.png` / `native-r2/blank.png` の状態。
- 根拠：I20の人間の明示却下。Unitの「内部ring無し」「消去でexact blank復帰」が成功していても、親しみやすさの受入へ置換できない。
- 必須対応：人間が示した初期の単純な線画表情と、着色後の加工を分離した候補を提示する。新hashの未着色・片眼着色・両眼着色・消去復帰とSVG/Canvas/PNGの対応を確認する。旧I19のblank成功証拠を新しい表情の合格へ転記しない。
- 状態：I20修正版の現物・固定identityはこの初回判定では未受領。新実装の品質は未確認。

### PM-E02 — P2 — v4で消費しないiris画像まで取得・展開する

- 対象：`scripts/build-princess-master.mjs:101`〜103 が旧mediumAssets.irisを残し、`packages/coloring-engine/src/painting-media.ts:7` が全entriesをloadする。新候補JSONの `mediumAssets.iris` は `apps/web/public/content/templates/gen-princess-bunny-v6-master-v1.json:1875`。
- 根拠：v4の `storybook-engine.ts:77` はmedia引数を持たない `drawMasterEye` を呼び、`master-eye.ts:13`〜46は虹彩素材を参照しない。v4の一般塗りも `storybook-texture.ts:127`〜136でformだけを消費して戻る。したがって、v4でiris rasterを使う経路がない。
- 影響：初回に248,218 bytesの不要取得と、512×512×4 = 1,048,576 bytesの不要decode。現media合計24MiBは32MiB以内であり、上限超過が発生したという指摘ではない。M17/P05の「必要素材だけ取得」の不足。
- 推奨修正：v4の生成profileから未使用irisを除く等、旧v3のiris消費は維持してv4の取得対象を一致させる。修正後はnew profile/loader/各surfaceの取得一覧とidentityを確認する。
- 状態：I19固定候補では未解消。

### PM-E03 — P2の性能観測 — smooth初回は100msを超える

指定された36標本集約p95ゲート自体は合格。判定式を画材別p95や最大値へ変更しない。一方、全タップが100ms以内、各画材p95が100ms以内、実機の即応性が保証されたという説明は生結果と一致しない。

| CPU4 / DPR2、390×844 | 36標本firstCanvas p95 | firstCanvas最大 / smooth12標本p95 | lastCanvas p95 / 最大 | 2rAF代理p95 / 最大 |
| --- | --- | --- | --- | --- |
| 最大面積：スカート6領域 | 21.4ms | 112.3ms / 112.3ms | 27.2ms / 115.6ms | 45.3ms / 215.2ms |
| 最大所属数：髪7領域 | 32.4ms | 130.3ms / 130.3ms | 33.0ms / 131.9ms | 53.6ms / 168.5ms |

`test-results/princess-master/performance.json:4096` / `4395` / `4450` / `4749`。最大値はどちらもsmoothの最初のサンプル。crayonの画材別p95は21.4/32.4ms、pencilは14.9/28.4ms。各画材12色・合計72標本、errors0、buildUnchanged:true。`scripts/check-storybook-performance.mjs:29` / `57`〜62の規定式は画材別の色数と全36標本p95を検査する。

必要な扱いは、このcold初回の観測を保持し、包括性能B30や実機U04を閉じないこと。原因をJIT、decode等に断定できるprofileは未提供。firstCanvasはdisplay canvasの最初のdrawImage呼出時刻であり、変更した部位の最初の画素や物理presentを検出する測定ではない（同script:43〜47、`storybook-engine.ts:102`〜108）。2rAFも描画機会の代理値。新hashの性能は未測定のまま区別する。

## P表への照合

| 条件 | I19固定候補の限定判定 | コード・生証拠と限界 |
| --- | --- | --- |
| P01 未着色眼簡略化、両眼/片眼/消去 | 技術的操作証拠あり、I20受入FAIL | master-eye:38〜45、painting:4〜9。unit-pilotのexact blank復帰、browser eyes testの両眼/片眼/reload/PNG。I20の表情修正は別 |
| P02 native眼、倍率/DPR/小数pan | 技術方式の限定PASS | storybook-engine:85〜108でv4眼をtileから外し直接vector描画。phaseはv4だけで、paintとinkのtile転送を整数device pixelに合わせる。master-eye:22〜29は繊維を虹彩の91%内へclip。Chrome測定15状態で1/2/4/2.65/1倍×DPR1/2/3、transform:none、native寸法をassert。AAの主観的品質・人間採用は別 |
| P03 内部原画から13意味groupの相対光 | 構造・色独立性の限定PASS | build-princess-master:26〜97は既存maskで部位を固定し、group内だけで補間、元RGBを無彩色fieldへ変換。固定offset[128,160]。form全5,242,880画素を独立読取しR=G=B、alpha255、不一致0、実値32〜228。manifestの26〜227はblur/resize前のfieldRangeでありPNG実範囲とは異なる。原画の配色・光の完全自動分離や、毛流れ/皺の制作受入を証明するものではない |
| P04 自由色・3画材・保存・旧copy | 読み取った技術範囲の限定PASS | storybook-texture:92の選択色とcoverage clip、127〜136の相対光hard-light。Unitは黒/白/青の髪内pixel、3画材決定論、single/group、schema維持のcopy。browser4件は3画材、保存/reload、実2048×2560PNG、旧v1/v3別copyと原作deep一致。全画素の漏れや全scene・外部同期・実機は未確認 |
| P05 速度・32MiB・必要素材・独立確認 | 速度/明示cache capは限定PASS、必要素材はPM-E02 FAIL、全体未完了 | tile cache32MiBはstorybook-engine:28、backing bitmap解放はcache.ts:31〜39。image cacheはcanvas.ts:51/114〜118。form20MiB＋既存4×1MiB=24MiB。active refsや同時decodeを含む実heapの32MiB保証ではない。包括メモリ/長時間/実機は不明 |

## 旧作品・共通surface・承認の保全

- 旧renderer：legacy `engine.ts` / `texture.ts`、frozen v2 engine/texture、canvas/cache/geometry/sceneは旧f3cと同一SHA。dispatcherの追加は `version>=3` の選択だけ（renderer.ts:17）。v3はnative眼分岐とphaseの対象外で、従来のauthored eyeと一般陰影へ入る。
- 旧v3：`compatibility/before.json` と `after.json` の40pixel/hash記録が完全一致し、afterの6source hashも現物に一致。10作品×blank/smooth/crayon/pencilの320px snapshotに限定。新しいviewport比較や全装飾比較を実行した証拠ではない。
- 旧v1/v2：以前の独立80状態oracleは `docs/audits/vector-engine-20261009.md:91`〜94の履歴。今回の再実行数に合算しない。同一source/旧immutable現物の保全を確認した範囲に限る。
- 保存schema：旧f3c snapshotと現物のProject/RegionPaint定義を比較し同一。`RegionPaints`はRecordのまま。IDB `packages/persistence/src/local.ts:40` のversion3もSHA不変。SQL migration名は20261006の既存3点と以前の `schema-evidence.json` 一覧に一致。SQL本文の開始時hash証拠は今回未提供なので、SQL全byteの不変とは断定しない。
- copy：v4から旧3入力へ戻すmapを導入せず、新ID別作品へコピーする。原本をsaveする経路はない。duplicate transaction本体は旧f3cと同一で、既存500/quota保護の実装は保持。今回のv4を対象とする500/quota新再実行は未確認。
- surface：ArtworkCanvas:174/189とartwork-render:20/26が同じnamed media loaderを呼ぶ。snapshot/export/thumbnailはstorybook-engine:111〜117で同じbase/paint/details/eye/sceneを使う。native表示も同じ眼関数だが解像度依存の繊維数は変わるため、全倍率pixel完全一致を主張しない。
- private master：固定build725現物一覧にoriginals/finished-v1/registered-masterの配布pathはない。新templateはmasterのSHAだけを保持し、元画像URLを持たない。browserログのresource確認も元画非取得。`content/princess-master/generation.json:8`はprompt原文未保存と明記しており、productionBriefをtool送信原文と呼ばない。
- approval：QA pass:false（content/qaの末尾）、reviewはauthor-technical、humanApproved:false。`scripts/release-assets.mjs:5`〜9はhuman/current hashを要求するまま。prototypeのtemplate.approved:trueを人間正式採用へ読み替えない。本番build成功の証拠はない。

## 提供ログの分類

| 保存結果 | 読み取った結果 | 適用限界 |
| --- | --- | --- |
| unit-focused.json | 21/22、blankGuide中心hitがnullの失敗 | 旧失敗を保持。後のpilot8件成功と区別し、失敗rawを消さない |
| unit-pilot.json | 8/8、success:true | 姫局所試験。全398成功ではない |
| browser/results.json | 4/4、skipped0、unexpected0、flaky0 | Chromeのみ。master pilot、眼操作、旧v1/v3 UI copy。旧v2 UI copy新実行ではない |
| offline/results.json | 1/1、unexpected0 | 既存PWA試験の新候補適用。実機や全32scene offlineではない |
| unit-all.json | 397/398、cloud fixture fetch失敗 | localhost sandbox失敗を含む失敗run。全体cleanPASSへ書換不可 |
| unit-all-localhost.json | 397/398、cloud fixture成功、90条件matrixが20秒timeout | timeoutは数値描画assert不一致と同一ではないが、run全体は失敗 |
| unit-drawing-isolated.json | 5/5、success:true | 該当描画5件の分離成功。先の全体runの失敗をsuccess:trueへ変換しない |
| performance.json | 姫scopeの2group規定ゲート成功 | 上のcold/画材別/代理値の限界を保持。全10新方式の性能ではない |

lint/typecheck/demo build成功は実装担当からの報告と固定build現物で確認したが、この監査で個別の終了ログを再実行していない。I19固定sourceが検査後も同じであることはSHA照合で確認した。新たな全体再実行やI20修正版の証拠は、存在を確認してから追記する。

## レビュー範囲の限界

このworkspaceはGit repositoryとして認識されず、commit差分は取得できなかった。代わりにSHA一致を確認した旧f3c snapshotへgit diff --no-indexでactual source差分を照合した。独立の再描画や新規ブラウザ操作は開始せず、保存済み画像の主観的な目視評価は別監査の範囲。本home原画と同等か、初期線画のどれを人間が採るか、全材質/全scene/残る9枚/Android実機/外部認証同期/長時間heap/物理present/新Visual baselineは未確認。I20でsourceや素材が変われば、I19固定成功はその新identity全体の成功ではない。

## 追補1 — I22 / I23 修正版2の独立再監査

2026-10-10 JST。初回FAIL原文を保持した追補。適用基準は `docs/storybook-improvement.md:44` / `45` / `53` / `255`〜261。I22「黒目の部分は白くして」と、I23の戻るボタン・小さい画像・線画プレビューへの修正を区別して扱う。I20の却下を撤回した人間承認は受領していない。

**修正版2判定：限定FAIL／未完了。白い未着色眼と着色後加工の分離、不要iris取得の除去、旧作品copy・schema・旧v3画素保全には今回の技術的証拠がある。ただしP05の新性能runは規定FAIL。P01の人間による表情採用、全10の受入、正式採用、全体READYは未確認のまま。**

今回この担当が実行したのは固定現物のSHA照合、JSON/SVGデータ照合、旧snapshotとの差分、欠落実行ファイルに対する小さなspawnSync負例の確認だけ。Unit398、Chrome8、native21画像生成、offline、性能測定をこの担当は再実行していない。下記は全て修正版2の新しい保存ログを読み取った結果であり、初回の成功数を合算していない。

### 修正版2の固定identityと独立照合

| 対象 | 値 / 結果 |
| --- | --- |
| 固定identity | `test-results/princess-master/revision-2/identity-before-audit.json`、recordedAt `2026-10-09T16:23:43.324Z` |
| build SHA256 | `a6274daaad6556ae5a4e7ceb1dfa278258a30c9fb277c561206a193e5fe7e86c` |
| source SHA256 | `a72b8024701618dd9855c9247b5b20310459bf7fa24c9b692094260eaaf1591e` |
| template / JSON bytes SHA256 | `gen-princess-bunny-v6-master-v3` / `a1a88829b5247fc784354c885f32694d3d31a68ad56f7e80525c124b8d16d982` |
| canonical contentHash | `079b9cfe87ae79756821185439768bdcca8508b49d9c5f0f7cd5ae8ea666fba6` |
| 初期線画source / SHA256 | `content/generated-lineart/originals/princess-v2.png` / `3e02b14563366581e728ddca6925ddde7c1118b275e2c5055741bbb9dad862a7`。manifestと現物一致 |
| 現物照合 | source59、identity harness4、pilot harness14、build735の不一致0。読取照合時刻 `2026-10-09T16:26:15.142Z` |
| native証拠の照合 | `revision-2/native/evidence.json` のtemplate SHAは今回の固定候補と一致。21画像のSHA・PNG寸法の不一致0。画像生成をこの担当が実行したという意味ではない |
| 承認 | 新QA `pass:false`、manifest `humanApproved:false`、reviewは新contentHashの`author-technical`。旧承認を転用していない |

初回I19から変更されたruntime sourceは8件（Brand、Gallery、Home、styles、master-eye、painting、storybook-engine、shared-types）、削除0。陰影map・masterのSHAは初回と同じだが、初回の性能やUI成功を今回へ転記していない。親担当から次の性能修正へ進む通知を受けているため、この追補は上記固定identityの判定に限定する。

### PM-E01の再確認 — 分離実装は確認、人間受入は保留

- `scripts/build-princess-blank-eyes.mjs:10`〜39は初期`princess-v2.png`の4cropから黒成分を抽出し、crop端に触れる成分と8画素未満の成分を落とす。輪郭をfitし、空path・非正寸法を拒否して既存の眼geometryの中心と幅・高さの92%に合わせる。新しい画像生成や原画編集を行う処理ではない。
- `master-eye.ts:15`〜17は未着色時に白opening＋専用inkをeven-oddで描いてreturnし、finished側の虹彩・黒い瞳孔・反射・まぶたを重ねない。着色時は同ファイル:19〜48の既存native処理へ入る。古いmaster-v1のblankGuide fallbackも:41〜48に残る。
- `painting.ts:24` / `35`は旧`simple-guide-v4`を許容しつつ、新`friendly-ink-v4`のblankInkPath欠落を拒否する。builderの空cropガードと合わせて今回unitの欠落データ試験が成功。任意のSVG文字列の幾何学的妥当性全般をvalidatorが証明するものではない。
- `build-princess-master.mjs:112`のSVGと、`storybook-engine.ts:41` / `78`でCanvasへ渡す4本のblankInkPathが全て同一文字列、manifestの4本とも一致することを独立確認した。両surfaceとも白opening＋even-odd ink。これは共通制作データの一致であり、SVG/Canvas各rasterizerの全画素一致を新たに測った証拠ではない。
- 今回unitは片眼/両眼、highlight redirect、single/group erase後のexact blank復帰を検査し成功。Chromeの眼試験も黒/青、片眼維持、reload、実PNG内の全4眼の主反射pixelを検査し成功。unitのSVG検査は4tag/旧ellipse・circle無しという構造assertであり、瞳の白面積を数値assertする試験ではない。
- 判定は**I22に対応する技術分離を確認**まで。I20で却下された初回候補の人間評価を上書きせず、新候補の「怖くない」「初期表情として採用」の人間受入は保留する。I23のUI・線画プレビューの主観受入も別。

### PM-E02の再確認 — 解消

`build-princess-master.mjs:103`でv4 profileからirisを削除し、今回JSON・native evidenceのmediumAssetsはpaper/wax/pencil/formの4件だけ。`painting-media.ts:7`は依然全entriesを取得するため、新候補のdisplay/thumbnail/export共通loaderへ未使用irisは渡らない。builderとprofileの対応を確認し、今回unitもiris欠落をassertして成功している。

form20MiB＋3素材×1MiB＝23MiB。`storybook-engine.ts:28`の32MiB tile cap、canvas image cacheの32MiB capは変更なし。32MiBは各cacheの明示上限であり、同時decode・active参照・display/export canvasを含む全heap上限ではない。今回Chromeではiris URLの非取得そのものを専用assertしていないため、全ネットワークtraceを独立採取したとの主張はしない。旧v3のiris entryと消費経路は保持されている。

### PM-E03の修正版2観測 — P2、P05規定性能ゲートFAIL

`test-results/princess-master/revision-2/performance.json`、measuredAt `2026-10-09T16:33:05.747Z`。CPU4、DPR2、390×844、各画材12色、各group36標本、errors0、Chrome154.0.8037.98。build/sourceは今回固定identityと一致、`buildUnchanged:true`、script SHAも固定harnessと一致。生の全体`pass:false`を保持する。

| group | firstCanvas集約p95 / 最大 | lastCanvas p95 / 最大 | 2rAF代理p95 / 最大 | 指定ゲート |
| --- | --- | --- | --- | --- |
| スカート6領域、最大可視面積 | 91.6 / 2060.8ms | 184.3 / 2242.8ms | 678.9 / 3493.4ms | このgroupだけPASS |
| 髪7領域、最大所属数 | **118.2 / 424.6ms** | 118.6 / 426.8ms | 267.1 / 537.7ms | **100ms超、FAIL** |

画材別firstCanvas p95はスカートがsmooth2060.8 / crayon91.6 / pencil61.1ms、髪がsmooth424.6 / crayon76.2 / pencil118.2ms。指定式を変更せず、髪の36標本集約p95で規定未達と判定する。スカートの集約PASSを全タップ100ms以内へ読み替えない。初回I19の21.4/32.4msを今回の成功値に流用しない。

必要対応は新固定候補で規定性能を満たす変更・再測定。親担当はv4 formのsource crop描画を別revisionへ分離する方針を伝達したが、この追補ではその実装・原因・改善効果は未確認。firstCanvas/lastCanvasはdisplay canvasのdrawImage時刻、2rAFは描画機会の代理であり、変更部位の最初の画素や物理presentを直接検出するものではない。全体B30・実機U04は閉じない。

### PM-E04 — P3、輪郭生成helperの起動失敗が古いtraceを通し得る

`scripts/build-princess-blank-eyes.mjs:31`〜33は`if(proc.status)`だけで失敗判定する。欠落実行ファイルをspawnSyncする小さな負例を独立実行すると`status:null`、`error.code:ENOENT`、現guardはfalseだった。Python起動失敗・signal終了で既存`trace-output.json`が残る条件では、:33のreadへ進み古い輪郭を再利用し得る。推奨修正は`proc.error || proc.status !== 0`の拒否と、今回の成功出力だけを読むこと。

この担当は実helperを失敗させたり、生成物を編集したりしていない。今回候補でこの失敗経路が起きた証拠はなく、現候補のpath/SHA一致を否定するruntime blockerではない。生成工程の低優先度の不備として区別する。

### 旧作品・保存・surfaceの今回の証拠

- 新候補のregions51、details、groups15、opaquePathは旧v3現物と完全一致。upgradeSourcesは旧v1、旧v2、旧v3、master-v1、master-v2の各51IDが全てidentity mapで、upgrade-indexの5入力は今回master-v3へ対応。builder:105 / `Gallery.tsx:483`〜490でmaster-v1/v2にもcopyボタンを許可し、別IDに複製する。現在master-v3にはその旧候補条件が適用されない。
- 初回固定buildのhash付きcontent527件は今回buildにも同一bytesで残る。master-v1 alias、hash JSON、SVGも同一bytes。master-v2のJSON/SVG現物を保持し、今回Chromeの旧v4入力は明示的にmaster-v2（`tests/e2e/storybook-upgrade.spec.ts:16`）。master-v1のUI copyや姫旧v2のUI copyを今回新実行したという証拠はない。
- 今回Chromeは旧v1/v3/master-v2の3copyを新しく実行し、別ID、paint/画材、scene対応、renderer/paintMode、reload、原作Projectのdeep一致、原作PNG寸法を検査して成功（同spec:13〜29）。原作の画素一致まで試験する内容ではない。
- `revision-2/compatibility/after.json`は2026-10-09T16:29:05.371Zの新run。旧v3全10×blank/3画材＝40RGBA記録が保持baselineと完全一致。afterの6engine source SHAも今回現物と一致。320×400 snapshotに限定し、旧v1/v2や全sceneの新pixel oracleへ拡大しない。
- shared-typesの旧snapshotとの差分はPaintingProfile/EyeArtworkの拡張だけ。`Project` / `RegionPaint` / `RegionPaints`は不変、persistence runtime各sourceとlocal.tsは初回固定とも同一SHA、IDBは:40のversion3のまま。SQL開始時byte hashが無いという初回の限界は残る。
- renderer、ArtworkCanvas、artwork-render、Editor、storybook-textureは初回固定と同一SHA。今回もviewport/PNG/thumbnailは同じ眼関数とpaintデータを使う。`storybook-engine.ts:92` / `109`はv4眼だけをtile外へ出しnative描画、:112〜118は共通snapshot/export/thumbnail。
- 新Chrome測定JSONは今回template SHAを保持。倍率1/2/4/2.65/1×DPR1/2/3の15測定でtransform:none、native寸法、保存paint不変をassertして成功。native証拠9倍率画像と共に、全倍率のpixel完全一致や主観AA品質の受入を証明するものではない。
- 今回build735件にoriginals/finished-v1/registered-master/blank-eyesの配布pathなし。新templateは元原画URLを持たない。新Chromeもprivate master非取得をassertし成功した。

### 修正版2の提供ログと残る限界

| 新しい保存結果 | 読取結果 | 判定の範囲 |
| --- | --- | --- |
| `revision-2/unit-all.json` | 398/398、success:true、failed0 | 姫8件、旧90条件描画matrix、cloud fixtureも今回成功。初回の397/398失敗runを変更しない |
| `revision-2/browser/results.json` | 8/8、skipped0、unexpected0、flaky0、errors0 | 眼1、master操作/3DPR1、menu3、旧copy3。Chromeのみ |
| `revision-2/native/evidence.json` | 21画像、新template SHA、全画像hash/寸法照合一致 | 自由4配色、3画材、native倍率、reference reconstructionの生成記録。人間受入ではない |
| `revision-2/compatibility/after.json` | unchanged:true、40記録完全一致 | 旧v3全10の限定snapshot。今回新run |
| `revision-2/offline/results.json` | 1/1、unexpected0、flaky0、errors0 | 新候補で既存PWA offline reload/paint/scene/edit試験が成功。実機や全sceneではない |
| `revision-2/performance.json` | **pass:false**、固定build/source一致 | 髪集約p95未達を保持。追加revisionの結果は別監査 |

以上の固定範囲ではP02〜P04の技術条件、PM-E02の必要素材条件は限定PASS。P01は分離実装を確認して人間受入保留、P05は規定性能FAIL。menu3サイズのログは存在するが、I23の主観評価・全体UI品質をこのengine監査で代行しない。包括メモリ、長時間、Android実機、外部認証同期、全10の新方式、正式採用は未確認。次のruntime変更は新identityと新証拠で再確認する。

## 追補2 — revision-3のcrop描画・保全・最終限定判定

2026-10-10 JST。上記初回FAILと追補1を保持する。**revision-3も限定FAIL／未完了。cropの今回の描画保全とPM-E04修正は確認したが、新しいP05性能ゲートは全体FAIL。人間採用・全10受入・全体READYを主張しない。** 適用基準は同じP05/M32と `AGENTS.md:18`。閾値・評価式・承認を変更していない。

### 固定対象とこの担当の独立確認

| 対象 | 値 / 照合結果 |
| --- | --- |
| 固定identity | `test-results/princess-master/revision-3/identity-before-audit.json`、recordedAt `2026-10-09T16:51:06.124Z` |
| build SHA256 | `7aaa080425b7b6f28d868fa2b47d1454844166d5b106b13676d78891e84f4cda` |
| source SHA256 | `7f36c84f69c81bb3cfa222295038824fe01954c50c0e9849eb9ae730a69f8f2c` |
| runtime差分 | revision-2から`storybook-texture.ts`だけ変更、他58sourceは同一、削除0 |
| texture旧 / 新SHA256 | `1289e8ea8a84786e45b70d11bde19dc609f95552dacffc0bc59c5ae3e329e973` / `e0dc1c8df2e7aaa2bb05ae6a2b35e3fbb774c69f1d7dcce24463980e096e0256` |
| 現物照合 | source59、identity harness4、pilot harness15、build735、revision-2のcontent675件を照合して不一致0。照合時刻 `2026-10-09T16:58:26.806Z` |
| template | master-v3 JSON bytes SHA `a1a88829b5247fc784354c885f32694d3d31a68ad56f7e80525c124b8d16d982`、contentHash `079b9cfe87ae79756821185439768bdcca8508b49d9c5f0f7cd5ae8ea666fba6`。眼・map・mask・catalog・copy mapを含めrevision-2と同一bytes |

この担当が今回実行したのは読み取り、hash/JSON比較、frozen textureとのdiff、Path2Dのbounds計算、helperのguardだけを取り出した小さな負例確認。画像の生成・再描画、Unit、Chrome、offline、性能測定は実行していない。以下の新run成績は保存ログの確認であり、この担当による試験実行数へ数えない。

### v4 source cropの安全性と旧描画保全

`packages/coloring-engine/src/storybook-texture.ts:137`〜140は元の全map描画を、region bounds＋16world pxの整数source pixel矩形に変える。source原点を`(sx/rx, sy/ry)`、幅・高さも同じ比でworldへ戻すため、元mapのworld原点と倍率を維持する。coverage clip（:92）、選択色、画材pressure、hard-light/alpha、眼処理、v3以下の陰影処理は変更されていない。frozen sourceとの実diffもこのdrawImage置換とコメントだけだった。

master-v1/v2/v3それぞれの非眼43領域について、現物coveragePathのtight boundsと実装のcrop式を独立に比較した。全129領域でsource座標が整数・画像内・正寸法、coverage boundsからcrop端までの最小余白は16world px。source幅は最小79px、高さは最小82pxだった。現候補のclipをcrop矩形が欠落させる形は認めない。一方、任意の新geometry、任意の縮小率、全ブラウザのhigh-quality filter幅まで保証する検査ではない。

- 新`revision-3/native-comparison.json`は21画像すべてchangedChannels0/maxDelta0。現物21画像をhash/PNG寸法で照合し、各画像はrevision-2の対応画像と**PNG bytes自体も一致**、旧側も保存metadataのSHAと一致した。今回のblank、4配色、3画材の2048出力、reference、1/2/4倍×DPR1/2/3のnative画像でcrop前後の見た目を保持する証拠。全色・全scene・全倍率のoracleではない。
- `revision-3/legacy-master-equivalence.json`の8状態は、旧master-v1/v2候補（いずれもPaintingProfile4）×blank/smooth/crayon/pencilの320×400 snapshot。`scripts/check-princess-crop-equivalence.mjs:7` / `12`は保持した旧textureだけをVite load hookへ差し込み、別serverで現textureと比較する。他58runtime sourceは同一SHAなので今回の変更を分離した比較になっている。frozen現物のSHAはrevision-2の旧textureと一致し、after SHA・template SHAも現物に一致、before/afterの各8RGBA hashが一致した。旧renderer v1/v2そのものの新pixel oracleという意味ではない。
- 新`revision-3/compatibility/after.json`は2026-10-09T16:54:48.267Zのrun。旧v3全10の40RGBA記録が保持baselineと完全一致、6engine source SHAも今回現物に一致。旧40成功を転記した結果ではない。
- 最新content675件がrevision-2と同一bytes、保存層・shared-types・renderer等の58runtime sourceも不変。したがってschema/IDB version3、旧作品別copy、private master非配布の実差分はない。今回Chromeの旧v1/v3/master-v2別copyも新しく成功したが、master-v1と旧姫v2のUI copy、500/quota、外部同期を今回新実行した証拠はない。
- form自体のdecodeは20MiBのまま。今回のcropは描くsource範囲を限定する変更であり、画像decodeや全heapを減らしたとの証拠ではない。各32MiB cache上限と全heap上限を区別する限界も継続する。

### PM-E04の再確認 — 解消

`scripts/build-princess-blank-eyes.mjs:32`は`proc.error || proc.status !== 0`で拒否するよう修正された。現物からこのguard行だけを取り出し、欠落exeの実spawn結果（status:null/error.code:ENOENT）、模擬nonzero exit、模擬null status、status0の4条件を軽く確認し、前3条件は拒否、成功だけ通過した。実Python helper・素材生成は実行していない。

新guard行を旧1行へ戻した**メモリ上の文字列**のSHAは旧helperの`b6cb27b788317af89a944ce05678dd06fc00dc38635cb53d73bcb0d61bce797b`と一致。helper変更もこの失敗判定だけと確認できる。起動失敗で古いtraceのreadへ進む初回の指摘は解消した。旧報告の指摘原文は保持する。

### PM-E03 / P05 — 2回目の性能ゲート未達を保持して停止

`revision-3/performance.json`、measuredAt `2026-10-09T16:55:43.355Z`。CPU4/DPR2、390×844、各画材12色、各group36標本、errors0、同じChrome154.0.8037.98。build/sourceは今回固定値、scriptは同じ`d01212979732aad117b6e4f2dbf97563db9a6225d87fc82d6d8c3741bb6ac4d2`、`buildUnchanged:true`。生の全体`pass:false`を保持する。

| group | firstCanvas集約p95 / 最大 | lastCanvas p95 / 最大 | 2rAF代理p95 / 最大 | 指定ゲート |
| --- | --- | --- | --- | --- |
| スカート6領域 | **311.2 / 422.1ms** | 339.9 / 442.7ms | 386.0 / 456.7ms | **100ms超、FAIL** |
| 髪7領域 | 34.2 / 183.6ms | 35.7 / 185.7ms | 52.1 / 269.7ms | このgroupだけPASS |

画材別firstCanvas p95はスカートsmooth185.3 / crayon422.1 / pencil311.2ms、髪smooth183.6 / crayon34.2 / pencil30.5ms。髪の集約PASSを「全タップ100ms以内」としない。スカートは36中3標本が100ms超で、色はsmooth `#FFF0F6`、crayon `#FF4FA3`、pencil `#F64C91`。髪は36中1標本（smooth `#FFF0F6`）が100ms超だった。

revision-2の髪118.2ms未達に続き、revision-3も同じP05性能ゲートが未達。cropにより全体の規定を満たしたとはいえず、group間で数値が変わった原因はprofile証拠が無く**未確定**。JIT・decode・raster・GC・他process等へ断定しない。firstCanvas/lastCanvasはdrawImage時刻、2rAFは描画機会の代理という測定限界も保持する。

`AGENTS.md:18`の「同じ失敗が2回続くか進展のない反復になったら、証拠と次の最小手順を残して停止する。」に従う。今回の変更・性能測定の反復はここで停止し、追加のruntime修正や再測定をこの監査から開始しない。次回作業の最小手順は、固定条件を保って遅いスカートの**crayon `#FF4FA3`の単一タップをtrace**し、直前の画材切替・素材準備・cache状態と、pointerupからfirst/lastCanvasまでのscript/draw/raster区間を分けること。trace結果を根拠に次の変更を検討し、現行の閾値を維持する。このtraceは未実行。

### revision-3の新結果と適用限界

| 保存結果 | 読取結果 | 範囲 |
| --- | --- | --- |
| `unit-rendering-isolated.json` | 13/13、success:true、failed0 | 姫8＋storybook5。**今回の全398成功ではない** |
| `native-comparison.json` / `native/evidence.json` | 21/21差0、template SHAと現物hash/寸法一致 | 上記の有限条件。人間採用ではない |
| `legacy-master-equivalence.json` | 旧master2候補×4条件、8/8同一 | 固定旧texture対新texture、320×400 |
| `compatibility/after.json` | 旧v3 40/40同一 | 旧10作品のblank/3画材snapshot |
| `browser/results.json` | 8/8、skipped0/unexpected0/flaky0/errors0 | 眼、master操作/3DPR、menu3、旧copy3の新Chrome run |
| `browser/screens/measurements.json` | 今回template SHA、15測定、native寸法/transform不一致0 | 1/2/4/2.65/1×DPR1/2/3。主観品質の承認ではない |
| `offline/results.json` | 1/1、unexpected0/flaky0/errors0 | 今回候補で既存PWA試験の新run。実機/全sceneではない |
| `performance.json` | **pass:false** | 上記P05未達。旧値や髪だけのPASSで置換しない |

revision-2の全398成功はその固定sourceの履歴として残し、今回の13成功へ合算しない。今回の変更範囲で描画保全は限定PASS、PM-E02とPM-E04は解消、P01の人間受入は保留、P05性能はFAIL。全10新方式、包括メモリ・長時間・Android実機・物理present・外部認証同期・全体UI受入は未確認。最新候補を正式採用またはREADYへ変更する根拠はない。

### menu画像の撮影タイミングの追記

親担当・visual担当から、元`revision-3/browser/menu/`のhome画像の一部は登場アニメーション途中だったと伝達された。元menu試験は画像loadを待つが全cardのopacity完了を待たないため、8件の機能的成功を完成状態の見た目の証明へ置換しない。

別の読取capture `revision-3/capture-settled-menu.mjs:20`〜24は実animation.finishedを待ち、3幅それぞれ全12cardのopacity1を要求している。`browser/menu-settled/evidence.json`（2026-10-09T17:02:00.221Z）は今回build/source、前後不変、errors0を保持。独立にscript SHA `276a6ad828e1ad310087aaf56be3085717197088756cff7d22d044f449f21efa`と6PNGのSHAを照合し不一致0、各幅の12opacityが1であることを確認した。これは追加の全UI試験や性能再測定ではなく、固定runtime/harnessを変更しない別capture。元PNGは保持する。完成したhomeの視覚参照には`menu-settled`を用い、このengine監査では新画像の主観受入を代行しない。
