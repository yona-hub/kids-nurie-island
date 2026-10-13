**Agent 12（パフォーマンス）独立再監査：PASS**

対象：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`  
監査日：2026-10-07 22:49 JST  
判定：**A12-01解消。P0＝0／P1＝0／P2＝0／P3＝1（測定範囲の将来改善）**。今回確認したソースと固定demo配信に、公開前の修正を必須とする性能上の実不具合は確認しませんでした。この判定はAndroid実機、物理画面のpresent時刻、GPUメモリ、長時間のリークなしを証明するものではありません。

**範囲・独立性・履歴保持**

- `AGENTS.md`、`docs/product-spec.md:1373`の性能目標・33〜36節、`docs/testing.md`、初回A12-01を参照。既存の実行結果を利用し、測定コード・生JSON・現在ファイルを独立に照合しました。他専門監査の結論は採否の根拠に使用していません。pencilの見た目・質感の合否は担当外です。
- 今回は新しいLighthouse、ブラウザ操作、unit/E2E、CPU Canvas、buildを実行していません。読み取り・hash計算・集計・監査文書保存のみです。プロダクト、測定スクリプト、旧結果、外部サービスは変更していません。
- 初回監査原文を `docs/audits/history/12-performance-20261007T134804.md` へバイト単位で保存。元と保存コピーは5,885 bytes、SHA-256 `7d7722aa9a1d8a11c6cb6a35fa3a0901b6a5780ff9f0d8faefb16e3d7bcb3cfb` で一致。保存証跡は `test-results/harness-resume/pencil-fix/performance/audit12-history-preservation.json`。

**現行版との同一性**

最新のLighthouse summary、princess DPR2、dinosaurs DPR2、lifecycle30の4報告は、すべて同じWindows Headless Chromium **153.0.8010.12**、次のidentityを記録しています。240 build files・48 source files・4 harness filesの各bytes/SHAを現行ファイルから再計算し、**不一致0**。JSON配列からのaggregate再計算も一致しました。

| 対象 | SHA-256 |
|---|---|
| dist-demo | `c4e28446bf0fd643b0186e1491242322c311c33f3ff7215da8a968c05752c242` |
| 本体ソース・package-lock・vite設定 | `7727957b303e92735a133ae82623afbc6b64fe16d5fa6bf7a944edbc527e9f23` |
| 性能測定コード4ファイル | `5725e579157fd54ba8e272c5a7d111a53ebfe63ed4f7e943d0bc77f36a498e6b` |
| 現行dist（別配布物、今回の実測対象外） | `4b034afeec07df90e95fe3cded715983ef26a84888c01dfa4900fd071ca17729` |
| 現行cloud fixture build（別配布物、今回の実測対象外） | `401ace16caebd3f8c6129110b1b13b91e3c622a1d39e7c4edd672f1a2fb54993` |

`performance-evidence.mjs:18`は測定前後で配信HTML/JS/CSSとdist-demoを照合し、`:41`はbuild・本体ソース・harness・配信entryの変更を拒否します。4報告すべて`buildUnchanged: true`。Lighthouse rawのfetchTime・category・主要5指標をsummaryと照合し一致。rawのJS URLも現行 `assets/index-yWC7UATR.js` です。

今回の22:47 JSTのHTTP読み取りでも `http://127.0.0.1:4174/index.html` と現行HTMLのhash一致、JS `3a6cf25df382a99fdce0f286ac7994fddba291309e4628633e7d22ef5b2ffcd5`、CSS `8204170989d98974e978eebf572396118a208096e56256cc723c9d72e14efed8` の一致を確認しました。最初のsandbox内fetchは失敗しましたが、許可されたlocalhost読み取りに限定した昇格で成功しています。証跡：`audit12-http-identity.json`。

同一性の範囲は列挙されたbuild/source/harnessです。docs、測定対象外のtest runner、全依存ライブラリの実ファイルをこのsource hashに含むとは扱いません。3buildのlogを読んでpencil最適化後の出力名・サイズを照合していますが、demoの実測値を別hashのrelease/cloudへ無条件に転用しません。

**測定値と方法の確認**

対象は `gen-princess-bunny-v6/r36` と、初回監査の最大領域 `gen-dinosaur-eggs-v4/r01`。390×844 CSS px、DPR2、Canvas backing 696×870、CPU1倍/4倍です。各条件で3画材×12の異なる実swatch色＝36サンプルと、pan/wheel/zoomに組み込んだ新しい青4色を保存。全160タップの時間値は有限、画材ごとの12色は重複なし、4条件すべて36＋4の件数一致。生サンプルからp50/p95/maxを独立再計算して保存summaryと一致しました。

