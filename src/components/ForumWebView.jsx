import React, { useEffect, useRef, useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const ForumWebView = forwardRef(({ isOpen, onClose, isFullView = false }, ref) => {
  const webviewRef = useRef(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('https://constelia.ai/forums')
  const [isLoading, setIsLoading] = useState(false)
  const [isDomReady, setIsDomReady] = useState(false)

  useEffect(() => {
    if (ref) {
      ref.current = {
        loadURL: (url) => {
          if (webviewRef.current) {
            try {
              const cleanUrl = url.replace(/['"]/g, '')
              webviewRef.current.src = cleanUrl
              setCurrentUrl(cleanUrl)
            } catch (error) {
              console.error(`[FORUM] Error loading URL: ${error.message}`)
            }
          }
        }
      }
    }
  }, [ref])

  const updateNavigationState = () => {
    const webview = webviewRef.current
    if (!webview) return

    try {
      const url = webview.getURL()
      const back = webview.canGoBack()
      const forward = webview.canGoForward()
      
      setCurrentUrl(url)
      setCanGoBack(back)
      setCanGoForward(forward)
    } catch (error) {
      console.error(`[FORUM] Error updating navigation state: ${error.message}`)
    }
  }

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleDomReady = () => {
      setIsDomReady(true)
      setTimeout(updateNavigationState, 100)
    }

    const handleStartLoading = () => {
      setIsLoading(true)
    }

    const handleFinishLoading = () => {
      setIsLoading(false)
      updateNavigationState()
    }

    const handleFailLoad = (event) => {
      console.error(`[FORUM] Failed to load: ${event.errorDescription}`)
      setIsLoading(false)
    }

    const handleDidNavigate = () => {
      updateNavigationState()
    }

    const handleDidNavigateInPage = () => {
      updateNavigationState()
    }

    const handleNewWindow = (event) => {
      event.preventDefault()
      const config = window.electronAPI.getConfig()
      
      if (config.openForumInApp) {
        webview.src = event.url
        setCurrentUrl(event.url)
      } else {
        window.electronAPI.openExternal(event.url)
      }
    }

    // Add event listeners
    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-start-loading', handleStartLoading)
    webview.addEventListener('did-finish-load', handleFinishLoading)
    webview.addEventListener('did-fail-load', handleFailLoad)
    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
    webview.addEventListener('new-window', handleNewWindow)

    // Cleanup function
    return () => {
      if (webview) {
        webview.removeEventListener('dom-ready', handleDomReady)
        webview.removeEventListener('did-start-loading', handleStartLoading)
        webview.removeEventListener('did-finish-load', handleFinishLoading)
        webview.removeEventListener('did-fail-load', handleFailLoad)
        webview.removeEventListener('did-navigate', handleDidNavigate)
        webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)
        webview.removeEventListener('new-window', handleNewWindow)
      }
      setIsDomReady(false)
    }
  }, [])

  const handleGoBack = (e) => {
    e.preventDefault()
    const webview = webviewRef.current
    if (webview && isDomReady) {
      try {
        webview.goBack()
      } catch (error) {
        console.error(`[FORUM] Error going back: ${error.message}`)
      }
    }
  }

  const handleGoForward = (e) => {
    e.preventDefault()
    const webview = webviewRef.current
    if (webview && isDomReady) {
      try {
        webview.goForward()
      } catch (error) {
        console.error(`[FORUM] Error going forward: ${error.message}`)
      }
    }
  }

  const handleRefresh = (e) => {
    e.preventDefault()
    const webview = webviewRef.current
    if (webview && isDomReady) {
      try {
        webview.reload()
      } catch (error) {
        console.error(`[FORUM] Error refreshing: ${error.message}`)
      }
    }
  }

  if (!isOpen) return null

  if (isFullView) {
    return (
      <div className="fixed inset-0 bg-dark-400 z-50">
        {/* Draggable bar */}
        <div className="h-6 bg-dark-200 drag" />
        
        {/* Navigation bar */}
        <div className="h-8 bg-dark-300 flex items-center px-4 gap-2 no-drag border-b border-dark-100">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="p-1 rounded-lg hover:bg-dark-200 transition-colors text-gray-400 hover:text-gray-200"
          >
            <XMarkIcon className="w-4 h-4" />
          </motion.button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleGoBack}
              disabled={!canGoBack || !isDomReady}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleGoForward}
              disabled={!canGoForward || !isDomReady}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleRefresh}
              disabled={!isDomReady || isLoading}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 px-4 py-2 text-sm text-gray-300 select-text cursor-text overflow-hidden overflow-ellipsis whitespace-nowrap">
            {currentUrl}
          </div>
        </div>

        {/* Webview container */}
        <div className="h-[calc(100vh-3.5rem)] border border-dark-100">
          <webview
            ref={webviewRef}
            src={currentUrl}
            className="w-full h-full"
            partition="persist:forum"
            allowpopups="true"
            webpreferences="contextIsolation=true"
          />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-light-100 dark:bg-dark-200 w-[90%] h-[90%] rounded-xl shadow-xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="p-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-200" />
          </button>
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleGoBack}
            disabled={!canGoBack || !isDomReady}
            className="p-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 transition-colors disabled:opacity-30 disabled:hover:bg-dark-300/50"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-200" />
          </button>
          <button
            onClick={handleGoForward}
            disabled={!canGoForward || !isDomReady}
            className="p-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 transition-colors disabled:opacity-30 disabled:hover:bg-dark-300/50"
          >
            <ArrowRightIcon className="w-6 h-6 text-gray-200" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={!isDomReady || isLoading}
            className="p-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 transition-colors disabled:opacity-30 disabled:hover:bg-dark-300/50"
          >
            <ArrowPathIcon className={`w-6 h-6 text-gray-200 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <webview
          ref={webviewRef}
          src={currentUrl}
          className="w-full h-full"
          partition="persist:forum"
          allowpopups="true"
          webpreferences="contextIsolation=true"
        />
      </motion.div>
    </motion.div>
  )
})

export default ForumWebView 