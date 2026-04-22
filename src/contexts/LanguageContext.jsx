import React, { createContext, useContext, useState, useEffect } from 'react'
import zhCN from '../locales/zh-CN'
import enUS from '../locales/en-US'
import jaJP from '../locales/ja-JP'
import frFR from '../locales/fr-FR'
import esES from '../locales/es-ES'
import koKR from '../locales/ko-KR'

/**
 * 支持的语言列表
 * 包含所有可用语言及其对应的国旗图标
 */
export const languages = {
  'zh-CN': {
    code: 'zh-CN',
    name: '中文',
    flag: '🇨🇳',
    translations: zhCN,
  },
  'en-US': {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
    translations: enUS,
  },
  'ja-JP': {
    code: 'ja-JP',
    name: '日本語',
    flag: '🇯🇵',
    translations: jaJP,
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'Français',
    flag: '🇫🇷',
    translations: frFR,
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Español',
    flag: '🇪🇸',
    translations: esES,
  },
  'ko-KR': {
    code: 'ko-KR',
    name: '한국어',
    flag: '🇰🇷',
    translations: koKR,
  },
}

/**
 * 语言上下文
 * 用于在整个应用中管理当前选择的语言
 */
const LanguageContext = createContext()

/**
 * 语言提供者组件
 * 包装应用并提供语言切换功能
 */
export function LanguageProvider({ children }) {
  // 从本地存储读取保存的语言设置，如果没有则默认为中文
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('app-language')
    return saved && languages[saved] ? saved : 'zh-CN'
  })

  // 当语言改变时，保存到本地存储
  useEffect(() => {
    localStorage.setItem('app-language', currentLanguage)
    // 更新HTML的lang属性
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  /**
   * 切换语言
   * @param {string} langCode - 语言代码（如 'zh-CN', 'en-US'）
   */
  const changeLanguage = (langCode) => {
    if (languages[langCode]) {
      setCurrentLanguage(langCode)
    }
  }

  // 获取当前语言的翻译对象
  const t = languages[currentLanguage].translations

  const value = {
    currentLanguage,
    changeLanguage,
    t, // 翻译函数，用于获取当前语言的文本
    languages, // 所有可用语言
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

/**
 * 使用语言上下文的Hook
 * 在组件中调用此Hook来访问语言功能
 */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}



