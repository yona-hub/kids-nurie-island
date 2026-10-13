# 線画制作パイプライン

## I25の生成操作UI（2026-10-10）

パレット本体/色見本alpha/12色島/画材/背景枠/主要導線/ロゴ等25点を標準built-in image_genで個別生成。原本/逐語prompt/標準生成元/SHAは `content/ui-art-v1/manifest.json`・`prompts.json`・`originals/`。`node scripts/build-ui-art-v1.mjs` で原本SHAを確認し、lossless transparent WebPの192pxアイコン・1200×400パレット・128px色見本形状へ正規化、hash16 URLとTS/CSSを生成する。色HEX/日本語名/選択/focusはlive UIで保ち、生成文字や生成配色を実色の値として使わない。

生成dabのsoft alphaは原本のまま、CSSに不透明な実色中心を組み合わせる。`node scripts/build-brand.mjs` は生成ロゴ原本から512px PNGを派生しPWA/OGPへ適用。SVG内WebPは出力欠落したため撤回、OGPではPNGをCanvasへ直接描く。旧ソース/旧ブランド、初回失敗5派生、途中OGPを保存した。

`node scripts/check-ui-art-v1-assets.mjs` と実Chrome/独立目視を併用する。25点の原本/派生SHA、alpha、ブランド非空、実肌色72中心RGBの成功を別の証拠として扱う。人間採用はnot-received、有限画像であり無限解像度と呼ばない。再生成と検証の詳細は [ui-art-v1-progress.md](ui-art-v1-progress.md)。

## I24の新背景・枠（2026-10-10）

線画とは別に、built-in image_genで10不透明景観と20連続意匠枠を個別制作した。逐語prompt/原本/標準生成元/hashは `content/scene-art-v3/manifest.json` と `prompts.json`、原本は同 `originals/`。旧装飾の承認を転記しない。再コンパイルは `node scripts/build-scene-art-v3.mjs`。旧scene builderを実行した場合も新sceneの最終工程はこちらを使う。

新IDはscenic-v3/atelier-v3、旧catalog byteと旧hash URLを保持。背景はopacity1のfull景観、枠は生成比率を保ち4辺に分け、透明開口とbehind-artworkで主役を保護する。原本1122×1402の有限画像であり、無限解像度と呼ばない。技術/表示/互換性の検証範囲と未確認事項は [scene-art-v3-progress.md](scene-art-v3-progress.md)。

実行アプリは領域を解析しない。制作時に閉じたSVGパス、正確な外接枠、固定素材設定、seedをJSONへコンパイルする。原画と解析データは別ファイルに保存する。

## 2026-10-09 ベクター改善候補

`npm run assets:vector`は採用原本のcontent hash/原画SHAを検証し、全10枚を新ID `*-storybook-v2`・profile version 3へ制作する。元の小さい直線contourを誤差0.65世界pxの適応Bezierへ再構築する。`trace_storybook_ink.py`のnested boundary graphを`shared-boundaries.mjs`で一度fitし、同じ境界を墨/意味領域/hitへ供給する。眼の親領域は旧眼縁を回収し、制作openingをboolean Differenceで抜く。交差/穴のparityを明示し、bounding boxだけで近くの鼻・口まで消さない。

白筋の初回修正、犬/亀の鼻口保護、男の子r15の旧外まぶた回収、姫の視線/瞳縁/反射調整は別revisionの証拠を保持する。スポーツカーのライト脇の孤立白点は、旧compilerが作った固定白detail2件の重なりと特定した。`vector-detail-retirements.mjs`はこの2source path SHAだけを新版から除外し、本来のタイヤ反射3件と全旧データを保持する。背景の穴と誤分類して隙間を加工する案は撤回した。

働く車の原画とホーム島は標準画像生成で顔を除去。原本/prompt/hashは`content/vector-generated/faceless-vehicle-generation.json`、新原本は同`originals/`、原画の領域QAは同`faceless-source/`。削除した旧顔region5件はupgrade mapへ入れない。車両の実部品と細い機械jointは別に操作検査する。

