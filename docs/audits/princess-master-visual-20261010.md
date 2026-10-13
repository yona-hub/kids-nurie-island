# 姫1枚 I19候補の独立目視監査 — 2026-10-10

判定：**FAIL（未着色眼は最新I20でユーザー不合格）**。着色後の目・髪・服・4配色・3画材は、下記の実際に開いた画像の範囲で限定PASS。ホーム原画と同等品質、人間採用、全10枚の受入、アプリ全体READYを意味しない。

## 対象と検査方法

- 対象：`gen-princess-bunny-v6-master-v1`、提供されたprofile4の固定候補。修正後の`native-r2/`を現候補とし、`native/`の失敗は比較履歴として保持する。
- 提供された固定build aggregate：`ba4dd4f7f275cbcfbece77308ef4e340c2837a6aaa7120d0ff40de9cd1fe5fc9`。
- 提供されたsource aggregate：`1996e8f12f3316619d02ea3071b7517ec79a23c750c50ce7bddb2c3ed18db5fe`。
- 固定記録：[identity-before-audit.json](../../test-results/princess-master/identity-before-audit.json)。contentHashは`720c1bd87f0689d3b2aea4a5ef48095f66b87dab4b1dcd8b9f14e2b7ae67841d`、native/browser記録のtemplateSha256は`0a8e01460d68f2094ded77f2276130fce4c28f74188b0eb915417e4a3ae026df`。異なる識別値を同一hashとして扱わない。
- 適用原資料：[AGENTS.md](../../AGENTS.md)、[storybook-improvement.md](../storybook-improvement.md) I16/I18/I19、Q01〜05、P01〜04。`harness-orchestrator`の原資料・観測・未確認を分ける方針を適用した。
- 画像21件を`view_image`で実際に開いた。ブラウザの再実行、テストの実行、実装コードの変更、Visual baselineの更新は行っていない。提供されたログの成功を自身の実行結果にしていない。
- このレポートを除く実装・評価条件・承認・旧監査は変更していない。子エージェントは起動していない。

## 最新指示と必須所見

監査中、親担当から最新ユーザー原文I20の転送を受領した：

> 現状の添付のこれも怖いからね？線画は一番最初か二番目くらいのやつでいいんだよ。色塗った時だけ、きれいに加工してあげれば

その転送では、添付は現在v4の白地opening＋小白丸を指すと明示された。I20はI18時点の簡略化案より新しい受入判断として優先する。検査時の`storybook-improvement.md`はまだI19/P表までだったため、I20の出所はこの会話で受領した原文転送であり、既存P01から承認を推定しない。

| ID / 優先度 | 判定・根拠・現物位置 | 影響 / 必須対応 / 再確認 |
| --- | --- | --- |
| PV-I19-01 / P1 | **FAIL：未着色眼の人間受入**。`native-r2/blank.png`と`browser/screens/blank-dpr1.png`で、姫とうさぎの4眼が白地＋小丸1個になっていることは観測できる。しかしユーザーはこの現物を「怖い」と明示却下した。320×400の`blank-dpr1.png`で姫顔はおおむねx115〜173/y96〜143、うさぎ顔はx190〜251/y251〜300。 | 未着色画面の主要な表情が未受入。I20が指定する初期のシンプルな線画へ戻した候補を用意し、その新hashの未着色画像で再確認する。着色後の加工への評価とは分ける。「最初か二番目」の具体的asset/hashは本レビューでは未確定。 |

PV-I19-01は、画像破損や描画バグを独立に再現したという所見ではない。白地＋小丸という形は画像上で再確認でき、その造形の受入がユーザーによりFAILとなったという所見である。本監査中の「簡略化できている」という観測をI20のPASSに転用しない。

## 受入条件ごとの目視結果

