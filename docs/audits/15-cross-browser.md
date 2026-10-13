**Agent 15（Cross Browser / Device）修正後再監査：PASS**

監査日：2026-10-07 JST  
対象：`C:\Users\yonaf\develop\app\キッズ塗り絵アイランド`  
**新規発見0件。前回のA15-01（P2）は解消。**

仕様の担当分野・33〜36節、後続ユーザー指示、前回報告を読み、現在の実装から独立に判断した。対象はAndroid Chrome相当viewport、Desktop Chromium、WebKit、Firefox、wheel／touch、Canvas／PNG出力、IndexedDB、PWAの互換性と修正回帰。実装・承認記録・ホスト設定の変更、他エージェント起動は行っていない。

**A15-01 — ホイールのページ単位入力がほぼ拡大に反映されない：解消**

- **旧Severity：P2**
- **旧影響：** ページ単位入力をピクセルとして扱い、通常スクロールを取り消しながら拡大が1回約0.15%に留まっていた。
- **修正根拠：** [ArtworkCanvas.tsx:167](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/apps/web/src/components/ArtworkCanvas.tsx:167) は`deltaY`より先に`deltaMode`を読み、行高・表示領域の高さを取得する。[geometry.ts:28](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/coloring-engine/src/geometry.ts:28) でpixel／line／pageを共通単位へ換算している。単位確認が必要という[MDNの説明](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode)とも整合する。
- **再現・独立再検査：** 現行ソースからwheelハンドラーを抽出し、実際のgeometry関数とJSDOMの`WheelEvent`で実行した。初期1倍、行高25pxでの結果は以下。

| 入力 | 表示高さ | 実測倍率 |
|---|---:|---:|
| pixel、`deltaY=-100` | 500px | 1.161834 |
| line、`deltaY=-4` | 500px | 1.161834 |
| page、`deltaY=-0.2` | 500px | 1.161834 |
| page、`deltaY=-1` | 500px | 2.117000 |
| page、`deltaY=-1` | 250px | 1.454991 |

58アサーションが成功。カーソル位置の維持、逆方向操作、1〜4倍の制限、Ctrl／Meta／Alt付き入力の非取消、単位の読取順、wheel後の誤着色防止と次の通常タップ、pinch境界計算を確認した。実ブラウザ描画の再実行ではない。

保存済みの[最新機能結果](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/test-results/final-functional/results.json)にも、[wheel.spec.ts:27](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/tests/e2e/wheel.spec.ts:27)の3検査×4構成、計12成功がある。生の計測JSONでは、等価入力はいずれも約1.16183倍、カーソル位置の最大誤差は0.001423 CSS px、誤着色0件だった。

初回実行の3失敗も確認した。小数座標の要求値とブラウザが丸めた実イベント座標の不一致であり、現行テストは実イベント座標を用い、許容精度を維持している。

- **推奨修正：** 追加なし。単位換算と回帰検査を維持する。
- **修正必須：** いいえ。前回の必須修正は完了。
- **再テスト項目：** 次回入力処理変更時も、3単位、倍率制限、カーソル位置、修飾キー、押下中wheel、mobile pinchを実施する。物理ホイールによるOSページ単位入力は今回未実施。

**今回の実施結果と保存済み証拠の照合**

今回実行した検査：

- `http://127.0.0.1:4174` はHTTP 200。HTML、JS、CSS、manifest、Service Worker、catalogの11配信ファイルが保存済みhashと一致。
- [ビルド証跡](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/test-results/final-functional/build-before.json)の240ファイル、実装ソース48ファイルを現在のファイルと照合し、差分0。実行前後の証跡も一致した。
- [canvas.ts:32](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/coloring-engine/src/canvas.ts:32)のAPI分岐7項目が成功。標準`convertToBlob`優先、DOM canvasへの切替、callback形式、エラー伝播を確認した。Firefoxの旧Promise形式`toBlob`との違いは[MozillaのWebIDL](https://searchfox.org/firefox-main/source/dom/webidl/OffscreenCanvas.webidl)とも整合する。
- [local.ts:22](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/persistence/src/local.ts:22)をメモリ内で実行し、fake-indexeddbによるv1／v2移行、旧Blob読出し、現在のArrayBuffer・MIME往復の3検査が成功。ネイティブIndexedDB検証とは区別した。

以下は**保存済み実ブラウザ結果の照合**であり、今回の再実行件数ではない。

| 構成 | 最新機能結果 |
|---|---:|
| Chromium desktop：1440×1000 | 42成功・1スキップ |
| Android Chrome相当：390×844 | 43成功 |
| Firefox desktop：診断範囲 | 42成功・1スキップ |
| WebKit desktop | 42成功・1スキップ |
| Chromium narrow：320×740 | 4成功 |
| PWA Chromium／Firefox | 各2成功 |

合計177成功、3スキップ、失敗・再試行0。スキップはChromium mobile専用のCDP複数指入力検査で、mobile側は成功している。PNGの2048×2560、背景・枠の画素、瞳・ハイライトの独立着色／消去・再読込・PNG保持も、テスト実装と成功結果を照合した。

`view_image`で既存画像6枚を確認した。Chromium mobile／desktop、Firefox／WebKit desktop、[320×568 WebKit](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/test-results/ui/editor-320x568-banner-webkit-desktop.png)、[mobile作品詳細](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/test-results/ui/detail-chromium-mobile.png)に追加の表示破損は認めなかった。

生成線画10枚は[user-adoption.json](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/content/generated-lineart/user-adoption.json)、現在の原画SHA-256、内容hash、人間承認hash、QAを照合し、全件一致。公開gateも成功し、新規カタログは生成線画10枚のみだった。

**未実施・判定の限界**

今回、Chromium、WebKit、通常Playwright Firefox、workspace内診断用Firefoxの起動を試行したが、すべてブラウザ起動前の`mkdtemp`で`EPERM`となった。**読み取り専用sandboxの制限であり、アプリ不具合には計上しない。**

Firefoxの成功結果は、`mozglue.dll`のmanifest resource IDをoffset 659048で2→1へ変更した、workspace内の1byte修正コピーによる診断範囲として評価した。現在のコピーのDLL・exe hashは診断記録と一致した。通常配布版の成功とは認定しない。また、PlaywrightのFirefox／WebKitは一般配布Firefox／Safariそのものではない。[Playwright公式説明](https://playwright.dev/docs/browsers)

実Android端末、iPhone／iPad Safari、物理ホイール、OSからのPWAインストール、WebKitのService Worker実動作は未実施。外部Supabase／Google実Credentialsはユーザー指定の例外として扱った。

**最終判定：PASS（Agent 15担当範囲）。未解決件数：P0 0件／P1 0件／P2 0件／P3 0件。**