| 領域 / CPU | 未使用色の初回Canvas描画p95 / max | 未使用色の2rAF代理p95 / max | 混合操作の初回描画p95 | 混合操作の2rAF代理p95 | 推定FPS |
|---|---:|---:|---:|---:|---:|
| princess / 1倍 | 7.7 / 8.7ms | 31.6 / 76.0ms | 6.5ms | 28.5ms | 60.00 |
| princess / 4倍 | 58.7 / 63.5ms | 89.6 / 124.5ms | 43.8ms | 80.5ms | 57.69 |
| dinosaurs / 1倍 | 19.9 / 20.7ms | 32.5 / 74.9ms | 17.7ms | 21.5ms | 60.00 |
| dinosaurs / 4倍 | 91.5 / 92.6ms | 110.0 / 113.3ms | 96.7ms | 120.0ms | 54.80 |

CPU4倍の画材別初回描画p95は、princessがなめらか21.0／クレヨン28.0／いろえんぴつ63.5ms、dinosaursが16.6／58.2／92.6msです。12サンプルのp95はこのスクリプトの順位定義ではmaxと等しく、母集団全体の保証ではありません。

`check-interaction-performance.mjs:64`はpointerup captureから時刻を計り、`:71`は表示Canvasへの最初のdrawImage呼出し終了を記録します。続く2回のrAFは**描画機会の代理値**で、物理画面の表示確認ではありません。初回描画が100ms以内であることを確認できましたが、恐竜CPU4倍の代理値110〜120msやprincessの最大124.5msを隠して「視覚応答すべて100ms以内」とは判定しません。背景・枠がある場合、最初のdrawImageはrender全体の完了とも一致しません。

FPSはmixed操作中のrAF平均間隔から計算される推定値です。ドラッグ以外のボタン・paint待機も計測区間に含まれます。CPU4倍の最大frame intervalはprincess66.7ms、dinosaurs116.7ms。体感60fpsの全フレーム保証はありません。frame時刻配列そのものはJSONに残っていないため、FPSの完全な生データ再計算は未実施で、計算式と集計値の照合に限ります。

旧 `test-results/harness-resume/performance/interaction-performance-dinosaurs-dpr2.json` は保持しています。旧build `6952c727…` のCPU4倍p95 **129.3ms**、mixed105.2ms、`pass: false` は履歴の失敗として確認し、現行buildの結果へ混ぜていません。

**startup・scene・memory・network・bundle**

- **Lighthouse**：22:38 JST、v13.5.0、モバイル模擬、DPR1、simulated throttling、CPU multiplier4。Performance96／Accessibility100／Best Practices100。FCP1,659.73ms、LCP2,564.60ms、TBT10.5ms、CLS0。rawのhost user agentはWindows HeadlessChromeです。Android風network user agentを実端末の証拠とは扱いません。
- **startup**：lifecycleは新しいcontextと同contextでSW制御後のreload。ホームのボタン表示を自動操作で観測したready時刻は、CPU1倍で初回219.8／再訪47.8ms、CPU4倍で690.9／263.0ms。観測待機のoverheadを含み、ネットワーク制限のないlocalhostの結果です。すべての画像読込みやSW installの完了時間ではありません。CPU4倍の初回画像resourceはtransferSize0も記録されているため、完全に空のnetwork cacheから全画像を取得した測定とは主張しません。
- **背景・枠**：各3種を1回ずつ選択。CPU1倍の初回draw最大22.7ms／2rAF最大48.0ms、CPU4倍41.1ms／66.9ms。該当スクリプトは実drawとmodal消失を両方待ち、保存作品30回の再開では同じproject IDと編集readyを確認します。今回の6sceneで長時間停止やpageerrorは記録されていません。
- **memory**：各CPUで実UIを30回開閉、0〜9はwarmup、10〜29を集計し、30回すべてのGC後heap値を保存。CPU1倍は5,034,704→5,180,188＝**+145,484B**、CPU4倍は5,059,700→5,206,408＝**+146,708B**。増分再計算一致。測定区間のJS heapは最大約5.28MB、backingStorage約578KBで、20点への直線当てはめは約8.5KB/6.1KB per cycleの正の傾向です。この短期増加だけでプロダクトの無限リークと断定できず、安定化・リークなしの証明にもなりません。GPU・プロセス全体・長時間利用のmemoryは未測定。
- **network**：Lighthouse rawはHTML、JS、CSS、島画像12枚を記録し、公式線画`/content/`の全件先読みを記録していません。lifecycleのホームresource一覧も`/content/`なし。現在SW precacheは18 entries（同じicon3件の重複を除く15 URLs）、一意ファイルのraw合計**742,618B**、content entries0。`vite.config.ts:34`のcontent除外、`Home.tsx:132`以降のtheme後catalog取得と整合します。ただしpage resource一覧はSW内の通信全量の記録ではありません。
- **bundle**：現行demo初期JS raw536,636B／今回Node gzip既定換算153,347B、CSS40,227B／9,511B。LighthouseでのJS転送記録は153,831B（headers等を含むため同値とは期待しません）。release初期JSは同じrawサイズ／gzip153,344B、cloud fixtureは536,824B／153,413B。buildの500kB chunk warningは保持。AppのEditor/Gallery/Settingsはlazy importですが、SW install時にはこれらもprecacheされるので「初回PWA通信はmain JSだけ」とは主張しません。

