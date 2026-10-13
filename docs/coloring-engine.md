# 塗り絵エンジン

`packages/coloring-engine` は React、認証、保存から独立した Canvas 2D エンジンです。制作済みの閉じた SVG Path を読み、実行時の領域解析や塗り漏れ補正は行いません。

## 現在の改善候補：PaintingProfile v3

受入条件と検査対象は [統合計画](storybook-improvement.md) のI17/V表を正本とする。`*-storybook-v2` IDの候補はprofile version 3、採用済み原本はprofileなし、以前の`*-storybook-v1`はversion 2である。ID末尾とrenderer versionを混同しない。旧保存作品は対応する旧rendererで表示し、改善コピーだけをv3へ移す。

v3は共有する制作Bezierを、黒い墨・exact塗り面・hitに使う。`fillRule`/`coverageFillRule`を明示し、黒線下の重なりだけをcoverageへ加える。白い不透明な主役の下地は一度描き、未着色の各領域が隣の色を白く削る処理を行わない。`paintMany(ids, paint)`は先に全IDを検証し、1回の状態更新・描画にまとめる。Editorは制作groupsと部分モードから対象を選び、保存の正本を1回更新する。

`setViewport({scale,x,y})`と`resize(cssWidth,cssHeight,dpr)`で表示領域を再描画する。512px tile＋2px bleed、tile/image各32MiB上限。旧版のDPR2上限や16MiB cacheをv3の制限として引用しない。Canvasの物理画素をDPRへ合わせ、拡大したbitmapのCSS引き伸ばしは行わない。端末密度イベントと250msの密度値比較を併用し、値が変わった場合だけ再描画する。

目のopening/iris/pupil/lids/lashes/reflectionsは各キャラクターの制作データ。白目は白、虹彩は選択色の色相、瞳は同系のほぼ黒、反射は白。生成iris素材と固定seedの繊維を合成する。姫以外のlashesは空で、runtimeが共通まつげを作らない。未着色の瞳・反射枠、highlight tapの目への統合、両目/片目/消去を維持する。v3の画材は生成紙目・蝋・鉛筆素材と固定座標の筆圧を使い、編集/完成/thumbnail/PNGで同じ描画関数を使う。

旧v2描画は開始時の配布bundleをoracleとして復元し、専用moduleへ凍結した。旧版とv3の品質判定は別。v3の塗り広がり演出は未実装（B16）。新geometryの人間採用、全体の最終品質ゲートも別工程であり、描画検査成功で代替しない。

## 以下は保持する旧版の公開 API と描画規則

```ts
const engine = new ColoringEngine(canvas);
engine.resize(cssWidth, cssHeight, window.devicePixelRatio);
engine.loadTemplate(template, project.regions);
engine.setScene({ background: await loadSceneImage(backgroundUrl), frame: null });
const regionId = engine.hitTest({ x: logicalX, y: logicalY }, settings.tapAssist);
if (regionId) engine.paint(regionId, { color: '#2F80ED', paintType: 'crayon' }, point, settings.reducedMotion);
const png = await engine.exportPng();
const thumbnail = await engine.exportThumbnail();
engine.dispose();
```

