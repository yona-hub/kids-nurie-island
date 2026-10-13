# I24 途中作品削除・生成背景/枠の独立コード監査（2026-10-10）

判定は **技術範囲の限定PASS**。現在のProfile付き作品への11背景/21枠の提供、途中作品削除の確認・競合保護・失敗後再試行、列挙した旧素材/旧描画の保持について、新規のblocking実装欠陥は確認しなかった。人間による新素材採用、全保存世代での新素材利用、全体READYの判定ではない。既存P05性能FAILと他の未完了ゲートは維持する。

監査者は実装担当から独立した子エージェント。所有/変更はこの新規報告だけ。実装・検査harness・旧監査・承認記録を変更せず、子/孫を起動しなかった。今回実施したのは原文読取り、JSON/manifestの照合、ファイルSHA確認だけで、Unit・Chrome・offline・build・性能測定は実行していない。下記のテスト結果は実装担当から提示された生結果を読んだものとして区別する。

このcheckoutの `git status` はGit repositoryなしで終了したため、Git履歴や差分を証拠には使用していない。変更範囲の照合には以前と今回の固定source inventory、保持したcatalog、現ファイルSHAを使用した。

**基準と固定対象**

- `AGENTS.md:16` の新版への旧PASS転用禁止、`:18` の反復停止/全ゲート未充足時NOT READY、`:20` の独立監査範囲を適用。
- `docs/storybook-improvement.md:48` のI24原文、`:75` の不透明風景/連続した縁と角飾り/主役非遮蔽、`:76` の途中作品削除、M22/M23/M24/B25を対象とした。背景や枠を全旧作品へ自動置換する要求は読み取らず、既存保持の方針を維持する。
- rev1: `test-results/scene-art-v3/revision-1/identity-before-audit.json`、記録時刻 `2026-10-10T06:45:27.065Z`。同revの `identity-after-audit.json` は `06:47:49.605Z`、`unchanged:true`。
- rev2: `test-results/scene-art-v3/revision-2/identity-before-audit.json`、記録時刻 `2026-10-10T06:50:19.548Z`。
- 両revのbuild SHA: `a149955e4dcae08e5aa5ce0115ca25fc671fc76603c920baac2b04249708546c`。
- 両revのsource SHA: `f57d0e3d0cddb07a5abb0409e1c9a8a99d2fc1ce3c256699788f34b5faab8b90`。
- 独立照合 `2026-10-10T06:56:26.1371735Z`：source59件、build929件、identity用harness4件、I24用harness17件のSHA不一致0。実際のsource/buildファイル数も59/929。rev1→rev2で変更された登録harnessは `draft-deletion.spec.ts` / `scene-art-v3.spec.ts` / `projects.spec.ts` の3件だけで、実装と素材は同一。
- 姫revision-3固定sourceとの変更は `Gallery.tsx`、`styles.css`、`storybook-engine.ts`、`storybook-scene.ts`、`storybook-v2-engine.ts`、shared-typesの6ファイル。persistence、local DB、auth、renderer dispatch等の登録sourceは同一SHAだった。監査後の最終identityは実装担当が別途固定するため、この報告で未作成の最終記録を成功済みとは扱わない。

**原文コードと素材の確認**

| 対象 | 確認した動作と根拠 | 限定判定 |
| --- | --- | --- |
| 新30素材の登録 | `content/scene-art-v3/manifest.json` は `tool:"built-in image_gen"`、`humanAdoption:"not-received"`。10背景/20枠、30別sourceFile、30別原本SHA。全原本bytesと記録SHA、全promptと `prompts.json` のkind/id対応を独立照合し不一致0。`scripts/register-scene-art-v3.mjs:7` は計画外IDを拒否、`:9` は既登録の再登録を拒否、`:11` は原本をwxで保持する。 | 登録/同一性PASS。生成を監査者が再実施した、または人間採用を得たとはしない。 |
| 不透明な背景 | `scripts/build-scene-art-v3.mjs:58` で原本SHAを確認、`:63` でalpha不透明を要求、`:68` で1120×1400素材へ加工し、opacity1の1layerで1600×2000の世界座標全体を覆う。元の淡い小motifの再合成ではない。 | 技術PASS。自然/建物/空間の美術的受入は独立視覚監査と人間判断。 |
| 連続した枠と開口 | 同script`:32` は1600×2000へ描いた生成枠の中央 `(320,320,960,1360)` を透明化。`:78` のtop/bottom/left/rightは重複しない4帯で全外周を分割し、`:90` で新枠だけ `placement:"behind-artwork"` を付ける。新全20枠は4layer/opacity1。 | 技術PASS。辺のalpha存在量だけで意匠の品質や視覚的な連続性の全てを証明しない。 |
| 不変URLと旧素材 | 同script`:18` はhash名のwx書込み/EEXIST時bytes照合、`:41` は旧catalog snapshot保持、`:100` は旧全entryをID/URL等を保って非表示へ移す。背景21→31/可視11、枠41→61/可視21。旧entryの `catalogVisible` 以外のmetadata差0。旧catalog snapshotのSHAは姫rev3の元catalog SHAに一致。catalog/全composition layerが参照する308 URLは全てhash名と実bytesが一致。以前のbuildにあるhash付きcontent533件も新build内に同一SHAで保持。 | 保持/参照PASS。現在のcatalog JSON自体は新entry追加と可視性変更により旧bytesとは異なる。 |
| composition読込み | `storybook-scene.ts:10` はcompositionのない旧assetを従来画像として読む。`:20` はschemaVersion1/1600×2000/layer制限を継続、`:22` はplacement未指定またはbehind-artworkのみ許可。`:24` は同一layer画像取得を重複排除、`:26` はlayer順を保持、`:31` はmanifest cacheを32件に制限。abort/offline fallbackの既存経路を維持。 | 新field追加と旧互換分岐PASS。全heap/新素材の性能は未測定。 |
| viewport/PNGの描画順 | `storybook-engine.ts:101` と`:115` は背景→新枠→白い主役下地/paint/ink、`:109` はv4 eyes後にも旧枠のみ前面へ描く。`storybook-v2-engine.ts:85`/`:99` も新枠をpaint/inkの前へ描き、`:69` は各regionに白を塗る。旧枠はplacement未指定なので従来通り前面。PNG/thumbnailは各engineの同じsnapshot経路。 | 静的順序PASS、現行10の不透明主役はUnit証拠あり。全世代/全AA境界/全倍率の実画面一致は未確認。 |
| schema/保存 | `shared-types/src/index.ts:95` はSceneCompositionにoptional placementを追加しただけでschemaVersion1を維持。ProjectのschemaVersion/regions/backgroundId/frameIdは`:98` で不変。persistenceとlocal DB sourceのSHAも旧固定sourceと同一。 | 今回のDB migration/Project schema変更なし。実外部同期の再検査はしていない。 |

**途中作品削除の確認**

`apps/web/src/pages/Gallery.tsx:294` の削除ボタンはdraftだけに表示され、作品を開くcardボタンの兄弟要素なので削除操作でeditorへ遷移しない。aria名と確認文に作品名を含む。`:320` の確認dialog、取消、処理中disable/文言、保存失敗後の再試行が別状態として実装されている。`styles.css:769` は操作要素を最低44px高にする。

`Gallery.tsx:117` に確認時のProjectを保持し、`:127` で所有者/active scope/同期的ref lockを確認、`:133` でそのProjectそのものを既存 `services.projects.delete(expected)` へ渡す。削除直前に最新Projectを取り直してCASを迂回する実装ではない。成功通知/失敗通知/lock解放はactive scope時だけで、CHANGEDなら`:141` で確認を閉じ、storage errorなら確認を残して再試行できる。

既存 `packages/persistence/src/index.ts:613` を読取りで確認した。`:616` のowner検査、`:620` のprojects/thumbnails/leases同一readwrite transaction、`:626` のlocal revisionまたはbase versionとeditable state照合、`:632` のCHANGED、`:634` と`:636` のproject/thumbnail tombstoneを再利用する。既に削除済みのrowではtombstoneを重ねて書かない。異なる作品のkeyは処理対象にしない。

