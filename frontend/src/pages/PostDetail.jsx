import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { postService } from '../services/postService' 
import CommentSection from '../components/CommentSection'
import { API_URL } from '../config';

function PostDetail({ 
    postId, 
    token, 
    currentUser, 
    userProfile, 
    onBack, 
    onProfileClick, 
    focusComments,
    showToast,
    setView 
}) { 
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [readTime, setReadTime] = useState(1) 
  
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    
    api.get(`posts/${postId}/`)
      .then(res => {
        setPost(res.data)
        setIsBookmarked(res.data.is_bookmarked)
        
        if (res.data.content) {
            const text = res.data.content.replace(/<[^>]*>?/gm, '') 
            const words = text.split(/\s+/).length
            const minutes = Math.ceil(words / 200)
            setReadTime(minutes)
        }
        
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [postId])

  const getTags = (tags) => {
      if (!tags) return []
      if (Array.isArray(tags)) return tags
      return tags.split(',') 
  }

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${API_URL}${path}`;
  }


const viewRecordedId = useRef(null);

useEffect(() => {
        // 1. Check if we have a valid post and token
        if (token && post && post.id) {
            
            // 2. CRITICAL CHECK: Only run if we haven't recorded THIS specific ID yet
            if (viewRecordedId.current !== post.id) {
                
                console.log(` Recording view for Post ${post.id}...`);
                
                api.post(`posts/${post.id}/record_view/`)
                   .then(() => console.log(" View Success"))
                   .catch(err => console.error(" View Error", err));

                // 3. Mark this ID as recorded immediately
                viewRecordedId.current = post.id;
            }
        }
    }, [post?.id, token]);



  const handleBookmark = async () => {
    if (!token) {
        showToast("Login to bookmark posts", "error");
        return;
    }
    try {
        await postService.toggleBookmark(postId);
        setIsBookmarked(!isBookmarked); 
        showToast("Library updated", "success");
    } catch (err) {
        showToast("Failed to update bookmark", "error");
    }
  };

  const handleDeletePost = async () => {
      if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
      
      try {
          await api.delete(`posts/${postId}/`)
          onBack() 
          window.location.reload() 
      } catch (err) {
          console.error(err)
          alert("Failed to delete post.")
      }
  }

  const isOwner = currentUser === post?.author_username
  const isModerator = userProfile?.is_moderator
  const canDelete = isOwner || isModerator

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading Content...</div>
    </div>
  )
  
  if (!post) return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Post not found.</div>
    </div>
  )

  // === DEFINE GHOST STATUS HERE ===
  const isDeleted = post.author_username === "Deleted User";

  return (
    <div className="animate-fade-in pb-24 bg-white dark:bg-[#111827] min-h-screen transition-colors duration-300">
      
      {/* === STICKY HEADER === */}
      <div className="sticky top-16 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-3 md:py-4 px-4 md:px-6 mb-6 md:mb-8 flex items-center justify-between z-30 transition-colors shadow-sm">
        
        <button 
            onClick={onBack} 
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold flex items-center gap-2 transition group text-sm"
        >
            <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
            </div>
            <span>Back</span>
        </button>
        
        <div className="flex items-center gap-3 md:gap-4">
            <button 
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors ${
                    isBookmarked 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={isBookmarked ? "Remove Bookmark" : "Save Post"}
            >
                 <svg xmlns="http://www.w3.org/2000/svg" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                 </svg>
            </button>

            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest hidden sm:block">
                {post.topic_name || 'Article'}
            </div>

            {canDelete && (
                 <button 
                    onClick={handleDeletePost}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-700 transition border border-red-100 dark:border-red-900/30"
                    title="Delete Post"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    <span className="hidden sm:inline">Delete</span>
                 </button>
            )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <article className="max-w-3xl mx-auto px-4 md:px-6">
        
        <div className="mb-8 md:mb-10 text-left">
            <div className="flex flex-wrap gap-2 justify-start mb-4 md:mb-6">
                {post.topic_name && (
                    <span className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">
                        {post.topic_name}
                    </span>
                )}
                
                {getTags(post.tags).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] md:text-xs font-bold rounded-md border border-blue-100 dark:border-blue-900/50">
                        #{tag.trim()}
                    </span>
                ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 md:mb-8 text-fix">
                {post.title}
            </h1>

            {/* === AUTHOR HEADER (GHOST LOGIC ) === */}
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 md:pb-8">
                
                {/* 1. AVATAR */}
                <div 
                    onClick={() => { if(!isDeleted) onProfileClick(post.author_username) }} 
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-center
                        ${isDeleted ? 'cursor-default bg-gray-100 dark:bg-gray-800' : 'cursor-pointer hover:opacity-80 transition'}`}
                >
                    {isDeleted ? (
                         /* Ghost Icon */
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400 dark:text-gray-500">
                           <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725 7.38l.108.537a.75.75 0 0 1-.826.89h-1.296l-1.38 5.176a9.499 9.499 0 0 1-5.69 6.666l-.1.026-.062.016a.75.75 0 0 1-.762-.317l-1.87-2.906a.75.75 0 0 1 .15-1.042l3.41-2.436a13.91 13.91 0 0 1-5.118-2.616l-1.854 1.325a.75.75 0 0 1-1.042-.15l-1.87-2.907a.75.75 0 0 1 .05-.98l.061-.065a9.499 9.499 0 0 1 5.92-2.126l1.378-5.176H9.366a.75.75 0 0 1-.826-.89l.108-.536a9.75 9.75 0 0 1 6.725-7.38l1.838.46v-.54a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                         </svg>
                    ) : post.author_image ? (
                        <img src={getImageUrl(post.author_image)} className="w-full h-full object-cover" alt={post.author_username} />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm md:text-lg">
                            {post.author_username?.[0].toUpperCase()}
                        </div>
                    )}
                </div>
                
                {/* 2. NAME */}
                <div className="text-left">
                    {isDeleted ? (
                        <p className="font-medium text-gray-400 italic text-base md:text-lg leading-none cursor-default select-none">
                            Deleted User
                        </p>
                    ) : (
                        <p 
                            onClick={() => onProfileClick(post.author_username)} 
                            className="font-bold text-gray-900 dark:text-white text-base md:text-lg leading-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition hover:underline"
                        >
                            {post.author_username}
                        </p>
                    )}
                    
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(post.date_posted).toLocaleDateString()} · {readTime} min read
                    </p>
                </div>
            </div>
        </div>

        {/* Post Content */}
        <div 
            className="prose prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none text-fix overflow-hidden text-gray-800 dark:text-gray-200 leading-relaxed mb-12 md:mb-16" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {/* Discussion Section */}
        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl p-4 md:p-8 border border-gray-100 dark:border-gray-800 transition-colors">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Discussion</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-xs md:text-sm">Join the conversation with the community.</p>
            
            <CommentSection 
                postId={post.id} 
                postAuthor={post.author_username} 
                token={token} 
                currentUser={currentUser} 
                onProfileClick={onProfileClick}
                isModerator={userProfile?.is_moderator} 
                startOpen={focusComments} 
                showToast={showToast}
                setView={setView}
            />
        </div>
      </article>
    </div>
  )
}

export default PostDetail