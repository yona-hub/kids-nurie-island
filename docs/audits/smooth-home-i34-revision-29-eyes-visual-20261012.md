# I34 候補29 人物眼・初見独立目視報告

- 判定: **FAIL — 人物眼B03の初見に限定。瞼・眼球・肌が一続きの立体に読めず、最終品質としてPASSにできない。全10テーマの最終監査ではない。**
- 担当: /root/i34_finish_visual。制作・実装・証拠画像は変更していない。
- 確認前: 2026-10-12T18:11:56.2094522+09:00
- 確認後: 2026-10-12T18:13:42.3832616+09:00
- 対象: `test-results/smooth-home-i34/revision-29/after/{princess,magic,space}-source.png` 3枚と同名detail3枚、計6枚。
- 座標: 1600×2000のsource/world上、左上原点。目視による概略範囲。

## 現在29で見えたこと

人物3テーマのsource全体、指定detail、sourceとregisteredの同座標原寸cropを実際に表示して比較した。比較したregisteredは `content/smooth-finish-i34/derived/{princess,magic,space}-registered.png`。実home3参照も直前の候補28監査で実表示しており、その品質を基準にした。私有原画は分析だけに用いた。

| 対象 | source座標 | 初見の所見 |
| --- | --- | --- |
| princess | 左眼x610–702,y515–602 / 右眼x749–845,y550–635 | 候補28の上側の明色弧が減り、まつげ根元の接続を維持する。側白目と虹彩は読める。しかし上瞼の肌側に連続した厚みが弱く、頬・鼻の柔らかい明暗に対して眼の暗い外縁が独立して見える。 |
| magic | 左眼x686–753,y585–659 / 右眼x828–897,y620–695 | 白目は原寸でほぼ細い明色の外縁としてしか読めず、暗い虹彩の楕円が肌へ直接置かれた印象が強い。上瞼の肌側の暖かい影も、連続した瞼の厚みとして十分に読み取れない。 |
| space | 左眼x920–1018,y922–1026 / 右眼x1086–1183,y892–1003 | 白目は細い外縁へ縮まり、虹彩と肌が直接切り替わる印象がある。上瞼が眼球を包む面と、肌側の丸みをつなぐ照明が弱く、顔と眼の一体感が不足する。 |

白目の量を参照と一致させる要求ではない。候補28で指摘した白い三日月自体も、registeredに存在するため不良ではない。現在29は明色弧を縮めたことで別層感の一部は減ったが、瞼が眼球を包み、白目・虹彩・肌が素材として区別されながら一体に読める状態へは届いていない。

反射位置がテーマ別になり、虹彩下部の小さい光も見える。しかしその変更だけでは上記の接続不足を解消した根拠にしない。描画コードは確認しておらず、原因となる合成・影・形状パラメータは未確認。上表は画像で観測した所見である。

原寸cropはprincess `600,505,255,150`、magic `670,570,245,150`、space `905,875,290,170`（左x,上y,幅,高さ）。現在sourceとregisteredを同じ範囲で表示した。cropファイルは作成していない。

## 判定の限界と保全

この報告は、先に親へ伝えた候補29の人物眼初見を、その時点の6hashと範囲へ結び付けて固定保存した原本である。候補28の独立FAIL、候補24の限定PASSを変更しない。候補30は別の画像・別の証拠で判定する。

全10テーマ、native/tiledとdirect、アプリの1/2/4倍、実Chrome、実機、保存・他画材・全配色、性能、人間採用は今回未確認。detailの拡大表示をnative zoomの検証へ転用しない。主モデル/effortを維持し、再委任、性能測定、テスト再実行、外部サービス・有料API・外部公開は行っていない。今回の新規保存は本報告だけで、コード・素材・既存画像・既存報告は編集していない。

## 確認前後のSHA-256

上記の確認前後で、6ファイルすべてのSHA-256が一致した。以下のhashが前後双方に対応する。パスは `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド` からの相対パス。

| ファイル | 確認前/確認後 SHA-256 | 前後 |
| --- | --- | --- |
| test-results/smooth-home-i34/revision-29/after/magic-detail.png | `cec4324e893c6655c2070800ff469feec6a923c6eb4045e087f0f4e34faf3707` | 一致 |
| test-results/smooth-home-i34/revision-29/after/magic-source.png | `f0aa71fdaa64d27e5e4332b91e84dc8d35f5c0517f2a10889fc094fb5aa097a7` | 一致 |
| test-results/smooth-home-i34/revision-29/after/princess-detail.png | `d8a5280d66c6605c7eb6a8fc2178f018b495eb96ab3caee5c4be7692741ec71d` | 一致 |
| test-results/smooth-home-i34/revision-29/after/princess-source.png | `8c3ca1cd9092e3cd802ce17de227c4d6fac471bb169e65e487335ef6e49871d9` | 一致 |
| test-results/smooth-home-i34/revision-29/after/space-detail.png | `f4cff88c219ee15df9af8a04480d71d74c960beeed18d4eef596c4faa1a8c7d4` | 一致 |
| test-results/smooth-home-i34/revision-29/after/space-source.png | `82c31d5b0e2e2d873b5050e52628a2b05cb689e84d867a1a7b35a244155acaaf` | 一致 |

