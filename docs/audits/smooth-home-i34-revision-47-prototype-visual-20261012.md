# I34 候補47：人物2・限定試作の独立目視原本

判定：**限定 FAIL**。候補40のR40-1にあった長い髪の継ぎ目は明確に改善した。一方、姫の耳上の短い灰色〜薄茶色の断片と、右頬下の小さな明るい断片が、候補47の原寸source・直接2倍detailにも残る。R40-1の全面解消とは判定しない。

対象は候補47の未公開試作、人物2テーマ・error3の4枚だけ。公開/runtime/buildは33のままという提供状況であり、この判定で33 screen FAIL、候補40 FAIL、全10テーマ、実Chrome4倍、P05性能、人間採用を上書きしない。

## 確認範囲と証拠の固定

- 独立確認者：`/root/i34_finish_visual`。単独、再委任なし。継承した主モデル・effortを変更していない。
- 開始：2026-10-12 21:04:39 JST。
- 確認前hash：2026-10-12T21:05:13.6468802+09:00。
- 全実表示後hash：2026-10-12T21:10:51.3663947+09:00。
- 下表の18ファイルすべてでSHA256・byte数一致。旧40原本のSHA256も依頼値 `9e07ecf53388a228fa8608f5db0b7add5fad14b613317a50a019312c769ad3e5` と一致。
- 今回追加したのは本原本だけ。素材・画像・制作コード・固定helper・旧PASS/FAIL原本を編集していない。他担当の変更を戻していない。
- 外部通信、性能測定、画像生成、新規レンダー、公開、モデル変更を行っていない。47以外の新しい候補を混ぜていない。

`prototype.mjs`、`evidence.json` を読み、47の出力範囲と40の固定helper参照を確認した。生成用の `revision-40/relative-part-light.mjs` / `shadow-samples.mjs` はhashで識別した。所有曲線の下塗りという制作説明、コードの意図、evidence内のsource hashは、見た目の合否を保証する根拠にしていない。R40-1の原因仮説と現在の現物観察を分けた。

## 実際に開いたファイルと表示範囲

候補47は `test-results/smooth-home-i34/revision-47/prototype/` の次の4枚をすべて実表示した。実画像寸法も読み取って確認した。

| ファイル | 実寸 | 実表示 |
|---|---|---|
| `princess-error3-source.png` | 1600×2000 RGBA | 全体を最大辺1000pxに縮小。顔ROI、R40-1の3か所、外周・腕周囲の白い隙間を元画素の原寸局所で表示 |
| `princess-error3-detail.png` | 860×860 RGBA | 原画素のまま全体とR40-1局所を表示。3200レンダーからの直接2倍切抜きとして扱う |
| `magic-error3-source.png` | 1600×2000 RGBA | 全体を最大辺1000pxに縮小。顔、袖、ランタン持ち手周辺を原寸局所で表示 |
| `magic-error3-detail.png` | 760×800 RGBA | 原画素のまま全体を表示し、瞼/白目/虹彩、口、顎/首/襟の接続を確認 |

顔の原寸source ROIは、姫 world `[490,430,920,860]`、魔法 world `[565,465,945,865]`。detail座標はそれぞれworld左上 `(490,430)` / `(565,465)` を原点とした2倍。以下の欠点座標は1600×2000 worldの目視包含範囲であり、4倍Chromeの画面座標ではない。

比較した現物は次のとおり。

- 40のerror3 source/detail 4枚を全体表示し、姫detailのR40-1同座標を局所表示した。長い線と微小断片を別々に比較した。
- 40 FAIL原本と33 screen FAIL原本の判定・根拠を読んだ。33のscreen画像を今回の候補47として再判定していない。
- 実home `princess-v1.webp` / `magic-v1.webp` を全体表示し、private `princess-registered.png` / `magic-registered.png` の顔を原寸表示した。姫の耳上のprivate同位置も局所2倍で表示した。

privateはローカルの分析表示だけに用い、公開、配布用複写、派生画像保存、報告への画像埋め込みを行っていない。形状・色・構図の複製を条件にせず、陰影・毛流れ・顔への接続・滑らかさを比較した。局所切出しはメモリ内の表示処理だけで、画像ファイルは作成していない。

## R40-1の改善と残存

| 旧対象 | 今回開いた局所 | 候補47の現物判定 |
|---|---|---|
| 左顎横 x579–589,y646–727 | source `[575,640,605,730]` 原寸。detail `[170,420,230,600]` および広い周辺 `[130,380,290,650]` を原画素表示 | **改善確認**。40で髪を縦に分割していた細い線は明確に見えなくなった。暗部の毛流れ・階調は保たれ、広い平坦面へ戻っていない。 |
| 右頬横 x814–835,y654–711 | source `[805,650,850,720]` 原寸。detail `[630,440,720,580]` および `[600,400,760,650]` を原画素表示 | **大きく改善、微小残りあり**。長く弧状に続く継ぎ目と断片列は認めなくなった。一方、頬下の接点付近に短い明るい小片が残る。下記R47-1。 |
| 耳上 x522–546,y519–526 | source `[510,510,550,540]` と `[515,510,550,535]` 原寸。detail `[40,160,120,220]`、`[50,160,120,210]`、周辺 `[10,130,180,255]` を原画素表示 | **残存**。髪と耳の接点付近に短い灰色〜薄茶色の細線が2か所残る。40同位置の小片に対応し、47でも毛流れから独立した断片として読める。下記R47-1。 |

