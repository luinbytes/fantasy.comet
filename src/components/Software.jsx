import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowUpCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Skeleton from './Skeleton'

function Software({ 
  softwareData, 
  loading, 
  onSoftwareSelect,
  selectedSoftware,
  detailsLoading,
  onCloseDetails
}) {
  const getUpdateStatus = (elapsed) => {
    const timeStr = elapsed.replace(/"/g, '').toLowerCase()
    
    if (timeStr.includes('month') || timeStr.includes('year')) {
      return {
        icon: <ClockIcon className="w-5 h-5 text-gray-400" />,
        status: 'Inactive',
        color: 'gray',
        dotColor: 'bg-gray-400'
      }
    } else if (timeStr.includes('week')) {
      return {
        icon: <ArrowUpCircleIcon className="w-5 h-5 text-blue-500" />,
        status: 'Stable',
        color: 'blue',
        dotColor: 'bg-blue-500'
      }
    } else {
      return {
        icon: <ArrowUpCircleIcon className="w-5 h-5 text-green-500" />,
        status: 'Active',
        color: 'green',
        dotColor: 'bg-green-500'
      }
    }
  }

  const formatTimeAgo = (elapsed) => {
    return elapsed.replace(/"/g, '')
  }

  const sortSoftware = (software) => {
    const getStatusPriority = (status) => {
      switch (status) {
        case 'Active': return 1
        case 'Stable': return 2
        case 'Inactive': return 3
        default: return 4
      }
    }

    return [...software].sort((a, b) => {
      const statusA = getUpdateStatus(a.elapsed).status
      const statusB = getUpdateStatus(b.elapsed).status

      // First sort by status priority
      const priorityDiff = getStatusPriority(statusA) - getStatusPriority(statusB)
      if (priorityDiff !== 0) return priorityDiff

      // If same status, sort by most recent update
      const timeA = a.last_update || 0
      const timeB = b.last_update || 0
      return timeB - timeA
    })
  }

  const groupSoftwareByStatus = (software) => {
    const groups = {
      Active: [],
      Stable: [],
      Inactive: []
    }

    software.forEach(app => {
      const status = getUpdateStatus(app.elapsed).status
      groups[status].push(app)
    })

    // Sort each group by last update time
    Object.keys(groups).forEach(status => {
      groups[status].sort((a, b) => {
        const timeA = a.last_update || 0
        const timeB = b.last_update || 0
        return timeB - timeA
      })
    })

    return groups
  }

  const handleCardClick = (app) => {
    console.log('[SOFTWARE] Card clicked:', app.name)
    onSoftwareSelect(app.name)
  }

  // Update the SoftwareDetails component to better handle script data
  const SoftwareDetails = ({ software, onClose }) => {
    if (!software) return null

    const formatScript = (script) => {
      return {
        name: script.name,
        version: script.software,  // This is the version number (e.g. "5")
        author: script.author,
        lastUpdate: script.last_update,
        categories: script.categories || [],
        categoryNames: script.category_names || [],
        core: script.core,
        elapsed: script.elapsed,
        forum: script.forums,
        id: script.id,
        lastBonus: script.last_bonus,
        library: script.library,
        updateNotes: script.update_notes,
        updates: script.updates || []
      }
    }

    // Prevent event bubbling on modal content click
    const handleModalClick = (e) => {
      e.stopPropagation()
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="modal-content bg-light-100 dark:bg-dark-200 rounded-xl p-6 max-w-2xl w-full mx-auto my-8 shadow-xl overflow-y-auto"
          onClick={handleModalClick}
        >
          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {software.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      v{software.version}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: {software.elapsed}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {software.checksum && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Checksums
                  </h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="bg-light-200 dark:bg-dark-300 p-3 rounded">
                      <span className="text-gray-500 dark:text-gray-400">Windows: </span>
                      <span className="break-all">{software.checksum}</span>
                    </div>
                    <div className="bg-light-200 dark:bg-dark-300 p-3 rounded">
                      <span className="text-gray-500 dark:text-gray-400">Linux: </span>
                      <span className="break-all">{software.checksum_linux}</span>
                    </div>
                  </div>
                </div>
              )}

              {software.scripts && software.scripts.length > 0 && (
                <div className="space-y-6">
                  {/* Software-specific scripts */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Available Scripts
                    </h3>
                    <div className="space-y-3">
                      {software.scripts
                        .filter(script => String(script.software) === String(software.version))
                        .map((rawScript, index) => {
                          const script = formatScript(rawScript)
                          return (
                            <div 
                              key={script.id || index}
                              className="bg-light-200 dark:bg-dark-300 p-4 rounded"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {script.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    by {script.author}
                                  </div>
                                </div>
                                {script.forum && (
                                  <button 
                                    className="text-primary hover:text-primary/80 text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.electronAPI.openExternal(script.forum)
                                    }}
                                  >
                                    Forum Thread
                                  </button>
                                )}
                              </div>
                              {script.categoryNames.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {script.categoryNames.map((category, i) => (
                                    <span 
                                      key={i}
                                      className="px-2 py-1 bg-primary/5 text-primary text-xs rounded-full"
                                    >
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {script.updateNotes && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  {script.updateNotes}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Global scripts */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                        Global Scripts
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (Shared utility scripts)
                      </span>
                    </div>
                    <div className="space-y-3">
                      {software.scripts
                        .filter(script => String(script.software) === "4")
                        .map((rawScript, index) => {
                          const script = formatScript(rawScript)
                          return (
                            <div 
                              key={script.id || index}
                              className="bg-light-200 dark:bg-dark-300 p-4 rounded border border-primary/10"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {script.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    by {script.author}
                                  </div>
                                </div>
                                {script.forum && (
                                  <button 
                                    className="text-primary hover:text-primary/80 text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.electronAPI.openExternal(script.forum)
                                    }}
                                  >
                                    Forum Thread
                                  </button>
                                )}
                              </div>
                              {script.categoryNames.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {script.categoryNames.map((category, i) => (
                                    <span 
                                      key={i}
                                      className="px-2 py-1 bg-primary/5 text-primary text-xs rounded-full"
                                    >
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {script.updateNotes && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  {script.updateNotes}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    )
  }

  // Update the card to be clickable
  const renderSoftwareCard = (app, index, statusInfo) => (
    <motion.div
      key={app.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
      className="flex-1 bg-light-100 dark:bg-dark-200 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-light-300 dark:border-dark-100 cursor-pointer"
      onClick={() => handleCardClick(app)}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
              {app.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                v{app.version}
              </span>
              <motion.div
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className={`text-xs px-2 py-0.5 bg-${statusInfo.color}-500/10 text-${statusInfo.color}-500 rounded-full`}
              >
                {statusInfo.status}
              </motion.div>
            </div>
          </div>
          {statusInfo.icon}
        </div>
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatTimeAgo(app.elapsed)}
          </div>
          <motion.div 
            className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Available Software
        </h2>
        
        <div className="space-y-8">
          {Object.entries(groupSoftwareByStatus(softwareData)).map(([status, apps]) => 
            apps.length > 0 && (
              <div key={status}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {status}
                  </h3>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apps.map((app, index) => {
                    const statusInfo = getUpdateStatus(app.elapsed)
                    
                    return renderSoftwareCard(app, index, statusInfo)
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>
      
      {/* Add the modal */}
      <AnimatePresence>
        {selectedSoftware && (
          <SoftwareDetails 
            software={selectedSoftware} 
            onClose={onCloseDetails} 
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Software 