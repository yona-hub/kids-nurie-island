param([Parameter(Mandatory = $true)][ValidateRange(1, 20)][int]$Number)
$ErrorActionPreference = 'Stop'
$auditRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$roles = @{
  1 = @('spec', '仕様トレーサビリティ', 'product-spec全40節と後続ユーザー指示を実装・実アセット・実テストへ対応付け、漏れと勝手な仕様変更を検出する。主にdocs、公開内容、主要経路。')
  2 = @('architecture', '全体アーキテクチャ', '責務分離、依存関係、420枚拡張、データ取得とキャッシュ、保存スキーマ。主にpackages、App、設計書。')
  3 = @('react-typescript', 'React / TypeScriptコード品質', '型安全性、React状態管理、非同期effect、unmountとアカウント切替、不要な再レンダリング、保守性。主にapps/web/src、shared-types。')
  4 = @('drawing-engine', '描画エンジン', 'Region paint、mask、compositing、dirty rect、pan/zoom、座標変換、タップ補助、export。主にcoloring-engine、ArtworkCanvas、engine tests。')
  5 = @('texture-shading', 'スマート質感・陰影', '固定seedの再現性、11素材、3画材、自然な陰影、白消去、過剰表現、画面と書き出しの一致。texture.tsと描画画像も確認。')
  6 = @('asset-pipeline', '制作パイプライン', 'OpenCV、Native閉領域、微小切れ修復、大切れ拒否、元画像保持、QA、誤検出、debug出力、レビューUI、人間承認hash。tools/asset-pipelineとcontentの実データ。')
  7 = @('mobile-ux', 'Mobile UX', '3〜8歳の操作量、視認性、44px目安、320/390px、tap/drag/pinch、誤操作、動き軽減、子ども向けの理解。CSS、UI、test-results/ui画像とE2E。')
  8 = @('desktop-responsive', 'Desktop / Responsive', 'PCの余白、1440px、ホイール・drag、キーボード、レイアウト、画面拡大、modal、縦横配置。CSS、UI、test-results/ui画像とE2E。')
  9 = @('pwa-offline', 'PWA / Offline', 'Service Worker、cache容量、初回420枚取得しない、更新通知・編集中更新、offline fallback、復帰、install manifest、icons。sw.ts、pwa.ts、各loader、PWA E2E。')
  10 = @('supabase-auth-rls', 'Supabase Auth / DB / RLS', 'Google/PKCE、provider抽象化、SQL、RLS、Storage全操作、privilege、所有者・上限・CAS・削除。persistence/auth/cloud、supabase全体、実SQL tests。Supabaseスキルが利用可能なら従う。')
  11 = @('sync-consistency', '同期・競合・データ整合性', 'ローカル保存完了、debounce、offline queue、reconnect、in-flight変更、CAS、競合保持、上限、二重処理、複数タブ、アカウント切替。persistence中心。')
  12 = @('performance', 'パフォーマンス', 'FPS、tap応答、memory/cache、bundle、rendering、network/startup。実装とtest-results/engine-performance.json、lighthouse-summary.json等。Android実機とデスクトップ測定を混同しない。')
  13 = @('accessibility-tts', 'Accessibility / TTS', 'aria、hit target、contrast、keyboard/focus/modal、SpeechSynthesisフォールバック、reduced motion。UI、audio、CSS、axe結果。')
  14 = @('security-privacy', 'Security / Privacy', 'XSS、CSRF相当、secret混入、データ隔離、削除、バックアップ入力、CSP、認証、ローカル制作サーバー。テストfixtureの偽キーを実secretと誤判定しない。')
  15 = @('cross-browser', 'Cross Browser / Device', 'Android Chrome相当viewport、Desktop Chromium、WebKit、Firefox、canvas/export、IndexedDB、touch、PWA、対応API。ブラウザ報告と実装。ホスト起動失敗とアプリの不具合を区別する。')
  16 = @('test-quality', 'Test品質', '要求に対するテスト不足、false positive、flaky、fixture、境界、失敗をskipで隠していないか、テストが本体と一致するか。tests全体とreport。')
  17 = @('assets-license', 'Asset / Copyright / License', '本番OSS license、線画の来歴、第三者IP混入、参照ZIPの扱い、独自assetとアイコン、音、フォント、ライセンス生成。法的保証はせず来歴・依存license証拠を照合。')
  18 = @('visual-brand', 'Visual / Brand', '島モチーフ、色、余白、UI圧迫、子ども向け楽しさ、作品主役、12テーマの統一、原文コピー、見本ZIPとの方向性。画面・線画・sceneの画像を必ず確認。')
  19 = @('failure-modes', 'Edge Case / Failure Mode', '通信切断、容量不足、500件、破損データ、離脱、二重操作、同時保存、logout/delete、復帰。実装と再現可能なテスト根拠。')
  20 = @('release', '最終リリース', '敵対的・総合的に公開可否を判断。docs/product-spec.md全40節、他19監査の修正完了、最新check/E2E/visual/performance、安全、素材、人間承認を自分で照合。未達をPASSにしない。')
}
$role = $roles[$Number]
$id = '{0:D2}' -f $Number
$requestDir = Join-Path $auditRoot '.local/audit-runs'
New-Item -ItemType Directory -Path $requestDir -Force | Out-Null
$promptFile = Join-Path $requestDir "$id-prompt.txt"
$reportFile = Join-Path $auditRoot "docs/audits/$id-$($role[0]).md"
$reviewFocus = '今回はこの担当の初回監査です。担当範囲を独立に調査してください。'
if (Test-Path -LiteralPath $reportFile) {
  $historyDir = Join-Path $auditRoot 'docs/audits/history'
  New-Item -ItemType Directory -Path $historyDir -Force | Out-Null
  $historyName = "$id-$($role[0])-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff').md"
  $previousReport = Join-Path $historyDir $historyName
  Copy-Item -LiteralPath $reportFile -Destination $previousReport
  $reviewFocus = "今回は同じ担当の修正後再監査です。前回の担当報告は $previousReport に保存しました。まず前回の各所見とその再現・影響を読み、現在の実装で独立に解消を検証してください。関連する変更の回帰も確認し、実装担当の修正済み主張だけでPASSにしない。元の担当範囲で新しい具体的な問題があれば報告する。全く別分野の監査を最初から繰り返す必要はありません。"
}
$prompt = @"
あなたはキッズ塗り絵アイランドの独立監査 Agent $id（$($role[1])）です。ユーザーは20名の独立専門監査を明示的に依頼しています。実装担当の会話を引き継がない、新規の一時・読み取り専用セッションで独立に監査してください。
対象: $auditRoot
重点: $($role[2])
$reviewFocus
最初にdocs/product-spec.mdの担当分野と33〜36節を読み、該当ソースを自分で調べてください。他のレビューの結論を写さない。Agent20以外は他監査の所見を読む前に独立判断を作る。
docs/user-art-decisions.mdの後続ユーザー指示も優先する。旧手描きSVGを正式採用せず、新しい生成線画10枚は白黒のまま、瞳とハイライトを独立領域にする。素材の妥当性を判定する担当は、約の領域数・24px目安の例外について原画・個別注釈・実操作証拠を照合する。担当範囲に関係しない全素材の幅再計算や別分野の全検査を重複する必要はない。自身の担当分野の具体的な欠陥と修正回帰へ集中する。未承認を承認済みと解釈しない。
対象プロジェクトだけを読み取る。他プロジェクト、個人ファイル、資格情報を読まない。実装編集、承認記録の変更、外部サービス変更、メッセージ送信、他エージェント起動は禁止。公式ドキュメントの一般的な照会は可、ソースや私的データを外部へ送らない。必要な実行は安全な非破壊検査だけにし、できなかった検査は未実施と明記。既存レポートは生の実行結果やコードと照合する。
ローカル検証ビルドはhttp://127.0.0.1:4174。Windowsの読み取り専用sandboxでブラウザ起動・localhost接続ができない場合、既存スクリーンショットをview_imageで確認し制限を明記する。画像ファイルはtest-results/uiとtools/asset-pipeline/outputにある。任意にnpmをinstallしたりホスト設定を変えない。
新しい生成線画10枚について、ユーザーから「この10枚を正式採用する」と明示回答を受領済み。採用の妥当性を判定する際はcontent/generated-lineart/user-adoption.json と現在の原画・承認hash・公開gateを照合し、過去の承認待ち記述から未承認と推測しない。他監査の未完了をAgent20以外で循環的なコード欠陥として追加しない。外部Supabase/Google Credentialsのみはユーザー指定の例外。Firefoxは公式配布のWindows private assembly manifestに起動問題があり、workspace内のコピーに限定した1byte修正の診断実行を追加している。scripts/prepare-firefox-local.mjs、docs/testing-browser.md、test-results/firefox-diagnostics と最新の実行結果を区別し、通常配布版や実機まで成功したと推測しない。
最終回答はそのまま監査報告Markdownとして保存される。日本語でPASS/FAIL、範囲、実行/未実施、発見毎のID A$id-xx、Severity P0/P1/P2/P3、ファイル:行/画像/計測値の根拠、再現、影響、推奨修正、修正必須か、再テスト項目を記載。発見がない場合0件。P2は具体的な公開前品質問題、P3は将来改善。主観的嗜好や仮想リスクで指摘を水増ししない。最後に判定と未解決のP0/P1/P2/P3件数を明記。
"@
[IO.File]::WriteAllText($promptFile, $prompt, [Text.UTF8Encoding]::new($false))
Get-Content -LiteralPath $promptFile -Raw | codex exec --ephemeral --skip-git-repo-check --sandbox read-only --json -C $auditRoot -o $reportFile - 1> (Join-Path $requestDir "$id-events.jsonl") 2> (Join-Path $requestDir "$id-stderr.log")
if ($LASTEXITCODE -ne 0) { throw "Independent audit $id failed to complete. Inspect $requestDir/$id-stderr.log" }
Write-Output "Independent audit $id completed: $reportFile"
