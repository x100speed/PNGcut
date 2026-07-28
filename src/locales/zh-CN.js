/**
 * 中文（简体）语言包
 */
export default {
  // 标题和描述
  title: 'PNG切分工具',
  subtitle: '可选背景色抠图后，将 PNG 按透明区域切分为多个最小矩形（也支持已有透明底的图直接切分）',
  
  // 按钮文本
  selectImage: '选择PNG图片',
  processing: '处理中...',
  downloadAll: '下载全部',
  downloadComponent: '下载此组件',
  
  // 错误信息
  errorInvalidFormat: '请上传PNG格式的图片！',
  errorNoComponents: '未检测到任何UI组件！请确保图片包含非透明区域。',
  errorProcessFailed: '图片处理失败：',
  errorLoadFailed: '图片加载失败，请检查文件是否损坏',
  errorReadFailed: '文件读取失败',
  errorNoImages: '没有可下载的图片！',
  errorPickColor: '已开启抠图，请先点击左侧图片选择至少一个要去除的背景色。',
  
  // 抠图（可选）
  chromaSectionTitle: '抠图与预览',
  chromaOptionalNote:
    '若您的 PNG 已带透明底，请关闭下方「启用背景色抠图」，直接点击「开始切分」。不透明背景请先开启抠图并取色（可点多次选多个背景色）。',
  chromaEnable: '启用背景色抠图（去除不透明背景）',
  pickColorTitle: '点击取色（参考画面）',
  pickColorHint:
    '在画面上点击要作为「背景」扣除的颜色；可多次点击添加多个颜色（适合背景有多种色块）。色差接近的点击会更新已有样本。',
  pickColorDisabled: '关闭抠图时显示原图；开启后可在此取色。',
  previewTitle: '抠图预览',
  previewResult: '抠图结果',
  previewMask: '蒙版',
  advancedTitle: '高级参数',
  advancedIntro:
    '按用途分组：先决定「多像背景算背景」，再调边缘软硬，然后处理色边，最后用弱透明剔除/边缘收缩清白边。主体与背景颜色接近时，可配合上方保护画笔修补。',
  advancedGroupMatch: '取色与颜色匹配',
  advancedGroupEdge: '边缘与透明度过渡',
  advancedGroupSpill: '去溢色（异色边）',
  advancedGroupDefringe: '去白边（弱透明 / 收缩）',
  tolerance: '颜色容差',
  toleranceDesc:
    '与任一样本背景色的色差在此范围内会当作背景并抠成透明。数值越大抠得越「狠」，越容易误伤与背景相近的主体颜色；过小可能残留背景边。',
  softness: '羽化半径',
  softnessDesc:
    '在容差边界附近，从不透明到透明过渡的宽度（像素）。越大边缘越柔和；需先开启「边缘平滑」才生效。',
  edgeSmooth: '边缘平滑（羽化过渡）',
  edgeSmoothDesc: '关闭时边缘为硬切分（无过渡带）；开启后才会使用上方的羽化半径做柔和过渡。',
  edgeRadius: '边缘采样半径',
  edgeRadiusDesc:
    '用于判断「靠近透明轮廓」的范围（像素），主要配合去溢色：离抠图边缘越近的像素，越会按强度削弱背景色染边。',
  despill: '异色移除（去溢色）',
  despillDesc:
    '减轻背景色「染」到主体轮廓上的现象（如绿幕绿边、蓝边）。关闭则不做色相修正。',
  despillStrength: '去溢色强度',
  despillStrengthDesc: '去溢色的力度。适当增大可去掉色边；过大可能让主体边缘颜色发灰、不自然。',
  defringe: '彻底去白边',
  defringeDesc:
    '开启后会：从半透明像素扣掉背景色（去污色）、剔掉很淡的边缘残影、再按下方「边缘收缩」掐掉白轮廓。若角色外轮廓被咬掉一点，把边缘收缩调成 0。',
  erodePx: '边缘收缩',
  erodePxDesc:
    '对不透明区域做像素级向内腐蚀（0~3）。1px 通常能掐掉抗锯齿白边；调太大可能吃掉角色外轮廓。',
  alphaCutoff: '弱透明剔除',
  alphaCutoffDesc:
    '透明度低于此阈值的像素直接变全透明，用来去掉羽化留下的淡残影。数值越大清得越狠，过大可能让边缘发硬。',
  sampleRadius: '取色取样半径',
  sampleRadiusDesc:
    '在点击位置周围按方块区域取平均色作为背景样本。略大可抗单点噪点；过大可能混入主体颜色，取样不准。',
  runSplit: '开始切分',
  runSplitAgain: '重新切分',
  colorPicked: '已选背景色',
  clearAllSamples: '清空全部',
  removeSample: '删除此颜色',
  brushProtect: '保护画笔（涂抹区域保留原图，不被抠掉）',
  brushDiameter: '画笔直径',
  brushClear: '清除涂抹',
  brushHint:
    '在「抠图结果」视图下启用：在主体被误抠透明处涂抹，可恢复为原图像素。「蒙版」会显示含保护区域后的透明度（与结果一致）。重新取色或删改样本色会清空涂抹。',
  
  // 预览和结果
  resultsTitle: '切分结果',
  resultsDescription: '每个UI组件已自动识别并切分成独立的PNG图片，背景保持透明。',
  identifiedComponents: '共识别出',
  components: '个独立的UI组件',
  
  // 图片信息
  component: '组件',
  size: '尺寸',
  position: '位置',
  pixels: '像素',
  
  // 加载提示
  processingImage: '正在处理图片...',
}



