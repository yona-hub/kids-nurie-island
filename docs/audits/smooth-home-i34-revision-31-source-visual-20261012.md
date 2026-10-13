# I34 候補31 source 独立目視報告（人物眼に限定）

- 判定: **FAIL — 人物眼B03-1。上瞼の影が灰色の厚い半円の枠として目立ち、肌・瞼・眼球の一体感がhome同等の最終品質に届かない。**
- 担当: /root/i34_finish_visual。制作・実装・既存証拠を変更しない独立目視。
- 確認前: 2026-10-12T18:21:32.5592591+09:00
- 確認後: 2026-10-12T18:24:39.6026493+09:00
- 現在画像: `test-results/smooth-home-i34/revision-31/after/{princess,magic,space}-source.png` 3枚（1600×2000）と同名detail3枚。
- 座標: 1600×2000 source/world上、左上原点。目視による概略範囲。
- 人物眼でFAILのため、依頼の分岐に従い残る7テーマの目視へは進まない。**候補31全10テーマを確認した報告ではない。**

## 実際に表示した比較資料

現在31の人物source3枚を全体で表示し、detail3枚も表示した。さらにsourceと `content/smooth-finish-i34/derived/{princess,magic,space}-registered.png` の同座標原寸cropを比較した。実homeの `apps/web/public/images/islands/princess-v1.webp`、`magic-v1.webp`、`content/smooth-finish-i33/references/home-target.png` もこの確認で実際に表示した。私有registered原画は分析だけに用いた。

比較したのは眼球・瞼・肌が連続した立体として読める仕上げであり、参照の形状、白目量、虹彩比率、色、構図の複製は条件にしていない。修正方法の説明や技術検査の成功を美術PASSの根拠にしていない。候補30をこの担当が表示・判定したという主張もしない。

## 現在の最小不足 B03-1

| 対象 | 問題の見えるsource座標 | 現在31で観測したこと |
| --- | --- | --- |
| princess | 左上瞼・両端x607–707,y507–585 / 右上瞼・両端x744–850,y543–619 | 上瞼の外側に灰色に見えるぼかしが回り、眼球側の暗い帯と明色の縁が、頬・鼻の暖かい照明から独立した枠に見える。まつげの接続はあるが、肌側の瞼の丸みへ自然につながらない。 |
| magic | 左上瞼・両端x682–755,y579–637 / 右上瞼・両端x824–900,y614–674 | 上側の灰色のぼかしと灰青色に見える眼球側の帯が厚い半円を作る。エッジはぼけても、その帯が肌と別の暗い枠として目立ち、瞼の厚みと眼球の接触影として一体に読めない。 |
| space | 左上瞼・両端x918–1017,y915–982 / 右上瞼・両端x1084–1184,y886–956 | 三テーマで特に明瞭。眼上部から左右へ回る灰色の影が暗い半円として強く、肌と眼球の境界を縁取る。顔の丸い面へつながる暖かい陰影より、眼だけを囲う別の枠として見える。全体表示でも眼周りの暗さが目立つ。 |

registeredと実homeにも暗い上縁と接触影はある。その存在や影の太さだけを不良にしていない。比較資料では上瞼周囲の影が暖かい肌の面へつながり、眼球の影と瞼の厚みを一続きに読める。現在31は、ぼかした影の量は増えているが、灰色に見える外側の半円と眼球側の帯が肌から分離し、同じ受入条件を満たしていない。

必要な最小改善は、眼の接続を保ちながら、上側と両端の暗い帯が独立した灰色の枠として浮かず、肌の照明から瞼の丸み、眼球側の接触影へ連続して読める状態にすること。単純に影を強めることや、白目量を再変更すること自体を改善成立の条件にはしない。

上記は画像で観測した所見である。描画コードや色値・合成順・Gaussianの実装はこの担当では検査しておらず、原因となるパラメータは未確認。影色・分布・強さの組み合わせが肌の明暗へなじんでいない可能性は画像からの推測にとどめる。

## 回復を確認した部分

候補29でほぼ細い外縁としてしか読めなかったmagic/spaceの白目は、現在31では側面・下側に読める。これは改善として認め、候補29と同じ白目欠乏を現在のFAIL理由にしない。虹彩の面と反射も読める。現在のブロッカーは上表の上瞼周辺のつながりである。

姫右まつげ根元B03-2（x828–842,y580–611）は、source全体・detail・原寸cropで確認し、上瞼から暗い一形としてつながる。以前の白い短冊状の切れ込みは見えず、**局所接続PASSを維持**する。穴の画素数を目視で検証したわけではない。

人物眼の原寸cropはprincess `600,505,255,150`、magic `670,570,245,150`、space `905,875,290,170`（左x,上y,幅,高さ）。姫右目尻はsource `740,540,115,115` も表示した。cropはメモリ上だけで扱い、別ファイルを作成していない。

## 未確認・保全

残る7テーマ、全10の口元・材質・輪郭、全配色、native/tiledとdirectの一致、アプリの1/2/4倍、実Chrome、物理端末、保存/reload/PNG/他画材、性能、人間採用はこの確認では未確認。source/detailの分析表示をnative zoomの検査へ転用しない。P05性能停止を維持する。

過去候補のFAIL・限定PASS原文は変更していない。候補28/29の所見を31の全10確認へ転用しない。主モデル/effortを維持し、再委任、性能測定、テスト再実行、外部サービス、有料API、外部公開は行っていない。今回の保存は本報告だけで、コード・素材・画像・既存報告は編集していない。

## 確認前後のSHA-256

実際に用いた12ファイル（現在source3、detail3、registered3、実home参照3）のhashは確認前後で全件一致。以下のhashが開始/終了の双方に対応する。パスは `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド` からの相対パス。

| ファイル | 確認前/確認後 SHA-256 | 前後 |
| --- | --- | --- |
| apps/web/public/images/islands/magic-v1.webp | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | 一致 |
| apps/web/public/images/islands/princess-v1.webp | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | 一致 |
| content/smooth-finish-i33/references/home-target.png | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | 一致 |
| content/smooth-finish-i34/derived/magic-registered.png | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | 一致 |
| content/smooth-finish-i34/derived/princess-registered.png | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | 一致 |
| content/smooth-finish-i34/derived/space-registered.png | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | 一致 |
| test-results/smooth-home-i34/revision-31/after/magic-detail.png | `c643bd8a9a137fd7acdc755f72f8c06f4e673f23ab61ce3bb8d7e9acf84de447` | 一致 |
| test-results/smooth-home-i34/revision-31/after/magic-source.png | `cc9941c4a26464cf7542bf93a6046ba3e8c56a976502345506513bd58c9f5926` | 一致 |
| test-results/smooth-home-i34/revision-31/after/princess-detail.png | `2db74a45a277fb443b63606764f73ec9bc60b57133e09377906abff9b85e5a0c` | 一致 |
| test-results/smooth-home-i34/revision-31/after/princess-source.png | `4a2293f3899e3738ec88f8cf2df54e8ba4db660940bd09e1c74ec834dbfcb38b` | 一致 |
| test-results/smooth-home-i34/revision-31/after/space-detail.png | `df50c6328477deba902277892452193de2756f125828d44192d69c591751512f` | 一致 |
| test-results/smooth-home-i34/revision-31/after/space-source.png | `197878cc3fff0fe8d2011d327cd3161f65139ae6e33f0e05f0a631fff8424577` | 一致 |

