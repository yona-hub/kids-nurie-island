# PWAとオフライン

manifestは日本語アプリ名、start_url/scope、standalone表示、theme/background colors、192/512pxアイコンと512px maskable iconを持つ。通常の配信にはHTTPSを使う。localhostは検証可能。画像生成した原画・ホーム素材の来歴は `content/generated-lineart/` と `content/brand-generated/` に保持する。

## キャッシュ

| 対象 | 方法 | 上限 |
| --- | --- | --- |
| HTML/JS/CSS/アイコン | build時のWorkbox precache | 1バージョン分 |
| catalog、背景・フレーム一覧 | NetworkFirst、3秒で取得済み一覧へfallback | 3項目・30日 |
| SHA-256付きURLの公式素材 | CacheFirst（内容は不変） | 90項目・90日 |
| ホームの生成イラスト | バージョン付き192/384/768pxを必要に応じて取得、CacheFirst | 36項目・90日 |
| 旧クライアント向け固定URL | NetworkFirst、取得済み素材をfallback | 上記素材cacheを共有 |
| JSONの初回アクセス補助 | アプリ内fetch + CacheStorage | 40件 |
| 背景/フレームの初回アクセス補助 | fetch/decode成功後に保存 | 40件、decoded memory 6件 |
| ユーザー作品 | IndexedDB | アカウントごと500作品 |

初回precacheからcontent以下を除外する。420線画をインストール時に取得しない。一度開いた線画は、サービスワーカーの制御が始まる前でもJSONを保存する。未取得の線画はoffline時に開けない旨を表示し、既存作品の状態を書き換えない。

ブラウザの容量制約やユーザーによるデータ消去でキャッシュが除去されることはある。キャッシュは再取得可能な素材、IndexedDBとクラウドは作品状態という責任を分ける。

## 更新

waiting workerを自動でactivateして編集中にreloadしない。ホームで更新案内を表示し、明示的な更新操作時に同期を試行する。Service Workerはスコープ内のwindow clientを再列挙し、要求元が唯一のタブで、表示中のホーム・保留遷移なし・未保存なし・保存中でないことを2回の確認応答で照合してactivateを許可する。URLのhashだけで安全を判断しない。他のタブがあれば閉じてから再試行する案内を返す。画面は自身で更新要求をした場合だけreloadし、要求時の画面とアカウントの世代が変わった場合や外部のcontrollerchangeを理由に自動reloadしない。端末保存失敗中の更新も拒否する。

`test-results/pwa-update.json`は本物のSWと2タブで、更新保留、編集中のdocument・拡大位置・保存色の保持、他タブを閉じた後の明示更新、offline再起動を検証した結果。

### 旧試作版からの移行

公開前の旧プレビュー（保存した `index-BDz80J0o.js` 等）は、更新要求にrequestIdや安全確認応答を含めず、応答表示も固定の2文から選ぶ。現在のworkerはこの旧要求を拒否する。旧コードは新しい案内文を受け取る実装を持たないため、worker側の変更だけで旧画面へ復帰手順を表示することはできない。

旧版で「保存が終わってから、ホームで更新してください」が繰り返される場合は、**保存を終えてから、このアプリの全タブとインストール済みPWAウィンドウを閉じ、もう一度開く**。READMEとプレビュー利用者向けの会話でもこの手順を案内する。サイトデータの消去やアンインストールは不要。全clientがなくなれば標準のService Worker lifecycleで待機版が有効になり、同じoriginのIndexedDBに保存済みの作品を引き継げる。

確認応答を省略する互換経路は設けない。旧画面をURLだけで安全と判定して強制更新すると、遷移先URLと実表示の違いや保存待ちを判定できず、修正したデータ保護を損なうため。これは以前の公開リリースとの契約ではなく、開発中プレビューの移行手順である。今後の公開版で更新protocolを変更する場合は、案内と互換移行を先行版から用意する。

実際の旧配布物→現行worker→全ウィンドウ終了→再入場とoffline復帰の検証は `audits/09-migration-resolution.md` に記録する。旧画面に新しい文章を表示できたという主張や、インストール済み実機の検証へ置き換えない。

公式素材のURLは内容のSHA-256を含む。素材修正後は新しいURLになるため、90日CacheFirstの旧画像が新しい素材を隠さない。カタログを1セッション中固定せず、次に作品を開く時にネットワークで再確認する。並行する同じカタログ取得だけをまとめる。ブラウザHTTP cacheも `no-cache` で再検証する。

生成線画の白黒PNGもJSON/SVGと同じhash付きURLで配信する。旧手作りSVGは新規カタログから除くが、既存作品が参照する旧template IDと配信ファイルは保持する。初回起動で旧素材と新素材をまとめて取得しない。

作品は論理template IDを持つ。領域のID・順序・パスを変える更新は新template IDが必須であり、既存作品の色対応を保つ。同じIDの素材修正はオンラインの次の読み込みから適用する。編集中の作品を途中で別revisionへ置き換えない。

新カタログだけを取得して新しい素材を未取得のままオフラインになった場合、既に取得してある同IDの承認済みrevisionを探して作品を開く。背景・フレームも、NetworkFirstが返すcache fallbackの印をloaderが受け取り、取得済みの同ID revisionへ解決する。再接続後は再び最新URLを使う。この復元では作品の色・画材・背景ID・フレームIDを書き換えない。

作品一覧のサムネイルにも、実際に解決したTemplate・背景・枠のrenderKeyを付ける。オフラインで旧素材へ復帰した場合はその旧素材の画像だけを再利用し、再接続後に新素材へ切り替わると同じ作品versionでも再生成する。識別子のない旧キャッシュや異なる素材のクラウド画像を最新素材の画像として扱わない。

worker更新時に素材cacheを一括破棄しない。旧URLのcacheとサーバー上のimmutableファイルを保持する。端末側の90件/90日・40件上限やブラウザによる容量回収の範囲を超えた素材は再取得が必要。アプリのJSON cacheでは3つの小さな一覧を優先保持する。すべての500作品分を永久に端末へ保存する保証ではない。

## 検証手順

1. `npm run build:demo` と `npm run preview:demo` で `http://127.0.0.1:4174` を開く。
2. service workerが制御したこととmanifest/iconの取得を確認する。
3. 1枚の線画を開き、背景・フレームと色を変える。
4. ブラウザをofflineへ切り替えてreloadし、同じ作品を開いて色を変更する。
5. onlineへ戻し再度開いて操作結果を確認する。実Supabase設定時は同期待ち解消も確認する。
6. 未取得線画をofflineで開いた時の案内と、画面を戻せることを確認する。
7. `npx vitest run tests/assets-cache.test.ts tests/assets-revisions.test.ts tests/assets.test.ts` で、同ID素材更新・worker置換・オフラインrevision保持・公開hashを確認する。

iOSのインストールUIなどブラウザ側の案内は実機で確認する。デスクトップでのmanifest検査と実機でのインストールを同一視しない。

2026-10-06 A02-02修正後の確認: revision/loader/実Workbox/承認guardの対象12テスト、typecheck、担当範囲ESLint、`build:demo` が合格。生成済みservice workerを使うChromium PWAの2 E2E（インストール用manifestと素材の非一括取得、作品・背景・フレームのoffline reloadと再接続）も合格した。既存の包括E2E証拠を保持し、この再検査の出力先は `test-results/asset-cache-pwa` とした。
