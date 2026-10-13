# A17-03 配布されたVite実行時コードの通知 — 実装側記録

2026-10-07。独立した `17-assets-license.md` は編集しない。

旧状態では、demoの実JSに `vite:preloadError` を含むpreload helperがある一方、通知39項目にViteがなく、その著作権表示もなかった。`test-results/a17-license-runtime/before.json` に再現結果を保存した。

`scripts/build-licenses.mjs` の対象に `node_modules/vite` を明示追加した。開発依存という分類でも実行時helperが配布されるため、Workboxと同様に通知へ含める。インストールされたVite 8.3.1の `LICENSE.md` 全文112,425 bytes（本体MITと同梱依存の表示）をそのまま収録し、Google Sans/OFL・GoogleボタンCSS/Apacheを維持する。

生成結果は40項目、通知全文182,710 bytes。変更箇所のESLintは成功。2026-10-07 10:09 JSTに3ビルド完了後、`test-results/a17-license-runtime/verify.mjs` でpublic・本番・demo・非demo試験ビルドの両通知ファイルと、実HTTP応答の計10件のbytes/SHA256一致を確認した。全3ビルドのJSに含まれるpreload helperも検出し、そのVite版と同じLICENSE全文の同梱を確認した。

生結果は `test-results/a17-license-runtime/after.json`。旧39項目の再現を保持し、追加後は40項目。Google関連2項目も維持。通知全文のSHA256は `e78017f8b3b3fda65b764b129f1205aa974817d7fcee37dc6b03e3a0dd3da4db`。
