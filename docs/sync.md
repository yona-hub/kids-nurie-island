# 保存と同期

`packages/persistence` が認証、IndexedDB、同期、バックアップを担当する。UIは状態を即時更新し、`projects.save()` を待って操作を止めない。Promiseが解決した時点でIndexedDBトランザクションが完了している。端末保存に失敗した場合はPromiseをrejectし、`sync.status.localSaveFailed` をtrueにする。「この端末に保存済み」と表示してはいけない。同じ作品の保存に成功するまで、別作品・サムネイルの書き込み成功では解除しない。

## API

```ts
const services = createServices({
  supabaseUrl, publishableKey,
  development: import.meta.env.DEV,
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
});
await services.ready;
const project = await services.projects.create({ templateId, title });
const saved = await services.projects.save({ ...project, regions }, { immediate: false });
await services.thumbnails.set(saved.id, webpBlob, saved);
await services.sync.flush();
```

`auth.session` / `subscribe` / `signIn(provider)` / `signOut`、`projects.list/get/create/save/delete/duplicate/count/subscribe`、`settings.get/set`、`backup.export/import`、`deleteAccountData(expectedUserId)` を公開する。全データ削除には確認画面が保持する利用者IDを必ず渡す。`dispose()` はイベント購読、チャネル、タイマー、DB接続を閉じる。Reactの再描画ごとにサービスを作らず、アプリに1インスタンスを持たせる。

作品オブジェクトのSymbol属性に端末の保存revisionと編集の世代を付ける。object spreadで保ち、JSONには含めない。UIはsaveの戻り値を使う。連続操作の古いPromiseが後から解決しても、新しいUIのregions/background/frame/statusを上書きしない。自分の連続保存はIDBの直列トランザクションとして扱う。他タブの古い編集は別作品へ保存し、同じ編集画面から続く連打をその複製にまとめる。

削除は`projects.delete(expectedProject)`へ、確認開始時に表示していたProjectをそのまま渡す。IDだけの削除は受け付けない。サービスはIDBトランザクション内でrevisionと作品内容を照合し、更新されていれば`PersistenceError.code === 'CHANGED'`で拒否する。UIは最新版を取得して表示し、削除確認を取り直す。購読で表示を更新するだけでは確認ダイアログ中の変更を保護できないため、この比較をサービス側で必須にしている。

## 正本とデータ

I17の新版でも`Project`/`RegionPaint`保存schema、IDB version 3、SQL migration 3件を維持する。描画世代とまとめ塗り/部分塗りは既存metadataで識別し、旧作品は元template/rendererで表示する。「改善版をつくる」は新template IDへ制作対応表で色・画材をコピーした別UUIDの作品を作る。車から除いた顔5領域の色は捨て、窓や車体へ再割当しない。500件上限・容量不足・transaction abort時は元作品を保持する。今回の実SDK同期検査は非demo source previewと隔離SQLの範囲であり、本番build/外部同期を検証済みとしない。

Supabaseの作品状態が正本。PNGは書き出し専用。正本は共有`Project`型のホワイトリストで、Undo・zoom・pan・パレット・アニメーション状態を含めない。画材は領域単位に保持する。設定はユーザー別の端末設定で、JSONバックアップに含める。

IndexedDBのprojectsは`userId:projectId`、settingsは`userId`、thumbnailsもユーザー別キー。サムネイルは作品状態と別ストアで、512KiB以下のWebPまたはPNGを受け付ける。WebKit環境のBlob保存失敗を避けるため、トランザクション開始前にArrayBufferへ変換し、バイト列とMIME形式を保存する。APIはBlobを返し、旧Blob形式の行も読み出せる。ユーザー切替の途中で完了した読み取りも、新しいアカウントに前ユーザーのデータを返さない。

IDB schema version 3はprojects/thumbnailsの`by-pending-user`索引と、競合後の編集先を保持する`editorRoutes`ストアを持つ。dirty変更と索引の`pendingUserId`を同一トランザクションで更新し、未同期件数は`getAllKeysFromIndex`の和集合で数える。塗るたびに全作品・全サムネイル本体を読み出さない。同期処理も送信待ちの画像だけを個別取得する。v1からの更新時に索引を再構築し、出典versionが分からない旧サムネイルの世代対応を無効にして状態から再描画する。v1/v2の作品には内部の編集世代を追加する。作品状態と削除待ちは失わない。