- `loadTemplate(template, regions = {})` は承認済み1600×2000のテンプレートを読みます。不正データの検出・Pathの構築を完了してから既存シーンを置き換えます。
- `setScene({ regions?, background?, frame? })` は与えられた項目のみ更新します。装飾を外す場合は `null` を渡します。同じ色状態を再度渡しても塗り広がりを中断しません。
- `paint(id, paint | null, point?, reducedMotion = false)` は直ちに内部状態を更新します。`null` は透明化でなく不透明な白へ戻す操作です。指定点は論理座標です。
- `hitTest(point, tapAssist)` は手前の閉領域を返します。タップ補助は線の近くを最大22論理pxまで探し、遠い背景から領域へ飛びません。
- `getPaints()` はコピーを返します。保存の正本は呼び出し元の Project とし、操作時に保存状態も同時に更新してください。
- `exportPng()` は2048×2560の PNG Blob、`exportThumbnail(320)` は320×400の WebP Blob を返します。WebP非対応環境ではブラウザー標準の PNG fallback を許容し、呼び出し側は Blob の実際の `type` を使います。
- Blob化は OffscreenCanvas の標準 `convertToBlob` を優先します。Firefoxの旧 `OffscreenCanvas.toBlob` はPromise形式であり、DOM Canvasの同名callback形式として呼ぶと永久待機になるためです。DOM Canvasのみcallback形式を使います。注入するCPU Canvasも標準 `ImageEncodeOptions.type` に合わせ、native library固有の `mime` などはfactory側で変換します。
- `renderSnapshot(width)` は検証や制作プレビュー用の最終画像 Canvas を返します。使用後は呼び出し元が参照を解放します。幅は4の倍数、4〜4096です。
- `dispose()` は予約フレーム、Path参照、全内部画像surfaceを解放します。dispose後の描画操作はエラーになります。

## レイヤーと更新

合成順は白地、背景、各領域（配列の先頭が奥）、詳細線、かざりわくです。各領域は白い不透明下地を持ち、消去後も背景が透けません。領域の輪郭線は手前の領域より後ろに描き、顔などの詳細線は全領域の上に描きます。輪郭線は黒です。

原画の黒線を `details[].fill` の閉じたパスとして保持するテンプレートでは、`lineWidth: 0` を使います。Canvas は線幅0の代入を無視するため、`lineWidth <= 0` の場合は領域のstroke自体を省略します。detailsの黒いfillはそのまま合成し、`strokeWidth: 0` ならその周囲へ追加の線も描きません。着色・白への消去・PNG出力でもこの線の扱いは共通です。

各領域の白下地・質感・輪郭線を外接枠内の小さな surface に作成し、16 MiB 上限の LRU に保持します。未着色の白い領域も同じ上限に含めます。1領域の変更ではその領域画像を作成し、変更矩形に重なる領域の固定画素だけを合成し直します。矩形clip内で曲線を描き直すと、Canvas実装によって輪郭のアンチエイリアスが変わるため、部分合成ではPathを再描画しません。PNGも同じ領域画像の生成関数を使います。キャッシュに残っている未変更領域の質感は再計算しません。黒い詳細線は別 surface に一度描画します。背景とフレームを替えても質感を作り直しません。エビクション時には canvas サイズを1×1へ戻し、画像メモリを解放します。

表示の devicePixelRatio は最大2、描画画素数は標準で2,048,000px以下です。4:5を正確に保つため横幅は4px刻みです。表示・塗りレイヤー・線レイヤーの合計は最大約24.6 MB、質感キャッシュは最大16 MiBです。背景画像・ブラウザー内部実装のメモリはこの計算に含みません。

`loadSceneImage(url, signal?)` は `fetch` と Blob URL で画像を読み、描画成功後に URL を破棄します。最初のService Worker制御前でもオフライン復元できるよう、正常にデコードできた公式装飾だけを CacheStorage に最大40件保存します。ネットワーク取得が失敗した場合はキャッシュを利用します。デコード済み Image はメモリ上で最大6件保持し、`clearSceneImageMemory()` で解放可能です。保存容量が不足しても取得済み画像の表示は継続します。

## 再現性とスマート質感

標準、肌、髪、毛、布、金属、プラスチック、ガラス、ゴム、木、石の11素材を実装しています。滑らかな広い陰影、髪の固定した光沢帯、金属の細い明部、ガラスの反射筋、木目、毛並み、石の小さなムラを使い分けます。`shade` / `highlight` の承認値と `texture` 強度、度数法の `direction` を尊重します。白と黒には強い陰影・光沢を抑える補正があります。

同じ領域内は3画材のうち1つで完全上書きし、別領域には異なる画材を混在できます。なめらかを基準に、素材陰影の強さをクレヨン70%、いろえんぴつ55%にし、それぞれ短い粒状ストロークと細い一定方向のストロークを重ねます。

粒やストロークの乱数は `templateId:regionId:paintType:region.seed` から FNV-1a と固定PRNGで求めます。`Math.random()`、時刻、タップ位置は完成描画に使用しません。パターンの位置と太さは論理座標なので、表示密度を替えても素材の模様は変わりません。同じブラウザー・同じCanvas実装の同一サイズ出力はピクセル単位で再現します。異なる描画実装のアンチエイリアスまでバイト一致を保証するものではありません。

## 塗り広がりと入力

なめらか180ms、クレヨン205ms、いろえんぴつ190msを基準に、タップ位置から柔らかな円・粗い縁・細い突起のある縁で新しい surface を表示します。入力直後のフレームで小さな塗りが見え、操作をロックしません。複数領域を同時に演出可能です。同じ領域の再操作は古い演出を破棄し、最新状態で更新します。演出軽減時は即座に最終描画します。PNG・サムネイルは進行中の演出を無視し、保存された最新状態を描きます。

pan / zoom は UI 側の CSS transform で実行し、毎フレーム質感を再作成しません。`constrainViewport` / `zoomViewportAt` / `pinchViewport` / `screenToLogical` は transform-origin が `0 0` の座標系で使う純関数です。倍率は1〜4、表示領域から絵が飛び出して戻せなくならない移動範囲に制限します。`TapTracker` は開始点から8 CSS px以上動いた履歴を保持し、指を元の場所へ戻したドラッグやピンチをタップにしません。

ピンチでは `pinchViewport(viewport, nextScale, oldCenter, newCenter, size)` を使います。倍率を1〜4に制限した後、新旧の指の中心をまとめて変換し、最後に移動範囲の制約を一度だけ適用します。`zoomViewportAt` の結果へ中心移動を後から加えると、端で切り捨てた移動量を復元できず、縮小時に余計なずれが出ます。

## 検証

```sh
npx vitest run tests/engine --pool=threads
npx vitest run tests/ui/artwork-pinch.test.tsx
node tests/ui/check-engine-browser.mjs
```

CPU Canvas (`@napi-rs/canvas`) に Canvas / Path / animation clock を注入し、実ピクセルで重なり、白下地、完全上書き、3画材混在、固定描画、黒白の過剰表現防止、PNG/WebP、演出中の最新状態、表示と書き出しの等価性を検証します。キャッシュ上限・破棄・端末倍率制限・pan/tap判定も対象です。

`artwork-pinch.test.tsx` は実際の `ArtworkCanvas` をマウントし、Canvas描画backendのみ置き換えてポインターイベントを送ります。監査 A04-01 の400×500表示・2倍・左上固定から片指を50px近づける操作、四辺での拡大と縮小、倍率1と4、キャンセル・capture喪失、誤塗り抑止と次の正常タップを13ケースで検証します。修正前には監査例を含む縮小5ケースで25pxずれが再現し、修正後は13ケースすべて成功しました。

`check-engine-browser.mjs` は実エンジンと実コンポーネントを独立した検証bundleにし、Chromium / WebKitで部分再描画と新しい全体再描画の実画素を比較します。元のアプリを変更したり、開発サーバーのHMRに依存したりしません。ChromiumのピンチはCDPの実タッチイベントを使用します。WebKitはPlaywrightに複数指入力プロトコルがないため、DOM PointerEventとcaptureのスタブを使います。検証時点のテンプレート内容のSHA-256と比較結果を `test-results/engine-browser-regression.json` に記録します。

2026年10月7日の監査対応では、ピンチ・線幅0・部分再描画・画像cacheの4ファイル41テスト、TypeScript、対象ESLintが成功しました。曲線の部分再描画は追加した `engine-dirty.test.ts` の4ケースすべてが修正前に失敗し、修正後に成功しています。実ブラウザーでは既存10線画×3解像度（320・800・1280）×2状態（全領域着色、上書きと消去）をChromium153とWebKit26.6で比較し、120回の画像比較すべてで差分0画素・最大チャンネル差0でした。両ブラウザーのA04-01再現は期待する `scale:1.5, x:0, y:0` で、誤着色・console errorとも0です。

生成原画の最終10候補・408領域も2026年10月7日01:15 JSTに同じChromium/WebKitの120画像比較を実行し、差分0画素、最大チャンネル差0、console error 0でした。実行時のcatalogと各immutable asset URLのSHA-256を前後で検証した結果は `test-results/engine-browser-generated.json` です。`ENGINE_BROWSERS=firefox` を指定するとFirefoxだけを実行し、元の証跡を上書きせず `engine-browser-generated-firefox.json` に記録します。明示した `FIREFOX_EXECUTABLE_PATH` と実行exeのSHAも記録します。Firefox/WebKitのピンチはDOM PointerEventの検証で、ネイティブ複数指入力はChromiumでのみ検証しています。

生成したraster線画の操作証拠は `npx vitest run tests/assets-generated-interaction.test.ts` で更新します。既定では `tools/asset-pipeline/output/gen-*-vN` の各テーマ最大版を選び、`GENERATED_TEMPLATE_IDS` にカンマ区切りのIDを設定すれば対象を絞れます。compiler出力がない環境では明示的にskipします。未承認の原画はテスト内のコピーだけを読み込み、承認記録・原画・Path・幅の閾値は変更しません。

390×844画面の現CSSに相当する344×430の絵を4倍にし、各最大内接点を画面座標へ変換、整数CSS pxへ丸め、実際の `screenToLogical` で戻して `hitTest` を実行します。全領域の着色と白への消去を実画素で調べ、2048×2560 PNGを再デコードして確認します。各領域の原画SHA・Path SHA・直径・4倍時のCSS px・±4/8 CSS pxの8方向でのタップ補助競合を `content/generated-lineart/interaction/{templateId}.json` に記録します。これは自動操作による到達性の証拠であり、子どもの使いやすさの実地調査ではありません。

最終採用版は princess/magic v6、animals/dinosaurs v4、space v5、他 v2 です。408領域すべての中心到達・着色・消去が成功し、全消去後PNGは初期PNGとSHAまで一致しました。小領域の個別例外は原画hash・Path hash・正確なEuclidean幅・拡大時の操作証拠へ固定しており、全体の最小幅基準を下げていません。制作途中の旧版の計測を現行版の合格根拠として流用していません。ユーザーの正式採用回答は `content/generated-lineart/user-adoption.json` へ記録済みです。

瞳22個とハイライト22個は独立した白い閉領域です。いずれも自動の陰影・反射光・質感を無効化し、黒い瞳を塗ってもハイライトは白いまま残ります。`tests/e2e/eyes.spec.ts` は8枚の目を持つ線画×Chromium desktop/mobile・WebKitの24ケースで、瞳の黒塗り、ハイライト単独の着色と消去、再読込、PNG実画素を確認しました。目のない車と花束を対象数に含めていません。

2026年10月6日の旧SVG10枚・302領域の検証は、保存済み作品の互換性の証拠として保持します（新規選択には非表示）。4ファイル34テストで全領域の到達性、3画材混在と全10枚のPNGを確認しました。目視用一覧と詳細結果は `test-results/engine-content.png` / `engine-content.json` です。画像の読み込みは初回Service Worker制御前からのオフライン復元、40件上限、デコード失敗、保存拒否、キャンセルを独立検証しています。

