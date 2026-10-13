# A02-05 素材更新と作品サムネイル

実装側の対応記録。独立監査の原文と判定は `02-architecture.md` に保持する。

作品のversionに加えて、描画に実際に使ったTemplate全体（領域形状・素材・陰影・ハイライト・線を含む）、選択背景と枠の不変URL、描画規則の識別子からSHA-256のrenderKeyを作る。公開カタログの最新URLだけから推測せず、オフラインで実際に解決した旧Template・旧装飾URLもそのまま識別する。描画規則を変える場合は `artwork-source.ts` のrenderer識別子を更新する。

- Galleryは現在解決した素材のrenderKeyを渡して画像を取得する。不一致・識別不明の旧画像は使わず、同じ解決済み素材から描画して保存する。
- Editorは開いているTemplate・背景/枠の一覧と保存対象Projectからkeyを計算する。古いまま開いたタブの画像に新素材のkeyを付けない。
- IndexedDBのサムネイル行に任意の `renderKey` を追加。既存作品・作品version・採用済み素材・承認記録は変更しない。旧行は既知のkeyと不一致になるため新しい実画面で再生成する。
- Storageは `user/project.vVERSION.rSHA256.thumb`。同じ作品versionで異なる素材の画像を別に保持し、旧素材の遅延送信で新素材画像を上書きしない。過去の作品versionは従来通り整理し、作品削除ではすべての素材variantを削除する。
- 新migrationは名前形式、現在の作品version、所有者、アカウント削除中の書込拒否を同時に検証。外部DBへの適用は行っていない。

型と対象lint、実描画エンジン・IndexedDB・再起動・送信失敗・遅い旧素材送信・Storage adapter・実SQL/RLS・非同期UIの45検査がPASS。実Workboxの7検査では、オフライン旧素材でkeyを保持し、再接続後の素材更新でkeyが変わることも確認した。画材と色の正本は不変で、検証用の素材変更はメモリ内コピーに限定した。

実UI回帰 `tests/e2e/thumbnail-revision.spec.ts` は同じ作品を全28領域着色後、作品状態を変えずに素材配信だけを変更し、一覧画像の更新、再起動後の再利用、詳細との画素整合を検査する。2026-10-07の中間demo `index-DtW107AG.js` でChromium/Firefox診断版/WebKitの3件が50.1秒で成功。console error 0。結果は `test-results/a02-thumbnail-pixels/results.json`、画像digest・素材key・作品不変の照合値は `test-results/a02-thumbnail/`。

初回のWebKit検査は、テスト自体が置換中の旧blob URLをfetchし、ReactでURLを解放した後にリクエストしたため失敗した。失敗traceを `test-results/a02-thumbnail-run/` に保持した。修正後の検査は実際に表示されている画像をCanvasへ描画して画素digestを比較し、表示の更新を待つ。アプリから同じfetchを行う経路はなく、アプリのassertやconsoleチェックを削除して通したものではない。