退避先の対応は利用者ID・原本ID・編集世代・編集タブのwriterをキーにし、コピー作成と原本の更新と同じIDBトランザクションで保存する。同期担当のタブではなく実際の編集タブを引き継ぐため、別タブによる競合処理や同期担当の交代後も、元IDを持つ連続保存は同じコピーへ進む。コピーがさらに競合した場合は対応を順にたどる。新しく読み直した原本には別の編集世代を付け、古い画面から続く保存と区別する。利用者metadataへの`preservedFrom`追加は行わず、すべてのキーを保持する。派生作品も`validateProject`を通す。この内部対応はクラウドpayloadとバックアップには含めず、全データ削除時には対象利用者の対応も削除する。

`projects.save()`はIDB requestの成功とtransactionの確定を区別する。編集先対応の書き込み後に認証世代が変わった場合や、続く作品書き込みで容量例外が起きた場合は、transaction全体をabortし、終了を待ってから保存失敗を返す。最後の作品requestの成功後にも所有者を確認するため、A→B→Aも同じ世代とは扱わない。存在しないコピーを指す対応だけを残さず、Aで原本を開き直した後の保存を妨げない。通常の成功はこれまで通りtransaction確定後に返す。

個別作品を削除しても編集先の対応はtombstoneと同様に保持する。元作品が残っているときにコピーへの対応だけを消すと、古い画面の次の保存が第三のコピーを作り、削除した編集を復活させてしまうためである。対応先のdeleted行を見て`DELETED`で拒否する。全データ削除ではその利用者の対応も全件消し、別利用者の対応は変更しない。

## 同期手順

1. 作品とdirty状態、operationId、端末revision、承認済みbaseVersionを同じIDBトランザクションで保存する。
2. 最後の変更から1500msで同期する。完成、ホームへ戻る、背景・フレーム変更はUIがimmediate/flushを呼び、サービスもvisibilitychange/pagehide/onlineで試行する。
3. ユーザー別IDBリースを取り、削除待ちを先に送る。リースは30秒有効、10秒ごとに更新する。別タブが停止しても再開できる。各リクエストは15秒で中断する。
4. 通信開始前にProject行の`pendingCommit`へ送信内容・operationId・expectedVersion・削除状態を保存し、IDB commitを待つ。`save_project` / `delete_project` RPCはexpectedVersionを照合する。DBはversionを採番し、operationIdの受領記録により「コミット後に応答だけ失われた」再送も同じ結果にする。
5. 追加編集・削除は最新のローカル状態を更新し、送信済み未確認の`pendingCommit`は置き換えない。再起動や同期担当交代後も、まず同じoperationIdと同じpayloadを再送して受領記録を回収する。baseVersionの前進と`pendingCommit`の解除は一つのIDBトランザクションで行い、その後に最新編集・削除を新しいversionから送信する。古い応答で追加編集のdirtyを消さない。DBが書込拒否を確定した`PROJECT_LIMIT`は未確認扱いを解除できるため、その新規作成を取り消す削除が永遠に待機することもない。
6. 古い端末の更新は元UUIDのクラウド版を保護し、ローカル変更を新UUIDの「別の作品」に保存する。編集中画面はその保存先で続行できる。
7. クラウド一覧はUUIDのkeyset paginationで取得。削除は明示的なtombstoneだけを採用する。並行追加中のページ一覧に見つからないだけで端末キャッシュを消さない。
8. サムネイルは端末revisionが一致する画像だけを、承認済みクラウドversionの`userId/projectId.vVERSION.thumb`へアップロードする。取得もそのversionのパスだけを使い、旧版へフォールバックしない。クラウド取得キャッシュはsource/versionを記録する。状態の同期が画像より先に終わった場合、対応画像は未取得として作品状態から再描画する。画像取得中に作品が変わった場合も結果を破棄する。
9. 新版サムネイルのアップロード後はより古いversionと旧形式パスをページ単位で整理する。並行送信された新しいversionは消さない。個別作品削除はその作品の全版、アカウント削除はユーザーフォルダーの全画像を削除する。

通信失敗時はoutboxを保持し、2秒から最大60秒の間隔で再試行する。通常の同期成功は表示不要。syncingは「保存しています…」、offlineは端末保存済みと再接続後の同期を表示する。オンラインの失敗は端末保存済みと再試行を表示する。localSaveFailedは例外で、未保存の警告を優先する。

送信エラーは項目単位で保持し、後続の更新・削除・一覧取得・送信可能な画像処理を続ける。同じoperationIdの失敗を1回の同期で繰り返さず、削除成功で容量が空いた場合はその同期内でも再試行できる。クラウドが500件で新規送信に失敗しても、既存の500件を端末へ取り込み、整理する作品を選べる。失敗した項目のdirtyとoperationIdは残る。

取得要求は送信待ち件数と分け、利用者IDと認証世代を付けて予約する。同期中の切替やflush要求は現在の同期の終了後に処理するため、Bの未同期件数が0でもクラウド一覧を取得する。A→B→Aでは最初のAの応答を新しいAの世代へ適用しない。応答後の未確認操作の承認・競合退避は認証世代と同期リースの所有者も照合する。古い同期で結果を適用できなかった送信は、対象所有者の未確認操作として端末へ残る。同じ利用者のtoken更新では世代を変更せず、同時flushを一つの処理へまとめる。

`pendingCommit`はv3行の任意の内部フィールドで、既存のv3作品は最初の送信時に作成する。クラウドpayloadとバックアップへは含めず、作品行と一緒に利用者別に保持・削除する。バックアップには利用者の最新編集を出力する。

認証の`session.offline`は、SDKが端末に保持していた所有者の作品を扱う再認証待ち状態。`localOnly`はfalseのままにし、オフライン編集もdirty/outboxへ保存する。接続できない間はSDKの認証ストレージ読取にセッションを渡さず、期限切れトークンの更新待ちで起動を止めない。ブラウザーがonlineと報告しても最初の一時的な通信失敗で端末表示へ移る。onlineイベント、同期の再試行、2〜60秒の認証再試行でSDKの更新と`getUser`を実行し、本人確認後にクラウド同期を再開する。明示ログアウト・認証失効では端末の認証所有者を解除する。ローカル所有者情報からクラウド権限は付与しない。

## 500件、削除、バックアップ

500件上限は途中と完成の合計。新規・複製・復元は端末でもトランザクション内で数える。サーバーではユーザー別行ロックとカウンター更新で同時リクエストにも上限を強制する。上限でも既存の編集・表示・PNG出力・削除が可能。

500件時に別端末の変更を退避する空きがなければ、クラウドを更新せず、端末のdirty状態をそのまま保持して整理を案内する。作品を1件削除して同期すると削除を先に処理し、空いた枠に退避作品を保存する。自動削除・黙った上書きはしない。

初回取得前や別端末が最後の枠を使った場合、クラウド500件と端末の未送信作品が重なり、端末の一覧が一時的に501件以上になることがある。これは保留作品を失わないための保持であり、サーバーの500件制限や新規・複製・復元の上限は緩めない。既存作品の閲覧・編集・PNG出力・削除と保留作品の再送は続ける。JSONバックアップの上限は500件なので、超過時のexportは説明付きの`LIMIT`で拒否し、作品は削除・切捨てしない。作品一覧で確認して500件以下に整理すると、通常のexport/importに戻る。exportも共通schema検証を通し、再読込できないJSONを成功として返さない。

作品削除もoutbox内に残す。サーバーのtombstoneは作品数に数えず、古い端末の作成・保存で元UUIDが復活することを防ぐ。新しいクラウド版に対する古い削除は取り消して新しい作品を表示する。ユーザーがそれを確認して再度削除できる。

全データ削除は期待する利用者IDと認証の世代を固定する。同期完了待ち、SDKの認証取得、ローカル削除、認証の片付けの間にA→B・ログアウト・A→B→Aが起きれば中止する。別タブへの`account-deleting`通知は編集と同期を停止するだけで、共有認証を消さない。サーバーへの送信前に取り消した削除準備は、自分が所有するフラグだけを解除する。送信済みの削除が失敗した場合はフラグと認証を保持して再試行できる。完了通知後の認証解除も対象所有者を照合し、別の利用者のセッションを消さない。

バックアップは`kids-nurie-island` schemaVersion 1のJSON。最大128MiB、作品500件、1作品256KiB、領域2048、metadata64項目を上限とし、色・画材・ID・日時・型・危険なキーを検証する。標準出力はコンパクトJSONなので最大500件を再読み込みできる。復元は全体を先に検証し、新UUID・現在のユーザーID・version 0で追加する。既存データは上書きせず、復元と並行する作成にも合計500件を守る。サムネイルは派生物のため含めず再描画する。