| 条件 | 限定判定 | 観測した内容と制限 |
| --- | --- | --- |
| P01 / Q01 未着色眼 | **FAIL** | 内部の虹彩・瞳・複数反射の密な枠は省略されている。姫とうさぎとも外縁＋小丸1個。技術的な簡略化の観測は成立するが、最新I20による人間不合格を優先する。消去やtap動作はこの画像検査から証明しない。 |
| P02 / Q02 着色眼の輪郭 | **限定PASS** | Chromeの1倍/DPR1、2倍/DPR2、4倍/DPR3、2.65倍/DPR3、およびnative 4倍/DPR3を開いた。輪郭は連続した曲線に見え、突出するpixelの階段、周囲へ漏れる色、離れて並ぶ二重の黒い眼縁は見つからなかった。白目、選択色の虹彩、ほぼ黒い瞳、右上の白反射を区別できる。全12条件を目視した判定ではない。 |
| P03 / Q03 毛流れ | **限定PASS** | 前髪の斜めの流れ、左右の長いS字の毛束に沿う細長い光、内側の谷の影がある。下記の旧gradient画像に比べ、曲線や帯を一律に重ねただけの印象は減り、毛束の方向に対応する明暗を確認できる。毛束が全てベクター解像度であるとは判断しない。 |
| P03 / Q03 服の皺・重なり | **限定PASS** | パフ袖の丸みと袖下の絞り、腰のリボンのくぼみ、上スカートの弧状の皺と下端の重なり影、下スカートの縦の谷・山に陰影が対応する。原画の元配色による再構成画像でも同じ形の情報が読める。完成原画の全pixelの再現や完全な自動レイヤー分離を証明しない。 |
| P04 / Q04 自由配色 | **限定PASS** | ピンク/茶、青/水色、白、黒の4列と、黒・白の640×800画像を開いた。髪・服は選択配色へ変わり、元の茶色やピンクが目立って残る箇所は見つからなかった。白では灰色の影、黒では灰白色の反射により形が読める。黒の服はmanifest上`#211F24`、髪は`#000000`。白列の虹彩は`#FFF4BF`であり、全ての領域を純白/純黒で試した証拠ではない。 |
| P04 / Q04 3画材 | **限定PASS** | `three-media.png`のfit比較と1:1の上スカートcropで、smoothは連続した明暗、crayonは粗い蝋顔料とかすれ、pencilは細かな紙目・粒子として区別できる。Chromeのfit3枚でもスカートの違いが残る。同じ皺の明暗は3画材で維持されている。筆圧操作や重ね塗りの経時変化は静止画では未確認。 |
| P03 r1の眼縁・口の重複 | **限定PASS（r2画像で解消を観測）** | r1の`native/reference-reconstruction.png`では、姫の目の上に薄い第二のまぶた/まつげ状の影、口周囲にも原画由来の影が重なっていた。r2の同名画像とChromeの顔拡大ではその重複を見つけなかった。失敗画像は旧履歴として残す。 |
| ホームと同等品質 / 新しい人間採用 | **未確認** | ホーム原画と内部完成原画を現物で比較したが、採用回答は受けていない。今回の着色後限定PASSをM08やU02の完了にしない。 |

## 残る視覚上の差と観察

- **P2・観察（必須修正とは判定しない）：ホームとの差。** ホーム原画の目は、まぶた・目頭・白目が顔の陰影と連続し、虹彩に強い明暗と奥行きがある。今回の目は均一な円形に近い虹彩と細い下眼縁がより明確に分かれ、顔全体にも太い黒線が残る。`content/brand-generated/originals/princess-v1.png`の姫顔（原画中央左）と`browser/screens/face-z4-dpr3.png`の両眼で確認できる。これは実際に見える表現差であり、「ホームと同等」という結論は出せない。一方で太い線や丸い瞳の好みだけを新しい描画欠陥へ読み替えない。次は新しい未着色候補と一緒に、着色後の顔も人間へ比較提示して受入を得る。
- **P2・観察（原因未確定）：上側の細い白い弧。** `browser/screens/face-z4-dpr3.png`の左側の眼でおおむねx300〜365/y358〜376、右側の眼でx620〜670/y438〜458に、まぶたの直下の細い白い弧が見える。右側/下側の白目へつながっており、独立した第二輪郭やmap由来の白筋と断定できない。fitでは目立つ欠けとしては見えない。画像だけからclip不良という原因を捏造せず、現状は追加の必須FAILにしない。
- 拡大画像では髪・服の陰影がベクター輪郭より柔らかい。資料の有限解像度に伴う差として観測した。大きなタイルの継ぎ目や四角い切断は、今回開いた画像では見つからなかった。動画での移動や全てのpan位置を確認したものではない。

## 実際に開いた画像

以下の21件をすべて`view_image`で開いた。名称だけを一覧から採った画像は含めない。

| 画像 | 開いて確認した箇所 |
| --- | --- |
| `content/brand-generated/originals/princess-v1.png` | ホーム比較原画。茶色の巻き髪、ピンクの衣装、姫とうさぎの目。 |
| `content/princess-master/originals/princess-finished-v1.png` | 内部完成原画。前髪/長い毛束、パフ袖、リボン、上下スカートの陰影。 |
| `test-results/princess-master/native-r2/blank.png` | 姫とうさぎの白地＋小丸、線画全体。 |
| `test-results/princess-master/native-r2/reference-reconstruction.png` | 元配色の再構成、髪/服の形、r1由来の顔の重複の有無。 |
| `test-results/princess-master/native-r2/color-comparison.png` | ピンク/茶、青/水色、白、黒の4列。 |
| `test-results/princess-master/native-r2/black-640.png` | 黒い髪と暗い服の反射、姫の黒い虹彩。 |
| `test-results/princess-master/native-r2/white-640.png` | 白い髪/服の灰色の影、淡黄色の虹彩。 |
| `test-results/princess-master/native-r2/three-media.png` | 3画材のfitと、左上スカートの1:1 crop。 |
| `test-results/princess-master/native-r2/eyes-z4-dpr3.png` | 両眼の輪郭、反射、上側の細い白い弧、繊維。 |
| `test-results/princess-master/native-r2/smooth-2048.png` | 2048×2560原pixelの髪/服、眼縁、輪郭と陰影。 |
| `test-results/princess-master/browser/screens/blank-dpr1.png` | Chrome fitの姫とうさぎの未着色眼。 |
| `test-results/princess-master/browser/screens/face-z1-dpr1.png` | 320×400 fitの目と陰影。 |
| `test-results/princess-master/browser/screens/face-z2-dpr2.png` | 両眼、前髪、袖、リボン。 |
| `test-results/princess-master/browser/screens/face-z4-dpr3.png` | 拡大した両眼の外縁・白目、顔の二重化の有無。 |
| `test-results/princess-master/browser/screens/face-z2.65-dpr3.png` | 小数倍率の両眼と髪/袖。 |
| `test-results/princess-master/browser/screens/fit-smooth.png` | Chrome fitのsmoothスカート。 |
| `test-results/princess-master/browser/screens/fit-crayon.png` | Chrome fitのcrayonスカート。 |
| `test-results/princess-master/browser/screens/fit-pencil.png` | Chrome fitのpencilスカート。 |
| `test-results/princess-master/browser/screens/actual-ui-export.png` | 実UIからの出力とされる2048×2560画像。目/髪/服、鉛筆スカート。 |
| `test-results/princess-master/native/reference-reconstruction.png` | r1失敗の第二のまぶた状影・口周囲の重複。現在候補の証拠に混ぜない。 |
| `test-results/storybook-improvement/princess-smooth-2048.png` | 旧gradientの比較履歴。髪の一般的な曲線/光と、ほぼ単調な衣装の明暗。現候補と配色が異なり、同一条件の数値比較ではない。 |

`reference-colors.png`は提供ディレクトリにはなく、実在する`reference-reconstruction.png`を確認した。全体構図の一部はツール表示で1600×2000→1407×1759、旧2048×2560→1407×1760へ縮小された。眼縁の判定には原pixelで開いたChrome拡大画像とnative拡大画像を使い、縮小された全体画像だけで滑らかさを結論しなかった。

## 証拠の同一性とレビューの限界

- `Get-FileHash -Algorithm SHA256`で実ファイルを読み、r2の`blank.png`、`reference-reconstruction.png`、`color-comparison.png`、`three-media.png`、`black-640.png`、`white-640.png`、`eyes-z4-dpr3.png`、`smooth-2048.png`の**8/8**が[native-r2/evidence.json](../../test-results/princess-master/native-r2/evidence.json)のsha256と一致した。
- 内部完成原画の実SHA256は`a1b87bc1f7f1491ed99d874f282a420381dce9c176ec0e16090f6a1a7bcff8c6`で、固定identityのmasterSha256と一致した。全build/source aggregateの独立再計算はこの目視担当では実施していない。
- Chrome画像の倍率/DPR/画素寸法は[measurements.json](../../test-results/princess-master/browser/screens/measurements.json)の提供記録を参照した。ブラウザを起動して再測定した結果ではない。
- [browser/results.json](../../test-results/princess-master/browser/results.json)は提供されたテストログとして読んだ。自身はE2E・Unit・build・性能測定を実行していない。静止画からsave/reload/erase/旧作品保全/メモリ/性能/offline/外部同期をPASSとしない。
- 実機、他ブラウザ、残る倍率/DPR組合せ、動画のpan、全10枚、全装飾、全領域×全色の組合せは未確認。内部完成原画が配布されないという実装要件もこの画像レビューだけでは証明していない。
- このレポートは上記の固定候補に対する記録である。I20対応でコード・素材・buildが変わった後の候補へ自動的に転用しない。PV-I19-01の修正候補は新hashと現物画像で限定再確認する。

