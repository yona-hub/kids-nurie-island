# Agent 19 — A19-04 限定独立再監査：PASS

対象：`C:/Users/yonaf/develop/app/キッズ塗り絵アイランド`  
確認時点：2026-10-07 22:40 JST  
判定：**A19-04 は解消。今回の限定範囲で新規必須修正なし。**

今回の対象は、保存失敗後に Editor で明示破棄した際の失敗状態解除と、その解除の作品・サービス・認証所有期間・保存中処理へのスコープ保護である。`AGENTS.md`、`docs/product-spec.md` の Agent 19・報告形式・品質ゲート、旧 A19 報告、`19-discard-resolution.md` を参照した。`harness-orchestrator` の共通指示を適用し、モデルと effort は継承した。

ソース、テストの assertion、保存済み生結果を独立照合した。追加の unit / integration / E2E / build / 性能測定は実行していない。プロダクト、テスト、外部サービス、他プロジェクトの変更、孫エージェント起動はない。今回の書込みは旧報告の履歴保存、本報告、参照 hash 記録、harness 完了記録だけである。

旧報告は `docs/audits/history/19-failure-modes-20261007-224007-762.md` にコピーした。コピー前の原文と履歴の SHA256 はともに `658da0e83b3169e529a8d575a50d8f84fc89f6b61b65913aafe2f8a25fdcea88` で一致した。証拠一覧と参照 hash は `test-results/harness-resume/a19-review-source-evidence.json` に保存した。Git はこの workspace で利用できず、差分 commit の証拠はない。

## 発見事項・Severity・必須修正

| ID | 判定 | Severity | 修正必須 |
|---|---|---|---|
| A19-04：明示破棄後も保存失敗警告と更新停止が残る | 解消 / PASS | 旧 P2。現在の限定範囲では該当なし | いいえ |
| 今回の新規所見 | なし | P0=0、P1=0、P2=0、P3=0 | なし |

A19-01〜03 は旧報告で解消済みという既存の判定を保持する。本再監査はそれら全条件の新規実行や全プロダクトのリリース判定ではない。

## 根拠

- `packages/persistence/src/index.ts:67–69,126–135,604–611`：返された `PersistenceError` 自体を内部 WeakMap の識別子とし、アカウント、認証世代、入力作品、失敗 scope に結び付ける。`failedLocalWrites` の同じ scope の最新エラーと一致する場合に限り解除する。作品 ID、合成エラー、別サービスのエラー、設定や削除のエラーだけでは解除できない。
- `index.ts:528–540,596–600,607–608`：保存呼出しは最初の await 前に対象の保存数を増やし、finally で減らす。対象に保存中処理がある間は破棄を拒否する。最新失敗を古い失敗 token で解除することも拒否する。
- `index.ts:90,126–127,163–178,544,578–594`：所有アカウントと認証世代を確認し、A→B→A でも古い保存失敗を現在の失敗状態へ発行しない。書込みと transaction 完了前後も所有期間を確認する。解除側はアカウント削除中、破棄済みサービスも拒否する。
- `apps/web/src/pages/Editor.tsx:121–123,190–222,250–260`：Editor は自身が受け取った保存失敗を作品ごとに保持する。現在のアカウント所有期間が有効で、保存待ちがない明示破棄の場合にだけ API を呼ぶ。破棄後に揮発編集と thumbnail timer を解除する。`use-account-scope.ts:15–31` と `App.tsx:155–165,238` はアカウント往復で古い Editor が復活しない保護を持つ。
- `index.ts:122–124,604–611`：解除はその scope の失敗状態だけを消す。IndexedDB の保存済み作品を更新・削除する処理はない。他作品・設定の未解決失敗は残り、通常の再保存成功も既存の解除経路を使う。
- `apps/web/src/guarded-route.tsx:173–177,222–228`：保存中の明示破棄は UI と処理の双方で拒否する。`App.tsx:265–273` の更新前後の離脱・保存失敗確認は維持されている。

以下のテストソースと最新生結果の assertion を照合した。

| 最新結果 `test-results/harness-resume/unit-results.json` 内の suite | 成功数 | 対応する確認 |
|---|---:|---|
| `tests/persistence-discard.test.ts` | 8 / 8 | 保存色保持、他作品と設定の失敗維持、古い/合成/別サービス/削除エラー拒否、retry 開始直後と保存中拒否、再保存成功、A→B→A、古い in-flight 失敗の遮断、dispose 後拒否 |
| `tests/ui-navigation-loss.test.tsx` | 17 / 17 | 実 App / Editor / persistence の破棄後 flag=false・警告消去・更新要求・保存済み色保持、他作品の失敗時の警告と更新阻止、履歴往復、保存中の破棄禁止、遅い保存完了、認証所有期間 |
| `tests/pwa-updates.test.ts` | 17 / 17 | 保存失敗時の更新拒否、未保存/保存中/遷移中、世代変更、更新後の再確認 |
| `tests/persistence.test.ts` | 12 / 12 | 通常保存を含む既存回帰 |
| `tests/persistence-save-transaction.test.ts` | 15 / 15 | transaction と認証所有期間、競合先の rollback、commit 後の継続保存 |