ブラウザーがIDBデータを消した場合や端末自体を失った場合、未同期の状態は復元できない。アプリはユーザーへのバックアップ導線を持ち、IDB成功前に保存成功を表示しない。ページ非表示時のネットワーク完了はブラウザーの停止条件に依存するため、outboxを次回起動で必ず再送する。

## 検証

```sh
npx vitest run tests/persistence.test.ts tests/persistence-auth.test.ts tests/persistence-account.test.ts tests/sync.test.ts tests/rls.test.ts
npx vitest run tests/persistence-audit02.test.ts tests/persistence-cloud.test.ts
npx vitest run tests/persistence-auth-races.test.ts
npx vitest run tests/sync-audit11.test.ts tests/sync-audit11-sql.test.ts
npx vitest run tests/sync-audit11-retry.test.ts tests/sync-audit11-retry-sql.test.ts
npx vitest run tests/persistence-save-transaction.test.ts
```

fake-indexeddbで実際のIDB APIを通す。オフライン→再起動→再送、世代競合、送信中編集、応答紛失、削除、複数タブ、quota失敗、500件境界、破損復元、別ユーザー分離を含む。Auth callbackのSDK境界とEdge FunctionのHTTPハンドラーも実行する。SQL/RLSは実際のマイグレーションをPGlite/Postgresで読み込み、authenticated/anon/service_roleへ切り替えて検証する。

監査A02-01/03/04は修正前に3件とも失敗を再現し、修正後は表示より新しい版の削除拒否、画像送信遅延・失敗・再起動時の旧画像不採用、500作品×64KiB画像を持つ状態で3回保存してサムネイル一括読取0回を検証する。Storage adapter検査は実Supabase SDKのHTTP境界を使い、版付きパスと複数ページの旧版整理を確認する。これは実機Androidの操作時間・FPS測定の代替ではない。

監査A09-01とA10-01〜04の回帰検査は実Supabase SDK、共有localStorage、BroadcastChannel、fake-indexeddbとHTTPスタブを使う。同期中・API直前・API応答後のアカウント切替、2タブでの削除停止と503後の再試行、期限内／期限切れのオフライン起動500ms以内、編集と再接続、通信状態イベントなしの自動復帰、明示ログアウトと認証失効、callbackポートとquery／fragmentエラーを検証する。期限の短い起動検査はネットワーク待ちを検出するための統合テストで、端末の性能計測ではない。

監査A11-01/02/03は修正前に6検査の失敗を再現した。fake-indexeddbでは初回500件、最後の枠の競争と後続更新、同期担当交代、連続保存、二つの編集タブ、繰り返す退避、削除済みコピー、v2からの移行、全データ削除時の所有者分離、63/64項目と利用者の`preservedFrom`を検査する。501件ではexportを明示拒否し、整理後の500件export/restoreまで確認する。PGlite統合は現行マイグレーションとauthenticated/RLSを通して本物の`PROJECT_LIMIT`、500件からの削除・復旧、499→500の編集継続、64項目の競合保存・バックアップ復元を検証する。

A11再監査の2件は、修正前に自己競合による2作品化とBの自動取得消失を再現した。追加の実SQL検査では1/499/500件それぞれで保存応答を2回失い、追加編集・再起動後に同一payload/operationIdの受領記録を回収し、元作品のversion 3へ最新の領域を保存する。保存後の削除待ち・削除応答の消失、真の別端末競合、上限で拒否された新規作品の削除も含む。認証切替検査はAの保存中/一覧中から送信待ち0件のBへの自動取得、A→B→Aの古い応答破棄、未確認操作の所有者分離、同一利用者のtoken通知、オフライン所有者の再認証後の自動取得を確認する。これらは実装の回帰検査であり、独立再監査のPASS判定ではない。

A11-04の追加検査は、fake-indexeddbのrequest/transactionを置き換えず、対応または作品requestのsuccessイベントで認証通知を発生させる。demo/cloudのA→B・A→B→A、対応書込後の容量例外は修正前10件の失敗を再現し、修正後は15件成功した。孤立対応の不在、原本の再読込後の保存、Bの作品・設定の不変、通常競合と連続8保存、499→500境界、同期担当交代を確認する。実ブラウザのIDB実装を操作した証拠とは区別し、詳細と修正前後のJSON結果を`docs/audits/11-save-transaction-resolution.md`に記録する。

外部接続前の残確認は`docs/security.md`に記載。PGliteは単一バックエンドなので独立Postgresセッション間の実際の待機時間や本番Auth/StorageのHTTP挙動を測定したものではない。
