/**
 * 图片处理工具函数
 * 用于检测PNG图片的Alpha通道并切分成多个矩形区域
 * 每个独立的UI组件会被识别并切分成独立的图片
 */

/**
 * 检测图片中的非透明像素
 * 使用二维数组存储，便于后续连通区域检测
 * @param {ImageData} imageData - 图片的像素数据
 * @returns {Array<Array<boolean>>} 二维布尔数组，true表示该像素非透明
 */
function createNonTransparentMap(imageData) {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  
  // 创建二维数组，标记非透明像素
  const map = Array(height)
    .fill()
    .map(() => Array(width).fill(false))

  // 遍历所有像素，标记非透明像素
  // Alpha值大于阈值（例如10）的像素被认为是非透明的
  // 这样可以过滤掉一些半透明的噪点
  const alphaThreshold = 10
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const alpha = data[index + 3] // Alpha通道在第4个位置（索引3）

      // 如果Alpha值大于阈值，标记为非透明
      if (alpha > alphaThreshold) {
        map[y][x] = true
      }
    }
  }

  return map
}

/**
 * 使用连通区域检测算法，找到所有独立的UI组件
 * 每个连通区域代表一个独立的UI组件
 * @param {Array<Array<boolean>>} nonTransparentMap - 非透明像素的二维数组
 * @param {number} imageWidth - 图片宽度
 * @param {number} imageHeight - 图片高度
 * @returns {Array} 矩形区域数组，每个区域包含 {x, y, width, height}
 */
function findConnectedRegions(nonTransparentMap, imageWidth, imageHeight) {
  const rectangles = []
  
  // 创建访问标记数组
  const visited = Array(imageHeight)
    .fill()
    .map(() => Array(imageWidth).fill(false))

  /**
   * 使用深度优先搜索（DFS）找到单个连通区域
   * 连通区域是指上下左右相邻的非透明像素组成的区域
   * @param {number} startX - 起始X坐标
   * @param {number} startY - 起始Y坐标
   * @returns {Object} 包含该连通区域的边界框 {minX, minY, maxX, maxY, pixelCount}
   */
  const findConnectedRegion = (startX, startY) => {
    const stack = [{ x: startX, y: startY }]
    let minX = startX,
      minY = startY,
      maxX = startX,
      maxY = startY
    let pixelCount = 0

    while (stack.length > 0) {
      const { x, y } = stack.pop()

      // 检查边界
      if (x < 0 || x >= imageWidth || y < 0 || y >= imageHeight) {
        continue
      }

      // 检查是否已访问或不是非透明像素
      if (visited[y][x] || !nonTransparentMap[y][x]) {
        continue
      }

      // 标记为已访问
      visited[y][x] = true
      pixelCount++

      // 更新边界框（找到最小外接矩形）
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)

      // 检查四个方向的相邻像素（上下左右）
      stack.push({ x: x + 1, y }) // 右
      stack.push({ x: x - 1, y }) // 左
      stack.push({ x, y: y + 1 }) // 下
      stack.push({ x, y: y - 1 }) // 上
    }

    return { minX, minY, maxX, maxY, pixelCount }
  }

  // 遍历所有像素，找到所有独立的连通区域
  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      // 如果这个像素是非透明的且未被访问，说明找到了一个新的连通区域
      if (nonTransparentMap[y][x] && !visited[y][x]) {
        const region = findConnectedRegion(x, y)
        
        // 过滤掉太小的区域（可能是噪点，至少需要10个像素）
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
 * 从原始图片中切出矩形区域
 * 只切出指定矩形区域的内容，背景保持透明
 * @param {HTMLImageElement} img - 原始图片对象
 * @param {Object} rect - 矩形区域 {x, y, width, height}
 * @param {ImageData} originalImageData - 原始图片的像素数据（用于精确切分）
 * @returns {string} 切分后图片的DataURL
 */
function cutRectangleFromImage(img, rect, originalImageData) {
  // 创建canvas来绘制切分后的图片
  const canvas = document.createElement('canvas')
  canvas.width = rect.width
  canvas.height = rect.height
  const ctx = canvas.getContext('2d')

  // 先清空canvas（背景透明）
  ctx.clearRect(0, 0, rect.width, rect.height)

  // 创建新的ImageData，只包含矩形区域内的像素
  const newImageData = ctx.createImageData(rect.width, rect.height)
  const originalData = originalImageData.data
  const originalWidth = originalImageData.width

  // 复制矩形区域内的像素数据
  for (let y = 0; y < rect.height; y++) {
    for (let x = 0; x < rect.width; x++) {
      // 原始图片中的坐标
      const origX = rect.x + x
      const origY = rect.y + y
      
      // 原始图片中的像素索引
      const origIndex = (origY * originalWidth + origX) * 4
      
      // 新图片中的像素索引
      const newIndex = (y * rect.width + x) * 4
      
      // 复制RGBA四个通道的值
      newImageData.data[newIndex] = originalData[origIndex]         // R
      newImageData.data[newIndex + 1] = originalData[origIndex + 1] // G
      newImageData.data[newIndex + 2] = originalData[origIndex + 2] // B
      newImageData.data[newIndex + 3] = originalData[origIndex + 3] // A（Alpha通道）
    }
  }

  // 将新的像素数据绘制到canvas上
  ctx.putImageData(newImageData, 0, 0)

  // 返回图片的DataURL（PNG格式，保留Alpha通道）
  return canvas.toDataURL('image/png')
}

/**
 * 处理图片，检测Alpha通道并切分成多个独立的UI组件
 * 每个独立的UI组件会被识别并切分成独立的图片
 * @param {HTMLImageElement} img - 图片对象
 * @returns {Promise<Array>} 切分后的图片数据数组，每个元素包含 {x, y, width, height, dataUrl}
 */
export async function processImage(img) {
  return new Promise((resolve) => {
    // 创建canvas来读取图片像素数据
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')

    // 将图片绘制到canvas上
    ctx.drawImage(img, 0, 0)

    // 获取图片的像素数据（包含RGBA四个通道）
    const imageData = ctx.getImageData(0, 0, img.width, img.height)

    // 创建非透明像素的二维映射表
    const nonTransparentMap = createNonTransparentMap(imageData)

    // 使用连通区域检测算法，找到所有独立的UI组件
    // 每个连通区域代表一个独立的UI组件
    const rectangles = findConnectedRegions(
      nonTransparentMap,
      img.width,
      img.height
    )

    if (rectangles.length === 0) {
      resolve([])
      return
    }

    // 对矩形按位置排序（从上到下，从左到右）
    // 这样切分后的图片顺序更符合视觉习惯
    rectangles.sort((a, b) => {
      // 先按Y坐标排序（从上到下）
      if (Math.abs(a.y - b.y) > 10) {
        return a.y - b.y
      }
      // Y坐标相近时，按X坐标排序（从左到右）
      return a.x - b.x
    })

    // 切分每个矩形区域，生成独立的图片
    const cutImages = rectangles.map((rect) => ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      // 切分时传入原始图片的像素数据，确保精确切分
      dataUrl: cutRectangleFromImage(img, rect, imageData),
    }))

    console.log(`成功识别并切分了 ${cutImages.length} 个独立的UI组件`)
    resolve(cutImages)
  })
}

/**
 * 下载所有切分后的图片
 * @param {Array} images - 图片数据数组
 */
export function downloadAllImages(images) {
  images.forEach((imageData, index) => {
    setTimeout(() => {
      const link = document.createElement('a')
      link.download = `cut_image_${index + 1}.png`
      link.href = imageData.dataUrl
      link.click()
    }, index * 100) // 延迟下载，避免浏览器阻止多个下载
  })
}

