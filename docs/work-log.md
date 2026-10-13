# 実装・検証記録

## 現在：2026-10-13 I34、62実画面FAIL／63試作中

進行基準は[統合計画I34](storybook-improvement.md)、詳細は[I34進行記録](smooth-home-i34-progress.md)。候補62のbuild a95ad6a0… / runtime74c1b959…で全460Unit/主Chrome26＋補足1/90native/眼100と保全検査は成功。source73画像とengineは独立限定PASS。しかし[実画面原本](audits/revision-62-screen-final-visual-20261013.md)は、逆明度で段付き境界R62S-1、未着色眼端の淡い矩形帯R62S-2によりFAIL。通常色の旧R61S-1改善と新FAILを分ける。現在は63の顔全体の共有曲線/肌の相対光をin-memory比較中で、productionは62。I34未完了、旧FAIL/不採用案/補足初回harnessFAIL、P05 STOP/人間採用未受領/実機・実外部同期未確認/全体NOT READY/Visual基準未更新を保持する。


依頼原文は product-spec.md に保存。参照画像は content/references に展開。参照画像中の文言や不足している灰色パレットは仕様の代わりにしない。

## 2026-10-12 I32：クレヨンの自動立体感・陰影を撤去

最新指示を受け、v3/v4クレヨンは紙目/蝋/筆圧まで描いて終了し、form・一般陰影・髪の光・布の皺・素材の照りを重ねない。目の自動補正と他画材の陰影は維持。共通rendererへの適用により既存v3/v4も再描画から新表現になるが、作品の色/画材/領域/ID/装飾は不変。旧v1/v2は旧描画を保持する。古い陰影thumbが残らないようv3/v4 crayon作品だけ描画キーを更新した。

新build `3909dc392aef4dcea3a2e77d149b56588afe3ec3d846ffd1e73caf9807e3a882` で前後identity一致、関連Unit22件＋Chrome2件成功。変更前後48状態の比較で現10のcrayon10だけが変わり、他画材/blank30と旧v1/v2の8状態が一致。姫の保存/reload Canvas、完成、実320thumb、2048PNGを確認し、6原画面を開いて目視した。lint/型/demo build成功。runtime2ソースのみでcontent/画像/保存schema/DBは不変。

[統合計画I32/C表/E29](storybook-improvement.md)、[証拠と限界](crayon-flat-i32-progress.md)。旧PASS・旧v3 crayon不変という比較条件を新ルールへ流用しない。実機/実外部同期/offline/性能/Visual基準更新は未実施、全体NOT READY/P05停止と以前の未完了は継続する。

## 2026-10-12 I31：矢印を重ね、背後の島と色見本だけ半透明

最新指示を反映し、狭幅の左右矢印を別列から同じ島/色見本の行へ重ねた。44pxの操作幅、端だけ35%のmask、先頭/末尾を矢印の横へ出す52pxの端余白。短押しは矢印を除く幅の80%に調整し、長押し/離す/取消/blur停止と両端の無効化を維持。I30の茶12色/木目、I28/I29の単一ズームと完成後だけの装飾を継続する。

新build `8239de98aeb8f4fe4b7a8461f14454aa44d8f501f5b97fd22f7a149ed8253159` で3UI＋layout1（8配置）＋実SW offline1の5件成功。重なり/mask、マウス/実CDP touch、停止/端/keyboard/44px/誤塗り0、36中心RGBを確認。6原画面を開いて目視し、前後identity/検査hash一致。lint/型/demo build成功。runtimeはcomponent/CSSの2ソースだけ、配信content/画像/描画/保存schema/DBは不変。

[統合計画I31/O表/E28](storybook-improvement.md)、[証拠と限界](palette-overlay-i31-progress.md)。E27は当時の履歴とし、今回の全色/旧色fixture再実行とは扱わない。実機/全体NOT READY/P05停止と以前の未完了は継続、Visual基準は更新しない。

## 2026-10-12 I30：肌色を茶色へ統合、色見本だけ木目、狭幅は矢印操作

肌島を茶色へ統合し、茶12色を淡い肌色6→濃い茶色6に整理。他120HEXは維持し11島132色。標準image_genの新木目を色見本だけの角丸四角へ敷き、島には敷かない。767px以下の島/色見本は両端矢印、短押しで移動・長押しで連続移動・離す/取消等で停止。PCの縮小も同じ。I28/I29の単一zoomと完成後のみの装飾を維持する。

同じ新buildで3サイズ6Chrome、通知fixtureありなし8配置のlayout1、実SW offline1の8件成功。茶12色の描画保存、36中心RGB、旧選択肢2HEXのfixture保持、PNG寸法、実touch cancel/両端/blur/keyboard/誤塗り0、既訪問23素材を確認。白系2画面も追加撮影/目視した。最小紙面273.984375px、全対象44px以上。前後build/source/配信/検査hash一致。最初の2回のharness不備を保持し、app/buildは変更せず修正したrevision-3で成功。lint/型/demo build成功。

[統合計画I30/N表/E27](storybook-improvement.md)、[実装・証拠・限界](palette-i30-progress.md)。旧素材/作品と旧検査を保持し、renderer/保存schema/DB migrationは変更しない。局所修正は列挙範囲で完了、全体NOT READY/P05停止と以前の未完了は継続。実機/実外部同期/性能/全10/全色PNG画素/Visual基準更新は未実施。

## 2026-10-10 I28/I29：ズームを一組にし、装飾変更を完成後へ

