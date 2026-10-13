# ブラウザ検証

Playwright の実ブラウザで、画面の操作・保存された作品・Canvas の表示・ダウンロードファイルを確認する。画面側にテスト用の保存や描画 API は追加していない。IndexedDB は観測だけに使い、作品の作成と変更は通常の UI を通す。500件上限の準備にも、公開されているバックアップ復元画面を使う。

## 実行

Node.js と `npm ci`、公式ブラウザのインストールが必要。

```powershell
npx playwright install chromium firefox webkit
npm run build:demo
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4174'
$env:ISLAND_PWA = '1'
npm run test:e2e
```

`playwright.config.ts` が既存のプレビューを再利用するか、`npm run preview:demo` で起動する。開発中の軽い確認は環境変数 `PLAYWRIGHT_BASE_URL` と `ISLAND_PWA` を設定せず、5174番の開発サーバーでも実行できる。完全な検証は HMR のない静的ビルドで行う。

Windows の実行環境でブラウザ保存先を指定する場合:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $env:USERPROFILE 'AppData\Local\ms-playwright'
npx playwright test --project=chromium-desktop --grep '@smoke'
```

Codex のサンドボックスで localhost 接続を許可できない場合は、サーバーとブラウザテストをともに許可されたサンドボックス外の実行で起動する。起動済みのポートを検出できることが前提となる。

現在の`global-setup.ts`とcloud setupは`check-browser.mjs`でインストール済みChromeをread-only確認する。Canvas/PWA/pixel検査のためにDocker/Rancher/Lightpandaを起動しない。ChromeはPlaywright `channel:'chrome'`、Firefoxは明示的な`FIREFOX_EXECUTABLE_PATH`による隔離manifest1 copy、WebKitはPlaywright desktop engineを使う。隔離copyの由来と公式版の起動問題は後述の履歴へ保持する。検査時のChrome/設定は`test-results/browser-readiness.json`に残す。

## 検証内容

| ファイル | 確認するふるまい |
| --- | --- |
| `smoke.spec.ts` | 12テーマのホームから塗り絵を開き、3画材・11色の島・12段階を表示する |
| `coloring.spec.ts` | 全10テンプレート、全132色の選択、3画材の混在、完全上書き、消しゴム、ドラッグ誤塗り防止、拡大縮小、キーボード、実タッチイベントによるピンチ |
| `projects.spec.ts` | 未着色作品の完成、保存を先行する約1.8秒の演出、背景とフレーム、PNG、複製、作品タブ、バックアップ追加復元、個別削除 |
| `resilience.spec.ts` | 500件で作成と複製を拒否しつつ PNG 保存と削除を許可すること、空きを作った後の新規作成、2タブで同じ作品を編集した際に双方を保持すること |
| `settings.spec.ts` | 設定の再読込、読み上げ音声がない場合の停止、演出軽減、端末保存を保ったログアウトと再ログイン |
| `layout.spec.ts` | 現CSSの4/3/2列、320pxまでの横はみ出し防止、主要操作44px、色島6+5・色段階6+6、フォーカス復帰、axe、固定スクリーンショット比較。初期desktop3列要求の不一致は別途B07/B27に残す |
| `pwa.spec.ts` | manifest、Service Worker 制御、線画の全件先読みをしないこと、オフライン再読込と塗り足し、再接続後の保持 |

PNG はヘッダーで 2048×2560 を検証し、背景とフレームの固有色を実際にデコードして表示中の Canvas と比較する。色の状態を保存しただけでは成功にならない。すべてのテストで `console.error` と未処理 JavaScript エラーを記録し、ゼロ件を要求する。

ブラウザ構成は Chromium 1440×1000 / 390×844 / 320×740、Firefox 1440×1000、WebKit 1440×1000、PWA 用 Chromium 390×844。320px構成はレイアウト・アクセシビリティ・画面比較を担当する。CDP の複数指タッチは Chromium mobile だけで実行し、それ以外の構成では理由を付けてスキップする。

axe はホーム・エディター・背景ダイアログ・設定で WCAG 2 A/AA と WCAG 2.1 AA を検査する。有限の入場アニメーションの完了を待ってから測定し、serious / critical をゼロ件とする。完全な手動アクセシビリティ監査を代替するものではない。

## 画面比較と証跡

```powershell
npx playwright test --grep '@visual' --update-snapshots
# 出力を目視確認した後、更新フラグなしで再実行する。
npx playwright test --grep '@visual'
```

基準画像は `tests/e2e/snapshots/<platform>/<project>/home.png` と `editor.png`。OS とブラウザごとに保存し、アニメーションを止めた実表示を比較する。Windows の画像を Linux の描画と比較しない。新しい OS の CI では機能テストを先に実行し、その OS で画像を目視確認してから基準を追加する。基準画像の更新だけでは合格とせず、色選択領域、絵の余白、線画、文字、重なりを目視で確認する。差分の許容上限は画素数の0.2%。

| 出力 | 内容 |
| --- | --- |
| `test-results/ui/` | ホーム、エディター、完成、詳細画面の全体画像 |
| `test-results/a11y/` | 各画面・ブラウザの axe 全結果 |
| `test-results/browser/` | 失敗時の画像、動画、トレース |
| `test-results/browser-results.json` | 直近の実行結果 |
| `test-results/functional-browser-results.json` | 2026-10-06 の静的ビルド機能検証結果 |
| `test-results/final-browser-results.json` | 画面調整後の機能・固定画像比較・PWA を含む最終結果 |
| `test-results/firefox-launch-result.json` | Firefox がページ起動前に失敗した診断結果 |
| `playwright-report/index.html` | 操作ごとの HTML レポート |

## 実測結果

2026-10-06 23:25 JST に開始した静的 `dist-demo` に対する最終検証は **54件成功、2件の意図したスキップ、失敗0件、再試行0回**（3.1分）。Chromium desktop/mobile/narrow、WebKit desktop、PWA Chromium の構成を実行した。2件のスキップは Chromium desktop と WebKit desktop の CDP ピンチ専用ケースで、Chromium mobile では成功している。機能50件に加え、目視確認済み8画像を更新なしで比較する4ケースも成功した。

画像確認で見つかったパレット下端の見切れを修正した後、1440×1000 / 390×844 / 320×740 の初期viewport内に色のパレット全体が入ることと、背景・枠を含む主要ボタンの44pxを確認した。ホーム・エディター・完成・作品詳細を目視確認し、文字・線画・画像の重なりも確認済み。

コンソールエラーと未処理エラーは0件。ホーム・エディター・背景ダイアログ・設定の4画面×4構成で axe の serious / critical は0件。Firefox の環境上の失敗はこの成功件数に含めていない。

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4174'
$env:ISLAND_PWA = '1'
npx playwright test --project=chromium-desktop --project=chromium-mobile --project=chromium-narrow --project=webkit-desktop --project=pwa-chromium
```

## 2026-10-07 生成素材と表示修正後の検証

ユーザーが正式採用した10枚・408領域を統合した静的ビルドで、Chromium desktop/mobile/narrow・WebKit desktop・PWA Chromiumの機能検証は **58件成功、CDP専用2件skip、失敗0件** だった（`test-results/generated-functional-browser-results.json`）。描画、全132色、3画材、保存、上限、複製、背景/フレーム、復元、設定、オフラインが対象。

瞳の検証は独立して実行し、目を持つ8枚×Chromium desktop/mobile・WebKitの **24件成功**。22瞳を黒く塗り、22ハイライトを1つずつ着色して消し、瞳が黒いまま保たれること、再読込・2048×2560 PNGの実画素まで確認した（`test-results/eyes-browser-results.json`）。Firefoxの同範囲は後述の追加8ケースで確認した。

ホーム・編集画面の新しい8基準画像は、線画が白黒であること、瞳の枠、12テーマの画像、文字、余白、パレットの見切れを目視確認した。更新なしの比較 **4ケース成功** を `test-results/generated-visual-browser-results.json` に記録した。320×568 / 390×568の低い画面では、通知あり・なしの両方で12色と11色島が表示内にあり、主要操作が44px以上であることも検査した。

`scripts/check-pwa-update.mjs` は最新Service Workerを使った実2タブで、別タブ編集中の更新保留、既存画面・ズーム・保存色の維持、他タブを閉じた後の明示更新、更新後のオフライン再読込を確認した。maskableアイコンの非不透明画素は0。結果は `test-results/pwa-update.json`。

