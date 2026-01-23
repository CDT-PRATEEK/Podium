import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactQuill from 'react-quill-new' 
import 'react-quill-new/dist/quill.snow.css'
import api from '../services/api' 
import { postService } from '../services/postService'
import Recommendations from '../components/Recommendations' 
import { API_URL } from '../config';

export default function Home({ 
    token, 
    currentUser, 
    showToast, 
    onPostClick,
    onProfileClick, 
    postToEdit,     
    clearPostToEdit,
    isModerator,
    createTrigger,
    clearCreateTrigger,
    userProfile
}) {
  
  // Data States
  const [posts, setPosts] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [loading, setLoading] = useState(false)

  const [refreshing, setRefreshing] = useState(false)
  const pullStart = useRef(0) 
  
  // Editor State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('') 
  const [topic, setTopic] = useState('LIFE') 
  const [tags, setTags] = useState('') 
  const [editingPost, setEditingPost] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  
  const quillRef = useRef(null)

  const TOPICS = [
    { id: 'TECH', label: 'Technology' }, { id: 'PHIL', label: 'Philosophy' },
    { id: 'SCI',  label: 'Science' },    { id: 'SOC',  label: 'Society' },
    { id: 'ART',  label: 'Art & Culture' }, { id: 'LIFE', label: 'Life & Self' },
  ]

  // === LISTEN FOR MOBILE CREATE TRIGGER ===
  useEffect(() => {
      if (createTrigger) {
          startNewPost();
          if (clearCreateTrigger) clearCreateTrigger();
      }
  }, [createTrigger]);

  // === IMAGE UPLOAD HANDLER ===
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            let url = res.data.url;
            if (!url.startsWith('http')) url = `${API_URL}${url}`;

            const quill = quillRef.current.getEditor();
            const range = quill.getSelection();
            quill.insertEmbed(range.index, 'image', url);
            
        } catch (err) {
            console.error("Image upload failed", err);
            showToast("Failed to upload image", "error");
        }
      }
    };
  }, []);

  // === EDITOR CONFIGURATION ===
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'], 
        ['clean']
      ],
      handlers: {
        image: imageHandler 
      }
    }
  }), [imageHandler])

  // === FETCH FEED LOGIC ===
  const loadFeed = () => {
    setLoading(true)
    postService.getFeed()
      .then(data => {
         if (data.results) {
           setPosts(data.results);
           setNextPage(data.next);
         } else {
           setPosts(data); 
         }
         setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // === REAL-TIME AVATAR UPDATE ===
// If user changes profile pic, update all their posts in the feed immediately
useEffect(() => {
    if (userProfile && currentUser) {
        setPosts(prevPosts => prevPosts.map(post => {
            // Check if this post belongs to the logged-in user
            if (post.author_username === currentUser) {
                return { 
                    ...post, 
                    author_image: userProfile.image // Force update the image
                };
            }
            return post;
        }));
    }
}, [userProfile, currentUser]);

  // Initial Load
  useEffect(() => {
    loadFeed()
  }, []) 

  // Listen for Draft Edit Requests
  useEffect(() => {
      if (postToEdit) {
          startEditing(postToEdit)
          clearPostToEdit() 
      }
  }, [postToEdit])

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path; 
      return `${API_URL}${path}`;
  }

  // === INFINITE SCROLL ===
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

  // === BOOKMARK LOGIC ===
  const handleBookmark = async (postId) => {
    if (!token) {
        showToast("Login to bookmark posts", "error");
        return;
    }
    try {
        const res = await postService.toggleBookmark(postId);
        const isNowBookmarked = res.data.is_bookmarked;
        
        setPosts(currentPosts => currentPosts.map(p => 
            p.id === postId ? { ...p, is_bookmarked: isNowBookmarked } : p
        ));
        
        showToast(isNowBookmarked ? "Saved to Library" : "Removed from Library", "success");
    } catch (err) {
        console.error(err);
        showToast("Failed to bookmark", "error");
    }
  };

  // === EDITOR ACTIONS ===
  const startNewPost = () => {
      setEditingPost(null); setTitle(''); setContent(''); setTags(''); setTopic('LIFE');
      setShowEditor(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEditing = (post) => {
    setEditingPost(post); setTitle(post.title); setContent(post.content); 
    setTopic(post.topic || 'LIFE'); setTags(post.tags ? post.tags.join(', ') : '');
    setShowEditor(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEditor = () => {
      setEditingPost(null); setTitle(''); setContent(''); setTags(''); setShowEditor(false);
  }

  const handleSubmit = async (e, postStatus) => {
    e.preventDefault()
    const tagList = postService.formatTags(tags)
    const postData = { title, content, topic, status: postStatus, tags: tagList }

    try {
        await postService.savePost(postData, editingPost?.id);
        closeEditor()
        loadFeed() 
        showToast(postStatus === 1 ? "Published Successfully" : "Draft Saved", 'success')
    } catch (err) {
        const errorMessage = err.response?.data?.detail || "Failed to create post.";
        showToast(errorMessage, "error");
    }
  }

  // === DELETE ACTION ===
  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if(!window.confirm("Moderator/Owner Action:\nAre you sure you want to delete this post?")) return;
    
    setPosts(prev => prev.filter(p => p.id !== id));
    
    try {
        await postService.deletePost(id)
        showToast("Post deleted", 'info')
    } catch (err) {
        showToast("Failed to delete", 'error')
        loadFeed()
    }
  }

  // === REFRESH HANDLER ===
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
        const data = await postService.getFeed();
        let newPosts = data.results || data;
        if (newPosts.length > 0) {
            newPosts = newPosts.sort(() => Math.random() - 0.5);
        }
        setPosts(newPosts);
        setNextPage(data.next);
    } catch (err) {
        console.error("Refresh failed", err);
        showToast("Could not refresh feed", "error");
    } finally {
        setRefreshing(false);
    }
  };

  // === TOUCH HANDLERS ===
  const handleTouchStart = (e) => {
    if (window.scrollY <= 10) {
        pullStart.current = e.targetTouches[0].clientY;
    }
  }

  const handleTouchEnd = (e) => {
    if (!pullStart.current) return;
    const touchEnd = e.changedTouches[0].clientY;
    const pullDistance = touchEnd - pullStart.current;

    if (pullDistance > 50 && window.scrollY <= 10) {
        handleRefresh();
    }
    pullStart.current = 0; 
  }

  // === RENDER ===
  return (
    <div>
        {/* EDITOR UI */}
        {showEditor && (
            <div className="editor-container bg-white dark:bg-[#1a1a1a] p-4 md:p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 mb-10 animate-fade-in-down transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">{editingPost ? 'Edit Post' : 'New Post'}</h3>
                    <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={(e) => e.preventDefault()}> 
                    <input 
                        className="w-full p-3 text-lg font-semibold border-b border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:border-blue-500 outline-none mb-4 placeholder-gray-400" 
                        type="text" 
                        placeholder="Title" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        required 
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="w-full sm:w-1/3">
                            <select 
                                value={topic} 
                                onChange={e => setTopic(e.target.value)} 
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                {TOPICS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-2/3">
                            <input 
                                className="w-full p-3 text-sm text-gray-600 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-lg outline-none border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 placeholder-gray-400" 
                                type="text" 
                                placeholder="Add tags (e.g. #tech) for reach" 
                                value={tags} 
                                onChange={e => setTags(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="quill-wrapper mb-6 md:mb-8 bg-white dark:bg-gray-50 h-64 md:h-96 rounded-lg overflow-hidden text-black border border-gray-200 dark:border-none">
                        <ReactQuill 
                            ref={quillRef} 
                            theme="snow" 
                            modules={modules} 
                            value={content} 
                            onChange={setContent} 
                            className="h-full" 
                        />
                    </div>
                    
                    <div className="editor-actions flex flex-wrap gap-3 pt-2">
                        <button 
                            type="button" 
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition" 
                            onClick={(e) => handleSubmit(e, 0)}
                        >
                            Save Draft
                        </button>
                        
                        <button 
                            type="button" 
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md" 
                            onClick={(e) => handleSubmit(e, 1)}
                        >
                            {editingPost ? 'Save Updates' : 'Publish'}
                        </button>
                        
                        <button 
                            type="button" 
                            className="w-full sm:w-auto px-6 py-2.5 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition sm:ml-auto" 
                            onClick={closeEditor}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* === MAIN LAYOUT === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT: THE FEED */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8 min-h-screen"
                onTouchStart={handleTouchStart} 
                onTouchEnd={handleTouchEnd}
            >
                {refreshing && (
                    <div className="flex justify-center py-4 animate-fade-in-down">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {posts.map((post, index) => {
                    const isLastPost = posts.length === index + 1
                    const isOwner = post.author_username === currentUser
                    const canDelete = isOwner || isModerator
                    const isDeleted = post.author_username === "Deleted User";
                    
                    return (
                        <div 
                            ref={isLastPost ? lastPostElementRef : null} 
                            key={post.id} 
                            className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200  dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] transition duration-300 group cursor-pointer"
                            onClick={() => onPostClick(post.id)}
                        >
                            <div className="p-5 md:p-8">
                                {/* HEADER */}
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {post.topic_name && <span className="tag-topic">{post.topic_name}</span>}
                                        {post.tags && post.tags.map((tag, i) => <span key={i} className="tag-hashtag">#{tag}</span>)}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleBookmark(post.id); }}
                                            className={`p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${post.is_bookmarked ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 opacity-100' : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill={post.is_bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                            </svg>
                                        </button>

                                        {canDelete && (
                                            <button 
                                                onClick={(e) => handleDelete(e, post.id)}
                                                className="text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition"
                                                title="Delete Post"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight hover:text-blue-600 dark:hover:!text-blue-400 transition">
                                    {post.title}
                                </h2>
                                
                                {/* META */}
                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
                                    
                                    {/* 1. AVATAR */}
                                    {isDeleted ? (
                                        <div 
                                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-default"
                                            onClick={(e) => e.stopPropagation()} 
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                                            <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725 7.38l.108.537a.75.75 0 0 1-.826.89h-1.296l-1.38 5.176a9.499 9.499 0 0 1-5.69 6.666l-.1.026-.062.016a.75.75 0 0 1-.762-.317l-1.87-2.906a.75.75 0 0 1 .15-1.042l3.41-2.436a13.91 13.91 0 0 1-5.118-2.616l-1.854 1.325a.75.75 0 0 1-1.042-.15l-1.87-2.907a.75.75 0 0 1 .05-.98l.061-.065a9.499 9.499 0 0 1 5.92-2.126l1.378-5.176H9.366a.75.75 0 0 1-.826-.89l.108-.536a9.75 9.75 0 0 1 6.725-7.38l1.838.46v-.54a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 hover:opacity-80 transition cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); onProfileClick(post.author_username) }} 
                                        >
                                            {post.author_image ? (
                                                <img src={getImageUrl(post.author_image)} className="w-full h-full object-cover" alt="avatar" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {post.author_username ? post.author_username[0].toUpperCase() : '?'}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. USERNAME */}
                                    {isDeleted ? (
                                        <span 
                                            className="font-medium text-gray-400 italic cursor-default select-none"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Deleted User
                                        </span>
                                    ) : (
                                        <span 
                                            className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); onProfileClick(post.author_username) }}
                                        >
                                            {post.author_username}
                                        </span>
                                    )}
                                    
                                    <span>•</span>
                                    <span>{new Date(post.date_posted).toLocaleDateString()}</span>
                                </div>

                                <div 
                                    className="prose prose-lg dark:prose-invert text-gray-700 dark:text-gray-300 max-w-none line-clamp-3 mb-4 feed-summary text-fix" 
                                    dangerouslySetInnerHTML={{ __html: post.content.replace(/&nbsp;/g, ' ') }} 
                                />
                                
                                <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline mb-4 inline-block">
                                    Read full post →
                                </span>
                            </div>
                            
                           {/* FOOTER: ACTIONS & STATS */}
                            <div className="bg-gray-50 dark:bg-black px-5 md:px-8 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center transition-colors">
                                
                                {/* LEFT: COMMENT COUNT (Clean & Minimal) */}
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                    </svg>
                                    <span className="font-semibold text-sm">
                                        {/* Shows "5 Comments" or just "Discussion" if 0 */}
                                        {post.total_comments === 0 
                                            ? 'Discussion' 
                                            : `${post.total_comments} ${post.total_comments === 1 ? 'Comment' : 'Comments'}`
                                        }
                                    </span>
                                </div>

                                {/* RIGHT: EDIT BUTTON (Only for Owner) */}
                                {isOwner && (
                                    <button 
                                        className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition" 
                                        onClick={(e) => {e.stopPropagation(); startEditing(post)}}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
                
                {loading && <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 "></div></div>}
                {!loading && posts.length === 0 && <div className="text-center py-20 text-gray-400"><p className="text-xl">Your feed is empty.</p></div>}
            </div>

            {/* RIGHT: RECOMMENDATIONS SIDEBAR */}
            <div className="hidden lg:block space-y-6 lg:col-span-1 sticky top-24 z-10 h-fit">
                 <Recommendations onPostClick={onPostClick} token={token} /> 
                 <div className="text-xs text-gray-400 px-4">
                    <p>© 2026 Podium Inc.</p>
                </div>
            </div>

        </div>
    </div>
  )
}