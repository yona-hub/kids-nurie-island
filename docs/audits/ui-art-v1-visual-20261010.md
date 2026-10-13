# I25 肌24色・生成UI素材の独立目視監査

監査日: 2026-10-10。担当: 独立visual。対象はI25の肌色追加と生成UI25素材。アプリ、素材、検査、評価基準、旧監査、採用記録は変更していない。保存された画像と記録を読み、本監査でChrome・Unit・性能検査を実行していない。

## revision-1 の限定結論

**限定FAIL（P2: 肌24色を開いた初期画面の下段切れ）**。生成25素材の描写、実表示での縮小品質、12色島の区別、肌色範囲は列挙画像の範囲で限定PASS。320×568と1200×1000では肌色最下段が初期viewport外へ出るため、T03の収まりをPASSにしない。390×844では全24色が画面内に収まる。

実装担当へP2を通知済み。担当から修正とrevision-2再撮影の予定を受領したが、この初回記録時点では新固定画像による修正確認は未実施。revision-1のFAIL、元PNG、成功ログを保持し、新版の結論は追補で区別する。

人間採用は未受領。I25の部分評価から既存の眼の受入、P05性能FAIL、残るmaster9枚、ホームと同等品質、全体READYを推定しない。全体は **NOT READY** のまま。

## 基準と固定対象

- 基準: `docs/storybook-improvement.md` のI25/T01〜T04、初期 `docs/product-spec.md` §17の色選択常時最大2アクションと§31の44px・文字・色以外の選択表現。I25の後発指示により、旧「肌色カテゴリなし」「11島のみ」は今回の追加を禁止する根拠にしない。24色という数は実装の具体化であり、利用者が指定した数として扱わない。
- `test-results/ui-art-v1/revision-1/identity-before.json` と `identity-after.json` の双方を読取り照合。build `0b85e4d6b69c34ce45c3b8aaea4752d81859de9c3590e6f6c36396b1cfa08bfc`、source `7ef54910ae2acf2a50ebf3dba002c1828d46a50b3939076d6651ab1c62a86c6d` で一致。この監査ではbuild aggregate生成処理を再実行していない。
- `content/ui-art-v1/manifest.json` の25原本と `compiled.json` の25配信WebPについて、現物のSHA-256を独立に再計算し、各manifest値との不一致0を確認。toolはbuilt-in image_gen、humanAdoptionはnot-receivedと記録されている。
- その後のCSS編集中の読取りをrevision-1画像の原因断定に流用していない。以下の所見は上記固定証拠を対象とする。

## 実際に開いた画像

すべて `view_image` のoriginal指定で実際に開いた。contactだけを開いて各実画面を確認した扱いにはしていない。

| 保存場所 | 開いた画像 | 実際の画像サイズ・範囲 |
| --- | --- | --- |
| `content/ui-art-v1/review/` | `all-25.png` | 5×5の原本contact。palette/background/frame/3画材/eraser/settings/brand/color島12/continue/gallery/paint-dab/board |
| `test-results/ui-art-v1/revision-1/ui-chrome-small/` | `home.png`, `editor-default.png`, `editor-skin.png`, `skin-swatches.png` | viewport320×568・DPR1。PNGは順に320×900、320×568、320×613、292×183 |
| `test-results/ui-art-v1/revision-1/ui-chrome-mobile/` | `home.png`, `editor-default.png`, `editor-skin.png`, `skin-swatches.png` | viewport390×844・DPR2。PNGは順に780×2072、780×1688、780×1688、692×364 |
| `test-results/ui-art-v1/revision-1/ui-chrome-desktop/` | `home.png`, `editor-default.png`, `editor-skin.png`, `skin-swatches.png` | viewport1200×1000・DPR1。PNGは順に1200×1000、1200×1034、1200×1087、876×110 |
| `test-results/ui-art-v1/revision-1/ui-chrome-small/` | `skin-paint-2048.png` | 2048×2560。姫の顔・耳・首/胸元・両腕に肌色pencil、その他の部分は未着色 |

合計14現物。PNG寸法はIHDRを独立に読み、DPRとviewportは `playwright.ui-art-v1.config.ts` と各 `ui-evidence.json` を照合した。fullPage画像の高さをviewportの高さと混同しない。

## 必須指摘

### UI25-V01 / P2: 肌24色の最下段に追加スクロールが必要

