# 検証方針

## 現在：2026-10-13 I34、62実画面FAIL／63試作中

進行基準は[統合計画I34](storybook-improvement.md)、詳細は[I34進行記録](smooth-home-i34-progress.md)。候補62のbuild a95ad6a0… / runtime74c1b959…で全460Unit/主Chrome26＋補足1/90native/眼100と保全検査は成功。source73画像とengineは独立限定PASS。しかし[実画面原本](audits/revision-62-screen-final-visual-20261013.md)は、逆明度で段付き境界R62S-1、未着色眼端の淡い矩形帯R62S-2によりFAIL。通常色の旧R61S-1改善と新FAILを分ける。現在は63の顔全体の共有曲線/肌の相対光をin-memory比較中で、productionは62。I34未完了、旧FAIL/不採用案/補足初回harnessFAIL、P05 STOP/人間採用未受領/実機・実外部同期未確認/全体NOT READY/Visual基準未更新を保持する。


## I32の限定検査（2026-10-12、クレヨンの自動陰影なし）

[統合計画I32/C表/E29](storybook-improvement.md)、[変更と証拠](crayon-flat-i32-progress.md)。v3/v4クレヨンはform/一般陰影/髪の光/服の皺を合成せず、蝋/紙目/筆圧を残す。目とsmooth/pencil、旧v1/v2は維持する。

