# I24：scene-art-v3 独立目視（2026-10-10）

**限定PASS。** 保存画像で、途中作品の削除入口と確認画面、10背景の風景としての成立、20枠の連続した意匠と豪華な候補、代表作品の非遮蔽を確認した。今回開いた画像に、I24の必須修正とする再現欠陥は見つからない。新素材の人間採用は未受領であり、制作受入や全体READYを意味しない。旧P05性能FAIL・残る9枚のmaster未実装・ホーム同等品質の未受入・全体NOT READYを維持する。

## 所見と残る確認

| ID / 区分 | 現物の位置と観測 | 必要な扱い |
| --- | --- | --- |
| SA-V01 / 撮影状態の限界 | PC/mobileのdraft-gallery.pngでは、右の「おひめさまと うさぎ」のサムネイルが白地のbrush placeholder。左のwizardは表示済み。削除の入口と作品名は読める。 | 最終thumbnailの見た目を、この画像の成功として記録しない。親担当の説明でもthumbnail decodeを待っていない。最終状態でplaceholderが残る不具合とは断定しない。読み込み済みの別gallery-detail/PNGでは姫の新合成を確認できた。 |
| SA-V02 / P3・任意の構図上の好み | royal-jewelsの上中央の王冠装飾が、姫の王冠の先端のすぐ後ろに接する。desktop/mobileのscene、2048PNG、作品詳細で同じ構図。 | 二つの王冠が一つの大きな飾りに見える可能性はある。主役を覆う欠陥ではなく、必須修正にはしない。人間の制作確認で、装飾の位置や大きさを調整するか判断できる。 |
| 制作受入 / 未確認 | 30原本のmanifestはhumanAdoption:not-received。 | 「豪華」「自然」の人間の最終好み、全候補の正式採用を目視担当が代行しない。 |

途中削除の処理中/失敗表示、対象名が同じ複数作品の判別、keyboard/focus/読み上げ、実機touch、実際の削除/取消/保存/所有者照合/CAS/tombstoneの操作は今回の静止画レビューでは未確認。提供テストログとは分けて扱う。

## 対象と受入条件

- 原指示：[storybook-improvement.md](../storybook-improvement.md) I24（途中作品の削除、半透明風ではない自然/建物/空間の背景、連続した装飾と豪華な枠、主役を隠さないこと）。M22〜M24 / B23 / B25に対応する。画風や架空の空間を個人の好みだけで不具合へ読み替えない。
- 固定情報：[revision-2/identity-before-audit.json](../../test-results/scene-art-v3/revision-2/identity-before-audit.json)、記録時刻2026-10-10T06:50:19.548Z。
- build aggregate：`a149955e4dcae08e5aa5ce0115ca25fc671fc76603c920baac2b04249708546c`。
- source aggregate：`f57d0e3d0cddb07a5abb0409e1c9a8a99d2fc1ce3c256699788f34b5faab8b90`。
- 新背景IDはscenic-v3、新枠IDはatelier-v3。30原本・全60のChrome入力を区別する。生成manifestのtoolはbuilt-in image_gen、30件それぞれ別のsourceFileを記録している。自身が生成を実行したり、生成toolの履歴を独立に再監査したという意味ではない。
- game-playtestスキルの画面/描画の分離と画像確認手順を使用した。保存画像・提供データの読取りに限定し、ブラウザ・build・Unit・E2E・offline・性能の再実行はしていない。利用者の実作品を削除していない。

## 受入条件ごとの限定評価

| 条件 | 判定 | 画像から確認した結果 / 限界 |
| --- | --- | --- |
| 途中作品の独立した削除入口 | 限定PASS | PC/mobileとも「途中 2」の各作品の下に赤いtrash icon＋「削除」があり、作品を開く矢印と位置を分けている。ラベルやボタンの重なり・画面外への欠けは見つからない。hit領域や操作の成功を画像だけでは証明しない。 |
| 削除確認の見た目 | 限定PASS | 「途中の作品を削除しますか？」、対象名「おひめさまと うさぎ」、元に戻せない旨、「やめる」「削除する」と右上の閉じるを読み分けられる。mobileでも本文の折返しが読め、操作がダイアログ内へ収まる。 |
| 薄い半透明風ではない背景 | 限定PASS | 原本contactの10種とChrome contactの20表示で、画面全体を風景として塗り、手前/中景/遠景がある。原本のRGBAを実際に読み、10種すべてalpha最小/最大255、非不透明pixel 0だった。空気遠近や光の表現を「半透明」と誤判定しない。 |
| 自然・建物・空間としての成立 | 限定PASS | 下表の各風景に地面・水面・空・建築・遠景の連続があり、主役用の空白穴や小物を散らしただけの構図には見えない。future-city / outer-space / castle-gardenは個別Chrome画像でも確認。全原本の細部を1:1で確認したという主張ではない。 |
| 枠の連続性と豪華な候補 | 限定PASS | 原本contact20種とChrome contact40表示で、4辺がつながる縁/角の構成を確認。royal-jewelsの金工・宝石・王冠、ocean-shellsの貝/真珠、space-orbitやmagic-nightの金属意匠などに装飾の差がある。小motifを離して散らす旧型の見た目には見えない。 |
| 4辺の接合と中央の静けさ | 限定PASS（実際に開いた範囲） | royal-jewels、work-zone、rainbow-clouds、pencils、ocean-shells、gentle-wavesの原pixel Chrome画像では、角/縁の目立つ断裂や引伸ばされた塊は見つからない。中央には風景と主役が見え、白いpanel/色付きglassを重ねた見た目ではない。全20種の個別原pixelを開いたという意味ではない。 |
| 絵を隠さないこと | 限定PASS | 姫の顔・髪・左右の手・裾、うさぎの耳・顔・足は枠の前へ見え、前記7枚の枠sceneおよびroyalのPNG/再読込み/詳細で覆い隠されていない。Chromeの全30×2幅は姫1枚の証拠。全10の技術的裏付けは後述の限定native検査であり、全scene×全10の実目視ではない。 |
| 再読込み・作品詳細・2048PNGの見た目 | 限定PASS | 城の庭＋王冠と宝石が各状態で残り、主役と連続縁を区別できる。PNGにはeditorのzoom controlsがない。静止画が同じ合成を示すことと、保存操作を自身で実行したことを混同しない。 |

### 背景10種で見えた空間

以下は原本contactとPC/mobile Chrome contactで各候補を確認した記録である。

| ID | 自然/建物/空間として読める具体物 |
| --- | --- |
| sky-island-scenic-v3 | 手前の草地と石の道、側方の橋、空中の島と遠い山。青空と雲が画面の一部としてつながる。 |
| flower-meadow-scenic-v3 | 花の縁取り、土の道、草原と丘、遠い温室。中央も塗られた庭の空間。 |
| sunset-sea-scenic-v3 | 手前の砂浜・岩、波打際と海面、遠い岬、夕日と反射。薄い色板の重ね合わせには見えない。 |
| starry-sky-scenic-v3 | 手前の湖岸、青い湖と反射、山並み、月と星空。暗色の環境として明暗が成立。 |
| forest-clearing-scenic-v3 | 左右の木、手前から続く道、小川、奥の森と山。葉や苔が単独motifとして浮いていない。 |
| future-city-scenic-v3 | 手前の舗装、左右の曲面建築と植栽、奥のbridge/tower、青空。宇宙空間とは別の街路として読める。 |
| underwater-scenic-v3 | 手前の砂底と珊瑚、岩のアーチ、水中の光と奥行き。中央も水/海底として塗られている。 |
| outer-space-scenic-v3 | 手前の岩場、大きい環のある惑星、複数の天体、星雲。幻想的な空間として遠近がある。 |
| castle-garden-scenic-v3 | 石のterraceと欄干、薔薇、庭の階段、城の塔、遠山と空。左右の建物が中央の広場へ連続する。 |
| planet-surface-scenic-v3 | 赤い岩の手前/遠景、峡谷の地面、巨大な天体と空。future-cityや星雲主体の宇宙空間と区別できる。 |

