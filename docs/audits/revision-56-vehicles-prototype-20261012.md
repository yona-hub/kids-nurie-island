# I34 未採用56：車の白面保護・混合曲線 限定独立目視原本

判定：**PASS（提供された車の限定比較範囲）**。全塗りの右窓/ボンネットは復旧し、r19-only/r10-onlyの旧の長い外側色帯は原寸と直接2倍で認めない。提供された消去状態も線画を保つ。下部の接続端で、連続する外側色の縁取り、白い隙間、線画の欠落を認めなかった。

これは未採用56の固定画像についての判断である。他9テーマ、全10のホーム同等最終品質、4倍/DPR系列、Chrome全体、全操作/全色、P05性能、人間採用の合格ではない。別候補57や現行制作/runtime/publicへ転記しない。55 FAIL原本はその版の原本として保持した。

## 範囲・固定・表示方法

- 独立確認者：`/root/i34_finish_visual`。単独、再委任/子起動なし。主モデル/effortは継承した設定を維持。
- 作業ルート：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`。
- 開始：2026-10-12 22:40 JST。
- 原寸5PNG・比較・旧原文・guard manifestの確認前hash：2026-10-12T22:41:07.3179443+09:00。
- 追加提供された直接2倍5PNG・native manifest・取得手順の確認前hash：2026-10-12T22:48:20.3758954+09:00。
- 全表示後hash：2026-10-12T22:50:39.1086193+09:00。
- 21証拠は全て前後SHA256・bytes一致。現対象10PNG、旧55比較5PNG、home/private比較2画像、JSON2、旧55原文1、取得スクリプト1。
- 現対象は `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-{full,r19-only,r19-erased,r10-only,r10-erased}.png` の5枚と、同名 `-direct2.png` の5枚。全10枚を実表示した。
- 原寸5枚は全て1600×2000。全体を最大辺950px以内へ縮小表示し、主要輪郭を元画素の原寸cropで追加確認した。
- 直接2倍は1600画像の拡大補間ではなく、`native-evidence.json` に3200×4000からのcropとして記録された現物。全5枚を縮小せず原画素表示した。
- 原寸の微小部位にnearest解析2倍/4倍も使った。解析表示は実engine2倍/4倍の検査とは区別し、実4倍の証拠にしていない。

最初の5PNGだけでは実2倍がなかったため、原寸の所見を先に確認し、直接2倍の追加提供後に別の前hashを固定して最終判定した。不足していた2倍証拠を原寸拡大で補っていない。

`guard-fill-evidence.json` の5SHAは元PNGと5/5一致した。`native-evidence.json` の5SHAも直接2倍PNGと5/5一致し、実寸はcrop記録に一致した。guard manifestにbytes欄はなく、本監査で前後bytesを個別取得した。

`capture-native.mjs` には凍結55 runtime等を読み、1600PNGのbyte一致assert後に3200を取得する手順が記載されている。担当者はその生成/再実行をしていない。取得手順/親のassert成功報告を美術PASSの代用にせず、実表示したPNGの現物で判断した。現制作版のidentityや適用状態は検証していない。

## 実表示範囲

座標は特記しない限りworld 1600×2000、`[left,top,right,bottom]`。原寸5枚を全体表示した上で、以下を追加表示した。

| 状態 | 原寸追加範囲 |
|---|---|
| full | 窓/ボンネット `[760,540,1310,1120]`、タイヤ上辺 `[390,980,545,1080]`、旧孤立線 `[900,1070,1040,1135]` / `[1140,1140,1290,1240]`、バンパー微小部 `[1200,1165,1265,1210]` |
| r19-only | タイヤ/隣接部 `[340,970,760,1450]`、旧漏れ `[350,1100,420,1310]`、下部 `[350,1230,690,1500]`、接続端 `[460,1430,590,1500]` |
| r19-erased | タイヤ/隣接部 `[340,970,760,1450]`、下部 `[350,1230,690,1500]` |
| r10-only | ドア/ミラー/タイヤ接点 `[230,720,720,1160]`、左縁 `[240,790,320,1120]`、前面下辺 `[330,1030,1470,1240]` |
| r10-erased | ドア/ミラー/タイヤ接点 `[230,720,720,1160]`、前面下辺 `[330,1030,1470,1240]` |

直接2倍5枚は全画面を元画素表示した。実寸とworld対応範囲は次の通り。

| 直接2倍PNG | 実寸 | world対応範囲 |
|---|---:|---|
| `vehicles-guard-fill-full-direct2.png` | 1100×1160 | `[760,540,1310,1120]` |
| `vehicles-guard-fill-r19-only-direct2.png` | 640×1200 | `[340,970,660,1570]` |
| `vehicles-guard-fill-r19-erased-direct2.png` | 640×1200 | `[340,970,660,1570]` |
| `vehicles-guard-fill-r10-only-direct2.png` | 320×840 | `[250,800,410,1220]` |
| `vehicles-guard-fill-r10-erased-direct2.png` | 320×840 | `[250,800,410,1220]` |

r10の直接2倍は左ドア縁だけのcropである。前面の長い下辺のうちworld x410以右は原寸だけの所見であり、直接2倍の合格を補っていない。r19の直接2倍はタイヤ下部と接続端まで含む。

比較55の全塗りsourceとr19/r10のonly/erased計5枚も全体表示し、r19旧漏れ `[350,1100,420,1310]`、r10左縁 `[240,790,320,1120]`、旧短線 `[1200,1165,1265,1210]` を原寸照合した。55原文のR55-1/R55-2を読んだ。実home vehicles-v1とprivate登録vehiclesも分析全体表示した。形/色/構図の複製を条件にしていない。

## 現物判定

### R55-2：全塗り窓/右ボンネット — 今回範囲で改善確認

- **右窓：world x820–1140,y575–810。** 55の赤い多角形面がなくなり、56はガラスの柔らかい反射/階調が連続する。隣の窓とともにガラスとして読める。原寸全体/局所と直接2倍で確認した。
- **ボンネット右側：world x1030–1298,y806–1076。** 55にあった広い白い欠けがなくなり、赤い車体の曲面/反射が続く。白背景と同じ空白が面を断ち切る状態や、空白の上端の黒い残線を今回56で認めない。

色相を参照通りにすることを要求したのではない。55で失われた窓の材質と車体の面の連続が、今回の実画像で戻ったことを判断した。fullの直接2倍cropは両部位を含んでいる。

### R55-1：r19青/r10の隣接白面漏れ — 今回範囲で改善確認

r19-onlyの旧位置 world x364–384,y1150–1290 と、r10-onlyの旧位置 x255–315,y795–1105を比較した。56のr10-onlyは青配色、55の同部は赤配色である。色を一致させていないが、同じ黒線と白い隣接面に対する境界を比較した。

- r19の旧の細長い青帯は、原寸と直接2倍で、黒線左側へ続く帯として見えない。白い隣接面は黒線へつながる。
- r10の左ドアにあった旧の外側赤帯もなくなり、56の青い塗りは黒線の塗り面側で連続する。白い隣接面に分離した青帯を認めない。

目視の位置を元1600画素で照合した代表例を残す。これは全画素の輪郭外試験/性能測定ではなく、旧所見と同位置の補助照合である。

| world行/対象 | 55 | 56 |
|---|---|---|
| r19 / y1180 | 黒線x372–377の左に青x367–371 | 同黒線の左に旧青帯を認めず。塗り面側の青は概ねx378以右 |
| r19 / y1220 | 黒線x369–375の左に青x368 | 左側の旧青画素を認めず。塗り面側の青は概ねx376以右 |
| r10 / y850 | 黒線x275–278の左に赤x270–274 | 左側の旧色帯を認めず。青は概ねx280以右 |
| r10 / y920 | 黒線x266–269の左に赤x260–265 | 左側の旧色帯を認めず。青は概ねx271以右 |
| r10 / y1000 | 黒線x273–276の左に赤x264–272 | 左側の旧色帯を認めず。青は概ねx277以右 |

**微小画素を隠していない：** r19のworld y1260,x367には青1画素級が残る。所在は黒い線の終端と滑らかな青い塗り面が接する点で、原寸/直接2倍では、旧のように白い隣接面へ続く長い外側色帯として見えない。単画素の存在を0へ書き換えたり、outsideContourPixels=0を主張したりしていない。今回の表示では分離したにじみ/連続する外側縁取りと判断せず、この局所の比較PASSを妨げる不足には数えなかった。合成の原因やアンチエイリアス由来かは未特定。

### 下部接続端・白い隙間・消去線画

r19のタイヤ下部と隣接する未着色の側面/下線を、world `[350,1230,690,1500]` および直接2倍で確認した。青い面から黒線の接続端へつながり、黒線の外側に連続して付く青い縁や、塗り面と黒線の間を走る白い隙間を認めない。右側/下側の白い領域は未着色面として残るものであり、それを塗り欠けと誤判定していない。

r19-erasedでは対象のタイヤ前面が白へ戻り、中央の金属面や隣の塗りは保つ。原寸/直接2倍で黒い外周/内周が連続し、線画の大きな欠落や残留する青帯は認めない。

r10-only/erasedの左ドア縁も直接2倍で確認し、黒線と白面の間に分離した色帯/白い裂けを認めない。r10-erasedではドア/前面対象が白へ戻り、隣の塗りと線画を保つ。前面の長い下辺は原寸で確認し、広く続く色の外縁/白い隙間を認めなかったが、上記crop範囲外の実2倍は未確認。

全塗りの旧タイヤ上辺 x416–512,y1008–1043 と旧ボンネット/バンパー短暗線位置も原寸で見た。旧の粗い上縁や孤立した暗色線の明確な再発を認めない。微小なバンパー部は原寸と解析拡大で照合しただけで、そこに実2倍/4倍の全域確認を追加したとは主張しない。

## 限界・原本の保持

今回のPASSは、未採用56の5状態の原寸と、指定された5つの直接2倍cropに対する限定比較。提供されていない他部位/他テーマ/別倍率/DPR/Chrome全体、すべての部分塗り/消去操作、全色/装飾、ホーム同等の全10最終合否には拡張しない。

55のR55-1/R55-2 FAILはその版の原本として変更していない。途中で親から別候補57の変更/検証が伝えられたが、その画像/コードを本判定に混ぜず、56 PASSを57へ流用していない。現制作版の採用判断は別。

再委任、モデル変更、外部通信、有料API、生成、公開、テスト/性能測定を行っていない。P05 STOPを維持。本報告以外のファイルを作成/編集せず、他者の変更を戻していない。private参照は分析表示だけで、報告埋込み/公開/配布用複写はしていない。表示用crop/解析拡大はメモリ内のみ。

## 確認前後SHA256・bytes

全21証拠が前後一致。初期14と直接2倍追加7の確認前時刻は冒頭に分けて記録した。画像17枚を実表示した。表のbytesは前後同じ。

| ファイル（project相対） | bytes（前後同じ） | 確認前 SHA256 | 確認後 SHA256 |
|---|---:|---|---|
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-full.png` | 508721 | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` | `3e3be93c77b1b962ea6ace45c9210fa9e909ff88e51dfac41bfd267b61291f13` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r19-only.png` | 246524 | `d609bc7b9ca178a264de2c0d18106a44d2c042d63998068fc6aa99ec8d0446a3` | `d609bc7b9ca178a264de2c0d18106a44d2c042d63998068fc6aa99ec8d0446a3` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r19-erased.png` | 506669 | `71ec7ec5cedc08da9af961e0570b517379fb7789a37caa3f970bbfec3a23bb20` | `71ec7ec5cedc08da9af961e0570b517379fb7789a37caa3f970bbfec3a23bb20` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r10-only.png` | 282870 | `a09a48fd4e787bf071efc5e4605d8a495ddb97a90edb7984b46b164eb40f7522` | `a09a48fd4e787bf071efc5e4605d8a495ddb97a90edb7984b46b164eb40f7522` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r10-erased.png` | 476171 | `70ed1667c7a3bd302b9c5ad6b9145cfa840b3a84769c02add89b52bb36932beb` | `70ed1667c7a3bd302b9c5ad6b9145cfa840b3a84769c02add89b52bb36932beb` |
| `test-results/smooth-home-i34/revision-56/guard-fill-evidence.json` | 692 | `3c5325a549ab45ace330fdaf28cfcb6b42baeba72bfd192d48cbe25a9fee2bed` | `3c5325a549ab45ace330fdaf28cfcb6b42baeba72bfd192d48cbe25a9fee2bed` |
| `docs/audits/revision-55-source-visual-20261012.md` | 31884 | `e850b6e71536e3feb59a6efde8eceec236401191d46bb32e5c1204160bff44a7` | `e850b6e71536e3feb59a6efde8eceec236401191d46bb32e5c1204160bff44a7` |
| `test-results/smooth-home-i34/revision-55/after/vehicles-source.png` | 490623 | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` | `42fb64fe6ba87d34c8b7a4b1e3c58686f82a14e177778b6d29bf40d091f650ed` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r19-only.png` | 251147 | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` | `24562412732835cbdf99976a9415d1857d160cb5fabcfa78132c31614b039ec2` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r19-erased.png` | 496592 | `24efc2aee85353c4f267ee5dc1c820b40b53d0b73204507c629d20fc73cdd4a3` | `24efc2aee85353c4f267ee5dc1c820b40b53d0b73204507c629d20fc73cdd4a3` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r10-only.png` | 312490 | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` | `756dc73baaf6c94ffa6dd11a9062cb42752f96cf287392a644619ad480bbe39f` |
| `test-results/smooth-home-i34/revision-55/extra/vehicles-r10-erased.png` | 482648 | `fcac993ff0a74a686a5924871b040af809418430e6439b1e598c7d819591564a` | `fcac993ff0a74a686a5924871b040af809418430e6439b1e598c7d819591564a` |
| `content/smooth-finish-i34/derived/vehicles-registered.png` | 2422677 | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` | `5ad147c6242dfeb288d1bf3456c6bbd77dfd2606f4f3a2c7ef822773863c6a74` |
| `apps/web/public/images/islands/vehicles-v1.webp` | 100210 | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` | `d4cb28afb6f0d13340514477137a3d3262c770a689564f1280fde924859cfc22` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-full-direct2.png` | 268260 | `6f3b70d4595130f72b55ccf6f4708f914d02b22a7311d6a653f2b33f561ce61b` | `6f3b70d4595130f72b55ccf6f4708f914d02b22a7311d6a653f2b33f561ce61b` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r19-only-direct2.png` | 138430 | `0cd76e493a6e6c7361b91662b75c660dc49a9e5a9b9553f06e61bfc204d96d6b` | `0cd76e493a6e6c7361b91662b75c660dc49a9e5a9b9553f06e61bfc204d96d6b` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r19-erased-direct2.png` | 187472 | `4aba4753c98818cc72e5a40f46ba9cb69b6baac716ef3819a62a2c5e96045d15` | `4aba4753c98818cc72e5a40f46ba9cb69b6baac716ef3819a62a2c5e96045d15` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r10-only-direct2.png` | 46686 | `d0b67552ede62ad533c2200b7312eaf5ed52a8a4e5c69836521563cdda6c99ca` | `d0b67552ede62ad533c2200b7312eaf5ed52a8a4e5c69836521563cdda6c99ca` |
| `test-results/smooth-home-i34/revision-56/vehicles-guard-fill-r10-erased-direct2.png` | 60017 | `b51b953f662091e584958683eefa597389be0ff3e363241d9d4ad95f9964daf8` | `b51b953f662091e584958683eefa597389be0ff3e363241d9d4ad95f9964daf8` |
| `test-results/smooth-home-i34/revision-56/native-evidence.json` | 1292 | `93cc8c4a9dd0edf59604bdbc840850b16991241fb35ccfa8c102c7915ee8ad4a` | `93cc8c4a9dd0edf59604bdbc840850b16991241fb35ccfa8c102c7915ee8ad4a` |
| `test-results/smooth-home-i34/revision-56/capture-native.mjs` | 4567 | `d6590172e2274bbeb46e78651fa54a4992ee23c258e4d8c856b0825f55aadc95` | `d6590172e2274bbeb46e78651fa54a4992ee23c258e4d8c856b0825f55aadc95` |