## 追補：I22・I23修正版 revision-2 の独立再目視（2026-10-10）

**現候補の限定判定：PASS（I22の白い未着色眼、着色後の目と陰影、I23の島周辺とメニューの見た目に限る）。** 新しい人間採用は未受領。ホーム原画との同等品質は未成立としてM08の未完了を維持する。初回のmaster-v1に対するPV-I19-01 / FAILは上記原文のまま保持し、この別候補の限定PASSで書き換えない。

### 対象と検査範囲

- 最新原資料：[storybook-improvement.md](../storybook-improvement.md) I22（44行）、I23（45行）、P01〜P06（255〜260行）。未着色の黒い瞳を白へ変更する指示を優先し、小丸だけの旧案と黒い瞳の旧案を受入基準にしない。
- 対象ID：gen-princess-bunny-v6-master-v3、PaintingProfile v4。
- [revision-2/identity-before-audit.json](../../test-results/princess-master/revision-2/identity-before-audit.json)の提供記録：build aggregate `a6274daaad6556ae5a4e7ceb1dfa278258a30c9fb277c561206a193e5fe7e86c`、source aggregate `a72b8024701618dd9855c9247b5b20310459bf7fa24c9b692094260eaaf1591e`、contentHash `079b9cfe87ae79756821185439768bdcca8508b49d9c5f0f7cd5ae8ea666fba6`。
- native記録のtemplateSha256：`a1a88829b5247fc784354c885f32694d3d31a68ad56f7e80525c124b8d16d982`。内部完成原画とformの記録hashは初回と同じ。この目視担当では全build/source aggregateを独立再計算していない。
- 新native全21枚、Chrome編集/完成/書出し22枚、メニュー6枚、比較原本3枚の**計52画像をview_imageで実際に開いた**。以下の結果は画像と提供JSONの読取りによる。ブラウザやテストを自身で再実行していない。

### 現物で確認した結果

