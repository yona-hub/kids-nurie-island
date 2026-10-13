# I34 候補59：未着色眼3テーマ9枚 限定独立目視原本

判定：**FAIL（提供された未build候補59の未着色眼9PNGだけ）**。58の姫の広い外白帯と魔法/恐竜の二重外周は改善した。しかし姫の右眼の虹彩ガイド右中央〜右下に濃茶の小さい膨らみが残り、自然に続く肌/瞼の陰影としてまとまらない。原寸と実engine直接2倍の現物で確認した。58 FAILはその版の原本として保持し、本報告で自己撤回しない。

これは全10 source/art、着色眼、初期全面blank、他画材、旧作品、実Chrome、4倍/DPR、thumbnail/cache、実機、P05性能、人間採用の合否ではない。未表示の状態や技術検査から合格を足していない。

## 固定証拠・条件

- 作業ルート：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。担当は単独、孫/再委任なし、主モデル/effort変更なし。今回の追加書込みは本新規原本だけ。制作/runtime/public/素材/旧原本/画像を変更していない。
- 段階開始：2026-10-12 23:30 JST。確認前hash：`2026-10-12T23:31:04.9979846+09:00`。全表示・資料読取後：`2026-10-12T23:35:45.2962256+09:00`。
- 27ファイル（59 PNG9、58比較PNG9、home3、private登録3、59 manifest/取得手順2、58原本1）のSHA256/bytesは前後一致。変化/欠落0。本報告作成前の存在確認false。
- `revision-59/eyes-native-evidence.json`の9ファイルを実bytes/SHAと照合し9/9一致。320×400/1600×2000/engine3200×4000からの直接2倍cropという取得条件を読んだ。手順コードは読取のみで、テスト/再描画を実行していない。
- 塗り条件は各テーマの親グループだけ`#F2D7BD` smooth、瞳は未着色。9枚は3種類の塗り状態ではなく、3テーマで同じ状態を各3サイズ取得した証拠である。
- 59は未buildのruntime候補として依頼された証拠であり、58のbuild/source識別を59へ転記していない。実装説明は合格根拠にしない。

## 58残件の59現物による再判定

| 58項目 | 59での現物所見 |
| --- | --- |
| R58-1 姫の上瞼の肌側/左外側に回る広い白帯 | 改善。1600原寸と直接2倍で上瞼の外側は肌につながり、58の白い貼付片のような外帯を認めない。白い閉じた虹彩ガイドは未着色領域として保たれる。 |
| R58-2 魔法の下周まで並走する二重外周 | 改善。単一の丸い白い眼領域と反射の小ガイドへ整理され、旧の並走する外周線は原寸/直接2倍で認めない。 |
| R58-2 恐竜の下周まで並走する二重外周 | 改善。縦長の単一閉輪郭と反射ガイドを読み取れ、旧の二重外周を原寸/直接2倍で認めない。形を参照と同形にする要求はしていない。 |
| 姫まつげ/初期線画 | 上瞼とまつげ、白い閉じた虹彩ガイドは連続して読める。新しい独立まつげ片や白い短冊切れは確認しない。ただし下記R59-1の暗色は別の不足。 |

58で純白だった外帯内部の4代表点は、59の1600現物では以下の肌色になった。これは白帯消失の局所補助証拠であり、4画素だけで全眼を合格にしたものではない。

| world点 | 58 RGB | 59 RGB |
| --- | --- | --- |
| `(650,525)` | `255,255,255` | `237,206,173` |
| `(620,558)` | `255,255,255` | `237,207,179` |
| `(788,561)` | `255,255,255` | `237,218,187` |
| `(759,587)` | `255,255,255` | `243,220,192` |

## R59-1：姫右眼の右中央に残る濃茶の膨らみ — FAIL

**実観測：** `eyes-native/princess-parent-only-1600.png`の原寸顔と局所、`princess-parent-only-direct2.png`の全体と原寸局所に、虹彩ガイドの黒線右側から濃茶が小さく張り出す部分がある。上瞼の接触影から離れた中央〜右下で濃くなり、短く折れた終端を持つため、肌へ自然に続く影より暗い小片のように見える。320fitでは小さくなるが、原寸/提供直接2倍で認識できる不足を解消しない。

