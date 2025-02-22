import { createContext } from 'react'

export const ForumContext = createContext({
  scrollRef: { current: { smoothScrollToElement: () => {} } }
}) 