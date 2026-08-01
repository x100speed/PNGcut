import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import { processCanvas, downloadAllImages } from './utils/imageProcessor'
import { applyColorKey, sampleCanvasColor } from './utils/chromaKey'
import {
  buildFinalKeyedCanvas,
  compositeKeyedWithRestore,
  drawEffectiveAlphaMask,
} from './utils/compositeRestore'
import { useLanguage } from './contexts/LanguageContext'
import LanguageSwitcher from './components/LanguageSwitcher'

/**
 * 保证与源图同尺寸的「保护蒙版」画布（未涂抹处为透明黑，涂抹处为亮部）
 */
function ensureRestoreMaskCanvas(sourceCanvas, maskRef) {
  let rm = maskRef.current
  if (!rm || rm.width !== sourceCanvas.width || rm.height !== sourceCanvas.height) {
    rm = document.createElement('canvas')
    rm.width = sourceCanvas.width
    rm.height = sourceCanvas.height
    maskRef.current = rm
  }
}

function clearRestoreMask(maskRef) {
  const rm = maskRef.current
  if (!rm) return
  rm.getContext('2d').clearRect(0, 0, rm.width, rm.height)
}

/** 预览画布坐标 → 图像像素坐标 */
function getCanvasPixelPoint(event, canvas, sourceW, sourceH) {
  const rect = canvas.getBoundingClientRect()
  const x = Math.round((event.clientX - rect.left) * (sourceW / rect.width))
  const y = Math.round((event.clientY - rect.top) * (sourceH / rect.height))
  return {
    x: Math.max(0, Math.min(sourceW - 1, x)),
    y: Math.max(0, Math.min(sourceH - 1, y)),
  }
}

/** 在保护蒙版上画一笔（圆形、边缘渐弱，叠加模式便于多次涂抹） */
function paintRestoreBrush(maskCanvas, cx, cy, radiusPx) {
  const ctx = maskCanvas.getContext('2d')
  if (!ctx || radiusPx <= 0) return

  ctx.save()
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusPx)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.globalCompositeOperation = 'lighter'
  ctx.beginPath()
  ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** 两点间插值补笔，避免快速拖动出现断点 */
function paintRestoreStroke(maskCanvas, x0, y0, x1, y1, radiusPx) {
  const dx = x1 - x0
  const dy = y1 - y0
  const dist = Math.hypot(dx, dy)
  const step = Math.max(1, radiusPx * 0.35)
  const n = Math.max(1, Math.ceil(dist / step))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    paintRestoreBrush(maskCanvas, Math.round(x0 + dx * t), Math.round(y0 + dy * t), radiusPx)
  }
}

/**
 * 主应用：PNG 可选色键抠图 → 按连通区域切分为多个最小外接矩形 PNG
 */
