# I34 候補61：未着色眼3テーマ9枚 限定独立目視原本

判定：**PASS（提供された候補61の未着色眼9PNGだけ）**。姫の旧R59-1の濃茶の張出しは原寸と実直接2倍で再現せず、黒い虹彩ガイドの外側が肌へ連続する。58で記録した上瞼の肌側の白帯、魔法/恐竜の下周まで並走する二重外周も再発を認めない。白い瞳/反射ガイドは未着色の塗りしろとして読み取れ、親だけsmoothの状態に新しい孤立暗片・白い外帯・不要な線片を認めない。

これは全10 source/art、実build、実Chrome、4倍/DPR、全色/全操作、他画材、旧作品、thumbnail/cache、実機、P05性能、人間採用の合格ではない。58/59のFAIL原本や60のFAIL扱いを変更していない。今回の限定PASSは61の現物による新判断である。

## 固定範囲と時刻

- 作業ルート：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。単独、孫/再委任なし、主モデル/effort変更なし。書込みは本新規原本のみ。他者の変更、制作コード、テスト、素材、旧原本、証拠画像を編集していない。
- 段階開始：2026-10-12 23:50 JST。確認前hash/bytes：`2026-10-12T23:50:39.9409321+09:00`。全表示/読取後：`2026-10-12T23:53:17.4870004+09:00`。
- 21ファイル（61 PNG9、59比較PNG9、61 manifest1、58/59原本2）のSHA256/bytesは21/21前後一致。変化/欠落0。作成前の本報告の存在確認false。
- `revision-61/eyes-native-evidence.json`にある9PNGの実bytes/SHAを照合し9/9一致。取得条件とcropはこの固定manifestから読んだ。テスト/再描画/性能測定はしていない。
- 各テーマの親グループのみ`#F2D7BD` smooth、瞳は未着色。9枚は3テーマ×3サイズであり、9種類の塗り状態ではない。320×400、1600×2000、engine3200×4000由来の直接2倍cropを区別した。
- 親の実装説明や回帰Unit1件PASSの報告は目視合格の代用にしていない。原因となるコード/素材の独立切分けは本担当の範囲外。

## 現物による再判定

座標はworld 1600×2000。cropのright/bottomは除外端。色の形状や参照の完全複製を受入条件にしていない。

| 項目 | 61の実観測・判断 |
| --- | --- |
| R59-1 姫右眼`x797–802,y590–603` | 改善。包含crop`[790,585]–[815,615]`をsource原寸と実direct2で表示し、59の右へ膨らむ濃茶片は認めない。肌の明るい面から右側の暖かい影へ連続し、眼縁を中段だけ太く見せていた短い終端は消えている。 |
| R58-1 姫の外白帯 | 再発なし。左眼上/左外側`x618–694,y522–575`、右眼上/左外側`x754–822,y557–608`を顔原寸/直接2倍で確認。白は閉じた虹彩ガイド内に読み取れ、上瞼の肌側まで独立した白い帯は回り込まない。 |
| R58-2 魔法の二重外周 | 再発なし。左右眼を原寸/直接2倍で確認。単一閉輪郭と小さい反射ガイドとして読み取れ、下周までの重複外周を認めない。 |
| R58-2 恐竜の二重外周 | 再発なし。左右眼の縦長の単一閉輪郭と反射ガイドを原寸/直接2倍で確認。59と同じbytes/SHAの3画像でも、61指定の実ファイルを開いて判断した。 |
| 姫上瞼/まつげ/虹彩ガイド | 黒い初期線と白いガイドは連続して読める。濃茶片を消した結果の白抜けや独立した余計なまつげ片を認めない。姫の上瞼の細い補助弧を、58の全周二重線や肌側の白帯と同じ現象にしていない。 |
| 親だけsmoothの自然さ | 白い瞳は未着色の領域として扱い、着色済みの視線や虹彩の材質を要求していない。肌/皮膚の光とガイドの外側が続き、59の暗い突起のような不自然な残片を認めない。全体と原寸/2倍で判断し、単一回帰点だけでPASSにしていない。 |

R59-1の局所補助読取：59の`(799,596)=(111,64,41)`、`(799,600)=(41,12,9)`、`(801,600)=(141,102,80)`に対し、61では順に`(237,222,195)`、`(237,223,195)`、`(237,221,194)`。その左のガイド上`(797,600)=(0,0,0)`は残り、黒いガイドを丸ごと消したという観測ではない。色値は現物の直接読取であり、光素材や鼻例外などの原因を証明するものではない。

旧白帯4代表点も全て肌色である。

