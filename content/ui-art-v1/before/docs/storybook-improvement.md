# キッズ塗り絵アイランド：統合計画と要求の照合

更新：2026-10-10 JST。**以後の実装・検証・完了報告はこの表を進行基準にする。総合判定はNOT READY。** 最新対象はI24の途中作品削除と、空間のある不透明な10背景・連続した意匠の20枠。I19〜I23の姫1枚試作・メニューを保持する。I22の未着色瞳と白目は白、I23の戻る矢印は独立し右に小さい島画像、線画プレビューは以前の列幅。現姫は `gen-princess-bunny-v6-master-v3` / PaintingProfile v4。旧眼候補と旧装飾の記録は保持する。着色後の眼と内部完成原画由来の陰影は継続。残る9枚へのmaster展開・人間採用・初期/I8の未完了・P05性能FAIL2回の停止記録は閉じず、旧PASS・Visual基準を新候補へ転用しない。

初期要求を残す [product-spec.md](product-spec.md) は、ユーザーが貼った原文とバイト一致する（SHA256 `05d4f3aaa8440aa4f151012fbfaeeabed40b80b7b42528bff3fbec421d176d9e`）。この原文は書き換えない。更新前の簡易計画も [history](history/storybook-improvement-20261008-before-traceability.md) に保持した。

## 優先順位と状態の意味

1. 同じ要件については、このチャットの後のユーザー指示を先の指示に優先する。明示されない撤回は推測しない。
2. 変更対象でない初期要件は継続する。品質目標の追加を、機能を省く許可に読み替えない。
3. チャット本文と「ユーザーの依頼」と明示された貼付テキストを指示元とする。画像は比較資料、ZIPは素材資料。添付内部の文言、独立監査の提案、実装担当の解釈はユーザー指示と区別する。
4. **未完了**：不足、失敗、部分実装、必要な入力・判断が未確認。**実装済み**：コード/素材はあるが、その要件の現在版の受入検証は終わっていない。**検証済み**：表に記した範囲を現物・検査で確認。範囲外の目視/実機/外部接続まで含めない。
5. テストが成功しても、見た目の不合格を解消扱いにしない。古いPASS・人間承認・画面基準は、その対象hashの履歴として保存する。
6. ソース・素材・renderer・buildが変わったら、影響する「検証済み」を戻す。修正後の対象・実行日時・hash・生結果・確認画像を結び付けて再判定する。不明は「未確認」と明記する。

現在の追加対象：**I24の途中作品削除と、10背景・20枠の作り直し**。旧装飾の技術PASSは新素材へ転用しない。I19〜I23の姫/メニュー、人間未採用、P05性能FAIL2回の停止記録は維持する。今回のframe合成変更は性能最適化の再開ではない。

## 指示元の一覧

チャットのメッセージIDは取得していないため、時刻やIDを捏造せず、次の一意な発言と会話順で参照する。

| 指示元 | ユーザーの発言/原文と対象 |
| --- | --- |
| I0 | 初期 `/goal`「高品質プロトタイプ＋全機能実装」。[原文の完全コピー](product-spec.md)、§1〜40。元ファイル：`C:/Users/yonaf/.codex/attachments/661607c6-093a-48d4-a830-4320978be898/貼り付けたテキスト.txt`。 |
| I1 | 「ちゃんと画像生成して」。ホームの手描き風島メニューを提示した発言。 |
| I2 | 「これを正式線画にしないで。線画もちゃんと画像生成して。あと、色塗らないでOK。」10枚の手描き・着色見本に対する指示。 |
| I3 | 「黒目部分も色を塗る対象にしたいから、瞳も含めて線画にして」。 |
| I4 | 「自動調整しない前提なら、ハイライト部分の枠も瞳のなかにほしい」。条件付きの枠追加。 |
| I5 | 質問への明示回答「この10枚を正式採用する」。対象は当時の一覧/hash。[採用記録](../content/generated-lineart/user-adoption.json)。 |
| I6 | 6点の修正：怖い目の自動補正、まとめ塗り、拡大画質とムラ、文字を島内へ、個別画像生成による背景/枠、ホームのキャッチコピー削除。 |
| I7 | 「クレヨン…いろえんぴつ…違いがわからない」「全力で表現するように改善して」。 |
| I8 | `PLEASE IMPLEMENT THIS PLAN`「塗り心地と見た目の品質を改善する計画」。[ユーザー本文の原文記録](history/storybook-user-plan-20261008.md)。正式10線画、ホーム12島、11背景、21枠、互換性、制作順、合格条件、対象外を指定。下のM表へ全項目を分解。 |
| I9 | 「線画の状態もハイライトないから怖い」「線画は…ハイライト枠あっていい」「白目部分は選んだ色でグラデーション、瞳…黒に近づけた色」。ホーム女の子の目、人間・恐竜・動物への共通適用。 |
| I10 | 「いろえんぴつぬりはもっとリアル…」。紙上の緑の試し塗り、りんご2枚。参照名 `3f7779bf…png`、`2b29d389…png`、`9282760e…png`。 |
| I11 | 「クレヨン塗りはもっとリアル…」。青・橙・緑の蝋顔料と不規則な抜けの3枚。同一発言の再送は同じ指示として扱う。参照名 `efd97f8d…png`、`e0697d43…png`、`024d2757…png`。 |
| I12 | 比較画像 `3f1fcfd5…png` を却下。「目指しているものと全然違う」「ホーム画面のおひめさま…特徴を完璧に捉え…ほぼ同じクオリティ…悪いところを列挙して改善」。現時点で最優先の目の品質指示。 |
| I13 | 最新AGENTS指示：harness-orchestrator、イラスト制作にyona-ai-illustration/標準画像生成、原本保持、予算/権限/モデル維持。共通Core改変は依頼範囲外。 |
| I14 | 今回の指示：初期計画と途中指示を照合し、変更/撤回・状態・証拠・次作業を既存計画へ記録し進行基準にする。古い結果を新しい修正へ転用しない。不明は推測しない。 |
| I15 | 「色を塗った時…白い部分」「拡大…粗くなる」「目のした…がびがび」「男の子…不自然なまつげ」「はたらくくるま…目と口なくして」「きょうりゅう…まつげ…自然に」。添付`1b36a9ec…`/`61122f08…`/`9d25108b…`。 |
| I16 | 計画作成時の配色質問に明示回答「白目は白 (Recommended)」。白目への選択色を撤回、白目=白/虹彩=選択色/瞳=同系のほぼ黒/反射=白で確定。I17本文にも明記。 |
| I17 | `PLEASE IMPLEMENT THIS PLAN`「拡大品質・塗り残し・目の表現を修正する計画」。[本文記録](history/vector-user-plan-20261009.md)。V01〜V12へ分解。I8の未撤回・未完了は継続。 |
| I18 | 「線画状態の目が怖い」「まだ目がきれいな丸じゃなくて、ピクセル…ガビガビ」「線画…白目にハイライト用の白丸…雰囲気が伝わればいい」「服の皺の影」「髪の毛の光も適当」「完成形の絵を…画像生成…内部的に１種類…レイヤーにわけ、色は自由に変えられる…実装はせず…考えて」。添付`f87f5c95…png` / `c4d4228e…png` / `9fbf4e6f…png`。未着色眼の簡略化と現状の品質指摘は要求、完成原画からのレイヤー制作は検討を求めた候補手法として区別。下のQ表を優先。 |
| I19 | 「OKです。まずは姫1枚で確認できるよう、実装してください」。I18の提案を姫1枚で試作する実装指示。全10への展開・候補素材の正式採用・外部公開への承認とは区別する。下のP表を優先。 |
| I20 | 「現状の添付のこれも怖いからね？線画は一番最初か二番目くらいのやつでいいんだよ。色塗った時だけ、きれいに加工してあげれば」。添付 `ac260075…png`。白地opening＋小丸だけの候補を却下。初期のシンプルな眼へ戻し、未着色と着色後の見た目を分ける。 |
| I21 | 「ホーム画面で各ボタンに枠線…なくして自然に」「全ゲーム制作…スキル化」「メニュー遷移後…タイトルもいらない」「左上のもどるボタンと『おひめさま』…メニュー…画像…縮小」。添付 `299b0b6d…png` / `17bbcdf5…png`。ホームの装飾枠を撤去、大きいテーマ見出しを撤去、個人ゲームUIスキルを作る。戻る操作の解釈は後のI23で変更。 |
| I22 | 「今、添付のようになってるかな？黒目の部分は白くして」。添付 `d16d48e7…png`。I20への実装者案だった未着色の黒い瞳を白へ変更。着色後の暗い瞳/自動反射を廃止する指示ではない。 |
| I23 | 「ホーム…まだ…縁が透過…影…とにかくまだ不自然」「修正前の戻るボタンに戻して、画像自体は戻るボタンの右に少しの余白…もっと…小さく」「線画プレビュー…大きすぎ…元のほうがよかった」。添付 `8d76b8d9…png` / `d3859c73…png`。島画像自体の戻るボタン化を撤回、独立矢印＋小画像、従来の線画一覧サイズへ復帰。透明画像周りの面/影を再検査する。 |
| I24 | 「途中さくひんも消せる機能をつけてください」「背景は薄い半透明っぽい色味ではなく、ちゃんと背景として成り立つ自然、建物、空間を意識して画像生成してつくってください」「フレームは素材をちりばめるだけじゃなく、装飾を意識し、中には意匠の凝った豪華なフレームも用意してください（絵を隠さないことが前提）」。途中タブからの削除を追加。背景は完全な不透明風景、枠は連続した縁/角飾りの生成原画へ作り直す。選択数11/21と旧作品/旧素材の保持は未撤回。 |

## 変更・撤回・継続の記録

| 項目 | 先の仕様 | 現在の指定 / 判定 | 根拠 |
| --- | --- | --- | --- |
| イラストの制作方法 | I0§11には、画像生成不能時の完成SVG代替がある | 本件のホーム/正式線画は画像生成。以前の手描き10枚を正式採用しない。旧作品用の旧IDは保持 | I1・I2が優先。I13も生成優先 |
| 正式線画の着色 | 提示された旧見本は着色済み | 正式線画は白地黒線の未着色。検証用の塗った比較画像は正式線画と区別 | I2。塗り絵機能を廃止した指示ではない |
| 黒目 | 黒く固定された点/面、I20への実装者案では初期の黒い瞳を再利用 | **未着色は白い内部＋初期のシンプルな輪郭**。着色後だけ選択色の虹彩/同系の暗い瞳/反射を生成。姫とうさぎは原本princess-v2の眼を再利用 | I22が未着色の黒い瞳を撤回。I3・I8の色選択を維持 |
| ハイライトの操作 | I4を受け、枠を独立領域として手動で塗る旧版 | **手動塗りは撤回**。目へのタップに統合、まとめ塗りでは同キャラ両目、部分では片目 | I8。I9は手動操作の復活を指示していない |
| ハイライトの線画枠 | I18の白地＋小丸案をI19 master-v1で試作 | **I20でこの現物は却下**。I22に従い初期v2原本の白い瞳の簡単な線画へ変更。着色後を厳密な線画枠で再現しない。現候補では追加の反射枠を描かないことは制作判断であり、人間採用とは区別 | I20・I22優先。自動補正・消去復帰・手動操作廃止は継続 |
| 実装の範囲 | I18では検討のみでコード・素材制作をしない | I19で姫1枚の内部完成原画＋相対光マップ＋native眼を実装。I21/I23でホーム/線画メニューと全ゲーム向け個人スキルを追加。残る9枚の新方式は未実装 | I19〜I23。正式採用の自動記録はしない |
| 目の完成基準 | revision 3の暗い楕円＋大きい白丸を候補として作成 | この候補をユーザーが却下。ホーム原画を実際に比較し、未達の特徴を列挙して修正 | I12。監査/実装者の旧技術PASSは採用ではない |
| 光の大きさと位置 | I8の主/補助光、旧実装は大きな左上白丸 | 本homeを分析し、小さい右上の不規則な反射、外側の白目、同方向視線、柔らかな瞳縁/繊維へ改善 | I12の制作判断。画像分析を人間の採用回答と混同しない |
| 「白目部分」の選択色 | I9の選択色グラデーション | **撤回：白目は白で確定**。虹彩のみ選択色の色相、同系のほぼ黒の瞳、白い反射。茶/金を全色へ混ぜる処理は廃止 | 後の明示回答I16・承認計画I17。U01解消 |
| キャラクター共通の眼縁/まつげ | v2が全キャラへ追加まつげ・暖色の眼縁を生成 | 姫だけ控えめな制作まつげ。男の子に追加しない。動物/恐竜は種類別制作形状。元眼縁は新版から除き二重化しない | I15・I17。共通処理を使った事実は旧実装の記録であって指示ではない |
| 車の顔 | 採用旧ショベルに目/口/眉がある | 新線画/ホームから除去。実部品を維持。今後の車も顔なし。削除部位の色はコピー時に捨て、部品へ転用しない | I15・I17。旧採用hash/旧作品は保持 |
| 塗る単位 | 小さな閉領域ごと | 標準は意味グループ。部分モードを残す。色/材質だけの自動グループ化を使わない | I6・I8 |
| 肌の質感 | I0§14は粒子なし/非常になめらか | 選択画材の特徴を肌にも残す。この点は旧「粒子なし」より優先 | I8、およびI7・I10・I11 |
| 画材表現 | 白い線を重ねた従来方式、スマート質感強度の目安 | 生成した紙目・蝋顔料・筆圧/繊維を使い、原寸で実物らしく区別。強度は目視優先 | I8・I10・I11。種類はsmooth/crayon/pencilの3種を維持 |
| 陰影単位 | 小領域ごとに明暗を作る旧方式、I18では完成原画方式を検討のみ | I19で姫1枚の試作に採用。13の制作グループごとに元の色を除いた相対影/反射を生成原画から抽出し、自由色へ合成。完全なPSD自動分離や全10展開とは異なる | I8・I18・I19。木・石・毛など残る素材を廃止しない |
| 拡大描画 | 低解像度CanvasをCSSで拡大 | DPRとzoomに応じてviewportだけをタイル描画。1〜4倍、32MiB×2のcache上限 | I8。初期4:5/1600×2000/PNG2048×2560は継続 |
| ホームの文章 | キャッチコピー/案内文を大きく表示 | ホームは小さいロゴ/設定の直下から島一覧。文と文字用の島を撤去 | I6・I8。I0§28のOGPコピーまで撤回されたとは扱わない |
| 島の名前 | イラスト下の平坦な別ラベル | イラスト内の曲線SVG装飾文字。日本語/読み上げ名は維持 | I6・I8 |
| ホームのボタン周辺 | 角丸の白枠/面、枠撤去後にも容器の薄い四角い影が残った | 装飾border/背景/容器shadow/文字filterを撤去。透明な生成島と装飾文字で表示する。全ゲーム向け個人スキルとして保存 | I21・I23。操作状態/focus-visibleは保持 |
| テーマの戻る導線/見出し/プレビュー | 大きいhero見出し。I21への実装者案で132pxの島画像ボタン＋大きな480px preview | 大きいheroを撤去したまま、**元の独立44px矢印ボタン**、10px間隔の右に80px非操作画像。プレビューは従来のdesktop3列/mobile2列の幅へ復帰 | I23で画像自体の戻る操作とpreview拡大を撤回。数値は制作値で、人間のサイズ指定と区別 |
| ホームDesktop列数 | I0§7・27の3列 | **撤回の指示は確認できない**。現行CSSの1000px以上4列は差異として未完了 | 初期仕様を継続。Mobile8島目標はDesktop4列の許可ではない |
| 背景/枠 | 背景最低10、枠20前後。I8の小motif/景観partを低opacityで合成した旧版 | **I24で淡い半透明風背景・motif散布だけの枠を却下**。10種の奥行きある完全風景を個別生成しopacity1。20種の連続した縁/角飾りの枠を個別生成。白/なしを含む11/21を維持。新枠を絵の後ろへ描く制作方針で非遮蔽を保証 | I24優先。原画/構図/中央の静けさと顔髪手を隠さない条件、hash素材合成/選択時取得は継続。外周100pxだけという旧実装値はユーザー指定ではなく、新枠の合否は実際の非遮蔽で検査 |
| 途中作品の削除 | 完成作品の詳細には削除あり。途中作品のカードは直接editorへ遷移し削除入口なし | **途中タブのカードに独立した削除操作**。確認/取消/処理中/失敗を扱い、所有者と保存revisionを確認して削除。元の完成作品削除は継続 | I24 / B25。新schema/DB migrationは不要。利用者の実作品を検証用に削除しない |
| 作品/採用の互換性 | 旧10枚の人間採用 | 改善版に新ID、別作品へ色コピー、旧版原本/作品/承認hashを保持。DB migration追加なし | I5は旧hash限定。I8の新geometryへ承認を流用しない |
| タップの演出 | I0§16・30の非ブロッキング150〜220ms塗り広がり | **撤回の指示なし**。v2 engineは即時更新のみなので現状不足 | I8の1タップ1更新/保存とは両立する設計が必要 |
| 対象外 | 初回SNS/課金/広告等なし | 継続。外部公開・共通Core変更・有料API切替も今回対象外 | I0§1・38、I8、I13 |

## 証拠台帳と有効範囲

固定コピーとSHAは [traceability-20261008/evidence.json](../test-results/storybook-improvement/traceability-20261008/evidence.json)。**記録したhashは観測したファイルの同一性を示すだけで、テスト実行対象との一致を後付けで証明しない。** この固定記録を次回の検査で上書きしない。

| 証拠ID | 確認した事実 | 使用できる範囲 / 使用できない範囲 |
| --- | --- | --- |
| E0 | 原文とproduct-specはバイト一致。旧採用10件のcontentHash/原画SHA一致。現行compiled10件、148グループ、22眼、386選択領域。40 current＋2 history素材原本のSHAは42/42一致 | 要求原文と原本の保全/構造の現物確認。UI動作・見た目・人間承認の証明ではない |
| E1 | [旧最終監査](audits/20-release.md)、373 unit、177機能、旧画面5構成/性能のPASS | **旧版限定の履歴**。改善版の完了には使わない |
| E2 | 全体Unit 47ファイル380件成功。[固定JSON](../test-results/storybook-improvement/traceability-20261008/frozen/test-results/storybook-improvement/unit-final.json)。その後に瞳/まぶた/反射光をさらに変更 | 変更前の候補のUnit/SQL結果。前後source hash固定は未記録。最新の目の修正、ブラウザ、視覚合格には使わない |
| E3 | 最初の機能E2E：144成功、38失敗、6対象外。[固定JSON](../test-results/storybook-improvement/traceability-20261008/frozen/test-results/storybook-improvement/regression-initial/browser-results.json)、失敗動画/trace保持 | 失敗の再現資料。待機/旧セレクタの修正を書いただけで失敗を解消扱いにしない |
| E4 | 最新候補の[独立revision 4比較](audits/storybook-content.md)はSB-C04 P1/FAIL。[固定した監査原文](../test-results/storybook-improvement/traceability-20261008/frozen/docs/audits/storybook-content.md)、[比較画像](../test-results/storybook-content-audit/revision-4/home-vs-princess-brown-eyes.png) | 目がホーム品質へ未到達である証拠。画像から保存/消去成功を推定しない |
| E5 | 先行候補でnative7検査：全10の輪郭/タイル、22眼、3画材、素材42原本/11背景/21枠等を確認。画像は固定snapshotへ保存 | 最新の柔らかい瞳縁/まぶた/反射光のソース編集**より前**。その編集の成功には使わない。90画面すべての目視済みでもない |
| E6 | demo build成功。配信entry `index-Dx55cycc.js`。現在の目の追加ソース編集はこのbuild後 | このbuildだけの成立。**配信buildと現在のソースは異なる版**。現在の画面を新修正の証拠にしない |
| E7 | [描画/保存の独立限定監査](audits/storybook-engine.md)は対象hashに対するLIMITED PASS。改善コピー、500件、quota中断等を局所確認 | 変更していない保存処理の参考根拠。変更後engine/全機能/最新buildの包括PASSへ転記しない |
| E8 | 最新ソースの所在・SHA、現行compiledのhash、過去画像のSHAをE0の固定JSONに記録 | 追加の目修正はソース着手を確認しただけ。生成/型/lint/build/描画/独立再確認は未実施 |

E0〜E8は**2026-10-08の固定履歴**。「現在/最新/未実施」は当時の観測。新しい実行を下へ記録し、旧結果を上書きしない。

| 証拠ID | 新対象・生証拠 | 有効範囲 / 限界 |
| --- | --- | --- |
| E9 | [固定開始](../test-results/vector-improvement/vector-accepted-start.json)、[途中同一性](../test-results/vector-improvement/vector-accepted-mid.json)。demo aggregate `f3c10731370481c0235c267e41aed0b1ff4b3591ec8338544289c6d8eb3ffb29`、runtime source `0d541904f919f7fefb6d6db2d1e8da31f09814621a0a817ce1e78adcd8c6a276`。10候補/403制作領域/383選択領域/146groups/20眼 | 全体harnessは2cloud fixture file変更があり不変としない。[比較](../test-results/vector-improvement/vector-accepted-harness-comparison.json)で両run前の変更完了/Unit定義・browser harness不変を記録。配布/sourceは前後不変 |
| E10 | [Unit49ファイル390成功](../test-results/vector-improvement/unit-vector-accepted-candidate.json)、[Chrome mobile15成功](../test-results/vector-improvement/browser-accepted-candidate-results.json)、[PC/320px layout8成功](../test-results/vector-improvement/browser-layout-accepted-results.json)。失敗/retry0。90zoom/DPR＋pan30＋return30、20眼5色、実7template PNG、旧copy3 | 指定の自動検査だけ。初期desktop3列や全機能新版177件/人間採用/実機の証明ではない。Firefox/WebKitの32件はf818のscopeとbyte不変をE11で区別 |
| E11 | [独立engine/旧互換](audits/vector-engine-20261009.md)、[独立目視](audits/vector-visual-20261009.md)。旧v1/v2各40pixel oracle、全10境界、20眼×5色、f3c車固定白2点を実検査 | 監査原文のhash/範囲だけ。初回〜revision7 FAIL保全。直接開いた画像と同一byteの既目視画像を区別。旧20の最終PASSや人間採用の代用ではない |
| E12 | f3c [本物SW更新/保留commit保護/offline復帰](../test-results/vector-improvement/pwa-update.json)、[前後identity](../test-results/vector-improvement/pwa/build-identity.json)。2tab/作品zoom保持、maskable不透明、errors0 | home480/960hash WEBP cache漏れを修正後に採証。初回FAILはpwa-cache-failure-diagnostic/へ保持。実HTTPS/端末installとは別 |
| E13 | [非demo source SDK/HTTP/SQL 9成功](../test-results/vector-improvement/cloud-source-e2e-accepted/results.json)、[source/harness前後一致](../test-results/vector-improvement/cloud-source-e2e-accepted/run-identity.json)。3engineでoffline再接続/503retry/2device CAS | mode:non-demo source preview/build:null/productionBuildVerified:false。素材人間承認gateで本番cloud build停止、迂回なし。Vite WS9FAIL、no-cache brand2FAILは別raw保持。fresh HTTP public cacheのfixture条件を記録、実外部/本番SW/実端末ではない |
| E14 | [f3c分離性能raw](../test-results/vector-improvement/performance.json)。CPU4/DPR2、最大面積姫skirt6領域 firstCanvas p95 7.0ms、最大所属robot14領域13.3ms、3画材×12色×2対象72raw、前後build/source/harness/script一致 | 画材別最大p95 23.0ms。2rAF代理値max119.4も保持し、物理present/60fps/実機PASSとは呼ばない。旧f818結果は[別保存](../test-results/vector-improvement/performance-f818.json) |
| E15 | [検査後identity](../test-results/vector-improvement/vector-accepted-end.json)、[証拠index](../test-results/vector-improvement/evidence-index.json)、[今回の統合検証](vector-revision-verification.md)。独立目視/engine限定PASS後に[旧10baseline保全](../test-results/vector-improvement/previous-visual-baselines/manifest.json)→[新基準更新5成功](../test-results/vector-improvement/visual-baseline-update-results.json)→[更新なし比較5成功](../test-results/vector-improvement/visual-accepted-results.json)。最終lint/型成功 | 配布/runtimeは開始/途中/検査後一致。全test-harnessは途中/検査後一致、開始後2fixture変更はE9で説明。30nativeは9不変作品27枚＋最終車3枚で[manifest](../test-results/vector-improvement/accepted-native-media.json)を構成し、旧車3entryを除外。人間新採用/全体READY/全32装飾受入とは別 |
| E16 | I18添付3枚と`content/brand-generated/originals/princess-v1.png`を開いて比較。`authored-eye.ts`の未着色処理が虹彩・瞳・大小反射を囲むこと、`build-vector-content.mjs`のSVGにも内部枠があることを確認。`storybook-texture.ts`は共通gradient・髪のradial glow/一般curves・布の帯状gradientを使用。`storybook-engine.ts`はDPR/zoom別tileを描画 | 2026-10-09の読取・設計検討のみ。添付撮影時のtemplate ID/renderer/build/DPRは未確認。眼縁の粗さの単一原因、改善案の画質・性能・自動レイヤー分離の成立を証明しない。新コード・生成画像・実行検査なし |
| E17 | I19〜I23の姫master-v3。最適化前の[revision-2](../test-results/princess-master/revision-2/)、固定build `a6274daa…e86c` / source `a72b8024…591e`。全Unit398、新Chrome8、offline1、旧v3の40RGBAが成功。native21・menu6PNGと3サイズ実測・個人skill構造検査。独立engine/visual追補1 | 同じ固定版の性能は**FAIL**：skirt p95 91.6ms、hair118.2ms、cold最大2060.8/424.6ms。全体NOT READY。398成功やvisual限定PASSを次のruntimeへ転用しない。I19初回の未着色FAIL・旧性能・画像も上書きしない |
| E18 | 最適化後の[revision-3](../test-results/princess-master/revision-3/)、固定build `7aaa0804…4cda` / source `7f36c84f…8f2c`。関連Unit13、新Chrome8、offline1、旧v3全40RGBAが成功。native21の全画素がE17と一致、旧master-v1/v2の8状態も固定旧moduleと一致。型/lint/demo build exit0 | v4陰影のsource cropだけを最適化。template/map/眼/UIは不変。全398件再実行ではない。性能と最終独立追補は別結果で判定する。[詳細](princess-master-verification.md)。人間採用・全10新方式・実機・外部同期の成功は推定しない |
| E19 | [修正版3性能](../test-results/princess-master/revision-3/performance.json)。CPU4/DPR2、姫最大面積skirt6・最大所属hair7、各3画材×12色の36raw、build/source/script前後一致。firstCanvas p95 skirt**311.2ms**/hair34.2ms、最大422.1/183.6ms | **全体FAIL**。同じ性能ゲートがE17/E19で2回未達のためAGENTSの停止条件を適用し、追加のruntime変更/性能再測定を止めた。画材別/lastCanvas/2rAF代理値も保持。悪化の原因は未確定。次の最小作業は遅いskirt標本の単一traceによる切分け。人間採用/全体READYではない |
| E20 | [最終表示capture](../test-results/princess-master/revision-3/browser/menu-settled/evidence.json)。新build/source不変、別script SHAを記録。実際の島のanimation.finished・全12opacity=1を待ち、390/320/1000pxでhome/themeの6PNG。CSS強制変更なし | E18の元home PNGの一部は登場途中に撮られた薄い表示で、最終自然さの証拠から区別して保持。作者は新390px home/theme、独立visualは新6PNGを直接確認し、最終表示には薄さが残らないことを確認。次回capture harnessにはanimation完了待ちが必要 |
| E21 | [最終identity](../test-results/princess-master/revision-3/identity-after-audit.json)の配信build/source/harness/entryは開始時と一致。独立[engine追補2](audits/princess-master-engine-20261010.md)と[visual最終追補](audits/princess-master-visual-20261010.md)。source59/build735/harness4+15不一致0、content675件のbyte保持 | engineは描画保全限定PASS・PM-E02/04解消・P05性能FAIL。visualは新14画像とnative21hashでI22/I23限定PASS。人間採用/ホーム同等品質未成立、B07 desktop4列差異・全体NOT READYを維持。原文旧FAILと旧追補はappendで保全。[停止/次作業record](../test-results/princess-master/revision-3/handoff-record.json)を保存 |
| E22 | I24の[実装・検証記録](scene-art-v3-progress.md)。新30生成原本/逐語prompt/hash、旧catalog byte保存、新11/21可視。build `a149955e4dcae08e5aa5ce0115ca25fc671fc76603c920baac2b04249708546c` / source `f57d0e3d0cddb07a5abb0409e1c9a8a99d2fc1ce3c256699788f34b5faab8b90`。[関連Unit25](../test-results/scene-art-v3/revision-1/unit.json)、旧v3 40RGBA一致、型/lint/demo build。新[Chrome10](../test-results/scene-art-v3/revision-2/browser/results.json)と[offline1](../test-results/scene-art-v3/revision-2/offline/results.json)、姫全30×2幅60実画面/2048PNG | 初回rev1は4成功6失敗（locator2種、細かい宝石の単pixelと縮小表示の比較）。失敗原文/trace/前後identityを保持。検査側だけを修正したrev2は同じapp/source/buildで10成功。PNG実composition照合を維持し、画面比較は同一解像度PNGの5×5平均・許容25。全10非遮蔽は320px/DPR1/smoothのnative合成。実機/全倍率全組合せ/実同期/全体性能/人間採用の証拠ではない。独立確認と最終hash照合はS表に記録 |

## 改善計画の項目別進行表

全行がI8の項目に対応する。後の指示がある行ではその指示を優先。表の「実装済み」は受入完了ではない。

| ID / 現在の要件 | 指示元 | 状態 | 確認した証拠・残る限界 | 次の作業 |
| --- | --- | --- | --- | --- |
| M01 標準まとめ塗り＋部分モード | I6・I8 | 検証済み | E10で初期group/region切替/消去/再読込、E13でmodeの同期保持 | 人間受入U02と全体回帰B32は別 |
| M02 肌/髪の意味分類、口/服/手袋/別人物は分離 | I8 | 検証済み（姫/男の子） | magic skin=r06/r09/r17/r20/r28/r33、姫hair=r03/r06/r08/r09/r13/r15/r17。E10実tap→全構成同画材保存/部分消去/reload、E11 exact hit | 他キャラの制作判断の受入はM04/U02 |
| M03 姫/男の子の肌・髪・服・スカート・帽子/つば・袖・ズボン・靴等 | I8 | 検証済み（制作data/描画） | E10全選択領域/groupsと実matrix、E11共有境界。部位対応は制作値、現在色で判定しない | 制作陰影M14と演出B16を進める |
| M04 残る8枚の動物/車体/タイヤ/花ごとのgroups | I8・I17 | 実装済み | 現在全10で146 authored groups。E10全group描画/全hit、E11対応不変。車の顔色対応は廃止 | 全意味分類の人間受入と残る制作陰影 |
| M05 一括同色同画材/消去mode/1操作1更新保存 | I8 | 検証済み（列挙操作） | E10 Unitで1paint/1frame・無効IDで部分更新なし、実UI group/部分/消去、E13同期payload | 全機能B32とタップ演出B16の接続 |
| M06 選択色虹彩/同系暗瞳/上影/白反射/両眼片眼/tap統合 | I8・I9・I12・I16・I17 | 検証済み | V04/V06/V07、E10/E11。白目白に更新、20眼×5色・7templateの実tap/reload/PNG | 新採用U02と実機U04 |
| M07 初期風の白い瞳/着色後自動反射/消去復帰 | I9・I17〜I22 | 未完了（全10展開） | 姫とうさぎはP01で新版実装・新Unit/Chrome検証。初期v2原本の白い内部＋単純輪郭、着色後だけ加工。旧小丸のみ/黒い瞳の候補を撤回。E10/E11を新表示へ流用しない | 新hashの独立目視、人間候補確認、残る9枚へ仕様を展開 |
| M08 ホーム姫の眼分析、不足列挙→改善 | I12・I17〜I22 | 未完了（ホーム同等品質の受入） | P02で姫4眼をnative final viewportへ直接描画し、外縁に繊維を置かない。新Chrome1/2/4/2.65倍×DPR1/2/3。旧独立所見にある太い線/白目と顔の連続感などのホームとの差を保持、同品質到達を断定しない。過去添付の撮影条件U07は不明 | 新候補で独立比較と人間確認。改善版の見た目を旧技術PASSで閉じない |
| M09 種類ごとの新版20眼を自然に仕上げる | I9・I12・I15・I17・I18 | 未完了（線画/眼縁） | 20眼の制作形状・非姫lashesなし・操作のE10/E11は保持。I18姫/男の子/うさぎの新見た目受入は未成立 | 種類の形を維持してQ01/Q02へ。全種を真円へ統一しない |
| M10 なめらか：均一塗膜＋柔らかな立体感 | I8・I17 | 検証済み（比較/境界） | E10/E11の同部位3画材、smooth境界と元眼縁回収。技術比較は人間採用ではない | 残る制作陰影M14/人間U02 |
| M11 実物らしいクレヨン：厚い顔料/不規則な抜け/幅広い筆跡 | I7・I8・I11 | 実装済み・比較検証済み | 固定wax生成素材/紙目/筆圧。E10/E11全10原寸3画材で区別。実物の添付は比較資料、採用ではない | 造形/全素材の最終人間受入U02 |
| M12 実物らしい色鉛筆：方向/筆圧/重ね塗り/紙繊維 | I7・I8・I10 | 実装済み・比較検証済み | 固定pencil生成素材/色付き細線/半透明筆圧。E10原寸比較・決定論・PNG、E11独立目視 | 残る材質/方向制作M14/B14と人間U02 |
| M13 生成紙目と画材マスク3種/seed座標固定/肌にも画材 | I8・I10・I11・I13 | 未完了（枚数解釈） | paper1＋wax1＋pencil1を使用。E10 zoom/reload/PNG決定論/肌画材。紙目に加えて3種なのかはU06未確定。irisは代用しない | 対応を明示し、不足なら追加生成。未知を推測で閉じない |
| M14 毛流れ/服の折り目/グループ共通陰影 | I8・I18・I19 | 未完了（全10） | P03で姫1枚の内部生成完成原画から13グループの相対影/反射を実装。原寸/4配色/3画材の新native画像、白/黒も選択色を維持。元まぶた/口の影が二重化した失敗を保持して保護/補間で修正。完全PSD分離や全10実装ではない | 姫新hashの独立比較、人間確認後に残る9枚の専用完成原画と陰影を制作 |
| M15 Bezier輪郭/角穴細部保護/隙間漏れ二重線なし | I6・I8・I17・I18 | 未完了（眼縁の粗さ） | V01/V02・E10/E11の共有境界/白下地/鼻口等の技術証拠は保持。I18の眼縁の画質はこれらだけで解消としない | Q02でベクター曲線と最終pixelの双方を確認。新geometry受入U02、実機U04 |
| M16 DPR viewport/zoom1〜4/tile overlap | I8・I17 | 検証済み（自動/独立目視） | E10/E11全90＋pan30＋return-fit30、native tiles。DPR3→2→1を原pixelで撮影、前後密度一致。E15新基準比較 | 実機U04、全装飾scene M23 |
| M17 tile/image各32MiB/必要素材だけ取得 | I8 | 実装済み・Unit範囲検証済み | cache byte cap/loader dedup、E10全90のtile上限、E12新hash home cache。全実scene連続切替の受入は別 | 最大sceneの実decode/転送/長時間メモリを確認 |
| M18 編集/完成/thumb/2048×2560PNG共通規則 | I8・I17 | 検証済み（列挙surface） | E10 3画材6native PNG/7眼templateの実PNG反射pixel/旧copy PNG、thumbnailも共通dispatch。E11旧oracle | 装飾全合成M23/全機能B32/人間U02 |
| M19 copy/案内/枠と残留影撤去/ロゴ直下12島 | I6・I8・I21・I23 | 検証済み（新Chrome3サイズ） | 新menu実PNG/DOMでborder0、背景透明、container shadow none、文字filter none。大きいテーマheroも撤去、旧矢印と右の小画像は別要素。P06。OGPコピーは継続 | 全体装飾の人間受入U02。Desktop3列不足B07/B27は別 |
| M20 イラスト内の曲線SVG日本語/読み上げ名、compactテーマ画像 | I6・I8・I21・I23 | 検証済み（表示/操作） | P06の新Chrome3サイズ。共通IslandMenuArtの日本語、home button aria名、unique SVG path ID。テーマ画像は80px/非操作/aria-hidden、独立44px戻るボタンでhomeへ遷移 | 新しい人間の制作受入U02。旧axe結果を新UIの包括合格にしない |
| M21 初期8島390×844/320px overflowなし/compact作品導線 | I8・I21・I23 | 検証済み（新390/320/1000px） | P06で390初期8島以上、320水平overflowなし、画像/ボタンの幅と10px間隔を実測、従来preview幅へ復帰。短い他viewport/全paletteはこの検査の対象外 | 初期desktop3列B07/B27はこのPASSで閉じない。実機U04 |
| M22 個別生成素材/不透明風景/意匠のある枠 | I8・I13・I24 | 検証済み（新30素材の制作/技術範囲）、人間採用は未完了 | E22。built-in個別30生成、逐語promptと原本SHA。10風景はopacity1/全pixel不透明。20枠は連続した4辺/角飾り、豪華な金工/宝石等。原本一覧と実姫合成を直接確認 | S表の独立確認。新hashの人間採用を旧承認から転記しない |
| M23 テーマ別風景/連続した装飾/絵の非遮蔽 | I8・I24 | 検証済み（列挙合成範囲）、全制作受入は未完了 | E22。背景全10/枠全20×姫×PC/mobileを撮影。生成枠を歪ませず4辺へ分割しbehind-artwork。全10線画で全面magenta枠を使い、不透明主役RGBAがviewport/PNGとも差分0（320px/DPR1/smooth）。初回96px細帯試作は弱いため不採用履歴を保持 | 全10×全scene×全倍率の実画面/実機は未検査。S表の独立目視と人間受入 |
| M24 hash URL合成manifest/素材/11背景21枠 | I8・I24 | 検証済み（local/可視32・互換性の列挙範囲） | E22。新scenic-v3/atelier-v3、白/なしを含む11/21。旧catalog byte/旧ID/URL/全533hash content保持、旧v3 40描画不変。Chrome保存/reload/PNG/複製/offline成功、起動時runtime新装飾の先読み0 | 旧noProfile作品は旧選択肢/旧描画を保持。外部でnoProfileと新composition IDを組み合わせた復元は未検証。実外部同期/実機は別 |
| M25 groups/制作eyes/shading/旧対応とbulk/viewport API | I8・I17 | 検証済み（型/候補data） | v3型/validator/schema、E10と型を含むdemo build、E11共有境界/眼対応 | 制作UI B13と残る陰影M14 |
| M26 RegionPaint/schema維持/metadata識別/migrationなし | I8・I17 | 検証済み（型/DB/local） | E11 Project/RegionPaint AST不変、IDB version3/SQL migrations3。E10 save/reload/backup、E13実SDK v3/mode保持 | 非demo本番build/外部実接続は未完了 |
| M27 新ID、旧原画/領域/renderer/装飾/作品保持 | I8・I17 | 検証済み | E11旧hash/v1v2各40pixel oracle/10＋10copy/500/quota、f3cで旧byte不変。E10 UI旧copy/PNG | U02。旧作保全PASSを新版造形へ転用しない |
| M28 別作品コピー/元非上書き/500と失敗でも保持 | I8・I17 | 検証済み（対応/失敗境界） | E10/E11 atomic copy/v1v2元deep一致/5削除顔色非転用/500/quota/abort、E13競合保持 | 新採用U02、実端末/外部U04 |
| M29 部分/消去/save/reload/同期/PNG、新旧双方 | I8・I17 | 検証済み（列挙local検査） | E10最新UI/Unit、E11旧oracle、E12本物SW、E13非demo source SDK/HTTP/SQL。旧E3は上書きしない | 非demo本番buildは素材gate未成立、全機能新版一括回帰B32/実接続別 |
| M30 新hashへ旧承認非転用/自動眼指定記録 | I8・I9・I12・I17 | 検証済み（保全/記録） | candidate QA pass:false/author-technical、旧human記録未変更。新原本/geometry hashとE9〜14を分離 | 具体的候補で新採用U02を別記録し、production gateを満たす |
| M31 全10/90条件/原寸3画材/実homeと装飾後Visual更新 | I8・I12・I17・I18 | 未完了（I18 Visual/全装飾） | E10〜15のI17固定検査は履歴として保持。I18の線画の親しみやすさ/眼縁/髪と服の陰影の証拠に転用しない | Qの候補作成後に新hashで再判定。M23全32scene、人間U02も継続 |
| M32 固定build最大group CPU4/DPR2 firstCanvas p95≤100ms | I8・I17・I19 | 未完了（姫新版の性能ゲートFAIL） | E17/E19で同じ規定が2回未達。最新skirt311.2/hair34.2ms、各36rawとcold/画材別/lastCanvas/2rAFを保持。AGENTS停止条件に従い変更・測定の反復を止めた。E14/f3cの旧v3/robot14を今回の合格に流用しない | 次の作業開始後、skirt遅延の単一traceで原因を切分ける。全10最大所属、実機/物理present/長時間U04は別 |
| M33 関連独立再監査/全体最終判定 | I8・I0§33〜36 | 未完了（全体） | E11のv3 engine/互換/目視は最終限定PASS。旧20と今回の限定判定は別 | 残るM/Bと新採用後に新版Agent20。root単独でREADYにしない |

## 初期計画の継続要件と差異

初期§1〜40も進行基準に残す。以下で「実装済み」と記した既存機能は、旧版の合格を新版へ移した意味ではない。新版で必要な接続/回帰は次作業欄に残す。

| 初期項目 / 継続する要件 | 指示元 | 状態 | 確認した証拠・差異 | 次の作業 |
| --- | --- | --- | --- | --- |
| B01 Web/PWA、無料、Google表示/provider抽象化、不要なメール複製なし、SNS/広告/課金なし | I0§1 | 実装済み | architecture/auth/settings。E2にauth/SQL unitあり。実Google接続は未確認 | 最新ブラウザcallback/認証境界、外部設定はB37 |
| B02 React/TS/描画/制作runtime分離、420枚拡張 | I0§2 | 実装済み・v3境界検証済み | v1/v2/v3 dispatch、profile別renderer、E10/E11。関連docsへv3/旧履歴を明記 | 残る全体検査B32/制作UI B13 |
| B03 IDB即時→debounce同期/flush/状態正本 | I0§3 | 検証済み（local回帰） | E10保存のUnit/実UI、E13 real SDK/HTTP/SQL。renderer/modeは既存metadata、zoom/panは保存しない | 外部実同期U04・全体B32 |
| B04 version競合で両作品保護/子ども向け表示 | I0§4 | 検証済み（fixture） | E13 2device CASで双方region/profile/mode保全、3engine各1ケース | 実外部2端末はU04、fixtureを実機と呼ばない |
| B05 保存/offline/失敗/再試行/長時間未同期表示 | I0§5 | 検証済み（列挙local操作） | E10 quota/短viewport通知、E12更新保護、E13 offline/503/retry。模擬通知と実SDKは別 | 全体B32/実外部U04 |
| B06 manifest/SW/icon/install/offline shell/全件先読みなし | I0§6 | 検証済み（local SW） | E12本物SW/2tab/保留commit/offline保持。新480/960hash home cache漏れを修正、error0 | 実HTTPS/端末install U04、全420を初回cacheしない |
| B07 12テーマ、2階層、安定した島UI、mobile2列/desktop3列、作品導線 | I0§7、I6・I8 | 未完了 | 新版homeあり。Desktop4列へ変更されており未承認の差異 | 3列へ合わせ、M19〜M21を確認 |
| B08 初回10線画、420枚の配分は将来目標（500作品と別） | I0§8 | 実装済み | E0 current10/12テーマ。420件の実制作は今回対象ではない | 10の制作受入を完了。空テーマを架空作品で埋めない |
| B09 途中＋完成500、古い作品を自動消去せず閲覧/PNG/削除可 | I0§9 | 検証済み（local境界/改善コピー） | E10/E11 quota/500/abortで元保持、M28と旧UI copy3成功 | 全作品UI新版回帰B32、実外部同期U04 |
| B10 4:5/1600×2000/PNG2048×2560/閉領域/白黒 | I0§10・I2・I3・I17 | 検証済み（候補） | E10新10/403領域/PNG、E11構図/細部/共有境界 | 新採用U02。候補と承認済み本番を分離 |
| B11 original10主題/幅領域数は目安/IP模倣なし | I0§11・I2・I5・I17 | 実装済み・独立局所検証済み | 原本/旧hash保全、E11全10構図・小部位・顔なし実部品 | 新geometry制作受入U02/B13 |
| B12 制作OpenCV/原本mask分離/閉領域QA/debug | I0§12・I17 | 実装済み・新境界検証済み | nested ink graph/Bezier/boolean共有境界、E10/E11。2固定白detailをsource SHA guardで新版だけ除去 | 全制作レビューUI B13、承認済みのみ本番 |
| B13 日本語制作UI、原画/領域/素材/3画材、編集/信頼度/承認、承認済みのみ | I0§13、I8 | 未完了 | review APIは旧masterからbuild。v3 groups/authored eyes/shadingを保存し検査する統合は未確認。新版は技術候補。approved継承値trueはhuman採用でなくQA pass:false/review author-technicalで本番gate停止 | 新版review表示・保存・QA/canonical hash一致・rollback・人間採用を整える |
| B14 11素材の固定再現、髪/毛/布/金属/木/石等の特徴 | I0§14、I8 | 未完了 | 新版は髪/布/metal/glass/plastic＋一般shade。旧shade/highlight/texture flagの消費、木/石/毛の専用見た目維持に不足。旧v1/v2の描画は別保全 | 各素材の表現/制作用設定との対応を確認し、欠落を実装。肌は最新画材指定優先 |
| B15 3画材混在、完全上書き、けす、色選択で塗るへ、画材変更だけでは消去解除しない、Undoなし | I0§15 | 実装済み | Editor/RegionPaint、E2/E3の先行検査 | 最新group/region双方と再読込で再確認 |
| B16 非ブロッキング150〜220msタップ位置から広がる、最終像は位置非依存 | I0§16（撤回なし） | 未完了 | StorybookEngineは即時paintMany/render、activeAnimations=0 | 1操作1保存を維持してフィードバックを実装/性能測定 |
| B17 11島×12色、最大2操作、初期family、肌色カテゴリ/おすすめ/虹なし、mobile6+5/6+6 | I0§17 | 実装済み | paletteとE2。短画面/desktop収まりの先行E2E失敗あり | 最新layoutの132色・操作/読み上げ名を実確認 |
| B18 指定色の132swatches、分かりやすい色名/白系境界 | I0§18 | 実装済み | shared palette source/初期§18は変更されていない | 値の一致を現在の画面/選択/保存へ照合 |
| B19 WebSpeech、日本語なしで安全無効、初期OFF、選択時のみ、有料APIなし | I0§19 | 実装済み | TTS adapter、E1旧監査、E2 | 新版色選択/連打/設定切替のfallback確認 |
| B20 戻る/3画材/消去/完成、選択明示、ぬる/Undo/Redoなし | I0§20、I8 | 検証済み（列挙layout/操作） | toolbar/mode controls、E10の44px/短画面/選択contrast/フォーカス、E15新5構成画面 | 全体keyboard/完了失敗等の新版回帰B32 |
| B21 tap/pinch/pan/drag誤塗りなし/wheel/中心zoom | I0§21・I17 | 検証済み（Unit/列挙UI） | E10 pinch/pointer Unit、90zoom/途中pan30/fit30でpaint不変、密度変更もwork不変。旧E3失敗履歴保持 | 全機能B32/実タッチ端末U04 |
| B22 途中/完成で背景変更、主役opaque白下地、消去白、空間のある背景、未来都市/宇宙区別 | I0§22・I8・I24 | 検証済み（I24新素材/local列挙範囲） | E22/M23/M24。opacity1の景観へ更新。未来都市は建物/舗装路、宇宙は惑星/星雲/岩の空間として個別生成。主役の白下地は維持 | 実機と人間採用。全scene×全10の実画面は未確認 |
| B23 20前後の共通/テーマ枠、主役非遮蔽 | I0§23・I8・I24 | 検証済み（I24新素材/local列挙範囲） | E22/M23。20意匠＋なし、連続した縁と角飾り。金工/宝石の豪華な枠あり。旧E5の100px値を新枠の合格へ転用しない | 実機と人間採用、全テンプレートの見た目受入 |
| B24 完成時まず保存、1.8秒/低動き.3秒、使用色演出/文字なし、未着色可/採点なし/仕上げUI | I0§24 | 実装済み | Editor完成stage/既存CSS。塗り広がりB16とは別 | 新描画/準備待ち/保存失敗時の完成UIを確認 |
| B25 完成default/途中タブ条件、詳細/左右/PNG/scene/別作品複製/削除、透かしなし | I0§25・I8・I24 | 実装済み／途中削除は検証済み（新Chrome6） | E22。途中作品の独立削除/確認/取消/処理中、既存delete(expected)の所有者/CAS/tombstoneを再利用。PC/mobile各3件で取消・選択した作品だけ削除・再読込・他作品deep保持・別タブ更新保護・保存失敗と再試行を検査 | 他の旧B25検査を今回全件成功としない。WebKit/実外部同期/アカウント切替の新UI実試験は別 |
| B26 設定の音/動き/操作/作品data/account/法的文書/OSS/問合せ | I0§26 | 実装済み・Unit/axe確認済み | Settings/音/TTS/data recovery、E10現行390とPC/320px Settings axe。旧E2/selector失敗は履歴 | 全設定操作/backup復元/法的全文の新版全体UI回帰B32 |
| B27 PC/tablet拡張/mobile2/desktop3/palette/作品列 | I0§27・I8 | 未完了（desktop列数） | E10 shortscreen/44px/overflow/contrast成功。ただしdesktop CSS/testは4列で、初期3列の撤回なし | 3列へ合わせる。layout8のPASSを仕様一致へ流用しない |
| B28 島/海/しずく/色、OGPコピー、教育効果や男女カテゴリを作らない | I0§28、I6 | 実装済み | brand/assets/Home。ホームcopyだけ撤去、OGP要求継続 | 新版home/scene/styleとmetadataを確認 |
| B29 RLS/Storage owner分離、secretをclientへ出さない、env/SQL、安全削除 | I0§29 | 実装済み | E2の実SQL/RLS/削除回復、E1旧security監査 | 新buildでsecret/license、更新adapter影響を独立確認 |
| B30 即応100ms/panzoom60fps/cache/leak/切替/LH | I0§30・I8・I17 | 未完了（包括性能） | E14指定firstCanvas gateは7.0/13.3msで成功。新LH/60fps/長時間heap/全sceneは未測定 | 指定gateと包括性能/実機を分け、残る項目を採証 |
| B31 44px/contrast/keyboard/aria/日本語/reduced-motion | I0§31 | 検証済み（自動/列挙layout） | E10 PC/320px/短画面axe serious/critical0、色以外選択/日本語名/keyboard | 完全手動a11y/実機は未確認、全体B32 |
| B32 Unit/Integration/E2E/Visual/Performance/全機能 | I0§32・I17 | 未完了（全体） | E10新390/15/8、E12 PWA、E13 source9、E14性能、E15新Visual5成功。旧177件や380/20PASSを転用しない | 残る全機能新版回帰、新採用と本番build、Agent20 |
| B33 専門20担当の独立監査 | I0§33 | 未完了（全体） | 旧20PASSはE1。I17はE11関連2担当の限定PASS、旧E4/E7とは別 | 残る変更影響の関連担当、新版全体をAgent20へ |
| B34 PASS/FAIL/Severity/根拠/再現/影響/必須/再testの監査形式 | I0§34 | 検証済み（今回の関連報告） | E11原文で対象hash/範囲/再現/影響/必須/再確認を記録。旧FAIL保全 | 今後の再監査も同形式、独立FAILを改変しない |
| B35 P0→P1→P2→P3の修正/独立再確認 | I0§35・I12・I17 | 検証済み（I17関連所見） | E11最終f3cでVV-01〜07解消維持、新必須修正0。旧FAIL固定、車白点の根因は固定白detail2件 | 全体の残項目と実機/外部は別。過去FAILをrootで改変しない |
| B36 必須機能/10線画/最新検査/最終20PASSまで完成と言わない | I0§36、I8・I14 | 未完了 | 現在NOT READY。QA pass:false、人間新採用なし | 各未完了/実装済みを証拠付きで閉じる |
| B37 Credentials無しでもintegration/SQL/env/local/test/setupは完成、外部設定は分離 | I0§37、I8 | 実装済み | 初期code/SQL/setup/fixtureとE2。実外部Supabase/Google/HTTPSは未確認 | コード回帰を完了。外部公開/設定変更は今回対象外、実接続成功を主張しない |
| B38 仕様外SNS/投稿/課金/広告/自由描画/水彩等を追加せず品質を保つ | I0§38、I8・I13 | 実装済み | 現行scopeを維持。全面的な禁止機能探索の最新証拠は未取得 | 差分レビューで対象外混入を確認 |
| B39 関連architecture/engine/pipeline/sync/PWA等docs | I0§39・I14・I17 | 検証済み（I17関連記録） | 統合計画/画像履歴/engine/architecture/authoring/pipeline/sync/testing/監査進行/releaseをv3と旧履歴へ区分。E15/13文書のローカルlink81件一致、[検算](../test-results/vector-improvement/document-evidence-check.json) | 次版で変更した項目/指示元/証拠/未完了を更新、全体最終判定は別 |
| B40 最終機能/構成/素材/監査/test/perf/PWA/RLS/P3/外部設定/試用/420前確認/判定を報告 | I0§40 | 未完了 | 今回は照合・進行基準の更新。アプリ完成報告ではない | 最新全受入が揃ってから、根拠/残課題/判定を報告 |

