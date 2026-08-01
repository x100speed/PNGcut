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
 * 二值蒙版边缘收缩：把「有内容」的区域整体向内缩 radius 像素
 * 比纯 alpha 取最小值更直观——每级确定吃掉约 1px 外轮廓（含白边）
 * @param {Uint8ClampedArray|Uint8Array} alphaArr
 * @param {number} solidThreshold alpha 大于此值视为实心（默认 8）
 */
export function erodeBinaryMatte(alphaArr, width, height, radius, solidThreshold = 8) {
  if (radius <= 0) return alphaArr

  const total = width * height
  // 1 = 实心前景，0 = 透明/背景
  let cur = new Uint8Array(total)
  for (let i = 0; i < total; i++) {
    cur[i] = alphaArr[i] > solidThreshold ? 1 : 0
  }

  for (let pass = 0; pass < radius; pass++) {
    const next = new Uint8Array(total)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let keep = 1
        // 3x3 邻域内只要有一个透明/越界，当前像素就被「咬掉」
        for (let dy = -1; dy <= 1 && keep; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height || !cur[ny * width + nx]) {
              keep = 0
              break
            }
          }
        }
        next[y * width + x] = keep
      }
    }
    cur = next
  }

  // 被咬掉的位置 alpha 清零；保留处维持原 alpha（再交给后续弱透明剔除）
  const out = new Uint8ClampedArray(total)
  for (let i = 0; i < total; i++) {
    out[i] = cur[i] ? alphaArr[i] : 0
  }
  return out
}

/** 色距落在容差+羽化范围内 → 视为「可能是背景」的候选像素 */
function isBackgroundCandidate(distance, tolerance, softness, smoothing) {
  const feather = smoothing ? Math.max(0, softness) : 0
  return distance <= tolerance + feather
}

/**
 * 从图像四边做泛洪：只标记与画面边缘连通的背景候选
 * （角色内部同色区域如白衣、浅色装备，不会被当成背景）
 */
export function buildConnectedBackgroundMask(width, height, isCandidate) {
  const total = width * height
  const connected = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0

  const enqueue = (index) => {
    if (index < 0 || index >= total || connected[index] || !isCandidate(index)) return
    connected[index] = 1
    queue[tail++] = index
  }

  // 从四边种子开始扩散
  for (let x = 0; x < width; x++) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (head < tail) {
    const index = queue[head++]
    const x = index % width
    const y = (index / width) | 0
    if (x > 0) enqueue(index - 1)
    if (x < width - 1) enqueue(index + 1)
    if (y > 0) enqueue(index - width)
    if (y < height - 1) enqueue(index + width)
  }

  return connected
}

/**
 * 封闭区域扣除：内部未与边缘连通的背景候选（如腋下缝隙、镂空）
 * - minEnclosedArea <= 0：所有候选都抠（等同关闭保护）
 * - 面积 >= 阈值的封闭块才抠；小于阈值的保留（避免误伤内部小块同色）
 */
export function augmentBackgroundMaskWithEnclosedRegions(
  width,
  height,
  isCandidate,
  edgeConnected,
  minEnclosedArea,
) {
  const total = width * height
  const result = new Uint8Array(edgeConnected)

  if (minEnclosedArea <= 0) {
    for (let i = 0; i < total; i++) {
      if (isCandidate(i)) result[i] = 1
    }
    return result
  }

  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)

  for (let start = 0; start < total; start++) {
    if (!isCandidate(start) || edgeConnected[start] || visited[start]) continue

    let head = 0
    let tail = 0
    let area = 0
    queue[tail++] = start
    visited[start] = 1

    while (head < tail) {
      const index = queue[head++]
      area++
      const x = index % width
      const y = (index / width) | 0
      const tryN = (n) => {
        if (n < 0 || n >= total || visited[n] || !isCandidate(n) || edgeConnected[n]) return
        visited[n] = 1
        queue[tail++] = n
      }
      if (x > 0) tryN(index - 1)
      if (x < width - 1) tryN(index + 1)
      if (y > 0) tryN(index - width)
      if (y < height - 1) tryN(index + width)
    }

    // 封闭块够大才当作真正背景抠掉
    if (area >= minEnclosedArea) {
      for (let qi = 0; qi < tail; qi++) {
        result[queue[qi]] = 1
      }
    }
  }

  return result
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
 * 生成「基础抠图像素」（不含边缘收缩 / 弱透明剔除）
 * 拖动边缘收缩滑块时可以复用这份数据，只重跑轻量后处理，预览才能实时跟上。
 * @returns {{ width:number, height:number, rgba:Uint8ClampedArray, distances:Float32Array }}
 */
