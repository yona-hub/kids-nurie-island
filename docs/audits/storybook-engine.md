# 新版塗り絵：描画・保存・コピーの独立限定監査

監査日：2026-10-08（JST）  
判定：**LIMITED PASS（担当コードと以下の小規模検証）／新版全体の受入は未判定**  
未解決の確認済み所見：P0 0件、P1 0件、P2 0件。下記のP2所見は実装担当の修正後に独立再確認した。

## 範囲と根拠

`AGENTS.md`、`docs/storybook-improvement.md`、共通`harness-orchestrator`のcontext-policyを根拠に、次を確認した。

- `packages/coloring-engine/src/storybook-*.ts`、`renderer.ts`、`painting.ts`、関連する`canvas.ts`・`cache.ts`。
- `apps/web/src/components/ArtworkCanvas.tsx`、`pages/Editor.tsx`、`artwork-render.ts`、`artwork-source.ts`。
- `packages/persistence/src/index.ts`の改善コピー。呼出元を追うため`pages/Gallery.tsx`、content loader、scene builderも参照した。

プロダクトコード、承認記録、既存監査、原画は変更していない。全体unit、build、ブラウザ全体試験、性能測定、外部APIは実行していない。孫エージェントも起動していない。実装担当と並行して監査していたため、下記の局所再確認のhashと最終観測hashを記載する。後続変更へ無条件に判定を引き継がない。

旧版の`docs/audits/04-drawing-engine.md`は原文のまま保持した。監査時のSHA-256は`bb08f7889bac04b992a2aa38fb0d5e231277bcc258482ea0172662155cc9cb69`。旧報告のPASS・人間承認・実行結果は新版の根拠へ転記していない。

## 所見と独立再確認

### SBENG-01：同じ装飾画像を層数だけ取得・デコードする（元P2、解消）

旧`storybook-scene.ts`は全layerへ並列に`loadSceneImage`を呼んでいた。同URLの進行中Promiseをまとめていないため、初回の`color-dots-storybook-v1`は1種類の画像を20回fetch・20回decodeし、compositionが20個のImageを保持した。公開寸法から計算すると、同frameのRGBA相当は共有時0.994MiBに対し19.883MiB。decodedScenesのMapには最後の1個しか載らず、live composition参照をこのMapのbyte集計で代表できなかった。

修正後は`storybook-scene.ts:22`の呼出単位のURL→Promise Mapを使用する。実ソースをメモリ内でTypeScript変換し、fetch・CacheStorage・Image decode境界だけを置換した再確認で、20層／1URLが**1 fetch、1 decode、1 unique Image object**になった。signalは呼出単位で維持される。

必須修正は完了。再確認時の`storybook-scene.ts`は前後同hash：`51b72982fbcd965abc99971ca699be13b3045aec8f9b39c2699896fabdd56ade`。

### SBENG-02：manifest cacheの障害で取得済み画像も使えなくなる（元P2、解消）

旧`loadSceneAsset`は`cache.put`だけをcatchし、その後の`keys`・`delete`をbest effortとして扱っていなかった。画像取得成功後にmanifest Cache.keysへ`UnknownError`を注入すると、描画用データを返さずrejectした。

修正後の`storybook-scene.ts:27`は保存・列挙・削除をまとめてcatchする。再確認では同じCache.keys障害でも**fulfilled**。また、manifest Cache.put中にabortするfixtureでは、返却直前の`throwIfAborted`によって**AbortErrorでreject**した。旧実装ではこのタイミングのabort後にもfulfilledだったが、呼出元UIにも世代・abort guardがあり、ユーザーデータへの混入は確認していない。

必須修正は完了。再確認hashはSBENG-01と同じ。

### SBENG-03：一時的な画材読込失敗から同じ画面で復帰できない（元P2、解消）

導入途中の`ArtworkCanvas`はtemplate単位の画材Promiseを保持し、reject後も同じPromiseを利用した。実コンポーネントをjsdomへマウントし、描画エンジン・画像取得境界を置換したところ、paperだけの一時失敗後は3 loads／ready 0。その後に通信を復旧して保存だけ相当のrerenderを行っても再取得せず、frame IDを変更しても3 loads／ready 0のまま同じ失敗を再通知した。Editorの「保存をやりなおす」も読込effectを再実行しなかった。

修正後は失敗時に画材Promiseを破棄し、キャンバス内へ「読み込みをやりなおす」を表示する。読込エラーを保存失敗とは分け、`onLoading`で親の準備状態を戻す。独立再確認は次の通り。

| 条件 | loads | onLoading | onReady | onError | retry表示 |
| --- | ---: | ---: | ---: | ---: | --- |
| paperの一時失敗 | 3 | 1 | 0 | 1 | あり |
| 通信復旧後に明示retry | 6 | 2 | 1 | 1 | 消失 |

必須修正は完了。再確認時の`ArtworkCanvas.tsx`は前後同hash：`30426cf3a58703dce9b9530010e5c75cd64ffb5f2ecc7691d4aafd2b734542ca`。

