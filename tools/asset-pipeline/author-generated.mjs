// Technical semantic annotations after viewing the numbered source/mask sheets.
// This file contains names/classification only; it never redraws source geometry.
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';
import { bindGapReviews } from './gap-reviews.mjs';

const plans = {
 'gen-princess-bunny-v3': {
  names: '王冠|metal,王冠中央の宝石|glass,王冠の左側の髪|hair,王冠左の宝石|glass,王冠右の宝石|glass,前髪|hair,右の前髪|hair,王冠右の髪|hair,顔|skin,左外側の長い髪|hair,左こめかみの髪|hair,左内側の長い髪|hair,左の瞳,左の瞳のハイライト,右の瞳,右の瞳のハイライト,右内側の長い髪|hair,右耳|skin,首の左側の髪|hair,舌|skin,歯,右外側の長い髪|hair,左の袖|fabric,首と胸元|skin,右の袖|fabric,ドレスの身頃|fabric,左腕と手|skin,右腕と手|skin,左腕と身頃の間の背景|background,リボン左|fabric,リボン右|fabric,右袖と身頃の間の背景|background,スカート左の重なり|fabric,スカート右の重なり|fabric,リボンの垂れ|fabric,リボンの結び目|fabric,右腕とリボンの間の背景|background,左手とスカートの間の背景|background,うさぎ左耳|fur,スカート左端|fabric,スカート中央|fabric,うさぎ左耳の内側|skin,うさぎの顔と右耳|fur,うさぎ右耳の内側|skin,スカート左中央|fabric,スカート右端|fabric,うさぎ左の瞳,うさぎ左の瞳のハイライト,うさぎ左の白目,うさぎ右の白目,うさぎの鼻|skin,うさぎ右の瞳,うさぎ右の瞳のハイライト,うさぎの口|skin,うさぎの胸と左前脚|fur,うさぎの首飾り|fabric,うさぎリボン左|fabric,うさぎリボン結び目|fabric,うさぎリボン右|fabric,うさぎの体と右前脚|fur,うさぎの左後脚|fur,うさぎのしっぽ|fur,うさぎの脚の間の背景|background',
 },
 'gen-wizard-lantern-v3': {
  names: '帽子|fabric,帽子の星|metal,帽子のつば左|fabric,杖の星|wood,左の前髪|hair,顔と右耳|skin,右の髪|hair,杖の上側|wood,左耳|skin,左の瞳,左の瞳のハイライト,右の瞳のハイライト,帽子のつば右|fabric,左耳の下の髪|hair,右の瞳,歯,舌|skin,杖を持つ手|skin,左の親指|skin,左の襟|fabric,襟と首の間の背景|background,首|skin,右の襟|fabric,右耳の下の髪|hair,左の袖とマント|fabric,杖の側面|wood,胸の留め具|metal,杖の下側|wood,服の身頃|fabric,右の袖|fabric,ランタンを持つ手|skin,ランタン持ち手左|metal,ランタン持ち手右|metal,マント左内側|fabric,ランタン持ち手の中の背景|background,ランタンを持つ親指|skin,ランタン上部の留め具|metal,袖とランタンの間の背景|background,ランタンの屋根|metal,左のズボン|fabric,脚の後ろのマント|fabric,右のズボン|fabric,ランタンの枠|metal,ランタンのガラス|glass,炎の外側,炎の内側,左の靴|rubber,右の靴|rubber,ろうそくの溶けたろう,ろうそく本体,靴とランタンの間の背景|background,左の靴底|rubber,右の靴底|rubber',
 },
 'gen-tree-friends-v3': {
  names: '木の葉の中央,木の葉の左,木の葉の右,左の一枚の葉,枝の中央の背景|background,右の一枚の葉,木の幹|wood,左の枝の間の背景|background,右の枝の間の背景|background,犬の顔と体と左耳|fur,犬の右耳|fur,猫の左耳の外側|fur,犬の右の瞳,犬の右の瞳のハイライト,猫の左耳の内側|skin,犬の左の瞳,犬の左の瞳のハイライト,犬の鼻|skin,猫の顔と胸|fur,猫の右耳の内側|skin,犬の口の上側|skin,猫の左の瞳,猫の左の瞳のハイライト,犬の舌|skin,犬の右前脚|fur,猫の右の瞳,猫の右の瞳のハイライト,犬のしっぽ|fur,犬の後脚|fur,猫の鼻|skin,猫のしっぽ|fur,猫の左前脚|fur,猫の体と右前脚|fur,犬と猫の脚の間の左背景|background,犬と猫の脚の間の右背景|background,犬の左脚の間の背景|background,犬の前脚の間の背景|background,猫の脚の間の背景|background',
 },
 'gen-ocean-friends-v2': {
  names: 'イルカの背びれ|skin,イルカの体|skin,左の泡|glass,イルカの瞳,イルカの瞳のハイライト,イルカの口|skin,右の泡|glass,イルカの奥のひれ|skin,カメの顔と前脚|skin,カメの左の瞳,カメの左の瞳のハイライト,カメの右の瞳,カメの右の瞳のハイライト,甲羅の左上,甲羅の上,甲羅の中央,甲羅の右上,魚の背びれ上|skin,カメの口|skin,魚の背びれ下|skin,魚の中央の模様|skin,魚の右の模様|skin,魚の顔と胸びれ|skin,甲羅の左下,甲羅の右下,魚の尾びれ|skin,魚の左の模様|skin,魚の瞳,魚の瞳のハイライト,カメの左の脚|skin,甲羅の右端,カメのしっぽ|skin,魚の口|skin,甲羅の下側,カメの右の脚|skin,魚の左の腹びれ|skin,魚の右の腹びれ|skin,左のサンゴ|stone,右のサンゴ|stone,ヒトデ|skin,貝がら|stone',
 },
 'gen-dinosaur-eggs-v2': {
  names: '恐竜の顔と体|skin,左の白目,左の瞳のハイライト,左の瞳の上部,左の瞳の下部,右の白目,右の瞳,右の瞳のハイライト,左の鼻孔|skin,右の鼻孔|skin,口の中|skin,左の歯,右の歯,おなか|skin,奥の手|skin,奥の卵,手前の卵の上側,奥の脚|skin,手前の卵の下側,大きい岩|stone,奥の左の爪,奥の右の爪,手前の左の爪,手前の中央の爪,手前の右の爪,小さい岩|stone',
 },
 'gen-round-sports-car-v2': {
  names: '車体左のストライプと左屋根|metal,車体右のストライプと屋根|metal,左窓の三角の部分|glass,左の窓|glass,中央のフロントガラス|glass,右のフロントガラス|glass,左後ろの車体|metal,左のサイドミラー|glass,右のサイドミラー|glass,車体と前のフェンダー|metal,ボンネット中央|metal,ドアの取っ手|metal,左奥のタイヤ|rubber,左奥のホイール|metal,左のヘッドライト枠|metal,左のヘッドライト|glass,右のヘッドライト枠|metal,右のヘッドライト|glass,手前のタイヤ|rubber,タイヤの上の背景|background,フロントバンパー|plastic,手前のホイール|metal,左奥タイヤの側面|rubber,手前のホイール中央|metal,右のグリル|plastic,左のグリル|plastic,ナンバープレート|metal,手前タイヤの側面|rubber,右奥のタイヤ|rubber',
  tiny: [
   {point:[190,871],role:'line-detail',name:'奥タイヤの線の交差の白い点',reason:'原画拡大でタイヤ上端の重なった黒線に残る6px幅の白点と確認。独立した部品ではなく、白の原画detailとして保存する'},
   {point:[214,879],role:'line-detail',name:'奥タイヤ右上の線の交差の白い点',reason:'重なった輪郭の中の4px幅の白点。塗り面ではなく元の白い線画detailを保つ'},
   {point:[1306,984],role:'line-detail',name:'右輪郭内の上の白い画素',reason:'車体外周の黒線に囲まれた3×5pxの白い画素。物体の面ではなく原画の白いdetailとして保つ'},
   {point:[1305,991],role:'line-detail',name:'右輪郭内の下の白い画素',reason:'車体外周の黒線に囲まれた3×5pxの白い画素。物体の面ではなく原画の白いdetailとして保つ'},
   {point:[489,1017],role:'line-detail',name:'手前タイヤ上端の線の交差の白い点',reason:'二本の輪郭が接する箇所の10×6pxの白点。主役の部品ではなく原画の白いdetailとして保つ'},
  ],
 },
 'gen-excavator-cones-v2': {
  names: '手前のアーム|metal,手前アームの側面|metal,上の軸|metal,上のピストン棒|metal,奥のアーム|metal,上の油圧シリンダー|metal,左の油圧シリンダー|metal,ピストンとアームの間の背景|background,奥のアームの側面|metal,奥のピストン棒|metal,左のピストン棒|metal,奥の関節|metal,奥の軸|metal,バケット外側|metal,バケットの小さい関節|metal,手前の軸|metal,本体|metal,バケット内側|metal,バケット左の縁|metal,フロントガラス|glass,ドアの枠|metal,ドアの窓|glass,右後ろの窓|glass,左の瞳,右の瞳,バケット先端の縁|metal,左の瞳のハイライト,右の瞳のハイライト,本体左のライト|plastic,ドアの取っ手|metal,上の通風口|plastic,口のパネル|plastic,中央の通風口|plastic,下の通風口|plastic,奥のキャタピラ|rubber,奥のキャタピラ内側|rubber,手前のキャタピラ|rubber,本体の旋回台|metal,奥の走行部|metal,手前のキャタピラ内側|rubber,左コーンの上段|plastic,奥の車輪|metal,手前の走行部|metal,手前中央の車輪|metal,手前右から二番目の車輪|metal,手前右端の車輪|metal,手前左端の車輪|metal,手前左から二番目の車輪|metal,左コーンの中央|plastic,右コーンの上段|plastic,左コーンの下段|plastic,右コーンの中央|plastic,左コーンの台座|rubber,右コーンの下段|plastic,右コーンの台座|rubber',
  tiny: [{point:[862,507],role:'background',name:'奥アームと関節の間の背景',reason:'原画拡大でアームの後ろに見える外背景の小さな空きと確認。部品の塗り面ではない'}],
 },
 'gen-explorer-robot-v2': {
  names: 'アンテナの球|plastic,アンテナの軸|metal,アンテナの土台|metal,顔の外枠|metal,左耳の内側|metal,顔のパネル|plastic,左耳の外側|plastic,左の瞳,左の瞳のハイライト,右の瞳,右耳の内側|metal,右耳の外側|plastic,右の瞳のハイライト,左手|plastic,左の手首|rubber,左前腕|metal,左肩|metal,胴体|metal,首|rubber,右肩|metal,左上腕|metal,胸のメーター|glass,左肘の関節|rubber,右上腕|metal,右肘の関節|plastic,胸の左ボタン|plastic,胸の中央ボタン|plastic,胸の右ボタン|plastic,右前腕|metal,腰のベルト|rubber,左もも|metal,右もも|metal,右手|plastic,右の手首|rubber,左の膝|plastic,右の膝|plastic,左すね|metal,右すね|metal,左足首|rubber,右足首|rubber,左靴のつま先|metal,左靴の甲|metal,右靴の甲|metal,右靴のつま先|metal,左靴底|rubber,右靴底|rubber',
  tiny: [{point:[1117,1114],role:'background',name:'右肘の関節の後ろの背景',reason:'上下の腕と肘の円形部品の間に見える外背景。通常の塗り面ではない'}],
 },
 'gen-rocket-astronaut-v2': {
  names: 'ロケットの先端|metal,惑星上側,惑星の輪,惑星の輪の右の背景|background,ロケット上の帯|metal,惑星の輪の左の背景|background,惑星下側,星,ロケット本体|metal,丸窓の枠|metal,丸窓|glass,ヘルメットの枠|plastic,髪|hair,顔と左耳|skin,ヘルメット内の上の空間|glass,ヘルメット右の部品|plastic,ヘルメット左の部品|plastic,左の瞳,右の瞳,右の瞳のハイライト,右耳|skin,左の瞳のハイライト,ヘルメット内の下の空間|glass,右の手袋|fabric,口|skin,ロケット左の翼|metal,ロケット右の翼|metal,右の肩ひも|fabric,右肩の後ろの背景|background,右袖|fabric,右の袖口|fabric,ロケット下の帯|metal,左袖|fabric,左肩の後ろの背負い袋|metal,左の肩ひも|fabric,宇宙服の身頃|fabric,胸のパネル|plastic,胸のボタン|plastic,背負い袋の右側|metal,左の袖口|fabric,ロケットのノズル|metal,左の手袋|fabric,腰のベルト|fabric,ロケットの炎の外側,ロケットの炎の内側,宇宙服のズボン|fabric,左の裾|fabric,右の裾|fabric,左のブーツ|fabric,右のブーツ|fabric,左の靴底|rubber,右の靴底|rubber',
 },
 'gen-bouquet-butterfly-v2': {
  names: '蝶の右上の羽,蝶の右上の羽の模様,チューリップ左の花びら,チューリップ中央の花びら,チューリップ右の花びら,左上の葉,蝶の左上の羽,蝶の左上の羽の模様,蝶の体,蝶の右下の羽,蝶の右下の羽の模様,中央右の葉,蝶の左下の羽,蝶の左下の羽の模様,左の花の上の花びら,左の花の左上の花びら,中央の太い茎,右の花の上の花びら,左の花の右上の花びら,右の花の右上の花びら,左の花の左の花びら,左の花の中心,右の花の左の花びら,左の花の右下の花びら,右の花の中心,左の花の下の花びら,右の花の左下の花びら,右下の葉,右の花の右下の花びら,左下の葉,左の花の茎,右の花の茎,花束の包み左|fabric,花束の包み右|fabric,リボン左|fabric,リボン右|fabric,リボンの結び目|fabric,リボンの左の垂れ|fabric,リボン左の折り返し|fabric,リボンの右の垂れ|fabric,リボン右の折り返し|fabric,花束の包み中央|fabric,花束の包み右下|fabric,花束の包み左下|fabric',
 },
};

