# I25 肌色と生成UI素材の独立技術監査（2026-10-10）

## 初回固定候補 revision-1

**判定：FAIL（UI-E01の必須修正あり）。** 既存132色の保持、肌24色の追加、通常画面の生成UI接続と列挙したChrome操作は技術範囲で成功している。しかし生成ブランドがPWAアイコン3種とOGPの派生画像から欠落していた。Chrome6成功をブランド派生出力まで拡張しない。修正後は別の固定identityと証拠で追補し、この初回FAILを保持する。

対象は利用者I25「肌色のバリエーションを多くしたい。パレットや島、はいけいアイコン、かざりわくアイコンなど画像生成していないものは画像生成して適用」。`docs/storybook-improvement.md:289` の原文、`:293` の既存132色保持/12島156色、T01〜T04、`:302` の操作記号とイラストの区別を確認した。24という数・HEX・並びは実装側の制作判断であり、利用者が指定した数や新素材への人間採用とは扱わない。旧I24 PASSを新版検証へ転用しない。

監査者は実装担当から独立した子エージェント。実装・検査harness・素材原本・承認・旧監査を変更せず、この新規報告だけを所有する。子/孫、ブラウザ、重い検査、性能測定を起動していない。自ら実施したのは原文読取り、JSON/ファイルSHA照合と、指摘対象の既存PNGを小さなCanvasへdecodeしてpixel分布を読む限定確認だけ。Chrome/typecheck/lint/build/asset検査は提示された生結果を読んだもので、監査者が実行したとはしない。旧P05停止と全体NOT READYを維持する。

**固定identityと証拠の同一性**

- `test-results/ui-art-v1/revision-1/identity-before.json`：`2026-10-10T09:05:16.844Z`。
- 同rev `identity-after.json`：`2026-10-10T09:13:03.225Z`、`unchanged:true`。
- build SHA：`0b85e4d6b69c34ce45c3b8aaea4752d81859de9c3590e6f6c36396b1cfa08bfc`。
- source SHA：`7ef54910ae2acf2a50ebf3dba002c1828d46a50b3939076d6651ab1c62a86c6d`。
- 独立SHA照合 `2026-10-10T09:13:18.8949231Z`：source63、build954、identity用harness4、I25用harness11の全件一致。実在するsource/buildファイル数も63/954。これはUI-E01修正開始前の候補への照合である。
- I24固定sourceからの変更はBrand/main/Editor/Gallery/Home/SW/content-schema/shared-typesの8件、追加はIllustratedIcon/styles-illustrated-ui/styles-ui-art/ui-artの4件。描画engine、persistence、Project schema、scene描画とDB sourceのSHAは同じだった。
- `content/ui-art-v1/before/manifest.json` の8保存sourceをSHA照合し、I24 source inventoryにある対応fileとも一致。旧brand.svg/OGP/PWA3PNGのbeforeコピーもI24 buildのSHAと一致する。I24 buildに存在するhash付きcontent727件を新版build内に同一SHAで保持している。旧作品の動的再描画/同期を今回再実行した証拠ではない。

**原文実装と提示された結果**

