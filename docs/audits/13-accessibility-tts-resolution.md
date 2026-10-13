**A13 実装修正・回帰検証記録 — PASS**

2026年10月7日。独立監査の原文 [13-accessibility-tts.md](13-accessibility-tts.md) は変更せず、実装側の修正と検証をここへ記録する。独立した再監査の判定とは区別する。

**A13-01: 補助文字のコントラスト**

編集タイトル、補助文、作品日付に加え、ホーム・テーマ・ギャラリー・設定・フッターの同系統の文字色を共通の `--muted: #536b78` にした。読み上げ機能が使えない行は、行全体を半透明にせず、スイッチの形だけを薄くして説明文の読みやすさを保つ。

`tests/e2e/contrast-helpers.ts` は実ページの文字ごとにCSS前景色・alpha・祖先opacityとRangeを記録し、文字色だけを一時的に透明化したスクリーンショットから、その範囲の実背景画素を全点採取する。グラデーションを単色と仮定せず、アンチエイリアスされた文字の縁を前景色として使わない。各範囲の最小比率を通常文字の [WCAG 1.4.3 の4.5:1](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) と比較する。

**A13-02: 設定本体を待つaxe**

`waitForSettings` は設定本体・見出し・5個のswitch・音量rangeの表示と読み込み画面の消失を待つ。検査JSONにはDOM件数だけでなく、axeの `label` ルールに5個のswitchと1個のrangeが実際に含まれることを記録・assertする。switchはHTMLのcheckbox inputなので、ARIA専用の `aria-toggle-field-name` ではなくHTMLの `label` 検査の対象となる。

追加E2Eは初回Settings chunkのHTTP応答をゲートで保留する。保留中の読み込み画面と設定本体0件を確認してから応答を開放し、設定本体の検査へ進む。固定sleepで読み込みを推測しない。

**A13-03: 可視の復元ボタンをキーボード入口にする**

補助file inputは `hidden` / `tabIndex=-1` にし、可視の復元ボタンで開く。ネイティブのfile input `cancel` と `change` で、操作開始時のアカウント世代が有効な場合だけボタンへフォーカスを戻す。キャンセルイベントの意味は [HTMLInputElement.cancel](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/cancel_event) を参照した。既存の復元実行・バックアップ・非同期出力のowner保護を保持する。

E2EはTab / Shift+Tab全体巡回、ネイティブEnter / Spaceから実際のfilechooserイベント、ファイル選択後の確認モーダルとEscape復帰を検査する。ヘッドレスPlaywrightはOSダイアログを捕捉するため、キャンセル通知は明示的なDOMイベントで検査し、OSダイアログの「キャンセル」ボタンを操作した証拠とはしない。

`tests/ui-async-races.test.tsx` にchooserを開いた後のA→B→A交換と遅い `change` / `cancel` を追加した。旧世代から確認画面を開かず、フォーカスも動かさない。既存A03を含む20件が成功した。

**A13-04: ギャラリーのタブと表示作品を対応させる**

2つのタブに固有ID、`aria-controls`、対応する `tabpanel` / `aria-labelledby` を付ける。選択中のタブだけをTab順へ置き、左右キーで循環、Home / Endで先頭・末尾へ移動し、即時に該当作品を表示する。修飾キー付きの操作は横取りしない。[WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) に沿って、Tabは選択中のパネルへ、Shift+Tabは選択中のタブへ戻る。

追加E2Eは完成と途中の実作品を作成し、関連付け・巡回・Enter / Space・選択状態と作品タイトル・途中作品へ入る動作を検査する。実スクリーンリーダーでの読み上げや実機操作は今回の自動検証に含めない。

**固定ビルドでの結果**

2026年10月7日08:09:11 JST開始。Chromium desktop / mobile / 320px narrow、Firefox、WebKitの5構成で、A13とA18および関連layoutの**45件すべて成功**。失敗・スキップ・再試行・console errorは0。5分28秒で終了した。対象ESLintとTypeScriptも成功した。

| 構成 | 編集タイトル・補助文の最小 | 作品詳細の最小 | 28個の対象文字全体の最小 |
|---|---:|---:|---:|
| Chromium desktop | 5.18:1 | 5.22:1 | 4.98:1 |
| Chromium mobile | 5.12:1 | 5.18:1 | 5.05:1 |
| Chromium narrow | 5.09:1 | 5.22:1 | 5.08:1 |
| Firefox（局所修正コピー） | 5.19:1 | 5.27:1 | 5.03:1 |
| WebKit | 5.16:1 | 5.22:1 | 4.94:1 |

28文字×5構成の140範囲すべてで4.5:1以上だった。通常Settingsと意図的に遅延させたSettingsの10回すべてで、本体switch5個・range1個・loading0個、axeのlabel合格ノード6個を記録した。設定のaxe違反は全10回0件。ホーム・編集・モーダルもserious / critical 0件だった。

実結果は `test-results/a13-a18-browser/results.json`、集計は同 `summary.json`、生の画素計測とaxeは `test-results/a11y/contrast-a13-*.json` / `settings-*.json` / `settings-delayed-*.json`。復元chooser・Tab巡回・Galleryキー操作は全5構成で成功し、各chooserのEnter / Spaceとフォーカス証拠はテスト添付JSONに保存した。

初回の7件検査で、axe対象をARIA専用ルールに誤って対応させた2失敗と、画面サイズ変更後に残ったmouse hoverの2px移動を別行と数えた1失敗を検出した。前者は実際のHTML labelノードを数えるよう変更、後者はmouseを離しtransition終了を待って基準行を比較するよう修正した。アプリの変更や閾値緩和で隠していない。初回結果と生のaxe JSONは `test-results/a13-a18-smoke/` に保持する。

検証した `dist-demo` は `index-CuhXK6Ab.js` / `index-auQZZ-eA.css` / `Editor-CBet72RI.js` / `Settings-WoLK2oSG.js` / `Gallery-GhkIT6pr.js` を含む240ファイル。前後のSHA-256一覧が一致し、aggregate SHA-256は `ad126667d7a189bbf6bab47e3af4c05226ec7d4ed5c9359ec564503b15fd1899`。同ディレクトリの `site-before.json` / `site-after.json` を参照する。

Firefoxはworkspace内のmozglue manifest IDだけを1バイト変更した明示指定コピーを使用した。元DLL・コピーDLL・実行exeのSHAを `summary.json` で再確認し、元cacheは不変。未変更の配布版や実機での成功とは主張しない。詳細は [testing-browser.md](../testing-browser.md)。OS chooserの実キャンセル、実スクリーンリーダー、実音声の聞き取りは未検証のままである。

**再現コマンド**

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $env:USERPROFILE 'AppData\Local\ms-playwright'
$env:FIREFOX_EXECUTABLE_PATH = (Resolve-Path 'test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe').Path
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4174'
npx playwright test tests/e2e/accessibility.spec.ts tests/e2e/visual-geometry.spec.ts tests/e2e/layout.spec.ts --config test-results/a13-a18-diagnostics/playwright.config.ts --project chromium-desktop --project chromium-mobile --project chromium-narrow --project firefox-desktop --project webkit-desktop --grep-invert '@visual'
npx vitest run tests/ui-async-races.test.tsx
```

診断configは標準configを継承し、320px構成にも追加したA13/A18を含める。Lightpanda Ensure / Statusの失敗を `browser-readiness.json` に保存してから、ユーザー指定の3ブラウザで検証した。