### 枠20種で見えた連続意匠

| ID群（各候補をcontactで確認） | 実際に見えた意匠 |
| --- | --- |
| simple-white / color-dots / color-drops / rainbow-clouds / little-stars | ivoryの細いrailと花/真珠、連結された宝石列、雫の曲線rail、雲を接点にした虹の帯、星と細い金属の線。simple-whiteは白/ivoryを主体に金色の縁を持つ。 |
| gentle-waves / crayons / pencils / royal-jewels / magic-night | 四辺をつなぐ波、ねじれた彩色の帯、角へ続く色鉛筆のrail、王冠付き金工とruby、月/星を含む紫と金のrail。 |
| forest-paws / ocean-shells / dino-fossils / happy-road / work-zone | 肉球を角へ組み込んだ蔓、貝/真珠と曲線rail、化石/シダの縁、車輪と白線の道、cone付き角金具と連続した警戒stripe。 |
| robot-circuit / space-orbit / sweet-fruit / flower-leaves / toy-box | turquoiseの回路/歯車、天体の金属意匠、果物と菓子の連続縁、花/葉の蔓、木のball/beadを連結した縁。 |

## 実際に開いた画像

次の**28画像をview_imageで実際に開いた**。contact4枚に60のChrome入力が載ることと、60の個別ファイルを全て原pixelで開いたことは別である。今回は全60個別の1:1目視を行っていない。2048出力も原pixel指定で開いたが、全倍率のpanや動画の精細さは未確認。

| 場所 | ファイル | 枚数 |
| --- | --- | --- |
| content/scene-art-v3/compiled/ | backgrounds-review.png、frames-review.png | 2 |
| content/scene-art-v3/originals/ | frames-simple-white-v1.png、frames-royal-jewels-v1.png | 2 |
| test-results/scene-art-v3/revision-2/ | scene-chrome-{desktop,mobile}-{backgrounds,frames}-review.pngの全4枚 | 4 |
| 同browser/scenes/scene-chrome-desktop/ | royal-jewels-atelier-v3.png、work-zone-atelier-v3.png、future-city-scenic-v3.png、rainbow-clouds-atelier-v3.png、pencils-atelier-v3.png | 5 |
| 同browser/scenes/scene-chrome-mobile/ | royal-jewels-atelier-v3.png、outer-space-scenic-v3.png、castle-garden-scenic-v3.png、ocean-shells-atelier-v3.png、gentle-waves-atelier-v3.png | 5 |
| 同browser/scenes/scene-chrome-{desktop,mobile}/ | garden-royal-2048.png、reloaded-garden-royal.png、gallery-detail.pngを両方のprojectで確認 | 6 |
| 同browser/artifacts/draft-deletion-draft-delet-b0b3a-ed-work-and-survives-reload-scene-chrome-{desktop,mobile}/ | draft-gallery.png、draft-confirm.pngを両方のprojectで確認 | 4 |

代表画像への直接リンク：[royal PC](../../test-results/scene-art-v3/revision-2/browser/scenes/scene-chrome-desktop/royal-jewels-atelier-v3.png)、[royal mobile](../../test-results/scene-art-v3/revision-2/browser/scenes/scene-chrome-mobile/royal-jewels-atelier-v3.png)、[PNG](../../test-results/scene-art-v3/revision-2/browser/scenes/scene-chrome-desktop/garden-royal-2048.png)、[削除一覧mobile](../../test-results/scene-art-v3/revision-2/browser/artifacts/draft-deletion-draft-delet-b0b3a-ed-work-and-survives-reload-scene-chrome-mobile/draft-gallery.png)、[削除確認mobile](../../test-results/scene-art-v3/revision-2/browser/artifacts/draft-deletion-draft-delet-b0b3a-ed-work-and-survives-reload-scene-chrome-mobile/draft-confirm.png)。

## 検算したデータと提供検査の区別

