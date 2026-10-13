# I17 拡大・塗り境界・目：固定版の検証記録

2026-10-09 JST。**今回の技術候補ゲートはPASS。アプリ全体はNOT READY。** 進行基準は [統合計画](storybook-improvement.md)。新しい人間採用、初期/I8の残項目、全機能の新版回帰、最終リリース監査を今回の局所合格から推定しない。

## 対象と同一性

demo aggregate：`f3c10731370481c0235c267e41aed0b1ff4b3591ec8338544289c6d8eb3ffb29`。
runtime source：`0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276`。

[開始](../test-results/vector-improvement/vector-accepted-start.json)・[途中](../test-results/vector-improvement/vector-accepted-mid.json)・[検査後](../test-results/vector-improvement/vector-accepted-end.json)で配布物/runtime/HTTP entryが一致した。全test-harnessは開始後にcloud fixture 2ファイルが変更されたため、不変とは記さない。[変更時刻と範囲](../test-results/vector-improvement/vector-accepted-harness-comparison.json)からUnit/browser開始前に完了し、Unit定義/browser harnessは不変、途中〜検査後の全test-harnessは `38ed428f70b475d45fd8e2891bff4f7288ce32a8f813f65375d31cae7f21682a` で一致する。

10候補は新ID `*-storybook-v2`、`PaintingProfile.version=3`。403制作領域、383選択領域、146制作group、20眼。旧採用版/v2・元画像・旧作品は保持する。Git repositoryは検出されていないためcommit IDはunknown。

## 修正と検証

| 要件 | 今回の変更・証拠 | 判定の範囲 |
| --- | --- | --- |
| V01〜03 曲線/境界/拡大 | 全10の黒線を共有Bezierへ再構築し、同じ曲線から塗りとhitを生成。穴は明示parity。黒線下coverage、一回の白下地、512px tile/2px bleed/32MiB。DPR変更を検知して再描画 | 全90倍率/DPR＋途中pan30＋fit復帰30。動的DPR3→2→1を原pixelで撮影。CSS引き伸ばしなし |
| V04〜07 目 | 白目白、選択色相の虹彩、同系色の暗瞳、白反射。眼縁を制作dataへ統合。姫のホーム原本を分析し視線/白目/繊維/瞳縁/光を改善。男の子と動物/恐竜に追加まつげなし | 全20眼×5色のnative描画・反復/消去復帰、7眼templateの実UI highlight/部分塗り/reload/PNG。顔2/4倍6画像。人間採用とは分ける |
| V08 乗り物 | 標準画像生成で顔なしショベルカー線画とhome島を制作。窓・ライト・グリル等は保護。車体を覆う固定白2detailだけをsource SHA guardで除去 | 生成原本/プロンプト/領域49/小joint5操作、全車倍率、lamp2/4倍。真のタイヤ反射3点を保持 |
| V09〜11 新旧作品 | v1/v2/v3 dispatch、新ID、別UUIDへ制作対応表でコピー。削除した顔5領域の色を転用しない。`Project`/`RegionPaint`/IDB v3/SQL migrations3を維持 | 旧80描画状態は不変hashの範囲に限定、copy/500/quota/abortと新旧UIコピー3ケース。実外部接続とは分ける |
| V12 固定性能/Visual | CPU4/DPR2で3画材×未使用12色×2対象。独立目視PASS後に旧10baselineを保全、新10を更新、更新なし5構成比較 | 指定firstCanvas p95成功。模擬CPU/DPRと物理端末を分ける |

最新rawは [証拠index](../test-results/vector-improvement/evidence-index.json)。30native画材は [採用した証拠manifest](../test-results/vector-improvement/accepted-native-media.json)で現在のtemplate bytesと照合した。不変9作品の27枚＋最終車3枚を使用し、旧 `native/vehicles-*-640.png` と旧共通media JSONの車3entryは明示除外する。

## 自動検査と独立監査