plans['gen-tree-friends-v4'] = {
 names: '木の葉の中央,木の葉の左,木の葉の右,左の一枚の葉,枝の中央の背景|background,右の一枚の葉,木の幹|wood,左の枝の間の背景|background,右の枝の間の背景|background,犬の顔と体と左耳|fur,犬の右耳|fur,猫の左耳の外側|fur,犬の右の瞳,犬の右の瞳のハイライト,猫の左耳の内側|skin,犬の左の瞳,犬の左の瞳のハイライト,犬の鼻|skin,猫の顔と胸|fur,猫の右耳の内側|skin,犬の口|skin,猫の左の瞳,猫の左の瞳のハイライト,犬の右前脚|fur,猫の右の瞳,猫の右の瞳のハイライト,犬の後脚|fur,猫の鼻|skin,犬のしっぽ|fur,猫のしっぽ|fur,猫の左前脚|fur,猫の体と右前脚|fur,犬と猫の脚の間の左背景|background,犬と猫の脚の間の右背景|background,犬の左脚の間の背景|background,犬の前脚の間の背景|background,猫の脚の間の背景|background',
};
const eyePairs={
 'gen-wizard-lantern-v6': [['左',[10],11],['右',[15],12]],
 'gen-rocket-astronaut-v5': [['左',[17],20],['右',[18],19]],
 'gen-princess-bunny-v6': [['おひめさま左',[10],11],['おひめさま右',[12],14],['うさぎ左',[42],43],['うさぎ右',[44],45]],
 'gen-dinosaur-eggs-v4': [['左',[2],3],['右',[4],5]],
 'gen-princess-bunny-v3': [['おひめさま左',[13],14],['おひめさま右',[15],16],['うさぎ左',[47],48],['うさぎ右',[52],53]],
 'gen-wizard-lantern-v3': [['左',[10],11],['右',[15],12]],
 'gen-tree-friends-v3': [['犬右',[13],14],['犬左',[16],17],['猫左',[22],23],['猫右',[26],27]],
 'gen-tree-friends-v4': [['犬右',[13],14],['犬左',[16],17],['猫左',[22],23],['猫右',[25],26]],
 'gen-ocean-friends-v2': [['イルカ',[4],5],['カメ左',[10],11],['カメ右',[12],13],['魚',[28],29]],
 'gen-dinosaur-eggs-v2': [['左',[4,5],3],['右',[7],8]],
 'gen-excavator-cones-v2': [['左',[24],27],['右',[25],28]],
 'gen-explorer-robot-v2': [['左',[8],9],['右',[10],13]],
 'gen-rocket-astronaut-v2': [['左',[18],22],['右',[19],20]],
};
const eyeMap=[];
// Full-size runtime path rasterization measures the inside of contour edges.
// These two parts fall just below 24px despite their source masks being >=24px.
// Record them individually and require the same real interaction evidence.
plans['gen-ocean-friends-v2'].renderWidths={r36:23.8};
plans['gen-explorer-robot-v2'].renderWidths={r02:22.8};