`ui-navigation-loss.test.tsx:580–618` は保存済みピンク色を容量不足下で消去して失敗させ、明示破棄後にホームで `localSaveFailed=false`、警告なし、beforeunload 制止なし、更新要求1回、元の色と作品数1を確認する。`620–635` は他作品の保存失敗を同時に残し、同じ破棄後も警告と更新ブロックを保つ。API 8件のソースは現在の scope 保護の各拒否条件を直接 assertion にしている。

最新全体unitの生結果は **373件中372成功・1失敗**。唯一の失敗は `tests/cloud-e2e/fixture.test.ts` の localhost 接続で、`unit.log:1148–1150` に `connect EACCES 127.0.0.1:54851` がある。root が fixture だけの局所権限を調整した後の `unit-fixture-results.json` は同じ assertion 名で **1 / 1 PASS**。A19 対象 suite に失敗はない。全体結果と局所再実行結果は別々の証拠として扱う。

## 旧実行証拠との照合

- `test-results/a19-discard-before.json`：選択された破棄ケース1件が `localSaveFailed` の true / false 差で失敗。他12件は未実行の skip。この既存結果は元の A19-04 の再現を裏付ける。
- `test-results/a19-discard-unit.json`：51 / 51 PASS。`a19-discard-related.json`：47 / 47 PASS。解消記録の件数と一致した。
- `test-results/a19-discard-browser/results.json`：2026-10-07 09:51–09:53 JST、Chromium / Firefox / WebKit 各4件、計 **12 / 12 PASS**。skip=0、unexpected=0、flaky=0、各結果 retry=0、errors=[]。これは当時の固定 demo build の実行である。
- 3ブラウザの `a19-discard-update-proof` を Base64 復号して確認した。全て `localSaveFailed=false`、保存済み `r02=#F64C91`、更新イベント1回、Worker への activation 要求1回だった。`tests/e2e/navigation-loss.spec.ts:101–143` の assertion と一致する。
- `build-comparison.json` の 14 / 14 不変は旧ブラウザ実行前後の比較である。現在の Editor、`persistence-discard.test.ts`、`navigation-loss.spec.ts` は旧 `build-before.json` の hash と一致した。現在の persistence 本体と navigation unit ソースは旧 hash と異なる。現在の persistence SHA256 は `c414d4b6d8a0f0733276bbfb0c732730c614af63f8cef145d2d55fa57186284f`。現行判断の主根拠は現行ソースと今回の最新unitであり、旧E2Eを現行buildそのものの再実行成功とは扱わない。

## 再現方法・影響・推奨修正

旧条件は、作品を正常保存→`projects.put` の容量不足→消去保存失敗→ホームへ移動→「未保存の変更を破棄して移動」→更新通知の「更新する」である。旧結果では保存色を保持しても警告と更新停止が残った。

照合した修正後の結果では、対象失敗だけが解除されて警告と更新阻止が解消し、最後に commit した色を保持する。別作品や設定の失敗が残る場合の警告と更新阻止は維持する。対象のデータ損失または一括解除の回帰を示す証拠は見つからなかった。

**推奨修正：今回の限定範囲では追加修正不要。修正必須：いいえ。**

## 再テスト項目・未実施

現行 source と既存結果で、A19-04 の再テスト項目（明示破棄後の警告解除、保存色保持、更新要求、他作品/設定の失敗保持、保存中拒否、retry、認証世代、古い/外来エラー拒否、dispose）を確認した。今回の独立監査による追加実行は0件である。

最新buildのブラウザ再実行とスクリーンショット目視は未実施。旧ブラウザ証拠の待機 Worker は synthetic fixture であり、本物の SW activate / reload の証拠ではない。Firefox は既存の workspace 内 manifest ID 1バイト修正済み診断コピーで、公式未修正 binary や実機の成功とは扱わない。実容量枯渇、OS強制終了、実機、外部 Supabase / Google 認証と credentials を使う実運用は未実施。旧報告で確認済みの A19-01〜03 全条件の独立再実行も今回の範囲外である。

**最終判定：A19-04 の限定独立再監査 PASS。範囲内の未解決件数 P0=0、P1=0、P2=0、P3=0。全リリースゲートの READY 判定は含まない。**