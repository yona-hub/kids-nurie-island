**A08 修正・回帰検証記録 — PASS**

2026年10月7日。独立監査の原文 [08-desktop-responsive.md](08-desktop-responsive.md) は変更せず、実装側の対応と追加検証をここに記録する。独立した再監査の判定とは区別する。

**A08-01: ブラウザの修飾キー操作を保持**

`ArtworkCanvas` のキーボードとホイール処理は、Ctrl / Meta / Alt があると既定動作を取り消さずに返る。修飾キーのない `+` / `=` / `-` は絵の拡大縮小を続け、`+` を入力するためのShiftも使える。実コンポーネントで修飾キー付きの矢印・Enter・Space・Escapeもキャンバスへ転用しないことを検査した。

実UIでは、キャンバスにフォーカスがある場合と外の完成ボタンにある場合の双方で、Playwrightのネイティブキー入力によるCtrl / Meta / Altと`=` / `-`を記録する。ブラウザごとの`defaultPrevented=false`と絵の倍率不変を確認する。ヘッドレス実行でブラウザ本体のズーム設定を変えたという意味ではない。

**A08-02: 対象を見てから塗る**

矢印で選ぶたびに、倍率を保ったまま領域を表示内へ移動する。小さい領域は外接矩形全体、大きくて画面に入りきらない領域は実際の内点を基準に移動する。境界の点線は倍率にかかわらず2 CSS px、内点の輪は16 CSS pxである。中央に穴がある瞳のような領域でも、外接矩形の中心を着色位置として使わない。

ポインター操作等で選択位置が隠れた後のEnterは、最初に対象を表示するだけにし、続くEnterで着色する。`getRegionPoint(regionId)` は既存のcompiled Path2Dへ最大337個の固定候補を照会し、内点に対して上下左右の4点も確認する。前面領域に隠れた点を返さず、結果だけをcacheする。画像ピクセルの読出し、再分割、距離変換、新しいCanvasの確保や画材の再描画は行わない。原画・領域パス・材質と承認情報も変更していない。

`revealViewportRegion` は内点と外接矩形から移動量を決める純関数で、倍率を変更しない。表示範囲の制約は最後に一度適用する。

**408領域の実コンポーネント検証**

`tests/engine-keyboard.test.ts` と `tests/ui/artwork-keyboard.test.tsx` の25件に、既存の実pointerイベントによるピンチ13件を合わせた38件が成功した。全10枚408領域、1 / 2 / 4倍、順送りと逆送り、正確な着色先、穴と前面遮蔽、cacheコピーとtemplate交換を対象にしている。

`tests/ui/check-keyboard-browser.mjs` は現在のimmutable asset URLとSHA-256を前後で照合し、実ArtworkCanvas・実Canvas2D・選択表示CSSを別bundleとして実行した。結果は `test-results/keyboard-browser-component/results.json`。

| ブラウザ | 選択・Enter検査 | 独立した白いhighlight | 内点初回照会 p95 / 最大 | console error |
|---|---:|---:|---:|---:|
| Chromium 153.0.8010.12 | 2,448 | 22 | 0.1 / 0.5 ms | 0 |
| Firefox 155.0（局所manifest修正コピー） | 2,448 | 22 | 0 / 1 ms | 0 |
| WebKit 26.6 | 2,448 | 22 | 0 / 3 ms | 0 |

3ブラウザ合計7,344回すべてで、選択マーカー全体の可視性、倍率維持、正確なヒットとEnterによる着色が成功した。Firefox/WebKitのp95=0は時計の分解能以下という記録であり、処理時間がゼロという意味ではない。cache照会中に描画・texture metricsが変わらないことも検査した。

全数検査はDOM KeyboardEventを実ブラウザの実コンポーネントへ送り、各選択後のrequestAnimationFrameでReact描画を待っている。これに加え、各テンプレートでPlaywrightによるネイティブArrow / Enterを実行した。各ブラウザ22個すべてのハイライトは、白い中心の表示、単独着色、白への消去、黒い瞳の保存を検査した。4倍のハイライト画像24枚を同じ結果ディレクトリに残し、代表画像を目視確認した。

**短いviewportで見つかった追加修正**

1440×1000のデスクトップを基準に、200%相当の720×500と400%相当の360×250でCSS reflowを検証する。これはviewport寸法による相当検査で、ブラウザ本体の倍率変更や実機操作の検証ではない。

初回は360×250で既存flex layoutがキャンバスを高さ0へ縮め、3ブラウザで失敗した。幅767px以下・高さ450px以下では編集stageを200px保ち、ページを縦スクロールさせるよう限定した。通常のスマートフォンの高さには影響しない。失敗証拠は `test-results/keyboard-browser-first/` に保持する。

次の実UI検証は7成功・2失敗だった。Firefoxはフォーカスしたボタン下端が251.2pxとなり、40フレーム待っても250pxの画面から欠けたままだった。WebKitではTab後のスクロールが1〜4フレーム後に反映された。CSS scroll-margin単独でもFirefoxの小さい欠けは直らなかった。計測は `test-results/keyboard-diagnostics/focus-scroll.json`、2失敗の元結果は `test-results/keyboard-browser-fixed/` に残す。

編集画面はキーボードの`:focus-visible`ボタンに限り、ブラウザのfocus処理後に表示範囲と8pxの余白を確認する。欠けていれば12pxのscroll marginを使って`scrollIntoView(nearest, instant)`を実行する。タッチによるフォーカスや別のdialogのフォーカスは動かさない。テストは固定sleepではなく、ボタンと外側のfocus outlineが実際に表示内へ入ったことを待つ。focusとscrollIntoViewの仕様は [HTMLElement.focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) と [CSSOM View](https://drafts.csswg.org/cssom-view/#element-scrolling-members) を参照した。

2026年10月7日07:30:23 JST開始の最終実UI検証は、Chromium / Firefox / WebKit各3件、**合計9件成功・失敗0・スキップ0・再試行0**、54.2秒で終了した。console errorと未処理エラーも0。200% / 400%相当で横スクロールがなく、選択内点と全操作ボタンがTabで表示内へ到達し、ボタン本体に加えて3pxのoutlineと4pxのoffsetが欠けないことを確認した。対象ESLintとTypeScriptも成功した。

結果は `test-results/keyboard-browser-final/results.json`、全ページ画像は `test-results/ui/keyboard-reflow-{200|400}-{browser}-desktop.png` に保存した。全ページ画像はページ全体の縦配置の資料であり、すべての操作が同時に250pxの画面へ入るという意味ではない。ボタンと選択マーカーの可視性は実viewport座標で別途assertしている。

検証対象は `index-BE-24RTM.js` / `index-igoWrEx0.css` / `Editor-BlwCYYud.js` を含む `dist-demo` の240ファイルで、実行前後の全SHA-256が一致した。aggregate SHA-256は `cfae694879c5649b2847313da32863985d80c76f90b966557ae7332409f8bf4f`。ファイル一覧は同ディレクトリの `site-before.json` / `site-after.json` に保持する。先行の全408領域検証からエンジン・ArtworkCanvas・選択枠の実装は変わっておらず、その後の修正はEditorのボタン表示補助とscroll余白である。

実装修正と回帰検証の範囲ではA08-01 / A08-02、および追加発見した短viewportの問題を解消した。元の独立監査の判定を実装担当が書き換えず、独立再監査へこの証拠を渡す。

**再現コマンド**

```powershell
npx vitest run tests/engine-keyboard.test.ts tests/ui/artwork-keyboard.test.tsx tests/ui/artwork-pinch.test.tsx --pool=threads
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $env:USERPROFILE 'AppData\Local\ms-playwright'
$env:FIREFOX_EXECUTABLE_PATH = (Resolve-Path 'test-results/firefox-isolated/firefox-1543-manifest1/firefox.exe').Path
node tests/ui/check-keyboard-browser.mjs
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4174'
npx playwright test tests/e2e/keyboard.spec.ts --project=chromium-desktop --project=firefox-desktop --project=webkit-desktop --workers=1
```

Firefoxは既存診断で作成済みのworkspace内コピーを明示する。元配布DLLは変更していない。1バイトのmanifest差分、実行binaryのSHA、適用範囲は [testing-browser.md](../testing-browser.md) に記録済み。Lightpanda Ensure / Statusの失敗記録を残し、ユーザーが指定した3ブラウザで検証している。

2026年10月7日08:14:26 JST、A13/A18のコントラスト・短画面配置・完成紙面寸法の修正後に実UI9件を再実行し、**9件成功、失敗・スキップ・再試行0、console error0**（53.7秒）を確認した。全ボタンの44px寸法、200% / 400%相当のfocus outlineまでの可視性も保持する。結果は `test-results/a13-a18-keyboard-regression/results.json`。240ファイルの前後SHAは同一で、aggregateは `ad126667d7a189bbf6bab47e3af4c05226ec7d4ed5c9359ec564503b15fd1899`。A13/A18の詳細は [A18対応記録](18-visual-brand-resolution.md) を参照する。
