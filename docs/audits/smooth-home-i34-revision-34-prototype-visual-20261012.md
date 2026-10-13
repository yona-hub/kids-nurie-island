# I34 revision 34 未公開prototype 独立限定目視原本

- 判定: **FAIL**。主候補width0は比較中で最も自然で、旧の大きい段差は減る。しかし姫の右頬の折れと細い茶色の縁、顎から髪へ沿う茶色帯が2倍detailにも残り、旧ブロッカーの解消をPASSにできない。
- 評価範囲: 未公開インメモリ試作の姫/魔法2人、width0を主候補、width4を比較、width8を補助比較。全10テーマ・実Chrome・現行buildの合格ではない。
- 独立確認者: `/root/i34_finish_visual`。継承した主モデル/effort、単独、再委任なし。
- 作業ルート: `C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。
- 確認前hash: 2026-10-12T19:50:41.6387912+09:00。全表示後hash: 2026-10-12T19:55:55.9457167+09:00。29/29同一。
- 本報告だけを新規作成。コード/素材/画像/先行原本を編集していない。性能測定、外部通信、公開、素材生成、モデル変更を行っていない。

## 現物と表示範囲

実ファイル名を列挙して存在を確認した。以下のrevision 34相対パスは `test-results/smooth-home-i34/revision-34/` を起点とする。

- `prototype-2/{princess,magic}-width{0,4,8}-{source,detail}.png` 全12枚を表示した。
- `diagnostic/{princess,magic}-{neutral-light,neutral-without-ink,full}.png` 全6枚を表示した。
- `prototype-2/evidence.json` と `prototype.mjs` を読み、候補と出力範囲を識別した。コードの説明を目視PASSの根拠にしていない。
- 固定33の人物2 sourceを原寸局所で表示し、33の実UI出力2枚の顔も原寸局所で比較した。
- 実homeの姫/魔法画像とhome-targetを再表示した。private人物2登録参照は顔の原寸局所を表示して、陰影・顔への接続・滑らかさを比較した。private画像は分析だけに使用し、配布・保存コピー・公開を行っていない。

sourceは1600×2000の全体縮小に加え、姫 `[490,430]–[920,860]`、魔法 `[565,465]–[945,865]` を原寸表示した。detailは2倍の別snapshotを切り出した画像として、姫860×860、魔法760×800を原寸表示した。sourceを単に補間拡大したものと混同していない。局所は表示用のメモリ内切出しのみ。小領域を補間なしで拡大した補助表示も用いたが、それを実Chromeの倍率検査とは呼んでいない。

参照と同じ形状、色、白目量、反射位置への複製は条件にしていない。現在の図案の中で、材質と陰影がつながり、境界が滑らかに読めるかを判定した。

## 観測と判定

world座標は1600×2000。detailの座標は姫ROI原点(490,430)または魔法ROI原点(565,465)から2倍の画像座標。

### R34-1: width0の姫右頬の残る縁 — FAIL / 最小ブロッカー

旧対象 `world x812–834,y625–675` の頬/髪の接点で、大きい角の張出しは減った。しかし肌の右縁に細い茶色の帯が付き、まつげ下から頬下へ、細長い直線区間と小さい折れが続く。陰影そのものは柔らかいのに、境界は硬い切り抜きの縁として残って見える。通常の全体縮小では目立ちにくいが、原寸局所と2倍detailの両方にある。

- 同じ2倍位置の比較: `diagnostic/princess-full.png`、`prototype-2/princess-width0-detail.png`、`princess-width4-detail.png` の `[620,350]–[715,540]`。
- 主候補0の原寸sourceの再表示: `[805,600]–[845,690]`。
- 主候補0の2倍detail最小再表示: `[630,340]–[710,520]`。

色が輪郭外へ広く漏れ出した状態とは断定していない。現在の境界の形と、隣接する細い茶色帯の存在が仕上げを落としていることが不合格理由である。

### R34-2: width0の顎/髪・耳の茶色帯 — 残件

姫の顎下から髪へ沿う細い茶色帯が残る。対象包含範囲は概ね `world x705–815,y694–716`。2倍detail `[380,510]–[720,640]` では、肌の下縁に平坦な茶色の帯が沿い、その下の髪の陰影と別の縁として読める。耳の下縁にも細い茶色帯が残る（包含範囲 `world x512–580,y600–636`、detail `[10,160]–[220,430]`）。

これらはwidth0で新たに広い色漏れを作ったと確認したものではなく、旧の硬い縁を十分に消し切れていない所見である。耳の大きな角は減ったが、ホーム同等の自然な肌と髪の接続として完全な解消とはしない。R34-1と合わせて主候補の残件にする。

### 魔法width0の顎下 — 改善 / 当該局所では旧の細かな階段を大きく低減

旧対象 `world x737–823,y777–790` の顎下は、width0で細かな階段がかなり減り、連続した曲線として読みやすくなった。原寸source `[725,765]–[840,805]`、2倍detail `[300,590]–[560,680]` を確認した。33と同じ不合格所見を自動的に当てはめていない。

この改善を、姫の残件解消や人物2全域/実4倍Chromeの合格へ拡張しない。襟との接点の細部は別の材質境界として残り、33 screen報告の全10のS02をこの2人の試作で閉じていない。

### width4/width8 — 主候補にしない

追加幅を増やすと肌と髪の境界自体が移動する。姫の額の髪の下辺はwidth4で長い斜めの直線と角として見える（包含範囲 `world x605–710,y466–505`、detail `[160,0]–[485,165]`）。width0の小さい曲がりを取り除いた代わりに、自然な前髪とのつながりが硬くなる。顎/首の接点も形が移動する。width8では茶色領域の張出しと顔の縁の移動がさらに目立つ。

これは参照と顔の形が違うことを問題にしているのではない。現在の髪の流れ・肌の陰影に対し、直線的な切断と輪郭の移動が目立つためである。width4/8はR34-1のための単純な採用代替にしない。

## 白抜け・眼・口の再発確認

- 主候補0の人物2の眼は、旧の一定幅の白い上帯/二重上弧が復活していない。側面/下の白目、虹彩、瞳孔と反射が読み分けられる。原寸/2倍で旧眼の退行を確認しない。
- 姫まつげの根元 `world x828–842,y580–611` の旧白い短冊状の穴は再現せず、まつげが接続する。隣の頬/髪の帯を、この局所PASSで解消扱いにしていない。
- 人物2の口内は連続し、旧の白抜け・分断や顎の点/縞の再発は見えていない。
- 通常の試作full/source/detailに、顔の各領域を白線で分離する新しい広い白抜けは確認しない。小さな髪のハイライト/白い微細点だけを穴と断定していない。
- 姫のウサギは全体画像に含まれるが、今回の主範囲は人物2。ウサギを含む全10/全顔の最終合格は主張しない。
- width4/8で眼/口の旧白抜け再発を確認しないが、境界の移動という別の品質不足があるため採用合格にはしない。

## 診断で分かったことと推測の区別

`neutral-light` は陰影を中立にしても肌/髪の境界に折れが見える。`neutral-without-ink` は同じ辺が滑らかな曲線になる一方、領域間に白い分離線・隙間が現れる。この視覚差は、元のink色分けが硬い縁の見え方へ寄与しているという親の診断と整合する。

ただし、`neutral-without-ink` は完成画像としてPASSではない。白い隙間が残るため、それをそのまま完成品にする判断はしていない。元のink、ベクターcoverage、外側fallbackのどの組合せが何画素を支配したかまでは、この目視だけで断定しない。

`prototype.mjs` とevidenceはwidth0/4/8の試作を識別する補助証拠である。記録には「native vector coverage」「raster-owner fallback only outside every local vector region」とあるが、その説明だけでは残る帯やずれを合格にできない。

**最小修正:** width0を基点に、姫の右頬と顎/耳の境界近傍で、肌と髪のcoverageと色の所有が同じ連続した境界へ収まるように整える。太い拡張で形を動かす、茶色の枠を残して白隙間を隠す、全体をぼかすだけでは不足を解消しない。眼/口の現在のつながりを維持し、同じworld局所の原寸・2倍を再比較する必要がある。

## 範囲の限界と先行原本

本判定は姫/魔法の未公開試作限定。公開/runtime/buildは33のままと記録されており、34の実Chrome/native倍率系列、全10source、全色/全装飾、実機、P05性能、人間採用の成功は未確認。新しい実装・配信の合格を主張しない。

先行33 screen FAIL原本の確認後SHA256は `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` で、保存時の値と一致する。先行source/prototypeのPASSと旧FAILを書き換えていない。

## 確認前後SHA256

試作12 PNG、診断6 PNG、コード/JSON2、固定33比較4 PNG、private比較2 PNG、home比較3の計29ファイル。前後29/29同一、サイズ変更0、欠落0。前後hashは表示確認とは別の不変性記録。パスは作業ルートからの相対表記。private行は識別用であり画像配布ではない。

| ファイル | bytes | 確認前SHA256 | 全表示後SHA256 |
| --- | ---: | --- | --- |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `test-results/smooth-home-i34/revision-34/diagnostic/magic-full.png` | 545116 | `154ba94945b23cd2cbcf392ac1a0f739bf371ac4c2a027baa219041ffab9069d` | `154ba94945b23cd2cbcf392ac1a0f739bf371ac4c2a027baa219041ffab9069d` |
| `test-results/smooth-home-i34/revision-34/diagnostic/magic-neutral-light.png` | 110074 | `fa42b761b95860a2d3df315ea2224bd6de7e7c30e85a27160b919fce8bde0e64` | `fa42b761b95860a2d3df315ea2224bd6de7e7c30e85a27160b919fce8bde0e64` |
| `test-results/smooth-home-i34/revision-34/diagnostic/magic-neutral-without-ink.png` | 126430 | `d67cd57f6c4ffb4674e68daa7f6b53e37c6185cb480736a4a62ea0a21690775f` | `d67cd57f6c4ffb4674e68daa7f6b53e37c6185cb480736a4a62ea0a21690775f` |
| `test-results/smooth-home-i34/revision-34/diagnostic/princess-full.png` | 598298 | `c4f01451e94670ae2b6503381a3a949cb86fd468c50c29fa3260bd6b53ef8841` | `c4f01451e94670ae2b6503381a3a949cb86fd468c50c29fa3260bd6b53ef8841` |
| `test-results/smooth-home-i34/revision-34/diagnostic/princess-neutral-light.png` | 132434 | `94880ee2b363b67e9383b7004eb6734d948ddab8f373ffdd4e65e6febff1e4a0` | `94880ee2b363b67e9383b7004eb6734d948ddab8f373ffdd4e65e6febff1e4a0` |
| `test-results/smooth-home-i34/revision-34/diagnostic/princess-neutral-without-ink.png` | 152965 | `f0e6eda71983c43215eb8484e199f3d68ba4870e71596c43548b6680ab4d3e60` | `f0e6eda71983c43215eb8484e199f3d68ba4870e71596c43548b6680ab4d3e60` |
| `test-results/smooth-home-i34/revision-34/prototype-2/evidence.json` | 3129 | `e33294dbbc72b5ef55474e4ad4fc679b1086a052f89033b8a91bd314891427d8` | `e33294dbbc72b5ef55474e4ad4fc679b1086a052f89033b8a91bd314891427d8` |
| `test-results/smooth-home-i34/revision-34/prototype-2/magic-width0-detail.png` | 543629 | `5fcdc03aeea6172f4dea0cc9cedf75cbef9fe326c5dab4367ff08a649152fb83` | `5fcdc03aeea6172f4dea0cc9cedf75cbef9fe326c5dab4367ff08a649152fb83` |
| `test-results/smooth-home-i34/revision-34/prototype-2/magic-width0-source.png` | 1295079 | `fa2f36d0c0761092ff171d0f02613d7ffb5a837a4ad9e39240fc428a59835ddd` | `fa2f36d0c0761092ff171d0f02613d7ffb5a837a4ad9e39240fc428a59835ddd` |
| `test-results/smooth-home-i34/revision-34/prototype-2/magic-width4-detail.png` | 543054 | `b1c2ddddd03e4437c2a38fd3a7926132ecc2288bce60943c9138d41e0baa3fec` | `b1c2ddddd03e4437c2a38fd3a7926132ecc2288bce60943c9138d41e0baa3fec` |
| `test-results/smooth-home-i34/revision-34/prototype-2/magic-width4-source.png` | 1294444 | `b2eaa96191bf0147c425c0b19eff31bd7b2dba8d77dbce94d6075389d14b92dd` | `b2eaa96191bf0147c425c0b19eff31bd7b2dba8d77dbce94d6075389d14b92dd` |
| `test-results/smooth-home-i34/revision-34/prototype-2/magic-width8-detail.png` | 543674 | `31da9f5f76a3564b2f40f53ccfd54910946066cda0670c1cd0d2f3a664b68bdb` | `31da9f5f76a3564b2f40f53ccfd54910946066cda0670c1cd0d2f3a664b68bdb` |
| `test-results/smooth-home-i34/revision-34/prototype-2/magic-width8-source.png` | 1306720 | `98d78bec81e2dc9f0107879ff90c8b958b11a7ca6769bffabf0eda4da16075f9` | `98d78bec81e2dc9f0107879ff90c8b958b11a7ca6769bffabf0eda4da16075f9` |
| `test-results/smooth-home-i34/revision-34/prototype-2/princess-width0-detail.png` | 596854 | `499dd3a1287b18e723ed3c8754c67c622ec3980112b2aeddb09b3867a5e8c52e` | `499dd3a1287b18e723ed3c8754c67c622ec3980112b2aeddb09b3867a5e8c52e` |
| `test-results/smooth-home-i34/revision-34/prototype-2/princess-width0-source.png` | 1177540 | `a128dbab242df9273419ae2254398695e8d824a938825b42608bf527aed47ab2` | `a128dbab242df9273419ae2254398695e8d824a938825b42608bf527aed47ab2` |
| `test-results/smooth-home-i34/revision-34/prototype-2/princess-width4-detail.png` | 596845 | `be4137693b10a4d063163792d2c205d3889c44b925adaaba07949f5f92114d67` | `be4137693b10a4d063163792d2c205d3889c44b925adaaba07949f5f92114d67` |
| `test-results/smooth-home-i34/revision-34/prototype-2/princess-width4-source.png` | 1181734 | `d4d90b638cf1b2da0e2a5463ec70b44e3137516fdf59de8d669e6576b66f6ae3` | `d4d90b638cf1b2da0e2a5463ec70b44e3137516fdf59de8d669e6576b66f6ae3` |
| `test-results/smooth-home-i34/revision-34/prototype-2/princess-width8-detail.png` | 595213 | `ababb24489b11bfe44daaa6ed370fc04f7debe9f38e544b0e340d4039c03701d` | `ababb24489b11bfe44daaa6ed370fc04f7debe9f38e544b0e340d4039c03701d` |
| `test-results/smooth-home-i34/revision-34/prototype-2/princess-width8-source.png` | 1186964 | `810ca5732ddb2eb42aa9a649e8614a947f033e18dd51624741cd5c8fc88a2be4` | `810ca5732ddb2eb42aa9a649e8614a947f033e18dd51624741cd5c8fc88a2be4` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `test-results/smooth-home-i34/revision-33/after/magic-source.png` | 1301925 | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` | `beea5597c70d56ec769fca14854238692bd2274252eed0017bfcbc57368fff61` |
| `test-results/smooth-home-i34/revision-33/after/princess-source.png` | 1187093 | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` | `0dd700a7f327cd1da5d008c88ea844ac24099565b2d4a49be8a558601a24192d` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/magic/actual-ui-export.png` | 2463263 | `47bab72f1c9a321346a2777b764d9a26dd82e96d789eb73a7d896fa0bafadc22` | `47bab72f1c9a321346a2777b764d9a26dd82e96d789eb73a7d896fa0bafadc22` |
| `test-results/smooth-home-i34/revision-33/smooth-desktop/princess/actual-ui-export.png` | 2164098 | `b209d3f182111213db01f549ac9023520aac1b81fc51be47f4cf6f2d09783c3a` | `b209d3f182111213db01f549ac9023520aac1b81fc51be47f4cf6f2d09783c3a` |
| `test-results/smooth-home-i34/revision-34/prototype.mjs` | 3850 | `5ea050a37a63b183b21aa925fefd99dc897ce2b84d39a54bff2a78e47cbb8aa0` | `5ea050a37a63b183b21aa925fefd99dc897ce2b84d39a54bff2a78e47cbb8aa0` |