- 現物位置: `ui-chrome-small/editor-skin.png` 下端の茶色6色。色dab最下段は画像上の約y565〜595で、初期viewport568px下端に切れる。保存PNG自体は613pxあり、画像全体を開いた時だけ最下段まで見える。
- 現物位置: `ui-chrome-desktop/editor-skin.png` 下端の茶色12色。第2段のdabは約y1011〜1045で、初期viewport1000px外へ出る。保存PNGは1087pxある。
- `ui-chrome-mobile/editor-skin.png` は780×1688/DPR2で、全24色と主役・上部操作が390×844内に収まる。全幅共通の到達不能とは判断していない。
- 検査側の限界: `tests/e2e/palette-illustrations.spec.ts:80` はfullPage撮影。直後の最終色 `focus()` と画面内assertはフォーカスによるスクロール後を確認している。smallの記録は最終button bottom556.59px・artwork y14.59px、desktopは最終button bottom987.80pxであり、初期scrollY=0で全色が収まった証拠ではない。6件成功とこの所見は矛盾しない。
- 影響: 島選択→色選択の2操作に加えて、短画面またはdesktop肌色でページを動かす必要が生じる。T03短画面収まりと§17の常時最大2アクションを満たすとは判定できない。
- 必須修正: 肌24色の高さを含めて描画領域とパレットを配分し、44px操作を維持しながら、scrollY=0・フォーカス移動前の全24buttonのrectをviewport内へ収める。新固定buildで320×568と1200×1000の初期表示を確認する。修正方法・基準変更・検査実行は本監査の担当外。

desktop `editor-default.png` の高さ1034pxは木製board下端や余白も含む。12色dab自体は約y959〜991に見えているので、これだけで通常12色にも追加スクロールが必要とは断定しない。ホームの縦スクロールは作品テーマ一覧の通常表示であり、この指摘には含めない。

## 列挙範囲で通過した見た目

| 観点 | 限定評価 | 観測 |
| --- | --- | --- |
| 原本25素材 | PASS | 絵の具のついた木製palette、森と家のbackground、金工と青い宝石のoval frame、青いbrush/桃黄crayon/赤緑pencil、eraser等が同じ柔らかな絵本調でまとまる。contactで矩形の白地やチェッカーを素材の一部として見せる欠陥は見えない。全原本を個別等倍で開いた評価ではない。 |
| 縮小した画材・scene操作 | PASS | 3幅の上部でbrush・交差crayon・2本pencil・eraserの形が区別でき、日本語の名前が残る。320pxでは文字が小さいが、隣の操作名の重なりや欠けは見えない。背景は小さな風景、枠は金の輪として識別できる。細い宝石/葉の描写は縮小で省略されるが操作の種類を失っていない。 |
| 色島12 | PASS | 赤花/桃花/橙果実/黄花/緑葉/青いbrush/紫花/茶/肌の複数pebble/灰石/白花/黒石が、6×2または12×1の配置で並ぶ。肌島は白島・茶島と絵と「はだ」の表示で区別できる。灰と黒も色面・名前の両方が残る。選択島に青緑checkが見える。 |
| 肌24色の幅・色の形 | PASS | pale cream、桃、peach/beige、黄味の中間色、赤茶、深い茶まで見える。6×4または12×2で、絵の具の不規則な縁にしても中央の色面を見失わない。各記録は24HEX/24日本語名がそれぞれ一意。24中心RGBをHEXから計算したRGBと記録上で照合し、不一致0。これはChrome描画の再実行ではない。 |
| natural UI | PASS | 色島・背景/枠操作の周囲に新たな装飾用rectangle/card shadowは見えず、透明な外縁から青白い背景へ自然につながる。paletteは木の縁と紙を描いた実物風surfaceで、色や文字は画像へ焼き込まず操作として残る。上部の白い操作群・選択色の輪/checkは意味のある操作表現として区別する。 |
| ホームの新主要導線 | PASS | palm islandのbrand、turquoise gearの設定、rose sketchbookの「つづきから」、landscape紙の「さくひん」が見える。320pxでは後2導線は文字中心に省略されるが、文字の欠けはない。既存テーマ12島は2列mobile/4列desktopで区別できる。旧desktop3列との差異B07を今回解消した扱いにはしない。 |
| 肌色の出力例 | PASS | small `skin-paint-2048.png` では顔・耳・首/胸・腕に同系の茶色pencilが入り、服・髪・うさぎへ肌色が漏れた所見はない。paper粒子による明るさの変化は画材の見え方として観測。全24色×全3画材の見た目をこの1枚から保証しない。眼の美的受入は対象外。 |

小さな差の扱い: `#845740` と `#835741` など近い肌色は、縮小画像ではほぼ同じ色に見える。24個のHEXが異なることと24色すべてが一目で区別できることは別であり、後者は主張しない。明暗と暖色/neutralの全体範囲は増えており、この近似だけを必須欠陥にはしない。

木製boardがmobileで縦に伸びて見えること、細い装飾が縮小で弱くなることは観測した。現時点で操作の誤認や透明外縁の破綻は再現しておらず、造形の好みを必須修正へ置換しない。

