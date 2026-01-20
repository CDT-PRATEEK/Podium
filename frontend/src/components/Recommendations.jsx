import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { API_URL } from '../config';

// isFullPage (defaults to false so Desktop stays the same)
export default function Recommendations({ onPostClick, token, isFullPage = false }) {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false) 
  const [error, setError] = useState(false)

  // === PULL TO REFRESH REFS ===
  const pullStart = useRef(0);
  const pullRef = useRef(null);

  // Determine how many to show
  const LIMIT = isFullPage ? 20 : 5; 

  const fetchRecs = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    else setRefreshing(true)
    setError(false)

    const endpoint = token ? 'recommendations/' : 'posts/?ordering=-views';

    try {
        const res = await api.get(endpoint)
        let data = res.data.results || res.data;

        // === FIX: SHUFFLE THE DATA BEFORE SLICING ===
        if (data.length > 0) {
            data = data.sort(() => Math.random() - 0.5);
        }

        // NOW slice the shuffled list
        setRecs(data.slice(0, LIMIT)) 
    } catch (err) {
        console.error("Failed to load recs", err)
        setError(true)
    } finally {
        setLoading(false)
        setRefreshing(false)
    }
  }

  
  useEffect(() => {
    fetchRecs()
  }, [token])

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${API_URL}${path}`;
  }

  // === SWIPE LOGIC (Only active if isFullPage is true) ===
  const handleTouchStart = (e) => {
      if (!isFullPage) return; // Disable on desktop widget
      if (window.scrollY === 0 && (!pullRef.current || pullRef.current.scrollTop === 0)) {
        pullStart.current = e.targetTouches[0].clientY;
      }
  }

  const handleTouchEnd = (e) => {
      if (!isFullPage) return;
      const touchEnd = e.changedTouches[0].clientY;
      const pullDistance = touchEnd - pullStart.current;
      if (pullStart.current > 0 && pullDistance > 100) {
          fetchRecs(true); 
      }
      pullStart.current = 0; 
  }

  // --- 1. LOADING STATE ---
  if (loading && !refreshing) return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4 ${isFullPage ? 'min-h-[50vh]' : ''}`}>
        <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4 pt-2">
            {[...Array(isFullPage ? 8 : 3)].map((_, i) => (
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

  if (error) return null;

  if (recs.length === 0) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Trending</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No stories yet.</p>
    </div>
  )

  // --- 4. MAIN UI ---
  return (
    <div 
        ref={pullRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        // If full page, remove borders/shadows to look like a mobile feed. If desktop, keep card look.
        className={`transition-all duration-300 overflow-hidden
            ${isFullPage 
                ? 'w-full min-h-[80vh]' // Mobile View Styling
                : 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md' // Desktop Widget Styling
            }`}
    >
      {/* PULL INDICATOR */}
      {refreshing && (
          <div className="flex justify-center py-4">
               <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      )}

      {/* Header */}
      <div className={`p-5 flex justify-between items-center transition-colors 
            ${isFullPage 
                ? 'bg-transparent border-b border-gray-100 dark:border-gray-800 mb-2' 
                : 'border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30'
            }`}>
        
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${isFullPage ? 'text-2xl' : 'text-base'}`}>
            {token ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${isFullPage ? 'w-6 h-6' : 'w-5 h-5'} text-purple-600 dark:text-purple-400`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    {isFullPage ? 'For You' : 'Recommended'}
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${isFullPage ? 'w-6 h-6' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
                    </svg>
                    Trending Now
                </>
            )}
        </h3>
      </div>
      
      {/* List */}
      <div className={`divide-y divide-gray-100 dark:divide-gray-700 ${isFullPage ? '' : ''}`}>
        {recs.map((post, index) => {
            // Check delete status
            const isDeleted = post.author_username === "Deleted User";

            return (
              <div 
                key={post.id} 
                onClick={() => onPostClick(post.id)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer group flex gap-3 items-start ${isFullPage ? 'py-5' : ''}`}
              >
                 {/* Thumbnail / Number */}
                 {/* We kept this SIMPLE: If no image (deleted or just no pic), show rank # */}
                 <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center font-bold text-gray-400 dark:text-gray-500 text-sm">
                    {post.author_image ? (
                        <img src={getImageUrl(post.author_image)} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                    ) : (
                        <span>#{index + 1}</span>
                    )}
                 </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {post.topic_name && (
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">
                                {post.topic_name}
                            </span>
                        )}
                        {token && post.relevance >= 5 && (
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-500">
                               <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                             </svg>
                        )}
                    </div>

                    <h4 className={`font-bold text-gray-800 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition mb-1 line-clamp-2 ${isFullPage ? 'text-base' : 'text-sm'}`}>
                        {post.title}
                    </h4>

                    {/* === ITALICIZE IF DELETED === */}
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        by {isDeleted ? <span className="italic">Deleted User</span> : post.author_username}
                    </p>
                </div>
              </div>
            )
        })}
      </div>
      
      {/* Footer / Refresh */}
      {!isFullPage && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/30 text-center border-t border-gray-100 dark:border-gray-700">
            <button 
                onClick={() => fetchRecs()}
                className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition flex items-center justify-center gap-1 w-full"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>Refresh list</span>
            </button>
          </div>
      )}
    </div>
  )
}