# 姫1枚の内部完成原画方式とメニューの検証

2026-10-10 JST。進行基準は [統合計画](storybook-improvement.md) I19〜I23 / P01〜P07。現在は確認用の姫1枚の候補で、全10枚の新方式、人間による正式採用、アプリ全体READYとは区別する。

## 現候補と指示の優先関係

- `gen-princess-bunny-v6-master-v3`、PaintingProfile v4 / `friendly-ink-v4`。templateファイルSHA256 `a1a88829b5247fc784354c885f32694d3d31a68ad56f7e80525c124b8d16d982`、canonical contentHash `079b9cfe87ae79756821185439768bdcca8508b49d9c5f0f7cd5ae8ea666fba6`。別の用途のhashを同一視しない。
- I20で「白地＋小丸だけ」のmaster-v1は却下。黒い初期瞳へ戻したmaster-v2もI22「黒目の部分は白くして」により変更。現候補は実際の生成原本 `content/generated-lineart/originals/princess-v2.png` の単純な白い瞳と上まぶたを再利用する。元画像SHA256 `3e02b14563366581e728ddca6925ddde7c1118b275e2c5055741bbb9dad862a7`。額/頬など眼以外の端接触componentは除外する。
- 未着色用の輪郭と着色後の目は別に描く。目を塗ったときだけ、選択色の虹彩、同系色のほぼ黒い瞳、白い反射を描く。消去で元の白い瞳へ復帰する。ハイライトへのtapは目へ統合、両眼まとめ/片眼部分を維持する。
- I23を優先し、テーマの島画像自体を戻るボタンとした案を撤回。従来と同じ独立44px矢印、その右10pxに80×62pxの非操作画像。hero見出しは撤去したまま、線画previewは従来のdesktop3列/mobile2列へ戻した。
- ホームはボタンのborder/背景に加え、残っていた `.island-sky` の薄い四角いbox-shadowと文字filterを撤去。実画像のalphaが唯一の原因だったとは断定しない。

## 生成原画と自由色の陰影

標準のbuilt-in image_genで完成原画を1点制作。保存先は [内部原画](../content/princess-master/originals/princess-finished-v1.png)、SHA256 `a1b87bc1f7f1491ed99d874f282a420381dce9c176ec0e16090f6a1a7bcff8c6`。同じ構図/位置を指定し、ホーム原画を画風の参照にした。プロンプトの保持された制作briefと参照画像は [generation.json](../content/princess-master/generation.json)。逐語プロンプトが未保持であることを明記し、briefを逐語記録と偽らない。有料APIへの切替はない。

原画はpublic/distへ入れず、利用者向けの見本として表示しない。13の制作済み意味グループをmaskとして、原色を除いた無彩色の相対影/反射を抽出。登録は元線画と同じoffset `[128,160]`、imageSize `[1344,1679]`。2048×2560の光map SHA256 `247e2f2f64403528fb181be24ef6f6ff033708c86ae4cef59e547f3c0172c0bb`。元原画のまぶた/口が二重に残った最初の失敗は `test-results/princess-master/native/` に保持し、保護領域と同一group内の補間で修正した。

選んだ色を基調に、暗いmapは乗算、明るいmapは無彩色反射として合成する。白でも影、黒でも光が残り、元の茶/ピンクに固定しない。紙目/蝋/鉛筆の固定座標とseedは維持する。線と目はベクター、柔らかな陰影mapと画材素材は有限解像度の画像であり、すべてが無限解像度になったという説明はしない。

## 修正版2の実行証拠（最適化前の履歴）

新結果は [revision-2](../test-results/princess-master/revision-2/) に分離。旧I19のログ/画像/失敗と旧監査を上書きしない。

| 検査 | 新しい結果・範囲 | 生証拠 |
| --- | --- | --- |
| TypeScript / ESLint / demo build | いずれもexit0。buildの既存のchunk/PWA非推奨warningは残る。本番production採用gateの成功とは別 | 実行tool session 83645 / 60614 / 43620、配布現物は下の固定identity |
| 全Unit | 398/398、failed0/pending0、success:true。20秒timeout設定を延長しない。cloud fixtureも含め今回のrunが成功 | [unit-all.json](../test-results/princess-master/revision-2/unit-all.json) |
| Chrome実操作 | 8/8、retry0。目へのtap統合/片眼、3画材、1/2/4/2.65倍×DPR1/2/3・移動/縮小、保存/reload/完成/2048PNG、旧v1/v3/master-v2から別作品copy、menu3幅 | [browser/results.json](../test-results/princess-master/revision-2/browser/results.json)、[screens](../test-results/princess-master/revision-2/browser/screens/) |
| メニュー実画面 | 390/320/1000pxの6PNGと実測。通常時のhome border0 / background透明 / shadow none / sky shadow none / lettering filter none。390初期8島以上、320overflowなし。画像80px、戻る44px、間隔10px。1000px preview幅286.66px | [menu](../test-results/princess-master/revision-2/browser/menu/) |
| オフライン | 新Service Workerで1/1。offline再読込→paint/背景/枠保持→編集→再接続 | [offline/results.json](../test-results/princess-master/revision-2/offline/results.json) |
| 旧v3の描画保全 | 10枚×blank/smooth/crayon/pencilの40RGBA hashが旧oracleと一致。旧ファイルを新方式へ書き換えていない | [compatibility/after.json](../test-results/princess-master/revision-2/compatibility/after.json)、比較元は旧 [before.json](../test-results/princess-master/compatibility/before.json) |
| 新native画像 | 21枚を新candidateから生成。4配色、3画材2048PNG、9倍率/DPR、未着色、reference再構成。作者はblank/4配色/4倍DPR3と実Chrome menuを開いて確認 | [native/evidence.json](../test-results/princess-master/revision-2/native/evidence.json) |
| 個人UIスキル | 候補と保存先のSHA一致。2scalar YAML/必須metadataを構造検査。標準quick_validateはPyYAML不在で未実行、追加package導入なし | [skill-validation.json](../test-results/princess-master/revision-2/skill-validation.json)、保存先 `C:/Users/yonaf/.codex/skills/yona-game-natural-ui/SKILL.md` |

固定build SHA256 `a6274daaad6556ae5a4e7ceb1dfa278258a30c9fb277c561206a193e5fe7e86c`、runtime source SHA256 `a72b8024701618dd9855c9247b5b20310459bf7fa24c9b692094260eaaf1591e`。[identity-before-audit.json](../test-results/princess-master/revision-2/identity-before-audit.json) は配信HTML/JS/CSSをdist現物へ照合し、検査harnessも固定している。

この固定版のCPU4/DPR2測定は **FAIL**。スカート6領域のfirstCanvas集約p95は91.6ms、髪7領域は118.2msで100msの条件を超えた。最大値はそれぞれ2060.8/424.6ms。生値は [performance.json](../test-results/princess-master/revision-2/performance.json)。集約値、画材別値、coldの遅延をすべて保持する。独立engine追補1も性能FAIL、visual追補1は画像・UIの範囲に限るLIMITED PASS。398件の成功はこの最適化前sourceの結果であり、次のsourceへ全件成功を転記しない。

## 修正版3：同じ画素を保つ陰影描画の最適化

`storybook-texture.ts`のv4陰影合成だけを変更。各小領域・タイルで2048×2560の陰影map全体をresampleしていた処理を、領域bounds＋16world-pixelの余白へ限定した。切出し元を整数画素に合わせ、描画先を元のworld座標へ戻す。clip、色、seed、map、眼、templateを変えていない。旧v3の描画分岐も保持する。制作helperのPython起動失敗時に古いtraceを読めるPM-E04は、`proc.error || proc.status !== 0`を拒否するguardへ修正した。

固定build SHA256 `7aaa080425b7b6f28d868fa2b47d1454844166d5b106b13676d78891e84f4cda`、runtime source SHA256 `7f36c84f69c81bb3cfa222295038824fe01954c50c0e9849eb9ae730a69f8f2c`。新templateのbyte/content hashは冒頭から不変。[identity-before-audit.json](../test-results/princess-master/revision-3/identity-before-audit.json) に配信照合と検査harness15件を記録。

| 最適化後に実行した検査 | 結果・範囲 | 生証拠 |
| --- | --- | --- |
| TypeScript / ESLint / demo build | 3コマンドexit0。既存のchunk/PWA警告は保持 | tool session 83918 / 38505 / 65091、上の固定identity |
| 変更に関連するUnit | 13/13、failed0。姫の専用8件＋共有engine5件（全10×倍率/DPRの90条件を含む）。全398件を再実行した結果ではない | [unit-rendering-isolated.json](../test-results/princess-master/revision-3/unit-rendering-isolated.json) |
| 新native画像の前後比較 | 21枚の全RGBA channelが一致。4配色・3画材・倍率/DPR・blank・参考再構成 | [native-comparison.json](../test-results/princess-master/revision-3/native-comparison.json)、[新native](../test-results/princess-master/revision-3/native/evidence.json) |
| 旧master-v1/v2の最適化前後比較 | 2旧ID×blank/3画材、8/8でtemplate SHA・RGBA一致。固定した旧texture moduleと新moduleを同一環境で比較 | [legacy-master-equivalence.json](../test-results/princess-master/revision-3/legacy-master-equivalence.json) |
| Chrome実操作 | 8/8、retry0。native拡大・3画材・保存/reload/PNG、目のまとめ/部分操作、旧作品3copy、menu3幅を新buildで再実行 | [browser/results.json](../test-results/princess-master/revision-3/browser/results.json)、[menu](../test-results/princess-master/revision-3/browser/menu/) |
| オフライン | 1/1、新Service Workerでoffline再読込/色・装飾・再編集/再接続 | [offline/results.json](../test-results/princess-master/revision-3/offline/results.json) |
| 旧v3全10枚の描画 | 10枚×blank/3画材＝40RGBA hashが保持した旧oracleと一致 | [compatibility/after.json](../test-results/princess-master/revision-3/compatibility/after.json) |
| CPU4 / DPR2性能 | **FAIL**。36標本ずつ。skirt firstCanvas p95 **311.2ms** / max422.1ms、hair34.2 / max183.6ms。配信build/source/scriptの前後一致、errors0。髪だけは規定内だが全体をPASSにしない | [performance.json](../test-results/princess-master/revision-3/performance.json) |
| ホームの表示完了後capture | 全12島の実animation.finishedとopacity=1を待ち、390/320/1000pxでhome/theme各6PNGを取得。CSSを強制変更せず、build/source前後一致。実行script SHAも保存 | [menu-settled/evidence.json](../test-results/princess-master/revision-3/browser/menu-settled/evidence.json)、[6PNG](../test-results/princess-master/revision-3/browser/menu-settled/) |

独立目視が元の`browser/menu/home-*.png`の一部に薄い島を指摘した。元テストは画像loadだけを待ち、0.5秒＋staggerの登場アニメーション完了を待っていなかった。元PNGはその時点の観測として保持し、最終表示の自然さの証拠には上の`menu-settled`を用いる。本体/固定harnessを変えず、別の読取scriptで表示完了を観測した。作者も新390px home/themeを開いて確認した。次回のcapture harness改善事項としてanimation終了待ちを残す。

性能のlastCanvas p95はskirt339.9/hair35.7ms、2rAF代理値p95は386.0/52.1ms。画材別firstCanvas p95（12標本なので最大値と同じ）はskirt smooth185.3/crayon422.1/pencil311.2ms、hair smooth183.6/crayon34.2/pencil30.5ms。全タップ100ms以内、物理present、実機PASSとは呼ばない。

同じP05性能ゲートが修正版2/3で2回未達となったため、[AGENTS.md](../AGENTS.md) の停止条件に従い、runtime変更と性能再測定の反復をここで停止。髪の集約値は低下した一方、スカートは今回悪化しており、cropがすべての遅延の原因/解決だったとは断定しない。結果を消さず、次の最小作業はスカートの遅い標本をdraw/texture/scheduling等に分ける単一のtrace採取と原因切分け。独立engineが挙げた最小対象はcrayon `#FF4FA3` の一タップ。次の実装・測定には新しい作業開始の指示が必要。UI修正と機能の検査成功は維持し、P05は未完了。

## 最終の独立追補と固定

- [engine追補2](audits/princess-master-engine-20261010.md)：source59、build735、identity harness4、pilot harness15の不一致0、修正版2のcontent675件も全byte保持。cropのbounds/正寸法/整数位相、native21・旧master8・旧v3 40状態、PM-E04のENOENT/null/nonzero拒否を独立確認。描画保全は限定PASS、P05はFAIL。成功status0だけ通る軽い負例で確認し、生成helperを再起動していない。
- [visual最終追補](audits/princess-master-visual-20261010.md)：新14画像を実際に開き、表示完了後の6menu PNGで薄さが残らないこと、白い線画の目、着色fit3画材・4倍DPR3を確認。I22/I23は限定PASS。native21の現物SHAも照合。人間受入・ホーム同等品質は未成立、desktop4列のB07差異と性能FAILを保持。
- [identity-after-audit.json](../test-results/princess-master/revision-3/identity-after-audit.json)：独立追補後も配信build/source/harness/entryすべて開始時と一致、`unchanged:true`。表示完了captureは別scriptのSHAと同じbuild/sourceに結び付けた。旧監査/旧FAIL/旧Visual基準を上書きしていない。

今回の候補は確認可能な実装として保存し、P05を未完了、全体をNOT READYとする。人間採用回答を生成したり、技術検査を主観受入へ置き換えたりしない。

構造化した[停止・次作業の入力](../test-results/princess-master/revision-3/handoff-input.json)を共有harnessのhandoffへ渡し、[保存結果](../test-results/princess-master/revision-3/handoff-record.json) / [project handoff](../.harness/runtime/handoffs/princess-master-i23-20261010-r3.json)へ記録。stateは`paused_no_progress`、未取得のモデル/effort実測・使用量はunknownのまま。共通Coreを変更/再検査した記録ではない。

## 保持する限界と次の作業

- 旧master-v1の独立FAILは [engine](audits/princess-master-engine-20261010.md) / [visual](audits/princess-master-visual-20261010.md) に残す。未着色の最新変更と未使用iris取得除去は各追補の対象hashに限定して判定する。技術分離・画像の限定成功と、性能ゲートFAILを混ぜない。
- 今回は姫1枚と同じ紙のうさぎ。残る9枚の完成原画方式、全32sceneの制作受入、実機、実外部同期、人間の正式採用、全体READYを完了としない。共通Core/DB migration/外部公開は変更していない。
- ホーム原画とほぼ同品質の人間受入は未成立。以前の独立目視に記録された、太い線、白目と顔の連続感、上側の細い白い弧などの差と限界は保持する。新しい候補を確認したという回答を、未受領の採用へ置き換えない。
- source cropの空pathが出た制作時の失敗は、maskの対象範囲を見直し、空path/無効boundsをguardで拒否して修正。未検査の失敗候補をcatalogに採用せず、現在のSHAを検査対象とする。
