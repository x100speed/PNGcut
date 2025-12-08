import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import './LanguageSwitcher.css'

/**
 * 语言切换组件
 * 显示国旗图标，点击可切换语言
 */
function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, languages } = useLanguage()

  /**
   * 处理语言切换
   * @param {string} langCode - 要切换到的语言代码
   */
  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode)
  }

  // 获取所有可用语言的数组
  const languageList = Object.values(languages)

  /**
   * 从语言代码中提取缩写（如 'zh-CN' -> 'ZH', 'en-US' -> 'EN'）
   * @param {string} langCode - 语言代码
   * @returns {string} 语言缩写
   */
  const getLanguageAbbreviation = (langCode) => {
    // 提取语言代码的前两个字符并转换为大写
    return langCode.split('-')[0].toUpperCase()
  }

  return (
    <div className="language-switcher">
      {languageList.map((lang) => (
        <button
          key={lang.code}
          className={`language-flag ${currentLanguage === lang.code ? 'active' : ''}`}
          onClick={() => handleLanguageChange(lang.code)}
          title={lang.name}
          aria-label={`切换到${lang.name}`}
        >
          <span className="flag-emoji">{lang.flag}</span>
          <span className="language-code">{getLanguageAbbreviation(lang.code)}</span>
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher

