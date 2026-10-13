# I34 候補24 口元限定・独立目視報告

- 判定: **PASS — B06/B07/B08の接続回復と、線の復帰による新しい重大不良の有無に限定した判定。候補24全体や最終home品質のPASSではない。**
- レビュー担当: /root/i34_visual_review（制作・実装を変更しない独立画像診断担当）
- 証拠取得開始: 2026-10-12T17:32:35.3344699+09:00
- 証拠再取得終了: 2026-10-12T17:33:55.2744156+09:00
- 対象: `test-results/smooth-home-i34/revision-24/after/` の `{princess,animals,ocean}-source.png` 3枚と `{bunny,dog,turtle}-detail.png` 3枚。
- 比較: `content/smooth-finish-i34/derived/{princess,animals,ocean}-registered.png` 3枚。
- 座標: 1600×2000のsource画像上、左上原点のピクセル座標。概略範囲であり、detail画像上の座標ではない。
- 新規保存は本報告だけ。コード・素材・証拠画像・比較記録・以前の報告は変更していない。外部サービス、性能測定、テスト再実行、再委任は行っていない。

## 実際に確認した画像と基準

対象source3枚を全体で表示し、指定detail3枚と同テーマregistered3枚も実際に表示して比較した。原画の色・比率への一致ではなく、鼻下、マズル/口角、口腔、舌が一つの表情として連続するか、太い線が新たな切断・二重口・不自然な突起を作っていないかを判定した。実装者の修正説明は、見た目の回復を確認する代わりの証拠にしていない。

候補23にあった毛色/肌色による切断は現在再現しない。三つとも口角が口腔へつながり、舌が口の内側に収まって見える。線はregistered原画の柔らかい陰影より均一だが、現在のsource全体とdetailの両方で、表情の構造は回復している。

## 各項目の再判定

| ID | 対象とsource座標 | 判定 | 現在の根拠 |
| --- | --- | --- | --- |
| B06 | princess ウサギ: x1038–1123,y1385–1475 | **PASS（接続・重大退行の範囲）** | 鼻下から左右の丸いマズル線、口角、口腔の外縁へつながる。灰色の孤立片と毛色の切断は消え、赤い舌が口の中に収まる。鼻の直下と口の上端に連続した構造が戻り、独立した舌の貼り付けとしては見えない。 |
| B07 | animals 犬: x574–741,y1110–1235 | **PASS（接続・重大退行の範囲）** | 鼻下の中央線がマズルの弧へつながり、左右の笑顔の口角と暗い口腔、舌が連続する。候補23の毛色の広い切れ目はなく、口角線が途中で途切れた顔には見えない。 |
| B08 | ocean 亀: x705–819,y990–1068 | **PASS（接続・重大退行の範囲）** | 左右の口角が上縁と暗い口腔へつながり、桃色の舌を囲む構造が戻る。緑の顔に舌だけが置かれる候補23の状態は解消している。 |

三つとも、今回の線の復帰で新たな重大な二重口、口角の分離、口腔の欠落、舌の浮き、目立つ白い隙間は確認しなかった。これは口元に限定した目視所見であり、テストや全状態の保証ではない。

## 非ブロッカーの仕上げ残件

| 対象 | source座標 | 所見 |
| --- | --- | --- |
| ウサギの口縁・鼻下 | x1040–1121,y1404–1477 | 灰色の縁が比較的均一で、原画の柔らかいマズルの影より線として強い。口角の終端も少し丸く太い。ただし鼻下から口への接続を壊していない。 |
| 犬の口縁・口角 | x575–738,y1113–1236 | 茶灰色の帯が均一で、原画の暗い口腔と毛の間の柔らかい影より平たく見える。右口角の先も少し太いが、笑顔として読め、現在の範囲では重大な新規不自然さには分類しない。 |
| 亀の口縁・口角 | x706–821,y992–1068 | 濃い緑の口角と下縁がやや太く均一。原画のような肌から暗い奥への滑らかな明暗には差があるが、舌は口腔の内側にあり、切断はない。 |

仕上げをさらに高めるなら、つながったマズルと口腔を保ち、口縁の均一な帯を周囲の毛/肌や口腔の接触影へなじませる余地がある。線を消して候補23の切断へ戻すことは改善にならない。この残件表だけを理由に、今回の接続回復をFAILにはしていない。

## 未確認・保持事項

B03人物眼は今回の依頼の対象外で、再判定していない。候補23の独立FAIL原文は保持する。今回の三項目PASSを、人物眼、全10テーマ、候補25、native/tiledとdirectの一致、1/2/4、実Chrome、物理端末、性能、ユーザー採用/承認へ広げない。P05性能停止の扱いも変更していない。

## 証拠SHA-256

確認前後で下記9ファイルすべてのSHA-256が一致した。開始/終了時刻は冒頭に記録。参照原画を公開・外部送信していない。パスは `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド` からの相対パス。

| ファイル | SHA-256 |
| --- | --- |
| test-results/smooth-home-i34/revision-24/after/princess-source.png | `06acf264672e7de0cfdb38597eeab5016fd24120de782df9e7be9253d4c4170f` |
| test-results/smooth-home-i34/revision-24/after/animals-source.png | `521c0ad90b593e8aa1536448bab5842194540f0ad9ccdde33659d601f41313ed` |
| test-results/smooth-home-i34/revision-24/after/ocean-source.png | `738f2d800afda938e80e17eff3455f58900f913a8b9a98fd2efcc652b162b059` |
| test-results/smooth-home-i34/revision-24/after/bunny-detail.png | `25e969564d8bf9abfe08bcd6e46e7908c1fae6c8ba5ed34e332402fe4e208b5a` |
| test-results/smooth-home-i34/revision-24/after/dog-detail.png | `e874f6ca29fd65ff6084d6e0f3b9af0850a04f89f45f43f804382ce24a28ee55` |
| test-results/smooth-home-i34/revision-24/after/turtle-detail.png | `ab2bbbb52ea0d9b36caa69daf4a2762d5a1b9195aa4830742ad7cc4b9ba62e8d` |
| content/smooth-finish-i34/derived/princess-registered.png | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| content/smooth-finish-i34/derived/animals-registered.png | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| content/smooth-finish-i34/derived/ocean-registered.png | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |

