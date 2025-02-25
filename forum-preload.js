// Forum webview preload script
const { contextBridge, ipcRenderer } = require('electron');

// Run when the page DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const fixImages = () => {
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('data-error-handler-attached')) {
        img.setAttribute('data-error-handler-attached', 'true');
        
        img.addEventListener('error', function() {
          if (!this.src.includes('bypassCache=1')) {
            if (this.src.match(/\/forums\/index\.php\?attachments\/[\d\.]+\.png\.\d+/)) {
              this.src = this.src + '&bypassCache=1';
            }
            else if (this.src.includes('constelia.ai/forums/index.php?attachments/')) {
              this.src = this.src + '&bypassCache=1';
            } else {
              this.src = this.src + '&bypassCache=1';
            }
          }
        });

        if (img.src.match(/\/forums\/index\.php\?attachments\/[\d\.]+\.png\.\d+/) && !img.src.includes('bypassCache=1')) {
          img.src = img.src + '&bypassCache=1';
        }
        else if (img.src.includes('constelia.ai/forums/index.php?attachments/') && !img.src.includes('bypassCache=1')) {
          img.src = img.src + '&bypassCache=1';
        }
        
        if (img.src.includes('1740437904432.png') && !img.src.includes('bypassCache=1')) {
          img.src = img.src + '&bypassCache=1';
        }
      }
    });
  };

  fixImages();
  setInterval(fixImages, 1000);
  
  // Set up observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        fixImages();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Handle clicks on external links
  document.addEventListener('click', (e) => {
    // Find closest anchor tag
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Check if it's an external link
    const isExternal = 
      (href.startsWith('http') && !href.includes('constelia.ai')) ||
      href.includes('imgur.com') || 
      href.includes('youtube.com') ||
      href.includes('youtu.be');
      
    if (isExternal) {
      e.preventDefault();
      e.stopPropagation();
      
      // Send message to open in modal
      ipcRenderer.sendToHost('open-external-modal', href);
      return false;
    }
  }, true);

  const shareCookies = () => {
    try {
      window.localStorage.setItem('forum_cookies', document.cookie);
      
      if (ipcRenderer && ipcRenderer.send) {
        ipcRenderer.send('forum-cookies-updated', document.cookie);
      }
    } catch (e) {
      console.error('Could not store cookies:', e);
    }
  };

  shareCookies();
  setInterval(shareCookies, 5000);
  
  document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
      if (!e.target.src.includes('bypassCache=1')) {
        e.target.src = e.target.src + '&bypassCache=1';
      }
    }
  }, true);
}); 