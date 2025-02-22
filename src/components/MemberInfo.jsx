import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GiftIcon } from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'

function MemberInfo({ 
  memberInfo, 
  recentRolls, 
  canRoll, 
  lastRollTime,
  timeUntilRoll,
  onRoll 
}) {
  if (!memberInfo) {
    return <div className="text-gray-500 dark:text-gray-400">Loading member info...</div>
  }

  return (
    <div className="bg-light-100 dark:bg-dark-200 p-4 rounded-xl shadow-md">
      {/* User Info Section */}
      <div className="flex items-center space-x-4">
        {memberInfo?.avatar && (
          <img 
            src={memberInfo.avatar} 
            alt="Profile" 
            className="w-12 h-12 rounded-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate">
              {memberInfo?.username}
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRoll}
              disabled={!canRoll}
              className={`px-2 py-1 rounded-lg flex items-center space-x-1.5 text-sm ${
                canRoll 
                  ? 'bg-primary text-white hover:bg-secondary' 
                  : 'bg-gray-300 dark:bg-dark-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <GiftIcon className="w-4 h-4" />
              <span>{canRoll ? 'Roll' : `${timeUntilRoll}h`}</span>
            </motion.button>
          </div>
          
          <div className="mt-1 flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{memberInfo?.posts}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Score</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{memberInfo?.score}</span>
            </div>
          </div>

          {memberInfo?.custom_title && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 truncate">
              {memberInfo.custom_title}
            </div>
          )}
        </div>
      </div>

      {/* Recent Rolls Section */}
      {recentRolls.length > 0 && (
        <div className="mt-4 border-t border-light-300 dark:border-dark-100 pt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent Rolls</div>
          <div className="space-y-1.5">
            {recentRolls.map((roll, index) => (
              <div 
                key={index}
                className="bg-light-200 dark:bg-dark-300 p-1.5 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <GiftIcon className="w-3.5 h-3.5 text-primary" />
                  <div className="text-xs text-gray-800 dark:text-gray-200">
                    {roll.outcome} {roll.amount && `(${roll.amount})`}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const date = new Date(roll.time * 1000)
                    return !isNaN(date.getTime())
                      ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                          -Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
                          'day'
                        )
                      : 'Unknown'
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberInfo 