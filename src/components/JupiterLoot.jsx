import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GiftIcon } from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import Skeleton from './Skeleton'

function JupiterLoot() {
  const { addToast } = useToast()
  const [rolls, setRolls] = useState([])
  const [lastRollTime, setLastRollTime] = useState(null)
  const [canRoll, setCanRoll] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchRollData = async () => {
    try {
      const memberInfo = await window.electronAPI.getMember('rolls')
      console.log('[DEBUG] Member rolls data:', memberInfo)
      
      if (memberInfo?.rolls && Array.isArray(memberInfo.rolls)) {
        console.log('[DEBUG] Roll history:', memberInfo.rolls)
        setRolls(memberInfo.rolls)
        
        if (memberInfo.rolls.length > 0) {
          const lastRoll = memberInfo.rolls[0]
          console.log('[DEBUG] Last roll:', lastRoll)
          
          // Handle timestamp as string
          const timestamp = lastRoll.time || lastRoll.timestamp
          const lastRollDate = new Date(timestamp * 1000) // Convert Unix timestamp to milliseconds
          console.log('[DEBUG] Last roll date:', lastRollDate)
          
          if (!isNaN(lastRollDate.getTime())) { // Check if date is valid
            setLastRollTime(lastRollDate)
            
            // Check if 24 hours have passed
            const now = new Date()
            const hoursSinceLastRoll = (now - lastRollDate) / (1000 * 60 * 60)
            console.log('[DEBUG] Hours since last roll:', hoursSinceLastRoll)
            setCanRoll(hoursSinceLastRoll >= 24)
            console.log('[DEBUG] Can roll:', hoursSinceLastRoll >= 24)
          } else {
            console.log('[DEBUG] Invalid date, enabling roll')
            setCanRoll(true)
          }
        } else {
          console.log('[DEBUG] No previous rolls found, enabling roll')
          setCanRoll(true)
        }
      } else {
        console.log('[DEBUG] No rolls array in member info or invalid format')
        setCanRoll(true)
      }
    } catch (error) {
      console.error('[ERROR] Failed to fetch roll data:', error)
      addToast('Failed to load loot history', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRollData()
  }, [])

  const handleRoll = async () => {
    if (!canRoll) return

    try {
      console.log('[DEBUG] Attempting to roll...')
      const result = await window.electronAPI.rollLoot()
      console.log('[DEBUG] Roll result:', result)
      
      if (result) {
        addToast(`You rolled: ${result.item}!`, 'success')
        fetchRollData() // Refresh the roll history
      }
    } catch (error) {
      console.error('[ERROR] Failed to roll:', error)
      addToast('Failed to roll for loot', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Abundance of Jupiter
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {canRoll 
              ? "You can roll for loot!" 
              : lastRollTime 
                ? `Next roll available in ${Math.max(0, Math.ceil(24 - ((new Date() - lastRollTime) / (1000 * 60 * 60))))} hours`
                : "Loading..."
            }
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRoll}
          disabled={!canRoll}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
            canRoll 
              ? 'bg-primary text-white hover:bg-secondary' 
              : 'bg-gray-300 dark:bg-dark-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <GiftIcon className="w-5 h-5" />
          <span>Roll for Loot</span>
        </motion.button>
      </div>

      <div className="space-y-2">
        {rolls.map((roll, index) => (
          <div 
            key={index}
            className="bg-light-200 dark:bg-dark-300 p-3 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <GiftIcon className="w-4 h-4 text-primary" />
              <div>
                <div className="text-gray-800 dark:text-gray-200">
                  {roll.outcome} {roll.amount && `(${roll.amount})`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {(() => {
                    const date = new Date(roll.time * 1000)
                    return !isNaN(date.getTime())
                      ? date.toLocaleString()
                      : 'Unknown date'
                  })()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default JupiterLoot 