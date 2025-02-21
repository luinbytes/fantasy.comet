import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChartBarIcon, UserGroupIcon, CogIcon, BellIcon } from '@heroicons/react/24/outline'
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/20/solid'
import Settings from './components/Settings'

function App() {
  const [selectedTab, setSelectedTab] = useState('dashboard')

  const tabTitles = {
    dashboard: 'Dashboard',
    users: 'User Management',
    settings: 'System Settings'
  }

  const handleWindowControl = (action) => {
    if (window.electronAPI) {
      window.electronAPI.windowControl(action)
    }
  }

  const renderContent = () => {
    switch(selectedTab) {
      case 'settings':
        return <Settings />
      default:
        return (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className="bg-dark-200 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-dark-100"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-200">Card {i}</h3>
                    <span className="text-primary text-xl">→</span>
                  </div>
                  <p className="mt-2 text-gray-400">
                    This is a sample card with some content. You can add any information here.
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 bg-dark-200 p-6 rounded-xl shadow-md border border-dark-100"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Activity Chart</h3>
              <div className="h-64 bg-dark-300 rounded-lg flex items-center justify-center border border-dark-100">
                <span className="text-gray-400">Chart placeholder</span>
              </div>
            </motion.div>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-400">
      {/* Title Bar */}
      <div className="h-8 bg-dark-300 flex items-center justify-between px-4 select-none drag">
        <div className="text-gray-400 text-sm">Fantasy.Comet</div>
        <div className="flex items-center space-x-2 no-drag">
          <motion.button
            whileHover={{ backgroundColor: '#2c2e33' }}
            onClick={() => handleWindowControl('minimize')}
            className="p-1 rounded-md text-gray-400 hover:text-gray-200"
          >
            <MinusIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ backgroundColor: '#2c2e33' }}
            onClick={() => handleWindowControl('maximize')}
            className="p-1 rounded-md text-gray-400 hover:text-gray-200"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ backgroundColor: '#e53935' }}
            onClick={() => handleWindowControl('close')}
            className="p-1 rounded-md text-gray-400 hover:text-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          className="w-64 bg-dark-200 shadow-xl z-10"
        >
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary">
              {tabTitles[selectedTab]}
            </h1>
          </div>
          <nav className="mt-6 px-2">
            {[
              { name: 'Dashboard', icon: ChartBarIcon, id: 'dashboard' },
              { name: 'Users', icon: UserGroupIcon, id: 'users' },
              { name: 'Settings', icon: CogIcon, id: 'settings' },
            ].map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTab(item.id)}
                className={`w-full flex items-center px-4 py-3 mb-2 rounded-lg text-left transition-colors duration-200 ease-in-out ${
                  selectedTab === item.id 
                    ? 'bg-primary text-dark-400 shadow-md' 
                    : 'text-gray-400 hover:bg-dark-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-16 bg-dark-200 shadow-sm flex items-center justify-between px-8 z-10">
            <h2 className="text-xl font-semibold text-gray-200">Welcome back, User!</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-dark-100 transition-colors duration-200"
            >
              <BellIcon className="w-6 h-6 text-gray-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 