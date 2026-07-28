/**
 * 色键抠图（Chroma Key）——从 video-timesheet-web / character-sprite-splitter 移植增强
 * 支持：多背景色、弱透明剔除、边缘收缩（alpha 腐蚀）、去污色
 * 在浏览器中对 Canvas 像素做背景色扣除，输出带 Alpha 的图像与蒙版预览。
 */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function channelToHex(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
}

function rgbToHex(rgb) {
  return `#${channelToHex(rgb.r)}${channelToHex(rgb.g)}${channelToHex(rgb.b)}`
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getDominantChannel(sample) {
  if (sample.r >= sample.g && sample.r >= sample.b) return 'r'
  if (sample.g >= sample.r && sample.g >= sample.b) return 'g'
  return 'b'
}

/**
 * 统一取出样本色列表（兼容旧的单 sample 与新的 samples 数组）
 * @param {object} options
 * @returns {Array<{r:number,g:number,b:number}>}
 */
export function normalizeSampleRgbs(options) {
  if (Array.isArray(options.samples) && options.samples.length > 0) {
    return options.samples.map((s) => s.rgb || s)
  }
  if (options.sample) {
    return [options.sample.rgb || options.sample]
  }
  return []
}

export function computeColorDistance(pixel, sample, algorithm) {
  const dr = pixel.r - sample.r
  const dg = pixel.g - sample.g
  const db = pixel.b - sample.b

  if (algorithm === 'classic') {
    return Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db))
  }

  return Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3)
}

/**
 * 相对多个样本色：取最小色距，并返回最近的那个样本（用于去溢色/去污色）
 */
export function computeMinColorDistance(pixel, sampleRgbs, algorithm) {
  let bestDist = Infinity
  let bestSample = sampleRgbs[0]
  for (let i = 0; i < sampleRgbs.length; i++) {
    const dist = computeColorDistance(pixel, sampleRgbs[i], algorithm)
    if (dist < bestDist) {
      bestDist = dist
      bestSample = sampleRgbs[i]
    }
  }
  return { distance: bestDist, sample: bestSample }
}

export function getOpacityForDistance(distance, tolerance, softness, algorithm, smoothing) {
  const threshold = Math.max(0, tolerance)
  const feather = smoothing ? Math.max(0, softness) : 0

  if (distance <= threshold) {
    return 0
  }

  if (feather <= 0) {
    return 1
  }

  if (distance >= threshold + feather) {
    return 1
  }

  const progress = (distance - threshold) / feather
  if (algorithm === 'classic') {
    return progress
  }

  return progress * progress * (3 - 2 * progress)
}

export function applyDespill(pixel, sample, opacity, despill) {
  const normalizedDespill = clamp(despill, 0, 100) / 100
  const reductionFactor = (1 - opacity) * normalizedDespill

  if (reductionFactor <= 0) {
    return pixel
  }

  const dominant = getDominantChannel(sample)
  const output = { ...pixel }

  if (dominant === 'g' && output.g > Math.max(output.r, output.b)) {
    output.g -= (output.g - Math.max(output.r, output.b)) * reductionFactor
  }

  if (dominant === 'r' && output.r > Math.max(output.g, output.b)) {
    output.r -= (output.r - Math.max(output.g, output.b)) * reductionFactor
  }

  if (dominant === 'b' && output.b > Math.max(output.r, output.g)) {
    output.b -= (output.b - Math.max(output.r, output.g)) * reductionFactor
  }

  return {
    r: clamp(Math.round(output.r), 0, 255),
    g: clamp(Math.round(output.g), 0, 255),
    b: clamp(Math.round(output.b), 0, 255),
  }
}

/**
 * 去污色：半透明边缘常混进背景色（白边）。
 * 公式：foreground ≈ (observed - bg*(1-a)) / a
 */
export function decontaminateColor(pixel, sample, opacity) {
  if (opacity <= 0.02 || opacity >= 0.98) return pixel
  const a = opacity
  return {
    r: clamp(Math.round((pixel.r - sample.r * (1 - a)) / a), 0, 255),
    g: clamp(Math.round((pixel.g - sample.g * (1 - a)) / a), 0, 255),
    b: clamp(Math.round((pixel.b - sample.b * (1 - a)) / a), 0, 255),
  }
}

/**
 * alpha 形态学腐蚀：邻域取最小 alpha，向外收缩不透明区域，掐掉细白边
 * @param {Uint8ClampedArray|Uint8Array} alphaArr 每像素一个 alpha
 * @param {number} width
 * @param {number} height
 * @param {number} radius 腐蚀次数（像素）
 */