出力は`content/vector-generated/compiled/`、immutable hash URLは`apps/web/public/content/`。QAの`pass:false`と`author-technical`レビューは候補を表す。旧採用を新hashへ転記せず、本番buildの人間承認gateも無効化しない。技術検査・独立目視・人間採用・全体release判定の進行は [統合計画](storybook-improvement.md) に記録する。

## 画像生成の新セットへの移行

ユーザーの更新指示により、新規カタログは画像生成した白地・黒線の10原画へ移行する。旧手作りSVG10枚は既存作品の再編集専用として保持する。画像方針は `docs/user-art-decisions.md`、生成プロンプトと原画は `content/generated-lineart/prompts.json` / `originals/` に保存する。新規の着色見本は配信しない。内部の領域色分けは検査用途だけに使う。

生成原画の手順:

```sh
python tools/asset-pipeline/compile-generated.py --advisory-count
node tools/asset-pipeline/author-generated.mjs
python tools/asset-pipeline/compile-generated.py --advisory-count
npx vitest run tests/assets-generated-interaction.test.ts
python tools/asset-pipeline/compile-generated.py --advisory-count
node tools/asset-pipeline/review-generated.mjs
node tools/asset-pipeline/import.mjs tools/asset-pipeline/output/<new-id>
```

番号付き原画を目視して日本語名・素材・背景・線切れ候補の注釈を作成してから `author-generated.mjs` を実行する。このコマンド自体は新原画の意味を自動承認しない。操作証拠を再生成したら再コンパイルし、証拠のバイト列hashを固定する。部分操作検査は環境変数 `GENERATED_TEMPLATE_IDS=ID1,ID2` を使う。

`--fit-safe-page` は原画全体を切り抜かず・引き伸ばさず、1600×2000へ等比配置する。scale・offsetと128px安全余白を記録し、原画のバイト列を保持する。低解像度画像を拡大しても合格にしない。黒線はclose前の原画から独立したfilled contourにする。`lineWidth: 0` とdetailsの `strokeWidth: 0` により二重の輪郭を足さず、手描きの別絵へ置き換えない。

領域数は仕様の「約」を受け、`--advisory-count` で実数と目安を記録して超過を警告にする。幅24pxも目安だが一括緩和しない。17〜24pxは部位ごとの理由と、原画像hash・path hashに一致する4×拡大での選択・着色・消去の実測証拠がある場合だけ警告付き例外とする。17px未満の主役は今回の例外対象外として原画像を再生成する。真の漏れや選べない領域を合格へ変えない。

操作証拠は本体ColoringEngineで390×844画面の344×430表示、整数CSS座標往復、直接hit/assist、表示と2048×2560 PNGの画素、消去後の白黒一致を測定する。中心の±4/±8 CSS pxの8方向も測定し競合IDを残す。自動で到達できることは、幼児の実機での操作の容易さを意味しない。

囲まれた枝間・脚間などの外背景は、原画を目視した `role: background` 注釈で除外する。除外前の領域IDを保ち、番号を繰り上げない。重なった線にできた微小白点に限り `role: line-detail` とし、原画の白いdetailとして見た目を保てる。通常の塗り面はこの方法で除外できない。9px closeがまつ毛・開いたしわ・同素材の接続を分割した候補は場所と理由を残し、未確認候補を不合格のままにする。

顔・髪・服・毛・金属・ガラス等は日本語名と意味で分類し信頼度を記録する。瞳と内部の白く残せるハイライトは別ID・別名とし、`eye-region-map.json` へ対応を記録する。両方とも `highlight: false, shade: false, texture: 0` とし、自動反射光を追加しない。

取り込み時に原画像・白黒画像・template JSON・注釈・幅例外の実測証拠のSHA-256を確認する。`content/generated-lineart/compiled/<id>/` に固定パッケージを保存する。幅例外の証拠は `interaction-<SHA-256>.json` として保持し、後日の操作検査で以前の根拠を書き換えない。人間承認は別工程。画像修正の指示を承認に読み替えず、本番guardのhuman+hash+QAを維持する。

人間承認前の技術証拠補足は `import.mjs --refresh-evidence` で原画SHA・領域ID/順序/path・黒線detailの一致を確認したうえで更新できる。変更前の証拠バイト列を `evidence-history/<SHA>-<filename>` に保存する。原画や形状の変更、人間承認済みパッケージの自動更新は拒否する。既に公開したimmutable URLは保持する。これは承認の偽造や形状変更の抜け道ではない。

公開pathの実寸rasterでも幅を再測定する。原画maskとの1px前後の境界差で24px未満となった部位は `secondaryUsableDiameter` を個別注釈へ記録し、同じpathの4×操作証拠に結び付ける。元の幅と再描画の幅の両方を残し、閾値を変更しない。runtime再描画の検査maskは `runtime-analysis-mask.png` とし、compilerの `analysis-mask.png` を上書きしない。

新規配信のJSONと白黒PNGもSHA-256付きURLを使う。互換フィールド `coloredThumbnailUrl` は同じ白黒PNGを指し、着色見本を作らない。最新測定は `content/generated-lineart/qa-latest.json`、白黒一覧は `tools/asset-pipeline/output/generated-lineart-review.png`。個別QAと10件全体の完成は分け、buildの `qa-summary.json` に `activeSetComplete` を記録する。旧10件のPASSを新原画のPASSへ流用しない。

## 実行

```sh
npm run assets:build
npm run assets:review
npx vitest run tests/assets.test.ts
python tests/assets_raster_test.py
python tools/asset-pipeline/audit_native.py
```

制作確認画面は `http://127.0.0.1:4318`。本体とは独立したローカル限定サーバーである。Nodeの依存は本体の開発依存と共通だが、本体bundleに制作処理を含めない。環境変数 `ASSET_REVIEW_PORT` でポートを変更できる。

Python側の依存は次でプロジェクト内へ隔離して導入できる。`compile_raster.py` はこのフォルダを自動検出する。

```sh
python -m pip install --target .local/python-packages -r tools/asset-pipeline/requirements.txt
```

この端末で利用したPythonは `C:\Users\yonaf\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`。共有runtimeには追加インストールしていない。固定依存はOpenCV 4.13.0.92 / NumPy 2.2.6。

## ネイティブSVG原画

旧10枚は `tools/asset-pipeline/artwork.mjs` の手作り曲線を正規原画としていた。現在は新規採用から除外し、以下の工程と検証履歴を既存作品の互換用に保持する。

`build.mjs` の工程:

1. 原画の各閉パスからSkiaの `computeTightBounds` で厳密な外接枠を得る。
2. `content/templates/reviews/{id}.json` の確認済み素材設定を適用する。
3. 1600×2000、12px黒線、128px安全マージン、閉領域、領域数、素材ID、可視面積、白黒率を検査する。
4. 前後関係を解決した領域ID rasterを生成し、全領域に可視部分が残ることを検査する。`analysis-region-ids.png` と二値 `analysis-mask.png` は原画とは別に保存する。
5. `content/templates/` に原画SVG・着色例SVG・JSON、`content/qa/` に検査結果を保存する。
6. `tools/asset-pipeline/output/` に原画PNG、領域色分けPNG、全10枚の白黒/着色コンタクトシートを作成する。
7. 原画・素材のSHA-256が承認記録と一致し、QAを通過したものだけ `apps/web/public/content/` に出力する。公開済み領域ID・順序・パスの変更は新しいtemplate IDを要求する。

公開JSON、白黒SVG、着色例SVG、背景・フレームSVGは、出力バイト列のSHA-256をファイル名へ含める。例は `templates/princess-bunny.<64桁hash>.json`。同一内容は同じURLとなり、更新内容は新しいURLへ追加される。旧revisionを上書き・削除しない。`catalog.json` / `backgrounds.json` / `frames.json` は最新のimmutable URLを指す。既存固定名は旧クライアント・掲載終了素材の互換aliasとして保持し、現在revisionとバイト列が同一であることをテストする。

