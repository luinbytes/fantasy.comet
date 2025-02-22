import React from 'react'
import { motion } from 'framer-motion'

function Skeleton({ className = '' }) {
  return (
    <motion.div
      className={`bg-light-300 dark:bg-dark-300 rounded-lg ${className}`}
      animate={{
        opacity: [0.5, 0.8, 0.5],
        transition: {
          duration: 1.5,
          repeat: Infinity,
        },
      }}
    />
  )
}

export default Skeleton 