## 記録から確認した範囲と未確認

- `content/ui-art-v1/before/packages/content-schema/src/index.ts` と読取時のschemaからfamily定義を独立に抽出し、旧11family/132色の名前とHEX列が一致、不一致0。新skin24を追加して12family/156選択肢となる。機能操作の再実行ではなくsourceデータ比較。
- supplied `revision-1/browser/results.json` はexpected6、unexpected0、flaky0、errorsなし。`palette-illustrations.spec.ts` の内容を読み、既存132選択、skin24塗り、crayon/pencil、保存/reload/PNG、44px、選択・focus、scene dialogの列挙検査であることを確認した。監査者が実行したとは記載しない。
- 各 `ui-evidence.json` の測定対象buttonは幅/高さ44px以上。focus-visible=true・outline3pxの記録があるが、全キーボード巡回、全focus状態の画像、タッチの操作性、支援技術の読み上げを本監査で体験した証拠ではない。
- `asset-integrity.json` は生成mask中心minAlpha252とopaque live-color coreを記録している。旧初回mask失敗を今回の成功へ書き換えない。配信画像と見た目の確認は上記範囲に限る。
- 新UIのofflineは初回監査時点では未読取。実機、Firefox/WebKit、全156色の目視比較、全テンプレート×全肌色×全画材、他の高さ・横画面・safe-area、正式採用は未確認。
- 既存の眼の人間受入、P05性能FAILと停止履歴、master残9枚、全機能回帰、外部同期、ホームと同等品質はI25の部分PASSに含まない。新humanAdoptionは未受領、全体NOT READYを維持する。

## revision-2 追補: 初期24色の収まりを再確認

**限定PASS（UI25-V01は今回の3幅で解消）**。revision-1のFAIL原文と証拠はそのまま保持する。新固定版で全24色が初期viewport内に収まり、絵と左右操作の新たな重なりも見えない。これはI25の列挙した静的見た目の評価であり、T03のoffline/回帰全体、人間採用、全体READYの判定ではない。

固定対象は `test-results/ui-art-v1/revision-2/identity-before.json` のbuild `547dd061e035290c533f2fdf067fbd326ea30ad21524d202a99cff14ac5244b5` / source `87706559ed4d8deefbc3ab0cefb2a15ea225da52c3f09271dbd90e281dd141d5`。当該記録を読取り照合した。追補時点で `identity-after.json` は未作成のため、前後aggregate一致はまだ確認した扱いにしない。

新しく実際に `view_image` originalで開いた画像は次の14枚。

| 場所 | 実際に開いた画像 | 確認内容 |
| --- | --- | --- |
| `test-results/ui-art-v1/revision-2/ui-chrome-small/` | `home.png`, `editor-default.png`, `editor-skin.png`, `skin-swatches.png` | 初期24色・左右操作・小さい絵・12色島・ラベル。両editor PNGは320×568 |
| `test-results/ui-art-v1/revision-2/ui-chrome-mobile/` | `home.png`, `editor-default.png`, `editor-skin.png`, `skin-swatches.png` | DPR2の390×844で通常12色/肌24色の収まり。両editor PNGは780×1688 |
| `test-results/ui-art-v1/revision-2/ui-chrome-desktop/` | `home.png`, `editor-default.png`, `editor-skin.png`, `skin-swatches.png` | 縮小した主役・palette全体・肌2段。両editor PNGは1200×1000 |
| `apps/web/public/` | `icons/icon-192.png`, `ogp.png` | 192pxアイコンと1200×630 OGPにpalm islandが存在し、外周・木の上端・波まで見える |

PNGのeditor寸法をIHDRから独立に読取り、今回はfullPageの高さが各viewport×DPRに一致することを確認。各 `ui-evidence.json` の `initialLayout` から全72buttonのrectを独立に算術照合し、上下左右のviewport外0を確認した。保存された実測値を確認したもので、監査者がChromeを再実行したものではない。

| 幅/高さ・DPR | 初期scrollY / documentHeight | 肌24色buttonの最大bottom | 最小hit幅×高さ | 肌選択時のartwork幅×高さ |
| --- | --- | --- | --- | --- |
| 320×568・1 | 0 / 568 | 555.59375px | 45.5×44px | 155.1875×193.984375px |
| 390×844・2 | 0 / 844 | 819px | 54.5×44px | 243.1875×303.984375px |
| 1200×1000・1 | 0 / 1000 | 965px | 67.15625×47px | 404.953125×506.1875px |

320pxの `editor-skin.png` では姫とうさぎが約194px高の紙面内に全身で収まる。左の「はいけい」「かざりわく」「まとめて」「こまかく」は紙面左に分離し、互いの文字や絵へ重ならない。右zoom3操作も紙面と主役を隠さず、最下段6色は568px下端より上に見える。画面内に収めた結果として主役が小さくなっており、実機での細かい塗りやすさまでPASSとしない。

