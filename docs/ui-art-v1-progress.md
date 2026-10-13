# 2026-10-10 I25：肌色と生成イラストの操作UI

指示元は利用者本文「肌色のバリエーションを多くしたい。パレットや島、はいけいアイコン、かざりわくアイコンなど画像生成していないものは画像生成して適用してください」。統合計画I25/T表/B17/B18へ接続する。数の指定はないため、肌色24色の追加は制作判断と区別する。

既存11島×12色の132 HEXを残し、「はだ」の24色を追加して12島・156色にした。明るいクリーム、もも、オークルから深い褐色まで4段階を用意し、24色に異なる日本語名を付けた。初期I0の肌色カテゴリなし・11島固定はこの指示で変更する。肌色以外の旧132色、初期family、まとめ塗り、画材、作品の色は維持する。

| 項目 | 状態 | 確認した事実 | 次の作業 |
| --- | --- | --- | --- |
| 肌24色・旧132色 | 検証済み（列挙local範囲） | 全156色のUI選択/旧132 HEX一致。肌24色はsmoothで肌4領域へ各保存、crayon/pencilは各1色。最後のpencil作品をreloadし2048×2560PNGの出力/寸法を確認。肌24色の中心RGB×3幅は72件完全一致 | 全156色×3画材の描画/PNG画素比較は実施していない |
| 生成UI25点 | 検証済み（制作/技術/列挙表示）、人間採用未完了 | built-in image_genで個別25素材、原本/逐語prompt/SHAを保存。主な絵のアイコンを置換し、日本語DOMラベルと機能記号を維持。25原本/25配信hash/alphaを照合、独立目視が縮小表示を確認 | 現候補の人間受入、実機 |
| 小画面/PCの収まり | 検証済み（通知なしの列挙3幅） | 初回の肌下段切れを修正。320×568/390×844/1200×1000で初期scrollY=0、全24buttonが画面内、操作44px以上、focus-visibleとキーボード選択を確認。独立目視で絵/左右操作の非重複 | 肌24色と同期/更新通知の同時表示、実機は未確認。320では紙面約194px高 |
| PWA/共有画像 | 検証済み（派生実画像/既訪問offline） | PWA3種/OGP島ROIの非空を検査、作者/独立が島を目視。表示した25生成UIのcache、offline editor19img/Home4imgとCSS board/dabのdecode、肌保存を実SWで確認 | インストール後の実機アイコン/外部SNS表示/初回offlineは未確認 |
| 保存/既存機能 | 検証済み（列挙Chrome回帰） | Project/RegionPaint/schema/DB不変。肌4領域save/reload/reconnect、途中削除/取消/別タブCAS/失敗保持retry、背景/枠/PNG/複製を新buildで確認。旧content869のbyte保持を独立照合 | 全保存世代のRGBA回帰を今回再実行していない。実外部同期/アカウント切替/全体回帰は別 |

## 制作物と再生成

- 原本：[content/ui-art-v1/originals](../content/ui-art-v1/originals/)。25点すべて標準built-in image_genの個別生成。原本を変更しない。追加の有料APIを使わない。
- 最終逐語prompt集合：[prompts.json](../content/ui-art-v1/prompts.json)。標準生成元ファイル、原本SHA、実寸、指示元、制作日時は [manifest.json](../content/ui-art-v1/manifest.json)。`humanAdoption: not-received`。
- 構成：色島12（旧11色＋肌）、パレットアイコン/木製の紙パレット本体/色見本用alpha形状3、なめらか/クレヨン/鉛筆/消しゴム4、背景/枠2、続き/作品/設定/ロゴ島4。計25。
- `node scripts/register-ui-art-v1.mjs ID SOURCE.png` は原本の登録。`node scripts/build-ui-art-v1.mjs` はSHAを照合し、transparent lossless WebPを生成。icon/island192×192、board1200×400、dab128×128。配信25点計1,325,682 bytes、[compiled.json](../content/ui-art-v1/compiled.json)にhash対応。
- 配信先：[apps/web/public/images/ui-art-v1](../apps/web/public/images/ui-art-v1/)。hash16付きURL。`IllustratedIcon`・生成TS map/CSSから実UIへ組み込み。全25の一括prefetchはしない。Service Workerは専用CacheFirst、50件/90日上限。
- `node scripts/build-brand.mjs` は生成ロゴ原本からPNGを作り、PWA3種/brand.svg/OGPへ適用。初回の192px WebPをSVG内へ埋める案は撤回し、原本由来512px PNGを使う。OGPはSVG内画像を解釈させずCanvasへ直接合成する。
- 元ソース8点とSHAは `content/ui-art-v1/before/manifest.json`。追加のbrand builder/旧brand.svg/旧PWA3点/旧OGPもbeforeへ保存。全リポジトリの完全バックアップとは呼ばない。既存ホーム12テーマの生成原画とI24背景/枠は再生成しない。

生成素材は有限解像度。文字は実際の日本語DOM/SVG、色はHEXのCSSから描き、生成画像に焼き込まない。選択/フォーカスは意味を持つ輪郭として保持し、装飾目的の四角い枠や影をアイコン容器へ加えない。

## 失敗と修正の記録

初回buildは `0b85e4d6b69c34ce45c3b8aaea4752d81859de9c3590e6f6c36396b1cfa08bfc`、sourceは `7ef54910ae2acf2a50ebf3dba002c1828d46a50b3939076d6651ab1c62a86c6d`。前後identity一致とChrome6成功を保持するが、**独立確認で見つかったブランド欠落・肌下段切れのため初回候補はFAIL**。6成功を完全な見た目の合格としない。

1. 生成dabの中心alphaは252〜253で、元画像だけでは選択HEXの表示を保証しなかった。元画像を加工せず、実色の不透明な中心をCSSに重ねた。元alphaの不足を消さず `revision-1/initial-mask-failure.json` へ保持。初回/修正版のChromeで肌24色の中心RGBを各viewportでHEXと厳密比較する。旧132色も全て選択するが、全132中心pixelを今回サンプリングしたという意味ではない。
2. SVG内WebPがPWA/OGPへ出力されず、島が欠落。独立UI-E01。旧dist-demo5点を初回identityのSHAと照合して `revision-1/brand-failure/` へ保存。alpha検査だけでは空画像を見逃したので、PWA3点とOGP島ROIのRGB分布も検査へ追加した。
3. PNG埋込にするとsharpのPWAは描けたが、napi SVG経路のOGPには出なかった。新しい非空検査で検出し、`revision-2/brand-first-repair/`へ中間OGPを保存。CanvasにPNGを直接描く修正後は非空検査に成功。元データと初回失敗を削除しない。
4. 肌下段がdesktop1200×1000と320×568の初期viewport外へ出た。独立UI25-V01。初回testのfullPage撮影とfocus後の収まりは、この初期収まりを保証していなかった。現修正版ではfocus前の全24button rectを検査する。
5. revision-2の追加offline検査は、実CSS maskがoffline200だった後、診断用JSfetchが失敗した。Vite preview応答の `Vary: Origin` に対しCSSはOriginあり、JSfetchはOriginなしでcache variantが違った。trace/失敗/当時のtestを保持し、同じCORS条件のImage decode/Canvas alphaへ検査だけ修正。revision-3はapp/build/source不変で1成功。失敗した通信を無視するconsole緩和やSW変更は行っていない。

## 修正版の固定対象と検証

修正版build **`547dd061e035290c533f2fdf067fbd326ea30ad21524d202a99cff14ac5244b5`**、source **`87706559ed4d8deefbc3ab0cefb2a15ea225da52c3f09271dbd90e281dd141d5`**。[開始identity](../test-results/ui-art-v1/revision-2/identity-before.json)に配信HTML/JS/CSS・全dist/source・関係harnessを固定。検査前後/独立確認後の照合を行う。

