**Agent 02 — 全体アーキテクチャ修正後再監査**

監査日：2026-10-07  
**判定：PASS（担当範囲）**  
**未解決の発見：0件。前回A02-05は解消。A02-01〜04の再発なし。**

対象：`C:\Users\yonaf\develop\app\キッズ塗り絵アイランド`  
以下のファイル位置は対象ルートからの相対パス。

**範囲と独立性**

`docs/product-spec.md`の担当分野・33〜36節、`docs/user-art-decisions.md`、指定された前回の担当報告を読み、現行ソースから再検証した。重点は責務分離、依存関係、420枚への拡張、素材取得・キャッシュ、作品・サムネイルの保存スキーマ。

他担当の監査報告は参照していない。実装・承認記録の編集、外部サービス変更、他エージェント起動は行っていない。

**実行結果**

| 検査 | 結果 |
|---|---|
| TypeScript：`tsc --noEmit --incremental false` | PASS |
| packages・App・素材描画・Gallery・Editor・SWのESLint：`--max-warnings 0 --no-cache` | PASS |
| 保存・同期・素材キャッシュ・サムネイル関連8ファイル | **50テストPASS** |
| 現行SQLを使った素材hash付き画像・作品versionのStorage検査 | **2テストPASS**。他10テストは対象外としてスキップ |
| 実ローダー・描画エンジン・永続化サービスを組み合わせた独自検査 | 線画・背景・フレーム更新の3条件すべてPASS |
| 500作品・500画像を配置した独自保存検査 | 画像本体の読み出し0回。詳細は下記 |
| 採用記録・原画hash・承認hash・公開gate | 10件一致、gate成功 |
| 公開素材URLのSHA-256照合 | 52件一致、不一致0件 |
| 承認後変更・技術承認だけの素材を拒否するgate検査 | メモリ内の20条件すべて拒否 |
| `http://127.0.0.1:4174`へのHEAD | HTTP 200 |

50テストの対象は、`persistence-audit02`、`persistence-cloud`、`thumbnail-assets`、`assets-cache`、`persistence`、`sync`、`engine-scene-cache`、`ui-thumbnail-lifetime`。Vitestは`--configLoader runner --no-cache`で実行した。

独自検査は標準入力から実行し、検証用変更・IndexedDB・クラウド・キャッシュをメモリ内に限定した。StorageのHTTP検査はSDKとスタブ、SQL検査はPGliteを使用した。

**前回所見の再検証**

| ID／前回Severity | 判定・根拠・再現条件の確認 |
|---|---|
| **A02-01／P0** 古い表示から新版を削除 | **解消を維持。** `packages/persistence/src/index.ts:583`で表示時点のrevisionと内容を照合し、変更済みなら削除を拒否する。`apps/web/src/pages/Gallery.tsx:517`は確認対象のProjectを渡す。別端末の新版取得後、別タブの未同期編集後、Symbolを失ったJSONスナップショットの条件がすべてPASS。 |
| **A02-02／P2** 素材上書きとCacheFirstの不整合 | **解消を維持。** `tools/asset-pipeline/revisions.mjs:22`はhash付きファイルを上書きせず公開する。`packages/content-schema/src/index.ts:249`はカタログのURLを使用。`apps/web/src/sw.ts:54`から不変URLをCacheFirst、`:72`から固定URLをNetworkFirstに分離する。同ID更新、worker置換、旧revisionへのオフライン復帰がPASS。420件の仮カタログでも線画本体の取得は選択した1件のみ。 |
| **A02-03／P2** 旧クラウドサムネイルの固定 | **解消を維持。** `packages/persistence/src/cloud.ts:44`は作品versionと素材renderKeyを画像パスに含める。`index.ts:731`は作品revision・取得元version・renderKeyを照合する。画像送信遅延・失敗・再起動時に旧画像を最新版へ関連付けない。 |
| **A02-04／P2** 塗り保存ごとの全画像読み出し | **解消を維持。** `packages/persistence/src/index.ts:102`は同期待ち索引のキーを取得する。500作品・各64KiBの500画像、合計**32,768,000 bytes**を配置して3回保存した独自検査で、画像本体読み出し**0回**、画像索引キー取得**3回**、作品本体の一括読み出し**0回**。同期待ち500件を維持した。 |
| **A02-05／P2** 素材revisionを識別しないサムネイル | **解消。** 下記の独自検査で、前回の再現条件と関連回帰を確認した。 |

**A02-05の解消根拠**

- `apps/web/src/artwork-source.ts:18`：実際に解決したTemplate、選択中の背景・フレームURL、描画規則の識別子からSHA-256を計算する。
- `apps/web/src/pages/Gallery.tsx:74`：同じ解決済み素材を、キャッシュ照合と再描画の両方に使用する。
- `apps/web/src/pages/Editor.tsx:140`：編集中の素材から識別子を計算して画像に付ける。
- `packages/persistence/src/local.ts:25`：サムネイル行が`renderKey`を保持する。
- `packages/persistence/src/index.ts:731`：素材が一致しないローカル画像を採用しない。`:733`では同じ識別子をクラウド取得にも渡す。
- `packages/persistence/src/cloud.ts:44`：`project.vVERSION.rSHA256.thumb`で保存先を分離する。

前回の影響は「素材更新後も作品一覧に旧仕上がりが残る」ことだった。今回は同じ論理ID・作品versionを保ち、検証用コピーの素材だけを変更した。

| 更新対象 | 新旧画像の差分画素数 | 更新後の旧画像拒否 | 再起動・再試行・旧画像遅延送信 |
|---|---:|---|---|
| 線画の陰影・ハイライト・質感 | 8,058 / 128,000 | PASS | PASS |
| 背景 | 106,461 / 128,000 | PASS | PASS |
| フレーム | 23,975 / 128,000 | PASS | PASS |

比較条件は320×400、RGBいずれかの差が8を超える画素。3条件とも作品versionは**1のまま**で、作品状態のJSONは変更されなかった。

新しい一覧だけを取得してオフラインになった条件では、取得済みの旧素材と旧画像の組み合わせを維持した。再接続後は新しい識別子へ切り替わり、旧画像を拒否した。新画像の送信失敗・サービス再起動後も旧画像へ戻らず、再試行で新画像を取得できた。その後に旧素材の画像を送信しても新画像は保持された。

推奨されていた素材識別・不一致時再生成・クラウド保存先分離は実装済み。**追加の必須修正なし。** 前回指定の再テスト項目は上記の範囲で合格した。

**構造・保存スキーマの確認**

描画・永続化packagesからReactや制作解析コードへの依存は確認しなかった。Appは画面を遅延ロードし、制作ツールは実行時アプリから分離されている。

作品は論理template IDと領域の状態を保持し、公開済み領域のID・順序・形状変更には新template IDを要求する（`tools/asset-pipeline/revisions.mjs:13`）。素材だけの修正で作品versionを変更する必要はない。

v1からv3への保存スキーマ移行検査では作品・同期待ちを保持した。独自の500件バックアップ検査も共通schema検証に合格し、サムネイルの`renderKey`やzoom・panが作品の正本へ混入しなかった。

新規カタログは正式採用された生成線画10件のみ。`user-adoption.json`と現在の原画・内容・承認hashが一致し、旧手描きSVGは選択一覧に含まれていない。

**未実施・証拠の限界**

読み取り専用条件により、成果物を書き換えるbuild・素材再公開、ブラウザーE2Eの再実行は未実施。実Supabase、通常配布版Firefox、実機性能も未検証。

既存の`test-results/ui/a02-thumbnail-current-chromium-desktop.png`を`view_image`で確認した。`test-results/a02-thumbnail/`の実行データも現行テストコードと照合し、素材識別子は今回の独自計算と一致した。ただし、既存証拠を今回のブラウザー実行結果とは扱っていない。

Firefoxの証拠は、`scripts/prepare-firefox-local.mjs`に記載されたworkspace内コピーへの1byte修正を伴う診断と区別した。通常配布版・実機での成功は推定していない。

**最終判定：PASS（Agent 02担当範囲）。未解決 P0：0件／P1：0件／P2：0件／P3：0件。**