## 未確定・判断を捏造しない項目

| ID | 未確定の内容 | 現在確認できたこと / 次の扱い |
| --- | --- | --- |
| U01 | 白目の配色 | 解消済み：I16の明示回答とI17により白。I9の白目への選択色を撤回。 |
| U02 | 新10枚/目/画材/ホーム/装飾の人間の受入 | I5は旧10枚のhashだけ。新版の採用回答は未受領。最新候補を制作レビューへ提示してから別記録 |
| U03 現在の全ソースを使った全体PASS | 新固定f3c検査はE9〜14、試験harness変更の時刻/範囲も別記録。全体最終20ゲートと初期/I8不足は未完了。局所PASSを全体へ拡張しない |
| U04 | Android実機/物理present/長時間メモリ、外部実認証/同期/HTTPS | 未検証/未設定のまま。模擬CPU/DPR、fixture、旧結果で埋めない |
| U05 | Desktop4列への変更、v2タップ演出無しの承認 | 撤回/承認の発言は見つからない。初期3列/演出要件を継続し不足として直す |
| U06 | I8「紙目と画材用マスク3種」の枚数と各画材への対応 | 現物は紙目1＋wax1＋pencil1。紙目を含む3種なのか、紙目に加えて3画材分なのか明示された対応表はない。現在の3枚で要求を満たしたと断定しない。制作時に対応を明示し、不足なら追加生成する |
| U07 | I18添付撮影時のtemplate ID/renderer/build/DPRと眼縁の粗さの原因 | 未確認。現行コードのellipseは解析的な曲線だが最終表示はpixel。細い虹彩線、clip/眼縁の重ね方、tile合成の座標、縮小等は候補原因であり断定しない |
| U08 | 内部用完成原画からのレイヤー制作方式の採用 | I19で姫1枚の制作・実装を許可。姫の元配色を除いた相対陰影を試作する。完全なPSD自動分離、全10への展開、新素材の正式な人間採用が成立したとは記録しない |

