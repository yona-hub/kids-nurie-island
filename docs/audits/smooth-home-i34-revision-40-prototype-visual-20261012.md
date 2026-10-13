# I34 候補40：人物2テーマの限定試作・独立目視原本

判定：**限定 FAIL**。対象は候補40の未公開インメモリ試作8枚だけ。37で不合格だった広い平坦な髪面・大きな継ぎ目は改善したが、姫の耳から左顎の髪、右頬下の髪に細い境界線が残る。原寸sourceでも認識でき、直接2倍detailでは陰影を横切る縫い目状の線として見えるため、ホーム同等の輪郭・仕上げの完了とは認めない。error1.5 / error3 はともに FAIL。

## 範囲と方法

- 単独の独立目視。再委任、モデル・effort変更なし。
- 開始：2026-10-12 20:36:51 JST。
- 確認前hash：2026-10-12T20:37:34.9316357+09:00。
- 最終実表示後hash：2026-10-12T20:46:19.3736926+09:00。対象23ファイルはすべて前後SHA256・byte数一致。
- 対象ディレクトリは `test-results/smooth-home-i34/revision-40/prototype/`。41以降の画像・コードは読まず、判断に混ぜていない。
- sourceは1600×2000。全体は最大辺900〜1000pxに縮小して実表示し、顔と主要境界は元sourceの原寸局所を実表示した。detailはproducerが3200出力から切り出した直接2倍相当の画像として、その画素数のまま実表示した。加えて一部source局所を2倍nearest表示し、細線が縮小表示だけの現象かを区別した。
- 顔ROI：姫 world `[490,430,920,860]`、魔法 world `[565,465,945,865]`。detail座標はそれぞれ左上 `(490,430)` / `(565,465)` を原点とする2倍表示。以下の残件座標はすべて1600×2000 world座標、目視による包含範囲。
- private登録原画と実ホームはローカルで分析比較だけに使用。画像の配布・公開先へのコピー、派生画像のファイル保存はしていない。

公開/runtime/buildは33のままという提供状況を記録する。40の実Chrome、native実画面、全10テーマ、4倍表示、実機、P05性能、全色・全装飾、人間採用は今回未確認・判定外。33のscreen FAIL原本は継続し、40の試作評価で上書きしない。

## 実際に開いた候補40の8枚

| テーマ | 設定 | 実表示 |
|---|---|---|
| princess | error1.5 | `princess-error1.5-source.png` 全体・原寸顔・局所原寸/2倍、`princess-error1.5-detail.png` 全体・局所 |
| princess | error3 | `princess-error3-source.png` 全体・原寸顔・局所2倍、`princess-error3-detail.png` 全体・局所 |
| magic | error1.5 | `magic-error1.5-source.png` 全体・原寸顔/眼/口・顎2倍、`magic-error1.5-detail.png` 全体・顎局所 |
| magic | error3 | `magic-error3-source.png` 全体・原寸顔・顎2倍、`magic-error3-detail.png` 全体 |

比較として、33 screen S01原文と37 prototype FAIL原文を読んだ。33の姫・魔法sourceを原寸顔とS01局所2倍で表示し、37の `prototype-2/*-error1.5-detail.png` 2枚を全体・該当局所で表示した。37の不採用 `prototype/` は使っていない。

実ホーム `princess-v1.webp` / `magic-v1.webp` と `home-target.png` を全体表示した。private `princess-registered.png` / `magic-registered.png` は原寸顔、姫の問題部を局所2倍でも表示した。比較の対象は毛流れ、陰影の連続、顔への接続、輪郭の滑らかさであり、形状・選択色・構図の複製を要求していない。

`evidence.json` と `prototype.mjs` の出力寸法・ROI・ローカルhelper参照を読み、固定された `revision-40/relative-part-light.mjs` と `shadow-samples.mjs` をhash対象に含めた。制作方法の説明やファイル同一性は美術PASSの根拠にしていない。

## 主残件 R40-1：髪の暗部に細い境界線が残る

| 部位 | 残件のworld範囲 | 実表示した包含範囲 | 現物の所見 |
|---|---|---|---|
| 姫・耳から左顎の後ろの髪 | x579–589, y646–727 | source `[575,640,605,730]` 原寸/2倍、detail `[170,420,230,600]` | 顔際から下へ、細くほぼ縦方向の薄茶〜灰色線が続く。広い茶色の平坦面はなくなったが、その位置で明暗が細い線を境に分かれ、毛流れの連続より領域の継ぎ目として読める。両errorの直接2倍detailで同じ線を確認した。 |
| 姫・右頬下の髪 | x814–835, y654–711 | source `[805,650,850,720]` 原寸/2倍、detail `[630,440,720,580]` | 灰色〜薄茶色の細い断片が弧状に連なる。明るい小片が途切れながら並び、その下まで細い線が続く。復元された大きな髪の陰影から独立して浮き、縫い目に似て見える。error1.5 / 3 で残る。 |
| 姫・耳上の髪 | x522–546, y519–526 | source `[515,510,550,535]` 2倍、detail `[0,120,250,260]` | 耳と髪の接点に数個の灰色がかった短い断片が残る。上の2か所と同系の微小残件として記録する。 |

原寸では線は細く低コントラストだが、局所を元画素で開いても消えない。直接2倍detailでも残るため、sourceをnearest拡大した際の単なる1px段差だけとは扱えない。全体縮小では目立ちにくいが、確認対象の拡大品質では明瞭になる。

37ではこの位置から広い茶色面の境界が続いていた。40では広い面の色・毛流れは改善した一方、細い境界の痕跡が残るという観察である。private同位置では自然な広い髪陰影がつながり、同様の灰色断片列は認めなかった。ただし形状一致を要求する比較ではない。

姫の耳から左顎への顔外形には、world x582–596, y646–660 に短い折れも見える。40で太い茶色帯は除去され、37と同じ顔形状の接続が残っている。この形状差だけを独立したFAIL理由にはしないが、髪側の細線との接続部として残件範囲に保持する。原寸・2倍で得た判断を4倍実画面へ拡張しない。

**最小不足**：上記の局所で細い独立線・断片列をなくし、真の顔/髪境界と髪内部の陰影・毛流れを連続させること。髪全体を平坦化したり、全体ぼかしで線を隠したりする必要はない。どの入力・マスク・ink・光サンプルが原因かは、この目視だけでは未特定。境界分割の不一致などの原因仮説を事実として記録しない。

## 改善と再発確認

| 確認項目 | 現在の独立所見 |
|---|---|
| 37の主FAIL：姫の広い平坦な髪面 | world x530–603,y500–557、x568–634,y620–744、x704–835,y703–738 の各暗部に毛流れと階調が戻った。37にあった広い単色面と大きな切り替わりは両errorで認めない。改善を確認。 |
| 33 S01：姫右頬の太い帯・階段状境界 | world x812–834,y625–675 と周辺 `[795,600,850,700]` を33source2倍と40直接2倍detailで比較。33の太い茶色帯と大きな段差は40で明確に減り、顔際の曲線が連続して見える。上記R40-1の細線は髪内部に残る別の不足。 |
| 33 S01：魔法の顎下 | world x737–823,y777–790 と周辺 `[700,750,855,820]` を両errorで確認。旧33の横方向の細かな階段帯・顎下の色付き縁は明確に減り、顎から首・襟への線が連続して見える。 |
| 目・瞼・白目・虹彩・肌 | 姫の左眼x607–707,y507–607、右眼x744–850,y543–640、魔法の左眼x682–755,y579–666、右眼x824–900,y614–702と顔全体を確認。白目が側面/下に残り、上側に一定幅の白い二重枠が再出現しているとは認めない。眼球と瞼の影も保たれる。 |
| 姫まつげ | 右眼まつげ根元 x828–842,y580–611 を含めて確認。旧い白い短冊状の穴、独立した余分なまつげは認めない。 |
| 口・顎の旧不具合 | 姫・魔法の口を原寸顔/局所と2倍detailで確認。口の白抜け、顎下の点/縞の再発は認めない。 |
| その他の材質 | 魔法のこめかみ・耳際の髪にも陰影が戻る。襟内側の濃紫面は折り返しの暗部として読め、今回見た範囲では37の髪と同じ新たな広い平坦面・継ぎ目を独立した追加ブロッカーとして認めない。 |
| error1.5 / 3の比較 | 目視した主残件・改善は共通。どちらも主残件を解消しないため、今回の合否を設定間で分けない。 |

この限定FAILは姫の細い髪境界が理由であり、広い髪の陰影を戻した改善を否定するものではない。魔法で旧不具合の再発は見つからなかったが、2人の限定試作全体は未完了である。未提供の技術検査や実画面の成功を補っていない。

## 確認前後のSHA256

新規報告を除く、今回確認対象23ファイル。両列一致、byte数変化0。private画像はhashと参照パスだけを記録し、本報告へ画像を埋め込んでいない。

