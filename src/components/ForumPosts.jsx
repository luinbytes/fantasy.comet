import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import ForumWebView from './ForumWebView'
import ActivityChart from './ActivityChart'

function ForumPosts() {
  const [isForumModalOpen, setIsForumModalOpen] = useState(false)
  const webviewRef = useRef(null)

  useEffect(() => {
    setIsForumModalOpen(true)
  }, [])

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      {!isForumModalOpen && (
        <div className="w-full h-full flex flex-col">
          <div className="text-center p-8">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Forum View
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The forum is currently closed. Click the button below to open it.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsForumModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-colors"
            >
              Open Forum
            </motion.button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 min-h-[400px] bg-light-100 dark:bg-dark-200 p-3 pb-6 rounded-xl shadow-md border border-light-300 dark:border-dark-100 mx-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Activity Chart</h3>
            <div className="h-full min-h-[350px]">
              <ActivityChart />
            </div>
          </motion.div>
        </div>
      )}

      {isForumModalOpen && (
        <ForumWebView 
          isOpen={isForumModalOpen} 
          onClose={() => setIsForumModalOpen(false)}
          isFullView={false}
          ref={webviewRef}
        />
      )}
    </div>
  )
}

export default ForumPosts 