desktopは描画領域がpaletteの高さに合わせて縮み、下段12色と木製board下端まで1000px内に見える。390pxでは24色・主役・上部操作の収まりを維持している。3幅の通常12色にも重なりや切れは見えず、生成した12色島・3画材・背景/枠操作の形と日本語ラベルは引き続き判別できる。homeの導線と12テーマ島にも新しい欠けは見えない。旧B07のdesktop4列は継続しており、今回のPASSで解消扱いにしない。

`icon-192.png` の現物SHA-256は `d4489834531bdd4275f8893a384bd5b9c2ea69437feb640674ab6dbef1e9db66`、`ogp.png` は `ceb64427aaaeffa2b858a39d2a035632988eb77f8ef3b9427958252ba80ddd82`。アイコンではpalm islandを中央に、OGPでは左に同島・右に日本語brandと本文を確認した。島の欠落はこの2現物に残っていない。インストール後のホーム画面アイコンや外部SNSのOGP表示を実際に確認した証拠ではない。

supplied `revision-2/browser/results.json` はexpected6・unexpected0・flaky0・errorsなし。現検査の `tests/e2e/palette-illustrations.spec.ts:80` からの初期layout記録とscrollY=0/全buttonの初期上下境界assertが、後続focus操作より前に追加されていることを読取り確認した。3JSONの計72中心RGBをHEXからのRGBと独立照合し、不一致0。選択focusの記録はoutline3px・focus-visible=trueを維持する。

offlineと追加回帰は実装担当が実行中であり、本追補では最終成功に数えない。新Unitを監査者が実行した扱いにもしていない。旧眼の未受入・P05性能FAIL・master残9枚・実機未検査・humanAdoption未受領・全体NOT READYは維持する。

## 最終整合性追補: revision-2/3の提供結果

**I25の静的目視は前節の限定PASSを維持**。初回UI25-V01のFAILとrevision-2の再評価は原文のまま保持した。今回は新しい画像を開かず、実装や検査を変更せず、提供された固定記録と結果のみを読取り確認した。

- revision-2とrevision-3の `identity-before.json` / `identity-after.json` 計4記録は、すべてbuild `547dd061e035290c533f2fdf067fbd326ea30ad21524d202a99cff14ac5244b5` / source `87706559ed4d8deefbc3ab0cefb2a15ea225da52c3f09271dbd90e281dd141d5` で一致。記録内の配信954fileとsource63fileのpath/SHA列も4記録間で不一致0。前節の「after未作成」は当時の状態であり、最終時点では前後一致を確認できた。aggregate生成処理や954fileの現物再hashを実行した意味ではない。
- supplied `revision-2/browser/results.json` はUI6成功。`revision-3/offline/results.json` は1成功、`revision-3/regression/browser/results.json` は8成功。いずれもunexpected0・flaky0・errorsなしを確認。回帰8はPC/mobile各4件の途中作品削除・取消/失敗時保持/他tab保存後の確認と、背景/枠/gallery/PNG/複製の列挙範囲。
- supplied `revision-3/unit.json` はsuccess=true・37成功・失敗0・pending0。対象は `assets-cache.test.ts`、`engine-content.test.ts`、`pwa-updates.test.ts`。全Unitや全機能の最新包括成功とは扱わない。
- `revision-3/typecheck.log` / `lint.log` を読み、`tsc --noEmit` / `eslint . --max-warnings 0` のエラー出力なしを確認。exit0は実装担当から受領した実行結果であり、監査者が実行またはexit codeを再測定したものではない。
- `revision-3/ui-art-offline-chrome/offline-evidence.json` はUI25素材URL、editor/home画像のdecode寸法、board/paint-dabのrequestModeとdecode、肌の復元/再保存値を記録。これは事前に表示した素材を使う制御したoffline再読込の証拠であり、初回訪問からofflineで使える証拠ではない。offline画面の新たな目視評価は追加していない。
- revision-2のoffline結果は1失敗として残っている。担当報告によるrevision-3への差分は、offline検査のJS fetchをCSS画像と同じOrigin条件のImage decodeへ合わせた検査修正。旧失敗を削除せず、build/sourceの不変を上記固定記録で独立に照合した。

以上は提供検査結果の読取確認であり、本監査でChrome・offline・回帰・Unit・型・lintを再実行していない。I25の列挙範囲に関する証拠が揃ったことと人間の正式採用は別である。humanAdoption未受領、既存眼の未受入、P05性能FAIL、master残9枚、実機/外部同期/全体回帰の未確認を維持し、全体 **NOT READY** のまま。
