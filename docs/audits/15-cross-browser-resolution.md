**A15-01 実装修正済み・unit40件／統合ブラウザ10件PASS・独立再監査待ち**

2026年10月7日。独立監査原文 [15-cross-browser.md](15-cross-browser.md) は変更していない。本書は実装側の対応記録であり、独立再監査のPASS判定ではない。下の引継ぎ時の記述に続けて、メイン担当の実行結果を末尾に記録する。

**修正内容と仕様照合**

`ArtworkCanvas` はCtrl / Meta / Altがある場合に処理せず返り、それ以外では `deltaMode` を `deltaY` より先に読む。[MDNの説明](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode) と [MozillaのWheelEvent実装](https://searchfox.org/firefox-main/source/dom/events/WheelEvent.cpp) は、単位を確認したかどうかによって公開delta値の互換変換が変わり得ることを示している。なおMozilla実装はJavaScript生成イベントの単位を明示されたまま扱うため、合成イベント検証だけでOS由来入力の変換分岐を実行したとは判断しない。

新しい純関数 `wheelDeltaPixels(deltaY, deltaMode, lineHeight, pageHeight)` は、pixelはそのまま、lineは現在のCSS行高、pageは作品viewportの `clientHeight` を掛けてCSS pxへ換算する。3種の単位は [Pointer EventsのWheelEvent定義](https://w3c.github.io/pointerevents/#wheelevent-interface) に対応する。端末のホイール設定・加速度まで各ブラウザで同一と仮定していない。

line入力だけ `getComputedStyle` を読む。解決済みの数値line-heightを優先し、`normal` のように数値を得られない場合は現在のfont-sizeの1.2倍、font-sizeも不明なら16px×1.2を使う。このfallbackは本アプリの換算方針であり、CSS仕様がnormalを常に1.2に定めるという意味ではない。page換算はリサイズ後の表示高を使う。

正規化後は既存の `Math.exp(-pixels * 0.0015)` と `zoomViewportAt` を使い、倍率1〜4とカーソル位置を保持する。無効なdeltaや未知の単位、縦deltaが0のイベントは処理しない。ホイール操作が介在した保留中のタップは取り消し、指やマウスを離した瞬間の誤着色を防ぐ。次の新しいタップは引き続き使える。エンジンの描画・色・素材・承認情報と、Editor / Gallery / Settings / App / 保存層は変更していない。

変更ファイル：

- `apps/web/src/components/ArtworkCanvas.tsx`
- `packages/coloring-engine/src/geometry.ts` と公開exportの `index.ts`
- `tests/engine-wheel.test.ts`
- `tests/ui/artwork-pinch.test.tsx`（実コンポーネントのwheel・保留tap回帰を追加）
- `tests/e2e/wheel.spec.ts`

**実行済みの回帰検証**

2026年10月7日08:31:26 JST開始の次のVitest実行は、**3ファイル40件すべて成功**（7.68秒）。実コンポーネントのジェスチャー処理と既存pinch / keyboardを含む。JSDOMのCanvas境界は既存fixtureのmock / napi backendであり、実ブラウザや物理入力の検証とは区別する。

```powershell
npx vitest run tests/engine-wheel.test.ts tests/ui/artwork-pinch.test.tsx tests/ui/artwork-keyboard.test.tsx
```

主な確認結果：

- `-100 pixel` / `-4 line`（25px行高） / `-0.2 page`（500px表示高）が同じ-100 CSS pxとなり、1回の倍率係数は約1.161834。逆方向の入力で元へ戻る。
- 高さ500pxの `page=-1` は1倍から約2.117倍。高さ250pxへ変わると約1.455倍。元所見の約1.0015倍に留まらない。
- getterの記録が `deltaMode → deltaY` の順であることをassert。
- computed line-height変更と `normal` / font-size fallback、微小pixel値を確認。
- 各単位と四隅で1〜4倍の制限とアンカーを保持。Ctrl / Meta / Altの各単位は `defaultPrevented=false`、絵の倍率は不変。
- wheel後のpointer releaseによる着色は0、次の通常tapは1回だけ着色。既存の端ピンチ、pointercancel、lostpointercapture、2指接触、全テンプレートのkeyboard選択回帰も成功。

TypeScript (`npx tsc --noEmit`) と変更範囲のESLintも成功した。アプリ変更を固定した時点のファイルSHAは `test-results/a15-wheel-diagnostics/source-hashes.json` に保存する。

**メイン担当へ引き継ぐ実UI10件（この時点では未実行）**

次の統合demoを4174で固定してから実行する。中間の `index-DtW107AG.js` はA15修正を含むと確認していないため、この修正の成功証拠として使わない。

専用configは `test-results/a15-wheel-diagnostics/playwright.config.ts`。標準configを継承し、desktop Chromium / Firefox / WebKitには `wheel.spec.ts` の3件ずつ、Chromium mobileには既存 `coloring.spec.ts` のCDP pinch1件を割り当てる。合計10件で、desktopへmobile専用試験を割り当てたスキップは発生しない。

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $env:USERPROFILE 'AppData\Local\ms-playwright'
$env:FIREFOX_EXECUTABLE_PATH = (Resolve-Path 'test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe').Path
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4174'
$env:KEYBOARD_REPORT_DIR = 'test-results/a15-wheel-browser'
node test-results/keyboard-diagnostics/capture-site.mjs before
npx playwright test tests/e2e/wheel.spec.ts tests/e2e/coloring.spec.ts --config test-results/a15-wheel-diagnostics/playwright.config.ts --grep '@a15|mobile pinch'
node test-results/keyboard-diagnostics/capture-site.mjs after
Copy-Item -LiteralPath 'test-results/browser-readiness.json' -Destination 'test-results/a15-wheel-browser/browser-readiness.json'
```

globalSetupがLightpanda Ensure / Statusを実行する。既存のユーザー許可に従って指定された3ブラウザで描画検証する。結果は `test-results/a15-wheel-browser/results.json`、失敗時trace / image / videoは同 `artifacts/`、成功した各wheel検査の数値は `test-results/a15-wheel-evidence/{units|limits|tap}-{project}.json` へ保存される。before / afterの240件等のファイル数は、新しい統合ビルドの実数を使用し、SHA一覧の一致を確認する。

実UIテストは以下を検査する：

1. 各実ブラウザのcomputed line-height / 表示高で同等の3単位を生成し、倍率とカーソル位置、逆操作、page=-1の十分な変化を検査。
2. 各単位の1〜4倍制限と、Ctrl / Meta / Altで既定動作を取り消さないことを検査。
3. ぬれる内点をマウスで押したままpage wheelを挟み、release後も着色されないことを検査。戻る操作で保存処理を終えてIndexedDBを確認し、再入場後の通常tapで対象領域が着色されることを検査。
4. 既存のChromium mobile CDP複数指pinchで、拡大しても誤着色がないことを検査。

wheelは **実UIへ送る合成WheelEvent**、mobileは **CDPのタッチ入力**である。物理ホイール、OSのページ単位設定、実Android / iPhone / iPadの操作とは表現しない。Firefoxは既存のworkspace局所manifest修正コピーを明示使用し、未変更の配布版の成功とも区別する。

引継ぎ時点の状態：実装固定・unit40件PASS・typecheck / lint PASS。実ブラウザ10件と独立再監査は未実施であり、メイン担当が結果を追記してから公開可否を判断する。

**統合ブラウザ実行結果（メイン担当追記）**

2026-10-07 08:38:52 JST開始の再実行は **10件成功、失敗0、skip0、retry0、52.93秒**。`test-results/a15-wheel-browser/results.json` と `run.log`、各計測値は `test-results/a15-wheel-evidence/` に保存した。A15修正を含む統合demoの `index-1upfpKNo.js` を使用し、Chromium / Firefox / WebKitのwheel9件とChromium mobileのpinch1件を検証した。console/pageerrorは0件。

最初の実行は7件成功・3件失敗だった。3ブラウザとも小数の指定座標とブラウザが実際に公開したMouseEvent座標の丸め差（約0.116 CSS px）を、テストがズームの誤差と判定していた。送信イベントの `clientX/clientY` を読み取り、その実座標をアンカー期待値に使うようハーネスを修正した。許容値や倍率・位置のassertを緩めず再実行した。初回の `initial-results.json` / `initial-run.log` を保持する。

この結果は合成WheelEventとCDP touchの実UI検証であり、物理wheelや実機OS設定ではない。Firefoxの局所修正コピーという制約も上記の通り。A03/A14の後続修正を含む最終統合ビルドは、全機能E2Eでさらに照合する。
