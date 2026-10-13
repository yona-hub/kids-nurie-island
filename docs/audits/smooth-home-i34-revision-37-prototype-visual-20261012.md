# I34 revision 37 prototype-2 独立限定目視原本

- 判定: **FAIL**。error1.5/3とも頬・顎の細かな段差は減るが、姫の耳の周囲・顎下の髪に新しい広い平坦な茶色面と継ぎ目が現れる。輪郭の改善だけでホーム同等の最終仕上げとは判定できない。
- 対象: 未公開 `revision-37/prototype-2/{princess,magic}-error{1.5,3}-{source,detail}.png` 全8枚。人物2の限定試作評価。
- `revision-37/prototype/`（-2なし）の不採用harness出力は使用していない。他候補の新画像を今回の対象へ混ぜていない。
- 独立確認者: `/root/i34_finish_visual`。単独、再委任なし、継承した主モデル/effortを維持。
- 作業ルート: `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。
- レビュー開始: 2026-10-12T20:14:44+09:00。確認前hash: 2026-10-12T20:15:22.2649211+09:00。prototype.mjsの読取り前hash: 2026-10-12T20:17:09.3962753+09:00。全表示後hash: 2026-10-12T20:19:45.4298293+09:00。15分以内の限定レビュー。
- 全10、実Chrome、現在の公開/build、P05性能、実機、人間採用の合格へ拡張しない。公開/buildは33のままと通知されており、33 screen FAILと34 prototype FAILの原本を維持する。
- 本報告だけを新規作成。コード/素材/画像/旧報告に書き込んでいない。外部通信、公開、性能測定、素材生成、モデル変更を行っていない。

## 実際に表示・参照した範囲

8枚すべての実ファイル名を先に確認し、各sourceの全体を縮小表示、各detailを原寸で表示した。sourceは1600×2000、detailは姫860×860、魔法760×800。

各sourceの顔を原寸で別途表示した。姫ROIは `[490,430]–[920,860]`、魔法ROIは `[565,465]–[945,865]`。prototype.mjsの出力箇所から、detailは3200幅snapshotをこれらのROIに対応する2倍領域で切り出したことを識別した。単なるsource補間拡大を実2倍レンダーと呼んでいない。

2倍detailの主な最小再表示箇所:

- 姫の額下/耳周囲: `[0,100]–[310,425]`。
- 姫の顎/髪: `[130,380]–[720,650]`。
- 姫の右頬: `[620,350]–[715,540]`。

error1.5/3の両方で同じ領域を表示した。表示用のメモリ内切出しだけを行い、画像の別保存・素材変更は行っていない。

33 screen FAIL S01/S02と34 prototype FAILの原文を読んだ。33の姫/魔法sourceを原寸顔局所、34 width0の姫/魔法detailを原寸で再表示し、実際の差を比較した。実homeの姫・魔法・home-targetも再表示し、private人物2登録参照の原寸顔局所と比較した。private画像は分析だけに使用し、配布・公開・保存コピーをしていない。

参照と同じ形状、配色、白目量、構図の複製を求めていない。現在の図案で、陰影・材質・顔との接続が自然に連続するかを基準にした。

## 主な不足と位置

world座標は1600×2000の包含範囲。detailの画像座標は姫ROI原点(490,430)、魔法ROI原点(565,465)から2倍。

### R37-1: 姫の髪の新しい平坦面と継ぎ目 — FAIL / 主ブロッカー

error1.5と3に共通する。耳の上と後ろ、顎の後ろに、髪の流れや陰影が弱い平坦な茶色面が広がる。周囲の髪には明るい筋と柔らかい陰影があるのに、該当部分は別の色面として途切れる。輪郭を滑らかにするために、髪の立体感と材質の連続が失われた見え方である。

| 現在の現象 | world包含範囲 | 2倍detailの目安 |
| --- | --- | --- |
| 額下/耳上の茶色面で髪の明暗が急に切り替わり、斜めの継ぎ目が見える | `x530–603,y500–557` | `[80,140]–[226,254]` |
| 耳下～左顎の後ろが広い平坦な暗茶面になり、左側の髪の陰影との接点が硬い | `x568–634,y620–744` | `[156,380]–[288,628]` |
| 右顎下から髪へ、細い旧帯を越える幅の茶色面が残り、周囲の髪と材質がつながらない | `x704–835,y703–738` | `[428,546]–[690,616]` |

33/34にも暗い髪の部分はある。暗い色そのものを新欠陥とはしていない。現在37では、同じ髪の中で方向のある陰影から平坦な面へ急に切り替わり、物体の端や自然な接触影として説明しにくい継ぎ目が識別できることが新しい不足である。原寸sourceの顔にもあり、2倍表示だけのドット粗さではない。

error3は一部の境界の角がより単純な形へ移るが、この平坦面と継ぎ目を解消しない。error1.5にも共通する主因が残るため、どちらも採用PASSにはしない。

### R37-2: 魔法の材質のつながりの変化 — 副所見

人物の眼や肌の陰影は保たれる一方、こめかみ付近の髪の下端（概ね `x625–650,y590–620`）や襟/肩（概ね `x600–730,y750–860`）では、平坦な面と周囲の陰影の切替が強くなる。2倍detailと原寸顔で確認した。

襟は布の折れを持つ図案なので、色面が分かれることだけを不合格理由にしていない。ただし33/34に対する材質の連続性の変化は残件として記録する。今回の明確な採用不可の主因はR37-1であり、魔法の副所見だけを使って全10の状態を推定しない。

## 旧帯・輪郭・眼・口の現在所見

| 項目 | 今回の現物による判断 |
| --- | --- |
| 姫の右頬 `x812–834,y625–675` | 34の細かい折れ/細帯は減り、境界は読みやすくなった。ただし頬端の小さい折れ/突起と、顎側へ続く隣接茶色面は残る。R37-1を含めて完全解消PASSにしない。 |
| 姫の耳/顎の旧帯 | 細い輪郭帯としての目立ち方は減る。その代わりに、耳後ろ/顎後ろの広い平坦な面が材質の仕上げを落とす。旧帯が薄くなったことと最終仕上げの合格を分ける。 |
| 魔法顎下 `x737–823,y777–790` | 細かな階段が減り、連続した顎の曲線として読みやすい。旧B01の点/縞は再発していない。現在の改善を認め、先行FAILを機械的に転記しない。 |
| 人物2のB03眼 | 一定幅の淡い上帯/二重上弧は再発していない。白目、虹彩、瞳孔、反射が読める。眼局所の旧欠陥は未再現。 |
| 姫まつげ根元 `x828–842,y580–611` | 旧の白い短冊状の穴は再現せず、まつげは接続する。隣接する髪/肌の仕上げを、この接続だけで合格にしない。 |
| 人物2の口 | 口内が連続し、旧の白抜け/分断、顎の点/縞の復活は見えていない。 |
| 新しい広い白抜け・色漏れ | 指定8枚の人物2では広い白線の分離や顔の外への明白な色漏れを確認しない。全色・全操作での保証ではない。 |
| 33 screen S02の全10材質境界 | 今回は2人だけの未公開試作。車・ロボット・花などのS02は再確認しておらず、解消を主張しない。 |

姫のウサギは全体画像に含まれるが、今回の対象は人物2の顔/周辺材質。ウサギを含む全顔・全口の最終合格には拡張しない。

## 最小不足と原因の扱い

**最小不足:** 姫のR37-1に示した髪の平坦面と継ぎ目をなくし、周囲の髪と方向・明暗・材質が連続するようにする必要がある。その際、改善した輪郭を旧の段差へ戻さず、現在つながる眼・口・まつげを維持する。同じworld領域の原寸sourceと2倍detailで、平坦面が別の帯や白隙間へ置き換わっていないことを再比較する。

JSONには「Euclidean fields plus separate per-material relative light gutters (in-memory runtime transform)」と記録されている。この説明や原本ink alphaを維持したとの通知を、美術PASSの根拠にはしていない。どのサンプルの処理が何画素の平坦化を起こしたかは本目視では断定しない。上記は表示された材質の途切れの観測である。

37生成後、親から現helper `scripts/relative-part-light.mjs` を別38試作用へ変更し、37使用時の旧版を `revision-37/relative-part-light-before-group.mjs` に保全したとの通知を受領した。現helperは今回のhash/表示対象に含めておらず、未実行。prototype.mjsは出力先とROIの識別だけに用い、現在のhelperから37を再現できることを検証したとは主張しない。helper変更を37の画像変更と混同していない。

## 不変性・範囲

8画像とevidence.jsonの確認前後hashは同一で、4 sourceのhashはevidence.json記載値とも一致した。参照/比較原本/ROI識別コードを含む全21ファイルも前後同一、サイズ変更0、欠落0。33 screen FAIL原本と34 prototype FAIL原本は保持される。

本報告は37 prototype-2の限定FAILのみ。公開/buildは33のままのため、現在buildの判定を更新していない。実Chrome、全10source、全色/全装飾、実機、P05性能、他候補、人間の採用は未確認。技術テストを実行・成功扱いにしていない。

## 確認前後SHA256

確認前は 2026-10-12T20:15:22.2649211+09:00、prototype.mjsだけは読取り前 2026-10-12T20:17:09.3962753+09:00。全表示後は 2026-10-12T20:19:45.4298293+09:00。パスは作業ルートからの相対表記。private行は識別用であり画像配布ではない。

| ファイル | bytes | 確認前SHA256 | 全表示後SHA256 |
| --- | ---: | --- | --- |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `test-results/smooth-home-i34/revision-37/prototype-2/evidence.json` | 1558 | `337c82461d07fc9916a2276fb151048667ec1f139a59784f6b07d820ae5cdfcc` | `337c82461d07fc9916a2276fb151048667ec1f139a59784f6b07d820ae5cdfcc` |
| `test-results/smooth-home-i34/revision-37/prototype-2/magic-error1.5-detail.png` | 474688 | `001757f845068088829f607f07e72fc05625c00cbd55823c0753d74a4a3a93cd` | `001757f845068088829f607f07e72fc05625c00cbd55823c0753d74a4a3a93cd` |
| `test-results/smooth-home-i34/revision-37/prototype-2/magic-error1.5-source.png` | 1059481 | `89b6028a7bbe0602092fba0ba09cd7a98f563229078dfea8c9954d1a37afefaf` | `89b6028a7bbe0602092fba0ba09cd7a98f563229078dfea8c9954d1a37afefaf` |
| `test-results/smooth-home-i34/revision-37/prototype-2/magic-error3-detail.png` | 474900 | `39b69a732e11ef8877c1953a16b75283134f28171c5fb100ca1f08a0be507caa` | `39b69a732e11ef8877c1953a16b75283134f28171c5fb100ca1f08a0be507caa` |
| `test-results/smooth-home-i34/revision-37/prototype-2/magic-error3-source.png` | 1060150 | `88f3f30b96f62d9390f3bd91a86d7d869174f641a3c32e278162cecb26b47a8c` | `88f3f30b96f62d9390f3bd91a86d7d869174f641a3c32e278162cecb26b47a8c` |
| `test-results/smooth-home-i34/revision-37/prototype-2/princess-error1.5-detail.png` | 527912 | `5c60a1071954cae4c7aa9bceea6a399053d1dbeef5035f33fcdd28472ba0fe87` | `5c60a1071954cae4c7aa9bceea6a399053d1dbeef5035f33fcdd28472ba0fe87` |
| `test-results/smooth-home-i34/revision-37/prototype-2/princess-error1.5-source.png` | 995095 | `e757a99c13944acaf43d1de14c45d4b419920961c5fc4c3099a1e0e831ced7b3` | `e757a99c13944acaf43d1de14c45d4b419920961c5fc4c3099a1e0e831ced7b3` |
| `test-results/smooth-home-i34/revision-37/prototype-2/princess-error3-detail.png` | 527733 | `6394650d84663c0e405c7f5a18e548b37226e5376b31d4a756264f0c7c46d76a` | `6394650d84663c0e405c7f5a18e548b37226e5376b31d4a756264f0c7c46d76a` |
| `test-results/smooth-home-i34/revision-37/prototype-2/princess-error3-source.png` | 994148 | `cd797469e04d2642521ca93e59649e332b74cb03baa8a0bbd881e4fdd21a9a92` | `cd797469e04d2642521ca93e59649e332b74cb03baa8a0bbd881e4fdd21a9a92` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |
| `docs/audits/smooth-home-i34-revision-34-prototype-visual-20261012.md` | 16118 | `c084bec05bb86439d18583f2efe8e0b5edf1b8dc3fca97bc9d14b62565f740fd` | `c084bec05bb86439d18583f2efe8e0b5edf1b8dc3fca97bc9d14b62565f740fd` |
| `test-results/smooth-home-i34/revision-33/after/magic-source.png` | 1301925 | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` |
| `test-results/smooth-home-i34/revision-33/after/princess-source.png` | 1187093 | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` |
| `test-results/smooth-home-i34/revision-34/prototype-2/magic-width0-detail.png` | 543629 | `5fcdc03aeea6172f4dea0cc9cedf75cbef9fe326c5dab4367ff08a649152fb83` | `5fcdc03aeea6172f4dea0cc9cedf75cbef9fe326c5dab4367ff08a649152fb83` |
| `test-results/smooth-home-i34/revision-34/prototype-2/princess-width0-detail.png` | 596854 | `499dd3a1287b18e723ed3c8754c67c622ec3980112b2aeddb09b3867a5e8c52e` | `499dd3a1287b18e723ed3c8754c67c622ec3980112b2aeddb09b3867a5e8c52e` |
| `test-results/smooth-home-i34/revision-37/prototype.mjs` | 7185 | `98aa01253f2677386bc73051588f25db12f71edfa7447e1eadceb92739003853` | `98aa01253f2677386bc73051588f25db12f71edfa7447e1eadceb92739003853` |

