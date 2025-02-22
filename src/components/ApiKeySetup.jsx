import React, { useState } from 'react'
import { motion } from 'framer-motion'

function ApiKeySetup({ onKeySet }) {
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    if (window.electronAPI.saveApiKey(apiKey.trim())) {
      onKeySet(apiKey.trim())
      setError('')
    } else {
      setError('Failed to save API key')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md border border-light-300 dark:border-dark-100"
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">API Key Setup</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Enter your Constelia API Key
          </label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 bg-light-200 dark:bg-dark-300 border border-light-300 dark:border-dark-100 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="ABCD-EFGH-IJKL-MNOP"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Save API Key
        </button>
      </form>
    </motion.div>
  )
}

export default ApiKeySetup 