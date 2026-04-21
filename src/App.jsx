import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
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
  const [colorSample, setColorSample] = useState(null)

  const [tolerance, setTolerance] = useState(4)
  const [softness, setSoftness] = useState(14)
  const [smoothing, setSmoothing] = useState(true)
  const [despillEnabled, setDespillEnabled] = useState(true)
  const [despill, setDespill] = useState(50)
  const [edgeRadius, setEdgeRadius] = useState(22)
  const [sampleRadius, setSampleRadius] = useState(6)

  const [previewMode, setPreviewMode] = useState('result')

  /** 保护画笔：仅在「抠图结果」预览上涂抹，恢复与背景同色被误抠的区域 */
  const [brushToolActive, setBrushToolActive] = useState(false)
  /** 圆形画笔直径（像素，相对原图分辨率） */
  const [brushDiameter, setBrushDiameter] = useState(28)

  const buildColorKeyOptions = useCallback(() => {
    if (!colorSample) return null
    return {
      sample: colorSample,
      tolerance,
      softness,
      despill,
      sampleRadius,
      edgeRadius,
      smoothing,
      despillEnabled,
      algorithm: 'enhanced',
    }
  }, [
    colorSample,
    tolerance,
    softness,
    despill,
    sampleRadius,
    edgeRadius,
    smoothing,
    despillEnabled,
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.includes('png')) {
      setError(t.errorInvalidFormat)
      return
    }

    setError('')
    setLoading(true)
    setCutImages([])
    setOriginalImageUrl(null)
    setColorSample(null)
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

  useLayoutEffect(() => {
    const src = sourceCanvasRef.current
    const sampleEl = sampleCanvasRef.current
    if (!src || !sampleEl || !originalImageUrl) return

    sampleEl.width = src.width
    sampleEl.height = src.height
    const ctx = sampleEl.getContext('2d')
    ctx.drawImage(src, 0, 0)

    if (colorSample) {
      ctx.save()
      ctx.strokeStyle = '#ff8f1f'
      ctx.lineWidth = Math.max(2, src.width / 220)
      ctx.beginPath()
      ctx.arc(colorSample.x, colorSample.y, Math.max(10, src.width / 50), 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#ff8f1f'
      ctx.beginPath()
      ctx.arc(colorSample.x, colorSample.y, Math.max(3, src.width / 130), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }, [originalImageUrl, imageRevision, colorSample])

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
    colorSample,
    previewMode,
    tolerance,
    softness,
    smoothing,
    despillEnabled,
    despill,
    edgeRadius,
    buildColorKeyOptions,
  ])

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
      setColorSample(sample)
      setError('')
    } catch (err) {
      console.error(err)
    }
  }

  /** 画笔是否允许开启（不依赖 ref，避免取色后同一帧 ref 尚未写入） */
  const brushCanPaint =
    chromaEnabled && colorSample && previewMode === 'result'

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

    if (chromaEnabled && !colorSample) {
      setError(t.errorPickColor)
      return
    }

    setError('')
    setLoading(true)
    setCutImages([])

    try {
      let canvasToSplit = src
      if (chromaEnabled && colorSample) {
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
          <label htmlFor="file-upload" className="upload-button">
            {loading ? t.processing : t.selectImage}
          </label>
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
                      setColorSample(null)
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
                  {colorSample && chromaEnabled && (
                    <p className="chroma-sample-info">
                      {t.colorPicked}: {colorSample.hex} (RGB {colorSample.rgb.r},{colorSample.rgb.g},
                      {colorSample.rgb.b})
                    </p>
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

                  <div className="chroma-canvas-wrap chroma-canvas-wrap--checker">
                    <canvas
                      ref={previewCanvasRef}
                      className={`chroma-canvas ${brushToolActive && brushCanPaint ? 'chroma-canvas--brush' : ''}`}
                      onPointerDown={handlePreviewBrushDown}
                      onPointerMove={handlePreviewBrushMove}
                      onPointerUp={handlePreviewBrushUp}
                      onPointerCancel={handlePreviewBrushUp}
                    />
                  </div>
                </div>
              </div>

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
