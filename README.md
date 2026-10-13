# キッズ塗り絵アイランド

きみだけの色で、せかいをつくろう。

React / TypeScript / Canvas 2D の塗り絵Web/PWA。オリジナル線画10枚、132色、3画材、素材に応じた決定論的な陰影と質感、背景11種、フレーム21種を備えます。作品状態をIndexedDBへ即時保存し、Google認証でSupabaseと同期します。実行時アプリと制作ツールは独立しています。

ホームの12テーマと正式線画10枚は画像生成で制作しました。線画はユーザーが正式採用した白黒版で、瞳とその中のハイライトも別々に塗れます。瞳へ反射光を自動で足す処理は行いません。原画・プロンプト・採用記録は `content/brand-generated/` と `content/generated-lineart/` に保存しています。

## 起動

Node.js 24 LTS以降を推奨します。

```sh
npm ci
npm run dev
```

`http://127.0.0.1:5174` を開きます。Supabaseを設定していない開発サーバーでは、明示されたローカルのおためしモードを使用します。Google認証したふりはせず、「この端末でおためし中」と表示します。作品はこのブラウザに保存されます。

1. ホームで島を選び、線画を開く。
2. 色の島 → 色を選び、塗る場所をタップ。画材を切り替えると同じ作品に混在できます。
3. ドラッグで移動、ホイールまたはピンチで拡大。キーボードでは矢印キーで領域、Enterで着色。
4. 背景やフレームを選び、「完成」。作品画面からPNGを保存できます。
5. 設定からバックアップを保存・復元できます。

## 本番接続

`.env.example` を `.env.local` にコピーし、Supabase URLとpublishable keyを設定します。OAuthとデータベースの手順は [セキュリティ・接続設定](docs/security.md) を参照してください。

```sh
npm run build
npm run preview
```

通常の本番ビルドは認証必須です。資格情報がない場合は設定不足を表示し、ローカル認証へ自動で切り替えません。公開前にGoogle OAuthのURL、SQL migration、Storage、データ削除Edge Function、問い合わせ先を設定してください。秘密鍵やservice role keyはフロントエンドへ渡しません。

本番ビルドは、公開する線画が人間によって確認され、承認時の内容から変わっていないことを検査します。作者の技術確認だけの線画は `dev` / `build:demo` で検証できますが、通常の `build` を通過しません。依頼仕様の制作承認をコード上でも分離しています。

問い合わせ先は `.env.local` の `VITE_CONTACT_EMAIL` に運営者の公開用メールアドレスを設定します。設定画面の「問い合わせ」からメール作成画面を開けます。未設定のローカル試用時にも問い合わせ内容のファイル保存が可能です。

PWAをローカルのおためしモードで確認する場合のみ次を使います。出力は本番用と別の `dist-demo/` です。

```sh
npm run build:demo
npm run preview:demo
```

## 検証

```sh
npm run check
npm run test:e2e
npm run test:visual
npm run test:rls
```

RLSテストは隔離されたPGlite上の実PostgreSQLでmigrationを実行し、別アカウント・所有者偽装・500件制限・バージョン条件・Storage権限を検証します。実Supabaseサービスでの最終OAuth/Storage確認とは区別しています。

## 素材制作

```sh
npm run assets:build
npm run assets:review
```

レビュー画面は `http://127.0.0.1:4318`。原画、領域、素材、3種類の実エンジン仕上げを比較し、素材判定と陰影・質感を修正できます。正式線画を公開する前にレビューと承認が必要です。[制作手順](docs/asset-pipeline.md) と [コンテンツの追加](docs/content-authoring.md) を参照してください。

## 構成

```text
apps/web/                 レスポンシブUI、PWA、公開素材
packages/coloring-engine/ Canvas描画、質感、ヒット判定、出力
packages/persistence/     認証、IndexedDB、同期、競合保護、復元
packages/shared-types/    保存・素材の共通型
packages/content-schema/  テーマ、正式パレット、素材ローダー
content/                 元線画、承認記録、制作データ、参照画像
tools/asset-pipeline/     ベクター／ラスタコンパイラと日本語レビューUI
supabase/                migration、権限、データ削除関数
tests/                   Unit、Integration、RLS、E2E
docs/                    仕様、設計、監査、公開前確認
```

現在の検証状況は [リリースチェックリスト](docs/release-checklist.md)、技術選択は [アーキテクチャ](docs/architecture.md) に記録します。Quality Gateの未確認項目がある間はリリース品質を宣言しません。

Gitに含める素材・固定入力と、除外する生成出力の区分は [Git管理方針](docs/git-tracking-policy.md) を参照してください。

## 以前の試作版から開き直すとき

この開発中のプレビューを以前から開いていて、ホームの「更新する」を押しても保存後の更新を案内され続ける場合は、次の手順で更新してください。

1. 編集を終え、端末への保存失敗がないことを確認する。保存エラーがある間は閉じず、保存をやりなおす。
2. このアプリを開いたすべてのブラウザタブと、インストールしたPWAのウィンドウを閉じる。
3. アプリをもう一度開く。

端末のサイトデータやアプリを削除する必要はありません。新しい版は同じ端末の保存済み作品を引き継ぎます。旧試作版は更新確認の仕組みが異なり、画面内の案内文も固定されているため、新しい案内を旧画面へ後から差し込めません。編集中の強制再読込を避けるため、上記の終了・再起動で移行します。[更新の設計と検証](docs/pwa.md)も参照してください。