plans['gen-princess-bunny-v6']={
 renderWidths:{r43:23.8},
 names:'王冠|metal,王冠中央の宝石|glass,王冠左の髪|hair,王冠左の宝石|glass,王冠右の宝石|glass,前髪と右内側の髪|hair,顔と耳|skin,左外側の長い髪|hair,左こめかみの髪|hair,左の瞳,左の瞳のハイライト,右の瞳,左内側の長い髪|hair,右の瞳のハイライト,首の左側の髪|hair,口|skin,右外側の長い髪|hair,左の袖|fabric,首と胸元|skin,右の袖|fabric,ドレスの身頃|fabric,左腕と手|skin,右腕と手|skin,左腕と身頃の間の背景|background,リボン左|fabric,リボン右|fabric,右袖と身頃の間の背景|background,スカート左の重なり|fabric,スカート右の重なり|fabric,リボンの垂れ|fabric,リボンの結び目|fabric,右腕とリボンの間の背景|background,左手とスカートの間の背景|background,うさぎ左耳|fur,スカート左端|fabric,スカート中央|fabric,うさぎ左耳の内側|skin,うさぎの顔と右耳|fur,うさぎ右耳の内側|skin,スカート左中央|fabric,スカート右端|fabric,うさぎ左の瞳,うさぎ左の瞳のハイライト,うさぎ右の瞳,うさぎ右の瞳のハイライト,うさぎの鼻|skin,うさぎの口|skin,うさぎの胸と左前脚|fur,うさぎの首飾り|fabric,うさぎリボン左|fabric,うさぎリボン結び目|fabric,うさぎリボン右|fabric,うさぎの体と右前脚|fur,うさぎの左後脚|fur,うさぎのしっぽ|fur,うさぎの脚の間の背景|background',
};
plans['gen-dinosaur-eggs-v4']={
 names:'恐竜の顔と体|skin,左の瞳,左の瞳のハイライト,右の瞳,右の瞳のハイライト,左の鼻孔|skin,右の鼻孔|skin,口の中|skin,左の歯,右の歯,おなか|skin,奥の手|skin,奥の卵,手前の卵の上側,奥の脚|skin,手前の卵の下側,大きい岩|stone,奥の左の爪,奥の右の爪,手前の左の爪,手前の中央の爪,手前の右の爪,小さい岩|stone',
};
plans['gen-wizard-lantern-v6']={
 names:'帽子|fabric,帽子の星|metal,帽子のつば左|fabric,杖の星|wood,左の前髪|hair,顔と右耳|skin,右の髪|hair,杖の上側|wood,左耳|skin,左の瞳,左の瞳のハイライト,右の瞳のハイライト,帽子のつば右|fabric,左耳の下の髪|hair,右の瞳,口|skin,杖を持つ手|skin,左の襟|fabric,襟と首の間の背景|background,首|skin,右の襟|fabric,右耳の下の髪|hair,左の袖とマント|fabric,胸の留め具|metal,杖の下側|wood,服の身頃|fabric,右の袖|fabric,ランタンを持つ手|skin,ランタン持ち手左|metal,ランタン持ち手右|metal,マント左内側|fabric,ランタン持ち手の中の背景|background,ランタンを持つ親指|skin,ランタン上部の留め具|metal,袖とランタンの間の背景|background,ランタンの屋根|metal,左のズボン|fabric,脚の後ろのマント|fabric,右のズボン|fabric,ランタンの枠|metal,ランタンのガラス|glass,炎の外側,炎の内側,左の靴|rubber,右の靴|rubber,ろうそくの溶けたろう,ろうそく本体,靴とランタンの間の背景|background,左の靴底|rubber,右の靴底|rubber',
};
plans['gen-rocket-astronaut-v5']={
 names:'ロケットの先端|metal,惑星上側,惑星の輪,惑星の輪の右の背景|background,ロケット上の帯|metal,惑星の輪の左の背景|background,惑星下側,星,ロケット本体|metal,丸窓の枠|metal,丸窓|glass,ヘルメットの枠|plastic,髪|hair,顔と左耳|skin,ヘルメット右の部品|plastic,ヘルメット左の部品|plastic,左の瞳,右の瞳,右の瞳のハイライト,左の瞳のハイライト,右の手袋|fabric,口|skin,ロケット左の翼|metal,ロケット右の翼|metal,右の肩ひも|fabric,右肩の後ろの背景|background,右袖|fabric,右の袖口|fabric,ロケット下の帯|metal,左袖|fabric,左肩の後ろの背負い袋|metal,左の肩ひも|fabric,宇宙服の身頃|fabric,胸のパネル|plastic,胸のボタン|plastic,背負い袋の右側|metal,左の袖口|fabric,ロケットのノズル|metal,左の手袋|fabric,腰のベルト|fabric,ロケットの炎の外側,ロケットの炎の内側,宇宙服のズボン|fabric,左の裾|fabric,右の裾|fabric,左のブーツ|fabric,右のブーツ|fabric,左の靴底|rubber,右の靴底|rubber',
};