- 最小修正対象の包含範囲：world **`x797–802,y590–603`**。周辺確認範囲：`[790,585]–[815,615]`。
- 1600直接読取：`(799,596)=(111,64,41)`、`(799,600)=(41,12,9)`、`(801,600)=(141,102,80)`。隣の肌`(805,600)=(230,179,138)`。
- direct2の対応局所：ファイルpixel `[600,310]–[650,370]`、world `[790,585]–[815,615]`。この提供実2倍にも右へ張り出す暗色があり、1600の拡大補間だけで生じたものとは判断しない。
- 黒い初期線画そのものを消す要求ではない。黒いガイドの外へ張り出して肌から浮く濃茶の量と終端が問題。

**自然な影との切り分け：** 額/耳/頬の広い陰影や、上瞼に沿って連続する影とは位置・広がりが異なる。左右眼で同じ影の複製を求めているわけではないが、この小片は右眼の中段に局所的な濃さと張出しを作り、輪郭を途中だけ太く読む原因になる。home/登録参照の滑らかな眼縁と肌の連続という品質基準に届かない。privateの形・色の複製を条件にしていない。

**原因について未確認：** 旧原画の眼の残影、素材の色、マスク/補間、接触影のどれが作るかは断定していない。親の原因仮説やコード変更説明だけで観測を解消扱いにしない。

**最小不足/修正目標：** 当該暗色の突起を周囲の肌へ連続させ、初期黒線と白い閉輪郭を保つ。上瞼から意図的な影を残す場合も、この中段の小片へ急に濃さを集めず、自然な終端にする。再確認は同じworld局所の原寸/提供直接2倍と顔全体で行い、外白帯や二重線を復活させない。

## 実表示したファイルと範囲

計24画像ファイル、表示操作32件。59対象9枚を全て実表示し、58比較9枚、home3、private登録3も開いた。privateは分析表示だけで、新規複写/配信/報告埋込なし。crop/縮小はメモリ内だけで、派生画像ファイルを作成していない。

### 59の9枚

`test-results/smooth-home-i34/revision-59/eyes-native/{princess,magic,dinosaurs}-parent-only-{320,1600,direct2}.png`。

| テーマ | 全体表示 | 1600の原寸crop | 実direct2の実寸/対応worldcrop |
| --- | --- | --- | --- |
| princess | 320は原寸、1600は最大750px、direct2は原寸 | `[590,495]–[860,650]`、`[790,585]–[815,615]` | 860×860、`[490,430]–[920,860]` |
| magic | 320は原寸、1600は最大650px、direct2は原寸 | `[670,570]–[915,710]` | 720×740、`[550,420]–[910,790]` |
| dinosaurs | 320は原寸、1600は最大650px、direct2は原寸 | `[470,340]–[810,580]` | 1460×1360、`[260,220]–[990,900]` |

direct2は元3200×4000から、姫pixel `[980,860]`幅860高860、魔法`[1100,840]`幅720高740、恐竜`[520,440]`幅1460高1360の切出し。manifestのworldは[left,top,width,height]なので、上表ではright/bottomへ変換した。

姫direct2の追加原寸局所はファイルpixel`[575,285]–[670,390]`と`[600,310]–[650,370]`。位置確認用に1600crop`[780,575]–[825,625]`のNEAREST4倍、direct2crop`[600,310]–[650,370]`のNEAREST3倍も表示した。これらは分析用拡大であり、実Chrome4倍や追加engine倍率ではない。

### 比較15画像

- `revision-58/eyes-native/`の同3テーマ×3サイズ全9を再表示。320は原寸、1600は最大650px、direct2は原寸。
- `apps/web/public/images/islands/{princess,magic,dinosaurs}-v1.webp`各全体最大600px。
- `content/smooth-finish-i34/derived/{princess,magic,dinosaurs}-registered.png`各全体最大650px。参照の形状/配色の複製を求めず、眼と肌の連続、表情、仕上げを比較した。

本状態では瞳が未着色なので白い眼領域や白い反射ガイド自体は意図された塗りしろとして扱う。魔法/恐竜の表情が着色済みと異なることだけをFAILにしていない。全塗りや着色眼の品質は今回の9枚から確認できない。

## 別ゲート・限界

この9枚は未build候補のnative証拠。現在buildの実Chrome、thumbnail保存/再読込、gallery、export、全10テーマ、他の色や画材、初期全面blank、旧作品の維持を独立確認していない。親の変更方針を成功結果として転載しない。テスト/性能測定、外部通信、画像生成、有料API、公開、モデル変更、再委任を行っていない。P05 STOPを維持する。

## 確認前後SHA256 / bytes

27/27同一。private行は識別のための文字記録であり、画像埋込や配布ではない。パスは作業ルートからの相対表記。

| ファイル | bytes前 | bytes後 | 確認前SHA256 | 確認後SHA256 |
| --- | ---: | ---: | --- | --- |
| `test-results/smooth-home-i34/revision-59/eyes-native/dinosaurs-parent-only-1600.png` | 640100 | 640100 | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` | `8fecad1e4a588b55d9c398711de0a37be4a33e35a0e6dfb5a775ce7c0b1ad2f5` |
| `test-results/smooth-home-i34/revision-59/eyes-native/dinosaurs-parent-only-320.png` | 63830 | 63830 | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` | `59183887bb92311621d2ffd0a97c2efac95553c7ffa8f18041007da8c620f97f` |
| `test-results/smooth-home-i34/revision-59/eyes-native/dinosaurs-parent-only-direct2.png` | 515213 | 515213 | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` | `8ae3b19b913d7567b8e9e0bb06b7f4659b90e97c456995c645572717debc02d6` |
| `test-results/smooth-home-i34/revision-59/eyes-native/magic-parent-only-1600.png` | 381533 | 381533 | `f9614042c1c23f8351ef87a493b0ae137723bb5ff58df0ba8870e51a5618ec69` | `f9614042c1c23f8351ef87a493b0ae137723bb5ff58df0ba8870e51a5618ec69` |
| `test-results/smooth-home-i34/revision-59/eyes-native/magic-parent-only-320.png` | 50316 | 50316 | `cf505de412cf35ac59c56c8ebceec79e9dba460a0bbaeb6fe7a1a6751952492f` | `cf505de412cf35ac59c56c8ebceec79e9dba460a0bbaeb6fe7a1a6751952492f` |
| `test-results/smooth-home-i34/revision-59/eyes-native/magic-parent-only-direct2.png` | 224451 | 224451 | `92ccce21d44a7a212bcdef34f18fce44fb76a7340a9e41f20fd8ff7720c0d6ec` | `92ccce21d44a7a212bcdef34f18fce44fb76a7340a9e41f20fd8ff7720c0d6ec` |
| `test-results/smooth-home-i34/revision-59/eyes-native/princess-parent-only-1600.png` | 386961 | 386961 | `07520afc07247d1efa013601df6afdcff33178bfb7265d3d275f2da53aabc173` | `07520afc07247d1efa013601df6afdcff33178bfb7265d3d275f2da53aabc173` |
| `test-results/smooth-home-i34/revision-59/eyes-native/princess-parent-only-320.png` | 49034 | 49034 | `c9c7c14359e0b9da34d843613851ab3a5e857c7dececed2421344f7aac0b2f98` | `c9c7c14359e0b9da34d843613851ab3a5e857c7dececed2421344f7aac0b2f98` |
| `test-results/smooth-home-i34/revision-59/eyes-native/princess-parent-only-direct2.png` | 260411 | 260411 | `8c59a02c6b6d95e700ac9299cd2cea02ae731e1f49954db28902df228f7b3768` | `8c59a02c6b6d95e700ac9299cd2cea02ae731e1f49954db28902df228f7b3768` |
| `test-results/smooth-home-i34/revision-58/eyes-native/dinosaurs-parent-only-1600.png` | 651960 | 651960 | `9bd94330fd9ee8ecb39e7dcc3957208ed7088e77b7fed4400fcf9ca241c055f9` | `9bd94330fd9ee8ecb39e7dcc3957208ed7088e77b7fed4400fcf9ca241c055f9` |
| `test-results/smooth-home-i34/revision-58/eyes-native/dinosaurs-parent-only-320.png` | 65196 | 65196 | `f4d3f07bdc114240a45aab42f9b8618ef4215a8967692cb66c6675801628d8f2` | `f4d3f07bdc114240a45aab42f9b8618ef4215a8967692cb66c6675801628d8f2` |
| `test-results/smooth-home-i34/revision-58/eyes-native/dinosaurs-parent-only-direct2.png` | 532187 | 532187 | `fbbbbc76815e217c53121f0b8f844081479757b82617157b173a6ec47a9928e6` | `fbbbbc76815e217c53121f0b8f844081479757b82617157b173a6ec47a9928e6` |
| `test-results/smooth-home-i34/revision-58/eyes-native/magic-parent-only-1600.png` | 386710 | 386710 | `e87854454739bb8f40811641285d1e2b94181d6d30089e0657b596e1c4ce397d` | `e87854454739bb8f40811641285d1e2b94181d6d30089e0657b596e1c4ce397d` |
| `test-results/smooth-home-i34/revision-58/eyes-native/magic-parent-only-320.png` | 50645 | 50645 | `52edf941482e10d59ae5449cb20df1ac8c6150019470d10296a3e1d9f79a8e3e` | `52edf941482e10d59ae5449cb20df1ac8c6150019470d10296a3e1d9f79a8e3e` |
| `test-results/smooth-home-i34/revision-58/eyes-native/magic-parent-only-direct2.png` | 229777 | 229777 | `e7d393f63ee0a29f1359eb4554532ca51beaf620f18bba572157dd92ac388d5d` | `e7d393f63ee0a29f1359eb4554532ca51beaf620f18bba572157dd92ac388d5d` |
| `test-results/smooth-home-i34/revision-58/eyes-native/princess-parent-only-1600.png` | 387622 | 387622 | `83a4a4a59a4afe4fc52899c7f812552309bf7a2edd5270aa2d9d7aa6dc557924` | `83a4a4a59a4afe4fc52899c7f812552309bf7a2edd5270aa2d9d7aa6dc557924` |
| `test-results/smooth-home-i34/revision-58/eyes-native/princess-parent-only-320.png` | 49118 | 49118 | `bfcf8fc74e00ec3c865d7ce096a041cf89b4b4a9fb7b5d5a050658240b81b08d` | `bfcf8fc74e00ec3c865d7ce096a041cf89b4b4a9fb7b5d5a050658240b81b08d` |
| `test-results/smooth-home-i34/revision-58/eyes-native/princess-parent-only-direct2.png` | 257332 | 257332 | `e6860e07f12a1c80f87aec11b5cf0651bbc15c66d91a44d74dc92364c68b95cc` | `e6860e07f12a1c80f87aec11b5cf0651bbc15c66d91a44d74dc92364c68b95cc` |
| `test-results/smooth-home-i34/revision-59/eyes-native-evidence.json` | 6255 | 6255 | `3e6e889df90583186270594e29b717aa5c80dc9da185d1d028c6fef1cfedf874` | `3e6e889df90583186270594e29b717aa5c80dc9da185d1d028c6fef1cfedf874` |
| `test-results/smooth-home-i34/revision-59/capture-eyes.mjs` | 2570 | 2570 | `0d2b1f03e7716c4702b080ed33769284e03f58518991ac483a78058812ff0397` | `0d2b1f03e7716c4702b080ed33769284e03f58518991ac483a78058812ff0397` |
| `docs/audits/revision-58-source-visual-20261012.md` | 36645 | 36645 | `2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd` | `2206cd7ed7385ed550e41f332ff5aa5a7a1eab3545ef7600543bca1c083844cd` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `apps/web/public/images/islands/dinosaurs-v1.webp` | 112290 | 112290 | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `content/smooth-finish-i34/derived/dinosaurs-registered.png` | 3137029 | 3137029 | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |

