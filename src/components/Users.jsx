import React from 'react'
import { motion } from 'framer-motion'

function Users({ systemInfo }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md border border-light-300 dark:border-dark-100"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">User Management</h2>
        <div className="space-y-4">
          <div className="bg-light-200 dark:bg-dark-300 p-4 rounded-lg border border-light-300 dark:border-dark-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{systemInfo?.username || 'Current User'}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Administrator</p>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Active</span>
            </div>
          </div>
          
          <div className="bg-light-200 dark:bg-dark-300 p-4 rounded-lg border border-light-300 dark:border-dark-100">
            <p className="text-gray-500 dark:text-gray-400 text-center">No other users found</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md border border-light-300 dark:border-dark-100"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Access Control</h2>
        <div className="space-y-2">
          <p className="text-gray-500 dark:text-gray-400">Configure user permissions and access levels</p>
          <button className="text-primary hover:text-secondary transition-colors">
            Manage permissions
          </button>
        </div>
      </motion.div>
    </>
  )
}

export default Users 