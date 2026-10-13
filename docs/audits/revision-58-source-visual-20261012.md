# I34 候補58：全10 source/art・部分/消去・未着色眼 独立目視原本

判定：**FAIL（今回提供された58 source/art・未着色眼の範囲）**。全塗り10テーマのsource/fit、実engine直接2倍7局所、部分塗り/消去6枚、親だけsmoothで瞳未着色の3テーマ×3サイズ9枚を実表示した。55の車の窓/ボンネット欠けと長い外側色帯は58では再現しない。一方、未着色の姫の眼には上瞼の肌側まで白い帯が残り、魔法・恐竜の眼には下周まで並走する二重輪郭が残る。これらを最終品質の不足として保持する。

全塗りの眼の改善や技術検査成功で未着色眼を合格にしていない。55 FAIL、56限定PASS、33 screen FAILなどの旧原本は変更していない。58の実画面/4倍/DPR、別候補59、全色/全操作、実機、P05性能、人間採用の合格を本報告から主張しない。

## 固定対象・時刻・手順

- 作業ルート：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。担当は単独、再委任なし、主モデル/effort変更なし。書込みは本新規報告だけ。
- 開始：2026-10-12 23:09:31 JST。画像/主要資料79ファイルの確認前hash：`2026-10-12T23:10:44.3167118+09:00`。capture手順2ファイルは読取前の`2026-10-12T23:11:31.6845043+09:00`、旧33原本1ファイルは読取前の`2026-10-12T23:24:15.5723600+09:00`に追加固定した。
- 全表示・参照読取後のhash：`2026-10-12T23:26:02.5356312+09:00`。計82ファイルのSHA256/bytesは前後一致、欠落/変化0。本報告作成前の存在確認はfalse。
- `identity-before.json`の記録値を読取確認：build `eeecf03fa8e323ccc446ad722dc46e056e7d7ded24390554a3ba834c42c14926`、source `a8c6d862ee9fad079779278716030715a084106f224178d69696803006bf33a0`。これは58証拠の識別であり、別候補作業中の現在runtimeを同一と宣言するものではない。
- extra-evidenceの23PNG、eyes-native-evidenceの9PNG、after/evidenceのsmooth10PNGを実bytes/SHAと照合し、42/42一致した。comparisonのgeometry10件、legacy-comparisonの40件のunchanged記録も読んだが、美術PASSの根拠にはしない。
- 全体sourceは縮小750px以下、fitは320×400のまま表示。主要顔/輪郭は1600×2000 sourceから拡大せず原寸crop。直接2倍はengine3200×4000由来の提供PNGを拡大せず表示した。1600 cropのNEAREST 2/3倍は位置確認用で、実engine2/3倍描画ではない。
- private登録原画は表示による分析比較だけに使用。新規複写、配信、報告埋込なし。メモリ内crop/縮小以外の画像加工/保存を行っていない。

## 必須残件

座標は別記しない限りworld 1600×2000。観測と原因推測を分ける。

### R58-1：未着色の姫の眼の外白帯 — FAIL

`eyes-native/princess-parent-only-1600.png`原寸と`princess-parent-only-direct2.png`で、黒い上瞼の上・左外側に肌と分離した白い帯が見える。眼の中の未着色虹彩/白目の白とは別に、上瞼より肌側へ白い面が回り込み、眼だけ白い貼付片のように見える。320fitでもこの白い縁のまとまりを認識できる。

- 左眼の該当外帯包含範囲：`x618–694,y522–575`。原寸確認cropは`[605,515]–[720,615]`。
- 右眼の該当上/左外帯包含範囲：`x754–822,y557–608`。原寸確認cropは`[740,550]–[850,645]`。
- 黒い瞼/虹彩線から離れた白帯内部の代表点を以下に記録した。RGBは1600現物の直接読取。濃黒はmaxRGB<20とした最寄り画素であり、線画の意味分類や実装原因の証明ではない。

| world点 | RGB | 最寄り濃黒点 | 距離world px |
| --- | --- | --- | ---: |
| `(650,525)` | `255,255,255` | `(652,528)` | 3.61 |
| `(620,558)` | `255,255,255` | `(623,558)` | 3 |
| `(788,561)` | `255,255,255` | `(791,568)` | 7.62 |
| `(759,587)` | `255,255,255` | `(765,591)` | 7.21 |

3〜8px程度離れた純白の帯内部を含み、輪郭の単なる1pxアンチエイリアスだけとは判断しない。特に右眼の`(788,561)`と`(759,587)`は黒線から7px以上離れている。

**最小不足/修正目標：** 未着色眼の白を実際の閉輪郭内へ収め、黒い上瞼の肌側は親の肌につなぐ。虹彩内の塗りしろ・白い反射ガイドは保ってよい。完成眼の大きな白下地と初期線画の範囲が一致していない可能性はあるが、本監査は実装箇所を断定していない。修正後は上記代表点と全体/原寸/直接2倍で外帯、眼内白、まつげ根元を別々に確認する。

### R58-2：未着色の魔法・恐竜の二重眼縁 — FAIL

魔法・恐竜の未着色眼は、上側だけの瞼線にとどまらず、眼外周と内周の黒線が下側まで細い白い溝を挟んで並走する。原寸と直接2倍の双方で確認した。虹彩の輪郭とは別の外周重複で、眼の縁が重ねた輪のように読める。姫の広い外白帯と同じ現象としてまとめていない。

| 現物 | 該当眼の包含範囲 | 下周の代表範囲 |
| --- | --- | --- |
| `eyes-native/magic-parent-only-{1600,direct2}.png` 左 | `x688–749,y587–656` | `x692–738,y642–655` |
| 同 右 | `x831–893,y623–693` | `x835–880,y678–692` |
| `eyes-native/dinosaurs-parent-only-{1600,direct2}.png` 左 | `x479–578,y352–471` | `x483–570,y454–470` |
| 同 右 | `x649–805,y396–579` | `x650–789,y557–578` |

**最小不足/修正目標：** 眼外周の主線を一つに読み取れる状態にし、瞼の補助線を残すなら位置と終端を意図した範囲へ収める。眼の形を参照と同形にする要求ではない。どの旧輪郭/新描画が二重線を生むかは現物だけでは断定しない。320fitでは線が小さくまとまるが、原寸と提供2倍での不足を解消しない。

## 全10テーマの仕上げと旧残件

実home島10・home-targetとprivate登録10を比較した。形状・色・構図の複製を条件とせず、材質、陰影、表情、肌と眼のつながり、輪郭の連続を評価した。全塗りの提供画像内には55の大きな退行や37の平板な髪面の再発を認めない。これは未着色状態R58-1/2を含む全体PASSではない。

| テーマ | 58現物による所見 |
| --- | --- |
| princess | 布の折れと髪の光が続き、全塗り眼の虹彩/白目/接触影を読める。耳`x522–546,y519–526`と右頬`x814–818,y674–678`の旧短い白片は原寸/提供直接2倍で再現しない。長い顎横の明線や平坦な髪面も再現しない。まつげ根元`x828–842,y580–611`は接続し、独立した不要片を認めない。未着色眼はR58-1。 |
| magic | 帽子/布/金属/髪の材質を読み分けられる。顎`x737–823,y777–790`と周囲原寸で旧の点/縞・長い白筋を認めない。提供直接2倍の顔にも一定幅の淡い二重上弧を認めない。未着色眼はR58-2。 |
| space | 原寸顔の眼と肌の接続、口内の連続、顎を確認。旧B02の点/縞を認めない。スーツ/窓/炎/惑星に材質差があり、広い欠落や新しい継ぎ目を認めない。今回の顔の直接2倍は未提供。 |
| animals | 毛流れ、木、葉の立体感と表情を保つ。犬口の旧白抜け/分断なし。犬口の均一な縁は残るが、口内の連続と笑顔を壊す欠落ではなく、旧観察を解消済みにも新ブロッカーにもしていない。 |
| ocean | イルカ/魚/亀の口を原寸確認し、B04/B05/B08の白抜けを認めない。水面反射、甲羅、珊瑚、貝の材質差を保つ。亀の均一な口縁は観察として残る。 |
| dinosaurs | 皮膚/斑点/爪/岩/卵の光が続き、歯と舌の広い欠落を認めない。鼻孔と口奥の平坦さは残り、単独で新ブロッカーとはしない。未着色眼はR58-2。 |
| construction | 原寸前窓下辺`x684–1086,y844–1129`は連続する曲線として読める。旧の細かい階段の連続は今回の1×では認めない。ガラス/金属/ゴムの材質差を保つ。直接2倍・4倍による合否は未確認。 |
| robots | 首上下`x700–970,y818–865`は原寸/提供直接2倍で長い水平段を繰り返さず、円筒の光が続く。濃色の首帯を孤立した暗線と誤判定していない。部分塗り/消去は下記の範囲で確認。 |
| vehicles | 右窓のガラス反射と右ボンネットの赤い面が復旧。タイヤ上辺`x416–512,y1008–1043`を原寸/提供直接2倍で確認し、旧の荒い波状角を再現しない。`x950–1004,y1100–1106`と`x1210–1245,y1180–1192`の孤立暗線も認めない。 |
| flowers | 花弁/葉/茎/蝶/包装/リボンの材質を読み分けられる。接点`x610–1040,y875–1242`を原寸/提供直接2倍で確認し、白い縫目や外側へ出た色帯を認めない。茎下端の丸い緑端`x807–839,y1130–1149`は残り、包装上へ少し出る形を解消したとは主張しない。形の違いだけではブロッカーにしない。 |

B01〜B08のうち全塗りの旧の白抜け/点/縞/二重上帯は、上記の現物範囲で再現しない。ウサギ内耳の暗いL形`x1253–1290,y1221–1322`、ウサギ/犬/亀の平坦な口縁、恐竜の平坦な鼻孔/口奥は残る。表情や材質の読みを失わせる広い欠損/漏れとは認めず、これら単独の分類は変えない。未確認の高倍率まで解消扱いにしない。

33 S01/S02のworld座標は旧screen原本から再読した。58の姫/魔法、窓、首、車、花を上記の原寸/提供直接2倍で再表示し、旧の大きな階段・帯は今回の範囲で認めない。しかし33で問題が明瞭だった実Chrome4倍/DPR/実UI PNGを本担当は58でまだ表示しておらず、33 screen FAILを撤回しない。

## 55 FAIL・56限定PASSを58で再判定

旧55/56画像8枚も現在のbytes/SHAを固定して開いた。55窓/ボンネット、55部分漏れ、56復旧と58を現物比較した。

| 項目 | 58での判定と限界 |
| --- | --- |
| R55-2 窓`x820–1140,y575–810`/ボンネット`x1030–1298,y806–1076` | 改善を確認。55の赤い平板な窓と大きな白欠けは58全塗りsource/fit、原寸局所、提供hood直接2倍内で再現しない。全塗りsourceのSHAが56fullと一致することも確認したが、現物を表示した上での判断。 |
| R55-1 r19青、左外側`x364–384,y1150–1290` | 58の原寸と分析用拡大で、55の黒線左側の長い青帯を認めない。代表位置`y1180,x367–371`も確認した。56で残ると記録した端の単画素を、58で輪郭外0と保証するものではない。 |
| R55-1 r10赤、左外側`x255–315,y795–1105` | 58は赤の部分状態で、55の黒線左側の長い赤帯を認めない。56のr10-onlyは青であり同色の比較ではないことを分ける。r10の長い前下辺も原寸で表示し、隣接白面への連続色帯を認めない。 |
| r19下部/接続端、r10前下辺 | 当該白面は未着色の隣接部として読め、全塗りの欠落と取り違えていない。連続した外側色の縁取りや白い分離帯を今回の1600局所で認めない。タイヤ上の未塗り細部や黒い初期線は残る。 |
| robots-r19-only / erased | 首だけ青と、首を白い初期線へ戻す状態を原寸で確認。隣接白面へ長い青帯を認めず、消去後の閉輪郭の欠落を認めない。 |
| vehicles-r19/r10-erased | 白い対象面と残る黒線、隣接全塗り面を確認。55の窓/ボンネット欠損は再現しない。提供6部分/消去に線画の広い欠落を認めない。 |

58の6部分/消去は1600×2000画像で、これらの実engine直接2倍は今回未提供。分析用2倍cropや56の実2倍から、58部分/消去の実2倍合格へ拡張しない。56限定PASSは56の固定証拠だけの原本として保持する。

## 実表示したファイルと範囲

計71画像ファイルを開いた（58対象42、home/private等21、旧比較8）。表示操作は109件。以下の相対パスは上記作業ルート基準であり、表中の全テーマを実表示した。

- `revision-58/after/{princess,magic,vehicles,robots,flowers,construction,space,animals,ocean,dinosaurs}-source.png`全10：1600×2000全体を最大750pxで表示。
- 同10の`-smooth.png`全10：320×400のfitを拡大せず表示。
- homeの同10`apps/web/public/images/islands/{theme}-v1.webp`を全体最大600px、privateの同10`content/smooth-finish-i34/derived/{theme}-registered.png`を全体最大650px、`content/smooth-finish-i33/references/home-target.png`を最大1000pxで表示。

### 58 source原寸局所

| sourceテーマ/状態 | crop範囲 [left,top]–[right,bottom]（右/下は除外） |
| --- | --- |
| princess 全塗り | `[490,430]–[920,860]`、`[510,510]–[550,540]`、`[805,650]–[850,720]`、ウサギ`[970,1190]–[1335,1510]` |
| magic 全塗り | `[550,420]–[910,790]`、顎`[730,770]–[835,805]` |
| space 全塗り | `[830,740]–[1250,1130]` |
| animals 全塗り | `[280,890]–[1250,1410]` |
| ocean 全塗り | イルカ`[960,535]–[1150,735]`、魚`[475,1135]–[645,1335]`、亀`[645,870]–[920,1110]` |
| dinosaurs 全塗り | `[260,220]–[990,900]` |
| construction 全塗り | `[670,800]–[1110,1160]` |
| robots 全塗り | `[660,790]–[1040,890]` |
| vehicles 全塗り | `[760,540]–[1310,1120]`、`[390,990]–[540,1080]`、`[920,1080]–[1030,1135]`、`[1180,1160]–[1270,1210]` |
| flowers 全塗り | `[580,850]–[1050,1270]` |

### 58 extraの全13枚

下記7 direct2は実engine3200×4000由来の切出しをファイル原寸で全表示。sourceの拡大補間ではない。

| `extra/`ファイル | 実寸 | world包含crop [left,top]–[right,bottom] |
| --- | --- | --- |
| `robots-neck-direct2.png` | 600×180 | `[690,805]–[990,895]` |
| `vehicles-wheel-direct2.png` | 300×180 | `[390,990]–[540,1080]` |
| `vehicles-hood-direct2.png` | 600×280 | `[920,1060]–[1220,1200]` |
| `vehicles-bumper-direct2.png` | 600×180 | `[1180,1160]–[1480,1250]` |
| `princess-face-direct2.png` | 860×860 | `[490,430]–[920,860]` |
| `magic-face-direct2.png` | 720×740 | `[550,420]–[910,790]` |
| `flowers-stems-direct2.png` | 860×800 | `[600,870]–[1030,1270]` |

残る6枚は`extra/{vehicles-r19,vehicles-r10,robots-r19}-{only,erased}.png`を各全体最大650pxで表示した。原寸局所はvehicles-r19の両状態`[340,970]–[690,1500]`と接続端`[460,1430]–[590,1500]`、vehicles-r10の両状態`[250,790]–[410,1220]`と前下辺`[330,1030]–[1470,1240]`、robots-r19の両状態`[650,430]–[1100,860]`。r19-only`[350,1140]–[410,1290]`とr10-only`[250,795]–[315,1105]`は1600 cropのNEAREST2倍も表示した。

### 58未着色眼9枚

`eyes-native/{princess,magic,dinosaurs}-parent-only-{320,1600,direct2}.png`全9。3つの塗り状態ではなく、各テーマで同じ「親グループだけ#F2D7BD smooth、瞳は未着色」を3サイズで取得した記録である。320は原寸全体、1600は全体最大650〜750px、direct2は原寸全体を表示した。

| テーマ | 1600原寸局所 | direct2実寸とworldcrop |
| --- | --- | --- |
| princess | `[590,495]–[860,650]`、左右眼`[605,515]–[720,615]`/`[740,550]–[850,645]`。位置確認用NEAREST2/3倍も表示。 | 860×860、`[490,430]–[920,860]` |
| magic | `[670,570]–[915,710]` | 720×740、`[550,420]–[910,790]` |
| dinosaurs | `[470,340]–[810,580]` | 1460×1360、`[260,220]–[990,900]` |

eyes-native-evidenceのworld配列は[left,top,width,height]なので、表ではright/bottomへ変換した。元3200×4000 cropのleft/top/width/heightと一致する。手順コードは取得範囲と描画条件の読取確認だけに用い、実行していない。

### 旧比較画像8枚

- 55 `after/vehicles-source.png`の`[760,540]–[1310,1120]`、`extra/vehicles-r19-only.png`の`[350,1140]–[410,1290]`、`extra/vehicles-r10-only.png`の`[250,795]–[315,1105]`を表示。部分の局所は分析用NEAREST2倍。
- 56 `vehicles-guard-fill-full.png`の`[760,540]–[1310,1120]`、`vehicles-guard-fill-r19-only.png`の`[350,1140]–[410,1290]`、`vehicles-guard-fill-r10-only.png`の`[250,795]–[315,1105]`を表示。部分の局所は分析用NEAREST2倍。
- 56 `vehicles-guard-fill-{r19-only,r10-only}-direct2.png`を640×1200/320×840の原寸全体で表示。これらは56の実2倍で、58の部分状態の実2倍ではない。

## 技術結果・別ゲート

親からChrome25/25、native90状態/眼100、Unit456の完了とidentity一致が伝達された。本担当はテストや性能測定を行わず、これらの生結果を本監査で独立再判定していない。今回のFAILは表示した眼の美術不足に基づき、数値検査成功で覆さない。

親が保存済みthumbnailの旧キャッシュ不足と次候補59の修正を伝えたが、58画面段階は保留。本報告で未表示のChrome全体、4倍/DPR系列、保存/gallery/exportの現在版をPASSにしない。全90画像の目視、全色/全装飾、全操作/旧作品、実機、P05性能、人間採用は別ゲート。P05 STOPを維持し、外部通信、画像生成、有料API、公開を行っていない。

## 確認前後SHA256 / bytes

82ファイル：58画像42、home/private/home-target21、旧比較画像8、JSON6、取得手順2、旧原本3。全て前後SHA256・bytes同一。private行は識別記録だけで、画像を本報告へ埋め込んでいない。時刻は冒頭参照。

| ファイル | bytes前 | bytes後 | 確認前SHA256 | 確認後SHA256 |
| --- | ---: | ---: | --- | --- |
| `test-results/smooth-home-i34/revision-58/after/princess-source.png` | 1065490 | 1065490 | `75220106c483a82e47564c385f4be21c0aafdac88380f4de2604fea3a41cbb2b` | `75220106c483a82e47564c385f4be21c0aafdac88380f4de2604fea3a41cbb2b` |
| `test-results/smooth-home-i34/revision-58/after/princess-smooth.png` | 92049 | 92049 | `d14ce24235de99492e00b45d2c452ad11572418bb414346eb5fa8641e02b1a2d` | `d14ce24235de99492e00b45d2c452ad11572418bb414346eb5fa8641e02b1a2d` |
| `apps/web/public/images/islands/princess-v1.webp` | 126774 | 126774 | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` | `681f0748c168d4fef25c5a9911e953cc87dc3beaae9e736159f64ee2fad51990` |
| `content/smooth-finish-i34/derived/princess-registered.png` | 3121113 | 3121113 | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` | `764032ffed35237717e7a28375b089d784838e6dd33b0830476699de6b22cd94` |
| `test-results/smooth-home-i34/revision-58/after/magic-source.png` | 1062044 | 1062044 | `92c3cd0234ec1d500b90f38daf950c53f8cc8b128d896dcb0529669d07d71205` | `92c3cd0234ec1d500b90f38daf950c53f8cc8b128d896dcb0529669d07d71205` |
| `test-results/smooth-home-i34/revision-58/after/magic-smooth.png` | 93727 | 93727 | `b97255221d232f81e8684e6af61562e560d3d4ff2b217aef5f04bb896a6a2f7c` | `b97255221d232f81e8684e6af61562e560d3d4ff2b217aef5f04bb896a6a2f7c` |
| `apps/web/public/images/islands/magic-v1.webp` | 131490 | 131490 | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` | `d60b49630bfe5b187975ddb3dcc64727cf8a21d6e9a468d805effac206d4b654` |
| `content/smooth-finish-i34/derived/magic-registered.png` | 3662048 | 3662048 | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` | `18cf898404140b61f2cd3c7fdb88c1d81815353fc8e220174054bdb6efb65897` |
| `test-results/smooth-home-i34/revision-58/after/animals-source.png` | 1307762 | 1307762 | `75fed69e507ea6115d486abfb8f8ba0e53fc51bf270e78af4fd10d83ed7e9b63` | `75fed69e507ea6115d486abfb8f8ba0e53fc51bf270e78af4fd10d83ed7e9b63` |
| `test-results/smooth-home-i34/revision-58/after/animals-smooth.png` | 111941 | 111941 | `ea2aaf98cfb69866c2891300863f678cb05b2eb9dcf928878c8fa22dc75aa6d7` | `ea2aaf98cfb69866c2891300863f678cb05b2eb9dcf928878c8fa22dc75aa6d7` |
| `apps/web/public/images/islands/animals-v1.webp` | 116844 | 116844 | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` | `f9dcd3f4ad99976701a4b715c09442dcd05ad314b4b1302399e2455a8808471e` |
| `content/smooth-finish-i34/derived/animals-registered.png` | 4086290 | 4086290 | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` | `07b55efe24a4b65b9742cf697444e49ed1c387b83a34363ce432f307709a8628` |
| `test-results/smooth-home-i34/revision-58/after/ocean-source.png` | 1047611 | 1047611 | `0d7160767e64be0be7216c9fdde014dc39f3f32e2c05a0fc2009f203a354c33a` | `0d7160767e64be0be7216c9fdde014dc39f3f32e2c05a0fc2009f203a354c33a` |
| `test-results/smooth-home-i34/revision-58/after/ocean-smooth.png` | 91283 | 91283 | `171286902f5f994e77cce6dcfead703c824198b7b6e119e65c187ecf33cb3710` | `171286902f5f994e77cce6dcfead703c824198b7b6e119e65c187ecf33cb3710` |
| `apps/web/public/images/islands/ocean-v1.webp` | 117204 | 117204 | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` | `484ee81b146d0110a6989622c4206d29f4060b85cf0d9047b32b4a67df53c822` |
| `content/smooth-finish-i34/derived/ocean-registered.png` | 3201467 | 3201467 | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` | `4647ff3fad955af5de5a405470d4737b04314be93817051f85f1de68972680d5` |
| `test-results/smooth-home-i34/revision-58/after/dinosaurs-source.png` | 912909 | 912909 | `9789bc9f83b866a7bc339c3e649efbfc5d6ca13f69d7fd94ea11debed3a8316a` | `9789bc9f83b866a7bc339c3e649efbfc5d6ca13f69d7fd94ea11debed3a8316a` |
| `test-results/smooth-home-i34/revision-58/after/dinosaurs-smooth.png` | 77894 | 77894 | `5a416774727172b42ddfe2512d32e4faf6b07b34cf107142ff849650c3905be3` | `5a416774727172b42ddfe2512d32e4faf6b07b34cf107142ff849650c3905be3` |
| `apps/web/public/images/islands/dinosaurs-v1.webp` | 112290 | 112290 | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` | `2a83cdaac4a5232457977afc254cf4ad4f0f70576b4376161002673fa0d7be26` |
| `content/smooth-finish-i34/derived/dinosaurs-registered.png` | 3137029 | 3137029 | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` | `837cef4f9c691217db8547146da2bf6a45a883c7146d6d92523b0cebbaa93745` |
| `test-results/smooth-home-i34/revision-58/after/construction-source.png` | 718990 | 718990 | `ca7523f33d8a0ed995ccbb5b5b901a086bd5f5dc5e2517de1c3308dd5f129f29` | `ca7523f33d8a0ed995ccbb5b5b901a086bd5f5dc5e2517de1c3308dd5f129f29` |
| `test-results/smooth-home-i34/revision-58/after/construction-smooth.png` | 76522 | 76522 | `f396438c456b2ead79d758e6d0dd56d4e113a4b7c17e22b85ed5729278695508` | `f396438c456b2ead79d758e6d0dd56d4e113a4b7c17e22b85ed5729278695508` |
| `apps/web/public/images/islands/construction-v1.webp` | 120460 | 120460 | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` | `52a1e10069a694d35646838e3a5946b796179ea107fbd819fa843a655c65906f` |
| `content/smooth-finish-i34/derived/construction-registered.png` | 2921595 | 2921595 | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` | `e43ee81394fcad718d778bc82965aebd704174e0d1c2a7edac5fcde29da5babd` |
| `test-results/smooth-home-i34/revision-58/after/robots-source.png` | 601357 | 601357 | `c7914a0394ebad5ee1d7590afa3629c856df82272534e08e1c6daf63362b1d31` | `c7914a0394ebad5ee1d7590afa3629c856df82272534e08e1c6daf63362b1d31` |
| `test-results/smooth-home-i34/revision-58/after/robots-smooth.png` | 62729 | 62729 | `7dd0c6b3c8a365d839fd12aafbcb29cddb90a472555ee171f78f1b82f811b842` | `7dd0c6b3c8a365d839fd12aafbcb29cddb90a472555ee171f78f1b82f811b842` |
| `apps/web/public/images/islands/robots-v1.webp` | 104158 | 104158 | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` | `f152be119046b9393d20e2279c3d266e1dadc42db3865b69543f313cab5ee6ef` |
| `content/smooth-finish-i34/derived/robots-registered.png` | 2654867 | 2654867 | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` | `599740dac4e078aac506d97e761f9ea76eee9c9ad1da56b1ce9bec747ad56c28` |
| `test-results/smooth-home-i34/revision-58/after/space-source.png` | 732732 | 732732 | `7cd3fccfdd196fa0c271c6aadd62c77bbd4186ec9b3d80758ac87b3861efb35f` | `7cd3fccfdd196fa0c271c6aadd62c77bbd4186ec9b3d80758ac87b3861efb35f` |
| `test-results/smooth-home-i34/revision-58/after/space-smooth.png` | 76888 | 76888 | `e39569ad47613465d5510d94cd35b3bbaaf860ee7bf4434c45e5b66b27d1c751` | `e39569ad47613465d5510d94cd35b3bbaaf860ee7bf4434c45e5b66b27d1c751` |
| `apps/web/public/images/islands/space-v1.webp` | 101528 | 101528 | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` | `8a301e2d0b5620f69599c89224371cae21ef71755dbb2bd7367d3f0b47cbf100` |
| `content/smooth-finish-i34/derived/space-registered.png` | 2917940 | 2917940 | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` | `6ec45f5a7cf1ed66e81a36c0029e72e01c0c94d2c9ad639c72dc7717abdc3664` |
| `test-results/smooth-home-i34/revision-58/after/vehicles-source.png` | 508721 | 508721 | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` |
| `test-results/smooth-home-i34/revision-58/after/vehicles-smooth.png` | 55020 | 55020 | `a1d049d21d493780621ac7118f4a882e27b6bb7a30d2464818205e7171bdb06e` | `a1d049d21d493780621ac7118f4a882e27b6bb7a30d2464818205e7171bdb06e` |
| `apps/web/public/images/islands/vehicles-v1.webp` | 100210 | 100210 | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` |
| `content/smooth-finish-i34/derived/vehicles-registered.png` | 2422677 | 2422677 | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| `test-results/smooth-home-i34/revision-58/after/flowers-source.png` | 925558 | 925558 | `182fd8812d382b8cbb3f295a553ddd6fe27ab6d1557f5713d5cc94cbb0d7f693` | `182fd8812d382b8cbb3f295a553ddd6fe27ab6d1557f5713d5cc94cbb0d7f693` |
| `test-results/smooth-home-i34/revision-58/after/flowers-smooth.png` | 85698 | 85698 | `60ebbfdac30888b421f8083e7b6b1f3ef8d3ec4dffe9587dc39b2f41b8b9e9e4` | `60ebbfdac30888b421f8083e7b6b1f3ef8d3ec4dffe9587dc39b2f41b8b9e9e4` |
| `apps/web/public/images/islands/flowers-v1.webp` | 115326 | 115326 | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` | `003af230bf4230aec4ce431f2d4e4fb6f604aebad2dc702bcfe9d048cb1a2494` |
| `content/smooth-finish-i34/derived/flowers-registered.png` | 3312036 | 3312036 | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` | `cdcae77436644beaca113611dbe47760b0dd7fd4b504f6f6e7c41026c6462f0f` |
| `test-results/smooth-home-i34/revision-58/extra/flowers-stems-direct2.png` | 304297 | 304297 | `ebe394bd96e6a03c39bc26f0a775362d63d9c8e8c4e39daff9e292ac69dce88d` | `ebe394bd96e6a03c39bc26f0a775362d63d9c8e8c4e39daff9e292ac69dce88d` |
| `test-results/smooth-home-i34/revision-58/extra/magic-face-direct2.png` | 452859 | 452859 | `a030d816de059cabed1c7fbf6fbb606e5892ab122edf624548c9d87c814d2757` | `a030d816de059cabed1c7fbf6fbb606e5892ab122edf624548c9d87c814d2757` |
| `test-results/smooth-home-i34/revision-58/extra/princess-face-direct2.png` | 616521 | 616521 | `5f5c8b4ab28389d5a749fdb7340a149cb483e3f73b2f21dd3b7c9555178cef5f` | `5f5c8b4ab28389d5a749fdb7340a149cb483e3f73b2f21dd3b7c9555178cef5f` |
| `test-results/smooth-home-i34/revision-58/extra/robots-neck-direct2.png` | 32137 | 32137 | `42c6f49b12bb007bc7fdfc91970f83b91d51caadc195e58eb11020452e01277d` | `42c6f49b12bb007bc7fdfc91970f83b91d51caadc195e58eb11020452e01277d` |
| `test-results/smooth-home-i34/revision-58/extra/robots-r19-erased.png` | 600205 | 600205 | `a552317673313895fce8d25da479cdbda8ad6d89c8d21f1487db89758de71e04` | `a552317673313895fce8d25da479cdbda8ad6d89c8d21f1487db89758de71e04` |
| `test-results/smooth-home-i34/revision-58/extra/robots-r19-only.png` | 257266 | 257266 | `2fe188a02e7670116399eb60e9744fae3929bac8804622bdb29e90c75e1405a8` | `2fe188a02e7670116399eb60e9744fae3929bac8804622bdb29e90c75e1405a8` |
| `test-results/smooth-home-i34/revision-58/extra/vehicles-bumper-direct2.png` | 19698 | 19698 | `5ed191db96eede2b59301721b85b658d87f4dac80263495f6700672975673c21` | `5ed191db96eede2b59301721b85b658d87f4dac80263495f6700672975673c21` |
| `test-results/smooth-home-i34/revision-58/extra/vehicles-hood-direct2.png` | 24376 | 24376 | `43a8acefbfad119ab590f154b007d694c871f4633ff42cceccea186df24276fe` | `43a8acefbfad119ab590f154b007d694c871f4633ff42cceccea186df24276fe` |
| `test-results/smooth-home-i34/revision-58/extra/vehicles-r10-erased.png` | 474657 | 474657 | `322cc549df4dd4f9b3fe02c976a78ea865e9e5b320dddc36fef84e492138b0f5` | `322cc549df4dd4f9b3fe02c976a78ea865e9e5b320dddc36fef84e492138b0f5` |
| `test-results/smooth-home-i34/revision-58/extra/vehicles-r10-only.png` | 285783 | 285783 | `59fedd3f4cb3767ab242c922e5ae316ca32749fb9463f6416cd52cc097147bc3` | `59fedd3f4cb3767ab242c922e5ae316ca32749fb9463f6416cd52cc097147bc3` |
| `test-results/smooth-home-i34/revision-58/extra/vehicles-r19-erased.png` | 506253 | 506253 | `fbd57623fe8781aff379b97d5230c0e1406a2ae759db4e0eafa31d119f86e7a3` | `fbd57623fe8781aff379b97d5230c0e1406a2ae759db4e0eafa31d119f86e7a3` |
| `test-results/smooth-home-i34/revision-58/extra/vehicles-r19-only.png` | 243045 | 243045 | `8d53efaad99ace4a8ff77410b9f2e5d4a7e291a3cd0ca7699cf7f922c560e25e` | `8d53efaad99ace4a8ff77410b9f2e5d4a7e291a3cd0ca7699cf7f922c560e25e` |
| `test-results/smooth-home-i34/revision-58/extra/vehicles-wheel-direct2.png` | 27236 | 27236 | `87080fcf97341556398a1eeaedd4c103198415fdf32e2ec88b15a0214932eca6` | `87080fcf97341556398a1eeaedd4c103198415fdf32e2ec88b15a0214932eca6` |
| `test-results/smooth-home-i34/revision-58/eyes-native/dinosaurs-parent-only-1600.png` | 651960 | 651960 | `9bd94330fd9ee8ecb39e7dcc3957208ed7088e77b7fed4400fcf9ca241c055f9` | `9bd94330fd9ee8ecb39e7dcc3957208ed7088e77b7fed4400fcf9ca241c055f9` |
| `test-results/smooth-home-i34/revision-58/eyes-native/dinosaurs-parent-only-320.png` | 65196 | 65196 | `f4d3f07bdc114240a45aab42f9b8618ef4215a8967692cb66c6675801628d8f2` | `f4d3f07bdc114240a45aab42f9b8618ef4215a8967692cb66c6675801628d8f2` |
| `test-results/smooth-home-i34/revision-58/eyes-native/dinosaurs-parent-only-direct2.png` | 532187 | 532187 | `fbbbbc76815e217c53121f0b8f844081479757b82617157b173a6ec47a9928e6` | `fbbbbc76815e217c53121f0b8f844081479757b82617157b173a6ec47a9928e6` |
| `test-results/smooth-home-i34/revision-58/eyes-native/magic-parent-only-1600.png` | 386710 | 386710 | `e87854454739bb8f40811641285d1e2b94181d6d30089e0657b596e1c4ce397d` | `e87854454739bb8f40811641285d1e2b94181d6d30089e0657b596e1c4ce397d` |
| `test-results/smooth-home-i34/revision-58/eyes-native/magic-parent-only-320.png` | 50645 | 50645 | `52edf941482e10d59ae5449cb20df1ac8c6150019470d10296a3e1d9f79a8e3e` | `52edf941482e10d59ae5449cb20df1ac8c6150019470d10296a3e1d9f79a8e3e` |
| `test-results/smooth-home-i34/revision-58/eyes-native/magic-parent-only-direct2.png` | 229777 | 229777 | `e7d393f63ee0a29f1359eb4554532ca51beaf620f18bba572157dd92ac388d5d` | `e7d393f63ee0a29f1359eb4554532ca51beaf620f18bba572157dd92ac388d5d` |
| `test-results/smooth-home-i34/revision-58/eyes-native/princess-parent-only-1600.png` | 387622 | 387622 | `83a4a4a59a4afe4fc52899c7f812552309bf7a2edd5270aa2d9d7aa6dc557924` | `83a4a4a59a4afe4fc52899c7f812552309bf7a2edd5270aa2d9d7aa6dc557924` |
| `test-results/smooth-home-i34/revision-58/eyes-native/princess-parent-only-320.png` | 49118 | 49118 | `bfcf8fc74e00ec3c865d7ce096a041cf89b4b4a9fb7b5d5a050658240b81b08d` | `bfcf8fc74e00ec3c865d7ce096a041cf89b4b4a9fb7b5d5a050658240b81b08d` |
| `test-results/smooth-home-i34/revision-58/eyes-native/princess-parent-only-direct2.png` | 257332 | 257332 | `e6860e07f12a1c80f87aec11b5cf0651bbc15c66d91a44d74dc92364c68b95cc` | `e6860e07f12a1c80f87aec11b5cf0651bbc15c66d91a44d74dc92364c68b95cc` |
| `test-results/smooth-home-i34/revision-58/extra-evidence.json` | 3545 | 3545 | `7a001fc1ef0c37c330a208d96a61f24861b9b052890040891583adf41463bdb0` | `7a001fc1ef0c37c330a208d96a61f24861b9b052890040891583adf41463bdb0` |
| `test-results/smooth-home-i34/revision-58/eyes-native-evidence.json` | 6255 | 6255 | `1d5a667f502d14afafb786ba2647373bc32895e2ef19e44723c66ac42482e6d6` | `1d5a667f502d14afafb786ba2647373bc32895e2ef19e44723c66ac42482e6d6` |
| `test-results/smooth-home-i34/revision-58/after/evidence.json` | 15834 | 15834 | `975fbecf478e0ced22f44d2b25dbb30df43161fbc1382d000fdc52634a9c77b2` | `975fbecf478e0ced22f44d2b25dbb30df43161fbc1382d000fdc52634a9c77b2` |
| `test-results/smooth-home-i34/revision-58/after/comparison.json` | 4388 | 4388 | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` | `a25706f5821737b9aabb14722912099012dd70e34eddfd1f1211f11ff09cd584` |
| `test-results/smooth-home-i34/revision-58/after/legacy-comparison.json` | 7134 | 7134 | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` | `e191c1eb9263cea033631b3fedd3586fd8ed87bc3a87f669678faa4d9e652f07` |
| `test-results/smooth-home-i34/revision-58/identity-before.json` | 319583 | 319583 | `535f89b8a3504d6d21ec93881c25e4e138fa978bfe18ca0bab640ed8baee42e0` | `535f89b8a3504d6d21ec93881c25e4e138fa978bfe18ca0bab640ed8baee42e0` |
| `content/smooth-finish-i33/references/home-target.png` | 830012 | 830012 | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` | `2c623dce43ca8d2bfdce644db8c33cdbf233ad969d20fc8d0e9e934d4d2873b9` |
| `docs/audits/revision-55-source-visual-20261012.md` | 31884 | 31884 | `e850b6e71536e3feb59a6efde8eceec236401191d46bb32e5c1204160bff44a7` | `e850b6e71536e3feb59a6efde8eceec236401191d46bb32e5c1204160bff44a7` |
| `docs/audits/revision-56-vehicles-prototype-20261012.md` | 15603 | 15603 | `76bdfb640ed5e7301c4e9c09ccf874f34f494eec5d8b695157b96246e0ada028` | `76bdfb640ed5e7301c4e9c09ccf874f34f494eec5d8b695157b96246e0ada028` |
| `test-results/smooth-home-i34/revision-55/after/vehicles-source.png` | 490623 | 490623 | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r19-only.png` | 251147 | 251147 | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r10-only.png` | 312490 | 312490 | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-full.png` | 508721 | 508721 | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r19-only.png` | 246524 | 246524 | `d609bc7b9ca178a264de2c0d18106a44d2c042d63998068fc6aa99ec8d0446a3` | `d609bc7b9ca178a264de2c0d18106a44d2c042d63998068fc6aa99ec8d0446a3` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r10-only.png` | 282870 | 282870 | `a09a48fd4e787bf071efc5e4605d8a495ddb97a90edb7984b46b164eb40f7522` | `a09a48fd4e787bf071efc5e4605d8a495ddb97a90edb7984b46b164eb40f7522` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r19-only-direct2.png` | 138430 | 138430 | `0cd76e493a6e6c7361b91662b75c660dc49a9e5a9b9553f06e61bfc204d96d6b` | `0cd76e493a6e6c7361b91662b75c660dc49a9e5a9b9553f06e61bfc204d96d6b` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r10-only-direct2.png` | 46686 | 46686 | `d0b67552ede62ad533c2200b7312eaf5ed52a8a4e5c69836521563cdda6c99ca` | `d0b67552ede62ad533c2200b7312eaf5ed52a8a4e5c69836521563cdda6c99ca` |
| `test-results/smooth-home-i34/revision-58/capture-extra.mjs` | 2934 | 2934 | `510a24017c69a786bb19b797f27fb8c6c343c4a7b71003292aa89b7ffa52cbfa` | `510a24017c69a786bb19b797f27fb8c6c343c4a7b71003292aa89b7ffa52cbfa` |
| `test-results/smooth-home-i34/revision-58/capture-eyes.mjs` | 2570 | 2570 | `70f66b49416e4409c66f55cae940e5931bec5805f39f9e4730bc73a01844a90b` | `70f66b49416e4409c66f55cae940e5931bec5805f39f9e4730bc73a01844a90b` |
| `docs/audits/smooth-home-i34-revision-33-screen-visual-20261012.md` | 32873 | 32873 | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` | `efefe051c941ff898aef1b63b42897a6b649236d406eaf1702be69cbfa8b0775` |

