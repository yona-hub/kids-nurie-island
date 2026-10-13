# 認証・データ保護とセットアップ

## 設定するもの

本実装は新規リモートプロジェクトの作成や既存の無関係なプロジェクトの変更を行っていない。利用者のSupabase/Google設定が必要。設定がない通常のproductionビルドはログイン設定エラーになり、匿名のローカル利用へ自動的に切り替わらない。

1. 利用するSupabaseプロジェクトを明示的に選び、Google CloudでOAuth Webクライアントを作る。Google側の承認済みリダイレクトURIはSupabase Dashboardに表示される`https://<project-ref>.supabase.co/auth/v1/callback`。
2. Supabase AuthのGoogle providerを有効にしClient ID/Secretを設定する。AuthのSite URLをアプリのHTTPS originに、Redirect URLsを厳密な`https://<app-origin>/auth/callback`に設定する。ワイルドカードで任意サイトを許可しない。公開UIはGoogleだけを表示する。
3. `.env.example`を`.env.local`へコピーし、`VITE_SUPABASE_URL`と`VITE_SUPABASE_PUBLISHABLE_KEY`を設定する。publishable keyが推奨。旧anon JWT keyにも対応するがservice-role/secret keyはブラウザー設定で拒否する。
4. Supabase CLIの`link --help`、`db push --help`で現行引数を確認し、このアプリ専用のproject refへlinkする。`supabase/migrations`を順番に適用する。初期schemaの`20261006132251_project_storage_security.sql`に加えて、版付き画像の`20261006143949_versioned_thumbnails.sql`が必要。無関係なプロジェクトに適用しない。
5. Edge Function用secretに`APP_ORIGINS=https://<app-origin>`を登録し、`delete-account-data`をdeployする。複数originはカンマ区切り。`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`はSupabaseのサーバー環境で使用する。VITE変数や公開ファイルに置かない。
6. ローカルSupabaseはDockerと本プロジェクトのconfigを使用する。API 55321、DB 55322、Studio 55323、shadow DB 55320の独立ポートにしている。既存の543xx環境をresetしない。`supabase start`後、`supabase db reset`でローカルマイグレーションを適用して検証できる。Googleローカル認証を使う場合のみconfigのGoogle sectionを有効化し、環境変数を設定する。

ローカルのSite URLは`http://127.0.0.1:5174`。許可callbackはVite開発5174・preview4174それぞれの`http://127.0.0.1:<port>/auth/callback`と`http://localhost:<port>/auth/callback`を完全一致で登録している。

開発サーバーで両Supabase環境変数がない場合、または明示的な`VITE_DEMO_MODE=true`の場合は、UIで端末限定のおためしを表示する。Google認証を装わず、ログアウト後は`signIn('demo')`で再開する。DEVで片方だけ設定された場合も設定エラーにする。

## PKCEとアカウント

Supabase JSのPKCEを使用し、OAuth開始時のredirectToは現在originの固定`/auth/callback`。任意のreturnTo/nextは受け付けない。callbackだけでコード交換し、成功・失敗ともURLからcodeとエラーを履歴置換で取り除く。queryとfragment双方のerror/error_code/error_descriptionを認識し、provider由来の文章は表示せず固定の案内へ変換する。SDKが同じブラウザーに保持するcode verifierが必要。認証エラー後もログインをやり直せる。

アプリが保存するユーザー情報はAuthのuser UUID。独自profilesへメールやGoogle tokensを複製しない。表示名は表示専用で、権限判定にuser_metadataを使わない。端末でのセッション読取はオフライン表示にも利用するが、サーバー権限は常に検証済みJWTのauth.uid()とDB内の現存ユーザーを使う。

期限切れアクセストークンでも、SDKの既存ストレージに利用者とrefresh tokenが残る場合は端末作品用の`offline`状態で起動できる。これはブラウザーに保存された所有者情報であり、サーバーで検証済みの認証とは区別する。クラウド操作は停止し、再接続時にSDKの更新とgetUserによる確認を行う。一時的な通信失敗では所有者を保持し、失効応答と明示ログアウトでは解除する。ログアウト時のAPIは開始時のJWTを固定し、端末認証の削除も期待する所有者と一致するときだけ実行する。SDKが使う既存の公開用クライアントでlogout APIを呼び、管理用secretは使わない。

参照: [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)、[OAuth JS API](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)。2026-10-06にChangelogと現在のAPIを確認した。

## DB/RLS

- `public.projects`はRLSを有効化し、SELECTは`(select auth.uid()) = user_id`。owner＋updated_atとowner＋liveのインデックスを持つ。
- 直接のINSERT/UPDATE/DELETEをauthenticated/anonへ与えない。version・上限を回避するREST更新も拒否する。
- 公開のsave/delete RPCはSECURITY INVOKER。権限が必要な実装は非公開private schemaのSECURITY DEFINERに限定し、空search_path、明示的なEXECUTE grant/revoke、auth.uid検査を持つ。
- private.accountsはユーザー行ロックと0～500制約付きカウンター、削除フラグを持つ。private.operation_receiptsはuser＋operation UUIDごとの再送結果を保持する。両方RLS有効、一般利用者に表権限なし。
- 保存payloadのuserIdをJWT userと厳密一致させ、既存UUIDの所有者も検査する。versionはDBが決め、stale版は結果を返して拒否する。余分なUI属性は正本に入れない。
- 他ユーザーのUUIDを指定した読取・更新・削除、owner変更、直接version変更はテストで拒否を確認している。

参照: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)。

## Storage

`thumbnails`は非公開bucket。512KiB、image/webpまたはimage/pngに制限。WebP生成に対応しないブラウザーではPNGを使用する。パスは`<auth-user-uuid>/<project-uuid>.v<server-version>.thumb`、Content-Typeに実際の形式を指定する。SELECT/INSERT/UPDATE/DELETEの全操作に所有者制限を付け、UPDATEはUSINGとWITH CHECKの双方を持つ。INSERTとUPDATEは現存する所有作品に加えて、パスのversionとDBの現行versionの一致を要求する。旧版・未来版・版なしパスへの書き込みは拒否する。旧`.thumb`/`.webp`は所有者が整理できるよう読取・削除のみ許可し、アプリは新版画像として採用しない。upsertに必要なSELECT/INSERT/UPDATEを網羅する。公開URLは生成せず、ユーザーの認証でdownloadする。

新しい画像の保存後に古いversionを整理し、並行アップロードされたさらに新しいversionを削除しない。画像が未送信なら未取得として状態から描画するため、状態と画像の二段階保存で旧画像を新版と誤認しない。作品削除は全version、アカウント削除はユーザーの全画像をページ単位で除去する。

Storageのポリシー関数はユーザー行を共有ロックする。アカウント削除の排他フラグ更新が、既に許可されたStorageトランザクションの完了を待ってから新規アップロードを拒否する。削除の後から既存アップロードがDB上に戻る経路を防ぐ。

参照: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)。

## アカウントデータ削除

UIの明示確認後に実行する。オフラインでは開始しない。開始時に端末の永続削除フラグを立て、別タブの新規作成・保存・復元・設定変更をトランザクション内で拒否する。クラウドの削除完了前に端末データだけ消して成功扱いしない。

Edge Functionは許可origin、POST、Bearer token、`DELETE_MY_DATA`、UUID形式の`expectedUserId`、1024byte以内の本文を検証する。getUserで現在のidentityを確認し、期待IDとJWTのsubjectが一致しなければ副作用前に403を返す。bodyのIDで削除対象を選ばない。署名検証によるpending/done再開でも同じ照合を必須にする。クライアントは確認時の所有者と認証世代を保持し、各待機後に照合する。送信JWTも固定し、切替時はAbortSignalで送信を中断する。処理順はDBの削除フラグ → Storage全ページ削除 → projects/受領記録削除 → 全refresh session失効 → Auth user削除。Auth userの削除後は既存JWTが期限内でもDB側のユーザー存在確認により再作成できない。

別タブの削除開始通知では共有認証を消さず、編集と同期だけを停止する。削除完了後に対象所有者の端末認証を片付ける。API待ちの間に別利用者へ切り替わっても、その利用者の作品・認証は削除しない。改訂したEdge Functionとクライアントを配備する必要がある。旧クライアントの期待IDなし要求は新しい関数で拒否される。

途中失敗は削除フラグを残して再試行可能。署名・期限を検証したtokenは、既に開始したpending/done削除の再開にだけ使える。削除済みAuth userに対する応答紛失もdoneとして扱い端末cleanupへ進める。推奨の非対称JWT signing keysで検証する。古い対称署名環境でAuthが失効後tokenの署名検証を返せない場合は管理者による削除再開が必要となる。サービスロールだけが`account_deletion_state`と`finish_account_deletion`を呼べる。

個別削除のtombstoneと再送受領記録は、古い端末の復活防止と曖昧な通信失敗からの復旧に必要なので通常の同期では期限削除しない。アカウントデータ削除ではすべて消す。長期運用での受領記録サイズ監視は必要。

## 実施した検証と外部接続後の確認

`tests/rls.test.ts`は実際のSQL migrationをPGlite/Postgresで実行する。Auth/Storageの基礎schemaのみfixtureとして用意し、authenticated/anon/service_roleへ切り替えて、RLS、CAS、500件、上限後の既存編集・削除、tombstone、Storage全操作、削除フラグ、EXECUTE権限を検証する。SQLの文字列一致テストではない。

`tests/sync-audit11-sql.test.ts`は実際の保存サービスとfake-indexeddbをこのSQL/RLS境界へ接続する。上限で失敗した新規作品を残しながら既存500件を取得・更新・削除し、空き枠への再送が成功すること、499→500件で他タブが競合退避した後も編集中の作品を保存できること、64項目の利用者metadataを変更せずSQLへ保存・再復元できることを確認する。編集先の対応は利用者ごとの内部IDBストアに置き、認可やクラウドpayloadには使わない。

`tests/sync-audit11-retry-sql.test.ts`はSQLコミット後の応答だけを破棄し、未確認操作を永続再送する経路を検証する。1/499/500件、追加編集、再起動、削除の連鎖、実際の他端末競合を含む。`tests/sync-audit11-retry.test.ts`はA→B→Aの世代境界と、Aの未確認送信がBの作品一覧へ入らないことを検査する。送信内容を固定したローカル記録は認可の代用ではなく、RPCのJWT所有者検査とRLSは従来どおり必須である。