| world点 | 61 RGB |
| --- | --- |
| `(650,525)` | `237,206,173` |
| `(620,558)` | `237,207,179` |
| `(788,561)` | `237,216,183` |
| `(759,587)` | `243,220,192` |

今回の提供9画像内で必須残件は認めない。最小追加修正の要求なし。ただし別状態・実画面・全10の未確認をこの判断で消していない。

## 実表示したファイルと範囲

61の9枚と59比較9枚、計18画像ファイルを実表示した。表示操作27件。新規画像の保存、private完成RGBの複写/配信/報告埋込なし。

対象パス：`test-results/smooth-home-i34/revision-61/eyes-native/{princess,magic,dinosaurs}-parent-only-{320,1600,direct2}.png`全9。

| テーマ | 全体表示 | 1600原寸局所 | 実direct2の寸法 / worldcrop |
| --- | --- | --- | --- |
| princess | 320原寸、1600最大750px、direct2原寸全体 | 顔`[590,495]–[860,650]`、旧暗片`[790,585]–[815,615]` | 860×860 / `[490,430]–[920,860]` |
| magic | 320原寸、1600最大750px、direct2原寸全体 | `[670,570]–[915,710]` | 720×740 / `[550,420]–[910,790]` |
| dinosaurs | 320原寸、1600最大750px、direct2原寸全体 | `[470,340]–[810,580]` | 1460×1360 / `[260,220]–[990,900]` |

direct2は元3200×4000から、姫pixel左980/上860/幅860/高860、魔法左1100/上840/幅720/高740、恐竜左520/上440/幅1460/高1360の切出し。manifestのworld配列は[left,top,width,height]で、上表はright/bottomへ変換した。sourceを2倍補間した画像とは扱っていない。

姫direct2の旧R59-1追加原寸局所はファイルpixel`[600,310]–[650,370]`。これはworld`[790,585]–[815,615]`に対応する。同じ1600/直接2倍局所を分析用NEAREST3倍でも表示したが、これを実Chrome3/4倍や新しいengine倍率とはしていない。

比較は`revision-59/eyes-native/`の同3テーマ×3サイズ全9。320原寸、1600最大650px、direct2原寸全体。加えて姫59の1600`[790,585]–[815,615]`、direct2pixel`[600,310]–[650,370]`を原寸で再表示し、61の同位置と比較した。58/59独立原本から白帯/二重線/暗片の該当段落を再読した。

今回、private完成RGBやhomeを新たに複写/添付していない。以前の完成眼のPASSを未着色眼へ機械的に転記せず、今回の固定9PNGを判断した。

## 別ゲート

61全10、着色眼、初期全面blank、他画材、旧作品、保存/cache、実build/Chrome、4倍/DPR、全色/全装飾/全操作、実機、P05性能、人間採用は未確認。親の実装説明、回帰Unit、以前の技術PASSから本範囲外を成功扱いにしない。60の画像/結果は本監査に混ぜていない。テスト/性能測定、外部通信、有料API、画像生成、公開、モデル変更、再委任を行っていない。P05 STOPを維持。

## 確認前後SHA256 / bytes

21/21同一。パスは冒頭の作業ルート基準。本表の旧原本はその版のFAIL原本を保持した。

| ファイル | bytes前 | bytes後 | 確認前SHA256 | 確認後SHA256 |
| --- | ---: | ---: | --- | --- |
| `test-results/smooth-home-i34/revision-61/eyes-native/dinosaurs-parent-only-1600.png` | 640100 | 640100 | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` |
| `test-results/smooth-home-i34/revision-61/eyes-native/dinosaurs-parent-only-320.png` | 63830 | 63830 | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` |
| `test-results/smooth-home-i34/revision-61/eyes-native/dinosaurs-parent-only-direct2.png` | 515213 | 515213 | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` |
| `test-results/smooth-home-i34/revision-61/eyes-native/magic-parent-only-1600.png` | 381571 | 381571 | `dea65702c335816ce0b1f186a32e12ca49543b792510168bb638a9485f5d5814` | `dea65702c335816ce0b1f186a32e12ca49543b792510168bb638a9485f5d5814` |
| `test-results/smooth-home-i34/revision-61/eyes-native/magic-parent-only-320.png` | 50304 | 50304 | `c81087f712b63910f5e1e5ed716bb0b8bad832a49b8ea0ebfc0edc94fcb9b44a` | `c81087f712b63910f5e1e5ed716bb0b8bad832a49b8ea0ebfc0edc94fcb9b44a` |
| `test-results/smooth-home-i34/revision-61/eyes-native/magic-parent-only-direct2.png` | 224671 | 224671 | `4670f721a376ed0d40bcc481850d30d3b841de0d54e9612a65e7a40ec37bbeab` | `4670f721a376ed0d40bcc481850d30d3b841de0d54e9612a65e7a40ec37bbeab` |
| `test-results/smooth-home-i34/revision-61/eyes-native/princess-parent-only-1600.png` | 387407 | 387407 | `6857e57eee22d2dbe71db6fffe1867e9f96dbf64f3b1870fee81156d5f637cde` | `6857e57eee22d2dbe71db6fffe1867e9f96dbf64f3b1870fee81156d5f637cde` |
| `test-results/smooth-home-i34/revision-61/eyes-native/princess-parent-only-320.png` | 49056 | 49056 | `ca41f96239aeb53baf9b8f3b9b9c6be43eb963ebffe90d9781463faa071e2267` | `ca41f96239aeb53baf9b8f3b9b9c6be43eb963ebffe90d9781463faa071e2267` |
| `test-results/smooth-home-i34/revision-61/eyes-native/princess-parent-only-direct2.png` | 263012 | 263012 | `8127562b40dd74c1406efcbd6ee3b98c649557a2861d4d44fa9ae46e86af48dd` | `8127562b40dd74c1406efcbd6ee3b98c649557a2861d4d44fa9ae46e86af48dd` |
| `test-results/smooth-home-i34/revision-59/eyes-native/dinosaurs-parent-only-1600.png` | 640100 | 640100 | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` |
| `test-results/smooth-home-i34/revision-59/eyes-native/dinosaurs-parent-only-320.png` | 63830 | 63830 | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` |
| `test-results/smooth-home-i34/revision-59/eyes-native/dinosaurs-parent-only-direct2.png` | 515213 | 515213 | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` |
| `test-results/smooth-home-i34/revision-59/eyes-native/magic-parent-only-1600.png` | 381533 | 381533 | `f9614042c1c23f8351ef87a493b0ae137723bb5ff58df0ba8870e51a5618ec69` | `f9614042c1c23f8351ef87a493b0ae137723bb5ff58df0ba8870e51a5618ec69` |
| `test-results/smooth-home-i34/revision-59/eyes-native/magic-parent-only-320.png` | 50316 | 50316 | `cf505de412cf35ac59c56c8ebceec79e9dba460a0bbaeb6fe7a1a6751952492f` | `cf505de412cf35ac59c56c8ebceec79e9dba460a0bbaeb6fe7a1a6751952492f` |
| `test-results/smooth-home-i34/revision-59/eyes-native/magic-parent-only-direct2.png` | 224451 | 224451 | `92ccce21d44a7a212bcdef34f18fce44fb76a7340a9e41f20fd8ff7720c0d6ec` | `92ccce21d44a7a212bcdef34f18fce44fb76a7340a9e41f20fd8ff7720c0d6ec` |
| `test-results/smooth-home-i34/revision-59/eyes-native/princess-parent-only-1600.png` | 386961 | 386961 | `07520afc07247d1efa013601df6afdcff33178bfb7265d3d275f2da53aabc173` | `07520afc07247d1efa013601df6afdcff33178bfb7265d3d275f2da53aabc173` |
| `test-results/smooth-home-i34/revision-59/eyes-native/princess-parent-only-320.png` | 49034 | 49034 | `c9c7c14359e0b9da34d843613851ab3a5e857c7dececed2421344f7aac0b2f98` | `c9c7c14359e0b9da34d843613851ab3a5e857c7dececed2421344f7aac0b2f98` |
| `test-results/smooth-home-i34/revision-59/eyes-native/princess-parent-only-direct2.png` | 260411 | 260411 | `8c59a02c6b6d95e700ac9299cd2cea02ae731e1f49954db28902df228f7b3768` | `8c59a02c6b6d95e700ac9299cd2cea02ae731e1f49954db28902df228f7b3768` |
| `test-results/smooth-home-i34/revision-61/eyes-native-evidence.json` | 6255 | 6255 | `0e90158f69d9fc43a17ae4f7cb0d720d8b436f8e36092f2819192dacf81a4d25` | `0e90158f69d9fc43a17ae4f7cb0d720d8b436f8e36092f2819192dacf81a4d25` |
| `docs/audits/revision-58-source-visual-20261012.md` | 36645 | 36645 | `2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd` | `2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd` |
| `docs/audits/revision-59-eyes-prototype-20261012.md` | 15367 | 15367 | `907163e7258a34b60158e4bcfa546a5fec88bf801bc758ebe6c63e67bf47ec95` | `907163e7258a34b60158e4bcfa546a5fec88bf801bc758ebe6c63e67bf47ec95` |