| 対象 | 根拠と確認内容 | 判定範囲 |
| --- | --- | --- |
| 132色保持/肌24追加 | `packages/content-schema/src/index.ts:127` の旧11familyと132 HEXはbefore原文からの独立比較で差0。`:168` にskin24と24別ラベルを追加し、全12family/156 HEXが重複なし。shared-types`:2` はColorFamilyIdへskinだけを追加し、Project/RegionPaint schemaは変更しない。 | データ保持PASS。配色の美的判断/人間採用は別。 |
| 選択・保存 | `Editor.tsx:544` はfamily選択、`:559` は動的色数ラベル、`:561` は各HEXをそのまま選択/aria-pressed/日本語ラベル/読み上げへ渡す。`:223` は既存RegionPaint `{color,paintType}` とpaintTargets/applyPaintsを使用する。 | 新familyが既存保存方式へ接続されることを確認。既存色を新値へ置換していない。 |
| 25生成原本/配信 | manifestはbuilt-in image_gen/人間採用not-received。25別sourceFile/25別原本SHA、全25 promptが計画と一致（671〜1254文字）。全原本SHAと全配信WebP SHA/原本参照を独立照合し差0。`build-ui-art-v1.mjs:14` で原本SHA、`:15` でalphaを確認、`:17` でtrim/resizeしてlossless WebPへ変換、`:19` はwx/EEXIST時SHA確認。原本は改変しない。 | 登録/配信同一性PASS。生成を監査者が再実施したという証拠ではない。 |
| UI参照/意味 | `IllustratedIcon.tsx:6` は装飾imgをalt空/aria-hidden/draggable falseにし、操作名は実buttonに残す。Editorの12色島/3画材/消しゴム/パレット/背景/枠、Homeの設定/続き/作品、Galleryの背景/枠/placeholder、BrandへUI_ARTを接続。 `Brand.tsx:27` の既存12テーマ島を再生成する変更はない。 | 指定した通常画面の接続PASS。矢印/チェック/ズーム等の意味あるベクター部品は継続。 |
| CSS/色芯 | `main.tsx:6` 以降のimport順で旧stylesの後に2生成UI CSSを適用。`styles-illustrated-ui.css:65` は不透明なlive-color芯と生成mask外縁を合成し、`:84` は選択輪郭を維持。12島grid/mobile6+6、skinは既存shade gridの4行。focus-visibleは `styles.css:54` の3px輪郭。 | 静的構造と下記72中心pixelで限定PASS。全旧132色のrendered中心pixelを測定したわけではない。 |
| 新UI用SW cache | `sw.ts:23` はsame-origin GETの `/images/ui-art-v1/[a-z-]+-[hash16].webp` を独立CacheFirstへ登録し、`:28` は50entry/90日/quota purge。現25 URLは全てpatternへ一致。従来scene/home image cacheは別に保つ。`vite.config.ts:25` のprecacheには新UI WebPを一括追加していない。 | on-demand設定を確認。初回SW未control時の画像、CSS画像、offline decodeは初回Chrome6に検査がなくUI-E02で未確認。 |
| 生Chrome6件 | `revision-1/browser/results.json` はexpected6/unexpected0/skipped0/flaky0。1200×1000/DPR1、390×844/DPR2、320×568/DPR1の各2ケース。`palette-illustrations.spec.ts:20` は旧132全選択とHEX/aria、肌24を姫の肌4領域へsmoothで保存、crayon/pencil各1例、他region不増加、reloadで最後の4領域保持、完成/2048×2560PNG。 | 列挙した新UI/肌色操作PASS。全156色を全画材で保存/PNG検査したという結果ではない。 |
| 中心pixel/geometry | 同test`:67` は全generated img decode待ち、12島、選択/scene button枠/影、横overflow、44px、背景/枠dialog、最後のshadeのSpace/3px focus/viewport内を確認。`:82`〜`:86` はskin24の未選択見本中心を実PNGから読み、HEX RGBと許容0で比較。3 viewportのui-evidenceを監査者も照合し72点差0。最小操作寸法はdesktop幅67.15625/高44、mobile/smallとも44/44。 | 限定PASS。選択中のcheckに覆われるpixel、全AA外縁、全ブラウザ/実タッチ端末は対象外。 |
| asset/type/lint/build結果 | `asset-integrity.json` は25出力にtransparent/opaque pixel、mask center min252、maskableOpaque:trueを記録。typecheck.log/lint.logはエラー記載なし。build-final.logはdemo build/PWA完了、inlineDynamicImports非推奨等の警告を保持。 | 成功した検査範囲。alpha/寸法だけではブランド欠落を検出できず、UI-E01はこの検査を通っていた。Unit全suite/production公開/性能PASSではない。 |

初期 `initial-mask-failure.json` は「generated mask center not fully opaque」のFAILを保持しており、min252/max253/below255 2304を記録している。mask原本を255へ塗り替えて合格させたのではなく、実装は不透明live-color芯へ変わった。現Chromeの72中心RGB一致がその解決策の限定証拠である。初期に出力先が存在せず未実行だったtypecheck/lint呼出しも、同JSONの履歴から成功へ読み替えない。

**所見と必須修正**

| ID / Severity | 原文の位置と再現/影響 | 必須修正・検証 |
| --- | --- | --- |
| UI-E01 / **P2・FAIL** | `scripts/build-brand.mjs:12` のSVGへ192px WebPをdata:image/webpで埋め、`:17`/`:21` でsharp SVG→PNG、`:39` でSVG→Canvas OGPへ渡す経路で生成島が落ちる。現在のPWA192/512を直接開くと背景だけ。監査者のread-only decodeではopaque RGBが各1種 `232,248,251`、旧192は978種。maskable512も背景/補間の8種だけ。OGP実PNGの左の島欄も空。MainのBrandはWebP直imgなのでChrome6成功と矛盾しない。初回icon192 SHA `76ec1ca6640afcb6391ae698287b38b10384f785644fd8a8f77b8ce78378d697`、OGP SHA `a568cac52d31289f0a3097ea06ecc59441b2aa9766a871757f1e0d3eb2196343`。 | 原本を保持したまま、このPNG派生経路へ生成bitmapが確実に入る方法で再合成する。PWA3種/OGP島領域の非空/実島を確認し、alphaだけの `check-ui-art-v1-assets.mjs:20`〜`:21` に依存しない。修正後の新buildを固定し再確認する。内部decoderの対応事情までは未調査。 |
| UI-E02 / Severity未確定・未検証 | 新SW routeはあるが初回Chrome6はオンラインのみ。旧 `pwa.spec.ts:20` のpaint/scene復元だけでは新25 img/CSS画像のoffline復元を証明しない。Home/BrandがSW control前に読み込まれる初回条件も残る。 | 新UI offline成功を主張する前に、controlled visit、25 URLのcache/decode、offline reloadのimgとCSS画像の実取得、skin保存を限定確認する。これは未検証であり、実装失敗を再現した所見ではない。 |
| UI-E03 / P3・範囲限界 | 全132旧HEXの保持/選択は確認したが、中心RGB完全一致はskin24だけ。PNGは最後のpencil肌色1作品/寸法の検査。全paletteの音声再生、全キーボード順、全DPR/横短画面、全画材×全156色、実外部同期は未検査。 | 現在の列挙範囲を明示し、必要な次の受入時に対象を絞って確認する。旧結果を新版全機能の合格へ転用しない。 |

実装担当はUI-E01を必須修正として受領し、PNGを経由するブランド派生出力と非空検査、UI-E02の追加offline証拠を別revで固定する予定と回答した。予定を解消済みとは扱わない。新原本/通常UIの縮小時の見分けと自然さは別担当の独立視覚監査/人間判断に委ねる。人間採用は未受領、旧P05はFAIL/停止のままであり、この報告から全体READYへ進めない。

## 修正候補 revision-2 と同一実装の revision-3 の追補

**判定：限定PASS（今回のI25技術範囲）。** 初回UI-E01のPWA/OGP欠落は修正後の実画像で解消し、追加offline証拠でUI-E02の既訪問条件を確認した。別担当が検出した初期肌色下段切れも、3幅のfocus前の実座標で解消した。上記初回FAIL本文、初回素材/PNG/trace、途中修正の失敗を保持する。この判定は全体READY、人間採用、旧P05性能FAILの解除、T表の未測定条件の合格ではない。

この追補も原文読取りと限定的な独立SHA/JSON/既存画像確認のみである。下記Chrome・Unit・typecheck・lint・buildは実装担当が実行した生結果を確認したものであり、監査者がそれらを起動したとはしない。実装、検査、基準、承認、旧監査を編集していない。

**修正対象と固定証拠**