ソースではキャッシュ16MiB上限と追い出し時bitmap縮小（`cache.ts:20`）、canvas約2,048,000 pixels/DPR2上限（`engine.ts:104`以降）、dirty boundsのみpaintLayer更新（`:391`以降）、描画animationの取消し・cache解放（`:303`, `:476`）、ResizeObserver・wheel listener cleanup（`ArtworkCanvas.tsx:124`, `:196`）、CSS transformでのpan/zoom（`:364`）を確認しました。最終表示のlayer合成自体はCanvas全体で行います。「全Canvas再合成なし」とは扱いません。scene decoded cache6件／disk40件、ObjectURL解放、thumbnail/completion timer・event listenerのcleanupも確認しました。pencilは最大32 bucketで長いstrokeをまとめる現行実装で、これを品質同一性の証明に用いていません。

**A12-01 — 現行配信ビルドの性能測定証跡不足：解消**

- **Severity**：旧P2、今回未解決P2へ算入しない。
- **根拠**：最新4結果のbuild/source/harness hashと現行ファイルの全件一致、HTTP HTML/JS/CSSの独立一致、Lighthouse raw/summary一致、生36＋4サンプル一致。証跡は上記JSONと `audit12-independent-evidence.json`。
- **再現方法**：測定スクリプトのinventory順で現行ファイルのbytes/SHAと各結果`build`を比較し、Lighthouse rawのnetwork JS URLを現在HTTP/HTMLと照合。生サンプルをphase・materialで分け、各count・distinct color・p95を再計算。
- **影響**：旧buildへの測定値適用という初回監査の問題は解消。現行demoの性能結果として採用可能。
- **推奨修正**：今回の指摘に対する追加プロダクト修正なし。ソース・build・測定コードが変わった場合はidentity固定と該当測定を更新。
- **修正必須か**：追加修正なし。
- **再テスト項目**：変更がある場合のみ最新buildのLH、3画材12色、恐竜r01、mixed操作、scene、startup、30cycleを分離実行。今回は重い実行を追加していません。

**A12-02 — 実機・物理表示・長時間heapの確認範囲拡張：将来改善**

- **Severity**：P3。現行コードの再現可能な実不具合と断定した指摘ではなく、確認範囲と残る性能余裕に関する追跡項目です。
- **根拠**：CPU4倍の恐竜2rAF p95 110/120ms・FPS推定54.80、warmup後20開閉でJS heap約146KB増加。現在の測定はWindowsの短い模擬操作のみ。
- **再現方法**：上記rawSamples・frame集計・lifecycle.cyclesの10〜29を確認。実機の端末名、OS、ブラウザ、build hashを記録し、長時間操作後のheapと保持参照を調べれば適用範囲を拡張できます。
- **影響**：中価格帯Android全般で快適、物理表示100ms以内、長時間リーク0の断言を支える証拠はありません。現在の結果から重大なfreezeや原因の特定された無限増加は確認できません。
- **推奨修正**：将来の端末評価で実機操作、長い開閉・色替え、retained objectの比較を実施。FPSのframe配列も保存すると独立再計算が可能。確認された保持原因や長い遅延があれば、その時点でSeverityを再判定。
- **修正必須か**：今回固定版への追加実装修正は必須としない。実機・長時間性能を検証済みと表示するには、それを支える別証拠が必要。
- **再テスト項目**：Android実機の初回/再訪・全3画材・恐竜r01・混合pan/zoom、長時間開閉、heap snapshot/保持参照、可能なGPU測定。

**未実施・適用範囲**

Android実機、Firefox/WebKitの性能、DPR3、高解像度実画面、全10線画のブラウザ性能、長時間・多数保存作品・PNG export中の性能、GPU、実Supabaseの通信/同期性能は未実施です。rootのcloud E2E fixtureは実サービスの性能証跡ではありません。今回の独立検算は既存実行の再実行ではありません。

**最終判定：PASS。A12-01解消。P0＝0／P1＝0／P2＝0／P3＝1。** 他監査・全体リリースゲートの合否はこの報告から推定しません。