| 実行 | 現結果/証拠 | 範囲と限界 |
| --- | --- | --- |
| 型/lint/demo build | revision-2/build.log、revision-3/typecheck.log・lint.log、全exit0 | demo確認。正式採用/本番公開ではない |
| 素材/ブランド | [revision-2/asset-integrity.json](../test-results/ui-art-v1/revision-2/asset-integrity.json)、25原本/25配信hash/alpha、PWA3種/OGP非空 | maskable全pixel不透明。一般iconの丸角は透明で正常。元dab中心alpha252を実画面RGBの合格と混同しない |
| UI/肌色 | [revision-2/browser/results.json](../test-results/ui-art-v1/revision-2/browser/results.json)、6成功 | PC/mobile/small各2件。旧132色を全選択、肌24色smooth保存、crayon/pencil各1、最後のpencilのみreload/PNG寸法。全156色のPNG画素比較ではない |
| 初期収まり/実RGB | 各revision-2/ui-chrome-*/ui-evidence.json・4PNG | 72中心RGB一致、最下端965/819/555.59375、通知なし。320紙面155.19×193.98px。全132色中心pixel/実機は別 |
| 追加offline初回 | revision-2/offline/results.json、1失敗、当時test/trace/分析を保持 | CSSと診断JSfetchのOrigin variant不一致。実装不変で検査を修正 |
| 本物SW offline修正版 | [revision-3/offline/results.json](../test-results/ui-art-v1/revision-3/offline/results.json)、1成功、ui-art-offline-chrome/offline-evidence.json | controlledな既訪問で全25が自然に表示されcacheへ。offline19img/4imgとCSS2素材decode、肌4領域のsmooth復元/pencil再保存/online維持。未表示素材を事前取得した結果ではない |
| 既存操作の限定回帰 | [revision-3/regression/browser/results.json](../test-results/ui-art-v1/revision-3/regression/browser/results.json)、8成功 | PC/mobile各4件。途中削除3/背景枠・gallery・PNG・複製1。全機能や全30sceneの再検査ではない |
| 関連Unit | [revision-3/unit.json](../test-results/ui-art-v1/revision-3/unit.json)、3ファイル37成功 | assets-cache/pwa-updates/engine-content。全Unit/SQL/cloudは今回実行していない |
| 固定同一性 | revision-2とrevision-3のbefore/after一致 | rev2→3の差はoffline testだけ、app/source/build不変。hash計測はCPU性能検査ではない |

修正版UI6とoffline/回帰9は同じbuild/sourceの異なるharness版に分けて保存する。初回の成功/失敗を合算せず、**現buildのChrome操作15成功**と数える。独立後の [最終identity](../test-results/ui-art-v1/revision-3/identity-after-audit.json) と [証拠index](../test-results/ui-art-v1/revision-3/evidence-index.json) へ結び付ける。

## 進行基準と未確認

独立原文：[engine](audits/ui-art-v1-engine-20261010.md)、[visual](audits/ui-art-v1-visual-20261010.md)。初回FAILを残し、修正後の新証拠に対する限定PASS追補を分離する。監査者は提供結果の読取/現物確認であり、Chrome/Unitを自分で再実行したという意味ではない。主観的な人間採用は未受領で、全体NOT READY。今回Visual基準更新や性能再測定は行わない。

旧P05性能FAIL2回の停止、残る9枚へのmaster展開、初期/I8の未完了、実機・実外部同期・全体回帰・全体最終監査は継続する。初期オフライン訪問や未表示画像の事前キャッシュは提供しない。対象外の目/画材の質感を今回のUI成功で完了にしない。

今回のlocal候補の実装・列挙検証の区切りは `revision-3/handoff-input.json` / `handoff-record.json` に保存する。次に追加検証をする場合は新しい出力先を使い、この版の失敗・画像・監査を上書きしない。