### SBENG-04：まとめ塗り通知とscene変更で余分な描画・cache破棄が発生する（元P2、解消）

`Editor.paint`は即時`paintMany`後にstateを更新し、`ArtworkCanvas`のregions effectも同じ状態を通知する。旧`setScene`はこの通知を再描画し、背景・枠変更時も同じ画材を読み直して`setMediumImages`が全tile cacheを破棄した。

修正後の`storybook-engine.ts:41`は正規化後の同一paint状態を再描画しない。`setMediumImages`も同じ3画像参照なら無更新。`ArtworkCanvas`はtemplate単位の画材Promiseを使う。実StorybookEngineにno-op Canvas境界を注入した制御フロー確認で、6領域の肌グループを**1 paint／1 frame**で処理し、その後の同一regions通知＋同一画材通知は**追加frame 0／cache byte不変**だった。no-op Canvasの結果は視覚品質や実時間の証拠ではない。

必須修正は完了。現在のengine hashは下表に記載。

### SBENG-05：scene・画材待機中の画像出力と準備状態（元P2のコード経路所見、修正後確認）

読込開始を親へ通知しない経路では、完成作品のPNGボタンが以前のreadyを保持し、Editorのnavigation thumbnailもscene・画材未適用のengineを新しいrenderKeyで保存できた。修正後は`Editor.tsx:139`でthumbnail作成をcanvasReadyにより制限し、Editor・Galleryの両方が`onLoading`でreadyをfalseへ戻す。

実Editor＋実ArtworkCanvasをjsdomで使用し、描画・取得・保存境界を置換して画材Promiseを保留した。**完成ボタンdisabled=true**のまま「もどる」を押すと、**exportThumbnail 0回／thumbnails.set 0回**でホームへ移動した。未完成画像の新renderKey保存は発生しなかった。Galleryは`onLoading={() => setReady(false)}`とPNGの`disabled={busy || !ready}`をコードで照合した。Galleryの実ダウンロード競合は未実行。

Editor fixtureの前後hashは`696dee391765343511026bbec6df1a78d4753cf82dce834f1efdf5e5205ce913`。同fixture時点のArtworkCanvasは`f02ac85d222658ee562b662a7d7b4ccfa372bb8d97b984e64c922776b2f28a3e`。後続のArtworkCanvas変更後はSBENG-03のretryを別途再確認した。

## 保存・コピーの小規模実測

実persistenceソースをTypeScriptからメモリ内で変換し、独立したランダム名のfake IndexedDBへ保存した。実クラウド、既存作品DBは使っていない。

| 検査 | 結果と範囲 |
| --- | --- |
| 改善コピー | 元completed作品・元regionsは不変。新ID、draft、新template ID、明示scene対応、group modeで別作品を作成 |
| copy保存失敗 | projects.addへQuotaExceededErrorを注入。rejectし、作品数は2のまま。元作品も不変 |
| 部分モードと消去の再読込 | region modeを保存して1領域だけ残し、serviceをdispose/reopen。metadata.paintModeと消去した領域の不在を確認 |
| 499→500境界 | 改善duplicateを2回同時実行。fulfilled 1／LIMIT 1、最終500件 |
| 同期待ち | cloud.listを保留したin-flight同期中でも改善duplicateが500ms以内にlocal commit/resolve。クラウド完了を待たない |

`index.ts:648`の同一readwrite transactionで元作品読出し・上限・コピー追加を行い、例外時はabortする。auth generation／owner guardもcommit前に確認する。新schemaは追加しておらず、新旧作品の区別はtemplate IDとmetadataに保持する。実ブラウザのquota、端末DB移行、認証切替、クラウドCAS競合はこのfixtureでは未確認。

## 描画の確認と限界

- 全10個の現行paintingProfileを実validatorで確認した。wizardの肌6領域はgroup targetにまとまり、region modeは`r06`だけを返し、applyPaintsによるgroup消去は全6領域を消した。解剖・領域境界の全目視は別監査の対象。
- `storybook-texture.ts`はworld座標のrepeat patternを固定scaleで使う。group boundsに揃えた陰影・髪の流れを使い、毎回の乱数による質感変化は導入していない。瞳は専用処理で白い反射光を最後に描き、通常画材のtexture処理へ流さない。
- 既存の新版`three-media-review.png`を目視し、princess・magicの同色3画材を表示サイズで区別できることを確認した。`eye-review.png`ではprincessの1瞳を黒・青・淡色で確認し、白い反射光に以前の黒い輪を確認しなかった。これらは全10枚・全瞳・原寸PNGの受入を代表しない。
- wizard／pencil／640×800／DPR1／2倍だけ、native Canvasでviewport tileと全体snapshotのcropを比較した。x=-51／-51.25／-51.5、y=-130.5でseamの平均RGB差は0.168／0.387／0.451、その他は0.131／0.211／0.237。cacheは25,560,576 bytes。目立つ追加seamは確認しなかったが、ブラウザ実装の証拠ではない。
- tileは512＋両側2px bleedをworld座標で作成し、表示には内部512pxだけをコピーする。表示Canvasはviewportサイズ×DPRで、1〜4倍時にもfit bitmapを拡大する構造ではない。SurfaceCacheは32MiB上限。decodedScenesも別に32MiB上限であり、live composition・画材・表示Canvas・exportを含む総RAMが32MiB以内という意味ではない。
- `renderer.ts`はpaintingProfileなしのtemplateを旧Engineへ分岐し、新scene compositionを旧版へ渡す操作を拒否する。旧描画実装を保持している。旧版全作品の新固定buildによる画素互換検査は未実行。

