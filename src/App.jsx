import React, { useState } from 'react'
import './App.css'
import { processImage, downloadAllImages } from './utils/imageProcessor'
import { useLanguage } from './contexts/LanguageContext'
import LanguageSwitcher from './components/LanguageSwitcher'

/**
 * 主应用组件
 * 提供PNG图片上传、切分、预览和下载功能
 */
function App() {
  // 使用语言上下文获取翻译函数
  const { t } = useLanguage()
  
  // 存储上传的原始图片
  const [originalImage, setOriginalImage] = useState(null)
  // 存储切分后的图片数组
  const [cutImages, setCutImages] = useState([])
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 错误信息
  const [error, setError] = useState('')

  /**
   * 处理文件上传
   * @param {Event} e - 文件输入事件
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.includes('png')) {
      setError(t.errorInvalidFormat)
      return
    }

    setError('')
    setLoading(true)
    setCutImages([])
    setOriginalImage(null)

    try {
      // 创建图片对象并加载
      const img = new Image()
      const reader = new FileReader()

      reader.onload = async (event) => {
        img.onload = async () => {
          try {
            // 显示原始图片
            setOriginalImage(event.target.result)
            
            // 处理图片，检测Alpha通道并切分
            // 这个过程会识别所有独立的UI组件，每个组件会被切分成独立的图片
            const result = await processImage(img)
            
            if (result.length === 0) {
              setError(t.errorNoComponents)
            } else {
              setCutImages(result)
            }
          } catch (processErr) {
            setError(t.errorProcessFailed + processErr.message)
            console.error('处理错误：', processErr)
          } finally {
            setLoading(false)
          }
        }
        
        img.onerror = () => {
          setError(t.errorLoadFailed)
          setLoading(false)
        }
        
        img.src = event.target.result
      }

      reader.onerror = () => {
        setError(t.errorReadFailed)
        setLoading(false)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      setError(t.errorProcessFailed + err.message)
      setLoading(false)
    }
  }

  /**
   * 下载所有切分后的图片
   */
  const handleDownloadAll = () => {
    if (cutImages.length === 0) {
      setError(t.errorNoImages)
      return
    }
    downloadAllImages(cutImages)
  }

  /**
   * 下载单个图片
   * @param {Object} imageData - 图片数据对象
   * @param {number} index - 图片索引
   */
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
        {/* 文件上传区域 */}
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

        {/* 错误提示 */}
        {error && <div className="error-message">{error}</div>}

        {/* 原始图片预览 */}
        {originalImage && (
          <div className="preview-section">
            <h2>{t.originalImage}</h2>
            <div className="image-container">
              <img src={originalImage} alt={t.originalImage} className="preview-image" />
            </div>
          </div>
        )}

        {/* 切分结果 */}
        {cutImages.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>
                {t.resultsTitle} - {t.identifiedComponents} {cutImages.length} {t.components}
              </h2>
              <button onClick={handleDownloadAll} className="download-all-button">
                {t.downloadAll} ({cutImages.length})
              </button>
            </div>
            <p className="results-description">
              {t.resultsDescription}
            </p>
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

        {/* 加载指示器 */}
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