| 条件 | 限定判定 | 新画像上の観測と位置 / 制限 |
| --- | --- | --- |
| I22 / P01 未着色は白い瞳の単純輪郭 | **限定PASS** | [native/blank.png](../../test-results/princess-master/revision-2/native/blank.png)とChromeのblank-DPR1/2/3で、姫とうさぎの4眼とも瞳内部は白い。小丸の反射枠と黒塗りの瞳はない。初期原本content/generated-lineart/originals/princess-v2.pngの白い瞳輪郭・上まぶたの形に対応する。元原本全体の構図を完全復元したという判断ではない。「怖くない」という人間の受入は未確認。 |
| I22 / P01 不要な額・頬線 | **限定PASS** | native blankおよびChrome blank3枚で、姫の額/頬に新しい孤立線は見つからない。上まぶた付近の細い弧は初期v2原本にもある。うさぎのひげ/眉と口の線を不要線として消す要件には読み替えない。 |
| P02 着色後の眼縁 | **限定PASS** | nativeの1/2/4倍×DPR1/2/3の9枚、Chromeの1/2/4/2.65倍×DPR1/2/3の12枚を開いた。外縁に突出する階段や離れた二重の黒線は見つからず、白目、色のある虹彩、暗い瞳、白い反射を区別できる。着色後に未着色用の内円が余計な黒線として残る箇所は見つからない。 |
| P03 髪と服の専用陰影 | **限定PASS** | 前髪の斜めの光、左右のS字の毛束に沿う光、内側の谷の影を確認。パフ袖の絞り、リボンのくぼみ、上スカート下端の重なり影、下スカートの縦の谷と明るい山が残る。原画配色のreference-reconstruction、smooth/pink出力、Chromeの顔/完成画像で確認した。ホームと同等という判断にはしない。 |
| P04 自由色 | **限定PASS** | pink/blue/white/blackの640画像と4列比較を開いた。青に元の茶色、白/黒に元のピンクが目立って残る箇所は見つからず、黒白でも髪と服の形が読める。服の黒は`#211F24`、髪の黒は`#000000`、白列の虹彩は`#FFF4BF`。全領域を純白/純黒にした網羅検査ではない。 |
| P04 3画材 | **限定PASS** | 新smooth/crayon/pencilの全体とthree-mediaの1:1 crop、Chromeのfit3枚、実UI書出し画像を開いた。smoothの連続明暗、crayonの粗い蝋顔料の抜け、pencilの細かい紙目を区別できる。皺の広い陰影は3画材に残る。静止画から筆圧操作/重ね塗り/保存動作を証明しない。 |
| I21/I23 / P06 ホームの残留四角影 | **限定PASS** | [home-390.png](../../test-results/princess-master/revision-2/browser/menu/home-390.png)、home-320.png、home-1000.pngで、島の周囲に容器の四角い面・影・装飾枠は見つからない。画像と文字は島の形に沿って見える。提供metricsの各12島×3サイズでもborder 0、背景透明、shadow/skyShadow none、labelFilter none。自然さの最終人間受入は未確認。 |
| I23 / P06 戻る矢印＋右の小さい島画像 | **限定PASS（見た目と提供寸法）** | princess-320/390/1000.pngで独立した左矢印ボタン、その右の小さな島画像、大きいテーマ見出しがないことを確認。metricsではback44×44、画像80×62、横gap10px。画像の非操作性や戻る動作の実行は静止画/このmetricsだけでは未確認。 |
| I23 / P06 線画preview幅 | **限定PASS（1カードの寸法）** | princess-320/390/1000.pngのカードはそれぞれ約139.5/168.5/286.66px幅で、mobile2列・desktop3列の列幅に整合する。以前の大きい480px幅のカードには見えない。表示作品が1件のため、複数カードを実際に2/3列並べた見た目までは確認していない。 |

提供されたmenu寸法の要点（独立した操作検査の実行結果ではない）：

| 画面幅 | 戻るボタン | 右の島画像 | 横gap | preview幅×高さ |
| --- | --- | --- | --- | --- |
| 320px | 44×44px、x12/y26 | 80×62px、x66/y17 | 10px | 139.5×173.875px |
| 390px | 44×44px、x18/y26 | 80×62px、x72/y17 | 10px | 168.5×210.125px |
| 1000px | 44×44px、x46/y36 | 80×62px、x100/y27 | 10px | 286.65625×357.8125px |

参照：[metrics-320.json](../../test-results/princess-master/revision-2/browser/menu/metrics-320.json)、[metrics-390.json](../../test-results/princess-master/revision-2/browser/menu/metrics-390.json)、[metrics-1000.json](../../test-results/princess-master/revision-2/browser/menu/metrics-1000.json)。

### 残る所見と未完了

| ID / 優先度 | 現物と根拠 | 影響 / 必要な次の確認 |
| --- | --- | --- |
| PV-I19-01 / 初回P1の履歴 | master-v1の小丸だけの目に対するユーザーFAILは保持。master-v3ではI22が指定する白い瞳輪郭への変更を観測した。 | 旧候補の人間不合格を削除しない。新候補に対する人間の造形受入は未受領。今回の限定PASSから「怖くなくなった」と推定しない。 |
| PV-R2-01 / P2・既知のB07差異 | [home-1000.png](../../test-results/princess-master/revision-2/browser/menu/home-1000.png)は4列×3行。storybook-improvement.mdのB07（158行）はdesktop3列を未撤回要件として残している。線画previewの3列幅とは別の画面。 | I23の影撤去がPASSでも、ホーム全体の受入を完了にしない。全体受入前にB07の3列へ合わせる作業が残る。新しく発生した差異と断定していない。 |
| PV-R2-02 / P2・ホームとの表現差の継続 | ホーム原画のまぶた/白目は顔の柔らかい陰影へ連続する。候補のChrome face-z4-dpr3.pngでは細い下眼縁と均一な虹彩形、顔や髪の太い黒線が独立して見える。 | M08（119行）のホーム同等品質は未成立のまま。現候補の顔と実ホームを人間へ比較提示し、受入を確認する。線幅や瞳形状の好みだけを新たな描画バグと断定しない。 |

初回に観察した上まぶた直下の細い白い弧は、revision-2の4倍/DPR3にも見える。白目へ連続しており、今回もclip漏れ・独立した二重輪郭という原因は確定できない。これを新規の必須FAILにしていない。初期v2の白い線画眼と着色後の眼をpixel単位で同じ形にする要件も追加していない。

### 実際に開いた新画像の一覧

次のグループはすべて実ファイルをview_imageで開いた。中括弧で列挙した各値も個別に開いている。

| 場所 | 実際に開いたファイル | 枚数 |
| --- | --- | --- |
| revision-2/native/ | blank.png、pink-640.png、blue-640.png、white-640.png、black-640.png、color-comparison.png | 6 |
| revision-2/native/ | smooth-2048.png、crayon-2048.png、pencil-2048.png、pink-2048.png、three-media.png、reference-reconstruction.png | 6 |
| revision-2/native/ | eyes-z{1,2,4}-dpr{1,2,3}.pngの全9組合せ | 9 |
| revision-2/browser/screens/ | blank-dpr{1,2,3}.png | 3 |
| revision-2/browser/screens/ | face-z{1,2,4,2.65}-dpr{1,2,3}.pngの全12組合せ | 12 |
| revision-2/browser/screens/ | finish-dpr{1,2,3}.png、actual-ui-export.png、fit-smooth.png、fit-crayon.png、fit-pencil.png | 7 |
| revision-2/browser/menu/ | home-{320,390,1000}.png、princess-{320,390,1000}.png | 6 |
| 比較原本 | content/generated-lineart/originals/princess-v2.png、content/princess-master/originals/princess-finished-v1.png、content/brand-generated/originals/princess-v1.png | 3 |

native21枚＋Chrome22枚＋メニュー6枚＋原本3枚＝52枚。2048×2560の全体画像などはツール表示で1407×1760（1600×2000のreferenceは1407×1759）へ縮小されている。眼縁の判定は原pixelで開いた倍率別native/Chrome画像を主に使った。

### 同一性と今回の限界

- Get-FileHashで新nativeの21画像を実際にSHA256検算し、[revision-2/native/evidence.json](../../test-results/princess-master/revision-2/native/evidence.json)と**21/21一致**。新blankのSHA256は`fb9525b8e985fedeab431fd0613f83010ce5b0e2aed7d5ff6a87e0be8c5454e8`。
- 初回native-r2/evidence.jsonと照合すると**17/21**の画像hashが同じ。変わった4件はblank.png、crayon-2048.png、pencil-2048.png、three-media.png。着色眼の9画像とsmooth/pink/reference、4配色・色比較は同一hashだった。画材画像まで全て不変とは記録しない。差の原因を画像だけで断定せず、変更された画材画像も今回開いて目視した。
- Chromeのfinish-DPR1とDPR2/3などは、スカートに見える画材状態が同一ではない。この画像群だけからDPRが画材を変える不具合を推定しない一方、全画像が完全に同じpaint状態のDPR比較であるとも主張しない。
- 今回の実行は画像読取りと軽いファイルhash/提供JSONの照合だけ。E2E・Unit・build・性能測定は自身では実行していない。親担当からの「menu3テスト成功」という通知も自身の実行結果へ置換しない。
- 保存/reload/erase、両眼/片眼tap、改善コピー、offline、実同期、実機、他ブラウザ、hover/focus、動くpan、メモリ、性能は今回の目視だけでは未確認。画面に欠けがないという観測をscrollWidthなどの機械検査の代わりにしない。
- 個人スキルの保存/検証や素材配布の制御は今回の目視担当範囲外。52画像の限定PASSを新素材の正式採用や全10枚・全装飾の受入へ拡張しない。
- 親担当からrevision-2の性能FAILとrevision-3への最適化予定の通知を受領した。この追補はrevision-2の固定画像に限る。revision-3のRGBA一致、Chrome、性能の成功を先取りせず、新buildへ自動転用しない。
- 初回報告の追補前の13,548 bytesのSHA256は`46399c8123b1683fb07a31f2f138e2e3a7aa38f5fda37295de349b2ce4860a21`。追補は既存ファイルへのappendだけとし、初回FAIL原文・他の監査・baseline・実装・評価条件・承認を変更していない。


## 最終限定追補：revision-3 の同一性とI22・I23（2026-10-10）