これらは現時点の証拠であり、A11の同期修正後には影響する全体検査を再実行する。別時点の検証件数を足して、一度の最終実行件数とは報告しない。

## 2026-10-06 の環境上の制約

Lightpanda の Ensure は Rancher Desktop の Hyper-V socket timeout で終了した。Status は CDP ready を報告する一方、Docker backend 接続エラーも返したため、既に明示された実ブラウザ検証を進めた。

公式 Playwright 1.63.0 の Firefox 155.0 build 1543 は、ページを開く前に Windows SideBySide の `mozglue` assembly 解決エラーで起動できなかった。公式ファイルの再インストール、作業ディレクトリの変更、比較用の公式 Firefox 153.0 build 1538 でも同じ症状だった。診断用に DLL 内の manifest を展開する試行は効果がなく、追加ファイルは削除済み。これは初回の環境診断であり、起動しなかった結果は合格件数に含めない。翌日の追加調査と隔離コピーによる検証を以下に記録する。

WebKit は Playwright の Windows ビルドであり、実際の iPhone/iPad Safari や Android 実機とは別の確認である。Google OAuth とクラウド同期は実 Supabase 資格情報・2アカウントでの検証が別途必要。ここでの保存検証はデモモードの実 IndexedDB と Service Worker を対象にする。

## Firefox の局所的な起動対処（2026-10-07）

PE リソースを読み取ると、`firefox.exe` の manifest は resource ID 1、依存先 `mozglue.dll` の manifest は ID 2 だった。Windows の private assembly 解決は同名 DLL の manifest を ID 1 から探し、DLL が見つかった場合は外部 manifest へ探索を続けない。この規則は DLL の存在と外部 manifest の展開で解消しなかった観測に一致する。[Microsoft の assembly 探索仕様](https://learn.microsoft.com/en-us/windows/win32/sbscs/assembly-searching-sequence)

公式 browser cache を丸ごと `test-results/firefox-isolated/firefox-1543-manifest1` へコピーし、コピー側の `mozglue.dll` の resource ID だけを 2 → 1 へ変更すると Firefox 155.0 が起動した。変更は offset 659048 の1バイトで、実行コード・exe・元DLLは変更していない。ホストの runtime インストールや他アプリの設定変更も行っていない。

| ファイル | SHA-256 |
| --- | --- |
| 元 `mozglue.dll` | `b11acb767018bf61ddc15aa3c1dd5e74f5395892fc83659219ac2a0bcd0a95c0` |
| コピーの `mozglue.dll` | `4450708783c4114b3491d07677ae082f27a1705231ac31ce3feb9fe118c0befe` |
| 同一の `firefox.exe` | `425a0a0fb606f567a303bdcea727476e124c0deb589050b13668af688da17fcb` |

`scripts/prepare-firefox-local.mjs` はこの既知の元DLLハッシュだけを受け付ける。引数なしでは診断の表示だけ、`--prepare` では workspace 内のコピーだけを作る。既存コピーがあればハッシュを検証し、上書きしない。別バージョンへ同じオフセットを無条件に適用しない。

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $env:USERPROFILE 'AppData\Local\ms-playwright'
node scripts/prepare-firefox-local.mjs --prepare
$env:FIREFOX_EXECUTABLE_PATH = (Resolve-Path 'test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe').Path
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4174'
$env:ISLAND_PWA = '1'
npx playwright test --project=firefox-desktop --project=pwa-firefox --grep-invert '@visual' --workers=1
$env:ENGINE_BROWSERS = 'firefox'
node tests/ui/check-engine-browser.mjs
```

代替経路として WSL 2 の Rancher Desktop と Linux Docker の利用可能性も read-only で確認した。公式 Playwright 1.63.0 Noble image の pull は credential helper の終了コード28で停止したため、Linux環境のブラウザ検証は実行していない。WSLやDockerのグローバル設定は変更していない。

この対処で測定した対象は **manifest metadata を変更した隔離コピー**であり、未変更の公式 Windows 配布物の起動成功を証明するものではない。Playwright は独自パッチを含む Firefox を利用するため、一般配布の Firefox とも区別する。[Playwright のブラウザ仕様](https://playwright.dev/docs/browsers)

### 実ブラウザで検出した画像出力の停止

初回の隔離Firefoxでは 12件成功・15件失敗・1件の意図したスキップとなった。失敗15件の共通原因はサムネイル出力待ちだった。作品の IndexedDB commit と 1800ms の完了タイマーは発火していたが、`OffscreenCanvas.toBlob` に callback を渡して待ち続けていた。Firefox は `convertToBlob` に加え、Promise を返す旧 `toBlob(type, options)` を持つ。HTMLCanvasElement の callback API と同名でも呼び出し規約が違う。[Mozilla の WebIDL](https://searchfox.org/firefox-main/source/dom/webidl/OffscreenCanvas.webidl)

`canvasBlob` は標準 `convertToBlob` を優先し、存在しない場合だけ DOM Canvas の callback API を使うよう修正した。タイムアウトの延長や画像出力の省略はしていない。5件の API 回帰テストでは旧コードの3件が待機停止を再現し、修正後はすべて成功した。既存の実PNG/WebP出力を含む19件も成功した。

起動診断は `test-results/firefox-diagnostics/`、初回の失敗は `test-results/firefox-validation/`、修正後の固定ビルドと結果は `test-results/firefox-validation-fixed/` に分けて保存する。これらのローカル証跡は配布アプリには含めない。

### 修正後の Firefox 結果

2026年10月7日01:41:57 JST開始、187.4秒で **27件成功・1件の意図したスキップ・失敗0件・再試行0回**。スキップはChromium mobile専用のCDPピンチ入力で、Firefoxを起動できなかったスキップではない。全10線画、132色、3画材、消去、ドラッグ・拡大縮小、完成、背景と枠、複製、500件上限、2タブ保全、設定と読み上げfallback、バックアップ復元、ログアウトと再ログイン、Service Worker・オフライン再読込と編集を実行した。

瞳がある8枚の22 pupil の黒と22 highlightの白を、画面・再読込・実PNG 2048×2560の画素で確認した。この27件実行時のhighlight自身の黒への着色・白への消去は各絵の先頭1つ、合計8領域が対象だった。当時のaxe JSONには違反がなかったが、設定用JSONは実際には読み込み中の画面を対象にしていたことが後の独立A13監査で判明した。設定本体の検証証拠は下記のA13再実行へ訂正する。各テストのconsole errorと未処理エラーは0件。1440×1000に加え、320×568 / 390×568 / 320×740 / 390×844のレイアウトと44px操作領域を確認した。ホーム・エディター・完成・短い画面の画像は目視も確認した。Firefoxの固定visual baseline比較は今回の実行対象外である。

続く実engine検証では、正式10枚408領域×3解像度×2状態の **60画像比較すべてが差分0画素、最大channel差0**。全10枚のPNG 2048×2560とWebP 320×400をデコードして寸法を確認し、A04-01ピンチは `scale:1.5, x:0, y:0`・誤着色0件だった。Firefoxのこのピンチは合成DOMイベントであり、ネイティブの複数指入力を検証したとは扱わない。

検証対象237ファイルは専用4176番サーバー用に固定し、終了後も全SHAが一致した。ビルドのaggregate SHA-256は `1d7f0ea1569e2c35452732462b6af8db104bb28b317cb1b8707c19bbb16e50ef`。元DLLとコピーDLLも終了後に再比較し、上記1バイト以外の差分がないことを確認した。全結果・binary hash・各PNG/サムネイル寸法・axe結果への参照は `test-results/firefox-diagnostics/final-validation-summary.json` に集約した。ブラウザの局所manifest変更、デモ保存モード、実端末未検証という適用範囲はこの成功結果にも残る。

その後、`eyes.spec.ts` の直接操作を各絵の先頭から**全22 highlight**へ拡張し、同じ固定ビルドでFirefoxの8ケースを再実行した。追加実行は8件すべて成功、失敗・スキップ・再試行0件（1.7分）。各highlightを黒へ塗ってから白へ消去し、その眼のpupilの黒が保たれること、再読込と2048×2560 PNGでも22組の白黒が保たれることを確認した。全対象の独立操作の証跡は `test-results/firefox-eyes22/results.json` とsummaryの `eyeCoverage` に保存した。

2026年10月7日07:30 JSTのA08回帰検証は、Chromium / Firefox / WebKitの実UI9ケースすべてが成功した。Ctrl / Meta / Alt付きショートカットをキャンバスで取り消さないこと、4倍でも選択領域を表示してからEnterで塗れること、200% / 400%相当の720×500 / 360×250で全操作ボタンとfocus outlineへTabで到達できることを検査した。400%相当では絵の高さを保ち、縦スクロールして使う。viewport寸法によるreflow相当の検査と、ブラウザ本体の倍率操作は区別している。

別の実component検証では、正式10枚408領域×1 / 2 / 4倍×順逆×3ブラウザの7,344回が成功し、全22highlightの独立着色・消去と瞳の保持も各ブラウザで確認した。実UI結果は `test-results/keyboard-browser-final/results.json`、全領域の結果は `test-results/keyboard-browser-component/results.json`。初回の失敗、原因の切り分け、修正、計測粒度、実行binaryの限界を [A08修正記録](audits/08-desktop-responsive-resolution.md) に記載した。

## A13 / A18修正後の実画面とキーボード（2026-10-07 08:09 JST）

Chromium desktop / mobile / 320px narrow、Firefoxの明示指定した局所修正コピー、WebKitの5構成で**45件成功**（328.4秒）。追加でA08の200% / 400%相当を含む3ブラウザ9件も成功した（53.7秒）。両実行とも失敗・スキップ・再試行・console errorは0。実機やOSの支援技術を検査したという意味ではない。

- CSS前景色と文字のRange内の実背景画素による140範囲の最小コントラストは **4.94:1**。グラデーションを単色と仮定せず、文字のアンチエイリアス画素を前景色に使わない。
- 設定の本体・5switch・range・loading消失を待ち、通常と遅延chunkの計10回でaxeのHTML label合格ノード5＋1をassertした。ホーム、編集、モーダル、通常設定、遅延設定の25レポートでserious / critical 0件。設定10レポートは全違反0件。
- 復元ボタンのネイティブEnter / Spaceで実filechooserが開き、Tab / Shift+Tabで隠れたfile inputへ入らないことを5構成で確認。キャンセルはheadlessの制約上、DOM `cancel` を明示送信した検査でありOSダイアログの操作ではない。実ファイル選択→確認モーダル→Escape→復元ボタンの復帰も確認した。追加したA→B→Aの遅いpickerイベントを含む20件の非同期unit / integrationも成功した。
- ギャラリーのtab / panel関係、左右循環・Home / End・Tab / Shift+Tab・Enter / Space、選択と実作品の一致を5構成で確認した。
- 短画面40条件で6＋5 / 6＋6の色を維持。320 / 390×568の通知あり作品は約 **194.4×243px**、paletteは211pxで全色が見える。完成20条件で紙面と作品の矩形差0、390×844の作品と外枠はともに **366×457.5px**。20枚のPNGは2048×2560で、背景・上下枠の対応4画素を表示Canvasと照合した。

結果・固定ビルド一覧・集計は `test-results/a13-a18-browser/`、A08追加回帰は `test-results/a13-a18-keyboard-regression/`。全240ファイルの前後SHAは同一、aggregateは `ad126667d7a189bbf6bab47e3af4c05226ec7d4ed5c9359ec564503b15fd1899`。Firefoxの元DLL・局所DLL・exeのSHAも集計JSONで再確認した。再現コマンド、最初の検査前提の失敗を保持した経緯、未検証範囲は [A13対応記録](audits/13-accessibility-tts-resolution.md) と [A18対応記録](audits/18-visual-brand-resolution.md) に記載する。独立監査の原文は変更していない。
