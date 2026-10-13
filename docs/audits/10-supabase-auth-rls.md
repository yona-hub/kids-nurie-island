**PASS — Agent 10：Supabase Auth / DB / RLS 修正後再監査**

監査日：2026-10-07  
対象：`C:\Users\yonaf\develop\app\キッズ塗り絵アイランド`

**前回4件はすべて解消を確認。新規発見は0件。**

製品仕様の担当箇所・33〜36節、後続ユーザー指示、指定された前回報告を読み、現行コードと実行結果から判断した。範囲はGoogle／PKCE、provider抽象化、永続化、全migration、RLS、Storage、権限、所有者、500件上限、CAS、削除と関連回帰。Supabase専用スキルは利用可能一覧になかった。

実装編集、承認記録変更、資格情報の読取り、外部サービス変更、他エージェント起動は行っていない。

**前回所見の再検証**

| ID・旧Severity | 現行実装の根拠 | 再現・影響の確認結果 |
|---|---|---|
| **A10-01・P0：解消** | [index.ts:829](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/persistence/src/index.ts:829)で期待ユーザー・認証世代・中断状態を照合。[cloud.ts:88](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/persistence/src/cloud.ts:88)で送信JWTを固定。[handler.ts:53](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/supabase/functions/delete-account-data/handler.ts:53)で検証済みsubjectとの不一致を拒否。 | 同期待機中のA→B、A→ログアウト、A→B→A、トークン取得待機中の切替で削除要求を送らず終了。Aの削除応答待機中にBへ切り替えるケースでも、Bの作品・認証を維持。別アカウントを削除する前回経路は再現しなかった。 |
| **A10-02・P1：解消** | [index.ts:218](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/persistence/src/index.ts:218)の削除開始通知は編集・同期を停止し、認証を消去しない。完了通知で対象所有者の認証を処理する。 | 共有Storage・BroadcastChannelを使う2タブ相当の実SDKテストで、削除APIまでAの認証を維持。別タブの保存を拒否し、API失敗後の再試行も成功。前回の認証消失による削除失敗は再現しなかった。 |
| **A10-03・P2：解消** | [config.toml:158](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/supabase/config.toml:158)、[vite.config.ts:86](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/vite.config.ts:86)。 | Site URLは`127.0.0.1:5174`。開発5174・preview4174について、`127.0.0.1`／`localhost`双方の完全一致callbackを確認。設定不一致は解消。実Google往復は未実施。 |
| **A10-04・P2：解消** | [auth.ts:141](C:/Users/yonaf/develop/app/キッズ塗り絵アイランド/packages/persistence/src/auth.ts:141)でqueryとfragmentのエラーをURL消去前に解析。 | fragmentの拒否・providerエラー・説明文のみ、query形式を検査し、`AUTH`エラーと固定メッセージを確認。URLのquery／fragmentは除去され、provider由来の任意文言を表示しない。 |

callback許可設定とfragmentエラーの扱いは、[Supabase公式仕様](https://supabase.com/docs/guides/auth/redirect-urls)とも照合した。

上記4件について**追加修正は不要、修正必須事項なし**。表の認証切替・複数タブ・callback検査は、今後の変更時にも再テスト対象として維持する。

**実行結果**

| 検証 | 結果 |
|---|---|
| Auth、削除、削除復旧、Storage adapter、永続化、同期、HTTP期限、RLS | **9ファイル・83/83 PASS、11.15秒** |
| 全3 migrationを適用する既存実SQLテスト | **12/12 PASS**。所有者分離、直接書込み拒否、CAS、500件上限、tombstone、Storage操作、削除制限 |
| 独立した追加SQL検査 | **不正操作20ケースすべて拒否**。匿名操作、privateテーブル参照、所有者／bucket変更、不正パス、削除済み作品へのupload、管理関数呼出し等 |
| 関数権限の実カタログ照合 | **13関数を確認**。anonの実行権限なし。削除完了・削除状態取得はservice_role限定。全definer関数の`search_path`固定 |
| 削除の追加検査 | 古いversionによる削除は新しい作品を保持。削除済み作品の画像整理は成功。Authユーザー削除後の再作成は拒否 |
| Storage bucket設定 | 非公開、**524,288 bytes**、WebP／PNG限定 |

Vitestは設定・環境変数ファイル読込みとキャッシュを無効にして実行した。SQLはメモリ上のPGliteで実migrationを実行した。Auth／Storageの基礎schemaはfixtureであり、実Supabase環境全体の検証ではない。SDK競合検査もHTTPスタブを使用している。

未実施：実Google往復認証、配備済みEdge Function、実Storage HTTPでのサイズ・MIME制限、独立した複数PostgreSQL接続の競合、`127.0.0.1:4174`のブラウザE2E、本番build。Firefox通常配布版・診断修正版・実機の成功も本監査では主張しない。素材採用や他監査の進捗を欠陥件数へ加えていない。

追加のPKCE・送信直前競合を検査する一時Nodeスクリプトは、自動実行審査が「blocked by policy」で拒否した。詳細理由は返されておらず、この追加検査は未実施。上記PASS件数には含めていない。

**最終判定：PASS（Agent 10担当範囲）。未解決：P0＝0件、P1＝0件、P2＝0件、P3＝0件。**