**目視は限定PASS。性能はFAIL、人間受入は未成立、総合はNOT READY。** この判定は下記固定候補の白い未着色眼、着色眼・髪服陰影・3画材、I23の島外縁とメニュー配置に限る。初回FAILとrevision-2の報告をそのまま保持し、正式採用・ホーム同等品質・全10枚への展開を完了にしない。

### 固定対象と実ファイル照合

- [revision-3/identity-before-audit.json](../../test-results/princess-master/revision-3/identity-before-audit.json)：build aggregate `7aaa080425b7b6f28d868fa2b47d1454844166d5b106b13676d78891e84f4cda`、source aggregate `7f36c84f69c81bb3cfa222295038824fe01954c50c0e9849eb9ae730a69f8f2c`。対象IDは `gen-princess-bunny-v6-master-v3`、PaintingProfile v4。記録時刻は2026-10-09T16:51:06.124Z。
- runtime変更はform画像を領域周囲へcropして描く最適化のみとの親担当通知を受領した。ソース差分や全build/source aggregateを、この目視担当で独立再計算・監査したという意味ではない。
- [native-comparison.json](../../test-results/princess-master/revision-3/native-comparison.json)を読み、21件すべて `changedChannels:0 / maxDelta:0 / identical:true` を確認。さらに**両版の実PNG21組をGet-FileHashで読み、21/21が同一SHA256**、[revision-3/native/evidence.json](../../test-results/princess-master/revision-3/native/evidence.json)と[revision-2/native/evidence.json](../../test-results/princess-master/revision-2/native/evidence.json)の両manifestとも21/21一致した。自身でRGBA比較テストを再実行したとは記録しない。同じPNG実bytesのhashは、提供された全RGBA一致結果と整合する。
- 照合対象はblank、4配色640、color-comparison、smooth/crayon/pencil/pink-2048、three-media、reference-reconstruction、eyes-z{1,2,4}-dpr{1,2,3}の全21枚。したがってrevision-2で実際に開いたnative21枚の見た目が、今回のnativeでも維持されている根拠がある。新しいnative画像を全21枚view_imageで開き直したという主張ではない。

### 今回実際に開いた画像と所見

下記の新14画像と比較用の旧1画像を、view_imageで原pixel表示として実際に開いた。

| 場所 | 開いた現物 | 限定観測 |
| --- | --- | --- |
| revision-3/browser/screens/ | blank-dpr3.png | 姫とうさぎの4眼は白い内部と簡単な輪郭。旧master-v1の小さい反射丸だけの眼や黒い塗りつぶしには戻っていない。額・頬の新しい孤立線は見つからない。I22の技術的な見た目は限定PASS。「怖くなくなった」という人間の受入は未確認。 |
| 同上 | face-z4-dpr3.png | 白目、茶色の虹彩、暗い瞳、白い反射が分かれる。外縁の目立つ階段・離れた二重の黒線は見つからない。前髪の毛束に沿う光とパフ袖の折り目が維持されている。上まぶた直下の細い白い弧と太い顔/髪の黒線については前報の所見を保持し、ホームと同等とはしない。 |
| 同上 | fit-smooth.png、fit-crayon.png、fit-pencil.png | 同じ全体構図で、髪の曲線に沿う光と内側の谷、スカートの重なり影・縦の折り目を確認。smoothの連続した明暗、crayonの粗い抜け、pencilの細かい紙目を区別できる。専用陰影・3画材の見た目は限定PASS。自由配色の4列画像も上記実hash一致でrevision-2からの維持を裏付ける。 |
| revision-3/browser/menu/ | home-390.png、home-1000.png、princess-390.png | 最初のhome画像は下方の島が薄く、390pxでは下半分がほぼ見えない状態だった。その時点では原因を確定せず、最終表示の証拠として不足を親担当へ報告した。旧PNGは保持されている。テーマ390pxの独立矢印・右の小画像・小さいpreviewは維持されている。 |
| revision-2/browser/menu/ | home-390.png | 旧候補の12島が明瞭な画像を、新home画像の薄さと比較するため再度開いた。旧画像を新候補の最終表示の証拠には転用していない。 |
| revision-3/browser/menu-settled/ | home-390.png、home-320.png、home-1000.png | 新たに提供された表示完了後の3枚では全12島が明瞭で、先の下方の薄さは残らない。島の周囲に四角い容器面・影・装飾枠は見つからない。I23の外縁は限定PASS。1000pxはなお4列×3行で、B07の未撤回desktop3列との差は残る。 |
| 同上 | princess-390.png、princess-320.png、princess-1000.png | 左の独立した戻る矢印、少し間を空けた右の小さい島画像、大きなテーマ見出しの撤去を確認。previewはmobile2列/desktop3列の列幅に対応する小さいカードで、I23の見た目は限定PASS。表示作品は1件のため複数カードの実際の並びや操作を、この静止画だけでは証明しない。 |

[menu-settled/evidence.json](../../test-results/princess-master/revision-3/browser/menu-settled/evidence.json)は、実際のisland-card animation完了を待ち、各幅12要素のopacity=1を要求し、CSS/runtimeを変更せず撮影したという提供記録である。記録のbuild/sourceは上記固定値と一致し `buildUnchanged:true`、3幅×12要素のopacityはすべて1、border 0・背景透明・shadow/skyShadow noneである。**新6PNGの実SHA256も6/6一致**した。[capture-settled-menu.mjs](../../test-results/princess-master/revision-3/capture-settled-menu.mjs)の実SHA256は `276a6ad828e1ad310087aaf56be3085717197088756cff7d22d044f449f21efa` で記録と一致する。自身はこのscriptやブラウザを実行していない。表示完了後の現物で薄さが消えたことは確認できるが、これを任意の端末での全アニメーション動作の保証へ拡張しない。

提供された[metrics-390.json](../../test-results/princess-master/revision-3/browser/menu/metrics-390.json)では、戻る44×44px（x18/y26）、右の島80×62px（x72/y17）、横gap10px、preview168.5×210.125pxであり、390px現物の配置と整合する。数値は制作値の検算で、人間のサイズ受入とは区別する。

### 性能・提供ログ・未成立の受入

| 項目 | 今回の扱いと根拠 |
| --- | --- |
| 性能ゲート | **FAILを保持**。[revision-3/performance.json](../../test-results/princess-master/revision-3/performance.json)のCPU4/DPR2、各group36サンプルのfirstCanvas p95はskirt311.2ms、hair34.2ms。規定100msに対しskirtが超過し、全体 `pass:false`。最大値もskirt422.1ms、hair183.6msとして記録されている。自身の測定結果ではない。 |
| 2回連続未達と停止 | [revision-2/performance.json](../../test-results/princess-master/revision-2/performance.json)も `pass:false`（skirt91.6ms、hair118.2ms）だった。各版の成績を混ぜて合格にせず、AGENTS.mdの2回連続失敗時の停止条件と親担当の停止通知を保持する。追加実装や重い再検査をこの監査で始めていない。 |
| 新Chrome/offline/関連Unit | [browser/results.json](../../test-results/princess-master/revision-3/browser/results.json)はexpected8、unexpected0・flaky0、[offline/results.json](../../test-results/princess-master/revision-3/offline/results.json)はexpected1、unexpected0・flaky0。[unit-rendering-isolated.json](../../test-results/princess-master/revision-3/unit-rendering-isolated.json)は13/13、success:true。すべて提供ログの読取りであり、自身のテスト実行とは区別する。全Unit398は最適化前revision-2の記録で、revision-3の全Unit成功と称しない。 |
| 人間受入 / M08 | 新候補への人間採用、ホーム同等品質の受入、怖さの解消は未成立。初回PV-I19-01のFAILは履歴として保存。太い輪郭と顔/眼の連続感などの差を個人の造形好みだけで新しい描画バグと断定せず、人間の比較受入が残る。 |
| B07 / PV-R2-01・P2 | settled home-1000でも4列×3行を確認。要求はdesktop3列のままで、I23のpreview幅復帰や影撤去の限定PASSでは閉じない。今後の全体受入には3列への対応が残る。 |
| 全体 | **NOT READY**。性能FAIL、残る9枚・全装飾、人間受入、初期/I8の未完了を維持。実機・他ブラウザ・実外部同期・長時間・物理present・全領域×全色の網羅・hover/focusは今回未確認。動画や操作の受入を静止画の見た目から推定しない。 |

追記前の既存報告25,465 bytesのSHA256は `26082893caecb4abe9f27aafdfa738d6e9be0c8c8838d37351d379f5447afed5`。今回もappendのみとし、初回FAIL原文・revision-2追補・baseline・実装・評価条件・承認・他担当ファイルを変更していない。
