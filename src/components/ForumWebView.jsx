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
  const [externalModal, setExternalModal] = useState({ isOpen: false, url: null })

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
      console.log('[FORUM] DOM Ready')
      setIsDomReady(true)
      setCurrentUrl(webview.src)
      
      // Inject a script to ensure images load properly
      webview.executeJavaScript(`
        console.log('[FORUM] Running image fix script');
        document.querySelectorAll('img').forEach(img => {
          // Add error handler
          if (!img.hasAttribute('data-error-handler-attached')) {
            img.setAttribute('data-error-handler-attached', 'true');
            
            img.onerror = function() {
              console.log('[IMAGE] Error loading image, retrying with bypass:', this.src);
              if (!this.src.includes('bypassCache=1')) {
                this.src = this.src + '&bypassCache=1';
              }
            };
            
            // Proactively add bypass for attachment URLs with specific format (1740437904432.png.11205)
            if (img.src && img.src.match(/\\/forums\\/index\\.php\\?attachments\\/[\\d\\.]+\\.png\\.\\d+/) && !img.src.includes('bypassCache=1')) {
              console.log('[IMAGE] Proactively adding bypass to specific format attachment:', img.src);
              img.src = img.src + '&bypassCache=1';
            }
            // Proactively add bypass for other attachment URLs
            else if (img.src && img.src.includes('constelia.ai/forums/index.php?attachments/') && !img.src.includes('bypassCache=1')) {
              console.log('[IMAGE] Proactively adding bypass to attachment:', img.src);
              img.src = img.src + '&bypassCache=1';
            }
          }
        });
        
        // Monitor for dynamically added images
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'IMG') {
                  handleImage(node);
                } else if (node.querySelectorAll) {
                  node.querySelectorAll('img').forEach(handleImage);
                }
              });
            }
          });
        });
        
        function handleImage(img) {
          if (!img.hasAttribute('data-error-handler-attached')) {
            img.setAttribute('data-error-handler-attached', 'true');
            img.onerror = function() {
              if (!this.src.includes('bypassCache=1')) {
                this.src = this.src + '&bypassCache=1';
              }
            };
            
            // Proactively add bypass for attachment URLs with specific format
            if (img.src && img.src.match(/\\/forums\\/index\\.php\\?attachments\\/[\\d\\.]+\\.png\\.\\d+/) && !img.src.includes('bypassCache=1')) {
              img.src = img.src + '&bypassCache=1';
            }
            // Proactively add bypass for other attachment URLs
            else if (img.src && img.src.includes('constelia.ai/forums/index.php?attachments/') && !img.src.includes('bypassCache=1')) {
              img.src = img.src + '&bypassCache=1';
            }
          }
        }
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Cache forum cookies in localStorage for potential use in the app
        try {
          localStorage.setItem('forum_cookies', document.cookie);
        } catch (e) {
          console.error('Could not store cookies:', e);
        }
      `)
      
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
      // Always open links in the webview
      if (webviewRef.current) {
        webviewRef.current.src = event.url
        setCurrentUrl(event.url)
      }
    }
    
    const handleExternalModal = (event, url) => {
      event.preventDefault()
      setExternalModal({ isOpen: true, url })
    }

    // Add event listeners
    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-start-loading', handleStartLoading)
    webview.addEventListener('did-finish-load', handleFinishLoading)
    webview.addEventListener('did-fail-load', handleFailLoad)
    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
    webview.addEventListener('new-window', handleNewWindow)
    webview.addEventListener('ipc-message', (event) => {
      if (event.channel === 'open-external-modal') {
        setExternalModal({ isOpen: true, url: event.args[0] })
      }
    })

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
  
  const closeExternalModal = () => {
    setExternalModal({ isOpen: false, url: null })
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
            preload="file://${__dirname}/forum-preload.js"
            httpreferrer="https://constelia.ai/forums/"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            disablewebsecurity="false"
            plugins="true"
            nodeintegration="false"
            nodeintegrationinsubframes="false"
            enableremotemodule="false"
            webviewtag="true"
            allowtransparency="false"
          />
        </div>
        
        {/* External content modal */}
        <AnimatePresence>
          {externalModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={closeExternalModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-dark-200 w-[90%] h-[90%] max-w-5xl rounded-xl shadow-xl overflow-hidden relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={closeExternalModal}
                    className="p-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-200" />
                  </button>
                </div>
                
                <div className="w-full h-full">
                  <webview
                    src={externalModal.url}
                    className="w-full h-full"
                    allowpopups="true"
                    webpreferences="contextIsolation=true"
                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
            className="p-2 rounded-lg bg-light-200/50 dark:bg-dark-300/50 hover:bg-light-200 dark:hover:bg-dark-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleGoBack}
            disabled={!canGoBack || !isDomReady}
            className="p-2 rounded-lg bg-light-200/50 dark:bg-dark-300/50 hover:bg-light-200 dark:hover:bg-dark-300 transition-colors disabled:opacity-30 disabled:hover:bg-light-200/50 dark:disabled:hover:bg-dark-300/50"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
          <button
            onClick={handleGoForward}
            disabled={!canGoForward || !isDomReady}
            className="p-2 rounded-lg bg-light-200/50 dark:bg-dark-300/50 hover:bg-light-200 dark:hover:bg-dark-300 transition-colors disabled:opacity-30 disabled:hover:bg-light-200/50 dark:disabled:hover:bg-dark-300/50"
          >
            <ArrowRightIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={!isDomReady || isLoading}
            className="p-2 rounded-lg bg-light-200/50 dark:bg-dark-300/50 hover:bg-light-200 dark:hover:bg-dark-300 transition-colors disabled:opacity-30 disabled:hover:bg-light-200/50 dark:disabled:hover:bg-dark-300/50"
          >
            <ArrowPathIcon className={`w-6 h-6 text-gray-700 dark:text-gray-200 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <webview
          ref={webviewRef}
          src={currentUrl}
          className="w-full h-full"
          partition="persist:forum"
          allowpopups="true"
          webpreferences="contextIsolation=true"
          preload="file://${__dirname}/forum-preload.js"
          httpreferrer="https://constelia.ai/forums/"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
          disablewebsecurity="false"
          plugins="true"
          nodeintegration="false"
          nodeintegrationinsubframes="false"
          enableremotemodule="false"
          webviewtag="true"
          allowtransparency="false"
        />
        
        {/* External content modal */}
        <AnimatePresence>
          {externalModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={closeExternalModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-light-100 dark:bg-dark-200 w-[90%] h-[90%] max-w-5xl rounded-xl shadow-xl overflow-hidden relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={closeExternalModal}
                    className="p-2 rounded-lg bg-light-200/50 dark:bg-dark-300/50 hover:bg-light-200 dark:hover:bg-dark-300 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </button>
                </div>
                
                <div className="w-full h-full">
                  <webview
                    src={externalModal.url}
                    className="w-full h-full"
                    allowpopups="true"
                    webpreferences="contextIsolation=true"
                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
})

export default ForumWebView 