- revision-2の `identity-before.json` は `2026-10-10T09:22:26.982Z`、`identity-after.json` は `2026-10-10T09:29:53.104Z`。前後のidentity全体とpilot harnessが一致し、afterは `unchanged:true`。
- revision-3の `identity-before.json` は `2026-10-10T09:31:14.507Z`、`identity-after.json` は `2026-10-10T09:37:03.769Z`。前後のsource/build/identity harness/配信entry、pilot harnessが一致し、afterは `unchanged:true`。
- 両revのbuild SHAは `547dd061e035290c533f2fdf067fbd326ea30ad21524d202a99cff14ac5244b5`、source SHAは `87706559ed4d8deefbc3ab0cefb2a15ea225da52c3f09271dbd90e281dd141d5`。build954/source63の全inventoryはrev2→rev3でも同一である。rev2のChrome6を、別buildの旧PASSとして流用していない。rev3でChrome6を再実行したとも記載しない。
- 監査者の独立再計算 `2026-10-10T09:36:01.462Z` でも実ファイル954/63から得たaggregateが上記と一致した。identity用harness4とI25用16も全件一致。配信UI25のpublic/dist/compiled SHA、brand.svg/PWA3/OGPのpublic/dist SHAに不一致なし。実HTTPの配信entry照合は提示されたidentity原文の確認であり、監査者によるHTTP再取得ではない。
- 初回rev1→修正版rev2のruntime source差は `apps/web/src/styles-illustrated-ui.css` だけ。原本25点、prompts/manifest/compiledは初回と同一SHA。I24 buildのcontent全869件（初回報告のhash名727件を含む）を同一SHAで保持する。旧132色、Project/RegionPaint/schema、描画engine、persistence、DB、scene描画のsource差はこの修正にない。
- `scripts/build-brand.mjs:15`〜`:19` は保持原本からtrim/512px contain PNGを派生しSVGへimage/pngで埋める。`:23`〜`:33` でPWA3種を作り、OGPはSVGのbitmap decode経路を使わず `:50`〜`:51` で同じPNGをCanvasへ直接描く。Main UIは既存192px WebPを維持する。これらの生成スクリプトと成果物変更も新identityへ結び付いている。
- rev2→rev3のpilot harness差分は `tests/e2e/ui-art-offline.spec.ts` だけ。app/SW/build/source変更はない。rev2当時の同test原文を `revision-2/harness/ui-art-offline.spec.ts` に保持し、独立SHA `e47019846035b8a18f7875b1edc3355a284f8abf910da44ce4c72ba5012aaa06` はrev2 identityの記録値と一致する。rev3新testのSHAは `e1c825de634f758a74003a00c00141c2eee7231562cd885906cc765f257ac126`。

**失敗の保持と解消の根拠**

| ID / Severity | 元の失敗と変更 | 修正版の限定判定 |
| --- | --- | --- |
| UI-E01 / P2 | 初回WebP埋込SVGでPWA/OGPの生成島が欠落。`revision-1/brand-failure/record.json` と保存5ファイルを独立SHA照合し、rev1固定inventoryのSHAと全件一致した。PNG埋込だけの中間修正はsharp PWAを直したが、napi SVG経路のOGPは空のままであり、`revision-2/brand-first-repair/ogp.png` と `record.json` を保持。 | **解消・限定PASS**。新 `asset-integrity.json` のPWA192/512/maskable512のRGB種数は10028/60126/35817、OGP島ROI 280×280は21261。maskableは全面opaque。監査者も固定distのicon192とOGPを直接開き、生成したヤシ/砂浜/海の島があることを確認。`check-ui-art-v1-assets.mjs:20`〜`:29` はPWA3/OGP ROIの非空RGB検査を追加している。OSへの実インストール表示や各SNS crawlerは未検査。 |
| UI-E02 / 当初Severity未確定 | rev2追加offlineは0成功1失敗を保持。`:47` の検査用JS fetchでFailed to fetch。監査者が元traceを読んだところ、CSS maskのoffline再取得自体はOrigin付きで200、cached responseはVary: Origin。後続JS fetchにはOriginがなく別variantとなり、SW内部fetchがERR_INTERNET_DISCONNECTED、page側ERR_FAILEDとなる。`offline-request-analysis.json` と失敗trace/PNG/logを保持。この結果だけで実CSS maskの表示失敗とは断定しない。 | **既訪問/controlled条件で限定PASS**。rev3はCSS backgroundを通常Image、maskをcrossOrigin=anonymousのImageで実decodeし、Canvas alphaでtransparent/painted双方を検査する。cache25、offline img、保存/再読込/再接続、clean-console条件は残す。SWのvariant処理や評価閾値を変更した修正ではない。 |
| UI25-V01 / P2（別visual監査の初回所見） | `docs/audits/ui-art-v1-visual-20261010.md:36` の320×568/1200×1000初期肌色下段切れ。旧Chrome6のfocus後の座標は初期収まりの証明ではなかった。新CSS `:87`〜`:108` はdesktop描画領域を残余領域に合わせ、`:133`〜`:139` は短いmobileのskin時min-heightを198pxにする。 | **列挙3幅で解消・限定PASS**。新 `palette-illustrations.spec.ts:80`〜`:82` はfocus前scrollY=0と全24buttonの上下境界を検査し、後述の実JSONが支持する。banner/通知の同時表示、全横短画面、実機の細部塗りやすさは未検証。 |

**提示された新結果の対象範囲**

| 証拠 | 原文で確認した結果と限界 |
| --- | --- |
| `revision-2/browser/results.json` | expected6/unexpected0/flaky0/skipped0、3viewport各2件。旧11family×12色のHEX保持/選択、肌24色の固有HEX/日本語名/選択、24色すべてsmoothで姫肌4領域へ保存。crayonとpencilは各1色。最後のpencil作品だけreloadとPNG2048×2560寸法まで検査。全156色の描画/全PNG実画素比較ではない。 |
| `revision-2/ui-chrome-{desktop,mobile,small}/ui-evidence.json` | 1200×1000/DPR1、390×844/DPR2、320×568/DPR1。初期scrollYは全て0、documentHeightは各viewportHeightと一致。全肌buttonの最大bottomは965/819/555.59375pxで、focus前に画面内。操作最小hitはdesktop67.15625×44px、mobile/small44×44px。focus-visible=true/outline3px。肌24×3の中心72RGBをHEXから独立照合し全て完全一致。描画heightは506.1875/303.984375/193.984375px。 |
| `revision-3/offline/results.json` と `ui-art-offline-chrome/offline-evidence.json` | expected1/unexpected0/flaky0/skipped0。制御済みの再訪後25 URLがcache、offline editor19imgとhome4imgがnaturalWidth>0。CSS boardは1200×400、transparent80451/painted399549、maskは128×128、transparent3884/painted12500。肌r07/r19/r22/r23の#603D2E smooth復元→offline #38221C pencil保存→再接続後保持を確認。未訪問素材/初回offline起動は対象外。 |
| `revision-3/regression/browser/results.json` | expected8/unexpected0/flaky0/skipped0。PC/mobile各4件：削除取消/対象のみ削除/reload、別タブ新保存へのCAS保全、削除失敗の保持/retry、背景枠/Gallery/PNG/duplicateの状態保持。I24全10 scene選択などを今回全再検査した証拠ではない。 |
| `revision-3/unit.json` / `unit.log` | success:true、37/37。実ファイルはassets-cache.test.ts 9、engine-content.test.ts 11、pwa-updates.test.ts 17の3点。VitestのnumTotalTestSuites=6を6fileとは読まない。保持された旧10テンプレート/既存cache/更新gateの関連検査であり、肌156色や全398を新実行した結果ではない。 |
| `revision-2/typecheck.log` / `lint.log` / `build.log`、`revision-3/typecheck.log` / `lint.log` | 修正版のtypecheck/lint/demo build成功ログを確認。test-only修正後の最終型/lintも実装担当がexit0を確認済みと報告し、当該ログにerrorはない。旧398や旧40RGBAのPASSを今回の新実行とは扱わない。buildのinlineDynamicImports deprecation等の既存warningは消去していない。 |

**残る限界と次の受入**

UI-E03の範囲限界を維持する。全132旧色の中心RGBは未測定、全156色×全画材×全出力の実画素比較も未実施。全palette音声、全キーボード順、全DPR/横短画面、banner/通知とskin24の同時表示、実機、実外部同期、installed PWA/外部OGP取得は未検証。T01の文言を全156色の保存/PNG比較まで含める場合、その部分は本証拠で完了とはしない。必要な次の受入では不足する組合せを明示して絞る。

生成25原本はSHA/逐語promptを保持し、metadataのhumanAdoptionはnot-receivedのまま。新素材の人間採用、姫の眼の人間受入、master残9枚、初期/I8未完了、旧P05の同じ性能ゲート2回FAILと停止は閉じない。今回のCSS/ブランド/新UI cacheによる性能の合格を測定なしで推定せず、性能測定も再開していない。I25の列挙した技術修正を確認する限定PASSと、全体NOT READYを併記する。
