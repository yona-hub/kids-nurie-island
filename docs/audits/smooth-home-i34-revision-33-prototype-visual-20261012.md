# I34 revision 33 独立 prototype 目視原本（人物眼3テーマ限定）

判定: **PASS — 候補33の人物3テーマの試作画像に限り、B03-1 の一定幅の淡い帯による二重枠は解消し、眼の仕上げを受け入れられる。** 側面・下側の白目が残り、姫のまつげ接続 B03-2 も維持されている。原寸の眼、顔 detail、source 全体と実 home を比較し、今回の眼の品質範囲でブロッキング欠陥は認めなかった。

これは未公開 prototype の限定判定である。候補32の FAIL はそのまま保持する。全10テーマ、人物の眼以外を含む全輪郭、現行 runtime/public/build、実ブラウザ・実機、性能の合格を意味しない。

検査担当: 独立画像レビュー担当 `/root/i34_finish_visual`。単独で実表示し、再委任やモデル・effort 変更は行っていない。この新規原本以外のファイルを編集していない。他の担当の変更を戻していない。

## 固定証拠・時刻・provenance

- 確認前 SHA256: 2026-10-12T18:39:00.0891425+09:00
- 確認後 SHA256: 2026-10-12T18:41:05.9534643+09:00
- 対象14ファイル（実表示した画像12、読み取った JSON/試作コード2）の SHA256 とサイズはすべて前後一致。
- `prototype/evidence.json` の人物3テーマの `pngSha256` は、実際の各 source PNG の SHA256 と一致した。これは証拠対応の確認であり、画像の美術的な合格を保証するチェックではない。
- `prototype.mjs` と `evidence.json` を読み取り専用で確認した。コードはテンプレートの人間の虹彩・瞳孔位置や虹彩寸法、反射位置をメモリ内で設定し、prototype 出力を保存する記述になっている。この検査ではコードを実行していない。コードの意図や生成担当の説明を PASS 根拠にはしていない。
- runtime/public/build が候補32のままであることは依頼と evidence の scope に記載されている。この限定検査ではそれら全体の状態を再検証しておらず、prototype の PASS を現行 build へ移していない。

## 実表示と比較条件

`test-results/smooth-home-i34/revision-33/prototype/` の princess、magic、space それぞれについて、1600×2000 の source 全体と detail を実表示した。private 登録原画は分析専用とし、同名の `content/smooth-finish-i34/derived/*-registered.png` の眼を同じ world 座標で切り出して比較した。

座標は左上 (0,0) の world 1600×2000。下表は xyxy の右端・下端を含まない切り出し範囲。これらを原画素のまま表示している。画像の切り出しはメモリ内のみで行い、新規画像や private 原画のコピーを保存していない。

| テーマ | source / 登録参照の原寸比較範囲 |
| --- | --- |
| princess | (600,505)–(855,655) |
| magic | (670,570)–(915,720) |
| space | (905,875)–(1195,1045) |

姫の右まつげ周辺 source (740,540)–(855,655) を原寸、根元 (818,570)–(850,620) を nearest-neighbor 3倍でも表示した。

実 home `apps/web/public/images/islands/princess-v1.webp`、`magic-v1.webp` および `content/smooth-finish-i33/references/home-target.png` を今回あらためて実表示した。ホームの全体での顔の馴染み、登録参照の原寸での材質・陰影のつながりを判断材料にした。

形状、選択色、構図、白目と虹彩の量、反射位置の一致は受入条件にしない。登録参照にも複数の弧や白い三日月があるため、その存在だけで FAIL としていない。旧原本と既存基準を維持し、候補33の実際の材質、陰影、滑らかさと眼から肌への一体感を評価した。

## 観測結果

**B03-1: この3人試作で PASS。** 候補32では上瞼の外側暗線と虹彩上縁の暗線の間に一定幅の明るい帯が続き、二重の枠として読めた。候補33の実画像では、上側で虹彩の暗部と上瞼の暗部が接続し、独立した淡い帯として眼の上側を囲う見え方が解消した。側端の細い縁は残るが、上中央から両端まで太い別枠として続く状態ではない。

上側の暗さから下側の茶色の光への勾配、瞳孔、主反射と小さな反射が、眼の曲面として読める。肌側の影と上瞼の暗部に接続があり、原寸と顔全体の両方で、眼だけが別の器具のように載っている印象が改善した。選択色や形状が登録原画と異なることを理由に判断を変えていない。

