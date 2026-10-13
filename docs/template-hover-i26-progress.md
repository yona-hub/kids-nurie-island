# I26：線画メニューのホバー案内撤去

指示元は利用者本文「マウスオーバー時のこの画像は不要。『この絵であそぶ』のヘルプも不要。ここは少し絵を浮き上がらせる程度でいい」。添付 `codex-clipboard-da11a0a3-4222-4cb3-868f-569c45cac57d.png` は変更前の問題を示す資料。

**実装・列挙実画面の確認は完了。** 共通ThemePageから本/筆の重ね画像、案内文、案内面を削除。hover可能な端末では紙面だけ上へ3px/160msで動かす。タイトル/ボタン名/クリック処理/focus-visibleは保持。disabledを除外、OS/設定の動き抑制では移動を無効にする。3px/160msは制作判断で、ユーザーが数値指定したとは記録しない。生成素材の原本や他の用途を撤去しない。

| 検査 | 結果と証拠 | 範囲 |
| --- | --- | --- |
| demo build / typecheck / lint | 全exit0。[checks.json](../test-results/template-hover-i26/revision-1/checks.json)、build.log | 今回のソース。全体テストは追加/再実行していない |
| 通常/hover/keyboard focus | [browser-review.json](../test-results/template-hover-i26/revision-1/browser-review.json)。通常transform none、hover -3px、画像1枚、案内なし、focus-visibleと3px outline、console error0 | In-app Chromium、姫一覧1280×720/DPR1の手動状態確認。自動回帰件数として数えない |
| 実画像 | [通常](../test-results/template-hover-i26/revision-1/normal.jpg)、[hover](../test-results/template-hover-i26/revision-1/hover.jpg)、[focus](../test-results/template-hover-i26/revision-1/focus.jpg) | 作者が実画面を確認。独立監査や人間採用とは異なる |
| 実行対象 | [identity.json](../test-results/template-hover-i26/revision-1/identity.json) | build `b10dc61af67fcc862bd50f3461f74baea6a2d7f1544ced027f5d56f4e218b6f9`、source `59d07fb5622507e160d8ffc595dbcdbd8a4a2c8c2d4aa1d9a70cf5602073b5c7`。配信HTML/JS/CSSをhash照合、ブラウザが読んだentry URL一致。I25からのruntimeソース変更はHome.tsx/styles.cssだけ |

初回4174の確認用タブは古いSW版を表示していたため合格証拠に使わない。別originのローカル4175で起動直後の接続が失敗し、そのエラータブの操作も有効な検査ではない。HTTP200を確認後の新しいタブで上記new entryと実画面を確認した。利用者の開いたタブ/作品/保存データは変更しない。

提示用に追加撮影した `hover-detail.jpg` は狙った絵を含まない切抜きだったため、合格証拠や提示に使わず失敗出力として保持する。上記の全画面3画像とbrowser-reviewの確認とは区別する。

次の作業：今回の局所修正は完了。全テーマ/実機/reduced-motionの実操作/作品作成・全体回帰は今回検査していない。過去I25の15Chrome/37Unitは旧hashの履歴として保持し、新buildの成功へ転記しない。以前の未完了/全体NOT READY/P05性能停止は[統合計画](storybook-improvement.md)のまま。
