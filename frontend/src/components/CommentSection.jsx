import { useState, useEffect, useRef } from 'react'
import api from '../services/api' 

// Recursive Comment Component
function CommentItem({ 
    comment, 
    token, 
    currentUser,
    isModerator, 
    onReply, 
    onRefresh, 
    postAuthor, 
    onProfileClick,
    rootAuthor 
}) {
    const [showReplyBox, setShowReplyBox] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [areRepliesOpen, setAreRepliesOpen] = useState(false)

    // Permissions check
    const isOp = currentUser === postAuthor;
    const isMyComment = currentUser === comment.author;
    const isThreadOwner = currentUser === (rootAuthor || comment.author);
    const canReply = isOp || isThreadOwner;

    // === GHOST LOGIC ===
    const isDeleted = comment.author === "Deleted User";

    // Handle reply submission
    const handleReplySubmit = async (e) => {
        e.preventDefault()
        const success = await onReply(comment.id, replyText)
        if (success) {
            setReplyText('')
            setShowReplyBox(false)
            setAreRepliesOpen(true) 
        }
    }

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await api.delete(`comments/${comment.id}/`)
            onRefresh() 
        } catch (err) {
            alert("Failed to delete comment.")
        }
    }

    return (
        <div className="flex gap-2 md:gap-3 items-start group mb-3 md:mb-4 w-full max-w-full">
            {/* Avatar */}
            <div 
                className={`w-7 h-7 md:w-9 md:h-9 flex-shrink-0 transition rounded-full overflow-hidden border border-white dark:border-gray-600 shadow-sm flex items-center justify-center
                    ${isDeleted ? 'cursor-default bg-gray-100 dark:bg-gray-800' : 'cursor-pointer hover:opacity-80 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600'}`}
                onClick={() => { if(!isDeleted) onProfileClick(comment.author) }} 
            >
                {isDeleted ? (
                    /* Ghost Icon */
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-gray-500">
                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725 7.38l.108.537a.75.75 0 0 1-.826.89h-1.296l-1.38 5.176a9.499 9.499 0 0 1-5.69 6.666l-.1.026-.062.016a.75.75 0 0 1-.762-.317l-1.87-2.906a.75.75 0 0 1 .15-1.042l3.41-2.436a13.91 13.91 0 0 1-5.118-2.616l-1.854 1.325a.75.75 0 0 1-1.042-.15l-1.87-2.907a.75.75 0 0 1 .05-.98l.061-.065a9.499 9.499 0 0 1 5.92-2.126l1.378-5.176H9.366a.75.75 0 0 1-.826-.89l.108-.536a9.75 9.75 0 0 1 6.725-7.38l1.838.46v-.54a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <div className="text-[10px] md:text-xs font-bold text-gray-600 dark:text-gray-200">
                        {comment.author[0].toUpperCase()}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0"> 
                {/* Comment Bubble */}
                <div className="bg-gray-50 dark:bg-gray-800 p-2.5 md:p-3.5 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 relative group-hover:border-gray-200 dark:group-hover:border-gray-600 transition">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex gap-2 items-center overflow-hidden">
                            {isDeleted ? (
                                <span className="font-bold text-xs md:text-sm text-gray-400 italic cursor-default select-none">
                                    Deleted User
                                </span>
                            ) : (
                                <span 
                                    className="font-bold text-xs md:text-sm text-gray-800 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition truncate"
                                    onClick={() => onProfileClick(comment.author)} 
                                >
                                    {comment.author}
                                </span>
                            )}
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{new Date(comment.date_posted).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Delete Button */}
                        {(isMyComment || isModerator) && (
                            <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition opacity-100">
                                <button onClick={handleDelete} className="text-gray-400 hover:text-red-600 transition p-1" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">{comment.text}</p>
                </div>

                {/* Action Bar */}
                <div className="flex gap-4 mt-1.5 ml-1 items-center">
                    {token && canReply && (
                        <button 
                            onClick={() => setShowReplyBox(!showReplyBox)} 
                            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 py-1 px-1"
                        >
                            Reply
                        </button>
                    )}

                    {comment.replies && comment.replies.length > 0 && (
                        <button 
                            onClick={() => setAreRepliesOpen(!areRepliesOpen)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 py-1 px-1"
                        >
                            {areRepliesOpen ? 'Hide' : `${comment.replies.length} replies`}
                        </button>
                    )}
                </div>

                {/* === REPLY INPUT (Unified Style) === */}
                {showReplyBox && (
                    <form onSubmit={handleReplySubmit} className="mt-3 relative animate-fade-in-down w-full">
                        <input 
                            type="text" 
                            className="w-full pl-4 pr-16 py-2.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition shadow-sm"
                            placeholder={`Reply...`}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={!replyText.trim()}
                            className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center
                                bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-200
                                ${!replyText.trim() ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 shadow-sm'}
                            `}
                        >
                            Send
                        </button>
                    </form>
                )}

                {/* Nested Replies */}
                {areRepliesOpen && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-2 md:pl-6 border-l-2 border-gray-100 dark:border-gray-700 animate-fade-in-down w-full">
                        {comment.replies.map(reply => (
                            <CommentItem 
                                key={reply.id} 
                                comment={reply} 
                                token={token} 
                                currentUser={currentUser} 
                                isModerator={isModerator} 
                                onReply={onReply}
                                onRefresh={onRefresh}
                                postAuthor={postAuthor}
                                onProfileClick={onProfileClick}
                                rootAuthor={rootAuthor || comment.author} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Main Container Component
function CommentSection({ 
    postId, 
    postAuthor, 
    token, 
    currentUser, 
    isModerator, 
    onProfileClick,
    startOpen = false, 
    showToast,
    setView
}) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isOpen, setIsOpen] = useState(startOpen)
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const sectionRef = useRef(null)

  useEffect(() => {
    if (startOpen) {
        setIsOpen(true)
        setTimeout(() => {
            sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
    }
  }, [startOpen]) 

  const fetchComments = () => {
      api.get(`comments/?post_id=${postId}`)
        .then(res => {
            if (res.data.results) {
                setComments(res.data.results)
                setNextPage(res.data.next)
            } else {
                setComments(res.data)
                setNextPage(null)
            }
        })
        .catch(err => console.error(err))
  }

  const handleLoadMore = () => {
    if (!nextPage) return;
    setLoadingMore(true)
    const relativeUrl = nextPage.replace(/^https?:\/\/[^\/]+\/api\//, '');
    api.get(relativeUrl)
        .then(res => {
            setComments(prev => [...prev, ...res.data.results])
            setNextPage(res.data.next)
            setLoadingMore(false)
        })
        .catch(err => {
            console.error(err)
            setLoadingMore(false)
        })
  }

  useEffect(() => {
    if (isOpen) {
        fetchComments()
    }
  }, [postId, isOpen])

  const postComment = async (parentId = null, text) => {
    if (!text.trim()) return false

    try {
        const payload = { post: postId, text: text, parent: parentId }
        await api.post('comments/', payload)
        
        fetchComments() 
        
        if (!parentId) setNewComment('') 
        
        if (showToast) {
            const message = parentId ? "Reply posted!" : "Comment posted!";
            showToast(message, "success");
        }
        
        return true

    } catch (err) {
        console.error(err)
        const errorMessage = err.response?.data?.detail || "Failed to post.";
        if (showToast) showToast(errorMessage, 'error'); else alert(errorMessage);
        return false
    }
  }

  return (
    <div ref={sectionRef} className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition w-full md:w-auto"
      >
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <span>Comments</span>
        </div>
        <span className="text-gray-400 ml-auto md:ml-0">
            {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            )}
        </span>
      </button>

      {isOpen && (
        <div className="mt-6 animate-fade-in w-full">
            
            {/* === MAIN COMMENT INPUT (Unified) === */}
            {token ? (
                <div className="relative w-full mb-6 md:mb-8">
                    <input 
                        className="w-full pl-5 pr-20 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition text-sm shadow-sm"
                        type="text" 
                        placeholder="Write a comment..." 
                        value={newComment} 
                        onChange={e => setNewComment(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && postComment(null, newComment)}
                    />
                    <button 
                        onClick={() => postComment(null, newComment)} 
                        disabled={!newComment.trim()}
                        className={`absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-full text-xs font-bold transition flex items-center justify-center
                            bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-200 shadow-sm
                            ${!newComment.trim() ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                        `}
                    >
                        Post
                    </button>
                </div>
            ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center mb-8 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Please <button onClick={() => setView('login')} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Log In</button> to join the discussion.
                    </p>
                </div>
            )}

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 md:pr-2 custom-scrollbar w-full">
                {comments.map(comment => (
                    <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        token={token} 
                        currentUser={currentUser}
                        isModerator={isModerator} 
                        onReply={postComment}
                        onRefresh={fetchComments}
                        postAuthor={postAuthor}
                        onProfileClick={onProfileClick}
                        rootAuthor={comment.author} 
                    />
                ))}
                
                {comments.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Be the first to comment.</p>}
                
                {nextPage && (
                    <button 
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-4 flex items-center justify-center gap-1 w-full py-2"
                    >
                        {loadingMore ? 'Loading...' : 'Load more comments'}
                        {!loadingMore && <span>↓</span>}
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  )
}

export default CommentSection