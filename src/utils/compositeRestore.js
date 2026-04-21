/**
 * 将「抠图结果」与「原图」按保护蒙版混合：蒙版越亮，越保留原图像素（用于修复与背景同色被误抠的区域）
 * 蒙版使用 R 通道强度 0–255（G/B 同步绘制即可）
 */

export function compositeKeyedWithRestore(sourceCanvas, keyedCanvas, restoreMaskCanvas, outCanvas) {
  const w = sourceCanvas.width
  const h = sourceCanvas.height
  outCanvas.width = w
  outCanvas.height = h

  const sctx = sourceCanvas.getContext('2d')
  const kctx = keyedCanvas.getContext('2d')
  const rctx = restoreMaskCanvas.getContext('2d')
  const octx = outCanvas.getContext('2d')

  if (!sctx || !kctx || !rctx || !octx) {
    return
  }

  const srcD = sctx.getImageData(0, 0, w, h)
  const keyD = kctx.getImageData(0, 0, w, h)
  const resD = rctx.getImageData(0, 0, w, h)
  const out = octx.createImageData(w, h)

  for (let i = 0; i < out.data.length; i += 4) {
    const t = resD.data[i] / 255
    const ot = 1 - t
    out.data[i] = Math.round(keyD.data[i] * ot + srcD.data[i] * t)
    out.data[i + 1] = Math.round(keyD.data[i + 1] * ot + srcD.data[i + 1] * t)
    out.data[i + 2] = Math.round(keyD.data[i + 2] * ot + srcD.data[i + 2] * t)
    out.data[i + 3] = Math.round(keyD.data[i + 3] * ot + srcD.data[i + 3] * t)
  }

  octx.putImageData(out, 0, 0)
}

/**
 * 绘制「有效」透明度蒙版预览（灰度图，与 chromaKey 的 mask 画布视觉一致）
 * 会纳入保护画笔：涂抹处按原图 Alpha 与抠图 Alpha 混合，与抠图结果一致
 */
export function drawEffectiveAlphaMask(sourceCanvas, keyedCanvas, restoreMaskCanvas, outCanvas) {
  const w = sourceCanvas.width
  const h = sourceCanvas.height
  outCanvas.width = w
  outCanvas.height = h

  const sctx = sourceCanvas.getContext('2d')
  const kctx = keyedCanvas.getContext('2d')
  const rctx = restoreMaskCanvas.getContext('2d')
  const octx = outCanvas.getContext('2d')

  if (!sctx || !kctx || !rctx || !octx) {
    return
  }

  const srcD = sctx.getImageData(0, 0, w, h)
  const keyD = kctx.getImageData(0, 0, w, h)
  const resD = rctx.getImageData(0, 0, w, h)
  const out = octx.createImageData(w, h)

  for (let i = 0; i < out.data.length; i += 4) {
    const t = resD.data[i] / 255
    const ot = 1 - t
    const a = Math.round(keyD.data[i + 3] * ot + srcD.data[i + 3] * t)
    out.data[i] = a
    out.data[i + 1] = a
    out.data[i + 2] = a
    out.data[i + 3] = 255
  }

  octx.putImageData(out, 0, 0)
}

/** 生成与源图同尺寸的合成结果画布（用于切分导出） */
export function buildFinalKeyedCanvas(sourceCanvas, keyedCanvas, restoreMaskCanvas) {
  const canvas = document.createElement('canvas')
  canvas.width = sourceCanvas.width
  canvas.height = sourceCanvas.height
  compositeKeyedWithRestore(sourceCanvas, keyedCanvas, restoreMaskCanvas, canvas)
  return canvas
}
