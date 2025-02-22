import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, BellIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

function NotificationDrawer({ isOpen, onClose, alerts = [] }) {
  const handleAlertClick = (alert) => {
    if (alert.link) {
      window.electronAPI.openExternal(alert.link)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-light-100 dark:bg-dark-200 shadow-xl z-50 border-l border-light-300 dark:border-dark-100"
          >
            <div className="p-4 border-b border-light-300 dark:border-dark-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-light-200 dark:hover:bg-dark-300 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="overflow-y-auto h-[calc(100vh-60px)]">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No new notifications
                </div>
              ) : (
                <div className="divide-y divide-light-300 dark:divide-dark-100">
                  {alerts.map((alert, index) => (
                    <div 
                      key={index} 
                      className="p-4 hover:bg-light-200 dark:hover:bg-dark-300 transition-colors cursor-pointer"
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {alert.type === 'constelia' && (
                          <GlobeAltIcon className="w-5 h-5 text-primary" />
                        )}
                        <div className="text-gray-800 dark:text-gray-200 font-medium">{alert.title}</div>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">{alert.message}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-xs mt-2">{alert.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationDrawer 