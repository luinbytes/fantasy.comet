import React, { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { ChatBubbleLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import DOMPurify from 'dompurify'
import Skeleton from './Skeleton'
import { ForumContext } from '../contexts/ForumContext'

function ForumPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const { scrollRef } = useContext(ForumContext)

  // Add ref for posts
  const postRefs = React.useRef({})

  // Initialize DOMPurify for the window context
  useEffect(() => {
    if (window) {
      DOMPurify.setConfig({
        ADD_TAGS: ['bb', 'spoiler'],
        ADD_ATTR: ['quote-author', 'onclick']
      })
    }
  }, [])

  const parseBBCode = (text) => {
    if (!text) return ''

    let html = text

    // Handle quoted text with author
    html = html.replace(/\[quote=["']?(.*?)["']?\]([\s\S]*?)\[\/quote\]/gi,
      '<blockquote class="border-l-4 border-primary/30 pl-4 my-2"><div class="text-xs text-gray-500 mb-1">Originally posted by $1:</div><div class="italic text-gray-600">$2</div></blockquote>')

    // Handle regular quotes
    while (html.includes('[quote]')) {
      html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi,
        '<blockquote class="border-l-4 border-primary/30 pl-4 my-2 italic text-gray-600">$1</blockquote>')
    }

    // Text formatting
    html = html
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>')
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>')
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')
      .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<del>$1</del>')
      // Handle both color formats: [color=X] and [COLOR=X]
      .replace(/\[color=(#?\w+|\s*rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))\]([\s\S]*?)\[\/color\]/gi, '<span style="color: $1" class="text-base font-medium">$2</span>')
      .replace(/\[COLOR=(#?\w+|\s*rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))\]([\s\S]*?)\[\/COLOR\]/gi, '<span style="color: $1" class="text-base font-medium">$2</span>')
      .replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size: $1px">$2</span>')
      
      // Advanced formatting
      .replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="text-center">$1</div>')
      .replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<div class="text-right">$1</div>')
      .replace(/\[indent\]([\s\S]*?)\[\/indent\]/gi, '<div class="pl-4">$1</div>')
      
      // Additional text formatting
      .replace(/\[font=(.*?)\]([\s\S]*?)\[\/font\]/gi, '<span style="font-family: $1">$2</span>')
      .replace(/\[highlight\]([\s\S]*?)\[\/highlight\]/gi, '<mark class="bg-yellow-200 dark:bg-yellow-700">$1</mark>')
      .replace(/\[sub\]([\s\S]*?)\[\/sub\]/gi, '<sub>$1</sub>')
      .replace(/\[sup\]([\s\S]*?)\[\/sup\]/gi, '<sup>$1</sup>')
      
      // Links and media
      .replace(/\[url\s+unfurl="true"\](.*?)\[\/url\]/gi,
        '<a href="$1" class="text-primary hover:underline block p-2 bg-light-200 dark:bg-dark-300 rounded" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi,
        '<a href="$1" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/\[url\](.*?)\[\/url\]/gi,
        '<a href="$1" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Enhanced image support with alt text
      .replace(/\[img\s+alt="([^"]+)"\](.*?)\[\/img\]/gi,
        '<img src="$2" class="max-w-full rounded my-2" alt="$1" loading="lazy" />')
      .replace(/\[img\](.*?)\[\/img\]/gi,
        '<img src="$1" class="max-w-full rounded my-2" alt="Posted image" loading="lazy" />')
      .replace(/\[youtube\](.*?)\[\/youtube\]/gi,
        '<div class="relative pt-[56.25%] my-2"><iframe class="absolute inset-0 w-full h-full rounded" src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe></div>')
      
      // Enhanced spoiler support
      .replace(/\[spoiler="([^"]+)"\]([\s\S]*?)\[\/spoiler\]/gi,
        '<div class="border border-gray-300 dark:border-gray-600 rounded my-2"><div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium cursor-pointer select-none" onclick="this.nextElementSibling.classList.toggle(\'hidden\')">$1</div><div class="p-3 hidden">$2</div></div>')
      .replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
        '<div class="border border-gray-300 dark:border-gray-600 rounded my-2"><div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium cursor-pointer select-none" onclick="this.nextElementSibling.classList.toggle(\'hidden\')">Spoiler</div><div class="p-3 hidden">$1</div></div>')

      // Enhanced code block support with language specification
      .replace(/\[code=(\w+)\]([\s\S]*?)\[\/code\]/gi,
        '<pre class="bg-dark-300 dark:bg-dark-400 p-3 rounded my-2 font-mono text-sm overflow-x-auto language-$1">$2</pre>')
      
      // Attachment support
      .replace(/\[ATTACH\s+type="([^"]+)"\s+alt="([^"]+)"\](\d+)\[\/ATTACH\]/gi,
        '<div class="attachment"><img src="https://constelia.ai/forums/index.php?attachments/$2.$3" class="max-w-full rounded my-2" alt="$2" loading="lazy" /></div>')
      
      // Lists (improved handling for both list items and description blocks)
      // First handle the inner lists
      .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (match, content) => {
        // Check if content has list items
        if (content.includes('[*]')) {
          // Process list items
          const processedContent = content.replace(/\[\*\]([\s\S]*?)(?=\[\*\]|\[\/list\]|$)/gi, (m, itemContent) => {
            const cleanContent = itemContent.trim();
            return `<li class="text-gray-600 dark:text-gray-300">${cleanContent}</li>`;
          });
          return `<ul class="list-disc pl-4 my-4 space-y-2">${processedContent}</ul>`;
        } else {
          // Handle as description block
          const cleanContent = content.trim();
          return `<div class="bg-light-200 dark:bg-dark-300 rounded p-3 my-2 text-gray-600 dark:text-gray-300">${cleanContent}</div>`;
        }
      })
      // Handle ordered lists with numbers
      .replace(/\[list=1\]([\s\S]*?)\[\/list\]/gi, (match, content) => {
        if (content.includes('[*]')) {
          const processedContent = content.replace(/\[\*\]([\s\S]*?)(?=\[\*\]|\[\/list\]|$)/gi, (m, itemContent) => {
            const cleanContent = itemContent.trim();
            return `<li class="text-gray-600 dark:text-gray-300">${cleanContent}</li>`;
          });
          return `<ol class="list-decimal pl-4 my-4 space-y-2">${processedContent}</ol>`;
        } else {
          const cleanContent = content.trim();
          return `<div class="bg-light-200 dark:bg-dark-300 rounded p-3 my-2 text-gray-600 dark:text-gray-300">${cleanContent}</div>`;
        }
      })
      // Handle ordered lists with letters
      .replace(/\[list=([aA])\]([\s\S]*?)\[\/list\]/gi, (match, type, content) => {
        if (content.includes('[*]')) {
          const listType = type === 'a' ? 'lower-alpha' : 'upper-alpha';
          const processedContent = content.replace(/\[\*\]([\s\S]*?)(?=\[\*\]|\[\/list\]|$)/gi, (m, itemContent) => {
            const cleanContent = itemContent.trim();
            return `<li class="text-gray-600 dark:text-gray-300">${cleanContent}</li>`;
          });
          return `<ol class="list-[${listType}] pl-4 my-4 space-y-2">${processedContent}</ol>`;
        } else {
          const cleanContent = content.trim();
          return `<div class="bg-light-200 dark:bg-dark-300 rounded p-3 my-2 text-gray-600 dark:text-gray-300">${cleanContent}</div>`;
        }
      })
      // Handle any remaining list items that might be outside of lists
      .replace(/\[\*\]([\s\S]*?)(?=\[\*\]|$)/gi, '<li class="text-gray-600 dark:text-gray-300">$1</li>')
      
      // Code blocks (including ICODE)
      .replace(/\[code\]([\s\S]*?)\[\/code\]/gi,
        '<pre class="bg-dark-300 dark:bg-dark-400 p-3 rounded my-2 font-mono text-sm overflow-x-auto">$1</pre>')
      .replace(/\[icode\]([\s\S]*?)\[\/icode\]/gi,
        '<pre class="bg-dark-300 dark:bg-dark-400 p-3 rounded my-2 font-mono text-sm overflow-x-auto">$1</pre>')
      .replace(/\[php\]([\s\S]*?)\[\/php\]/gi,
        '<pre class="bg-dark-300 dark:bg-dark-400 p-3 rounded my-2 font-mono text-sm overflow-x-auto language-php">$1</pre>')
      .replace(/\[sql\]([\s\S]*?)\[\/sql\]/gi,
        '<pre class="bg-dark-300 dark:bg-dark-400 p-3 rounded my-2 font-mono text-sm overflow-x-auto language-sql">$1</pre>')
      
      // Additional containers
      .replace(/\[quote=(.*?)\]([\s\S]*?)\[\/quote\]/gi,
        '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2"><div class="text-sm text-gray-600 dark:text-gray-400">Originally posted by $1:</div>$2</blockquote>')
      .replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="text-center">$1</div>')
      .replace(/\[left\]([\s\S]*?)\[\/left\]/gi, '<div class="text-left">$1</div>')
      .replace(/\[justify\]([\s\S]*?)\[\/justify\]/gi, '<div class="text-justify">$1</div>')
      .replace(/\[rtl\]([\s\S]*?)\[\/rtl\]/gi, '<div dir="rtl">$1</div>')
      .replace(/\[ltr\]([\s\S]*?)\[\/ltr\]/gi, '<div dir="ltr">$1</div>')
      
      // Tables
      .replace(/\[table\]([\s\S]*?)\[\/table\]/gi, '<div class="overflow-x-auto my-2"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">$1</table></div>')
      .replace(/\[tr\]([\s\S]*?)\[\/tr\]/gi, '<tr>$1</tr>')
      .replace(/\[td\]([\s\S]*?)\[\/td\]/gi, '<td class="px-3 py-2 whitespace-nowrap">$1</td>')
      .replace(/\[th\]([\s\S]*?)\[\/th\]/gi, '<th class="px-3 py-2 text-left font-medium">$1</th>')
      
      // Line breaks and horizontal rules
      .replace(/\[hr\]/gi, '<hr class="my-4 border-t border-gray-200 dark:border-gray-700">')
      .replace(/\n/g, '<br />')

    // Sanitize and return
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'strong', 'em', 'u', 'del', 'a', 'blockquote', 'pre', 'img', 'br',
        'ul', 'ol', 'li', 'p', 'div', 'span', 'iframe', 'table', 'tr', 'td',
        'th', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'sub', 'sup', 'mark',
        'dir', 'code'
      ],
      ALLOWED_ATTR: [
        'href', 'class', 'target', 'rel', 'src', 'alt', 'loading',
        'style', 'frameborder', 'allowfullscreen', 'dir', 'onclick',
        'data-id', 'data-type'
      ],
      ALLOWED_STYLES: ['color', 'font-size', 'font-family'],
      ADD_ATTR: ['onclick'],
      ALLOW_DATA_ATTR: true
    })
  }

  // Group posts by thread and sort chronologically
  const groupPosts = (posts) => {
    // First, group posts by thread
    const threadGroups = {}
    posts.forEach(post => {
      if (!threadGroups[post.thread_id]) {
        threadGroups[post.thread_id] = []
      }
      threadGroups[post.thread_id].push(post)
    })

    // Sort posts within each thread chronologically
    Object.values(threadGroups).forEach(group => {
      group.sort((a, b) => parseInt(a.post_date) - parseInt(b.post_date))
    })

    // Sort threads by their most recent post
    const sortedThreads = Object.values(threadGroups).sort((a, b) => {
      const latestA = Math.max(...a.map(p => parseInt(p.post_date)))
      const latestB = Math.max(...b.map(p => parseInt(p.post_date)))
      return latestB - latestA
    })

    return sortedThreads
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const data = await window.electronAPI.getForumPosts(20)
      setPosts(data)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      addToast('Failed to load forum posts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openThread = (url) => {
    window.electronAPI.openExternal(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  const groupedPosts = groupPosts(posts)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Recent Forum Activity
      </h2>

      <div className="space-y-8">
        {groupedPosts.map((threadPosts, threadIndex) => (
          <motion.div
            key={threadPosts[0].thread_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: threadIndex * 0.05 }}
            className="space-y-3"
          >
            {/* Thread title */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">
                {threadPosts[0].thread_title}
              </h3>
              <button
                onClick={() => openThread(threadPosts[0].thread_url)}
                className="p-1.5 hover:bg-light-200 dark:hover:bg-dark-300 rounded-lg transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Posts in thread */}
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              {threadPosts.map((post, postIndex) => (
                <motion.div
                  key={post.post_id}
                  ref={el => {
                    console.log('Setting ref for post:', post.id)
                    postRefs.current[post.id] = el
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: postIndex * 0.05 }}
                  className="bg-light-100 dark:bg-dark-200 rounded-xl p-4 shadow-md border border-light-300 dark:border-dark-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>Posted by {post.username}</span>
                      <span>•</span>
                      <span>{post.formatted_date}</span>
                    </div>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div 
                      className="text-gray-600 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: parseBBCode(post.message) }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ForumPosts 