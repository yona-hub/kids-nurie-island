# アーキテクチャと技術選択

## 境界

Reactが画面と一時的な操作状態を管理し、Canvas描画は独立したColoringEngineへ委譲する。projectデータにzoom、pan、開いているパレット、演出、履歴は入れない。認証・永続化・同期はReactに依存しないserviceとして提供する。

`apps/web → content-schema / coloring-engine / persistence → shared-types`。制作ツールは同じschemaを出力し、実エンジンを検証画面で再利用するが、制作解析コードをアプリに含めない。

2026-10-09の改善候補はPaintingProfile version 3で分岐する。元IDのlegacy、配信済みv2を凍結した専用renderer、共有Bezierとviewport tileのv3を分離した。Project/RegionPaint/schemaとIndexedDB version 3/migration 3件は維持する。改善コピーは元作品へ書き込まず、明示したregion/scene対応だけを別作品へ原子的に保存する。新geometry・原本・配信URL・rendererの同一性と旧pixel oracleを検証する。新採用と全体品質ゲートの状態は [統合計画](storybook-improvement.md) に記録し、旧版PASSを新版へ転用しない。

## 技術の比較

| 採用 | 判断 | 比較した選択肢 |
| --- | --- | --- |
| Canvas 2D + Path2D | 閉領域ベクターの充填、合成、PNG出力が標準APIで可能。WASM初期化やGPU依存を増やさず、必要領域だけ再構築できる。主要ブラウザへ展開しやすい。 | CanvasKit/Skiaは高度な描画には有効だが、この領域塗りではWASM転送と初期メモリの増加に見合わない。WebGLはGPU管理とブラウザ差分の負担が大きい。 |
| React + TypeScript | UIの状態と責務を明示し、描画・保存型を共有。CanvasピクセルをReact stateに置かない。 | SVGを全領域Reactノードにする方法は触りやすいが、素材効果・高解像度出力の同一性と描画負荷の管理をCanvasへ統一した。 |
| Vite | ローカル開発と静的配信、遅延ロードを単純に構成できる。 | SSRは非公開の作品アプリには必要なく、運用と認証境界を増やさない。 |
| IndexedDB + idb | トランザクションとBlob、インデックスを使える。操作ごとの保存をDOM描画から分離。 | localStorageは同期ブロック、小さい容量、トランザクション不足から作品保存には不適。 |
| Supabase Auth/Postgres/Storage | ユーザー認証、所有者権限、CAS、上限検査をサーバーでも強制できる。 | 独自認証やブラウザのuser_idだけに頼ったアクセス制御を作らない。 |
| Workbox + vite-plugin-pwa | アプリshellのプリキャッシュと、数を制限した素材キャッシュを分離。更新を編集中に強制しない。 | 全420線画のプリキャッシュは初回転送と端末容量を圧迫する。 |
| 画像生成原画 + Python/OpenCV | 初期10枚は画像生成した白黒原画。制作時に二値化・小切れ補正・Connected Components・contours・QAを実行し、閉領域と元の黒線を別々のパスへ確定。 | 実行時flood-fill/領域推論は操作待ち、端末差、漏れの原因になるため採用しない。 |

直接依存を固定しlockfileを管理。アプリで配布するOSSのライセンス全文は `apps/web/public/legal/third-party-notices.txt`、一覧は `oss.json`。UIはsystem Japanese fontsを使用し、外部フォントの取得を必須にしない。

## データと責任

- クラウド: 作品状態の正本。独立したuser_idで所有者を識別する。Googleのメールをprofilesに複製しない。
- IndexedDB: 即時保存、同期待ち、再編集、サムネイル。アカウント間で分離する。
- Cache Storage: 再取得可能な公式素材だけ。認証APIや非公開作品レスポンスをService Workerにキャッシュしない。
- Canvas: fixed template + region paint + background/frameから描画。完成PNGは都度出力し、正本にしない。

作品サムネイルは作品versionと素材renderKeyの両方で識別する。renderKeyは実際に解決したTemplate全体・背景/枠の不変URL・描画規則の識別子のSHA-256。素材だけを更新した場合も旧画像を再利用しない。Galleryは取得と再描画で同じ解決済み素材を使い、Editorは開いている素材のkeyを付ける。Storageは所有者フォルダー内の`project.vVERSION.rSHA256.thumb`へ保存し、古い素材の遅延送信が新素材画像を置き換えない。作品の色データやversionを派生画像の更新のために変更しない。

## 420枚への拡張

12テーマと最終配分を固定。catalogは軽いメタデータだけ。線画JSON、サムネイル、背景、フレームはURL単位で取得する。公開前に制作QAと承認を要求する。最大500件というユーザー作品上限は公式線画数と無関係で、DB側でも強制する。

初期10枚に主題のない「たべもの」「おもちゃ」は空状態を表示し、他の島へ移動できる。制作準備を未実装の架空作品で埋めない。

## 本番とローカル開発

本番はGoogle認証のみ表示。将来のproviderはAuthAdapterに追加する。資格情報のない開発サーバーのみローカルのおためしを明示し、Googleログインの成功を装わない。`build:demo`は別出力先へビルドし、通常の本番成果物へ混ぜない。

## 参照した一次資料

- [Supabase Google認証](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vite PWA injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest)

具体的なコード・性能値は coloring-engine.md、sync.md、pwa.md、testing.md に分ける。