export function erodeAlpha(alphaArr, width, height, radius) {
  if (radius <= 0) return alphaArr
  let cur = alphaArr
  for (let pass = 0; pass < radius; pass++) {
    const next = new Uint8ClampedArray(cur.length)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minA = 255
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              minA = 0
              continue
            }
            minA = Math.min(minA, cur[ny * width + nx])
          }
        }
        next[y * width + x] = minA
      }
    }
    cur = next
  }
  return cur
}

/**
 * 边缘残白清理：与透明邻接、且颜色仍接近样本色的像素，直接抠掉
 */
function killNearSampleEdgeFringe(outPx, distances, width, height, fringeTol) {
  const total = width * height
  const kill = new Uint8Array(total)
  for (let i = 0; i < total; i++) {
    const a = outPx[i * 4 + 3]
    if (a < 8) continue
    if (distances[i] > fringeTol) continue
    const x = i % width
    const y = (i / width) | 0
    let nearClear = false
    for (let dy = -1; dy <= 1 && !nearClear; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          nearClear = true
          break
        }
        if (outPx[(ny * width + nx) * 4 + 3] < 12) {
          nearClear = true
          break
        }
      }
    }
    if (nearClear) kill[i] = 1
  }
  for (let i = 0; i < total; i++) {
    if (kill[i]) outPx[i * 4 + 3] = 0
  }
}

/**
 * 在画布上取色（可指定采样半径，对小块区域取平均 RGB）
 */
export function sampleCanvasColor(canvas, x, y, radius) {
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('无法读取画布像素数据。')
  }

  const clampedX = clamp(Math.round(x), 0, canvas.width - 1)
  const clampedY = clamp(Math.round(y), 0, canvas.height - 1)
  const sampleRadius = Math.max(0, Math.round(radius))
  const startX = clamp(clampedX - sampleRadius, 0, canvas.width - 1)
  const startY = clamp(clampedY - sampleRadius, 0, canvas.height - 1)
  const endX = clamp(clampedX + sampleRadius, 0, canvas.width - 1)
  const endY = clamp(clampedY + sampleRadius, 0, canvas.height - 1)
  const width = endX - startX + 1
  const height = endY - startY + 1
  const imageData = context.getImageData(startX, startY, width, height).data

  let totalR = 0
  let totalG = 0
  let totalB = 0
  let samples = 0

  for (let index = 0; index < imageData.length; index += 4) {
    totalR += imageData[index]
    totalG += imageData[index + 1]
    totalB += imageData[index + 2]
    samples += 1
  }

  const rgb = {
    r: Math.round(totalR / Math.max(samples, 1)),
    g: Math.round(totalG / Math.max(samples, 1)),
    b: Math.round(totalB / Math.max(samples, 1)),
  }

  return {
    x: clampedX,
    y: clampedY,
    hex: rgbToHex(rgb),
    rgb,
  }
}

/**
 * 对整张图应用色键，返回结果画布与蒙版画布
 * @param {HTMLCanvasElement} source
 * @param {object} options
 *   - samples: 多样本色数组（优先），或 sample: 单样本（兼容）
 *   - tolerance / softness / smoothing / algorithm
 *   - despillEnabled / despill / edgeRadius
 *   - defringeEnabled: 彻底去白边（去污色 + 弱透明 + 边缘收缩）
 *   - erodePx: 边缘收缩像素（0~3）
 *   - alphaCutoff: 弱透明剔除阈值（0~80，alpha 低于此直接变 0）
 */
export function applyColorKey(source, options) {
  const sourceContext = source.getContext('2d')
  if (!sourceContext) {
    throw new Error('无法读取源图像。')
  }

  const sampleRgbs = normalizeSampleRgbs(options)
  if (sampleRgbs.length === 0) {
    throw new Error('请至少选择一个背景色。')
  }

  const width = source.width
  const height = source.height
  const sourceImageData = sourceContext.getImageData(0, 0, width, height)
  const sourcePixels = sourceImageData.data
  const pixelCount = width * height

  const outputCanvas = createCanvas(width, height)
  const maskCanvas = createCanvas(width, height)
  const outputContext = outputCanvas.getContext('2d')
  const maskContext = maskCanvas.getContext('2d')

  if (!outputContext || !maskContext) {
    throw new Error('无法创建抠图画布。')
  }

  const outputImageData = outputContext.createImageData(width, height)
  const maskImageData = maskContext.createImageData(width, height)
  const outputPixels = outputImageData.data
  const maskPixels = maskImageData.data

  const distances = new Float32Array(pixelCount)
  const alphas = new Uint8ClampedArray(pixelCount)
  const defringeEnabled = Boolean(options.defringeEnabled)
  const erodePx = Math.max(0, Math.round(options.erodePx || 0))
  const alphaCutoff = Math.max(0, Number(options.alphaCutoff) || 0)

  for (let i = 0; i < pixelCount; i++) {
    const index = i * 4
    const pixel = {
      r: sourcePixels[index],
      g: sourcePixels[index + 1],
      b: sourcePixels[index + 2],
    }

    // 已接近全透明的像素：跳过色键，保留透明
    if (sourcePixels[index + 3] < 8) {
      distances[i] = 9999
      outputPixels[index] = pixel.r
      outputPixels[index + 1] = pixel.g
      outputPixels[index + 2] = pixel.b
      outputPixels[index + 3] = 0
      alphas[i] = 0
      maskPixels[index] = 0
      maskPixels[index + 1] = 0
      maskPixels[index + 2] = 0
      maskPixels[index + 3] = 255
      continue
    }

    // 多色：取与任一背景样本的最小色距
    const { distance, sample: nearestSample } = computeMinColorDistance(
      pixel,
      sampleRgbs,
      options.algorithm,
    )
    distances[i] = distance

    let opacity = getOpacityForDistance(
      distance,
      options.tolerance,
      options.softness,
      options.algorithm,
      options.smoothing,
    )
    // 乘上原图自身 alpha，避免半透明原图被抬高
    opacity *= sourcePixels[index + 3] / 255

    const edgeWeight =
      options.edgeRadius <= 0
        ? 1
        : clamp((options.tolerance + options.edgeRadius - distance) / options.edgeRadius, 0, 1)

    let adjustedPixel = pixel

    // 去污色：半透明像素里扣掉混入的背景色（减少白边）
    if (defringeEnabled) {
      adjustedPixel = decontaminateColor(adjustedPixel, nearestSample, opacity)
    }

    if (options.despillEnabled && options.despill > 0) {
      adjustedPixel = applyDespill(
        adjustedPixel,
        nearestSample,
        opacity,
        options.despill * edgeWeight,
      )
    }

    // 弱透明直接剔掉，避免羽化残影发白
    if (defringeEnabled && opacity * 255 < alphaCutoff) {
      opacity = 0
    }

    const alpha = Math.round(opacity * 255)
    outputPixels[index] = adjustedPixel.r
    outputPixels[index + 1] = adjustedPixel.g
    outputPixels[index + 2] = adjustedPixel.b
    outputPixels[index + 3] = alpha
    alphas[i] = alpha

    maskPixels[index] = alpha
    maskPixels[index + 1] = alpha
    maskPixels[index + 2] = alpha
    maskPixels[index + 3] = 255
  }

  // 彻底去白边后处理：碎边清除 → 边缘收缩 → 再剔一次弱透明
  if (defringeEnabled) {
    killNearSampleEdgeFringe(
      outputPixels,
      distances,
      width,
      height,
      options.tolerance + Math.max(8, options.softness || 0),
    )

    for (let i = 0; i < pixelCount; i++) {
      alphas[i] = outputPixels[i * 4 + 3]
    }

    if (erodePx > 0) {
      const eroded = erodeAlpha(alphas, width, height, erodePx)
      for (let i = 0; i < pixelCount; i++) {
        outputPixels[i * 4 + 3] = eroded[i]
      }
    }

    // 腐蚀后再做一次弱透明剔除
    if (alphaCutoff > 0) {
      for (let i = 0; i < pixelCount; i++) {
        if (outputPixels[i * 4 + 3] < alphaCutoff) {
          outputPixels[i * 4 + 3] = 0
        }
      }
    }

    // 同步蒙版预览
    for (let i = 0; i < pixelCount; i++) {
      const a = outputPixels[i * 4 + 3]
      const o = i * 4
      maskPixels[o] = a
      maskPixels[o + 1] = a
      maskPixels[o + 2] = a
    }
  }

  outputContext.putImageData(outputImageData, 0, 0)
  maskContext.putImageData(maskImageData, 0, 0)

  return {
    image: outputCanvas,
    mask: maskCanvas,
  }
}