同じズームDOMをstage/paletteの二か所に置くI27実装を撤去し、画材の下で左に塗りモード・右に単一ズームを並べた。編集中の背景/枠ボタンと下のズーム予約空間を外し、パレットは島/色の各一段だけにする。背景/枠は完成後のみ選択可能、再編集は表示を保持する。原画の4:5と描画/保存schema/DBは変更しない。

新build `2a4585a12b29db2e453c83b19b4216b9ea45b60deb7cc323365e706fecc7bf42` で3サイズChrome3件＋4電話サイズ×通知ありなし8配置のlayout1件が成功。隠れたDOMも含む一組/各操作一個、配置/44px/実touch/zoom/reset、完成後の背景枠保存・再編集/reload保持を確認。最小絵285px高、PCと短い電話で紙面の表示高も増加。通常電話は横幅の上限を維持する。前後build/source/配信/検査hash一致、runtime変更2ソース、配信content869ファイル同一。lint/型を含むdemo build成功。

[新記録と限界](editor-ui-i29-progress.md)、[統合計画I28/I29・Z表・E26](storybook-improvement.md)。旧E25を新PASSへ転用しない。実機/全10/PNG/offline/性能は今回未検査、全体NOT READY/P05停止を維持する。

## 2026-10-10 I27：木のパレット撤去・各一段・スマホ専用配置

UIだけを改修。木の本体を表示せず、色の島と色見本はそれぞれ一段に固定。肌色は旧24から明暗/色味を残す12へ整理し、旧132 HEXは保持。PCは12個ずつ一段、スマホは独立した横スクロール。通常のスマホは絵の下にzoom、高さ680px以下は背景/枠と同じ段へまとめた。線画/完成画/描画エンジン、保存schema/DBを変更していない。

新build `f40eb8db92498cdda4584729aedff138958918501d8e696cc43b2ec4c2a977dd` で3サイズ6Chrome、通知ありなし8配置を含むlayout1、実SW offline1が成功。実touch/zoom/focus、全色選択、保存/reload/PNG寸法、肌36中心RGBを確認。途中候補と通知時の約1.6px不足FAILを保持し、余白修正後に新hashで再検査した。前後identity/検査コード一致、旧配信content869ファイル不変。lint/型を含むdemo build成功。

詳しくは [今回の記録](editor-ui-i27-progress.md)、進行基準は [I27/R表/E25](storybook-improvement.md)。I25の24色/木の本体/二段を現在仕様から撤回し、原本・旧作品・過去検査は保持。実機/実外部同期/全10/全体READYは未検証、旧P05停止も継続する。

## 2026-10-10 I26：線画メニューのホバー案内撤去

利用者の「マウスオーバー時のこの画像は不要」「この絵であそぶのヘルプも不要」「少し絵を浮き上がらせる程度」を反映。ThemePageの重ね画像/文/案内面を削除し、hover時は紙面だけ3px上げる。keyboard focusとタイトルを保持。disabledは除外、動き抑制時は移動なし。新規画像生成は不要で、元素材は保持する。

新build `b10dc61af67fcc862bd50f3461f74baea6a2d7f1544ced027f5d56f4e218b6f9` の姫一覧1280×720/DPR1で通常/hover/focusを実確認し、型/lint/demo build成功。[記録と限界](template-hover-i26-progress.md)、統合計画I26/K01/E24へ接続。旧I25の15Chrome/37Unitをこの版の再検査とは扱わず、全体NOT READY/旧P05停止を維持する。

## 2026-10-10 I25：肌色24色と生成UI25点

利用者の肌色追加・未生成の操作イラストを画像生成する指示を反映。旧132色を保持して「はだ」24色を追加、12島156色へ変更した。パレット本体/色見本形状/12色島/画材/消しゴム/背景枠/主要導線/ロゴ島の計25点をbuilt-in image_genで個別制作し、原本・逐語prompt・SHAと旧出力を保持して組み込んだ。schema/DBは変更していない。

独立確認の初回FAIL（PWA/OGP島欠落、肌下段切れ）を保持して修正。現buildは `547dd061e035290c533f2fdf067fbd326ea30ad21524d202a99cff14ac5244b5`、source `87706559ed4d8deefbc3ab0cefb2a15ea225da52c3f09271dbd90e281dd141d5`。新UI6、同buildのoffline1/削除・scene等回帰8、関連Unit37、型/lint/demo build成功。offline初回の検査用Origin variant不一致も失敗原文/traceを保存し、検査だけ修正した。独立engine/visualは限定PASS。

進行基準は [統合計画I25/T表/E23](storybook-improvement.md)、範囲・再生成・未確認は [今回の記録](ui-art-v1-progress.md)。人間採用/実機/全体NOT READYと旧P05停止は維持。今回Visual基準更新/性能測定/外部公開を行っていない。

## 作業順

1. 共通型と実行／制作の境界を確定。
2. オリジナル線画10枚と制作QA、Canvas描画、永続化とSupabaseを並行実装。
3. ホーム、編集、作品管理、設定、PWAを統合。
4. Unit、Integration、RLS、E2E、表示、性能を検証。
5. 指定20分野を独立サブエージェントで監査（同時実行上限に従い順次実施）。
6. P0・P1・P2を修正して再監査。Gateの証拠をリリースチェックリストに残す。

## 実装判断

- 2026-10-06: React + TypeScript + Vite、Canvas 2D。ベクターパスを制作時に確定し、実行時領域解析を行わない。
- 2026-10-06: 描画・共通型・コンテンツ・永続化を packages に分離。クラウド資格情報の欠落は明示的ローカル開発モードで補い、本番Google認証を迂回しない。
- 2026-10-06: 参考ZIPはUIコンセプト画像。画像に含まれる誤字や保護者向け文言をアプリに転載しない。

