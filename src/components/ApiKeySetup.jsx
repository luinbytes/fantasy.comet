import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../context/ToastContext'

function ApiKeySetup({ onKeySet }) {
  const { addToast } = useToast()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const apiKeyInputRef = useRef(null)

  const validateApiKey = (key) => {
    if (!key || typeof key !== 'string' || key.trim().length < 8) {
      return false
    }
    
    const validFormat = /^[A-Za-z0-9_-]{8,}$/
    return validFormat.test(key.trim())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      addToast('Please enter an API key', 'error')
      return
    }

    if (!validateApiKey(apiKey)) {
      setError('Invalid API key format')
      addToast('Invalid API key format', 'error')
      return
    }

    setIsValidating(true)
    
    try {
      if (window.electronAPI.saveApiKey(apiKey.trim())) {
        try {
          await window.electronAPI.getMember('username')
          onKeySet(apiKey.trim())
          setError('')
          addToast('API key validated and saved successfully', 'success')
        } catch (error) {
          window.electronAPI.saveApiKey('')
          setError('Invalid API key. Please check and try again.')
          addToast('Invalid API key. Please check and try again.', 'error')
        }
      } else {
        setError('Failed to save API key')
        addToast('Failed to save API key', 'error')
      }
    } catch (error) {
      setError('An error occurred while saving the API key')
      addToast('An error occurred while saving the API key', 'error')
    } finally {
      setIsValidating(false)
    }
  }

  const handleMouseMove = (e) => {
    if (!apiKeyInputRef.current) return
    
    const rect = apiKeyInputRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    setMousePosition({ x })
  }

  const getMaskedApiKey = () => {
    if (!isHovering || !apiKey) return apiKey ? '•'.repeat(apiKey.length) : ''
    
    const spotlightWidth = 40
    const charWidth = 8
    
    return apiKey.split('').map((char, index) => {
      const charPosition = index * charWidth
      const distance = Math.abs(charPosition - mousePosition.x)
      
      if (distance < spotlightWidth / 2) {
        return char
      }
      return '•'
    }).join('')
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
          <div className="relative">
            <input
              ref={apiKeyInputRef}
              type="text"
              id="apiKey"
              value={getMaskedApiKey()}
              onChange={(e) => setApiKey(e.target.value)}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="w-full px-4 py-2 bg-light-200 dark:bg-dark-300 border border-light-300 dark:border-dark-100 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ABCD-EFGH-IJKL-MNOP"
              disabled={isValidating}
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isValidating}
        >
          {isValidating ? 'Validating...' : 'Save API Key'}
        </button>
      </form>
    </motion.div>
  )
}

export default ApiKeySetup 