# 2026-10-10 I24：途中作品の削除・空間のある背景・意匠のある枠

指示元はユーザーの「途中さくひんも消せる機能」「薄い半透明っぽい色味ではなく…自然、建物、空間を意識して画像生成」「素材をちりばめるだけじゃなく…意匠の凝った豪華なフレームも…絵を隠さない」。統合計画I24/M22〜24/B25に接続する。旧性能ゲートFAILは未解消のまま、今回の機能・素材をその合格と混同しない。

| 項目 | 状態 | 制作・実装方針 | 確認した証拠 | 次の作業 |
| --- | --- | --- | --- | --- |
| 途中作品の削除 | 検証済み（新Chrome6件） | 一覧の各途中作品に独立した削除操作。確認・取消・処理中・保存失敗を扱い、既存の所有者/CAS保護を使用 | PC/mobile各3件で取消・選択作品のみ削除・reload・他作品deep保持・別タブの新保存を保護・保存失敗後retryを確認。既存persistenceを再利用、schema/DB不変 | 実機/実外部同期とアカウント切替の新UI実操作は未確認 |
| 10背景＋白 | 検証済み（制作/技術/列挙表示）、人間採用未完了 | 地面・水面・遠近・自然/建物/宇宙を持つ10完全風景。全体opacity1 | 各別built-in生成10原本。全pixel不透明のUnit、姫との全10×PC/mobile実画面。旧低opacity風景は新候補から置換、旧原本/URLは保持 | 独立目視の記録と人間受入。全線画×全背景/実機は未確認 |
| 20枠＋なし | 検証済み（制作/技術/列挙表示）、人間採用未完了 | 各テーマの連続縁・接続角・素材感。金工/宝石等の豪華な枠も個別生成。比率を保ち4辺へ分割し主役の後ろへ描く | 初回96px細帯試作は弱く不採用、初回hashを保持。中央320pxからの開口を完全透明化。全10の320px/DPR1/smoothでopaque主役RGBA差分0（viewport/snapshot）。全20×姫×PC/mobile実画面 | 独立目視の記録と人間受入。全線画×全枠×全倍率の実画面は未確認 |
| 旧作品/旧装飾 | 検証済み（旧hash/旧v3 40状態） | 新ID/hash URL、旧素材/manifest/旧IDを保持し保存作品を自動置換しない | 旧catalog bytes保存、旧533hash contentを独立照合、新11/21可視、旧v3全40RGBA不変。新素材でsave/reload/複製/PNG/offline成功 | noProfile旧作品は旧選択肢/旧描画を維持し、新compositionは未提供。外部でその組合せにした復元Projectは未検証 |

生成は標準built-in image_gen、制作仕様と逐語promptは scripts/scene-art-v3-specs.mjs と新manifestへ保存。有料API・外部公開・共通Core・DB migrationは対象外。人間採用を推定しない。

## 制作物と再生成

- 原本30枚：[originals](../content/scene-art-v3/originals/)。生成原寸は各1122×1402。原本/標準生成元file/逐語prompt/SHA/実寸は[manifest](../content/scene-art-v3/manifest.json)、prompt集合は[prompts](../content/scene-art-v3/prompts.json)。人間採用は `not-received`。
- 派生制作：`node scripts/build-scene-art-v3.mjs`。背景は1120×1400不透明plate、枠は1600×2000世界座標へ同じ比率で正規化して4辺に分割。800×1000 rasterと160×200 picker thumbnailも保存する。有限解像度の画像であり、ベクターや無限の細部と呼ばない。
- 配布：`apps/web/public/content/decor/` と `backgrounds/`, `frames/` のSHA付きURL。[compiled/assets.json](../content/scene-art-v3/compiled/assets.json)に公開ID/URL/原本対応。旧catalog bytesは `compiled/before-backgrounds.json`, `before-frames.json`、旧素材と旧IDは削除しない。
- 新IDは `*-scenic-v3` / `*-atelier-v3`。主役の前に枠を描く旧compositionは不変。新compositionだけ `placement: behind-artwork`。選んだ風景plateと枠4辺をruntime取得し、選択一覧には小さいthumbnailを使う。
- 旧 `build-storybook-scenes.mjs` は旧scene制作の履歴用。新sceneを反映する最終工程は上の新builder。元の生成素材や旧hashを上書きしない。

