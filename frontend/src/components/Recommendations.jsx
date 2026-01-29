import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import { API_URL } from '../config';

export default function Recommendations({ onPostClick, token, isFullPage = false }) {
  const [allPosts, setAllPosts] = useState([]) 
  const [currentIndex, setCurrentIndex] = useState(0) 
  
  // === 1. HELPER: DYNAMIC KEYS ===
  // Returns different keys for Auth user vs Guest so data doesn't leak
  const getHistoryKey = useCallback(() => {
      return token ? 'hidden_posts_auth' : 'hidden_posts_guest';
  }, [token]);

  // === 2. STATE: VIEWED POSTS ===
  // Initialize based on the CURRENT token status
  const [viewedIds, setViewedIds] = useState(() => {
      const key = token ? 'hidden_posts_auth' : 'hidden_posts_guest';
      try {
          const saved = JSON.parse(sessionStorage.getItem(key) || '[]');
          return new Set(saved);
      } catch {
          return new Set();
      }
  });

  const [activeMode, setActiveMode] = useState(token ? 'foryou' : 'toppicks')

  // === 3. SYNC HISTORY ON LOGIN/LOGOUT ===
  // When token changes, swap the viewed list immediately
  useEffect(() => {
      setActiveMode(token ? 'foryou' : 'toppicks');
      
      const key = getHistoryKey();
      try {
          const saved = JSON.parse(sessionStorage.getItem(key) || '[]');
          setViewedIds(new Set(saved));
      } catch {
          setViewedIds(new Set());
      }
      
      // Also reset limits when user state changes
      setRefreshCount(0);
      setIsRateLimited(false);
  }, [token, getHistoryKey]);

  const [label, setLabel] = useState('') 
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false) 
  
  // === 4. RATE LIMIT STATE ===
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0); 
  
  const COOLDOWN_MS = 30 * 60 * 1000; 
  // Dynamic Limit: 4 clicks for Mobile (FullPage), 8 for Desktop
  const TOP_PICKS_LIMIT = isFullPage ? 4 : 8;

  const pullStart = useRef(0);
  const pullRef = useRef(null);
  
  const VISIBLE_COUNT = isFullPage ? 8 : 4; 

  // === 5. RATE LIMIT LOGIC ===
  const getLimitKey = () => {
      if (activeMode === 'foryou') return 'rec_limit_foryou';
      return token ? 'rec_limit_toppicks_auth' : 'rec_limit_toppicks_guest';
  }

  useEffect(() => {
      checkRateLimit();
      setCurrentIndex(0);
      // We don't reset refreshCount here (handled in token effect or manually)
  }, [activeMode, token]);

  const checkRateLimit = () => {
      const storageKey = getLimitKey();
      const lockUntil = localStorage.getItem(storageKey);
      
      if (lockUntil) {
          const remaining = parseInt(lockUntil) - Date.now();
          if (remaining > 0) {
              setIsRateLimited(true);
              setTimeout(() => {
                  setIsRateLimited(false);
                  localStorage.removeItem(storageKey);
                  if(activeMode === 'toppicks') setRefreshCount(0);
              }, remaining);
          } else {
              setIsRateLimited(false);
              localStorage.removeItem(storageKey);
              if(activeMode === 'toppicks') setRefreshCount(0);
          }
      } else {
          setIsRateLimited(false);
      }
  }

  const setCooldown = () => {
      const storageKey = getLimitKey();
      const unlockTime = Date.now() + COOLDOWN_MS;
      localStorage.setItem(storageKey, unlockTime.toString());
      setIsRateLimited(true);
  }

  const getHiddenList = () => {
      const key = getHistoryKey();
      try { return JSON.parse(sessionStorage.getItem(key) || '[]'); } catch { return [] }
  }

  const hidePostGlobally = (id) => {
      const key = getHistoryKey();
      const current = getHiddenList();
      if (!current.includes(id)) {
          sessionStorage.setItem(key, JSON.stringify([...current, id]));
      }
  }

  // === 6. FETCH LOGIC ===
  const fetchRecs = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    else setRefreshing(true)

    const timestamp = Date.now();
    let endpoint = (activeMode === 'foryou' && token)
        ? `recommendations/?_t=${timestamp}` 
        : `posts/?ordering=-views&_t=${timestamp}`;

    try {
        let res = await api.get(endpoint)
        let data = res.data.posts || res.data.results || res.data || [];
        
        let currentLabel = "";
        if (res.data.label) currentLabel = res.data.label;
        
        // NO FILTERING HERE (Prevents "Vanishing" issue)
        if (activeMode === 'foryou' && token) {
            data = data.slice(0, 8);
        } else {
            data = data.slice(0, 32);
        }

        const remainder = data.length % VISIBLE_COUNT;
        if (remainder !== 0 && data.length > VISIBLE_COUNT) {
            data = data.slice(0, data.length - remainder);
        }

        setAllPosts(data) 
        setLabel(currentLabel)
        setCurrentIndex(0) 

    } catch (err) {
        console.error("Error fetching recs", err)
    } finally {
        setLoading(false)
        setRefreshing(false)
    }
  }, [token, isFullPage, activeMode]); 

  // === 7. REFRESH BUTTON LOGIC ===
  const handleRefreshCycle = () => {
      if (isRateLimited) return;

      setRefreshing(true);

      setTimeout(() => {
          const nextIndex = currentIndex + VISIBLE_COUNT;

          if (activeMode === 'foryou') {
              if (nextIndex >= allPosts.length) {
                  setCooldown();
                  setRefreshing(false);
              } else {
                  setCurrentIndex(nextIndex);
                  setRefreshing(false);
              }
          } else {
              const newCount = refreshCount + 1;
              setRefreshCount(newCount);

              // Use Dynamic Limit (4 or 8)
              if (newCount >= TOP_PICKS_LIMIT) {
                  setCooldown();
                  setRefreshing(false);
              } else {
                  if (nextIndex >= allPosts.length) {
                      setCurrentIndex(0);
                  } else {
                      setCurrentIndex(nextIndex);
                  }
                  setRefreshing(false);
              }
          }
      }, 300);
  };

  const handleSeenPost = (id) => {
      setViewedIds(prev => new Set(prev).add(id));
      hidePostGlobally(id);
  }

  // === 8. LISTENERS ===
  useEffect(() => {
    fetchRecs(); 
    
    // HANDLE DELETE: Remove immediately from the list
    const handleRemoteDelete = (e) => {
        const id = Number(e.detail);
        
        // 1. Remove from the local state immediately
        setAllPosts(prev => prev.filter(p => p.id !== id));
        
        // 2. Also mark as hidden in storage (just to be safe/clean)
        hidePostGlobally(id);
    }

    const handleRemoteCreate = () => { fetchRecs(true); };
    
    const handleRemoteView = (e) => {
        const id = Number(e.detail);
        handleSeenPost(id);
    };

    window.addEventListener('postDeleted', handleRemoteDelete);
    window.addEventListener('postCreated', handleRemoteCreate);
    window.addEventListener('postViewed', handleRemoteView);

    return () => {
        window.removeEventListener('postDeleted', handleRemoteDelete);
        window.removeEventListener('postCreated', handleRemoteCreate);
        window.removeEventListener('postViewed', handleRemoteView);
    };
  }, [fetchRecs, activeMode])

  const handlePostClick = (postId) => {
      onPostClick(postId);
      handleSeenPost(postId);
  };

  const displayedRecs = allPosts.slice(currentIndex, currentIndex + VISIBLE_COUNT);

  const allDisplayedAreSeen = displayedRecs.length > 0 && displayedRecs.every(p => viewedIds.has(p.id));
  const isAtEndOfForYou = activeMode === 'foryou' && (currentIndex + VISIBLE_COUNT >= allPosts.length);

  const showCaughtUp = isRateLimited || (
      activeMode === 'foryou' && 
      (allPosts.length === 0 || (isAtEndOfForYou && allDisplayedAreSeen))
  );

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${API_URL}${path}`;
  }

  const handleTouchStart = (e) => {
      if (!isFullPage || isRateLimited) return; 
      if (window.scrollY === 0 && (!pullRef.current || pullRef.current.scrollTop === 0)) {
        pullStart.current = e.targetTouches[0].clientY;
      }
  }

  const handleTouchEnd = (e) => {
      if (!isFullPage || isRateLimited) return;
      const touchEnd = e.changedTouches[0].clientY;
      const pullDistance = touchEnd - pullStart.current;
      if (pullStart.current > 0 && pullDistance > 100) {
          handleRefreshCycle(); 
      }
      pullStart.current = 0; 
  }

  if (loading && !refreshing) return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 p-6 shadow-sm space-y-4 ${isFullPage ? 'min-h-[50vh]' : ''}`}>
        <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4 pt-2">
            {[...Array(VISIBLE_COUNT)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )

  return (
    <div 
        ref={pullRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`transition-all duration-300 overflow-hidden
            ${isFullPage 
                ? 'w-full min-h-[80vh]' 
                : 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md' 
            }`}
    >
      {refreshing && (
          <div className="flex justify-center py-4">
               <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      )}

      {/* === HEADER === */}
      <div className={`flex justify-between items-center transition-colors 
            ${isFullPage 
                ? 'bg-transparent border-b border-gray-300 dark:border-gray-800 mb-2 p-3 md:p-5' // Mobile: Compact
                : 'border-b border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-5' // Desktop: Standard
            }`}>
        
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${isFullPage ? 'text-2xl' : 'text-base'}`}>
            {activeMode === 'foryou' ? (
                <>
                    {/* SVG Hidden on Mobile */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`hidden sm:block ${isFullPage ? 'w-6 h-6' : 'w-5 h-5'} text-purple-600 dark:text-purple-400`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    For You
                </>
            ) : (
                <>
                    {/* SVG Hidden on Mobile */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`hidden sm:block ${isFullPage ? 'w-6 h-6' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
                    </svg>
                    Top Picks
                </>
            )}
        </h3>

        {/* SWITCH */}
        {token && (
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5 relative">
                <button
                    onClick={() => setActiveMode('foryou')}
                    className={`relative z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${
                        activeMode === 'foryou' 
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    For You
                </button>
                <button
                    onClick={() => setActiveMode('toppicks')}
                    className={`relative z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${
                        activeMode === 'toppicks' 
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    Top
                </button>
            </div>
        )}
      </div>
      
      <div className={`divide-y divide-gray-300 dark:divide-gray-700 ${isFullPage ? '' : ''}`}>
        {displayedRecs.map((post, index) => {
            const isDeleted = post.author_username === "Deleted User";
            const isViewed = viewedIds.has(post.id);

            return (
              <div 
                key={post.id} 
                onClick={() => handlePostClick(post.id)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer group flex gap-3 items-start ${isFullPage ? 'py-5' : ''}`}
              >
                 <div className={`w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center 
                    ${isDeleted ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    
                    {isDeleted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400 dark:text-gray-500">
                            <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725 7.38l.108.537a.75.75 0 0 1-.826.89h-1.296l-1.38 5.176a9.499 9.499 0 0 1-5.69 6.666l-.1.026-.062.016a.75.75 0 0 1-.762-.317l-1.87-2.906a.75.75 0 0 1 .15-1.042l3.41-2.436a13.91 13.91 0 0 1-5.118-2.616l-1.854 1.325a.75.75 0 0 1-1.042-.15l-1.87-2.907a.75.75 0 0 1 .05-.98l.061-.065a9.499 9.499 0 0 1 5.92-2.126l1.378-5.176H9.366a.75.75 0 0 1-.826-.89l.108-.536a9.75 9.75 0 0 1 6.725-7.38l1.838.46v-.54a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                        </svg>
                    ) : post.author_image ? (
                        <img 
                            src={getImageUrl(post.author_image)} 
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100" 
                            alt=""
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                            {post.author_username?.[0].toUpperCase()}
                        </div>
                    )}
                 </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {post.topic_name && (
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">
                                {post.topic_name}
                            </span>
                        )}
                        {token && post.relevance >= 5 && activeMode === 'foryou' && (
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-500">
                               <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                             </svg>
                        )}
                    </div>

                    <h4 className={`font-bold leading-snug transition mb-1 line-clamp-2 ${isFullPage ? 'text-base' : 'text-sm'}
                        ${isViewed 
                            ? 'text-gray-500 dark:text-gray-600 font-normal' 
                            : 'text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                        }
                    `}>
                        {post.title}
                    </h4>

                    <p className="text-xs text-gray-600 dark:text-gray-500 truncate">
                        by {isDeleted ? <span className="italic">Deleted User</span> : post.author_username}
                    </p>
                </div>
              </div>
            )
        })}
      </div>
      
      {/* === FOOTER AREA (ALWAYS VISIBLE) === */}
      <div className={`p-3 text-center border-t border-gray-300 dark:border-gray-700 
            ${isFullPage 
                ? 'bg-transparent pb-8 pt-4' // Mobile: Extra padding at bottom, transparent
                : 'bg-gray-50 dark:bg-gray-900/30' // Desktop: Sidebar style
            }`}>
        {showCaughtUp ? (
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 py-1 flex items-center justify-center gap-1 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg>
                <span>You're all caught up!</span>
            </div>
        ) : (
            <button 
                onClick={handleRefreshCycle}
                disabled={refreshing}
                className={`text-xs font-bold transition flex items-center justify-center gap-1 w-full disabled:opacity-50
                    ${isFullPage 
                        ? 'py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl' // Mobile: Chunky button
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white' // Desktop: Text
                    }`}
            >
                {refreshing ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                )}
                <span>Refresh list</span>
            </button>
        )}
      </div>
    </div>
  )
}