## 未確認の受入項目

以下が未確認であり、LIMITED PASSから新版全体のPASSを導けない。

1. 最新固定buildで全10枚×1/2/4倍×DPR1/2/3の線・塗り・継ぎ目の実ブラウザ確認。今回読んだnativeテストの各倍率/DPRループは寸法・cache上限を確認するもので、全条件の画素品質を直接assertするものではない。
2. 全瞳の黒・青・淡色・消去、全髪・肌の漏れ、3画材の原寸と2048 PNGの全受入。
3. 最大グループのCPU4／DPR2の描画p95 100ms以内。UIのtapから表示までとengine.paintMany単体の時間を分ける必要がある。
4. 実Service Worker takeover前後のoffline再起動、scene manifestとdecor/media依存のcache eviction後、通信復旧時の実ブラウザretry、複数画面のロードキャンセル。
5. 実IndexedDB quota・schema移行・認証切替・複数タブ競合での改善コピー、最新固定buildの旧版render互換、Galleryのscene切替とPNG保存競合。
6. 外部認証、一般公開、実機性能、新hashへの人間承認。今回の監査はそれらを許可・実行・代替していない。

画材取得のPromiseはscene変更間で共有するためeffectのscene用abort signalを渡していない。アンマウント後の公開画材取得は継続し得る。instance／abort guardにより破棄済みengineへの適用は抑止されるが、遅延fetchの寿命・総メモリは固定buildのlifecycle検証で確認すべき事項として残す。

## 最終観測hash

2026-10-07T16:12:23Zのread-only観測。局所再確認の前後hashは上記の各項目を優先する。Git repositoryを確認できなかったため、Git diffによる不変の主張は行わない。

| ファイル | SHA-256 |
| --- | --- |
| packages/coloring-engine/src/storybook-engine.ts | 0579d6c632850cc9cf701c7970ee7a2c067c63454d8ccd4edfcc5e12aae7e75c |
| packages/coloring-engine/src/storybook-texture.ts | f24295dadd24f08a8c2188843f42329c42883986986d20529564aaef80ac1a44 |
| packages/coloring-engine/src/storybook-scene.ts | 51b72982fbcd965abc99971ca699be13b3045aec8f9b39c2699896fabdd56ade |
| packages/coloring-engine/src/renderer.ts | d47d81d980cd88d48c817461a8efac7568f5e59cebf9540441db12f6e7689419 |
| packages/coloring-engine/src/painting.ts | 83975809ef001abc87fe875fc715da787adf0d1374d77d9f78ae4fc86e819290 |
| packages/coloring-engine/src/cache.ts | 4dcbfa2625b5e15f670ee24f10a8da08c75023797c134e72966078299112732c |
| packages/coloring-engine/src/canvas.ts | 04d045efb7b3c7a7d4c309e7c77595b3d8badce8f331158c07a4569bb6536f32 |
| packages/coloring-engine/src/engine.ts | 27d96c7b006f69c8799987c4e30a461130787976c56106ef793acf980665d33f |
| packages/persistence/src/index.ts | fbbf8cca90d8780be60a22e97414e0aa4cd3da27d6cdb51ddf4d45835f752f82 |
| apps/web/src/components/ArtworkCanvas.tsx | 30426cf3a58703dce9b9530010e5c75cd64ffb5f2ecc7691d4aafd2b734542ca |
| apps/web/src/pages/Editor.tsx | 696dee391765343511026bbec6df1a78d4753cf82dce834f1efdf5e5205ce913 |
| apps/web/src/pages/Gallery.tsx | c53971781fd6c567c9fb300d7924dd0972aae6e84bc86445c26d57db3af050e5 |
| apps/web/src/artwork-render.ts | 05c85f3d37ac989078393d4d152c3b4c704e5feb59220b14fb828e3c386ca98d |
| apps/web/src/artwork-source.ts | 3504038e8b881aa1539cda3930ad132c8f9215cb3399700d7e431626459f6d14 |
| test-results/storybook-improvement/three-media-review.png | ac1f2c8218fd42d97910f91682209f8d97e34eb1b1152ffcb4d89969fdb75957 |
| test-results/storybook-improvement/eye-review.png | cc209f42514b3a29aa66aa079f249f57af46f8eff160f05965cb15c42415eb4e |