`tests/persistence-auth.test.ts`はSDK境界をmockし、PKCE設定、固定callback、コード除去、秘密キー拒否、認証失敗後の再試行を実行する。`tests/persistence-account.test.ts`は本番と同じHTTPハンドラーを通し、期待ID不一致（通常・pending・done）、なりすましbody、origin、token、本文、バッチ削除、失敗・再開の副作用を検証する。`tests/persistence-auth-races.test.ts`は実SDKとHTTPスタブを使い、削除の各待機点・2タブ・期限切れオフライン起動・失効・復帰を検証する。2026-10-07に現在のSDK実装と[redirect/errors仕様](https://supabase.com/docs/guides/auth/redirect-urls)、[Authセッション仕様](https://supabase.com/docs/guides/auth/sessions)を再確認した。

本環境では本アプリ専用の実Supabase/Google Credentialsを提供されていないため、実Google往復ログイン・配備済みEdge Function・実Storage HTTP・複数Postgres接続の同時quotaは未検証。実資格情報設定後、A/Bの別アカウントと二端末でこれらを実行し、`supabase db advisors --linked --type all --fail-on error`を確認する。今回のローカルadvisors試行は他アプリの54322環境だったため、この実装の検証結果として扱っていないし、そのDBを変更していない。

## 削除応答喪失後の端末消去回復（A14-01実装修正）

削除の明示確認後、要求送信前に `deleted:<user UUID>` のローカルjournalへ対象所有者・同意・同意日時を記録する。クラウド側の状態（`unknown` / `confirmed` / `not-required`）と端末側の状態（`pending` / `complete`）を別に持つ。サーバーの成功応答が得られた時点でクラウド完了を永続化し、その後の端末消去失敗と区別する。準備中だけの `preparing` 記録は端末回復の同意に使わない。旧版の `requested` 記録は、従来の明示確認後に作られた削除依頼として移行する。

起動時の回復は認証初期化とは独立して実行する。過去に要求済みのjournalがある対象だけ、作品・サムネイル・設定・編集先対応・同期leaseを同じIndexedDBトランザクションで消去する。途中失敗ならすべてロールバックし、次回起動と画面上の再試行に残す。journal自体は消さず、古いタブが編集中の作品を再保存することを防ぐ。同期の取得結果を取り込むトランザクションも削除journalを検査するため、通知を取り逃したタブの遅い取得応答からデータを再作成しない。

この回復は、過去の対象所有者について端末にあるデータを消す処理だけである。クラウドAPIやlogoutを実行せず、現在のBアカウントの作品・設定・認証情報は変更しない。新たなクラウド削除の認可には使わない。ログイン前にも復旧結果と再試行を表示し、クラウド状態が `unknown` なら「クラウド側の削除完了は確認できていません」と明記する。端末消去だけでアカウント全体の削除成功とは表示しない。

`tests/persistence-deletion-recovery.test.ts` は、実Supabase SDK・HTTPスタブ・IndexedDBで成功応答喪失→終了→2時間経過→`refresh_token_not_found`→ログイン不能の元の残存を再現したうえで修正を検証する。Bの認証保持、2タブ同時回復、消去途中失敗と再起動、クラウド完了記録の保持、認証初期化失敗、旧journal、対象不一致・未同意の拒否、遅い同期応答を含む。`tests/ui-deletion-recovery.test.tsx` は実サービスとReactで未ログイン/Bログインの再試行・状態表示を確認する。外部Supabaseは変更していない。これは実装側の回帰検証であり、独立監査の再判定ではない。

## 設定復元・部分更新の所有者と寿命（A03-03 / A03-05実装修正）

設定変更は操作した項目だけをIndexedDBトランザクション内で既存値へ合成する。初回設定読込中や別タブからの同時変更でも、操作していない項目を画面初期値で置換しない。設定保存とバックアップ復元のコミット後に所有者付き通知を発行し、AppProviderが購読する。設定画面を離れた後の同一アカウントの復元も表示・音・演出へ反映される。復元ダイアログの寿命は通知の条件に使わない。

設定保存・バックアップ復元は呼出時の利用者と認証世代を固定し、最初の待機、ファイル読込、トランザクション内の書込前に確認する。A→B→Aも以前の操作の続行には使わない。AppProviderは保存先の確定値と未完了の操作差分を分け、後着した古い応答や失敗で別アカウントの設定を戻さない。初回読込中の保存失敗でも、読込が返した既存設定を回復できる。

`tests/ui-settings-consistency.test.tsx` は実React画面・IndexedDB・遅延ファイル/設定読込で復元中の離脱・再入場、初回読込前の1/2項目変更、保存失敗、A→B→Aを検査する。元の復元表示不一致と未操作設定上書きは修正前に失敗を確認した。`tests/persistence-settings-consistency.test.ts` は2タブの部分更新、呼出直後の所有者切替、復元コミット通知の所有者分離を確認する。

## 読み取れないローカル作品の保全

作品は読み出し時に行単位で検証する。読み取れないpayloadと未確認の送信snapshotは元の行に保持し、編集と同期を隔離する。正常作品の一覧・保存・バックアップは継続し、ホーム・一覧・設定に回復案内を表示する。正常バックアップに含めなかった行は `excludedUnreadableRecords` に列挙する。元データは所有者と認証世代を確認して個別出力でき、利用者が明示した場合だけ端末から整理できる。隔離行を遅い同期応答や別アカウントの操作で上書き・削除しない。詳細と検証は `audits/19-unreadable-resolution.md`。
