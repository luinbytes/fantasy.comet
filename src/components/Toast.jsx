import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

const icons = {
  success: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
  error: <ExclamationCircleIcon className="w-5 h-5 text-red-400" />,
  info: <InformationCircleIcon className="w-5 h-5 text-primary" />
}

function Toast({ message, type = 'info', onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-light-100/90 dark:bg-dark-200/90 backdrop-blur-sm border border-light-300/50 dark:border-dark-100/50 rounded-lg shadow-sm p-3 flex items-start space-x-3 max-w-sm"
    >
      <span>{icons[type]}</span>
      <p className="text-gray-800 dark:text-gray-200 flex-1 text-sm">{message}</p>
      <button
        onClick={onClose}
        className="p-0.5 hover:bg-light-200 dark:hover:bg-dark-300 rounded-full transition-colors"
      >
        <XMarkIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
      </button>
    </motion.div>
  )
}

export default Toast 