## 次の作業と制作順序

**現在はI24の途中削除・新背景/枠のS表を優先する。** 姫1枚のP表、I18のQ表、I17の履歴、I8/初期の未撤回・未完了を残す。P05の同じ性能ゲート2回未達の停止を今回解除せず、旧「暖色まぶた/蜂蜜色を全眼へ」は廃止を維持。

1. **I17技術・可視ゲートは完了**：f3cの150実表示/顔・lamp8/原pixel DPR3、E11関連独立PASS、E14性能、E15旧10基準保全/更新なし5比較成功を固定した。同じ入力で成功済み検査を反復しない。
2. **次版の変更管理**：E15検査後hashを基準とし、以後の変更は影響行を戻して新しい版の証拠を作る。人間採用U02/全32装飾受入M23は今回の合格と別に扱う。
3. **制作受入**：新版10線画/目/3画材/顔なし原本/homeを具体的候補として提示。新hashへI5を転記しない。日本語制作UIのv3 groups/eyes/shading保存/QA/rollback、人間承認を整える（B13）。素材gateを迂回しない。
4. **未撤回の不足**：Desktop3列、非ブロッキング150〜220ms塗り広がり、木/石/毛等の全11材質、残る全部位陰影、紙目＋mask対応U06、全11背景/21枠の制作目視を進める（B07/B14/B16/B27、M13/M14/M23）。
5. **全体検証と最終判定**：必要な全機能新版回帰、非demo本番build、関連専門監査→新版Agent20。新LH/長時間heap/実機/外部接続は別に採証。今回の局所PASSや旧177/380/旧20を全体READYへ拡張しない。

## I17の進行表（後のI18/Q表の対象行を優先）

この表は旧M06〜M09/M15〜M18/M25〜M32/B11/B30/B35の影響範囲を再判定する。旧M09の22眼は車2眼を除いた新版20眼へ変更。旧作品の22眼は旧描画で保持。I8の画材/装飾/制作UI等の未完了はこの変更で消さない。

| ID / 要件 | 指示元 | 状態 | 現在の証拠と限界 | 次の作業 |
| --- | --- | --- | --- | --- |
| V01 全10の滑らかなBezier/角穴細部保護 | I17・M15 | 検証済み（技術/独立可視範囲） | 0.65世界px adaptive fit/共有境界、E10/E11最終PASS。source原本保持、全10/150表示 | 新採用U02・実機U04は別 |
| V02 共通制作の線/塗り/hit/黒線下coverage/漏れなし | I17・M15 | 検証済み（技術/独立目視） | 明示parity/一回白下地、E10 smooth境界、E11独立点oracle/全150。旧眼縁回収/鼻口保護/車固定白2点除去 | 以後のcurve変更は再判定。原本の白を全て背景と推測しない |
| V03 viewport/tile/DPR変更/PNG/thumb/完成共通 | I17・I18・M16〜18 | 検証済み（I17方式）／未完了（I18眼縁品質） | E10/E11のnative描画/密度変更の機械検査は保持。I18の眼縁が粗いとの指摘を解消した証拠ではない | Q02の原因切り分けと新見た目検査。実機U04・全32装飾M23も継続 |
| V04 白目白/選択色相虹彩/同系暗瞳/白光/強制茶金なし | I16・I17・M06 | 検証済み | E10/E11全20眼×黒茶青桃淡色、白反射/暗瞳pixel、実PNG。旧warm finishをv3から呼ばない | 人間U02と実機U04、U01は解消 |
| V05 姫はhome基準/単一眼縁/控えめまつげ | I12・I15・I17・I18・M08 | 未完了（I18眼縁） | E11の当時の限定PASS/旧FAILは保持。I18の着色後のガビガビを最新品質判断として扱う | Q02で原因検査と新候補比較。人間新採用U02・実機U04も継続 |
| V06 男の子追加まつげなし/動物恐竜個別形状 | I15・I17・M09 | 検証済み（制作/描画/独立目視） | 20制作眼、非姫lashes=[]、恐竜縦形、旧男の子r15外まぶたを明示回収。E10/E11全10・顔6実2/4倍PASS | 人間新採用U02・実機U04 |
| V07 未着色の目の簡略表示/両眼group/片眼region/tap/erase | I9・I17・I18・M07 | 未完了（I18線画） | E10/E11のgroup/region/tap/eraseは旧表示の操作証拠。I18で未着色内部枠の厳密な再現は不要と指定 | Q01の新表示規則を検討。操作は維持、手動highlightは復活しない |
| V08 働く車の顔を標準画像生成で除去/実部品保持 | I15・I17 | 検証済み（候補技術/目視） | 2生成原本/prompt/hash、source49領域・tiny0/unreviewed gap0、小joint5操作、E11 home/機械部品。E10/E12実表示 | 新原本の人間採用U02。旧hashへ転記しない |
| V09 Profile新版/新ID/旧素材renderer保持 | I17・M25・M27 | 検証済み | version3/-storybook-v2。E11 frozen shipped-v2 oracle40＋legacy40、旧byte、10＋10コピー、f3c9template同一 | 新採用U02、全体判定M33は別 |
| V10 別作品copy/削除顔色非転用/500quota元保持 | I17・M28 | 検証済み | E10/E11 old/v2 UI別copy・元deep一致・削除r24/r25/r27/r28/r32除外・500/quota/abort/PNG | 実機/外部U04、schemaを増やさない |
| V11 Project/RegionPaint/schema維持/migrationなし/指示記録 | I14・I17・M26 | 検証済み（local範囲） | E10/E11 AST/DB/backup、E13非demo real SDK/HTTP/SQL source9。I15〜17/U01解消/暖色案撤回を記録 | 非demo本番buildは素材approval gate未成立。外部実接続はU04 |
| V12 固定build/CPU4DPR2 p95≤100ms/独立目視後baseline | I17・I18・M30〜33 | 検証済み（I17性能）／未完了（I18 Visual） | E9/E14/E15 f3c性能/当時の基準更新は履歴。変更をまだしておらず、I18改善版の性能/見た目検証は存在しない | 新候補ができた後に影響範囲を新hashで採証。現時点でVisual基準を更新しない |

U01はI16/I17で解消した。U02〜U06の未確認範囲は継続する。最新の制作順は、姫/男の子/恐竜の比較→車の線画/ホームとコピー→全10の90条件＋途中操作→5眼色/3画材/保存/同期/PNG/旧作→固定build性能・独立目視。以前の「暖色まぶた/下側蜂蜜色を全眼へ」の実装者案はI17の色相保持/色付き輪除去へ置換し、今後使わない。

## 履歴I18：2026-10-09の検討（当時は実装しない）

| ID / 検討対象 | 指示元 | 状態 | 確認した証拠・未確定 | 次の作業 / 提案（未採用） |
| --- | --- | --- | --- | --- |
| Q01 未着色の目を親しみやすく簡略化 | I18、M07/V07を更新 | 未完了（読取・設計検討のみ） | 添付姫/男の子で小さな眼内に輪が密集。E16で虹彩/瞳/大小反射の枠を確認 | 白地の目と主反射位置の控えめな白丸を中心とする案。虹彩・瞳・補助光の内部枠を省き、着色後の内部形状との厳密一致を要求しない。白丸を示す線の太さ/大きさは候補で確認する |
| Q02 着色後の滑らかな眼縁 | I18、M08/M15/V03/V05 | 未完了（原因未確定） | E16でellipse/DPR別tileを確認。これだけで最終pixelの滑らかさは保証できない。撮影条件U07は未知 | 単色の虹彩→clip/まぶた→繊維→移動/縮小→PNGを順に比較する切分け案。外縁を質感から保護、原寸では細線を減らす、眼だけ局所supersampling等を候補評価。種類/視点に応じた楕円を全て真円へ変えない |
| Q03 内部完成原画から部位別の影・光を制作 | I18（手法の検討依頼）、I8/M14 | 未完了（方式未採用） | 現行の一般gradient/曲線だけでは服の皺・毛束形状に十分対応しない。完成RGB画像から色と光の一意な自動分離は未証明 | 線画ごとに内部完成原画1点を制作し、部位マスク/相対的な広い陰影/重なりの影/毛流れと皺の光/画材の方向へ分ける案。元線画と同じ座標に登録し、色は選択値から再構成。生成だけで完全なPSD分離ができるとは約束しない |
| Q04 自由な色と3画材を保つ | I18、I8/M11〜14 | 未完了（方式未採用） | 元色を含む完成画の単純な色替えでは元の明るさ/色が残り得る。黒・白・淡色/全3画材の新候補は未制作 | 元色を除いた相対的な影/光で黒・白でも形を保つ。鉛筆は筆圧/重ね塗り、クレヨンは蝋顔料の密度、smoothは連続明暗として同じ形の情報を使い分ける。group内の小領域で陰影を再起動しない |
| Q05 画質・メモリ・制作成立性の小規模確認 | I18、I8/M17/M18/M32 | 未完了（検討のみ） | ベクター境界と高周波の紙目/毛束は別課題。32MiB上限・offline・PNG・旧作品保全は未撤回 | 実装を再開する場合は姫/男の子で先に検証。原画の元配色で形と陰影を再構成できるか→黒/白/淡色/反対色→3画材→1/2/4倍DPR/PNGの順。完成原画は制作保管、利用者には見せず、実行時は派生した影/光等だけを必要解像度で読む案。多層画像の全解凍は避け、tile/LODと実decode量を評価する |

I18時点で変更したのは計画と指示履歴だけで、コード・原画・配布build・Visual基準・独立監査原文には変更を加えていなかった。後のI19の試作とは区別する。

## 最新I19〜I23：姫1枚とメニューの実装・確認

現候補は `gen-princess-bunny-v6-master-v3` / PaintingProfile v4。master-v1/v2はI20/I22で変更された履歴として保持。生結果は `test-results/princess-master/`、最新版は `revision-3/` に分離し、旧E9〜17とVisual baselineを上書きしない。生成完成原画は `content/princess-master/originals/` に保管し、公開フォルダへ配布しない。実行時は制作済みの無彩色相対光マップと既存の意味マスク・3画材を合成する。これは元色と光の完全自動PSD分離ではない。

| ID / 対象 | 指示元 | 状態 | 現物・証拠と限界 | 次の作業 |
| --- | --- | --- | --- | --- |
| P01 姫とうさぎの未着色眼を初期の白い瞳へ | I20・I22 / M07・V07 | 検証済み（姫1枚の技術条件）、人間受入は未完了 | 小丸だけのmaster-v1はI20でFAIL、黒い瞳のmaster-v2はI22で変更。master-v3は実原本princess-v2の白い瞳/上まぶたをBezierへ再構築。E18新native/Unit/Chromeで白い内部、両眼/片眼、消去のexact blank復帰。E21の新独立目視/技術分離を確認、旧FAIL原文は保持 | 候補の人間確認。残る9枚は未変更。怖くないという受入を技術検査から推定しない |
| P02 着色眼をnative viewportへ直接ベクター描画 | I18〜I22 / Q02・M08/M15・V03/V05 | 検証済み（新Chrome/native/独立の列挙範囲） | 眼をtile再サンプリングから外し、繊維を外縁内側へ制限、fit時の線密度を抑制。fractional pan位相も整合。E18新Chrome1/2/4/2.65倍×DPR1/2/3・移動/縮小/2048PNG、native21全画素一致、E21独立確認。過去添付条件U07はなお不明 | 候補の人間比較。ホーム同等品質とは断定しない |
| P03 内部完成原画1点から13意味グループの相対陰影 | I18・I19 / Q03・M14 | 検証済み（姫1枚の色替え/描画）、制作受入は未完了 | built-in image_gen完成原画を同じoffset[128,160]で登録、2048×2560の無彩色map。原画まぶた/口の二重化失敗を保持して保護/補間で修正。E18新4配色/3画材・Chrome/native、全画素一致。元のベクター部位/意味groupは不変、E21独立確認 | 姫の人間確認後、残る9枚へ。柔らかい陰影は有限解像度で、ベクター輪郭と区別する |
| P04 自由色/3画材/旧作品と改善コピー | I8・I19〜I22 / M11〜14/M26〜29 | 検証済み（新Unit/Chrome/旧描画の列挙範囲） | E17全Unit398は最適化前、E18変更関連13と新Chrome8/offline1を区別。旧v3全40RGBA、旧master-v1/v2の8状態一致。新UIは旧v1/v3/master-v2から別作品copy、保存/reload/PNGを確認。schema/migration追加なし | 実外部同期/実機は未確認。旧姫v2/master-v1のUIコピーは今回実行しておらず、ID対応の検査だけでUI成功としない |
| P05 速度/32MiB/固定build/独立検査 | I8・I19〜I23 / M17/M31/M32 | 未完了（規定性能2回未達、変更/測定反復を停止） | named media loader、20MiB form＋3×1MiB、iris不要取得を削除。tile/image各32MiBのcache上限は総heap上限ではない。E19固定buildでskirt p95 311.2msがFAIL、hair34.2msのみ規定内。E17の118.2ms FAIL、旧I19値を保持。crop後21画像/旧8状態は画素不変。E21独立と前後identity一致を確認 | 次の作業開始後、skirt crayon #FF4FA3 の単一traceで原因切分け。閾値を緩めない。全10新方式/全体READYは別 |
| P06 ホーム枠/影撤去、compact見出し、従来preview | I21・I23 / M19〜21・B07 | 検証済み（新Chrome3サイズ/実画像） | E18でborder/背景/container shadow/文字filter、独立44px戻る・10px間隔の80px非操作画像を実測。heroなし、元のdesktop3列/mobile2列preview（1000px幅286.66px）。390初期8島以上/320overflowなし。最終表示はE20のanimation終了/全12opacity=1の新6PNG。元の登場途中PNGは保持して区別 | 最新候補の人間確認。次回captureはanimation終了を待つ。homeの1000px以上4列は未撤回の差異B07として保持。旧axeを新UI包括PASSへ転用しない |
| P07 全ゲーム向け個人UIスキル | I21・I23 | 検証済み（保存/構造） | `C:/Users/yonaf/.codex/skills/yona-game-natural-ui/SKILL.md` と候補がSHA `eef394e4fff0e83ab7e428f6aae17d9a2e5505dfaf6967a42dca5013fda8c67f` で一致。`revision-2/skill-validation.json`。PyYAML不在で標準quick_validateは未実行、同じ必須metadataを2scalar解析で検査。Core変更なし | 次回のgame UI制作で適用。今後の全ゲームへ自動修正したという意味ではない |

P表は姫1枚の試作範囲に限る。M07/M09/M14/M31、V07等の全10受入を、この1枚で完了にしない。残る9枚への展開はこの候補の確認後。新しい人間採用は未受領、candidate QAはpass:falseのまま。

## 最新I24：途中作品削除と空間のある背景・意匠のある枠

詳細・再生成・生結果・限界は [scene-art-v3-progress.md](scene-art-v3-progress.md)。旧I19〜23/P表を上書きせず、I24で影響したM22〜24/B22/B23/B25をE22で再判定する。

| ID / 対象 | 指示元 | 状態 | 確認した証拠 | 次の作業 |
| --- | --- | --- | --- | --- |
| S01 途中作品の独立削除 | I24/B25 | 検証済み（新Chrome6件） | E22。確認/取消、選択した作品のみ削除、reload、別作品deep保持、別タブCAS、保存失敗後retry。利用者の実作品は検証に使っていない | 実機/実外部同期/アカウント切替の新UI実試験は別 |
| S02 10不透明風景＋白 | I24/M22〜24/B22 | 検証済み（制作/技術/列挙表示）、人間採用未完了 | 10別生成原本/逐語prompt/SHA。全不透明pixel、地面/水面/建物/遠景。姫×全10×2幅を実表示 | 新hashの人間受入。全10線画×全風景の実画面は未検査 |
| S03 20意匠枠＋なし、主役非遮蔽 | I24/M22〜24/B23 | 検証済み（制作/技術/列挙表示）、人間採用未完了 | 20別生成、連続縁/角/金工宝石等。4辺strip・behind-artwork。全10native320px/DPR1/smooth非遮蔽差分0、姫×全20×2幅実表示、royal2048PNG | 全10×全枠×倍率の実画面/実機は未検査。人間受入 |
| S04 旧作品保持/選択時取得/保存PNG/offline | I24/M24/M27/M29 | 検証済み（列挙local範囲） | 旧catalog/旧hash/旧v3 40RGBA保持。新scene保存/reload/複製/PNG/offline成功。Project/RegionPaint/DB/schema不変 | noProfileは旧選択肢を保持。外部で新compositionとの組合せにした復元、実外部同期は未確認 |
| S05 新hash/独立再監査/状態記録 | I24/I14 | 検証済み（列挙local範囲/独立2件） | [独立engine](audits/scene-art-v3-engine-20261010.md)と[独立visual](audits/scene-art-v3-visual-20261010.md)が限定PASS、必須実装修正なし。visualは28画像を直接開き、原本30/Chrome入力60のSHAを確認。[最終identity](../test-results/scene-art-v3/revision-2/identity-after-audit.json)でbuild/source/harness/配信entry不一致0。[31証拠index](../test-results/scene-art-v3/revision-2/evidence-index.json) | 人間採用/実機/全体NOT READYは別。削除一覧thumbnail撮影はloading時点、王冠枠と姫王冠の接近は独立P3任意所見。旧P05停止を解除しない |

## 進行表の更新手順

作業開始時に対象ID・指示元・期待する結果を指定する。実装/素材変更後は影響行の状態を戻し、対象hashと証拠を新しい版のディレクトリへ保存する。検査成功の行は、検査範囲と未確認事項を記して更新する。見た目は実画像/参考画像を開いて確認する。独立FAILの解消は担当の再確認が必要。未完了を、予算・時間・古い承認・テスト数だけで完了にしない。