| テーマ | 原寸で確認した眼の概略範囲（world x / y） | 判断 |
| --- | --- | --- |
| princess | 左 x607–707 / y507–607、右 x744–850 / y543–640 | 上瞼の下で虹彩へ暗さがつながる。側面・下側の白目が丸い開口の一部として残り、以前の上帯・下台座のような分離はない。左右の主反射は眼の上側で整合し、まつげを含めて顔に馴染む。 |
| magic | 左 x682–755 / y579–666、右 x824–900 / y614–702 | 小さな眼の上側で淡い二重枠が消え、上瞼と虹彩が接して見える。側面と下の白目は読めるため、候補29のように暗い楕円が直接肌へ載る見え方へ戻っていない。左上の主反射と下側の小さな光が読める。 |
| space | 左 x918–1017 / y915–1030、右 x1084–1184 / y886–1005 | 上側の独立した淡い帯が解消している。側面・下側の白目は連続した曲面の余白として読め、分厚い台座ではない。虹彩と瞳孔の形が崩れず、左右の上側の主反射・下側の小さな光と肌側の影がつながって見える。 |

反射の向きは姫・宇宙が右上、魔法が左上として自然に読めた。同じ反射位置の複製を要求したわけではなく、各顔の眼の中で光が不自然に分裂・欠落していないかを見ている。

**B03-2: この試作で PASS 維持。** 姫の右まつげ根元 world x828–842 / y580–611 は暗い形が連続し、白い短冊切れや矩形の穴の再発は見えなかった。まつげから上瞼への接続と、隣の白目を区別して確認した。

今回の眼周辺に大きな白抜け、輪郭外へ広く色が漏れる状態、急な段差、虹彩や反射の形の破綻は見られなかった。これは視認範囲の評価であり、全画素の白抜け・漏れがゼロという測定結果ではない。

## 残る所見と最小修正

この限定範囲で **B03 合格に必要な追加修正はない**。細い外縁と淡い影は主に上瞼の側端に見えるが、候補32の一定幅の上帯とは区別する。これを存在だけで残件に戻さない。

非ブロックの所見として、magic と space の上瞼側端には他の箇所より均一な細い縁が残る。確認位置の概略は magic 左 x742–749 / y606–636、右 x886–894 / y640–673、space 左 x1003–1013 / y951–978、右 x1171–1178 / y921–947。この細い縁は顔全体で独立した太い枠としては読めず、今回の判定を妨げない。さらに仕上げる場合の最小単位は側端の縁の明暗が終わる箇所をなじませる調整であり、白目を消すことや虹彩全体を再拡大することは今回の検査から必要とは言えない。

## 未確認

全10テーマの最終仕上げ、人物眼以外の全輪郭、旧 B01/B02 と B04〜B08 の候補33での専用再検査は今回の対象外。人物 source 全体を表示したことから、それらの閉鎖や全素材の最終承認を導かない。

native、Chrome 実画面、ブラウザの1・2・4倍、実機、性能・P05、現行 build への組込み後の描画は未確認。source の原寸や detail の表示をこれらの実環境検証として扱わない。外部通信、性能測定、公開を行っていない。

## 確認前後 SHA256

以下はすべて確認前後で同一。パスはリポジトリルート相対。

| 証拠 | SHA256 | 前後 |
| --- | --- | --- |
| `apps/web/public/images/islands/magic-v1.webp` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | 一致 |
| `apps/web/public/images/islands/princess-v1.webp` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | 一致 |
| `content/smooth-finish-i33/references/home-target.png` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | 一致 |
| `content/smooth-finish-i34/derived/magic-registered.png` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | 一致 |
| `content/smooth-finish-i34/derived/princess-registered.png` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | 一致 |
| `content/smooth-finish-i34/derived/space-registered.png` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype.mjs` | `ae28d4e37e8bdab0649e68cb8a1f08e21d4ac9a0ac3faa623a9af3ad394871ad` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype/evidence.json` | `78697dbe56e1919fbe4f038a0ac85d91a589be0833761ff8cfa42972eba380e5` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype/magic-detail.png` | `c7ea6be521c430eea37b71f5958b7e64a72c1f606f90e75604dfcc2204767f6e` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype/magic-source.png` | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype/princess-detail.png` | `178d06cd0e3ef760fb18a8ba74afbbed49d3f8d5092cac9d9c86721dba85eb6f` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype/princess-source.png` | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype/space-detail.png` | `7ad5ce767d4f9a5905f43592beb9858e7fd43f299e77a52b98038b016c053ee4` | 一致 |
| `test-results/smooth-home-i34/revision-33/prototype/space-source.png` | `6faee3c90ff10e1d007a05e8a8aa734730b44b75b72697f587b36a3394f9d338` | 一致 |