| ファイル（project相対） | bytes | 確認前 SHA256 | 確認後 SHA256 |
|---|---:|---|---|
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `test-results/smooth-home-i34/revision-40/prototype/evidence.json` | 1558 | `f45d05d1d543e6800715d10e70346ab12d4a919180aa51eb1509ae2acd279df3` | `f45d05d1d543e6800715d10e70346ab12d4a919180aa51eb1509ae2acd279df3` |
| `test-results/smooth-home-i34/revision-40/prototype/magic-error1.5-detail.png` | 512916 | `74e5987d438e653ee1f17f6388bbfc745a52e9ee65350eb6de57ee74dc2a25da` | `74e5987d438e653ee1f17f6388bbfc745a52e9ee65350eb6de57ee74dc2a25da` |
| `test-results/smooth-home-i34/revision-40/prototype/magic-error1.5-source.png` | 1051093 | `5b31299aa7f88edb27693fb7fb16604d1e083f843069c4e72796cdcf09490bec` | `5b31299aa7f88edb27693fb7fb16604d1e083f843069c4e72796cdcf09490bec` |
| `test-results/smooth-home-i34/revision-40/prototype/magic-error3-detail.png` | 512419 | `347f68e2db73a66bd1b7837c76797a0edb8b23b6ec59ab1751f00f1d0c8d67ce` | `347f68e2db73a66bd1b7837c76797a0edb8b23b6ec59ab1751f00f1d0c8d67ce` |
| `test-results/smooth-home-i34/revision-40/prototype/magic-error3-source.png` | 1051710 | `51489c3cdceb7803d5c20fbe796fcb103a15fea39e65791264cd8f9cfb58f5d5` | `51489c3cdceb7803d5c20fbe796fcb103a15fea39e65791264cd8f9cfb58f5d5` |
| `test-results/smooth-home-i34/revision-40/prototype/princess-error1.5-detail.png` | 616421 | `b0747451fed18b9c9b8df5b9da4a63829fe2c67af1739dae2683461cb7064407` | `b0747451fed18b9c9b8df5b9da4a63829fe2c67af1739dae2683461cb7064407` |
| `test-results/smooth-home-i34/revision-40/prototype/princess-error1.5-source.png` | 1059179 | `14116e8a45ef44ab914cc56cba999b992bf3588a68f630dd430c66580afb0332` | `14116e8a45ef44ab914cc56cba999b992bf3588a68f630dd430c66580afb0332` |
| `test-results/smooth-home-i34/revision-40/prototype/princess-error3-detail.png` | 616099 | `a90df0bd589a277e63531721a510f7196b746104fdcaa0abcc40e66e2a0cb11a` | `a90df0bd589a277e63531721a510f7196b746104fdcaa0abcc40e66e2a0cb11a` |
| `test-results/smooth-home-i34/revision-40/prototype/princess-error3-source.png` | 1059942 | `386721e1d7c6cd599098c2f05c303a6cad410d74769497bee2ea3be7d726e192` | `386721e1d7c6cd599098c2f05c303a6cad410d74769497bee2ea3be7d726e192` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |
| `docs/audits/smooth-home-i34-revision-37-prototype-visual-20261012.md` | 14389 | `a9a9b3e866b7170d8f5bfaeb613576e93da44ab6114e30c0b8d11e3ab6fb53fc` | `a9a9b3e866b7170d8f5bfaeb613576e93da44ab6114e30c0b8d11e3ab6fb53fc` |
| `test-results/smooth-home-i34/revision-33/after/magic-source.png` | 1301925 | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` |
| `test-results/smooth-home-i34/revision-33/after/princess-source.png` | 1187093 | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` |
| `test-results/smooth-home-i34/revision-37/prototype-2/magic-error1.5-detail.png` | 474688 | `001757f845068088829f607f07e72fc05625c00cbd55823c0753d74a4a3a93cd` | `001757f845068088829f607f07e72fc05625c00cbd55823c0753d74a4a3a93cd` |
| `test-results/smooth-home-i34/revision-37/prototype-2/princess-error1.5-detail.png` | 527912 | `5c60a1071954cae4c7aa9bceea6a399053d1dbeef5035f33fcdd28472ba0fe87` | `5c60a1071954cae4c7aa9bceea6a399053d1dbeef5035f33fcdd28472ba0fe87` |
| `test-results/smooth-home-i34/revision-40/prototype.mjs` | 8292 | `193ad38811f85faade54b39623925c9e1658c9d69e93cc65f895fdbdc69a68ec` | `193ad38811f85faade54b39623925c9e1658c9d69e93cc65f895fdbdc69a68ec` |
| `test-results/smooth-home-i34/revision-40/relative-part-light.mjs` | 2869 | `46795ab4902fce177dd4c0997e0f6c88d5c307377c08343ec27f4d7ab5c884a6` | `46795ab4902fce177dd4c0997e0f6c88d5c307377c08343ec27f4d7ab5c884a6` |
| `test-results/smooth-home-i34/revision-40/shadow-samples.mjs` | 1409 | `b39bfa2a64ccbca9c563395c91e8b5451e1877ab3b2534c3b92b66317c5ba659` | `b39bfa2a64ccbca9c563395c91e8b5451e1877ab3b2534c3b92b66317c5ba659` |

本原本だけを追加した。コード・素材・生成画像・旧PASS/FAIL原本は編集せず、性能測定、外部通信、生成、公開を行っていない。