`npx vitest run tests/crayon-flat.test.ts tests/princess-master.test.ts tests/thumbnail-assets.test.ts --reporter=json --outputFile=<新しい出力先>/unit.json` で関連22件を検査する。今回の生結果は描画13件とthumbnail9件に分けて保持。光/材質/折り目のデータを変えてもcrayonが同画素、grainが残る、他画材は光に反応、目の消去復帰、旧thumb拒否/保存project不変を確認する。

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174` と新しい `CRAYON_EVIDENCE_OUTPUT` を指定し、`npx playwright test --config=playwright.crayon-flat.config.ts --max-failures=1` を同じ固定demo buildで実行する。PC1200/DPR1と390/DPR2の2件。姫を全group crayonで塗り、reload Canvas一致、完成、320px gallery画像、実2048×2560PNGを確認する。

test-results/crayon-flat-i32/revision-1/ のcompare-nativeは変更前後48状態を別保存。現10のcrayon10だけが変わり、blank/smooth/pencil30＋旧v1/v2の8状態が完全一致。古いv3全40不変のスクリプトは今回のcrayon表現変更の合格条件には使わない。前後identity/検査hash一致、lint/型/demo build成功。主担当が6画像を開いて確認。22Unit＋2Chromeが新しい成功で、48状態をテスト件数へ加算しない。実機/全Unit/実外部同期/offline/性能/全色PNG画素/Visual基準更新は未実施、全体NOT READY/P05停止は継続。

## I31の限定検査（2026-10-12、現在の矢印配置）

[統合計画I31/O表/E28](storybook-improvement.md)、[新記録](palette-overlay-i31-progress.md)。島/色見本の左右矢印を同じ行へ重ね、背後だけ半透明、中央の色は不透明とする。I30の色統合/木目/短押しと長押し、I28/I29の配置を維持する。

新しい `UI_ART_EVIDENCE_OUTPUT` と `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174` を指定し、`npx playwright test --config=playwright.ui-art-v1.config.ts --grep 'I31' --max-failures=1` で3サイズ3件を実行する。I30欄と同じlayout1（4電話サイズ×通知ありなし8配置）と実SW offline1を同じ固定buildで順に実行し、前後identityと配信/検査hashを照合する。結果は test-results/palette-overlay-i31/revision-1/ に保存し、5件成功。両laneの重なり/mask・両端・実touch/取消/blur停止・keyboard・44px・36中心RGB・完成後のみの装飾/reloadを確認。6画像を主担当が開いて確認した。

lint/型/demo buildと変更テストのlint/型も成功。I30の全色/旧色fixtureを再実行したとは扱わない。実機/実外部同期/性能/全Unit/PNG画素/Visual基準は対象外。全体NOT READY/P05停止は維持する。

## I30の限定検査（2026-10-12、当時の色選択UI。現在の配置はI31）

[統合計画I30/N表/E27](storybook-improvement.md)、[新記録](palette-i30-progress.md)。茶色へ統合した11島132色、色見本だけ生成木目、狭幅の矢印短押し/長押しを検査する。I27/E25の独立肌島/144色/横スクロール表示は旧対象の履歴。

新しい出力先を指定し、以下を同じ固定demo buildで順に実行する（古い結果を上書きしない）：

- PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174 と UI_ART_EVIDENCE_OUTPUT=<新規出力先> を指定し、npx playwright test --config=playwright.ui-art-v1.config.ts --max-failures=1。PC/390/320の6件。
- UI_ART_EVIDENCE_OUTPUT=<新規出力先>/layout と PLAYWRIGHT_JSON_OUTPUT_NAME=<新規出力先>/layout/results.json を指定し、npx playwright test tests/e2e/layout.spec.ts --project=chromium-mobile --grep 'short phone screens' --output=<新規出力先>/layout/artifacts --reporter=line,json --max-failures=1。4電話サイズ×通知fixtureありなしの8配置を1件で検査。
- UI_ART_EVIDENCE_OUTPUT=<新規出力先> で npx playwright test --config=playwright.ui-art-offline.config.ts --max-failures=1。既訪問23UI素材のcache/offline、木目の通常画像とdabのCORS decodeを1件で確認する。

最終revision-3は計8テスト成功。前後identity、各report/画面/生値は test-results/palette-i30/revision-3/ に保持。他120HEX全選択、茶12の保存と3画材の列挙範囲、36中心RGB、2つの旧選択肢色のfixture保持、PNG寸法、マウス/実CDP touch/停止/端/keyboard、I28/I29の継続を検査。最小紙面273.984375pxで最低240pxを維持。白系2画面を別途実Chromeで撮影/目視したが、テスト件数に加算しない。初回2つのharness不備と途中結果を保持し、最後の新証拠だけで判定する。

lint/型を含むdemo buildと修正後harnessの型/lint成功。全Unit/実機/性能/実外部同期/全保存世代/全色PNG画素/Visual基準は対象外。既存P05停止を解除しない。


## I28/I29の限定検査（2026-10-10、当時の編集UI）

[統合計画Z表/E26](storybook-improvement.md)、[新記録](editor-ui-i29-progress.md)。単一ズームをモード右・絵より上へ配置し、背景/枠は完成後だけにする。新しい `UI_ART_EVIDENCE_OUTPUT` と `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174` を指定し、`npx playwright test --config=playwright.ui-art-v1.config.ts --grep 'I28 I29'` で3サイズ3件、`npx playwright test tests/e2e/layout.spec.ts --project=chromium-mobile --grep 'short phone screens' --output=<新しい出力先> --reporter=line` で4電話サイズ×通知fixtureありなし8配置を1件で確認する。

今回4テストが成功。隠れたDOMも含む一組/各操作一個、左モード右ズーム、44px、実touch/zoom/reset、完成後のみ背景/枠選択と再編集/reload保持を検査。最小紙面285px高。lint/型を含むdemo build成功。元のprojects/pwa/scene-art/layout/lifecycleの装飾手順は完成後に進むよう更新したが、今回の成功は上記4件だけ。全Unit/PNG/offline/性能/実機/全10/Visual基準更新は未実施で、旧結果を再計上しない。

## I27の限定検査（2026-10-10、当時の編集UI）

当時の仕様は [統合計画I27/R表](storybook-improvement.md)、証拠は [I27記録](editor-ui-i27-progress.md)。木の本体なし、12島/144色、島と色は各一段を継続し、ズームの場所/二組DOM/編集中の装飾変更はI28/I29で置換した。下のI25の24色/二段/25素材は過去hashの履歴で、現在UIの基準ではない。

新しい `UI_ART_EVIDENCE_OUTPUT` と `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174` を指定し、`npx playwright test --config=playwright.ui-art-v1.config.ts` で3サイズ6件、`--config=playwright.ui-art-offline.config.ts` で既訪問24素材のoffline1件を検査する。`npx playwright test tests/e2e/layout.spec.ts --project=chromium-mobile --grep 'short phone screens' --reporter=line --output=<新しい出力先>` は4電話サイズ×通知fixtureありなし8配置を検査する。layoutの画像/JSONも同じ環境変数の新しい出力先へ保存する。

最終revision-3では以上8テスト成功。36中心RGB、実touch4スワイプ、zoom/focus、保存/reload/PNG寸法、通知時の最低240pxを確認。過去FAIL/前後hash/範囲外を残す。全144色PNG画素比較、実機、実同期通知、短い横向き画面、全体Unit/性能/Visual基準更新は今回行っていない。

## I25の限定検査（2026-10-10）

新build/sourceの対象と失敗履歴は [ui-art-v1-progress.md](ui-art-v1-progress.md)。`PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174` と新しい `UI_ART_EVIDENCE_OUTPUT` を指定し、`npx playwright test --config=playwright.ui-art-v1.config.ts` でPC1200×1000/DPR1・390×844/DPR2・320×568/DPR1を単一workerで確認する。旧132 HEXの全選択、肌24色smooth保存、crayon/pencil各1、最後のpencilのreload/2048PNG寸法、72中心RGB、focus前の24button収まりと44px操作を検査する。全156色全描画/PNG画素検査とは呼ばない。

`npx playwright test --config=playwright.ui-art-offline.config.ts` は実SWの既訪問25cache、offline editor/Home画像、CSS board/dabのdecode、肌保存/reconnectを確認する。CSS maskはCORS/Origin付き、boardは通常画像としてdecodeし、previewのVary variantを診断JSfetchと混同しない。初回の失敗traceはrev2へ保持、修正版rev3は同じapp/build/sourceで成功した。

既存操作は新しい `SCENE_ART_EVIDENCE_OUTPUT` を指定して `npx playwright test --config=playwright.scene-art-v3.config.ts --grep 'draft deletion|confirmation opened|failed draft|background, frame, gallery'`。新8件とUI6/offline1が成功。関連Unitは assets-cache/pwa-updates/engine-content の3file37件だけ。型/lint/demo buildも成功。`node scripts/check-ui-art-v1-assets.mjs` は25原本/25WebPのhash/alphaとPWA3種/OGP島領域の非空を確認する。

`node scripts/check-ui-art-v1-evidence.mjs before` / `after` で配布/source/harness/配信entryを固定する。既存証拠を上書きしない。肌24色と通知の同時表示、全132中心RGB、全保存世代RGBA、実機/実外部同期/全機能/性能は今回未検査。以前のPASSをこの不足へ転用しない。

## 機械検証

`npm run check` はlint、Unit/Integration/実SQL検査、TypeScript、本番PWA buildを実施する。

- 描画: v3候補10枚・403制作領域（20自動highlightを除く383選択領域）のhit判定、3画材、白消去、決定論、背景/フレーム、2048×2560PNG、cache上限。採用済み生成408領域、旧SVG302領域、配信済みv2は既存作品との互換性検査として残す。旧領域数を新版の合格数へ転用しない。
- 入力: pointer座標を中心にしたzoom、pan制約、ドラッグ往復や複数pointerで塗らないこと。
- 保存: IndexedDB transaction、offline queue、1.5秒debounce、同タブ連打、複数タブ、in-flight変更、CAS競合、500件時の保護、削除、backup復元。
- SQL: migrationを隔離PGliteへ適用し、authenticatedロールと偽装JWTで他ユーザーのread/write/delete拒否。quotaとversionはサーバー側で検証。
- 制作: 閉パス、bounds、領域面積と幅、原画の保存、frame安全領域。OpenCVでは小切れと大切れを別の結果にする。

Vitest 5のWindows sandbox環境ではfork間の変換キャッシュ一時ファイルでENOENTを確認したため、`pool: threads`を設定している。これは失敗テストを除外する措置ではなく実行poolの変更。全test fileを実行する。

2026-10-07、実SQL試験追加後の並列実行でWindows/Node 24.18.0のV8が`jit_page_->allocations_.erase(addr) == 1`でプロセス終了した。Windowsだけ`maxWorkers: 1`とし、ファイルごとのisolateを保持したまま順に実行する。全30ファイル235件を47.64秒で再実行して成功。SQL検査・失敗条件のskipや緩和はない。Linux CIの並列設定は変更していない。

## ブラウザ

PlaywrightでDesktopとMobile viewport、Chromium/Firefox/WebKitを確認する。操作の最終状態をIndexedDB、描画、ダウンロードサイズ等で検証し、単にボタンが見えることだけをPASSにしない。

Visual Regressionは安定した画面・動き軽減・固定viewportで基準画像と比較。スクリーンショットは人間向けの目視確認も行う。axeで重大なアクセシビリティ違反とconsole/pageerrorを検査する。

`eyes.spec.ts`は新版20眼のhighlight tap統合、同キャラ両眼/部分モード片眼、色/画材、IndexedDB再読込、実2048×2560PNGの白反射を照合する。手動highlight22件の結果は旧版の履歴だけ。`storybook-engine.test.ts`は20眼×黒/茶/青/桃/淡色、消去のpixel完全復帰、全選択領域のhitを検査する。`storybook.spec.ts`は90 zoom/DPR＋30途中pan＋30縮小復帰を撮影し、`storybook-density.spec.ts`はCDP撮影前後のDPRとCanvas寸法をassertした原pixel画像を残す。撮影時にDPRが戻った同サイズPNGをnative DPR証拠としない。

`layout.spec.ts`には320×568 / 390×568の低い画面と通知ありの配置検査を追加。通知DOM fixtureは同期処理の検証と区別する。現CSSのdesktop4列を確認するテスト成功は、未撤回の初期desktop3列要件の合格ではない（B07/B27）。

`node scripts/check-pwa-update.mjs`は静的ビルドと本物のService Workerを一時localhostで配信し、2タブの更新保留、編集・ズーム保持、他タブを閉じた後の明示更新、更新後のoffline再起動を確認する。maskableアイコンは全画素が不透明であることも検査する。

Canvas、Service Worker、pixel、クロスブラウザの検査は実ブラウザを使う。現在の`check-browser.mjs`はインストール済みChromeをread-onlyで確認し、Docker/Rancher/Lightpandaを起動しない。Firefoxは明示した隔離manifest1 copyを使用し、公式配布との差を [testing-browser.md](testing-browser.md) に記録する。WebKit desktop engineをiPhone実機/Safari実機と呼ばない。

非demo同期検査は実Supabase SDK＋隔離HTTP/PGlite SQLを通す。本番cloud buildは新画像の人間承認gateが未成立で停止したため、承認を迂回せず`ISLAND_CLOUD_SOURCE_PREVIEW=1`の標準Vite source previewを別の限定検査として使用する。このmodeは`build:null`/`productionBuildVerified:false`を前後identityに記録する。public原本bytesには通常のfresh HTTP cache（1時間）を付け、コードはViteを通す。production SW/offline shellの証明は固定demo buildの本物SW検査で別に行う。SDK source検査の成功を非demo本番build成功としない。

## 性能

v3の指定ゲートは`node scripts/check-storybook-performance.mjs`。全10の可視mask面積とgroup所属数を算出し、最大面積groupと最大所属数groupをそれぞれCPU4倍/DPR2で、3画材×未使用12色ずつ測る。pointerupから最初のCanvas描画までのp95を100ms以内とする。最後のCanvas描画・2rAFの描画機会も生値で保持し、実機や物理presentと区別する。他の重い検査と同時実行しない。

`test-results/engine-performance.json`はCPUラスタ測定であり、Android実機のfpsを示すものではない。ブラウザの初回表示、tapから視覚更新、連続編集、pan/zoom、出力、不要な再描画を別途検証する。bundleはbuild出力のraw/gzip双方を記録する。

性能スクリプトは配信HTML/JS/CSSと`dist-demo`のSHAを照合し、全配布ファイルと本体ソースのhashを前後で固定する。変更があればその実行を採用しない。`check-interaction-performance.mjs`は3画材×12個の未使用色と、pan/zoomへ組み込んだ4色を測る。`PERFORMANCE_THEME=dinosaurs`と`PERFORMANCE_REGION=r01`で独立監査の最大領域も対象にできる。`check-lifecycle-performance.mjs`は初回/再訪、背景3種/枠3種、同じ作品の30回開閉とGC後heap（最初10回はwarmup、全30回の値を保存）を記録する。描画時刻・2rAF代理値・自動操作で観測した表示時刻を区別し、実画面の物理presentやAndroid実機性能と呼ばない。以前の10回測定は別ディレクトリに保持し、回数を変更した最新結果と混同しない。

## 監査と完了条件

実装後に20独立専門監査を行う。各監査はPASS/FAIL、Severity、根拠、再現、影響、推奨修正、必須修正、再テスト項目を記載する。指摘を統合しP0→P1→P2順に修正、該当検査と監査を再実行する。

外部credentialsを除くQuality Gateに未達があればNOT READYとする。テストを実行していない項目を「PASS」と記載しない。最終結果はrelease-checklist.mdに記録する。

## I24の限定回帰（2026-10-10）

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174`、`SCENE_ART_EVIDENCE_OUTPUT=test-results/scene-art-v3/revision-2` で `npx playwright test --config=playwright.scene-art-v3.config.ts` を実行する。Chrome desktop1200×1000/DPR1 と mobile390×844/DPR2 の5件ずつ、単一worker。途中削除の取消/再読込/別作品保持/他タブCAS/保存失敗、背景枠/PNG/複製、姫の全10背景/全20枠とreload/PNGを検査する。

offlineは同じbase URLと `PRINCESS_EVIDENCE_OUTPUT=test-results/scene-art-v3/revision-2` を指定し `npx playwright test --config=playwright.princess-offline.config.ts`。本物SWで新空島/宝石枠/塗りをoffline再読込・編集後online再読込する。結果は[今回の検証](scene-art-v3-progress.md)。初回失敗rev1を保持し、修正したharnessのrev2と区別する。

`tests/scene-art-v3.test.ts` は原本/hash/旧catalog保持、11/21選択数、不透明景観と透明開口、canonical全10のopaque主役pixel非遮蔽を確認する。全10×30scene×全倍率の実画像検査や旧noProfile新composition復元の検査ではない。今回性能ゲートは再実行しておらず、P05旧FAILを継続する。以後の実行は新しい出力先を指定して旧結果を上書きしない。


## I33の限定検証と輪郭停止（2026-10-12）

最新結果は[品質改善記録](smooth-home-i33-progress.md)と[統合計画I33-S/E30](storybook-improvement.md)。現行は検証済みrevision-1へ復帰した同一hash。新15＋既存22の37Unit、Chrome15成功、native90条件、眼100配色、30RGBA/通常geometry不変。旧380/398/監査PASSを今回へ転用しない。ホーム同等品質の最終受入は未完了。

関連Unitは `npx vitest run tests/smooth-finish.test.ts tests/crayon-flat.test.ts tests/princess-master.test.ts tests/thumbnail-assets.test.ts`。Chromeは `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174` と `npx playwright test --config=playwright.smooth-finish.config.ts`。PC全10、電話相当4、姫の倍率/部分塗り1。再実行時はSMOOTH_EVIDENCE_OUTPUTに新しい出力先を指定し、before/evidence.jsonの固定配色を保持する。nativeの制作時scriptsはr1出力先が固定のため、証拠を上書きせず新候補用へ明示的に変更する。

revision-2の細線化は範囲検査FAIL2回で停止した。候補の39件中38成功を現行37件へ加算しない。途中nativeも90条件へ加算しない。再開時は[stop.json](../test-results/smooth-home-i33/revision-2/stop.json)に従い残る33画素の単独切分けから始め、全検査の反復や判定の緩和をしない。P05性能停止、実機/実外部同期/独立目視/人間採用未確認を継続する。