| 検査 | 最新結果 | 生記録 |
| --- | --- | --- |
| Unit/Integration | 49ファイル390成功、失敗0 | [Unit](../test-results/vector-improvement/unit-vector-accepted-candidate.json) |
| Chrome mobile | 15成功、skip/retry/失敗0 | [UI](../test-results/vector-improvement/browser-accepted-candidate-results.json) |
| Chrome desktop/narrow | 8成功、44px/短画面/overflow/contrast。現行4/3/2列を確認 | [layout](../test-results/vector-improvement/browser-layout-accepted-results.json)。初期desktop3列の仕様合格には使わない |
| Visual | 独立PASS後に旧10PNG保全、新10更新5成功、更新なし5構成成功 | [旧基準](../test-results/vector-improvement/previous-visual-baselines/manifest.json)、[更新](../test-results/vector-improvement/visual-baseline-update-results.json)、[比較](../test-results/vector-improvement/visual-accepted-results.json) |
| PWA | 本物SW/2tab/保留IDB/実flush/更新UI/offline保持、error0 | [結果](../test-results/vector-improvement/pwa-update.json)、[通信](../test-results/vector-improvement/pwa/network-observations.json) |
| 非demo同期 | Chrome/Firefox/WebKitで9成功、skip/retry/失敗0 | [結果](../test-results/vector-improvement/cloud-source-e2e-accepted/results.json)、[identity](../test-results/vector-improvement/cloud-source-e2e-accepted/run-identity.json) |
| lint/型 | 最終成功 | [lint](../test-results/vector-improvement/lint-final.log)、[型](../test-results/vector-improvement/typecheck-final.log) |
| 独立目視 | 可視範囲PASS。VV-01〜07解消維持、新必須修正0 | [原文](audits/vector-visual-20261009.md)、[固定558file/crop14/参照116検算](../test-results/vector-visual-audit/revision8-final-audit-verification.json) |
| 独立engine/互換性 | 限定PASS。配布718現物/57source、車6状態、旧byte/保存schemaを確認 | [原文](audits/vector-engine-20261009.md) |

独立目視のbrowser159枚は直接55枚＋過去に直接確認した同一byte104枚。顔/ライト8枚・動的DPR3枚は別記録。未変更の画像を新規目視枚数へ数え直さない。rootは更新後のhome/editor10基準も直接開いた。WebKit homeの更新案内は表示したまま比較し、非表示化して合格させていない。旧Firefox/WebKit32機能結果はf818の履歴で、不変範囲だけ参照する。

## 性能

[72生sample](../test-results/vector-improvement/performance.json)を現行固定build・前後同一source/harnessへ結び付けた。他の重い検査と分離した。

| 選定 | 構成 | firstCanvas p95 / max | 2rAF代理値 p95 / max |
| --- | --- | --- | --- |
| 最大塗り面積 | 姫スカート6領域、400×500 maskで32,463px | 7.0 / 10.2ms | 24.7 / 119.4ms |
| 最大所属数 | ロボット14領域、同maskで16,126px | 13.3 / 23.0ms | 31.5 / 33.3ms |

画材別firstCanvas p95の最大はロボットのクレヨン23.0ms。2rAFは画面に実際に表示された時刻ではない。119.4msの生値を消さず、60fps・物理present・実機・長時間heap・新Lighthouse合格を主張しない。

## 不合格の履歴と未完了

初回〜revision7の独立FAIL、55f1の技術成功でも残っていた車の白2点、PWA新hash WEBPのoffline取得失敗、cloud fixtureのVite WS9失敗とpublic no-cacheによる2失敗を別rawで保持した。白2点は曲線や塗りcoverageの欠けではなく、固定白detailの後描きが原因だった。曲線をさらに潰す試行は不採用。2detailだけを除去した最終f3cで描画・画像を取り直した。

cloudの最新成功は `mode: non-demo source preview`、`build:null`、`productionBuildVerified:false`。実SDK/HTTP/PGliteへSQL migrations3件を適用したfixtureで、freshなpublic HTTP cacheを条件とする。本番SWの証明は別のPWA検査に限定する。非demo配布buildは素材の既存人間承認gateで停止し、迂回していない。

`Template.approved`はdemo候補への継承値trueだが、人間採用の証拠ではない。実際の新版QAはpass:false、reviewはauthor-technicalであり、`releaseApprovalError`は本番素材gateを拒否する。QA/reviewのcanonical hash（`approved:false`としてJSON正規化）と配布JSONのbyte hashを区別してindexへ記録した。旧I5採用を新しいhashへ移していない。

全体NOT READYの理由は、統合計画のM13/M14/M23/B07/B13/B14/B16/B27/B30/B32/B33/B36/U02〜06に残す。今回のI17可視・技術ゲートの合格と、未撤回の前計画の不足を同じ状態へまとめない。