const gapPlans=JSON.parse(await fs.readFile(path.join(root,'content/generated-lineart/gap-review-plan.json'),'utf8'));
for (const [id, plan] of Object.entries(plans).filter(([id])=>Object.hasOwn(gapPlans.templates,id))) {
 const directory=path.join(root,'tools/asset-pipeline/output',id);
 const qa=JSON.parse(await fs.readFile(path.join(directory,'qa.json'),'utf8'));
 const destination=path.join(root,'content/generated-lineart/annotations',`${id}.json`);
 const previous=await fs.readFile(destination,'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 if(previous&&previous.originalSha256!==qa.originalSha256)throw Error(`${id}: 原画hashが変更されたため注釈を再確認してください`);
 const gapReviews=bindGapReviews(qa,gapPlans.templates[id]);
 if(process.argv.includes('--gaps-only')){
  if(!previous)throw Error(`${id}: 既存の素材注釈がありません`);
  await fs.writeFile(destination,JSON.stringify({...previous,gapReviews},null,2)+'\n');
  console.log(`${id}: 候補の座標・部位注釈のみ更新。承認・原画・素材・形状は不変`);continue;
 }
 const definitions=plan.names.split(',');
 const regions=definitions.map((definition,index)=>{
  const regionId=`r${String(index+1).padStart(2,'0')}`;
  const metric=qa.regions.find(item=>item.id===regionId);
  const old=previous?.regions.find(item=>item.sourceRegionId===regionId);
  if(!metric&&!old)throw Error(`${id}: ${regionId}の領域が見つかりません`);
  const [name,material='standard']=definition.split('|');
  const background=material==='background';
  const flat=/瞳|白目|歯/.test(name);
  const entry={sourceRegionId:regionId,point:metric?.labelPoint??old.point,role:background?'background':'paint',name,
   reason:background?'番号付き原画と比較し、主役の物体ではなく囲まれた外背景と確認。黒い輪郭はそのまま保持。':`番号付き原画で${name}として識別。原画の閉領域をそのまま使用。`,
   ...(!background?{material,confidence:.9,shade:!flat,highlight:!flat&&!['fabric','rubber','fur'].includes(material),texture:flat||material==='skin'?0:.3,direction:90}:{})};
  if(!background&&(metric?.usableDiameter??old?.measuredDiameter)>=17&&(metric?.usableDiameter??old?.measuredDiameter)<24)entry.widthException={reason:`${name}は意図した小さい部位。4倍拡大で対象の選択・着色・消去が可能な実証に限り例外とする。幼児の実機での容易さは未確認。`,evidenceFile:`content/generated-lineart/interaction/${id}.json`};
  entry.measuredDiameter=metric?.usableDiameter??old?.measuredDiameter;
  if(plan.renderWidths?.[regionId])entry.widthException={reason:`${name}は原画maskの幅${entry.measuredDiameter}pxに対し、実寸の公開path再描画で${plan.renderWidths[regionId]}px。17〜24pxの個別操作例外として、4×での選択・着色・消去の実測に結び付ける。`,secondaryUsableDiameter:plan.renderWidths[regionId],evidenceFile:`content/generated-lineart/interaction/${id}.json`};
  return entry;
 });
 const eyes=(eyePairs[id]??[]).map(([name,pupils,highlight])=>({name,pupilIds:pupils.map(number=>`r${String(number).padStart(2,'0')}`),highlightId:`r${String(highlight).padStart(2,'0')}`}));
 for(const eye of eyes)for(const regionId of [...eye.pupilIds,eye.highlightId]){const entry=regions.find(item=>item.sourceRegionId===regionId);if(!entry||entry.role!=='paint')throw Error(`${id}: 瞳の領域対応が不正です`);entry.eyeRole=regionId===eye.highlightId?'eye-highlight':'pupil';entry.highlight=false;entry.shade=false;entry.texture=0;}
 regions.push(...(plan.tiny??[]));
 const data={schemaVersion:1,templateId:id,originalSha256:qa.originalSha256,coordinateSpace:'normalized-1600x2000',
  reviewer:'Codex technical source review',reviewKind:'author-technical-annotation',humanApproved:false,
  checks:['all-subject-parts-closed','negative-space-excluded','pupils-and-highlights-white'],unresolvedLeaks:[],regions,gapReviews,eyes};
 await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,JSON.stringify(data,null,2)+'\n');
 console.log(`${id}: ${regions.filter(item=>item.role==='paint').length} paint / ${regions.filter(item=>item.role==='background').length} background annotations; no approval created`);
 eyeMap.push({templateId:id,originalSha256:qa.originalSha256,eyes,automaticHighlights:false,humanApproved:false});
}
const latestEyes = new Map();
for (const entry of eyeMap) {
 const [,base,version] = /^(.*)-v(\d+)$/.exec(entry.templateId);
 if (!latestEyes.has(base) || latestEyes.get(base).version < Number(version)) latestEyes.set(base,{version:Number(version),entry});
}
if(!process.argv.includes('--gaps-only'))await fs.writeFile(path.join(root,'content/generated-lineart/eye-region-map.json'),JSON.stringify([...latestEyes.values()].map(value=>value.entry),null,2)+'\n');
