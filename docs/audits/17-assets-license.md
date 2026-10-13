**PASS — Agent 17（Asset / Copyright / License）残存A17-03の独立再監査**  
監査日：2026-10-07。残存していたVite実行時helperの通知欠落は解消。今回の担当範囲で新規所見はありません。未解決件数：P0＝0／P1＝0／P2＝0／P3＝0。

AGENTS.md、product-spec.mdのAgent 17担当分野・34〜36節、user-art-decisions.md、前回独立報告と17-runtime-resolution.mdを読み、固定された現物を独立に照合しました。実装側のPASS値だけで判定せず、インストール済み依存、生成コード、公開ファイル、3ビルドのJS、最新保存HTTP証拠から確認しています。harness-orchestratorを適用し、モデルとeffortは継承しました。プロダクト編集、build、ブラウザ、重いテスト、性能測定、外部通信、孫エージェント起動は行っていません。

旧FAIL原文を[history](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/docs/audits/history/17-assets-license-20261007-resume-224454-319.md)へバイト一致でコピーしました。8,434 bytes、SHA-256 `da2644676c88e6c0b792cb3ade951df1157600bb52b92d031064d48d21046cfc`。本報告は今回の独立判断であり、旧報告の結論を上書きして遡及変更するものではありません。

**A17-03 — 配布されたVite実行時helperのライセンス通知：解消**

- **Severity：旧P2／現在は解消。**
- **根拠：** [build-licenses.mjs:7](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/scripts/build-licenses.mjs:7)は開発依存でも`node_modules/vite`を明示収録します。package-lockとインストール済みpackage.jsonのViteは8.3.1、公開一覧にも同版のMIT項目があります。
- **本文照合：** インストール済み[Vite LICENSE.md](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/node_modules/vite/LICENSE.md:1)全112,425 bytesを省略なしで通知に含むことをBufferで検証しました。SHA-256は`387dd7baa307083401a27c58c362c30832f5ba1dba84f10cc22c33401523f45c`。VoidZero Inc. and Vite contributorsの著作権表示、本体MIT許諾文、同梱依存の通知を維持しています。
- **配布コード照合：** 下表の3つの最新JSで`vite:preloadError`、CSP nonce、modulepreload、CSS preload error、Promise.allSettledを確認。インストール済みViteのpreload実装と、`preload.toString()`を埋め込む処理（node.js:26823）に対応します。各JSのhashは最新保存証拠とも一致しました。
- **再現方法：** `node test-results/harness-resume/a17-independent-verify.mjs`。生成処理のmkdir／writeFileをメモリ捕捉に置き換え、対象選択と出力形式は現行コードを実行します。生成後の両ファイルがpublicとバイト一致すること、40項目・各依存のLICENSE全文・実配布helperの対応を確認します。プロダクトには書き込まず、再現結果JSONのみを保存します。
- **影響：** 実配布Viteコードと著作権／許諾通知の欠落が解消しています。
- **推奨修正：** 追加修正なし。
- **修正必須：いいえ。**
- **再テスト：** Vite更新、依存更新、build設定または注入helperの変更時に、実配布コードと通知対象、LICENSE全文、生成結果と3ビルドおよびHTTPの一致を再確認する。

| 固定成果物のhelper | 独立計算したSHA-256 |
|---|---|
| dist/assets/index-DWaaXxk0.js | `a7280a6d7a005e14806b5f261da4e54e7a04ab2076e7659063bf9e82001b4603` |
| dist-demo/assets/index-yWC7UATR.js | `3a6cf25df382a99fdce0f286ac7994fddba291309e4628633e7d22ef5b2ffcd5` |
| .local/cloud-e2e-dist/assets/index-Bkg1UDfn.js | `f591be2273815df269d354f14fa54aa1ad0c219a478af1f1ad9cf8044f72dc87` |

**通知全体と配布整合性**

[独立照合結果](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/test-results/harness-resume/a17-independent-results.json)は軽いファイル検査130項目すべて成功。40項目はnpm由来38項目とGoogle素材2項目で、重複インストールされたidbもインストール位置ごとの対応として照合しました。38項目のlock版・現物版・一覧の版／ライセンスが一致し、各LICENSE／NOTICE全文が通知に含まれます。LucideのISC・Feather由来MITも維持されています。

| ファイル | public／本番／demo／cloud試験buildの独立実測 |
|---|---|
| legal/oss.json | 40項目、5,278 bytes、SHA-256 `c07986694f37204a20a6b6e4c9117eef9089ac5af322936728b438dfe32d40c4` |
| legal/third-party-notices.txt | 182,710 bytes、SHA-256 `e78017f8b3b3fda65b764b129f1205aa974817d7fcee37dc6b03e3a0dd3da4db` |

[最新HTTP一致証拠](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/test-results/harness-resume/pencil-fix/license-results.json)の検査時刻は2026-10-07T13:41:55.666Z。同ファイルにはローカル8件とHTTP 2件、計10件の記録があり、10件すべてのbytes／hashは今回の実体計算と整合します。HTTPは`http://127.0.0.1:4174/legal/`の2ファイルです。保存結果を生成したverify.mjsにはHTTP 200と本文バイト一致のassertがあります。今回の独立監査ではHTTPを再取得していません。

**前回解消事項と既存素材証拠の再利用**

- **A17-01：旧P2／解消を維持。** Google G 33,661 bytes、Google Sans subset 3,116 bytesは公式取得記録のhashと一致し、publicと3ビルドも一致。保存済みGoogle状態検査のコンポーネントhash`f8afc5bb82df0c8dca7c9cd784d664e5c41fdb7bb78285ec4a6e7fc93a4d0d6a`は現行ソースに一致しました。専用CSSの白背景、hover 8%、focus／pressed 12%を現行コードで確認。前回の3ブラウザ×5状態の結果を再利用しています。追加修正なし／修正必須いいえ。ボタンまたはCSS変更時に状態別操作を再テストする。
- **A17-02：旧P3／解消を維持。** Google Identity button stylesの来歴・改変説明とApache全文、Google SansのOFL全文は40項目と通知に残っています。generatorのメモリ捕捉結果、本番・demo・cloud試験buildともバイト一致。追加修正なし／修正必須いいえ。通知変更時に全配布先とHTTPを再確認する。
- **正式採用／原画：** user-adoption.jsonの10件すべてで原画SHA-256と現在の公開template contentHashが採用記録に一致。human承認、承認contentHash、QA contentHash、QA pass、公開approvedを独立に照合しました。公開10枚・408領域。contentHashは形状・領域設定も含む現行template全体から計算しています。
- **保存証拠への適用範囲：** functional/build-before.jsonに記録されたプロダクトソース48件は今回の現物と全件hash一致。公開ファイルの実在一覧230件に追加・欠落はなく、同manifestの230件とpublic・3ビルドが一致しました。ホーム画像、ブランド、背景、枠、線画の公開バイトが保持されているため、前回の原画変換・第三者IP目視・瞳とハイライト・幅例外の照合を再利用しています。全幅再計算や原画の画像再変換は今回実施していません。
- **参照ZIP／音：** 公式Google参考ZIPを含む保存素材の取得hashは一致。publicの現行230ファイルにZIPと音源ファイルは0件。前回確認したWeb Audio合成・端末TTSのソースも上記ソース一致の範囲に含まれます。

**未確認・制限**

- 既存のHTTP記録は最新固定bundleとhash照合しましたが、今回の新規HTTP取得、ブラウザ操作、撮影、build、E2E、性能測定は依頼範囲外として未実施です。軽いファイル照合130項目を新しい実行テストの成功件数とは扱いません。
- Google公式サイト・画像・ZIP・OFLの外部再取得、網羅的な既存IP検索、workspace外の生成履歴確認は未実施。前回の取得記録、素材現物と独立報告を再利用しました。
- 保存済みFirefox結果はmanifest修正済み隔離コピーによるものです。未変更の通常配布版、実機、幼児操作、実Google認証の成功を意味しません。
- 本ディレクトリはGit repositoryではないため、Git diffによる変更範囲証明はできません。48ソースと配布230ファイルの記録済みhash、採用原画10件の承認hash照合を変更検知の根拠としています。
- 今回のPASSはAgent 17の証拠照合範囲の結論です。他担当の残存問題、Agent 20判定、全体Quality Gateまたは法的保証の代替ではありません。

**最終判定：PASS（Agent 17担当範囲）。残存必須修正なし。未解決件数：P0＝0／P1＝0／P2＝0／P3＝0。**