owner切替については `Gallery.tsx:120` の確認/lock reset、`use-account-scope.ts:18` のabortと`:30` のactive判定、`App.tsx:156` のaccount generation加算と`:238` のkeyによる画面再作成まで静的に確認した。A→B→Aや非同期処理完了が新ownerの画面へ成功通知を出すことを防ぐ構造である。ただし新削除UIのowner切替/高速連打を動的に実行した証拠は今回のChrome10件にはない。別タブ更新、取消、storage failure/retryの結果と混同しない。

**提示された検査結果の評価**

| 証拠 | 生結果と原文oracle | 採用する範囲 |
| --- | --- | --- |
| rev1 `unit.json` / `unit.log` | success:true、25/25。scene-cache5、princess-master8、scene-art-v3 3、storybook-assets2、vector-revision7。 `tests/scene-art-v3.test.ts:16` の原本/旧entry照合、`:41` の不透明背景/透明開口/4辺alpha、`:73` の全面magenta枠を用いた非遮蔽を確認。 | 同一source/buildの関連25件。全Unit suiteの成功やpersistence suiteの新実行を意味しない。 |
| rev1 `legacy-compatibility/after.json` | unchanged:true、40件。監査者も元 `test-results/princess-master/compatibility/before.json` の40 templateSHA/RGBAと全件一致を確認し、after記載6 source SHAを現ファイルと照合した。原文 `scripts/check-princess-compatibility.mjs:22` は旧10×blank/smooth/crayon/pencil、320×400 snapshot、scene未設定。 | 旧v3線画10枚の列挙40状態だけ。旧枠全組合せ、legacy v1/v2全状態、新sceneを合わせた旧作品のPNGをRGBA検査した証拠ではない。 |
| rev1 typecheck/lint/build logs | tsc --noEmit、eslint --max-warnings 0、build:demoの完了ログ。buildは500kB超chunkとinlineDynamicImports非推奨の警告を残す。rev2 typecheck/lintにもエラー記載なし。 | 提示ログの完了範囲。監査者の再実行ではなく、production deploy成功/性能合格でもない。 |
| rev1 `browser/results.json` | **4成功/6失敗**、skip/flaky0。PC/mobileのCAS各1はstatus locatorがsync bannerとtoastの2要素へ一致。scene各1は画材と枠の「クレヨン」へ一致。PNG/画面各1は異なる解像度の単pixel比較で差132/109、許容25に失敗。元result/失敗PNG/traceは保持されている。 | 初回FAILを維持する。CAS例ではnewer Project一致のassertion後に正しい競合toastが記録されているが、初回run自体をPASSに書換えない。 |
| rev2 `browser/results.json` | **10/10成功**、skip/flaky/unexpected0、PC5/mobile5。初回のlocator2種と画面画素oracleを直した後の別run。`draft-deletion.spec.ts:9`/`:37`/`:59` は取消・選択対象のみ・reload・他作品deep保持・別タブ保存保護・失敗/retry。`projects.spec.ts:23` は背景/枠/完成詳細/PNG/別作品コピー。 `scene-art-v3.spec.ts:21` は全30選択/保存と姫の合成/reload/PNG。 | 最新の列挙Chrome条件のPASS。Chromium以外/実機/全UI回帰へ拡張しない。 |
| rev2 `browser/scenes/scene-chrome-*/evidence.json` | PC/mobile各30別scene・画像ファイルあり、全10背景/20枠、各90別runtime part取得。現在の全new composition layer90 URLとrequest集合が一致。完成Projectは姫master-v3、47 regionのsmooth、城庭/宝石枠を保持。初期runtime新decor request0はtest`:27` で検査。 | 各sceneを姫へ順に合成した60画面と列挙した保存。10×20×全10テンプレートの総当りではない。thumbnail取得など全通信0の主張ではない。 |
| rev2 `offline/results.json` | **1/1成功**。`tests/e2e/pwa.spec.ts:20` はsky-island-scenic-v3/color-dots-atelier-v3を選択後、offline reload、描画準備完了/保存ID/paint復元、crayon追記、再接続後reloadを確認。 | 取得済み1組の復元。未取得30sceneをofflineで使える、全素材が永久保持されるという証拠ではない。 |

