# リリース品質ゲート

## 現在：2026-10-13 I34、62実画面FAIL／63試作中

進行基準は[統合計画I34](storybook-improvement.md)、詳細は[I34進行記録](smooth-home-i34-progress.md)。候補62のbuild a95ad6a0… / runtime74c1b959…で全460Unit/主Chrome26＋補足1/90native/眼100と保全検査は成功。source73画像とengineは独立限定PASS。しかし[実画面原本](audits/revision-62-screen-final-visual-20261013.md)は、逆明度で段付き境界R62S-1、未着色眼端の淡い矩形帯R62S-2によりFAIL。通常色の旧R61S-1改善と新FAILを分ける。現在は63の顔全体の共有曲線/肌の相対光をin-memory比較中で、productionは62。I34未完了、旧FAIL/不採用案/補足初回harnessFAIL、P05 STOP/人間採用未受領/実機・実外部同期未確認/全体NOT READY/Visual基準未更新を保持する。


## 履歴：2026-10-12 I33、全体NOT READY

最新基準は[統合計画I33-S/E30](storybook-improvement.md)と[品質改善記録](smooth-home-i33-progress.md)。現行は陰影/細部の技術検証済みrevision-1。細線化は範囲FAIL2回で停止し、ホーム同等品質/新独立監査/人間採用は未完了。P05性能停止を継続。以下の旧hashとPASSは履歴。


## 履歴：2026-10-10 I25 肌色・生成操作UIの確認候補、全体はNOT READY

固定build `547dd061e035290c533f2fdf067fbd326ea30ad21524d202a99cff14ac5244b5` / source `87706559ed4d8deefbc3ab0cefb2a15ea225da52c3f09271dbd90e281dd141d5`。[統合計画T表/E23](storybook-improvement.md)と [実装・検証記録](ui-art-v1-progress.md)を最新基準とする。

- 旧132色を保持して肌24色を追加、12島156色。生成UI25点を組込み、原本/逐語prompt/hash/旧素材を保持。実色/日本語/選択/focusはlive UI。schema/DB変更なし。
- 新UI6、同buildのoffline1/限定回帰8、関連Unit37、型/lint/demo build成功。初回PWA/OGP島欠落・肌下段切れを独立FAILとして保持し修正。offline診断のOrigin variant不一致もtrace/当時testを保持して検査のみ修正。
- 独立engine/visualの修正版追補は限定PASS。初期通知なし3幅/72中心RGB、既訪問25素材offline、列挙した肌保存/PNG寸法と既存操作が対象。全156描画/PNG比較、肌24＋通知、実機/実外部同期/全体回帰は未確認。
- 人間採用はnot-received。旧P05性能FAIL2回の停止、残り9枚master/初期計画不足/本番採用gateを解除せず、Visual基準を更新していない。今回のlocal候補成功を全体READYへ拡大しない。

## 履歴：2026-10-10 I24 途中削除・背景・枠の確認候補、全体はNOT READY

I24を反映したdemo buildは `a149955e4dcae08e5aa5ce0115ca25fc671fc76603c920baac2b04249708546c`、sourceは `f57d0e3d0cddb07a5abb0409e1c9a8a99d2fc1ce3c256699788f34b5faab8b90`。[統合計画](storybook-improvement.md) S01〜05/E22と[今回の記録](scene-art-v3-progress.md)を最新基準とする。

- 途中作品の削除/取消/再読込/他作品保持/別タブ競合/保存失敗後retryを、PC/mobile各3件で確認。既存の所有者/CAS/tombstoneを使用し、DB/Project/RegionPaint schema不変。
- built-in image_genで10景観＋20連続意匠枠を個別生成。白/なしを含む11/21。全不透明背景、枠の透明開口、全10主役のnative非遮蔽、姫との全30×2幅、PNG/reload/複製/offlineを新規検査。型/lint/demo build・関連Unit25・Chrome10・offline1成功。旧v3 40状態/旧hash素材保持。
- 初回Chrome4成功6失敗は保持し、検査側3ファイルだけ修正したrev2を別保存。全Unitや全機能一括回帰とは呼ばない。人間採用/実機/実外部同期/全組合せ/全体最終監査は未確認。noProfileの旧作品は旧選択肢/旧描画を保持し、新compositionは未提供。
- **P05性能FAILは未解消**。規定2回未達の停止を維持し、今回性能再測定・Visual基準更新を行っていない。独立監査の新範囲を全体READYへ拡大しない。
- I24の独立engine/visualは限定PASS、必須修正なし。最終before/after identityも一致。[31証拠index](../test-results/scene-art-v3/revision-2/evidence-index.json)を保存。visualのloading thumbnail未確認と王冠接近P3任意所見は未解消の限界として保持する。

## 履歴：2026-10-10 姫1枚とメニューの確認候補、全体はNOT READY

現候補 `gen-princess-bunny-v6-master-v3`、demo build `7aaa080425b7b6f28d868fa2b47d1454844166d5b106b13676d78891e84f4cda`。最新I22/I23の白い未着色瞳、ホーム残留影撤去、独立戻る矢印・小画像・元のpreview幅を実装。[統合計画](storybook-improvement.md) P01〜P07/[検証記録](princess-master-verification.md)が現在の基準。

- 修正版3の型/lint/demo build、関連Unit13、Chrome8、offline1、旧v3の40RGBA、旧master8状態保全は成功。新native21も最適化前と全画素一致。全398件成功は修正版2の履歴であり、今回の全件検査ではない。
- **P05性能FAIL**：CPU4/DPR2のskirt p95 311.2ms、hair34.2ms。規定ゲート2回未達で追加変更/測定を停止し、次はskirtの単一traceで原因切分け。旧版の性能値を合格に流用しない。
- 初回の独立FAILを保持し、最終追補を別に記録。今回のVisual基準更新なし。ホーム同等品質・人間採用・全10枚への新方式展開・全体回帰/新版Agent20・実機/実外部同期・本番採用gateは未完了。

## 履歴：2026-10-09 I17候補は限定PASS、全体はNOT READY

進行基準は [統合計画と要求の照合](storybook-improvement.md)。今回の固定demoは `f3c10731370481c0235c267e41aed0b1ff4b3591ec8338544289c6d8eb3ffb29`。10線画の共有Bezier/塗り境界/個別の目、顔なし車、旧作品互換性を実装した。独立可視監査とengine/互換性監査が限定PASS。最新の生証拠・対象hash・不合格履歴は [今回の検証](vector-revision-verification.md) と [独立監査](audit-tracker.md)を参照する。

| I17のゲート | 現在の結果と限界 |
| --- | --- |
| 新候補の自動検査 | 49ファイル390 Unit、Chrome mobile15、desktop/narrow8。全10の倍率/DPR90＋pan30＋fit復帰30。旧380を合算しない |
| 独立目視・描画/互換性 | 今回の固定範囲でPASS。旧SB-C04/VV-01〜07のFAILは履歴として保持 |
| 実PWA更新/offline | 新hashのhome素材を含む更新・複数タブ/未保存保護・offline復帰成功。通信失敗を除外して成功へ変換していない |
| 非demo同期 | 実SDK/HTTP/隔離SQLのsource previewで3engine9件成功。本番配布build・外部サービス・実認証の証拠ではない |
| CPU4倍/DPR2 firstCanvas | 最大面積group p95 7.0ms、最多14部品group 13.3ms。72生sample、前後同一。2rAF最大119.4msも保持。実機/物理present/60fpsは別 |
| Visual基準 | 独立PASS後に旧10PNG保全→新10PNG更新→更新なし5構成比較。最終結果は今回の検証記録に記載 |
| 新版の人間採用/本番素材gate | **未完了**。旧承認を新hashへ転記しない。非demo本番buildは既存approval guardで停止し、迂回していない |
| 初期/I8不足・全体最終判定 | **未完了**。desktop3列、タップ演出、全11材質、全部位陰影、制作UI/全32装飾受入、紙目対応、関連全体回帰/新版Agent20を統合計画に保持 |

以下は**2026-10-07の旧版の最終記録**。旧手動ハイライトや旧画面のPASS・承認・性能値を改善版へ転用しない。監査原文と生証拠は履歴として保持する。

## 履歴：2026-10-07の旧版

**最終判定: RELEASE-QUALITY PROTOTYPE／ローカル試作品の品質ゲートPASS。20担当の独立監査PASS、未解決P0/P1/P2は各0、P3は1件。外部設定・実接続・一般公開は未完了。[最終独立監査](audits/20-release.md)と[今回の検証](resume-verification.md)を参照。**

2026-10-07 22:54:53 JST開始の最終Unitは45ファイル373件成功。最新版の機能177成功・対象外3件・失敗0、非demo同期9成功、画面比較5構成成功。すべての最新証拠は `test-results/harness-resume/`。機能/画面/Unitの前後build/source/harness hash一致を確認した。初回の権限制限と性能FAILは別記録として保持。

## 実装した機能と構成

12テーマのホーム、画像生成した正式線画10枚、11色島×12色、なめらか・クレヨン・いろえんぴつの混在、消しゴム、11素材の固定seed質感、pan/zoom、領域を選ぶキーボード操作、背景11種、枠21種、完成演出、作品一覧・詳細・複製・削除、2048×2560 PNG、音・読み上げ・動き軽減設定を実装した。

IndexedDBへの即時保存、1.5秒の同期debounce、オフライン編集・再接続、CASによる競合保全、500作品の上限、バックアップ保存・コピーとしての復元、Google/PKCE認証、Supabase RLS/Storage、アカウント削除と応答喪失時の復旧を備える。保存失敗時の離脱保護と、読み取れない端末データを保持して正常作品を使い続ける回復UIも実装した。

| 構成 | 責務 |
| --- | --- |
| `apps/web` | React / TypeScriptの画面、Canvasとの接続、PWA |
| `packages/coloring-engine` | 領域判定、画材・質感・陰影、再描画、PNG |
| `packages/persistence` | 認証、端末保存、同期、競合、回復 |
| `packages/shared-types` / `content-schema` | 保存schema、正式色、素材schema・読み込み |
| `tools/asset-pipeline` / `content` | 元画像、OpenCV領域生成、QA、日本語レビューUI、人間承認とhash |
| `supabase` | migration 3件、RLS/Storage、削除Edge Function |

420枚への追加は論理template ID、内容hash付きURL、catalog、遅延読み込みで扱う。領域形状・順序を変える素材には新IDを割り当て、保存済み作品の色対応を保つ。詳細は `architecture.md` と `content-authoring.md`。

## 正式線画10枚

全10枚はユーザーの「この10枚を正式採用する」という回答に基づく白黒の生成原画。瞳22個とハイライト22個は独立した塗り領域で、自動の反射光・陰影・質感は適用しない。最初から着色した線画を配信しない。

| 線画 | 領域数 | 検証 |
| --- | ---: | --- |
| おひめさまと うさぎ | 51 | PASS |
| まほうつかいと ランタン | 46 | PASS |
| きのしたの なかまたち | 29 | PASS |
| うみの なかまたち | 41 | PASS |
| きょうりゅうと たまご | 23 | PASS |
| まるい スポーツカー | 28 | PASS |
| ショベルカーと コーン | 54 | PASS |
| たんけん ロボット | 46 | PASS |
| ロケットと うちゅうひこうし | 46 | PASS |
| はなたばと ちょうちょ | 44 | PASS |
| **合計** | **408** | **公開gate 10/10、領域漏れQA・実操作・PNGを確認** |

原画・プロンプト・個別例外の注釈・承認記録は `content/generated-lineart/`。採用の証拠は `user-adoption.json`、全体確認画像は `tools/asset-pipeline/output/generated-lineart-review.png`。旧手描きSVGは新規カタログへ採用せず、既存作品の互換性のためだけに残す。

## 実装と検証

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| 生成線画10枚と領域漏れ | 技術QA PASS・ユーザー正式承認済み | user-adoption.json、408領域の原画/hash/操作/PNG、22組の瞳とハイライト |
| 11色島×12色、3画材、erase | PASS | 正式palette、engine tests、固定buildの4ブラウザ構成で実操作 |
| 固定質感、PNG 2048×2560 | PASS | engine tests、再描画同一性、実ダウンロードと瞳/ハイライトの画素検査 |
| IndexedDB・同期・競合・上限 | A11独立再監査PASS | 以前の解消証拠に加えA11-04の例外abort・認証世代・route/project原子性・再試行・500件境界の独立15件と最終全体Unitを確認 |
| 本番認証・権限・Storage・削除 | コード/SQL実装済み | security.md、実SQLロール検査。外部接続は資格情報待ち |
| ホーム・編集・作品・設定 | PASS | React UI、保存失敗からの回復・破損行の隔離と元データ保存も確認 |
| 背景11種・フレーム21種 | 素材QA・UI PASS | authoring QA、背景/枠の変更・再読込・PNG |
| PWA | 最新更新・移行・offline実ブラウザとA09独立再監査PASS | harness-resume/pwa/、実SWでIDB未commit・別タブ・更新保留・offline再起動。実旧buildから最新への移行でも作品/色/設定を保持。旧preview移行は保存完了後に全タブ/PWA終了・再入場の案内が前提 |
| lint/typecheck/tests/build | 全体lint・型・最終373 tests・demo/本番/cloud試験build PASS | harness-resume/unit-final-results.json、変更後3buildはpencil-fix/。正式承認10件のrelease guard PASS。全体Unit92.01秒 |
| Desktop/Mobile/Cross-browser/Visual | 機能177件成功・対象外3件・失敗0、画面比較5構成成功 | harness-resume/functional/ とvisual/。最新固定build/sourceの前後hash一致。対象外はmobile touch専用ケースのdesktop3構成。Firefoxは隔離した診断コピー。10基準PNGは更新なし |
| 非demo同期E2E | 3ブラウザ9件PASS・skip/retry0 | harness-resume/cloud-e2e/{results,run-identity}.json、実SDK・HTTP・隔離PGlite migration/CAS。WebKit通信障害は専用fixtureの端末別API接続切断、実サービスとは区別 |
| Accessibility/Performance | A13独立再監査PASS・A12独立再監査PASS | 最新axe/contrast成功、pencil-fix/performance/の現行identityを独立照合。A12-02 P3は実機/物理表示/長時間heapの将来改善 |
| 20独立監査 | 全20担当PASS | audit-tracker.md、各最新監査原文と過去報告を保持 |
| P0/P1/P2=0 | PASS・各0件 | 最終独立監査で未解決必須所見なしと確認 |
| Agent 20最終PASS | RELEASE-QUALITY PROTOTYPE | audits/20-release.md、最新生証拠・現行成果物・正式採用の独立照合 |