## 現在の状態

実装と検証を継続中。Quality Gateは **NOT READY**。

## 2026-10-06 統合後の検証

- 10オリジナル線画302領域、背景11、フレーム21、132色、3画材、作品管理・設定・PWAを統合。
- Unit/Integration/RLS 77件、lint、typecheck、build:demoがPASS。外部Supabaseの実資格情報は未設定。隔離PGliteで実migrationを検査し、既存他アプリのDBは変更していない。
- WebKitで見つかったIndexedDB Blob保存の失敗を、ArrayBuffer+MIME保存へ変更。旧Blob行も読める。WebP非対応時のPNGを許容し、StorageはMIME付きの固定`.thumb`キーへ統一。
- 仕様監査Agent01の4件（人間承認ゲート、設定済みDEV認証、複製draft化、問い合わせ環境変数）を修正。独立再監査で当範囲のP0/P1/P2は0、PASS。
- 人間による10線画の承認は回答待ち。`npm run build`と直接のVite本番buildは、human承認hashと現行QAを要求する。未承認を技術確認で代替せず、demoのみ利用可能。
- 機能E2EはChromium desktop/mobile/320px、WebKit、PWAで50 PASS・用途別skip2・FAIL0。FirefoxはこのWindowsホストのSideBySide/mozglue解決で起動前に失敗。アプリのFirefox合格として扱っていない。
- Lighthouse最新測定はPerformance99、Accessibility100、Best Practices100、LCP1.8秒、TBT0、CLS0。実Androidの測定とは区別。
- 画像確認で最下段の色が33〜40pxはみ出す点を修正。stage高さを約50px調整し、背景/フレームボタンを44pxへ。追加layout検査とaxe・visual再確認でPASS。
- `collaboration.spawn_agent`が完了済み担当を含むthread上限で拒否されたため、公式の`codex exec --ephemeral --sandbox read-only`を使う独立監査経路を整備。同時稼働はrootを含め4以内、各担当は新規セッション・独立の役割、実装編集なし。Agent01はcollaboration、Agent02以降は一時CLIセッション。実行IDと証拠は`.local/audit-runs`、最終報告は`docs/audits`。
- Linux上のChromium/Firefox/WebKit検査と人間承認ゲートを`.github/workflows/quality.yml`へ追加。GitHubでの実行はまだ行っていない。Windowsのvisual基準をLinuxで流用しない。