Windows sandbox 内の Vitest 5 の fork pool では、複数ファイル実行時に一時変換キャッシュの `ENOENT` が再現しました。`threads` pool にすると一時ファイル経由のモジュール転送を避けて全suiteが通ります。上のコマンドはその設定を明示しています。

負荷試験は35領域、最大表示解像度で3画材を各70回更新し、p50 / p95 / 最大時間、書き出し描画時間、メモリ推定値を `test-results/engine-performance.json` に記録します。p95が100ms以上なら失敗します。これは開発ホストのCPU描画の回帰検出であり、中価格帯Android端末の60fps達成を証明しません。実機・Chromium / Firefox / WebKit の操作計測はWebアプリ側のQAと併せて実施します。

実UIの操作計測は `scripts/check-interaction-performance.mjs` で実行します。最終生成おひめさまv6の最大領域r36を3画材で合計36回更新し、pointerupから表示Canvasの最初の描画までを測ります。2026-10-07 01:24 JSTのChromium、390×844ではp95が2.4ms、CPU 4倍減速では23.1msでした。描画機会の代用として2回のrequestAnimationFrameを待った値はp95 25.4 / 42.5ms。drag/wheel中は推定約60fpsでした。JS heapはGC後約4.29→5.09MBで、GPUメモリやAndroid実機の値ではありません。詳細と測定方法は `test-results/interaction-performance.json` に保存しています。

`PERFORMANCE_DPR=2` を設定すると高密度表示を別ファイルへ計測します。02:00 JSTの696×870描画surfaceでは、最初の描画までp95 5.1ms、CPU 4倍減速で22.9ms。2回のrequestAnimationFrameまでのp95は28.2 / 47.9ms、最大は168 / 53.6msでした。最初のCanvas描画と実画面に提示される時刻は同じ意味ではないため、双方の値を保持しています。推定約60fps、エラー0で、`test-results/interaction-performance-dpr2.json` に記録しました。

Canvas API の根拠: [Pathのヒット判定](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/isPointInPath)、[画像Blob書き出し](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)。

2026年10月7日01:46 JSTのFirefox155では、正式10枚408領域の60画像比較すべてで差分0画素・最大channel差0、console error 0でした。全10枚の2048×2560 PNGと320×400 WebPは実デコードに成功しました。A04-01の合成DOMピンチは `scale:1.5, x:0, y:0`・誤着色0です。結果は `test-results/engine-browser-generated-firefox.json`。このFirefoxはWindowsのprivate assembly manifest IDを局所修正したコピーで、未変更の公式配布物の起動成功とは区別します。調査・SHA・実UI27成功の詳細は [ブラウザ検証](testing-browser.md) に記録しています。

キーボード選択用の `getRegionPoint(regionId)` は既存compiled Path2Dへ最大337個の固定候補と内点周辺4方向のヒット照会を行い、前面にある正確な領域の内点だけをcacheします。穴のある瞳にも外接矩形の中心を使いません。画素読出し・再分割・距離変換・追加Canvas作成はせず、画材と承認済みパスも変更しません。`revealViewportRegion(viewport, bounds, point, container)` はこの点と外接矩形を使って倍率を保ったまま表示内へ移動します。隠れた選択へのEnterは、最初に表示するだけにしてから着色を受け付けます。

実ArtworkCanvasとCanvas2Dによる全408領域×1 / 2 / 4倍×順逆×3ブラウザの7,344回が成功し、22highlightの白い中心と瞳の独立性も確認しました。Chromiumの初回内点照会はp95 0.1ms / 最大0.5ms、Firefoxは時計の分解能以下 / 最大1ms、WebKitは分解能以下 / 最大3msでした。計測は通常CPUのこのホストに限ります。選択枠は常に2 CSS px、内点の輪は16 CSS pxです。全数検査のDOM KeyboardEventと実UIのネイティブキー入力は分けて記録しています。証拠と追加の短viewport修正は [A08修正記録](audits/08-desktop-responsive-resolution.md) を参照してください。