承認の `templateHash` は「approvedフラグを除いたテンプレート内容」の検査用で、URLのhashは「公開ファイルのバイト列」の検査用。役割が異なるため混同しない。本番公開guardはカタログが指すJSONに対して人間承認・承認hash一致・現在のQA合格を検査する。素材revisionの導入は承認種別を変更しない。

後ろの領域から順に描画し、最後に目・口・木目等の細線を描く。白下地は領域パスそのものなので、背景を変えても未着色の主役は白く保たれる。元パスは必ず `Z` で閉じるため、ネイティブ原画に対する近似的な画像領域推測は不要。

## PNG等の任意原画

```sh
python tools/asset-pipeline/compile_raster.py drawing.png \
  --id new-animals --theme animals --title "もりの なかまたち" \
  --expected-min 20 --expected-max 25 \
  --output tools/asset-pipeline/output/new-animals
```

原画の完全なコピーとハッシュを保存してから、グレースケール化 → 二値化 → 3×3 Morphological Close → Connected Components → QA → `findContours` → SVG Path の順に処理する。色付き原画・グレー過多・極小領域・巨大領域・低解像度・4:5以外・安全マージン超過・想定数不足・異常contourは不合格。

1〜3pxの軽微な線切れを解析maskだけで修復する。9×9 closeは大きな線切れの検出比較にのみ使用し、補完結果を採用しない。1px dilationも候補画像として分離し、自動承認には使わない。入力ごとに期待領域数を必須指定するので、背景へ漏れて失われた領域を「正しい領域数」と誤認しない。

背景の連結成分はキャンバス四辺へつながるものとして除外する。領域幅は距離変換で24pxの塗れる幅が存在するか確認し、星や葉の自然に細くなる先端は不必要に除去しない。穴の輪郭は反対の巻き方向を保つ。細部を含む原画の黒線は別のfilled-path layerへ変換し、解析補正した線を原画に上書きしない。

出力は `original.*`、`grayscale.png`、`analysis-mask.png`、`analysis-dilate-candidate.png`、領域別mask、`debug-regions.png`、`regions.svg`、`template.json`、`qa.json`。ラスタからの素材推定は「標準・信頼度0.25」で始め、承認済みと扱わない。出力パッケージを正規原画へ取り込む前に、日本語の領域名・素材・陰影・細部を確認する。

QA合格パッケージは `node tools/asset-pipeline/import.mjs <出力フォルダ>` で `content/templates/imported/` へ登録できる。既存IDは上書きせず、未承認のままbuildする。制作確認サーバーを再起動すると確認一覧に現れ、素材修正・承認を経て公開できる。追加分も既定10枚と同じbuild/QA/承認ゲートを通る。コンタクトシートは10枚単位に分割し、420枚へ増えたときも巨大な画像を一度に確保しない。

## 確認画面と公開ゲート

原画 / 領域色分け / 素材色分け / なめらか / クレヨン / 色えんぴつの6面を表示する。3画材は本体の `ColoringEngine` を直接読み込むため、確認用の別表現ではない。領域名、素材、信頼度、陰影、ハイライト、質感強度、固定方向を日本語UIで修正できる。

「修正を保存・承認を解除」は設定を保存し、公開を取り消す。「承認して保存」は確認者記入と全領域の確認checkboxを要求する。編集後の設定に、公開buildと共通の `inspectTemplate` を読み取り専用で実行し、合格してから `kind: human` を記録する。不合格はHTTP 409と編集後QAを返し、保存済み設定・承認・公開ファイルを変更しない。画面も「編集中の設定は保存・承認されていません」と指摘箇所を表示する。保存後のbuild結果もQA・承認hash・公開フラグを照合し、後続失敗は以前のレビューへ復元してHTTP 500を返す。クライアントも合否・承認種別・hashが矛盾するHTTP 200を成功表示しない。下書きの保存は不合格の編集も保持できるが、承認解除とQA不合格を明示する。

保存成功後は返された最新データから入力表と6面プレビューを再構築する。以前の領域オブジェクトへ変更を書き続けることはない。保存中は領域入力・確認者・確認checkboxと操作ボタンを無効化し、送信後の変更が応答で消えることを防ぐ。`node tests/assets-review-approval.mjs` は実HTTPとChromium、メモリだけの保存先を使い、再読込なしの「編集→下書き保存→別編集→下書き保存→別編集→承認」で7項目・プレビューhash・送信値・保存値・承認hashの一致を確認する。実際の承認ファイルはSHA-256まで不変を要求する。再監査での連続編集不具合は修正前に2回目のプレビュー更新が失敗し、修正後に成功した。

POSTはlocalhostのHost/Origin、セッションごとのCSRF token、JSON型・サイズ・許可フィールドを検査する。

初期プロトタイプの10枚は、2026-10-06に制作したエージェントがコンタクトシートと機械検査を確認し、`kind: author-technical` として記録した。これは人間による内容・著作権・年齢適合の承認ではない。公開前には人間確認が必要。承認種別・根拠・原画hashを明示し、人間確認済みとは表示しない。

制作担当が技術確認を済ませたときに限り `node tools/asset-pipeline/build.mjs --approve-author` でその記録を更新できる。通常のbuildは承認を新規作成しない。承認後のパス・素材変更はhash不一致となり、一覧から外れる。既存の保存作品を再表示できるよう、以前に承認されたruntimeパッケージは保持する。未承認の変更内容はそのパッケージへ反映しない。以前の承認根拠は `reviews/history/{id}/{hash}.json` へ保存する。

## 検証記録

2026-10-06: 全10枚302領域のnative QA合格。`tests/assets.test.ts` は10枚の契約・SHA-256承認一致・閉領域・全可視領域・安全マージン、および21フレームの内側100px以降の透明性を検査する。

`tests/assets_raster_test.py` の4ケースは、完全な閉領域、2px修復、8pxの大きな切れ拒否、微小領域拒否を検査する。全ケースで元PNGのバイト列が変わらないことと、コンパイル結果が未承認であることも検査する。

`audit_native.py` は可視region maskへOpenCVの距離変換をかけ、全302領域に24px以上の塗れる幅があることを検査する。全10枚が合格。最初の検査で犬のしっぽが他の領域に隠れて20px幅しかなかったため、形状を広げて再検査した。

`tests/assets-review.mjs` はChromiumの実表示で6つの異なる比較canvas、35/39領域の切替、素材の編集、確認不足時の承認拒否、CSRF拒否、console errorが0件であることを検証した。確認者としての人間承認記録は自動作成しない。

A02-02修正: `tests/assets-cache.test.ts` は実WorkboxのNetworkFirst/CacheFirst/ExpirationPluginとアプリの実loaderを接続し、同IDの質感0.35→0、背景・フレームのrevision更新、worker置換、最新カタログだけ取得した状態での旧revisionオフライン復元、固定URLの移行、420件中1件だけの取得を検証する。`tests/assets-revisions.test.ts` は旧revisionの保持、同じURLでの内容不一致拒否、破壊的変更への新ID要求を検証する。

人間による美術確認と実機でのタップしやすさは、自動検査の代わりにしない。

2026-10-07 画像生成版: 新規10枚408領域がcompiler QAと公開path QAを通過。未確認の大切れ候補0、極小の塗り領域0、素材確認待ち0。27領域の幅例外は各部位の理由と固定済み4×操作証拠に紐付けた。瞳22個とハイライト22個を独立した領域として `eye-region-map.json` に記録し、自動反射光を無効にした。

最終原画は princess-v6 / magic-v6 / animals-v4 / ocean-v2 / dinosaurs-v4 / vehicles-v2 / construction-v2 / robots-v2 / space-v5 / flowers-v2。技術確認時の `author-technical` 記録に続き、下記のユーザー正式採用回答を受けて全10件を `human` 承認へ更新した。旧10件302領域は掲載を終了し、再編集用ファイルを維持する。

新セットの検査は素材・immutable配信・キャッシュ・証拠改変拒否・承認gateの21テスト（実Workboxによる白黒PNGの更新と旧版offline保持を含む）とPythonの8ケースが成功。実Chromiumの `tests/assets-generated-review.mjs` では原画欄の画素一致、6面比較、日本語編集、瞳の反射光無効、確認不足とCSRFの拒否、承認記録不変、console error 0を確認した。スクリーンショットと結果JSONは `tools/asset-pipeline/output/generated-review-*`。制作ツールはHMRを使わず、不要な開発用WebSocket接続を行わない。

## A06監査への修正と独立再検査（2026-10-07）

`analysis-region-ids.json` にRGBパレット、実際のraster寸法、論理寸法、template hash、PNGのSHA-256を出力する。`audit_native.py` はこのメタデータを検証し、旧Nativeの赤チャンネル連番・800×1000と、生成原画のRGBパレット・1600×2000の両方を同じ論理座標へ復号する。アンチエイリアスの混色はIDと取り違えず、可視面積・連結成分・距離幅を測る。距離は近似chamfer値ではなくOpenCV `DIST_L2 / DIST_MASK_PRECISE` のEuclidean距離を用いる。メタデータ不在・hash不一致・重複色・寸法違いは合格にしない。

新旧20枚710領域の独立測定は合格。個別の幅例外適用は30領域。元compilerの27領域に加え、公開path再描画で23.4094pxとなるカメの口・車のドアの取っ手・車の右奥タイヤを、既存の固定済み操作証拠に基づき追加した。±4/±8 CSS px各8点でdirect/assist成功、他領域誤選択0を確認済み。

既存例外の猫の鼻 `gen-tree-friends-v4/r28` は元mask18.394px、公開pathの従来値16.97px、exact16.970562px。左耳下の髪 `gen-wizard-lantern-v6/r14` は元mask18.788px、従来値17.66px、exact16.492422px。原画mask→contour→完全一致ID色の画素化による縮小と、距離近似法の差によるもの。同一pathで中心の選択・塗り・消去・PNG検査に成功し、±4/±8 CSS pxのassistは両者とも8/8、他領域誤選択0だった。±8でdirect成功は鼻5/8、髪7/8のため、補助選択の寄与も記録した。この2件のみ個別に暫定17px選別の例外とし、他の部位へ拡張しない。幼児の実機での容易さは未確認。

この5件の原画hash・path hash・ID画像hash・exact測定値・理由・制約は `content/generated-lineart/runtime-distance-review.json`、操作証拠の固定コピーは同階層の `runtime-distance-evidence/`。独立QAはその証拠を再検証し、測定値が変われば例外を失効させる。`tests/assets_native_audit_test.py` は両形式の既知矩形からID・面積・幅を確認し、古いhash・寸法・曖昧な色・無条件の17px未満除外・古い個別測定の再利用を拒否する。

`tests/assets-review-approval.test.ts` は保存をメモリに隔離して実POST処理を検査する。`node tests/assets-review-approval.mjs --http-only` は実HTTP、引数なしでは実Chromiumの制作UIも通す。瞳のハイライト有効化と信頼度0.25はHTTP 409で保存0件、正常な素材変更はHTTP 200でQA・hash・承認が一致する。後続生成失敗はHTTP 500で以前の記録を復元し、クライアントは矛盾したHTTP 200の成功表示も拒否した。実ファイルへのテスト承認は0件。結果と画面は `test-results/a06-review-*`。

ユーザーの「この10枚を正式採用する」という明示回答後、現在の全10件のQAを再実行してhashを固定し、確認者「ユーザー（Codex会話）」としてhuman承認を記録した。対象と回答範囲は `content/generated-lineart/user-adoption.json`。author-technicalの履歴は各 `reviews/history/<id>/<hash>.author-technical.json` に保存している。原画と領域pathは不変で、assets buildおよび公開用のhuman/hash/QA guardに合格した（`test-results/a06-final-asset-integrity.json`）。制作UIの操作を行ったかのような承認理由にはしていない。

制作UIの連続編集では、保存応答の現行オブジェクトから表とpreviewを再構築する。読込中は編集・保存・承認を無効化し、読込世代と保存対象IDを固定する。古いGETは本文を回収したうえで破棄し、選択中の別線画を上書きしない。保存中は線画の切替も無効化する。未保存の編集は画面内の線画別draftへ保持し、切り替えて戻っても復元する。未保存の内容を人間承認済みと表示しない。通信失敗時は前の線画と編集内容を保持する。