根拠: [Codex非対話実行](https://learn.chatgpt.com/docs/non-interactive-mode)、[checkoutリリース](https://github.com/actions/checkout/releases)、[setup-nodeリリース](https://github.com/actions/setup-node/releases)。

## 2026-10-07 ユーザーの画像指定と監査修正

- 旧SVG線画10枚の正式採用はユーザーが明示的に却下。新規カタログを画像生成の白黒線画へ移行し、旧IDは保存済み作品の再編集用に残す。前日の承認待ち候補は無効で、新しい画像に人間承認を付け替えない。
- built-in image_gen でホーム12テーマを生成し、透過を保持した384/768px WebPへ変換して組込み。390px/1440pxの実Chromiumで12/12画像読込み、横はみ出し0、HTTP/ブラウザエラー0を確認。原画・プロンプトはcontent/brand-generated。
- 新しい10線画を画像生成。ユーザーの追加指定により、瞳は黒塗りせず、瞳の中に白く残せるハイライト枠を用意。原画と各修正版をcontent/generated-lineartに保存。極小領域/実際の漏れは画像生成による修正を継続中。色付き検査画像は内部debugに限り、利用者向けは未着色版。
- A02の古い表示からの削除、固定URLキャッシュ、サムネイル版不一致、毎保存の全thumbnail走査を修正。確認Projectとの一致を削除条件にし、画像をversion付きStorageキーへ、素材をSHA256 URLへ、IDBにpending索引を追加。独立再監査は未実施。
- A03の画面離脱/アカウント切替後の非同期操作、設定復元・初回取得raceを修正。実React/IndexedDB/deferredの18ケースが成功し、対策をメモリ内で外すと4所見すべてを検出した。独立再監査は未実施。
- A04の二重制約によるピンチ移動を修正。実ブラウザで更に見つかった部分描画の輪郭変化も固定画素キャッシュで修正し、Chromium/WebKitの120画像比較で差0。線画画像からのパスには余計な輪郭を追加しない。
- 独立Agent05は11素材・3画材・4色の再現性、30描画ケース、PNG再現性を確認し、監査中に修正された輪郭問題も独自に再検証してPASS。Agent09/10を実施中。20監査・新線画QA・人間承認・Firefox検査の未達は継続してNOT READYとして扱う。

## 2026-10-07 生成線画の統合と追加監査

- 最終生成10枚・408領域の原画、マスク、素材注釈、個別幅例外、SHA付き操作証拠を確定。瞳22個とハイライト22個は独立領域で、自動の反射光・陰影・質感を無効化。全件author-technical、humanは回答待ち。元のSVGへ戻して不足を埋めていない。
- Chromium desktop/mobile、WebKitの瞳E2E 24件成功。瞳だけの塗り、ハイライト単独の塗りと消去、再読込後の表示、PNG実画素を照合。全10生成線画のブラウザ描画120比較も差0画素。根拠はeyes-browser-results.jsonとengine-browser-generated.json。
- A07の画材ラベルのコントラスト、復帰/再試行/更新ボタン44px、低い画面でのパレット見切れを修正。320×568 / 390×568 / 320×740 / 390×844を通知あり・なしで確認。最初の配置テストはDOM fixtureを繰り返し残す不備で二重通知になったためfixtureを各画面前に撤去し、影響した4構成を再実行して成功。
- A09の他タブ更新による自動reloadを廃止。更新はホームで明示要求したタブだけが行い、別タブが開いている場合はSWのactivateを保留。実2タブの編集・ズーム保持と更新後offline復帰が成功。maskable PNGの透明な穴を背景色でflattenし、非不透明画素0を確認。
- A09の期限切れoffline起動とA10の削除対象race・他タブ認証消去・callbackポート・fragment認証エラーを修正。固定JWTと期待所有者をEdgeで照合し、認証切替後の副作用を中止。実SDK/共有Storage/IDB/HTTP stubの追加17ケースを含む関連85検査が成功。外部サービスは変更していない。
- 全体Vitestは21ファイル169件成功。生成素材の独立監査A06で、別形式の領域ID画像の誤読と、編集後QA失敗時の承認成功表示を検出し、修正中。修正済み項目の独立再監査と残りの専門監査は継続中。

## 2026-10-07 正式採用とブラウザ出力の確認

- ユーザーの「この10枚を正式採用する」という回答を受領。10件のQAを再実行し、原画・Path不変と現hashを確認してhuman承認を記録。`user-adoption.json`、`a06-final-asset-integrity.json`に証拠を保存。release guard・本番build・demo buildが成功。
- A06の独立QAはRGB ID mask・実寸縮尺・SHAを照合するよう修正。旧302＋新408の全710領域PASS。編集後QA失敗は承認記録へ書き込まずHTTP 409とし、後続build失敗時はrollback。22テスト、Python7ケース、実HTTP/Chromium3ケースで確認。
- 画像サイズを192/384/768pxへ分け、スマホの転送量を削減。390/1440pxでホーム12画像の読込みと表示を確認。Lighthouseは同じmobile模擬条件でPerformance87→97、LCP3.9→2.5秒、Accessibility100、Best Practices100、TBT0、CLS0。Android実機結果ではない。
- 新素材のホーム・編集画面をChromium desktop/mobile/narrowとWebKitで目視確認。8基準画像を更新後、更新なしの画面比較4ケースでPASS。
- Firefox OffscreenCanvasが非標準のPromise形式toBlobも持つためHTMLCanvas形式のcallbackが完了しない不具合を発見。標準convertToBlobを優先する修正により、旧コードで失敗した回帰3件を含む5件が成功。workspace内の診断用ブラウザで機能27件PASS・CDP専用1件skip、生成10枚の60描画比較で差分0。公式配布のWindows起動問題への対処と通常配布版との違いはtesting-browser.mdに記録。
- 独立A11で、cloud上限時のpull中断、別タブ競合退避先の未共有、64キーmetadataの破損を確認。専用担当が修正中。これらと残りの独立監査が完了するまでNOT READYを維持。

## 2026-10-07 同期再監査と操作境界

- A11の3件を修正。失敗項目を残してpull・後続処理を進め、IDB v3に所有者・編集世代・writer別の退避先を保存。利用者metadataへ内部キーを注入しない。旧v2移行、owner分離、削除後の復活防止、実SQLと500件境界を検査。cloud500＋pending1を一時保持する場合、backupは整理の説明付きLIMITとし、500へ整理後のexport/restoreを確認。独立再監査を開始。
- 全22ハイライトを1つずつ着色・消去する実UI検査へ拡張し、Chromium desktop/mobile＋WebKitで24ケース、Firefox診断版で8ケースが成功。瞳22個の黒、ハイライト22個の白、reloadとPNGを実画素で照合。
- DPR2の696×870描画surfaceでもCPU4倍減速で初回描画p95 22.9ms、描画機会proxy p95 47.9ms、drag/wheel約60fps。実機測定とは区別して全サンプル統計を保存。
- A08は通常のPCレイアウト・pan/zoom・modalに問題なし。Ctrl/Metaのブラウザ倍率操作をキャンバスが奪う点と、拡大中のkeyboard選択領域が画面外に隠れる点のP2を検出。修正と回帰検証を開始。

## 2026-10-07 作業再開後の修正

- A06再監査で連続編集後に旧オブジェクトへ入力するレビューUI不具合を検出。保存成功時の表/preview再構築と送信中の操作ロックで修正。実HTTP/UIの再読込なし3回編集・全7項目・送信値・保存値・承認hash一致を検証し、独立再々監査中。採用済み原画・承認記録は変更していない。
- A11初回3件の修正を含む全体212件が成功した後、再監査で応答喪失＋追記時の不要な競合複製と、同期中account切替によるpull取りこぼしを検出。送信snapshotの永続化と認証世代別の要求予約を実装・検証中。
- A08のブラウザ倍率ショートカット保持、拡大時の領域選択可視化、低いviewportでのfocusスクロールを修正。実componentで408領域×3倍率×順逆×3ブラウザの7,344回と、実UI9ケースが成功。400%相当ではfocus輪郭も画面内にあることを検査。診断用Firefoxと実機未検証の区別を保持。
- A17でGoogle認証の旧Gと黄色hoverを検出。現行公式グラデーションGを未加工で同梱し、専用ボタンへ分離。Google Sansは公式3,116 bytesの文字subsetとOFL全文を同梱し、CSS参照のApache-2.0もOSS表示へ追加。3ブラウザ5状態・マウス/Enter・busy二重操作拒否がPASS。実外部認証は送信していない。

## 2026-10-07 保存失敗・破損復旧と最終検証への統合

- A19のP0（保存失敗後の履歴離脱）を、表示中のrouteと未保存/保存中の状態を保持する遷移ガードで修正。保存して離れる・残る・明示破棄を用意し、保留中のIDB transactionでは破棄を無効化。関連30 unitと3ブラウザ12ケースが成功。
- A19の破損レコード問題を行単位の検証・隔離で修正。正常作品の編集・同期・バックアップを維持し、元データ書き出しと明示整理を設定画面に追加。11 unit、4ブラウザ構成で復旧操作・再読込・320px表示を確認。
- A19のHTTP本文停止を、header取得から本文読了まで同じ15秒期限で中断する実装へ変更。実SDKの再送・応答喪失後の追記・ログアウト・削除を含む関連61ケースが成功。
- A09再監査で、同期完了を待つ更新処理が編集中に到着する競合を検出。表示route・遷移保留・未保存/保存中・世代を更新送信とreload直前で照合し、SW側も最新の安全確認を要求する修正を統合。最新demo/prodは型検査と正式素材gateを含めbuild成功。
- A16の実SDK/HTTP/SQLを通す非demoブラウザ検証を追加。9ケース成功後、console検証を厳密化して最終実行を取り直し中。調査中にGalleryの表示中blob URLが次画像の準備前に解放される点を修正し、DOM切替後の解放とunmountの2回帰検査が成功。
- 独立再監査の04/05/06/07/08/10/11/13は各担当範囲でPASS。残る担当の再監査、固定buildでの全機能・visual・性能検証とAgent20を継続。現時点の総合判定は引き続きNOT READY。

## 2026-10-07 再監査で見つかった境界条件

- A19-04は明示破棄した保存失敗だけを、実際のerrorとaccount世代・作品IDに結び付けて解除。関連98件・3ブラウザ12件が成功し、他作品と設定の失敗は残る。
- A03-06は描画前のA→B→Aでも画面寿命を更新し、旧非同期の結果を破棄して新規読込を開始。PWA要求と保留URLも世代変更で無効化し、同一利用者のtoken更新では編集状態を維持する。関連83件成功。
- A17-03はViteの埋込preload helperに対応するLICENSE全文を収録し40項目へ。3配布build、public、HTTPの計10ファイルをbytes/hashで照合し成功。
- A19-04後の全機能検証は175成功・3対象外・2失敗。復元ボタン有効化前のpressと設定commit前reloadという待機条件を修正し、4構成8件の再実行が成功。失敗の生結果は保持し、最終全体検証へ成功を読み替えない。
- A09-05は公開前旧previewの確認応答を持たない更新方式で案内が繰り返される問題。安全条件を緩めず、READMEと利用者へ全タブ/PWA終了・再起動を案内する。実旧配布物→現行SWで手順を検証し、編集中と複数タブで強制更新されず、全client終了後の自然activate・同じ作品/設定・offline復帰を確認した。A11修正後buildで本採証する。
- 固定build `index-lQ-HfX9u.js` の初回性能再測定はLighthouse 96/100/100、CPU4倍/DPR2で未使用色の初回draw p95はおひめさま22.7ms・恐竜r01 95.2ms、恐竜の2rAF代理値113.3ms・混合操作54.7fps。実機値ではない。背景/枠と10回開閉も記録。最終版では30回開閉へ延ばし測り直す。
- A11再監査では競合コピーの対応だけがcommitする認証切替raceを検出。元作品は残るが保存先が不正になり再保存を拒否するため、transaction全体の中断と所有者再確認を実装・検証中。

## 2026-10-07 22:23〜 再開時の固定版検証

- 利用者の「つづきから」で再開。停止時の記録・成果物・採用hashを保持し、共通Core 0.1.0へproject adapterを接続した。既存仕様/画像指定/監査/承認を参照し、scope付き検索とcontext取得を確認。Core編集・再検査、モデル変更、有料API、スケジュール、commit/push/deploy、外部環境変更はなし。
- 最新3build・lint/型と最初の全体Unit372成功/localhost EACCES1失敗を記録。該当fixtureだけ権限調整して成功。最初の性能測定で恐竜CPU4/DPR2 p95129.3msを検出し、そのFAILを保持した。
- 鉛筆線の32opacity bucketでclipの繰返し処理を減らした。座標・seed・幅を保持し、90 CPU画素比較は最大差2/255。独立05は1224操作トレースと画像を照合しPASS。関連77件、変更後3build/型/変更lint成功。
- 最新固定版の性能はLH96/100/100、princess/dinosaurのCPU4 p9558.7/91.5ms、混在43.8/96.7ms。30開閉・warmup10とJS heap増分を生値で保持。独立12は現行identityを照合してPASS、実機/物理表示/長時間heapの将来改善A12-02 P3を1件とした。
- 最新機能177成功/対象外3/失敗0（13.3分）、非demo同期9成功（2.9分）、画面比較5構成成功（27.5秒、10基準PNG無変更）、最終全体Unit45ファイル373成功（22:54:53開始、92.01秒）。各前後build/source/harnessの一致を確認。mobile/desktop実画像を目視。生結果は`test-results/harness-resume/evidence-index.json`から参照する。
- 実SW更新保護と実旧preview→現行の移行が成功。全タブ終了後の自然activate、作品・2色・設定・offline再入場を保持した。独立09は公開前previewの運用移行としてPASS。旧UIの固定文は残り、保存完了→全appタブ/PWAウィンドウ終了→再入場を利用者へ案内する。
- 残る03/11/17/19も独立限定再監査PASS。各旧FAIL原文はhistoryへhash一致保存。01〜19の最新判定が揃い、20最終監査を実施中。総合READYはその判定前に確定しない。

## 2026-10-07 23:12〜 最終独立監査の統合

- Agent20は全19担当の最新原文、現行配布物/ソース/承認、生検証証拠、実画像を独立照合し、PASS／RELEASE-QUALITY PROTOTYPEと判定。未解決P0/P1/P2は各0、既存A12-02 P3が1件、新規所見/追加必須修正0。成功済み動的検査は反復していない。
- audit-tracker、release-checklist、resume-verificationへ最終判定と範囲を統合。共通Coreのrecordで`resume-20261007-release-final`をdoneとして保存し、受入条件と証拠を関連付けた（`test-results/harness-resume/final-record.json`）。未測定のモデル実行証明/使用量/ツール回数はunknownのまま。最終検査後に本体コード/正式画像/承認/配布物を変更していない。
- ローカル品質ゲートの完了と、仕様37の外部Supabase/Google/HTTPS設定・実接続確認・一般公開の未完了を分けて報告。実機/物理表示/長時間heapも未検証として保持。旧previewは保存エラーがないことを確認し、全アプリタブ/PWAウィンドウを閉じて再入場する案内が必要。サイトデータ消去は不要。

## 2026-10-08 初期要求と途中の指示の照合

- ユーザーの指示に従い、既存`docs/storybook-improvement.md`を統合計画へ更新。初期§1〜40（B01〜B40）、改善計画（M01〜M33）、チャットの指示元（I0〜I14）、変更・撤回・継続、証拠（E0〜E8）、不明点（U01〜U06）、次作業を記録した。後のユーザー指示を優先し、明示撤回のない初期条件は維持する。
- 初期貼付ファイルと`docs/product-spec.md`はバイト一致、SHA256 `05d4f3aaa8440aa4f151012fbfaeeabed40b80b7b42528bff3fbec421d176d9e`。原文は未変更。更新前の短い計画と、ユーザーが実装を指示した改善計画の本文を`docs/history/`へ保存した。取得していないメッセージID/送信時刻は作らない。
- 手動ハイライトはI8で廃止、未着色のハイライト枠はI9で許可。I12で旧候補の完成像は却下。最新の比較目標はホーム姫の実画像。白目の部位解釈はU01、紙目/3画材マスクの対応はU06で未確定。画像分析と実装担当の候補を、ユーザーの発言・採用と区別した。
- 未撤回の初期Desktop3列に対し現行4列、150〜220ms塗り広がりに対しv2即時描画のみ、全11素材/制作UIのv2対応に不足を記録。これらを暗黙の仕様変更や完了として処理しない。
- `test-results/storybook-improvement/traceability-20261008/evidence.json`へ観測時刻・SHA・固定した監査/生結果/画像を記録。旧採用10/10、42素材原本42/42のhash一致を確認。現行候補は10枚/148グループ/22眼/386選択領域。原本保全の確認は見た目・操作・新採用の証明ではない。記録scriptは既存出力があると停止し、このsnapshotを上書きしない。
- 先行Unit380成功とE2E144成功/38失敗/6skipは歴史的対象の証拠。最新の瞳・まぶた・反射光のソース修正は未生成/未build/未描画/未再検証。独立revision 4のSB-C04 P1/FAILは継続し、改善版はNOT READY。旧版の20担当PASS・性能値を改善版へ転用しない。
- AGENTSとproject adapterの参照一覧を統合計画へ接続し、画像指示履歴・release-checklist・audit-trackerにも現状と旧記録の区分を明記。共通Core、旧独立監査、旧承認、原画、配信build、作品データはこの照合作業で変更していない。以後の実装・検証・報告は統合計画の項目IDと現在対象の証拠を更新する。

## 2026-10-09 I17：共有Bezier・塗り境界・個別の目

- 最新の承認計画I17をV01〜V12へ分解し、白目=白（I16/I17）を確定。以前の白目選択色、全眼への茶/金混入、共通まつげ、車の顔、古い目の完成候補を変更/撤回として統合計画へ記録した。初期/I8の未撤回要件を消していない。
- 全10の元生成原画からnested inkの共有Bezierを制作。小部位・穴・角を保護し、同じ曲線で線/塗り/hitを生成する。exact hitと黒線下coverageを分け、明示even-oddと一回の白下地へ変更。silhouetteを守り、犬の鼻/口・亀の口を消さないよう、旧眼縁回収を実際のpupilを含む親の穴へ限定した。
- 姫のhome原本と比較し、視線、外側の白目、柔らかな暗瞳縁、虹彩繊維、小さい不規則な白反射を調整。男の子の残った原眼縁は制作輪郭で回収。非姫の追加まつげを廃止し、恐竜/動物/ロボットの20眼へ個別のopening/lid/iris/pupil/reflectionを制作した。線画ではハイライト枠を残し、着色/消去/両眼group/片眼regionへ共通適用。
- v3のviewportはnative DPR×zoomで512px tile/2px overlapを描き、cache上限32MiB。DPR変化にResizeObserver/resolution MQLと250msの軽い密度確認を追加。実CDPの密度変更ではeventが出ない場合があるため、Canvasが古いpixel数に留まる原因を修正した。DPR3→2→1を960×1200/640×800/320×400の原pixelとして撮影し、撮影前後のDPR/CSS/Canvasを照合した。
- 標準imagegenで顔なしショベルカー線画と透明home島を個別編集。生成原本・prompt/hashを`content/vector-generated/`へ保存し、480/960のhash付きWEBPを実装。機械部品を保ち、顔5領域の旧色は改善コピーから除いた。home新URLが旧SW正規表現から外れてoffline取得に失敗したため、限定hash URL判定を拡張。本物SWで更新/2tab/保留commit/実flush/offline復帰を新buildで再検証した。
- v1は旧描画、旧storybook-v1は保全した配信済みbundleに基づくv2、新IDはv3でdispatch。旧geometry/原画/装飾/承認/作品は保持。`Project`/`RegionPaint` AST、IDB version3、SQL migration3件は不変。別UUIDへのatomic改善copyで500/quota/abort時も元作品を維持する。
- 独立可視監査のVV-01〜07を不足列挙→修正→担当再確認で更新。初回〜revision7のFAILを残した。車の白2点はmorph closingや外周判定では解消しなかった。原sourceとcoverageは連続しており、固定白detail2件が色を後から覆っていたのが根因。source SHAで限定除去し、本当の3反射は維持。55f1のUnit/UI成功を見た目の合格へ流用せず、最終f3cで車3画材・全150実画像・lamp2/4倍を取り直した。
- 最終demo aggregate `f3c10731370481c0235c267e41aed0b1ff4b3591ec8338544289c6d8eb3ffb29`、runtime source `0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276`。10候補/403制作領域/383選択領域/146groups/20眼。開始・途中・検査後の配布/runtime/HTTP entry一致。開始後のcloud fixture2変更はUnit/browser実開始前に完了したと時刻/内容で記録し、全harness不変とは呼ばない。途中〜検査後のtest-harnessは`38ed428f70b475d45fd8e2891bff4f7288ce32a8f813f65375d31cae7f21682a`で一致。
- 最新49ファイル390 Unit、Chrome mobile15、desktop/narrow8、Visual更新5・更新なし比較5が成功。倍率/DPR90＋途中pan30＋fit復帰30、顔/lamp8、動的DPR3を記録。最終lint/typecheck成功。基準更新前に旧home/editor10PNGをbyte一致保存した。
- cloud本番試験buildは新素材の人間承認gateで停止。迂回せず、別途`non-demo source preview`の実SDK/HTTP/PGlite migration3で3engine9成功を確認した。build:null/productionBuildVerified:falseを記録。Vite WS9失敗、public no-cacheによるChrome offline2失敗は別rawに残し、fresh public HTTP cacheのfixture条件を明示。実サービス/本番SW/実端末の証拠ではない。
- CPU4/DPR2の最大面積group（姫スカート6領域）firstCanvas p95 7.0ms、最大所属group（ロボット14領域）13.3ms。3画材×12未使用色×2対象=72sampleを固定buildで、他の重い検査と分離して測定。画材別最大p95 23.0ms、2rAF代理max119.4msも削除していない。60fps/物理present/実機/長時間heap/LHは別未確認。
- 独立engine/旧作品互換性はf3cの限定PASS。独立目視も可視範囲PASS、VV-01〜07解消維持、新必須修正0。browser159枚は直接55＋以前直接確認した同一byte104。旧native車3画像と共通media JSON車entryは最新から除外し、他9の27枚＋最終車3枚を現在hashで照合してmanifest化した。rootは新home/editor10基準も直接開いた。
- 証拠整理で`Template.approved`の継承trueとhuman採用を分離し、QA/review canonical hashと配布byte hashも区別した。新版QA pass:false/review author-technicalを保持し、旧I5人間承認の転記はなし。本番release guardは維持。初期/I8のdesktop3列・tap演出・全11材質・専用陰影・v3制作UI・32scene受入・紙目対応、全体新版回帰/Agent20、実機/外部は未完了のまま。
- 今回の詳細は`docs/vector-revision-verification.md`、生証拠/hashは`test-results/vector-improvement/evidence-index.json`。関連architecture/engine/pipeline/authoring/sync/testing/画像履歴/監査進行/release文書を更新。共通Core・モデル/effort・有料API・他project・外部設定・commit/push/deploy・automationは変更していない。I17の局所ゲートPASSと全体NOT READYを分けて以後の基準とする。

## 2026-10-10 I19〜I23：姫1枚の完成原画方式と自然なメニュー

- I19により姫1枚の内部完成原画をbuilt-in image_genで制作し、13意味グループへ登録した無彩色の相対影/反射を選択色へ合成。原画はprivate保管、public/dist/ユーザー向け見本へ配布しない。元色と光の完全自動PSD分離ではない。自由色/3画材/同じ輪郭とgroupを維持する。
- I20の小丸だけの眼候補、I22で変更された黒い初期瞳候補を履歴として残す。最新master-v3は実生成原本princess-v2の白い瞳・単純輪郭をBezier化し、未着色と着色後のnative眼を分離。消去で白い線画へ復帰する。旧ID/旧原画/旧描画/旧作品は保持、別作品の改善copyを用意。schema/DB migration追加なし。
- I21/I23でホームborder/background/残留する四角いcontainer shadowと文字filterを除去。テーマheroは撤去、元の独立44px矢印の右10pxに80×62px非操作島画像。preview拡大を撤回し元のdesktop3列/mobile2列へ復帰。全ゲーム向け個人スキルyona-game-natural-uiを保存し、装飾枠/代替shadowを避ける一方、focus/選択などの意味ある操作状態を保持する方針を記録した。
- 最適化前revision-2は全Unit398/Chrome8/offline1/旧v3の40RGBA成功。一方、CPU4/DPR2の髪p95 118.2msで規定FAILを記録。v4陰影のdrawImageを整数元画素・領域＋16world pxへcropする変更をrevision-3へ分離した。native21全画素・旧master2種×4状態が前後一致。PM-E04の生成helper起動失敗guardも修正した。
- 最新固定buildは7aaa080425b7b6f28d868fa2b47d1454844166d5b106b13676d78891e84f4cda、sourceは7f36c84f69c81bb3cfa222295038824fe01954c50c0e9849eb9ae730a69f8f2c。型/lint/demo build、変更関連Unit13、Chrome8/offline1、旧v3全40RGBA一致を新実行した。最適化前の398件成功を今回の全件検査へ転用しない。
- 最新性能はskirt p95 311.2ms/hair34.2msで全体FAIL。CPU4/DPR2、各36raw、cold/画材別/lastCanvas/2rAF代理値、build前後一致を保持。AGENTSの同じゲート2回未達の停止規則を適用し、追加runtime変更/性能測定を停止。原因は未確定、次の最小作業はskirt遅延の単一traceによる切分け。人間採用/ホーム同等品質/残る9枚/全体READYは未完了。
- 原文指示・変更撤回・状態・証拠・次作業を統合計画I19〜23/P01〜07/E17〜19へ記録。詳しい結果はdocs/princess-master-verification.md。2独立担当の旧FAILを保持して追補し、共通Core・有料API・モデル/effort・他project・外部公開・commit/push/deployを変更していない。

## 2026-10-10 I24：途中作品削除と生成景観・装飾枠

- 途中タブの作品カードに独立した削除ボタン/確認を追加。取消・busy・失敗後retry、既存delete(snapshot)の所有者/CAS/tombstoneを使い、他タブの更新を削除しない。実利用者の作品を検証用に削除していない。
- 10完全風景と20連続意匠枠をbuilt-in image_genで各別生成。原本30/逐語prompt/標準生成元/hash/寸法をcontent/scene-art-v3に保存。旧低opacity景観/単なるmotif散布を置換。初回細帯枠は豪華さが弱いため不採用、前のhash素材を保持して生成比率の4辺分割/behind-artworkへ変更した。
- 新11背景/21枠（白/なし含む）のhash catalogと選択時取得を実装。旧catalog bytes/旧ID/旧533hash contentは保持。新compositionだけ主役の後ろへ描く。旧noProfile作品は旧選択肢を保ち、Project/RegionPaint/DB/schemaを変更しない。
- 固定build a149955e4dcae08e5aa5ce0115ca25fc671fc76603c920baac2b04249708546c、source f57d0e3d0cddb07a5abb0409e1c9a8a99d2fc1ce3c256699788f34b5faab8b90。型/lint/demo build、関連5ファイル25unit、旧v3 40RGBA一致成功。native全10のopaque主役非遮蔽は320px/DPR1/smooth。全倍率全scene実機試験ではない。
- 初回Chrome4成功6失敗（strict locator2種、細かい宝石単pixelとfit表示の比較）をrev1に保持し、検査側3ファイルのみ修正。同じapp/build/sourceでrev2 Chrome PC5/mobile5、SW offline1成功。姫×全30×2幅60表示と2048PNG、save/reload/複製、削除/競合/失敗を検査。実compositionのPNG照合は維持し、画面は同解像度にしたPNGの5×5平均・許容25で比較した。
- 統合計画I24/M22〜24/B22/B23/B25/S01〜05/E22を最新基準へ更新。詳しくはdocs/scene-art-v3-progress.md。旧P05性能FAIL2回の停止を維持し、性能再測定/Visual基準更新なし。人間新採用/全体READY/実機/実外部接続を今回成功としない。


## 2026-10-12 I33：なめらか塗りの完成原画展開と輪郭停止

- ホーム品質を目標に、姫の既存完成原画を再利用し残る9枚を標準image_genで制作。逐語prompt/生成元/原本/登録RGB/相対光map/hashをprivate保管。smoothだけに無彩色光と選択色に沿った輪郭、v3 native眼を適用。通常geometry/未着色/他画材/保存schemaは保持。I19姫限定のsmooth範囲を全10へ拡張する実装判断を記録した。
- 現行r1はbuild6ff8dd087f1efa5e6e9fdeea404af9cf5975adccb49450c46b6a49d3fe91a7fe/source5d718711ca5cfea4ba24b49827330e1193267b7cb21e833ee742fa1710779c51。37Unit/15Chrome成功、90native/100眼配色、30RGBA/geometry一致、旧素材924bytes不変。元RGB未配布、public/build30対象一致。全色全surfaceや実機/実外部/offline/性能/独立監査を今回PASSとはしない。
- 4倍目視で太い輪郭と灰色寄りの顔の線を不足と判定し、r2のoffline細線化を試作。穴のfillRuleで範囲19724画素FAIL→evenoddで33画素FAIL。同じゲート2回未達でAGENTSの停止規則を適用し、原本/候補/source/rawを保全してr1へ復帰。復帰後のsource/build/harness一致とlint成功を確認した。ホーム同等の最終品質は未完了。次は残る33画素の座標/alphaを単独切分け。
- 統合計画I33-S01〜04/M14/M18/P03/E30、testing、品質改善記録、監査/release台帳を更新。人間採用/Visual基準/全体NOT READY/P05性能停止/初期未完了を維持。subagent0、共通Core・モデル/effort・有料API・他project・外部変更・commit/push/deploy・automationなし。