function App() {
  const { t } = useLanguage()

  const sourceCanvasRef = useRef(null)
  const sampleCanvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  /** 抠图原始结果缓存（参数变化时重算） */
  const keyedImageCacheRef = useRef(null)
  /** 用户在预览上涂抹：要恢复为原图的区域 */
  const restoreMaskCanvasRef = useRef(null)
  const brushLastPointRef = useRef(null)

  const [originalImageUrl, setOriginalImageUrl] = useState(null)
  const [imageRevision, setImageRevision] = useState(0)
  const [cutImages, setCutImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [chromaEnabled, setChromaEnabled] = useState(false)
  /** 多个背景样本色：点击取色会追加；可单独删除 */
  const [colorSamples, setColorSamples] = useState([])

  const [tolerance, setTolerance] = useState(4)
  const [softness, setSoftness] = useState(14)
  const [smoothing, setSmoothing] = useState(true)
  const [despillEnabled, setDespillEnabled] = useState(true)
  const [despill, setDespill] = useState(50)
  const [edgeRadius, setEdgeRadius] = useState(22)
  const [sampleRadius, setSampleRadius] = useState(6)

  /** 彻底去白边：去污色 + 弱透明剔除 + 边缘收缩（参考 character-sprite-splitter） */
  const [defringeEnabled, setDefringeEnabled] = useState(true)
  /** 边缘收缩像素数：不透明区域向内腐蚀，掐掉细白轮廓 */
  const [erodePx, setErodePx] = useState(1)
  /** 弱透明剔除阈值：alpha 低于此值直接变全透明，去掉羽化残影 */
  const [alphaCutoff, setAlphaCutoff] = useState(28)
  /**
   * 保护角色内部：只抠与画面边缘连通的背景，避免白衣等内部同色被抠成透明
   */
  const [protectInterior, setProtectInterior] = useState(true)
  /**
   * 封闭区域扣除阈值（像素面积）：内部镂空够大才抠；过小则保留，防止误伤
   */
  const [enclosedMin, setEnclosedMin] = useState(200)

  const [previewMode, setPreviewMode] = useState('result')
  /** 放大查看抠图预览（弹层） */
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false)
  /** 放大层里显示的图片 data URL（打开时从预览画布截取） */
  const [previewZoomUrl, setPreviewZoomUrl] = useState('')

  /** 保护画笔：仅在「抠图结果」预览上涂抹，恢复与背景同色被误抠的区域 */
  const [brushToolActive, setBrushToolActive] = useState(false)
  /** 圆形画笔直径（像素，相对原图分辨率） */
  const [brushDiameter, setBrushDiameter] = useState(28)

  const buildColorKeyOptions = useCallback(() => {
    if (!colorSamples.length) return null
    return {
      // 多色抠图：像素只要接近任一样本色就会被抠掉
      samples: colorSamples,
      tolerance,
      softness,
      despill,
      sampleRadius,
      edgeRadius,
      smoothing,
      despillEnabled,
      defringeEnabled,
      erodePx,
      alphaCutoff,
      protectInterior,
      enclosedMin,
      algorithm: 'enhanced',
    }
  }, [
    colorSamples,
    tolerance,
    softness,
    despill,
    sampleRadius,
    edgeRadius,
    smoothing,
    despillEnabled,
    defringeEnabled,
    erodePx,
    alphaCutoff,
    protectInterior,
    enclosedMin,
  ])

  /** 重绘右侧预览（抠图结果模式下套用保护蒙版） */
  const redrawPreviewFromCache = useCallback(() => {
    const src = sourceCanvasRef.current
    const previewEl = previewCanvasRef.current
    const keyed = keyedImageCacheRef.current
    const rm = restoreMaskCanvasRef.current
    if (!src || !previewEl || !originalImageUrl) return

    const opts = buildColorKeyOptions()
    if (!chromaEnabled || !opts) {
      return
    }

    try {
      if (previewMode === 'mask' && keyed && rm) {
        drawEffectiveAlphaMask(src, keyed, rm, previewEl)
        return
      }

      if (previewMode === 'result' && keyed && rm) {
        compositeKeyedWithRestore(src, keyed, rm, previewEl)
      }
    } catch (err) {
      console.error(err)
    }
  }, [buildColorKeyOptions, chromaEnabled, originalImageUrl, previewMode])

  /** 是否正在把文件拖到上传框上方（用于高亮提示） */
  const [dragOver, setDragOver] = useState(false)

  /**
   * 加载一张 PNG：供「点选文件」和「拖拽放入」共用
   * @param {File} file
   */
  const loadPngFile = (file) => {
    if (!file) return

    // 有些系统拖入时 type 可能为空，再看扩展名
    const isPng =
      (file.type && file.type.toLowerCase().includes('png')) ||
      /\.png$/i.test(file.name || '')
    if (!isPng) {
      setError(t.errorInvalidFormat)
      return
    }

    setError('')
    setLoading(true)
    setCutImages([])
    setOriginalImageUrl(null)
    setColorSamples([])
    setPreviewZoomOpen(false)
    setPreviewZoomUrl('')
    sourceCanvasRef.current = null
    restoreMaskCanvasRef.current = null
    keyedImageCacheRef.current = null
    brushLastPointRef.current = null

    const img = new Image()
    const reader = new FileReader()

    reader.onload = (event) => {
      const dataUrl = event.target.result
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          sourceCanvasRef.current = canvas
          setOriginalImageUrl(dataUrl)
          setImageRevision((n) => n + 1)
        } catch (err) {
          setError(t.errorProcessFailed + (err.message || String(err)))
          console.error(err)
        } finally {
          setLoading(false)
        }
      }

      img.onerror = () => {
        setError(t.errorLoadFailed)
        setLoading(false)
      }

      img.src = dataUrl
    }

    reader.onerror = () => {
      setError(t.errorReadFailed)
      setLoading(false)
    }

    reader.readAsDataURL(file)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) loadPngFile(file)
    // 同一文件可再次选择
    e.target.value = ''
  }

  /** 拖入文件到上传框 */
  const handleDropZoneDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setDragOver(true)
  }

  const handleDropZoneDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // 只有真正离开整个 dropzone 时才取消高亮（避免子元素触发 leave）
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false)
    }
  }

  const handleDropZoneDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    if (loading) return
    const file = e.dataTransfer?.files?.[0]
    if (file) loadPngFile(file)
  }

  useLayoutEffect(() => {
    const src = sourceCanvasRef.current
    const sampleEl = sampleCanvasRef.current
    if (!src || !sampleEl || !originalImageUrl) return

    sampleEl.width = src.width
    sampleEl.height = src.height
    const ctx = sampleEl.getContext('2d')
    ctx.drawImage(src, 0, 0)

    // 在取色预览上标出每一个已选背景色的位置
    if (colorSamples.length) {
      const lineW = Math.max(2, src.width / 220)
      const ringR = Math.max(10, src.width / 50)
      const dotR = Math.max(3, src.width / 130)
      colorSamples.forEach((sample, idx) => {
        ctx.save()
        ctx.strokeStyle = '#ff8f1f'
        ctx.lineWidth = lineW
        ctx.beginPath()
        ctx.arc(sample.x, sample.y, ringR, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = '#ff8f1f'
        ctx.beginPath()
        ctx.arc(sample.x, sample.y, dotR, 0, Math.PI * 2)
        ctx.fill()
        // 序号方便对照下方色块列表
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.font = `bold ${Math.max(12, Math.round(src.width / 40))}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = String(idx + 1)
        ctx.strokeText(label, sample.x, sample.y - ringR - 8)
        ctx.fillText(label, sample.x, sample.y - ringR - 8)
        ctx.restore()
      })
    }
  }, [originalImageUrl, imageRevision, colorSamples])

  useLayoutEffect(() => {
    const src = sourceCanvasRef.current
    const previewEl = previewCanvasRef.current
    if (!src || !previewEl || !originalImageUrl) return

    const ctx = previewEl.getContext('2d')
    const opts = buildColorKeyOptions()

    if (!chromaEnabled || !opts) {
      keyedImageCacheRef.current = null
      previewEl.width = src.width
      previewEl.height = src.height
      ctx.drawImage(src, 0, 0)
      return
    }

    try {
      const { image } = applyColorKey(src, opts)
      keyedImageCacheRef.current = image

      ensureRestoreMaskCanvas(src, restoreMaskCanvasRef)

      if (previewMode === 'mask') {
        drawEffectiveAlphaMask(src, image, restoreMaskCanvasRef.current, previewEl)
      } else {
        compositeKeyedWithRestore(src, image, restoreMaskCanvasRef.current, previewEl)
      }
    } catch (err) {
      console.error(err)
    }
  }, [
    originalImageUrl,
    imageRevision,
    chromaEnabled,
    colorSamples,
    previewMode,
    tolerance,
    softness,
    smoothing,
    despillEnabled,
    despill,
    edgeRadius,
    defringeEnabled,
    erodePx,
    alphaCutoff,
    protectInterior,
    enclosedMin,
    buildColorKeyOptions,
  ])

  // 放大层打开时，随预览画布刷新同步大图
  useLayoutEffect(() => {
    if (!previewZoomOpen) return
    const previewEl = previewCanvasRef.current
    if (previewEl && previewEl.width > 0) {
      setPreviewZoomUrl(previewEl.toDataURL('image/png'))
    }
  }, [
    previewZoomOpen,
    originalImageUrl,
    imageRevision,
    chromaEnabled,
    colorSamples,
    previewMode,
    tolerance,
    softness,
    smoothing,
    despillEnabled,
    despill,
    edgeRadius,
    defringeEnabled,
    erodePx,
    alphaCutoff,
    protectInterior,
    enclosedMin,
  ])

  // Esc 关闭放大预览
  useEffect(() => {
    if (!previewZoomOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPreviewZoomOpen(false)
        setPreviewZoomUrl('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewZoomOpen])

  /**
   * 点击取色：追加一个背景样本色（多色抠图）
   * 若与已有样本色过于接近（色距很小），则更新该样本的位置，避免重复堆积
   */
  const handleSamplePointerDown = (event) => {
    if (!chromaEnabled || !sourceCanvasRef.current || !sampleCanvasRef.current) return

    const canvas = sampleCanvasRef.current
    const src = sourceCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = Math.round((event.clientX - rect.left) * (src.width / rect.width))
    const y = Math.round((event.clientY - rect.top) * (src.height / rect.height))

    try {
      clearRestoreMask(restoreMaskCanvasRef)
      const sample = sampleCanvasColor(src, x, y, sampleRadius)
      setColorSamples((prev) => {
        const DUP_DIST = 6
        const nearIdx = prev.findIndex((s) => {
          const dr = s.rgb.r - sample.rgb.r
          const dg = s.rgb.g - sample.rgb.g
          const db = s.rgb.b - sample.rgb.b
          return Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3) <= DUP_DIST
        })
        if (nearIdx >= 0) {
          const next = [...prev]
          next[nearIdx] = sample
          return next
        }
        return [...prev, sample]
      })
      setError('')
    } catch (err) {
      console.error(err)
    }
  }

  /** 删除某一个背景样本色 */
  const handleRemoveSample = (index) => {
    clearRestoreMask(restoreMaskCanvasRef)
    setColorSamples((prev) => prev.filter((_, i) => i !== index))
  }

  /** 清空全部背景样本色 */
  const handleClearSamples = () => {
    clearRestoreMask(restoreMaskCanvasRef)
    setColorSamples([])
  }

  /** 画笔是否允许开启（不依赖 ref，避免取色后同一帧 ref 尚未写入） */
  const brushCanPaint =
    chromaEnabled && colorSamples.length > 0 && previewMode === 'result'

  const handlePreviewBrushDown = (event) => {
    if (!brushToolActive || !brushCanPaint) return
    const canvas = previewCanvasRef.current
    const src = sourceCanvasRef.current
    const rm = restoreMaskCanvasRef.current
    const keyed = keyedImageCacheRef.current
    if (!canvas || !src || !rm || !keyed) return

    event.preventDefault()
    canvas.setPointerCapture(event.pointerId)

    const { x, y } = getCanvasPixelPoint(event, canvas, src.width, src.height)
    const r = Math.max(1, brushDiameter / 2)
    paintRestoreBrush(rm, x, y, r)
    brushLastPointRef.current = { x, y }
    redrawPreviewFromCache()
  }

  const handlePreviewBrushMove = (event) => {
    if (!brushToolActive || !brushCanPaint || !event.buttons || !brushLastPointRef.current) return
    const canvas = previewCanvasRef.current
    const src = sourceCanvasRef.current
    const rm = restoreMaskCanvasRef.current
    const keyed = keyedImageCacheRef.current
    if (!canvas || !src || !rm || !keyed) return

    event.preventDefault()
    const { x, y } = getCanvasPixelPoint(event, canvas, src.width, src.height)
    const prev = brushLastPointRef.current
    const r = Math.max(1, brushDiameter / 2)
    paintRestoreStroke(rm, prev.x, prev.y, x, y, r)
    brushLastPointRef.current = { x, y }
    redrawPreviewFromCache()
  }

  const handlePreviewBrushUp = (event) => {
    if (!brushToolActive) return
    const canvas = previewCanvasRef.current
    if (canvas && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    brushLastPointRef.current = null
  }

  const handleRunSplit = async () => {
    const src = sourceCanvasRef.current
    if (!src) {
      return
    }

    if (chromaEnabled && colorSamples.length === 0) {
      setError(t.errorPickColor)
      return
    }

    setError('')
    setLoading(true)
    setCutImages([])

    try {
      let canvasToSplit = src
      if (chromaEnabled && colorSamples.length > 0) {
        const opts = buildColorKeyOptions()
        if (opts) {
          const { image: keyed } = applyColorKey(src, opts)
          ensureRestoreMaskCanvas(src, restoreMaskCanvasRef)
          canvasToSplit = buildFinalKeyedCanvas(src, keyed, restoreMaskCanvasRef.current)
        }
      }

      const result = await processCanvas(canvasToSplit)

      if (result.length === 0) {
        setError(t.errorNoComponents)
      } else {
        setCutImages(result)
      }
    } catch (processErr) {
      setError(t.errorProcessFailed + (processErr.message || String(processErr)))
      console.error(processErr)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAll = () => {
    if (cutImages.length === 0) {
      setError(t.errorNoImages)
      return
    }
    downloadAllImages(cutImages)
  }

  const handleDownloadSingle = (imageData, index) => {
    const link = document.createElement('a')
    link.download = `cut_image_${index + 1}.png`
    link.href = imageData.dataUrl
    link.click()
  }

  /**
   * 下载整张抠图结果（不切分）
   * - 已开抠图：导出含保护画笔修补后的透明底 PNG
   * - 未开抠图：导出当前原图
   */
  const handleDownloadKeyedImage = () => {
    const src = sourceCanvasRef.current
    if (!src) return

    try {
      let out = src
      if (chromaEnabled) {
        if (!colorSamples.length) {
          setError(t.errorPickColor)
          return
        }
        const opts = buildColorKeyOptions()
        if (!opts) {
          setError(t.errorPickColor)
          return
        }
        const { image: keyed } = applyColorKey(src, opts)
        ensureRestoreMaskCanvas(src, restoreMaskCanvasRef)
        out = buildFinalKeyedCanvas(src, keyed, restoreMaskCanvasRef.current)
      }

      const link = document.createElement('a')
      link.download = chromaEnabled ? 'keyed_image.png' : 'original_image.png'
      link.href = out.toDataURL('image/png')
      link.click()
      setError('')
    } catch (err) {
      setError(t.errorProcessFailed + (err.message || String(err)))
      console.error(err)
    }
  }

  /** 打开放大预览：把当前预览画布截成图放进弹层 */
  const handleOpenPreviewZoom = () => {
    const previewEl = previewCanvasRef.current
    if (!previewEl) return
    setPreviewZoomUrl(previewEl.toDataURL('image/png'))
    setPreviewZoomOpen(true)
  }

  const handleClosePreviewZoom = () => {
    setPreviewZoomOpen(false)
    setPreviewZoomUrl('')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-wrapper">
          <div className="header-text">
            <h1>{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
          <div className="header-language">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="upload-section">
          {/* 拖入 / 点击选择 PNG */}
          <div
            className={`upload-dropzone ${dragOver ? 'is-dragover' : ''} ${loading ? 'is-disabled' : ''}`}
            onDragEnter={handleDropZoneDragOver}
            onDragOver={handleDropZoneDragOver}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={handleDropZoneDrop}
            onClick={() => {
              if (!loading) document.getElementById('file-upload')?.click()
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!loading) document.getElementById('file-upload')?.click()
              }
            }}
            aria-label={t.dropzoneAria}
          >
            <div className="upload-dropzone__icon" aria-hidden="true">
              PNG
            </div>
            <p className="upload-dropzone__title">
              {loading ? t.processing : t.dropzoneTitle}
            </p>
            <p className="upload-dropzone__hint">{t.dropzoneHint}</p>
            <span className="upload-dropzone__btn">
              {loading ? t.processing : t.selectImage}
            </span>
          </div>
          <input
            id="file-upload"
            type="file"
            accept="image/png"
            onChange={handleFileUpload}
            disabled={loading}
            style={{ display: 'none' }}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {originalImageUrl && (
          <>
            <section className="chroma-section">
              <h2 className="chroma-section__title">{t.chromaSectionTitle}</h2>
              <p className="chroma-section__note">{t.chromaOptionalNote}</p>

              <label className="chroma-toggle">
                <input
                  type="checkbox"
                  checked={chromaEnabled}
                  onChange={(e) => {
                    setChromaEnabled(e.target.checked)
                    if (!e.target.checked) {
                      setColorSamples([])
                      setBrushToolActive(false)
                    }
                  }}
                />
                <span>{t.chromaEnable}</span>
              </label>

              <div className="chroma-panels">
                <div className="chroma-panel">
                  <h3 className="chroma-panel__head">{t.pickColorTitle}</h3>
                  <p className="chroma-panel__hint">
                    {chromaEnabled ? t.pickColorHint : t.pickColorDisabled}
                  </p>
                  <div className="chroma-canvas-wrap">
                    <canvas
                      ref={sampleCanvasRef}
                      className={`chroma-canvas ${chromaEnabled ? 'chroma-canvas--interactive' : ''}`}
                      onPointerDown={handleSamplePointerDown}
                    />
                  </div>
                  {/* 多样本色列表：色块 + 色值 + 删除 */}
                  {chromaEnabled && colorSamples.length > 0 && (
                    <div className="chroma-sample-list">
                      <div className="chroma-sample-list__head">
                        <span>
                          {t.colorPicked}（{colorSamples.length}）
                        </span>
                        <button
                          type="button"
                          className="chroma-sample-clear"
                          onClick={handleClearSamples}
                        >
                          {t.clearAllSamples}
                        </button>
                      </div>
                      <ul className="chroma-sample-swatches">
                        {colorSamples.map((sample, index) => (
                          <li key={`${sample.hex}-${sample.x}-${sample.y}-${index}`} className="chroma-sample-swatch">
                            <span className="chroma-sample-swatch__ord">{index + 1}</span>
                            <span
                              className="chroma-sample-swatch__color"
                              style={{ background: sample.hex }}
                              title={sample.hex}
                            />
                            <span className="chroma-sample-swatch__meta">
                              {sample.hex}
                              <br />
                              RGB {sample.rgb.r},{sample.rgb.g},{sample.rgb.b}
                            </span>
                            <button
                              type="button"
                              className="chroma-sample-swatch__remove"
                              onClick={() => handleRemoveSample(index)}
                              aria-label={t.removeSample}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="chroma-panel">
                  <h3 className="chroma-panel__head">{t.previewTitle}</h3>
                  <div className="chroma-preview-toolbar">
                    <button
                      type="button"
                      className={previewMode === 'result' ? 'is-active' : ''}
                      onClick={() => setPreviewMode('result')}
                    >
                      {t.previewResult}
                    </button>
                    <button
                      type="button"
                      className={previewMode === 'mask' ? 'is-active' : ''}
                      onClick={() => {
                        setPreviewMode('mask')
                        setBrushToolActive(false)
                      }}
                    >
                      {t.previewMask}
                    </button>
                    {/* 只抠图、不切分时：直接下载整张结果 */}
                    <button
                      type="button"
                      className="chroma-preview-toolbar__action"
                      onClick={handleDownloadKeyedImage}
                      disabled={chromaEnabled && colorSamples.length === 0}
                      title={t.downloadKeyedHint}
                    >
                      {t.downloadKeyedImage}
                    </button>
                    <button
                      type="button"
                      className="chroma-preview-toolbar__action"
                      onClick={handleOpenPreviewZoom}
                      title={t.enlargePreviewHint}
                    >
                      {t.enlargePreview}
                    </button>
                  </div>

                  <div className="chroma-brush-bar">
                    <label className="chroma-brush-toggle">
                      <input
                        type="checkbox"
                        checked={brushToolActive}
                        disabled={!brushCanPaint}
                        onChange={(e) => setBrushToolActive(e.target.checked)}
                      />
                      <span>{t.brushProtect}</span>
                    </label>
                    <label className="chroma-brush-size">
                      <span>
                        {t.brushDiameter}: {brushDiameter}px
                      </span>
                      <input
                        type="range"
                        min={6}
                        max={120}
                        value={brushDiameter}
                        onChange={(e) => setBrushDiameter(Number(e.target.value))}
                        disabled={!brushToolActive}
                      />
                    </label>
                    <button
                      type="button"
                      className="chroma-brush-clear"
                      disabled={!brushCanPaint}
                      onClick={() => {
                        clearRestoreMask(restoreMaskCanvasRef)
                        redrawPreviewFromCache()
                      }}
                    >
                      {t.brushClear}
                    </button>
                  </div>
                  <p className="chroma-brush-hint">{t.brushHint}</p>

                  <div className="chroma-canvas-wrap chroma-canvas-wrap--checker chroma-canvas-wrap--preview">
                    <canvas
                      ref={previewCanvasRef}
                      className={`chroma-canvas ${brushToolActive && brushCanPaint ? 'chroma-canvas--brush' : ''}`}
                      onPointerDown={handlePreviewBrushDown}
                      onPointerMove={handlePreviewBrushMove}
                      onPointerUp={handlePreviewBrushUp}
                      onPointerCancel={handlePreviewBrushUp}
                      onDoubleClick={handleOpenPreviewZoom}
                    />
                  </div>
                </div>
              </div>

              {/* 放大预览弹层：棋盘格底 + 大图，Esc / 点遮罩关闭 */}
              {previewZoomOpen && (
                <div
                  className="preview-zoom"
                  role="dialog"
                  aria-modal="true"
                  aria-label={t.enlargePreview}
                  onClick={handleClosePreviewZoom}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleClosePreviewZoom()
                  }}
                >
                  <div
                    className="preview-zoom__panel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="preview-zoom__bar">
                      <span className="preview-zoom__title">{t.enlargePreview}</span>
                      <div className="preview-zoom__actions">
                        <button
                          type="button"
                          className="preview-zoom__btn"
                          onClick={handleDownloadKeyedImage}
                          disabled={chromaEnabled && colorSamples.length === 0}
                        >
                          {t.downloadKeyedImage}
                        </button>
                        <button
                          type="button"
                          className="preview-zoom__btn preview-zoom__btn--close"
                          onClick={handleClosePreviewZoom}
                        >
                          {t.closePreviewZoom}
                        </button>
                      </div>
                    </div>
                    <div
                      className={`preview-zoom__stage ${
                        previewMode === 'result' ? 'preview-zoom__stage--checker' : ''
                      }`}
                    >
                      {previewZoomUrl ? (
                        <img src={previewZoomUrl} alt={t.previewTitle} className="preview-zoom__img" />
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div className="chroma-advanced">
                <h3 className="chroma-advanced__title">{t.advancedTitle}</h3>
                <p className="chroma-advanced__intro">{t.advancedIntro}</p>

                <div className="chroma-advanced__groups">
                  {/* 1. 取色与颜色匹配 */}
                  <div className="chroma-advanced__group">
                    <h4 className="chroma-advanced__group-title">{t.advancedGroupMatch}</h4>
                    <div className="chroma-advanced__group-fields">
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-sample-radius">
                          {t.sampleRadius}: {sampleRadius}px
                        </label>
                        <p className="chroma-param__desc">{t.sampleRadiusDesc}</p>
                        <input
                          id="adv-sample-radius"
                          type="range"
                          min={0}
                          max={24}
                          value={sampleRadius}
                          onChange={(e) => setSampleRadius(Number(e.target.value))}
                        />
                      </div>
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-tolerance">
                          {t.tolerance}: {tolerance}
                        </label>
                        <p className="chroma-param__desc">{t.toleranceDesc}</p>
                        <input
                          id="adv-tolerance"
                          type="range"
                          min={0}
                          max={120}
                          value={tolerance}
                          onChange={(e) => setTolerance(Number(e.target.value))}
                        />
                      </div>
                      {/* 连通抠像：避免内部同色被抠成透明 */}
                      <div className="chroma-param chroma-param--checkbox">
                        <label className="chroma-param__row">
                          <input
                            type="checkbox"
                            checked={protectInterior}
                            onChange={(e) => setProtectInterior(e.target.checked)}
                          />
                          <span className="chroma-param__label-text">{t.protectInterior}</span>
                        </label>
                        <p className="chroma-param__desc">{t.protectInteriorDesc}</p>
                      </div>
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-enclosed-min">
                          {t.enclosedMin}: {enclosedMin}
                        </label>
                        <p className="chroma-param__desc">{t.enclosedMinDesc}</p>
                        <input
                          id="adv-enclosed-min"
                          type="range"
                          min={0}
                          max={5000}
                          step={10}
                          value={enclosedMin}
                          onChange={(e) => setEnclosedMin(Number(e.target.value))}
                          disabled={!protectInterior}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. 边缘与透明度过渡 */}
                  <div className="chroma-advanced__group">
                    <h4 className="chroma-advanced__group-title">{t.advancedGroupEdge}</h4>
                    <div className="chroma-advanced__group-fields">
                      <div className="chroma-param chroma-param--checkbox">
                        <label className="chroma-param__row">
                          <input
                            type="checkbox"
                            checked={smoothing}
                            onChange={(e) => setSmoothing(e.target.checked)}
                          />
                          <span className="chroma-param__label-text">{t.edgeSmooth}</span>
                        </label>
                        <p className="chroma-param__desc">{t.edgeSmoothDesc}</p>
                      </div>
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-softness">
                          {t.softness}: {softness}px
                        </label>
                        <p className="chroma-param__desc">{t.softnessDesc}</p>
                        <input
                          id="adv-softness"
                          type="range"
                          min={0}
                          max={64}
                          value={softness}
                          onChange={(e) => setSoftness(Number(e.target.value))}
                          disabled={!smoothing}
                        />
                      </div>
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-edge-radius">
                          {t.edgeRadius}: {edgeRadius}px
                        </label>
                        <p className="chroma-param__desc">{t.edgeRadiusDesc}</p>
                        <input
                          id="adv-edge-radius"
                          type="range"
                          min={0}
                          max={80}
                          value={edgeRadius}
                          onChange={(e) => setEdgeRadius(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. 去溢色 */}
                  <div className="chroma-advanced__group">
                    <h4 className="chroma-advanced__group-title">{t.advancedGroupSpill}</h4>
                    <div className="chroma-advanced__group-fields">
                      <div className="chroma-param chroma-param--checkbox">
                        <label className="chroma-param__row">
                          <input
                            type="checkbox"
                            checked={despillEnabled}
                            onChange={(e) => setDespillEnabled(e.target.checked)}
                          />
                          <span className="chroma-param__label-text">{t.despill}</span>
                        </label>
                        <p className="chroma-param__desc">{t.despillDesc}</p>
                      </div>
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-despill">
                          {t.despillStrength}: {despill}
                        </label>
                        <p className="chroma-param__desc">{t.despillStrengthDesc}</p>
                        <input
                          id="adv-despill"
                          type="range"
                          min={0}
                          max={100}
                          value={despill}
                          onChange={(e) => setDespill(Number(e.target.value))}
                          disabled={!despillEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. 去白边：弱透明剔除 + 边缘收缩 */}
                  <div className="chroma-advanced__group">
                    <h4 className="chroma-advanced__group-title">{t.advancedGroupDefringe}</h4>
                    <div className="chroma-advanced__group-fields">
                      <div className="chroma-param chroma-param--checkbox">
                        <label className="chroma-param__row">
                          <input
                            type="checkbox"
                            checked={defringeEnabled}
                            onChange={(e) => setDefringeEnabled(e.target.checked)}
                          />
                          <span className="chroma-param__label-text">{t.defringe}</span>
                        </label>
                        <p className="chroma-param__desc">{t.defringeDesc}</p>
                      </div>
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-erode">
                          {t.erodePx}: {erodePx}px
                        </label>
                        <p className="chroma-param__desc">{t.erodePxDesc}</p>
                        <input
                          id="adv-erode"
                          type="range"
                          min={0}
                          max={3}
                          value={erodePx}
                          onChange={(e) => setErodePx(Number(e.target.value))}
                          disabled={!defringeEnabled}
                        />
                      </div>
                      <div className="chroma-param">
                        <label className="chroma-param__label" htmlFor="adv-alpha-cutoff">
                          {t.alphaCutoff}: {alphaCutoff}
                        </label>
                        <p className="chroma-param__desc">{t.alphaCutoffDesc}</p>
                        <input
                          id="adv-alpha-cutoff"
                          type="range"
                          min={0}
                          max={80}
                          value={alphaCutoff}
                          onChange={(e) => setAlphaCutoff(Number(e.target.value))}
                          disabled={!defringeEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="split-actions">
                <button type="button" className="split-button" onClick={handleRunSplit} disabled={loading}>
                  {cutImages.length > 0 ? t.runSplitAgain : t.runSplit}
                </button>
              </div>
            </section>
          </>
        )}

        {cutImages.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>
                {t.resultsTitle} - {t.identifiedComponents} {cutImages.length} {t.components}
              </h2>
              <button type="button" onClick={handleDownloadAll} className="download-all-button">
                {t.downloadAll} ({cutImages.length})
              </button>
            </div>
            <p className="results-description">{t.resultsDescription}</p>
            <div className="images-grid">
              {cutImages.map((imageData, index) => (
                <div key={index} className="image-card">
                  <div className="image-card-header">
                    <span className="image-number">
                      {t.component} #{index + 1}
                    </span>
                  </div>
                  <div className="image-wrapper">
                    <img
                      src={imageData.dataUrl}
                      alt={`${t.component} ${index + 1}`}
                      className="cut-image"
                    />
                  </div>
                  <div className="image-info">
                    <p>
                      <strong>{t.size}:</strong> {imageData.width} × {imageData.height} {t.pixels}
                    </p>
                    <p>
                      <strong>{t.position}:</strong> ({imageData.x}, {imageData.y})
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(imageData, index)}
                      className="download-button"
                    >
                      {t.downloadComponent}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>{t.processingImage}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
