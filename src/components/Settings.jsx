import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Switch } from '@headlessui/react'
import { MoonIcon, SunIcon, BellIcon, GlobeAltIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../context/ThemeContext'

function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [autoUpdate, setAutoUpdate] = useState(false)

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md border border-light-300 dark:border-dark-100"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">General Settings</h2>
        
        <div className="space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-light-200 dark:bg-dark-300 rounded-lg">
                <MoonIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-gray-800 dark:text-gray-200 font-medium">Dark Mode</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Toggle dark/light theme</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none"
              style={{ backgroundColor: isDark ? 'var(--primary)' : '#374151' }}
            >
              <span className="sr-only">Toggle theme</span>
              <span
                className={`${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300`}
              />
              <span className="absolute right-1.5 top-1.5">
                {isDark ? (
                  <MoonIcon className="h-3 w-3 text-dark-400" />
                ) : (
                  <SunIcon className="h-3 w-3 text-gray-400" />
                )}
              </span>
            </button>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-light-200 dark:bg-dark-300 rounded-lg">
                <BellIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-gray-800 dark:text-gray-200 font-medium">Notifications</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enable push notifications</p>
              </div>
            </div>
            <Switch
              checked={notifications}
              onChange={setNotifications}
              className={`${
                notifications ? 'bg-primary' : 'bg-light-300 dark:bg-dark-300'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            >
              <span className="sr-only">Enable notifications</span>
              <span
                className={`${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          {/* Auto Updates Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-light-200 dark:bg-dark-300 rounded-lg">
                <GlobeAltIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-gray-800 dark:text-gray-200 font-medium">Auto Updates</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Keep app up to date</p>
              </div>
            </div>
            <Switch
              checked={autoUpdate}
              onChange={setAutoUpdate}
              className={`${
                autoUpdate ? 'bg-primary' : 'bg-light-300 dark:bg-dark-300'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            >
              <span className="sr-only">Enable auto updates</span>
              <span
                className={`${
                  autoUpdate ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md border border-light-300 dark:border-dark-100"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Security</h2>
        
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-light-200 dark:bg-dark-300 rounded-lg hover:bg-light-300 dark:hover:bg-dark-100 transition-colors">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-5 h-5 text-primary" />
              <div className="text-left">
                <h3 className="text-gray-800 dark:text-gray-200 font-medium">Privacy Settings</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your privacy preferences</p>
              </div>
            </div>
            <span className="text-primary">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-light-200 dark:bg-dark-300 rounded-lg hover:bg-light-300 dark:hover:bg-dark-100 transition-colors">
            <div className="flex items-center space-x-3">
              <KeyIcon className="w-5 h-5 text-primary" />
              <div className="text-left">
                <h3 className="text-gray-800 dark:text-gray-200 font-medium">Change Password</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Update your password</p>
              </div>
            </div>
            <span className="text-primary">→</span>
          </button>
        </div>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-light-100 dark:bg-dark-200 p-6 rounded-xl shadow-md border border-light-300 dark:border-dark-100"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">About</h2>
        <div className="space-y-2">
          <p className="text-gray-500 dark:text-gray-400">Version: 1.0.0</p>
          <p className="text-gray-500 dark:text-gray-400">Build: 2024.01</p>
          <button className="text-primary hover:text-secondary transition-colors">Check for updates</button>
        </div>
      </motion.div>
    </div>
  )
}

export default Settings 