20担当の最新判定、初回指摘、解消検証の対応は `audit-tracker.md`、独立報告は `audits/`、過去報告は `audits/history/` に保存する。実装担当の自己検証を独立監査PASSに置き換えない。

## 性能と検証範囲

現行demo `index-yWC7UATR.js` とソースのhashを固定して測定した。build SHA-256 `c4e28446bf0fd643b0186e1491242322c311c33f3ff7215da8a968c05752c242`、source `7727957b303e92735a133ae82623afbc6b64fe16d5fa6bf7a944edbc527e9f23`。Lighthouse性能96／Accessibility100／Best Practices100、LCP2.565秒、CLS0。CPU4/DPR2のfirst Canvas draw p95はおひめさま58.7ms・恐竜91.5ms、混在43.8/96.7ms。2rAF代理値・FPS・30回開閉のheap推移と限界は `resume-verification.md` と独立12報告を参照。旧build値は流用しない。

ブラウザの機能検証はChromium desktop/mobile/320px、Firefox診断コピー、WebKit。PWAのオフライン再起動はChromium/Firefox、本物SWの更新競合はChromiumで確認。WebKitの未訪問Settingsは、実HTTP配信を停止しSWから取得する対比でも確認した。Playwright 1.63.0のWebKit `setOffline` 注入制約と、実Safari/機内モードの動作は同一視しない。詳しくは `testing-browser.md` と `audits/16-cloud-e2e-resolution.md`。

FirefoxのこのWindows環境では公式配布物が起動前に失敗するため、workspace内のコピーのmanifest resource IDを1byte変更した診断用実行を使用。元の実行ファイルは変更していない。実iOS/Android、通常配布Firefox、実Google/Hosted Supabaseの成功は主張しない。

最終独立監査で確認されたP3はA12-02（実機・物理表示・長時間heapの確認範囲拡張）1件。現固定版の追加必須実装修正は0件。

## 試す手順

1. `npm run build:demo` と `npm run preview:demo` を実行し、`http://127.0.0.1:4174` を開く。現在のローカルpreviewもこのURL。
2. 島を選んで線画を開き、色の島→濃淡→塗る領域を選ぶ。瞳とハイライトも別々に塗れる。
3. 画材、拡大、背景、枠を試し、「完成」から作品・PNG保存へ進む。
4. 設定でバックアップを保存し、復元が既存作品を上書きせずコピーを追加することを確認する。
5. 認証付き環境の起動はREADMEと `security.md` の外部設定後、`npm run build` / `npm run preview` を使用する。

おためしモードの保存先はそのブラウザ。表示にもその旨を明記し、Googleに認証済みであるように見せない。

## 公開前の外部設定

Supabaseの新規専用project、publishable URL/key、Google OAuth consent/redirect設定、migration/Storage/RLS、データ削除Edge Function、HTTPSホスティング、問い合わせ先の設定。既存の他アプリのSupabase環境へ変更を流さない。

## 420枚制作前の人間確認

1. 初期10線画の構図・キャラクター・閉領域・実際の塗りやすさ。
2. 標準、肌、髪、毛、布、金属、プラスチック、ガラス、ゴム、木、石の質感と強さ。
3. 3～8歳相当の利用者が説明なしで色と道具を選べるか。
4. Android/iOS実機での指操作、背景とフレームの主役への干渉。
5. 原稿の来歴、権利、第三者IPとの類似、制作担当者の承認記録。
6. 12テーマの配分、識別子の変更管理、catalogとアセットの配信・更新手順。

人間の承認を実施したという記録は、実際の承認後のみ追加する。


## I33の差分判定（2026-10-12）

**NOT READYを継続。** [smooth改善版](smooth-home-i33-progress.md)の技術検証済みr1を現行とする。生成原本9＋再利用1、専用無彩色map、37Unit/15Chrome/90native、旧素材保全は列挙範囲の証拠。細線化範囲が2回FAILとなり停止、ホーム同等品質/新素材の人間採用/独立目視は未完了。P05性能停止、全体新版回帰、本番素材gate、実機/実外部等の未完了は解消していない。Visual基準の更新、公開、commit/push/deployなし。