export function computeKeyedBase(source, options) {
  const sourceContext = source.getContext('2d', { willReadFrequently: true })
  if (!sourceContext) {
    throw new Error('无法读取源图像。')
  }

  const sampleRgbs = normalizeSampleRgbs(options)
  if (sampleRgbs.length === 0) {
    throw new Error('请至少选择一个背景色。')
  }

  const width = source.width
  const height = source.height
  const sourcePixels = sourceContext.getImageData(0, 0, width, height).data
  const pixelCount = width * height

  const rgba = new Uint8ClampedArray(pixelCount * 4)
  const distances = new Float32Array(pixelCount)
  const rawOpacities = new Float32Array(pixelCount)
  const nearestSampleIndex = new Int16Array(pixelCount)

  const defringeEnabled = Boolean(options.defringeEnabled)
  const protectInterior = options.protectInterior !== false
  const enclosedMin = Math.max(0, Number(options.enclosedMin) || 0)

  // ----- 第一遍：算色距与原始透明度 -----
  for (let i = 0; i < pixelCount; i++) {
    const index = i * 4

    if (sourcePixels[index + 3] < 8) {
      distances[i] = 9999
      rawOpacities[i] = 0
      nearestSampleIndex[i] = 0
      continue
    }

    const pixel = {
      r: sourcePixels[index],
      g: sourcePixels[index + 1],
      b: sourcePixels[index + 2],
    }

    let bestDist = Infinity
    let bestIdx = 0
    for (let s = 0; s < sampleRgbs.length; s++) {
      const dist = computeColorDistance(pixel, sampleRgbs[s], options.algorithm)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = s
      }
    }
    distances[i] = bestDist
    nearestSampleIndex[i] = bestIdx
    rawOpacities[i] = getOpacityForDistance(
      bestDist,
      options.tolerance,
      options.softness,
      options.algorithm,
      options.smoothing,
    )
  }

  // ----- 连通背景蒙版 -----
  let keyedBg = null
  if (protectInterior) {
    const isCandidate = (i) =>
      isBackgroundCandidate(distances[i], options.tolerance, options.softness, options.smoothing)
    const edge = buildConnectedBackgroundMask(width, height, isCandidate)
    keyedBg = augmentBackgroundMaskWithEnclosedRegions(
      width,
      height,
      isCandidate,
      edge,
      enclosedMin,
    )
  }

  // ----- 第二遍：写基础像素（尚未边缘收缩）-----
  for (let i = 0; i < pixelCount; i++) {
    const index = i * 4
    const pixel = {
      r: sourcePixels[index],
      g: sourcePixels[index + 1],
      b: sourcePixels[index + 2],
    }

    if (sourcePixels[index + 3] < 8) {
      rgba[index] = pixel.r
      rgba[index + 1] = pixel.g
      rgba[index + 2] = pixel.b
      rgba[index + 3] = 0
      continue
    }

    const distance = distances[i]
    const nearestSample = sampleRgbs[nearestSampleIndex[i]]
    let opacity = rawOpacities[i]

    if (keyedBg && keyedBg[i] !== 1) {
      opacity = 1
    }

    opacity *= sourcePixels[index + 3] / 255

    const edgeWeight =
      options.edgeRadius <= 0
        ? 1
        : clamp((options.tolerance + options.edgeRadius - distance) / options.edgeRadius, 0, 1)

    let adjustedPixel = pixel

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

    rgba[index] = adjustedPixel.r
    rgba[index + 1] = adjustedPixel.g
    rgba[index + 2] = adjustedPixel.b
    rgba[index + 3] = Math.round(opacity * 255)
  }

  return { width, height, rgba, distances }
}

/**
 * 对基础抠图做后处理：碎边清除 → 边缘收缩 → 弱透明剔除
 * 只改 alpha，很快，适合滑块拖动时实时刷新预览
 */
export function finalizeKeyedFromBase(base, options) {
  const { width, height, distances } = base
  const pixelCount = width * height
  // 拷贝一份，避免多次后处理污染缓存的基础像素
  const outputPixels = new Uint8ClampedArray(base.rgba)
  const alphas = new Uint8ClampedArray(pixelCount)

  const defringeEnabled = Boolean(options.defringeEnabled)
  const erodePx = Math.max(0, Math.min(32, Math.round(Number(options.erodePx) || 0)))
  const alphaCutoff = Math.max(0, Math.min(255, Math.round(Number(options.alphaCutoff) || 0)))

  // 1) 碎边清除
  if (defringeEnabled) {
    killNearSampleEdgeFringe(
      outputPixels,
      distances,
      width,
      height,
      options.tolerance + Math.max(8, options.softness || 0),
    )
  }

  for (let i = 0; i < pixelCount; i++) {
    alphas[i] = outputPixels[i * 4 + 3]
  }

  // 2) 边缘收缩（二值蒙版，每级约咬掉 1px）
  if (erodePx > 0) {
    const eroded = erodeBinaryMatte(alphas, width, height, erodePx, Math.max(1, alphaCutoff || 8))
    for (let i = 0; i < pixelCount; i++) {
      outputPixels[i * 4 + 3] = eroded[i]
      alphas[i] = eroded[i]
    }
  }

  // 3) 弱透明剔除
  if (alphaCutoff > 0) {
    for (let i = 0; i < pixelCount; i++) {
      if (outputPixels[i * 4 + 3] < alphaCutoff) {
        outputPixels[i * 4 + 3] = 0
      }
    }
  }

  // 4) 收缩后再清一次碎边
  if (defringeEnabled) {
    killNearSampleEdgeFringe(
      outputPixels,
      distances,
      width,
      height,
      options.tolerance + Math.max(8, options.softness || 0),
    )
    if (alphaCutoff > 0) {
      for (let i = 0; i < pixelCount; i++) {
        if (outputPixels[i * 4 + 3] < alphaCutoff) {
          outputPixels[i * 4 + 3] = 0
        }
      }
    }
  }

  const outputCanvas = createCanvas(width, height)
  const maskCanvas = createCanvas(width, height)
  const outputContext = outputCanvas.getContext('2d')
  const maskContext = maskCanvas.getContext('2d')
  if (!outputContext || !maskContext) {
    throw new Error('无法创建抠图画布。')
  }

  const outputImageData = outputContext.createImageData(width, height)
  const maskImageData = maskContext.createImageData(width, height)
  outputImageData.data.set(outputPixels)

  for (let i = 0; i < pixelCount; i++) {
    const a = outputPixels[i * 4 + 3]
    const o = i * 4
    maskImageData.data[o] = a
    maskImageData.data[o + 1] = a
    maskImageData.data[o + 2] = a
    maskImageData.data[o + 3] = 255
  }

  outputContext.putImageData(outputImageData, 0, 0)
  maskContext.putImageData(maskImageData, 0, 0)

  return {
    image: outputCanvas,
    mask: maskCanvas,
  }
}

/**
 * 对整张图应用色键，返回结果画布与蒙版画布
 * （完整流程 = 基础抠图 + 后处理；预览层会拆开调用以便实时调边缘收缩）
 */
export function applyColorKey(source, options) {
  const base = computeKeyedBase(source, options)
  return finalizeKeyedFromBase(base, options)
}

/**
 * 用于判断「基础抠图」参数是否变化（变化才需要重算昂贵的连通抠像）
 */
export function getKeyedBaseFingerprint(options) {
  if (!options) return ''
  const samples = normalizeSampleRgbs(options)
    .map((s) => `${s.r},${s.g},${s.b}`)
    .join('|')
  return [
    samples,
    options.tolerance,
    options.softness,
    options.smoothing ? 1 : 0,
    options.algorithm || 'enhanced',
    options.protectInterior !== false ? 1 : 0,
    options.enclosedMin,
    options.despillEnabled ? 1 : 0,
    options.despill,
    options.edgeRadius,
    options.defringeEnabled ? 1 : 0,
  ].join(';')
}
