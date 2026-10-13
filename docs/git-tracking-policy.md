# Gitで管理するファイル

2026-10-14の「Gitで管理すべきファイルを厳しめに選別してgitignoreを整理して」に基づく方針。除外はGitへの登録だけを制限し、原画・旧出力・失敗証拠の実ファイルは削除しない。

## 管理するもの

| 対象 | 残す理由 |
| --- | --- |
| `apps/web/src/`、`packages/`、`scripts/`、制作ツールのソース | 実装・再生成・検証の手順 |
| `package.json`、`package-lock.json`、TypeScript/Vite/ESLint/Playwright設定、`.github/` | 依存関係と実行条件の固定 |
| `.env.example` | 値を持たない設定項目の共有 |
| `supabase/migrations/`、`supabase/functions/`、`supabase/config.toml` | サーバー側の実装と構成 |
| `apps/web/public/` | 起動・ビルドに必要な公開素材。旧作品用の不変URLも含む |
| `content/`の原画、プロンプト、注釈、制作設定、manifest、承認記録、必要なcompiledデータ | AI生成原画は同じ結果を再生成できない。輪郭・領域・採用hash・旧作品の再現性を保持する |
| `tests/`、`tests/e2e/snapshots/` | テストと比較基準。実行ごとのスクリーンショットとは区別する |
| `docs/`、`AGENTS.md`、`.harness/project.json`、`.harness/lock.json`、`.harness/catalog/` | 仕様、変更・撤回、独立監査、進行基準とプロジェクト固有設定 |

`content/qa/`と`content/templates/reviews/`は公開前の承認検査が読むため、生成されたJSONであっても除外しない。`compiled/`、`before/`、`history/`にも検証入力・承認履歴が含まれるため、名前だけで一括除外しない。内部用RGB原画はGit管理対象だが、アプリの`public/`へ入れてよいという意味ではない。

## 除外するもの

- `node_modules/`、`dist/`、`dist-demo/`、coverage、各種キャッシュ、Python仮想環境。
- `.env`、`.env.*`（`.env.example`を除く）、認証情報、秘密鍵、ブラウザーの認証状態、Supabaseの端末ローカル状態。
- `.local/`、`.harness/runtime/`、Playwrightレポート、通常の`test-results/`。ログ、録画、トレース、実行ごとの画像・大きな比較出力はローカルに保持する。
- `content/smooth-finish-i33/derived/`、`content/smooth-finish-i34/derived/`、`content/princess-master/derived/`。再計算した登録画像・照明マップ・診断画像で、公開用に採用した版は別途`apps/web/public/`に残す。
- `.gitignore`で個別指定した確認用コンタクトシート、`content/ui-art-v1/review/`、展開済みGoogleサインイン素材の元ZIP。利用する素材・ライセンス・取得元記録は残す。
- IDE/OSの端末固有ファイル、一時ファイル、使い捨てバックアップ。

監査本文と入力hashをGitへ残しても、除外した画像・生結果まで共有されたことにはならない。過去検査の再確認には、その実ファイルを別途保持・引き継ぐ必要がある。Gitだけから過去のPASSを確認済みとは扱わない。

## 検証フォルダー内の限定例外

既存コードが固定入力として参照するものだけを明示的に管理する。実行結果全体を許可する例外ではない。

| 入力 | 参照するコード |
| --- | --- |
| `test-results/smooth-home-i33/revision-1/before-files/`のcatalogと10テンプレートJSON | `scripts/build-smooth-finish.mjs` |
| 同じrevisionの`before/evidence.json` | I33/I34の生成処理が読む固定パレット |
| `test-results/smooth-home-i34/revision-1/before-files/`のcatalogと10テンプレートJSON | `scripts/build-smooth-finish-v2.mjs`、`tests/smooth-finish.test.ts`、`tests/crayon-flat.test.ts` |
| `test-results/princess-master/revision-2/frozen/storybook-texture.ts` | `scripts/check-princess-crop-equivalence.mjs`の旧版比較入力 |
| `tools/asset-pipeline/output/`の明示した10版にある`template.json`、`qa.json` | `tests/assets-generated-interaction.test.ts`。一括除外によるテストの意図しないskipを防ぐ |
| 同じ10版の`analysis-region-ids.json`、`analysis-region-ids.png` | 固定マスクの検査入力。`tests/assets_native_audit_test.py`などが使用 |

制作ツールの作業出力は、この限定例外以外を除外する。再コンパイル・レビューで必要な作業素材は原画・注釈・保持済みcompiledデータから用意する。新しい版をfixtureとして採用するときは、必要な入力と根拠を確認して例外を更新する。

今後、これらの固定入力を専用fixtureディレクトリーへ移す場合は、参照する生成処理・テストも同時に直す。今回の整理ではアプリ・生成処理・テストコードの参照先を変更しない。

## 追加するときの確認

`git check-ignore -v --no-index -- <path>`で規則を確認する。生成したという理由だけで原画を除外せず、必要という理由だけでキャッシュや結果フォルダーを丸ごと許可しない。既にステージされた除外対象は、実ファイルを残したままインデックスから外す。

今回の整理はI34の画質・輪郭の合格判定を変更しない。候補62の実画面FAILと候補63試作の独立FAILは未解消で、I34は引き続き未完了。