この改善判定は現画像を開いた結果である。下塗りというコード説明から長い線の解消を推定していない。

## 残件 R47-1：姫の微小断片 — 限定FAILの理由

| 部位 | 残るworld座標（概ね） | 見えているもの |
|---|---|---|
| 耳上・左の小片 | x522–526,y519–525 | 暗い髪から短い淡色線が立つように見える。耳と髪の正規の輪郭から少し離れて浮き、髪の陰影の連続を切る。 |
| 耳上・右の小片 | x542–546,y519–523 | もう1本の短い灰色〜薄茶色の断片。2本が間隔を空けて並び、自然な長い髪の流れより継ぎ目の痕跡として見える。 |
| 右頬下 | x814–818,y674–678 | 髪の暗部に小さな明るい横向きの断片が残る。長い弧状線は解消したが、接点付近のこの小片は残っている。 |

原寸sourceでも小さな明るい点/短線を認め、直接2倍detailでは形がより読み取れる。sourceをnearest拡大して生じた段だけを残件にしていない。全体縮小では目立ちにくいが、拡大仕上げとして確認した範囲では、髪の自然な階調から浮く不要な小片として残る。

private登録原画の耳上同位置では、髪の幅広い陰影が連続し、同種の孤立した淡色断片は認めない。参照と同じ髪形を要求しているのではなく、現在の47の髪の中で、連続する材質から小片だけが浮くことを不足とした。

**最小不足**：長い継ぎ目を改善した現在の毛流れを保持したまま、上記3つの微小範囲の孤立した線/小片をなくし、耳・頬の正規の境界と髪の陰影を自然につなぐこと。髪全体や眼を作り直す必要を、この観察は示さない。

この短い断片がink由来、光素材由来、coverage/曲線の合成由来、下塗りとの関係によるものかは未特定。原因仮説を根拠にPASS/FAILを変えていない。

## 眼・口・顎・全体と新しい欠陥の確認

| 項目 | 現物の判断と範囲 |
|---|---|
| 全体の仕上げ | 両テーマの髪/肌/衣装/金属に階調があり、37で問題だった広い茶色の平坦面へ戻ったとは認めない。今回の限定FAILはR47-1の局所断片が理由。 |
| 姫の眼・まつげ | 左眼 x607–707,y507–607、右眼 x744–850,y543–640 と周囲を原寸顔・直接2倍detailで確認。白目が側面/下に残り、一定幅の白い上帯・灰色の二重枠・白目の台座感の再発は認めない。まつげ根元 x828–842,y580–611 の旧白い短冊状の穴や余分な独立まつげも認めない。 |
| 魔法の眼 | 左眼 x682–755,y579–666、右眼 x824–900,y614–702 を顔全体と直接2倍detailで確認。瞼、虹彩、白目が読み分けられ、旧B03の再発は認めない。 |
| 口・顎 | 両人物の口内・唇・顎を原寸顔と直接2倍detailで確認。白抜けや分断、顎下の点/縞の再発を認めない。魔法の顎下 x737–823,y777–790 は今回の直接2倍detailで連続して見え、33の粗い階段帯の再出現は認めない。 |
| 姫の肌/髪境界 | 右頬 x812–834,y625–675 に33の太い茶色帯・大きな階段状の縁の再出現は認めない。耳→左顎 x582–596,y646–660 の短い形状の折れは40同様に残るが、形状差だけで独立した追加FAILとはしない。髪の微小断片と分けて保持する。 |
| 外周と白い隙間 | source原寸で姫腕周囲 `[840,845,1280,1200]`、左髪外周 `[245,525,455,825]`、魔法ランタン持ち手 `[1060,900,1340,1210]`、左袖 `[335,845,620,1190]` を表示。今回開いた範囲では、白い隙間への新しい色漏れ、外周の太い色にじみ、追加の白い帯を認めない。全輪郭外0の数値検査は実施していない。 |
| 未塗り部 | 今回提供された4枚は全体が着色された試作である。画像内の白背景・隙間と、眼/口などの白い構造は確認した。部分塗り、未塗り領域が隣接する操作、消去後の画像は提供されていないため、その状態で下塗りが未塗り部へ出ないことは**未確認**。 |
| 新たな広い継ぎ目・平坦面 | 顔detailと全体、上記原寸局所では追加の広い平坦面や大きな継ぎ目は認めない。微小残件R47-1は旧R40-1の残りとして区別する。 |

今回確認したsource原寸・直接2倍の仕上げだけの判定である。4倍Chrome、全10テーマ、native実画面、全色・全装飾、実機、P05性能、人間採用は未確認・判定外。公開33のscreen FAILを本試作の改善所見で解消扱いにしない。

## 確認前後のSHA256・bytes

4枚の現対象画像、40比較4枚、home/private4枚、原文2、prototype/evidence2、固定helper2の計18ファイル。全対象で前後SHA256一致、byte数変更0。

| ファイル（project相対） | bytes | 確認前 SHA256 | 確認後 SHA256 |
|---|---:|---|---|
| `test-results/smooth-home-i34/revision-47/prototype/princess-error3-source.png` | 1056556 | `332e6fb67a938c6d9c742f72ff7b2ef5ccc14f11091be0e46fe8d0c56270f4d4` | `332e6fb67a938c6d9c742f72ff7b2ef5ccc14f11091be0e46fe8d0c56270f4d4` |
| `test-results/smooth-home-i34/revision-47/prototype/princess-error3-detail.png` | 614590 | `621f77e3f1da3969ab256dc4a3d5ed1d8884da8f72d984cd44dc42ecec914683` | `621f77e3f1da3969ab256dc4a3d5ed1d8884da8f72d984cd44dc42ecec914683` |
| `test-results/smooth-home-i34/revision-47/prototype/magic-error3-source.png` | 1049732 | `941f195eeab1360bdd0e3aea433391a014db866d9fa63eb4e8658ceeb9de0b58` | `941f195eeab1360bdd0e3aea433391a014db866d9fa63eb4e8658ceeb9de0b58` |
| `test-results/smooth-home-i34/revision-47/prototype/magic-error3-detail.png` | 512623 | `91abe1df2fd98ac2884eb5e34dfe208d1fcbaf1a0c33c86d5537470f439fd66e` | `91abe1df2fd98ac2884eb5e34dfe208d1fcbaf1a0c33c86d5537470f439fd66e` |
| `test-results/smooth-home-i34/revision-47/prototype/evidence.json` | 833 | `ef8927460c4887b5bcecae9a300fc9cdb2df5535e65458b297540dfebf162528` | `ef8927460c4887b5bcecae9a300fc9cdb2df5535e65458b297540dfebf162528` |
| `test-results/smooth-home-i34/revision-47/prototype.mjs` | 9907 | `36f7b27585b1821002a218bf919932ac2c34f872ef1998c0fb367f51c156f22c` | `36f7b27585b1821002a218bf919932ac2c34f872ef1998c0fb367f51c156f22c` |
| `test-results/smooth-home-i34/revision-40/relative-part-light.mjs` | 2869 | `46795ab4902fce177dd4c0997e0f6c88d5c307377c08343ec27f4d7ab5c884a6` | `46795ab4902fce177dd4c0997e0f6c88d5c307377c08343ec27f4d7ab5c884a6` |
| `test-results/smooth-home-i34/revision-40/shadow-samples.mjs` | 1409 | `b39bfa2a64ccbca9c563395c91e8b5451e1877ab3b2534c3b92b66317c5ba659` | `b39bfa2a64ccbca9c563395c91e8b5451e1877ab3b2534c3b92b66317c5ba659` |
| `test-results/smooth-home-i34/revision-40/prototype/princess-error3-source.png` | 1059942 | `386721e1d7c6cd599098c2f05c303a6cad410d74769497bee2ea3be7d726e192` | `386721e1d7c6cd599098c2f05c303a6cad410d74769497bee2ea3be7d726e192` |
| `test-results/smooth-home-i34/revision-40/prototype/princess-error3-detail.png` | 616099 | `a90df0bd589a277e63531721a510f7196b746104fdcaa0abcc40e66e2a0cb11a` | `a90df0bd589a277e63531721a510f7196b746104fdcaa0abcc40e66e2a0cb11a` |
| `test-results/smooth-home-i34/revision-40/prototype/magic-error3-source.png` | 1051710 | `51489c3cdceb7803d5c20fbe796fcb103a15fea39e65791264cd8f9cfb58f5d5` | `51489c3cdceb7803d5c20fbe796fcb103a15fea39e65791264cd8f9cfb58f5d5` |
| `test-results/smooth-home-i34/revision-40/prototype/magic-error3-detail.png` | 512419 | `347f68e2db73a66bd1b7837c76797a0edb8b23b6ec59ab1751f00f1d0c8d67ce` | `347f68e2db73a66bd1b7837c76797a0edb8b23b6ec59ab1751f00f1d0c8d67ce` |
| `docs/audits/smooth-home-i34-revision-40-prototype-visual-20261012.md` | 14386 | `9e07ecf53388a228fa8608f5db0b7add5fad14b613317a50a019312c769ad3e5` | `9e07ecf53388a228fa8608f5db0b7add5fad14b613317a50a019312c769ad3e5` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |

旧原本はそのまま保持した。本原本は候補47を現物で限定評価した新規記録であり、旧FAILの自己上書きや受入基準の変更ではない。

