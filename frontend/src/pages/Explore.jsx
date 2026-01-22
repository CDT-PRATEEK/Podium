import { useState, useEffect, useRef, useCallback } from 'react'
import { postService } from '../services/postService'
import { API_URL } from '../config';

// COMPONENTS
import Recommendations from '../components/Recommendations'
import TopicGrid from '../components/TopicGrid'
import CommentSection from '../components/CommentSection'

// STATIC DATA
const TOPIC_LABELS = {
  'TECH': 'Technology', 'PHIL': 'Philosophy', 'SCI': 'Science',
  'SOC': 'Society', 'ART': 'Art & Culture', 'LIFE': 'Life & Self'
}

export default function Explore({ 
    token, 
    currentUser, 
    showToast,
    onPostClick,    
    onProfileClick,
    setView 
}) {
  const [searchText, setSearchText] = useState('')   
  const [selectedTopic, setSelectedTopic] = useState(null) 
  
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  
  // INFINITE SCROLL STATE
  const [nextPage, setNextPage] = useState(null)

  // === ICON HELPER ===
  const getTopicIcon = (id) => {
    switch(id) {
        case 'TECH': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg>;
        case 'PHIL': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.854 1.591-2.16 1.115-.366 1.913-1.423 1.913-2.647 0-1.356-.91-2.527-2.223-2.863A4.48 4.48 0 0 0 13.5 10a4.48 4.48 0 0 0-4.5 3.5c-.34 1.336 1.63 1.63 1.63 2.5 0 1.356.91 2.527 2.223 2.863.367.094.74.143 1.115.143 1.357 0 2.528-.91 2.863-2.223Z" /></svg>;
        case 'SCI':  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>;
        case 'SOC':  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
        case 'ART':  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.418a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>;
        case 'LIFE': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
        default: return null;
    }
  }

  // === FETCH LOGIC ===
  useEffect(() => {
    if (!searchText && !selectedTopic) {
        setPosts([])
        setNextPage(null)
        return
    }

    setLoading(true)
    setPosts([]) 
    
    let queryParam = ''
    
    if (searchText) {
        queryParam = `?search=${searchText}`
        if (selectedTopic) queryParam += `&topic=${selectedTopic}`
    } else if (selectedTopic) {
        queryParam = `?topic=${selectedTopic}`
    }
    
    const timer = setTimeout(() => {
        postService.getFeed(`posts/${queryParam}`)
        .then(data => {
            if (data.results) {
                setPosts(data.results)
                setNextPage(data.next) 
            } else {
                setPosts(data)
                setNextPage(null)
            }
            setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 500) 

    return () => clearTimeout(timer)
  }, [searchText, selectedTopic])


  // === INFINITE SCROLL OBSERVER ===
  const observer = useRef()
  const lastPostElementRef = useCallback(node => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPage) {
        const nextUrl = nextPage.replace(/^https?:\/\/[^\/]+\/api\//, '');
        postService.getFeed(nextUrl)
          .then(data => {
            setPosts(prev => [...prev, ...data.results])
            setNextPage(data.next)
          })
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, nextPage])


  // === HANDLERS ===
  const handleSearchInput = (e) => {
      setSearchText(e.target.value)
  }

  const handleTopicClick = (topicId) => {
      setSelectedTopic(topicId)
      setSearchText('') 
      window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
      setSearchText('')
      setSelectedTopic(null)
      setPosts([])
      setNextPage(null)
  }

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${API_URL}${path}`;
  }

  // === HANDLE BOOKMARK ===
  const handleBookmark = async (postId) => {
    if (!token) {
        if (showToast) showToast("Login to bookmark posts", "error");
        return;
    }
    try {
        const res = await postService.toggleBookmark(postId);
        // Use server response as truth
        const isNowBookmarked = res.data.is_bookmarked;
        
        // Optimistically update UI
        setPosts(prevPosts => prevPosts.map(p => 
            p.id === postId ? { ...p, is_bookmarked: isNowBookmarked } : p
        ));
        
        if (showToast) showToast(isNowBookmarked ? "Saved to Library" : "Removed from Library", "success");
    } catch (err) {
        if (showToast) showToast("Failed to bookmark", "error");
    }
  };

  return (
    <div>
        {/* 1. STICKY SEARCH BAR */}
            <div className="mb-8 sticky top-0 bg-white dark:bg-black pt-4 pb-4 z-20 transition-colors duration-300">
                <div className="relative group">
                    <input 
                        className="w-full p-3 pl-11 pr-11 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm sm:text-base md:text-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        type="text" 
                        placeholder={selectedTopic ? `Search in ${TOPIC_LABELS[selectedTopic]}...` : "Search topics, tags, or people..."} 
                        value={searchText} 
                        onChange={handleSearchInput} 
                    />
                    
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                    
                    {(searchText || selectedTopic) && (
                        <button 
                            onClick={clearFilters}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-gray-800 w-7 h-7 rounded-full flex items-center justify-center transition"
                            title="Clear all filters"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {selectedTopic && (
                    <div className="mt-3 flex items-center gap-2 animate-fade-in-down overflow-hidden">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Viewing:</span>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm shrink-0">
                            {getTopicIcon(selectedTopic)}
                            {TOPIC_LABELS[selectedTopic]} 
                            <button 
                                onClick={() => setSelectedTopic(null)} 
                                className="hover:bg-blue-700 rounded-full p-0.5 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    </div>
                )}
            </div>

        {/* 2. DASHBOARD */}
        {!searchText && !selectedTopic && (
            <div className="animate-fade-in space-y-10">
                <TopicGrid onTopicClick={handleTopicClick} />
            </div>
        )}

        {/* 3. RESULTS FEED */}
        {(searchText || selectedTopic) && (
            <div className="space-y-6 animate-fade-in-up">
                
                <div className="flex items-center justify-between mb-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Results</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {loading ? 'Searching...' : `${posts.length} matches found`}
                    </span>
                </div>

                {posts.map((post, index) => {
                    const isLastPost = posts.length === index + 1
                    
                    // === GHOST LOGIC ===
                    const isDeleted = post.author_username === "Deleted User";

                    return (
                        <div 
                            ref={isLastPost ? lastPostElementRef : null} 
                            key={post.id} 
                            className="group relative bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] transition"
                        >
                            <div className="p-6">
                                
                                {/* 1. TOP ROW: TAG + BOOKMARK */}
                                <div className="flex justify-between items-start mb-2">
                                    {/* Left: Tag */}
                                    <div className="h-6 flex items-center">
                                        {post.topic_name && (
                                            <span className="tag-topic">
                                                {post.topic_name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Right: Bookmark */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleBookmark(post.id); }}
                                        className={`p-2 -mr-2 -mt-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${post.is_bookmarked ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 opacity-100' : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                        title={post.is_bookmarked ? "Remove from Library" : "Save to Library"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill={post.is_bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* 2. TITLE */}
                                <h3 
                                    className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight cursor-pointer hover:text-blue-600 dark:hover:!text-blue-400 transition break-words whitespace-normal"
                                    onClick={() => onPostClick && onPostClick(post.id)}
                                >
                                    {post.title}
                                </h3>

                                 {/* 3. AUTHOR ROW (Avatar, Name, Date) - MOVED DOWN */}
                                 <div className="flex items-center gap-3 mb-4">
                                     
                                     {/* AVATAR */}
                                     <div 
                                        className={`w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 transition flex items-center justify-center flex-shrink-0
                                            ${isDeleted ? 'cursor-default bg-gray-100 dark:bg-gray-800' : 'cursor-pointer hover:opacity-80'}`}
                                        onClick={() => { if(!isDeleted) onProfileClick && onProfileClick(post.author_username) }}
                                     >
                                         {isDeleted ? (
                                            /* Ghost Icon */
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 dark:text-gray-500">
                                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725 7.38l.108.537a.75.75 0 0 1-.826.89h-1.296l-1.38 5.176a9.499 9.499 0 0 1-5.69 6.666l-.1.026-.062.016a.75.75 0 0 1-.762-.317l-1.87-2.906a.75.75 0 0 1 .15-1.042l3.41-2.436a13.91 13.91 0 0 1-5.118-2.616l-1.854 1.325a.75.75 0 0 1-1.042-.15l-1.87-2.907a.75.75 0 0 1 .05-.98l.061-.065a9.499 9.499 0 0 1 5.92-2.126l1.378-5.176H9.366a.75.75 0 0 1-.826-.89l.108-.536a9.75 9.75 0 0 1 6.725-7.38l1.838.46v-.54a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                            </svg>
                                         ) : post.author_image ? (
                                             <img src={getImageUrl(post.author_image)} className="w-full h-full object-cover" alt="avatar" />
                                         ) : (
                                             <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                 {post.author_username?.[0].toUpperCase()}
                                             </div>
                                         )}
                                     </div>

                                     <div className="flex flex-col">
                                         {/* NAME */}
                                         {isDeleted ? (
                                            <span className="font-bold text-gray-400 italic text-xs sm:text-sm cursor-default select-none whitespace-nowrap">
                                                Deleted User
                                            </span>
                                         ) : (
                                            <span 
                                                className="font-bold text-gray-800 dark:text-white text-xs sm:text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                                onClick={() => onProfileClick && onProfileClick(post.author_username)}
                                            >
                                                 {post.author_username}
                                            </span>
                                         )}
                                         
                                         <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{new Date(post.date_posted).toLocaleDateString()}</span>
                                     </div>
                                 </div>

                                {/* 4. CONTENT PREVIEW */}
                                <div 
                                    className="text-gray-600 dark:text-gray-300 line-clamp-3 prose prose-sm dark:prose-invert max-w-none cursor-pointer feed-summary break-words whitespace-normal" 
                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                    onClick={() => onPostClick && onPostClick(post.id)} 
                                />

                                <button 
                                    onClick={() => onPostClick && onPostClick(post.id)} 
                                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline mt-2 mb-4"
                                >
                                    Read full post →
                                </button>
                            </div>
                            
                            <div className="px-6 pb-6 bg-gray-50/50 dark:bg-black border-t border-gray-100 dark:border-gray-800 transition-colors">
                                <CommentSection 
                                    postId={post.id} 
                                    postAuthor={post.author_username} 
                                    token={token} 
                                    currentUser={currentUser} 
                                    onProfileClick={onProfileClick}
                                    setView={setView}
                                />
                            </div>
                        </div>
                    )
                })}

                {!loading && posts.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 border-dashed">
                        <div className="flex justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-200 dark:text-gray-700">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <p className="text-xl font-medium text-gray-600 dark:text-gray-400">No matches found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                        <button onClick={clearFilters} className="mt-6 text-blue-600 dark:text-blue-400 font-bold hover:underline text-sm">Clear Filters</button>
                    </div>
                )}

                {loading && (
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  )
}