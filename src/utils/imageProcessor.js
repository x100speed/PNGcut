/**
 * 图片处理工具函数
 * 检测 PNG / 画布 Alpha，按连通区域切分为最小外接矩形；支持直接传入已抠图的 Canvas。
 */

function createNonTransparentMap(imageData) {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  const map = Array(height)
    .fill()
    .map(() => Array(width).fill(false))

  const alphaThreshold = 10

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const alpha = data[index + 3]

      if (alpha > alphaThreshold) {
        map[y][x] = true
      }
    }
  }

  return map
}

function findConnectedRegions(nonTransparentMap, imageWidth, imageHeight) {
  const rectangles = []

  const visited = Array(imageHeight)
    .fill()
    .map(() => Array(imageWidth).fill(false))

  const findConnectedRegion = (startX, startY) => {
    const stack = [{ x: startX, y: startY }]
    let minX = startX,
      minY = startY,
      maxX = startX,
      maxY = startY
    let pixelCount = 0

    while (stack.length > 0) {
      const { x, y } = stack.pop()

      if (x < 0 || x >= imageWidth || y < 0 || y >= imageHeight) {
        continue
      }

      if (visited[y][x] || !nonTransparentMap[y][x]) {
        continue
      }

      visited[y][x] = true
      pixelCount++

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)

      stack.push({ x: x + 1, y })
      stack.push({ x: x - 1, y })
      stack.push({ x, y: y + 1 })
      stack.push({ x, y: y - 1 })
    }

    return { minX, minY, maxX, maxY, pixelCount }
  }

  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      if (nonTransparentMap[y][x] && !visited[y][x]) {
        const region = findConnectedRegion(x, y)

        const minPixelCount = 10
        if (region.pixelCount >= minPixelCount) {
          rectangles.push({
            x: region.minX,
            y: region.minY,
            width: region.maxX - region.minX + 1,
            height: region.maxY - region.minY + 1,
          })
        }
      }
    }
  }

  return rectangles
}

/**
 * @param {Object} rect - { x, y, width, height }
 * @param {ImageData} originalImageData
 */
function cutRectangleFromImage(rect, originalImageData) {
  const canvas = document.createElement('canvas')
  canvas.width = rect.width
  canvas.height = rect.height
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, rect.width, rect.height)

  const newImageData = ctx.createImageData(rect.width, rect.height)
  const originalData = originalImageData.data
  const originalWidth = originalImageData.width

  for (let y = 0; y < rect.height; y++) {
    for (let x = 0; x < rect.width; x++) {
      const origX = rect.x + x
      const origY = rect.y + y

      const origIndex = (origY * originalWidth + origX) * 4

      const newIndex = (y * rect.width + x) * 4

      newImageData.data[newIndex] = originalData[origIndex]
      newImageData.data[newIndex + 1] = originalData[origIndex + 1]
      newImageData.data[newIndex + 2] = originalData[origIndex + 2]
      newImageData.data[newIndex + 3] = originalData[origIndex + 3]
    }
  }

  ctx.putImageData(newImageData, 0, 0)

  return canvas.toDataURL('image/png')
}

/**
 * 从 ImageData 分析连通区域并切图（同步）
 * @param {ImageData} imageData
 * @returns {Array<{ x, y, width, height, dataUrl }>}
 */
export function processImageData(imageData) {
  const nonTransparentMap = createNonTransparentMap(imageData)

  const rectangles = findConnectedRegions(
    nonTransparentMap,
    imageData.width,
    imageData.height,
  )

  if (rectangles.length === 0) {
    return []
  }

  rectangles.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 10) {
      return a.y - b.y
    }
    return a.x - b.x
  })

  return rectangles.map((rect) => ({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    dataUrl: cutRectangleFromImage(rect, imageData),
  }))
}

/**
 * @param {HTMLImageElement} img
 */
export async function processImage(img) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    resolve(processImageData(imageData))
  })
}

/**
 * 对已绘制好的 Canvas（例如抠图结果）做切分
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Array<{ x, y, width, height, dataUrl }>>}
 */
export async function processCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return []
  }
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return processImageData(imageData)
}

export function downloadAllImages(images) {
  images.forEach((imageData, index) => {
    setTimeout(() => {
      const link = document.createElement('a')
      link.download = `cut_image_${index + 1}.png`
      link.href = imageData.dataUrl
      link.click()
    }, index * 100)
  })
}