- **自身の軽い読取検算**：Get-FileHashで[content/scene-art-v3/manifest.json](../../content/scene-art-v3/manifest.json)の原本30/30が一致、[contact-sheet-inputs.json](../../test-results/scene-art-v3/revision-2/contact-sheet-inputs.json)のChrome入力60/60が一致した。desktop/backgrounds10、desktop/frames20、mobile/backgrounds10、mobile/frames20の内訳も確認した。contact作成scriptの実SHAは `2c431f1ec904e4bcb10649eb3f8cff99d9725a48e221c21b2fa540f9d200c9c2` で同JSONの記録と一致する。全build/source aggregateの独立再計算はしていない。
- **自身の画像データ読取**：sharpで10背景原本のRGBAを読み、各1122×1402、全てalpha最小/最大255・非不透明pixel 0を確認。2枠原本の透明縁のRGBAも読んだ。透明縁に極端な赤/黄として見えた低alpha群はalpha1〜2で、原本の表示だけからChromeの強い色筋や黒縁の不具合とは診断しなかった。実合成の原pixel画像とPNGに目立つ同種の色筋は見つからない。画像の生成/編集を行ったという意味ではない。
- **提供された技術検査**：[revision-1/unit.json](../../test-results/scene-art-v3/revision-1/unit.json)は25/25、success:true。非遮蔽case `never covers opaque drawing pixels on any of the ten templates, in the viewport or snapshot, even with a solid frame` はpassed。原テスト[tests/scene-art-v3.test.ts:73](../../tests/scene-art-v3.test.ts#L73)も読み、catalog全10、320×400 native/DPR1/smooth、全面magentaのsolid frameをbehind-artworkとして与え、opaque mask alpha255の主役pixelについてsnapshotとviewportのRGBA差分を各0とassertする内容を確認した。pixel数は各case>1000のassertのみで、個別pixel数の別JSONは提供されていない。未知の数を記録しない。自身でこのUnitを実行していない。全scene×全10×全倍率/画材の実画像試験とはしない。
- revision-1とrevision-2のidentity-before-auditには上記と同じbuild/source aggregateが記録されている。それでも検査原本は版ごとに区別する。[revision-1/browser/results.json](../../test-results/scene-art-v3/revision-1/browser/results.json)のexpected4 / unexpected6を保持し、削除や成功への書換えをしていない。検査側の失敗という原因説明は親担当の通知であり、こちらで失敗原因の再現テストを行ったという意味ではない。
- **新しい提供ログ**：[revision-2/browser/results.json](../../test-results/scene-art-v3/revision-2/browser/results.json)はexpected10 / unexpected0 / skipped0 / flaky0、[offline/results.json](../../test-results/scene-art-v3/revision-2/offline/results.json)はexpected1 / unexpected0 / skipped0 / flaky0。自分がChrome10件/offline1件を実行したとは記録しない。実際の削除/取消/他作品保持/再読込みなどの操作検査は、この提供ログと機能監査の範囲である。
- [compiled/assets.json](../../content/scene-art-v3/compiled/assets.json)はbackgrounds11、frames21（白/なしを含む）を記録し、artworkInFront:true。今回の30新sceneはcanonical Profile3/4の姫表示、非遮蔽nativeは現canonical全10という親担当説明の範囲で扱う。noProfile旧作品は新compositionを非提供で旧選択肢を保持するとの説明があるが、そのpickerや全旧作品の互換性をこの目視で検証したとはしない。

## 未確認と全体判定

新素材の人間採用・全30個別原本の1:1細部・全60個別Chromeの1:1・全背景×全枠の全組合せ・全10作品との全scene合成・高倍率pan/全DPR・画材/配色の網羅・実機/他ブラウザ・実外部同期は未確認。代表PNGとChromeで主役が見えることを、これらの網羅合格へ拡張しない。

旧P05性能FAILと2回未達による停止、残る9枚のmaster未実装、ホームと同等品質の未受入、未撤回の初期/I8要件は今回のI24目視では解消していない。**総合NOT READYを維持する。** 本担当の書込みはこの新規監査報告だけで、アプリ・素材・harness・旧監査・baseline・評価条件・承認を変更していない。