/**
 * 日本語（Japanese）言語パック
 */
export default {
  // タイトルと説明
  title: 'PNG分割ツール',
  subtitle:
    '任意でクロマキー後、透明領域ごとにPNGを矩形に分割（既に透明な画像はそのまま分割可能）',
  
  // ボタンテキスト
  selectImage: 'PNG画像を選択',
  processing: '処理中...',
  downloadAll: 'すべてダウンロード',
  downloadComponent: 'コンポーネントをダウンロード',
  
  // エラーメッセージ
  errorInvalidFormat: 'PNG形式の画像をアップロードしてください！',
  errorNoComponents: 'UIコンポーネントが検出されませんでした！画像に非透明領域が含まれていることを確認してください。',
  errorProcessFailed: '画像処理に失敗しました：',
  errorLoadFailed: '画像の読み込みに失敗しました。ファイルが破損していないか確認してください',
  errorReadFailed: 'ファイルの読み込みに失敗しました',
  errorNoImages: 'ダウンロードできる画像がありません！',
  errorPickColor: 'クロマキーがオンです。左の画像で背景色をクリックしてください。',
  chromaSectionTitle: 'クロマキーとプレビュー',
  chromaOptionalNote:
    'PNGに既に透明がある場合はクロマキーをオフにして分割。不透明背景ではオンにして色を選択。',
  chromaEnable: 'クロマキーを有効にする（不透明な背景を除去）',
  pickColorTitle: '背景色の取得',
  pickColorHint: '背景として除去したい色をクリック（グリーンバック・単色など）。',
  pickColorDisabled: 'オフのときは原画表示。オンにすると色を取得できます。',
  previewTitle: 'プレビュー',
  previewResult: 'キーイング結果',
  previewMask: 'マット',
  advancedTitle: '詳細設定',
  advancedIntro:
    '「背景にどれだけ似たら抜くか」→「輪郭の柔らかさ」→「色にじみ除去」の順。被写体と背景が近い色のときは上の保護ブラシも併用してください。',
  advancedGroupMatch: 'サンプリングと色の一致',
  advancedGroupEdge: 'エッジとアルファの遷移',
  advancedGroupSpill: 'スピル除去（色にじみ）',
  tolerance: '色の許容差',
  toleranceDesc:
    'サンプル背景色からこの色差以内のピクセルを透明にします。大きいほど広く抜けますが被写体の同色部分も食いやすく、小さいと背景が残りやすいです。',
  softness: 'フェザー（px）',
  softnessDesc:
    'しきい値付近で不透明→透明へ変化する幅（px）。大きいほど柔らかい輪郭。「エッジのフェザー」がオンのときのみ有効です。',
  edgeSmooth: 'エッジのフェザー',
  edgeSmoothDesc: 'オフで硬い境界。オンで上記フェザー半径による滑らかなアルファ遷移を使います。',
  edgeRadius: 'エッジ半径',
  edgeRadiusDesc:
    '輪郭付近でスピル補正を考慮する範囲（px）。透明に近いエッジほど背景色の染みを抑えます。',
  despill: 'スピル除去',
  despillDesc:
    '背景色が被写体の縁に乗る現象（グリーンスクリーンの緑など）を抑えます。オフなら色相補正なし。',
  despillStrength: 'スピル強度',
  despillStrengthDesc: '除去の強さ。高すぎると縁が灰色っぽく不自然になることがあります。',
  sampleRadius: '色サンプル半径',
  sampleRadiusDesc:
    'クリック周辺を平均して背景色を決めます。やや大きいとノイズに強いですが、大きすぎると被写体色が混ざります。',
  runSplit: '分割を実行',
  runSplitAgain: '再分割',
  colorPicked: 'サンプル',
  brushProtect: '保護ブラシ（塗った部分は元画像を保持）',
  brushDiameter: 'ブラシ直径',
  brushClear: '塗りを消去',
  brushHint:
    'キーイング結果表示で：誤って透明になった部分に塗って元のピクセルを復元。マスク表示ではブラシ無効。背景色を取り直すと塗りは消えます。',
  
  // プレビューと結果
  resultsTitle: '分割結果',
  resultsDescription: '各UIコンポーネントは自動的に識別され、透明な背景を持つ独立したPNG画像に分割されました。',
  identifiedComponents: '識別された',
  components: '個の独立したUIコンポーネント',
  
  // 画像情報
  component: 'コンポーネント',
  size: 'サイズ',
  position: '位置',
  pixels: 'ピクセル',
  
  // 読み込みメッセージ
  processingImage: '画像を処理中...',
}



