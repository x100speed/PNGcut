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
  errorPickColor: 'クロマキーがオンです。左の画像で少なくとも1つの背景色をクリックしてください。',
  chromaSectionTitle: 'クロマキーとプレビュー',
  chromaOptionalNote:
    'PNGに既に透明がある場合はクロマキーをオフにして分割。不透明背景ではオンにして色を選択（複数回クリックで複数色可）。',
  chromaEnable: 'クロマキーを有効にする（不透明な背景を除去）',
  pickColorTitle: '背景色の取得',
  pickColorHint:
    '背景として除去したい色をクリック。複数回クリックで複数色を追加できます。近い色のクリックは既存サンプルを更新します。',
  pickColorDisabled: 'オフのときは原画表示。オンにすると色を取得できます。',
  previewTitle: 'プレビュー',
  previewResult: 'キーイング結果',
  previewMask: 'マット',
  downloadKeyedImage: '画像をダウンロード',
  downloadKeyedHint: '分割せず、キーイング後の画像全体をダウンロード（保護ブラシ込み）',
  enlargePreview: '拡大表示',
  enlargePreviewHint: 'プレビューを拡大。ダブルクリックでも開けます',
  closePreviewZoom: '閉じる',
  advancedTitle: '詳細設定',
  advancedIntro:
    '背景との一致→内部保護→輪郭の柔らかさ→スピル除去→弱いアルファ除去/収縮の順。被写体と背景が近い色のときは保護ブラシも併用してください。',
  advancedGroupMatch: 'サンプリングと色の一致',
  advancedGroupEdge: 'エッジとアルファの遷移',
  advancedGroupSpill: 'スピル除去（色にじみ）',
  advancedGroupDefringe: '白縁除去（弱アルファ / 収縮）',
  tolerance: '色の許容差',
  toleranceDesc:
    'いずれかのサンプル背景色からこの色差以内のピクセルを透明にします。大きいほど広く抜けますが被写体も食いやすく、小さいと背景が残りやすいです。',
  protectInterior: '内部を保護（連結キーイング）',
  protectInteriorDesc:
    '画面端とつながった背景だけを抜きます。内部の同色（白い服など）は透明になりません。通常はオン推奨。',
  enclosedMin: '閉じた領域の除去しきい値',
  enclosedMinDesc:
    '端とつながっていない内部の同色の穴（脇の隙間など）は、面積がこのピクセル数以上のときだけ抜きます。大きいほど内部を守り、0 ですべて抜きます。',
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
  defringe: '白縁を徹底除去',
  defringeDesc:
    '半透明画素の背景混色除去、薄い残影のカット、エッジ収縮を行います。輪郭が欠けたら収縮を0にしてください。',
  erodePx: 'エッジ収縮',
  erodePxDesc:
    '不透明領域を0〜3px内側へ侵食。1pxでアンチエイリアス白縁を抑えやすいです。大きすぎると輪郭が削れます。',
  alphaCutoff: '弱いアルファ除去',
  alphaCutoffDesc:
    'この閾値未満のアルファを完全透明にし、フェザー残影を消します。大きすぎると輪郭が硬くなります。',
  sampleRadius: '色サンプル半径',
  sampleRadiusDesc:
    'クリック周辺を平均して背景色を決めます。やや大きいとノイズに強いですが、大きすぎると被写体色が混ざります。',
  runSplit: '分割を実行',
  runSplitAgain: '再分割',
  colorPicked: '背景サンプル',
  clearAllSamples: 'すべてクリア',
  removeSample: 'この色を削除',
  brushProtect: '保護ブラシ（塗った部分は元画像を保持）',
  brushDiameter: 'ブラシ直径',
  brushClear: '塗りを消去',
  brushHint:
    'キーイング結果表示で：誤って透明になった部分に塗って元のピクセルを復元。マスク表示ではブラシ無効。サンプル変更で塗りは消えます。',
  
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