新しい画素oracleの原文も確認した。`tests/e2e/scene-samples.ts:6` は実際の背景と枠のcompositionを1600×2000へ描き、主役外2点を許容25で参照する。`projects.spec.ts:57` はPNGの世界座標sampleとの比較を維持する。画面との比較だけは`:60` 以降でPNGを実画面canvasと同じpixel寸法へ縮小し、同じ5×5領域の平均RGBを許容25で比較する。高周波装飾の異解像度単pixel比較を直す理由は妥当で、許容値の引上げはない。ただし2点/平均の検査で全面pixel一致や微小な境界差を証明しない。全面非遮蔽の別Unitも、不透明mask alpha255のpixelだけが対象である。

**未確認・対応範囲・次作業**

| 優先度 | 残す条件と具体的な位置 | 次に必要な最小確認 |
| --- | --- | --- |
| P2・未確認 | 新削除UIのowner A→B→A、pending中の切替、同一操作の高速二重呼出し。静的guardは `Gallery.tsx:127` / `use-account-scope.ts:18` / `App.tsx:238`。既存backendのidempotent transactionは確認したが、新Chrome3ケースにはこれらの動的操作がない。 | 必要な受入段階で一時fixtureのowner切替と連打を各1例追加し、別ownerのProject/通知/確認状態が変わらないことを調べる。今回は未実行で、既知FAILへ捏造しない。 |
| P2・未提供/未検証 | noProfileの旧作品は `Editor.tsx:635` / `Gallery.tsx:564` でcomposition付き新素材をpickerから除く。 `ArtworkCanvas.tsx:183` / `artwork-render.ts:19` はnoProfileではrasterを読み、placementを渡さない。通常UIから新枠へ変更できる経路は確認しなかった。外部でnoProfileと新composition IDを組み合わせた復元Projectは今回の対象外であり、非遮蔽を保証していない。 | 現scopeは旧選択肢/旧描画保持として明示する。将来全旧世代に新枠を提供するなら、legacyへopt-in placementを通す設計とその旧描画比較を別に必要とする。今回の独立報告を包括対応のPASSへ転用しない。 |
| P2・未確認 | 非遮蔽Unit `scene-art-v3.test.ts:73` は現catalog10/Profile3・4、320px/DPR1/smooth、alpha255の主役pixel。Profile2分岐は原文の前後関係を確認しただけで、新全sceneとの実画面/AA境界比較はない。Chrome全30は姫1枚・fit画面。 | 実機、必要な旧Profile2作品、AA境界や倍率を受入対象にする際に絞って確認する。現在の限定PASSはこの列挙外まで拡張しない。 |
| P2・受入未完了 | 新原本の自然な空間、枠の豪華さ/連続した意匠、全10作品との美的調和。alpha/辺量/behind分岐では美術的受入を決定できない。manifest/compiledは人間採用not-received。 | 別担当の新原本/60実画面の独立視覚監査を参照し、その後のユーザー判断を新hashへ記録する。このコード監査では採用を代行しない。 |
| 既存FAIL維持 | 姫revision-3のP05性能FAILは `docs/audits/princess-master-engine-20261010.md` に残る。今回の新scene buildで性能を再測定していない。今回のChrome10/offline1/Unit25は性能ゲートを評価していない。 | `AGENTS.md:18` の停止を維持し、原因未確定/最小切分けの旧記録を保持する。本監査を根拠に追加測定や全体READYへ進めない。 |

今回列挙したI24技術条件について必須の実装修正は検出しなかった。最終before/after identity、別担当の視覚監査と人間受入はそれぞれ別の証拠として扱い、初回Chrome6失敗、旧P05 FAIL、未確認範囲を消さずに引き継ぐ。