`tests/assets-review-approval.mjs`は、実HTTP/Chromiumとメモリ保存で13ケースを確認する。7項目の連続3編集、GET待機中の保存拒否、GET応答順の逆転、POST待機中の切替拒否、表示ID/送信先/保存値/承認hashの一致、GET・POST失敗後の切替と再試行を含む。保留リクエストは失敗時にも解放する。実際の10件のhuman承認ファイルは前後でバイト不変。

## A06-03：候補説明と原画上の部位の再照合

おひめさまv6の `(732,721)` は、首脇の `r17「右外側の長い髪」` の一部で、3px closeでは同じ髪へ接続し、外周へは接続しない。9px closeだけが524px²を切り離す。`(1216,1254)` はうさぎ耳の付け根の外背景で、3px closeでは外周へつながり、9px closeだけが347px²の出口を塞ぐ。両方を「まぶた」としていた旧説明を訂正した。原画・塗る領域・黒線は変更していない。

他9枚も、候補画像と3px/9px closeの親領域を再計算して照合した。全10枚に12候補があり、内訳は次のとおり。座標は1600×2000の正規化原画座標。

| 線画 | 候補座標 | 3px解析での親領域・接続 |
|---|---|---|
| おひめさま | 732,721 / 1216,1254 | r17の髪 / 耳の付け根の外背景 |
| 恐竜 | 535,366 / 644,1518 | r02の瞳内 / r15の奥の脚内 |
| ショベルカー | 1063,859 / 1437,1314 | r21のドア枠内 / r37の手前キャタピラ内 |
| 海 | 823,1646 | r41の貝がら内 |
| 車 | 494,585 / 271,735 / 1330,907 | r01の左屋根 / 同じr01の左後部パネル / r10の前フェンダー内 |
| 宇宙 | 943,1355 | 左腕と胴体の間の外背景 |
| 花 | 824,639 | チューリップ・茎・葉の間の外背景 |
| 動物・魔法使い・ロボット | なし | 9px close比較で該当候補なし |

新しい `gapReviewSchemaVersion: 2` は、原画SHA-256・候補maskのSHA-256・外接枠・座標・親領域ID・外周接続から `candidateKey` を計算する。`g01` などは表示用番号で、注釈の対応には使わない。`gap-review-plan.json` は原画hashと確認した座標をキーに、candidateKey・親領域名・部位・分類・説明を固定する。`author-generated.mjs` は候補の配列順に説明を割り当てず、未知の候補や対応変更を拒否する。compilerと読み込み側の両方で座標・親領域・接続・説明の一致を検証する。

承認後の技術注釈だけを訂正するときは、`author-generated.mjs --gaps-only`、`compile-generated.py --advisory-count --preserve-evidence`、`refresh-qa-evidence.mjs` を使う。最後の工程は全件を先に検査し、変更可能な内容を候補注釈・候補QA・そのhashに限定する。素材・template・原画・解析mask・公開shape・固定操作証拠が変わる更新は拒否する。`--preserve-evidence` は新しい操作テストの実行日時に引きずられず、以前の承認根拠に結び付いた固定snapshotを検証して維持する。既存のhuman承認ファイルには書き込まない。

今回の変更はQA10件・候補あり注釈7件。更新前のファイルは各保持パッケージの `evidence-history/`、前後hashと既存承認の内容・日時は `content/generated-lineart/technical-updates/a06-03-*.json` に保存した。`user-adoption.json` および全10件の承認内容・日時・contentHashは維持した。

実装側の検証は関連23テスト、Pythonの9ケース、型検査、lint、素材build、公開gateで成功。既知候補の順番入替、原画hash・座標・親領域の誤対応、古い配列順の説明、技術更新への形状・素材変更の混入を拒否する。原画crop一覧は `test-results/a06-03-gap-contact.png`、保護対象ファイルの前後照合は `test-results/a06-03-results.json`。これは修正担当の自己検証であり、独立再監査の合格を表すものではない。