## 固定版と生結果

build **`a149955e4dcae08e5aa5ce0115ca25fc671fc76603c920baac2b04249708546c`**、source **`f57d0e3d0cddb07a5abb0409e1c9a8a99d2fc1ce3c256699788f34b5faab8b90`**。生結果は `test-results/scene-art-v3/`。検査中のruntime変更なし。[独立確認後のidentity](../test-results/scene-art-v3/revision-2/identity-after-audit.json)でもbuild/source/harness/配信entry不一致0。[31証拠index](../test-results/scene-art-v3/revision-2/evidence-index.json)に実ファイルSHAを保存した。

| 実行 | 結果・証拠 | 範囲と限界 |
| --- | --- | --- |
| 型/lint/demo build | revision-1/build.log、revision-2/typecheck.log・lint.log成功 | 本番採用gateや全体READYではない |
| 関連Unit | [revision-1/unit.json](../test-results/scene-art-v3/revision-1/unit.json)：5ファイル25成功 | 新30hash/不透明/開口、全10非遮蔽、姫/輪郭/画像cache。全Unit398は今回実行していない |
| 旧v3描画 | [legacy-compatibility/after.json](../test-results/scene-art-v3/revision-1/legacy-compatibility/after.json)：10枚40状態一致 | 固定oracleを上書きせず実行。旧作品の新しい正式採用を意味しない |
| 初回Chrome | revision-1/browser/results.json：4成功6失敗、前後identity一致 | status複数/画材と同名枠のstrict locator、宝石単pixelとfit表示を同じとした検査不備。trace/スクリーンショットを保持 |
| 修正後Chrome | [revision-2/browser/results.json](../test-results/scene-art-v3/revision-2/browser/results.json)：PC5＋mobile5成功 | 修正は検査側だけ。PNGの生成composition照合を維持、fit表示は同じ解像度のPNGの5×5平均と比較・許容25不変。全30×2幅60表示、IDB/reload、塗り不変、完成/2048PNG/別作品copy、削除/競合/失敗 |
| 本物SW offline | [revision-2/offline/results.json](../test-results/scene-art-v3/revision-2/offline/results.json)：1成功 | 新空島＋宝石枠＋塗りをoffline reload/編集後online reload。全30のoffline組合せや実機の成功ではない |
| 作者目視 | 原本一覧2枚、実Chrome一覧4枚、mobile削除2枚、royal2048PNGを直接開いた | 奥行き、連続枠、顔/髪/手が前に残ることを確認。主観的な人間採用やホーム同等品質は未確定 |

実Chromeの確認一覧は `revision-2/scene-chrome-{desktop,mobile}-{backgrounds,frames}-review.png`、入力60枚のSHAは [contact-sheet-inputs.json](../test-results/scene-art-v3/revision-2/contact-sheet-inputs.json)。画面の拡大操作ボタンはUIにだけ表示され、PNGには含まれない。

旧P05の性能FAIL2回（最新skirt p95 311.2ms）は未解消。今回性能測定を再開していない。全体NOT READY、人間採用/残る9枚のmaster展開/実機/実外部同期/全体回帰・最終監査は継続未完了。Visual基準更新なし。

## 独立確認と次の作業

[engine原文](audits/scene-art-v3-engine-20261010.md)と[visual原文](audits/scene-art-v3-visual-20261010.md)は今回の範囲で限定PASS、必須修正なし。コード担当は原文/manifest/SHA/提供生結果を照合し、視覚担当は28画像を直接開いた。どちらもUnit/Chrome/性能の再実行者ではない。全体READY・人間受入へ拡大しない。

SA-V01は途中一覧の姫thumbnailが撮影時にloadingだった限界で、最終表示の不具合とは未確定。SA-V02はroyal枠の王冠と姫の王冠の接近をP3任意所見として保持する。主役を隠す欠陥ではなく、人間の制作確認で位置を調整するか判断する。全30の正式採用は未受領。今後の検証は新出力先を指定し、この版の原文/失敗/生結果を上書きしない。

今回のlocal候補の実装・検証という区切りは `revision-2/handoff-input.json` / `handoff-record.json` と project-local `.harness/runtime/handoffs/scene-art-i24-20261010-r2.json` に記録する。旧性能停止や残りの統合計画を完了にしたという意味ではない。
