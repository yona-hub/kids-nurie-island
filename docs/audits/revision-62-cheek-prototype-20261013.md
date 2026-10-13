# I34 revision62 prototype-overlap 頬境界・限定独立目視原本

- 判定: **限定FAIL**。61の茶色の段は部分的に減るが、overlap版の肌/髪境界に短い白縁が新出する。
- 対象は `test-results/smooth-home-i34/revision-62/prototype-overlap/` の8PNG＋2JSON。比較履歴は61screen原本。不採用の `prototype/`、shared/、joined/や制作buildを混ぜない。
- 再開・記録開始: 2026-10-13 22:26:50 JST。今回前固定 2026-10-13T22:27:50.1836475+09:00、後固定 2026-10-13T22:28:56.4113712+09:00。前回中断時の未保存終了hash・時刻は推測しない。以下は今回改めて固定し、再表示した現物の記録。
- 単独、主モデル/effort継承、再委任・制作変更・画像生成・性能測定・外部通信なし。この新規原本以外を書き換えない。

## 必須残件 R62O-1: 新しい白縁

`prototype-62-cheek-direct2.png` を260×220の原画素で表示すると、右頬と暗い髪の境界、world概ね **x811.5–812.5,y663.5–667** に短い白い筋が見える。61 R61S-1の範囲内であり、改善完了にはしない。

| direct2画像座標 | world座標（ROI左740/上620、scale2） | before61 RGB | prototype62 RGB |
| --- | --- | --- | --- |
| (144,91) | (812,665.5) | (229,166,143) | (255,255,255) |
| (144,92) | (812,666) | (228,166,143) | (255,255,255) |
| (143,94) | (811.5,667) | (228,166,142) | (255,255,255) |

画像範囲x132–152,y80–107で全RGB成分>235となる近白画素はbefore61=0、overlap=7。これは局所位置の補助確認であり、全画像の白画素や輪郭外0pxを測定したとの意味ではない。肌の暖色と髪の暗色より白い画素が境界に連なるため、通常の2色間の1px AAと区別する。原寸130×110 cropでは目立ちにくく、実直接2倍260×220では短い白筋として識別できる。

R61S-1の茶色の突起は部分的に減っているが、曲線の完全解消をPASSにできない。主不足はこの白縁。ROIのそれ以外には広い新しい平板面や大きな色の不連続を認めない。全体縮小では顔/服/髪/ウサギの読みは保たれるが、それを局所合格の代用にしない。

**最小修正:** world x811–814,y663–669の肌/髪の共有境界を、隣接する面で連続して覆う。白い下地が露出する隙間を除き、肌外側へ色の縁取りを作らず、元の曲線へつながることを原寸/実直接2倍で再確認する。広いぼかしや顔全体の描き直しをこの観測は要求しない。

**原因の区別:** `boundary-authoring.json` のdomain/曲線、隣接r06/r17という記録を読んだ。親から「faceを削った位置を髪がcoverしない」との診断を受領しているが、本担当はコード/cover判定の因果検証をしていない。白筋の実表示と上記RGBを判定根拠とし、説明だけで解消扱いにしない。

## 実表示範囲と未確認

8PNG全てを今回再表示した。direct1は130×110、direct2は260×220をそのまま表示。1600×2000と3200×4000の全体4PNGは最大辺900への縮小表示。ROIはworld [740,620,870,730]。高倍率の代わりに130×110を単純拡大せず、提供されたengine3200由来のdirect2を開いた。

| 実表示ファイル | 表示 |
| --- | --- |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-cheek-direct1.png` | ROI全体・原画素 |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-cheek-direct1.png` | ROI全体・原画素 |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-cheek-direct2.png` | ROI全体・原画素 |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-cheek-direct2.png` | ROI全体・原画素 |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-1600.png` | 全体・最大辺900縮小 |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-1600.png` | 全体・最大辺900縮小 |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-3200.png` | 全体・最大辺900縮小 |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-3200.png` | 全体・最大辺900縮小 |

61screen原本のFAIL（SHA256 fa510bcc0aa21bc8a4229774cf6d5653534b3cf1dae7e226ae6e7317eca975ff）は変更していない。今回の2JSONを読み、manifestの8PNG SHAを現物と照合して8/8一致。元参照画像はこの再開段階で追加表示せず、旧観測履歴と61原本を参照した。

この判定はdirect rendererの頬試作に限る。Chrome/4倍DPR/本番build/全10/全色/実機/実同期/P05性能/人間採用/全体READYは未確認・別ゲート。制作反映の有無や新buildのテスト成功をこの試作の美術合格に使わない。旧FAILを上書きしない。

## 今回確認前後SHA256・bytes

8PNG＋2JSON＋61screen原本の11ファイル。前 2026-10-13T22:27:50.1836475+09:00、後 2026-10-13T22:28:56.4113712+09:00。11/11同一、差分0。前回中断時の終了hashをこの値として遡及していない。

| 入力ファイル | bytes前 | bytes後 | SHA256前 | SHA256後 |
| --- | ---: | ---: | --- | --- |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-1600.png` | 1065587 | 1065587 | `7122d46a606fa0ec629097414364c7347b1b83abe7a26a259532555fa63724fd` | `7122d46a606fa0ec629097414364c7347b1b83abe7a26a259532555fa63724fd` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-3200.png` | 2822197 | 2822197 | `75e2e2c06131046db03bfaa58e2e78231fdd8accf149ded318fc45b9844f2f6e` | `75e2e2c06131046db03bfaa58e2e78231fdd8accf149ded318fc45b9844f2f6e` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-cheek-direct1.png` | 19180 | 19180 | `2c869a3034c327e5b33bdd43f62e520c88ee32295162772a3138e481234f00a0` | `2c869a3034c327e5b33bdd43f62e520c88ee32295162772a3138e481234f00a0` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/before-61-cheek-direct2.png` | 49144 | 49144 | `039f3a2fd320194903be54c42e6a059ea19c9f2196a9c2fbc63c6307e8e4ab63` | `039f3a2fd320194903be54c42e6a059ea19c9f2196a9c2fbc63c6307e8e4ab63` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/boundary-authoring.json` | 213 | 213 | `728229d62b781461eae8e705531f7086830118e9cb0f8fe7625c032077caca1d` | `728229d62b781461eae8e705531f7086830118e9cb0f8fe7625c032077caca1d` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/evidence.json` | 2143 | 2143 | `64cda60e294b6b9c262744a5f65bbf4068666e9350d4d1c827bf6134aa1a5479` | `64cda60e294b6b9c262744a5f65bbf4068666e9350d4d1c827bf6134aa1a5479` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-1600.png` | 1065614 | 1065614 | `1b6a5363592430752b157875fc3a542c7c48ce1f2f3d519d980c33d7443f03a4` | `1b6a5363592430752b157875fc3a542c7c48ce1f2f3d519d980c33d7443f03a4` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-3200.png` | 2822266 | 2822266 | `47f9d3ddd5d222e7fd20cf5dbac90be34d4cf960eebe6ed37c188a51fe4a7f56` | `47f9d3ddd5d222e7fd20cf5dbac90be34d4cf960eebe6ed37c188a51fe4a7f56` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-cheek-direct1.png` | 19203 | 19203 | `0f13dc945229c4089db0f90d02428eb901e45eb15a15c86cf53e76a19f5b18d0` | `0f13dc945229c4089db0f90d02428eb901e45eb15a15c86cf53e76a19f5b18d0` |
| `test-results/smooth-home-i34/revision-62/prototype-overlap/prototype-62-cheek-direct2.png` | 49280 | 49280 | `163a00ff343982f31f1d198d073ddd045912db4d724951c726e99afa69a37f30` | `163a00ff343982f31f1d198d073ddd045912db4d724951c726e99afa69a37f30` |
| `docs/audits/revision-61-screen-visual-20261013.md` | 76654 | 76654 | `fa510bcc0aa21bc8a4229774cf6d5653534b3cf1dae7e226ae6e7317eca975ff` | `fa510bcc0aa21bc8a4229774cf6d5653534b3cf1dae7e226ae6e7317eca975ff` |

