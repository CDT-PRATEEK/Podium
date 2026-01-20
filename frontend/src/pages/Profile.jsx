import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api' 
import { postService } from '../services/postService' 
import { API_URL } from '../config';
import DeleteAccountModal from '../components/DeleteAccountModal';
import { authService } from '../services/authService';

function Profile({ 
    token, 
    setView, 
    onEdit, 
    targetUser, 
    currentUser, 
    onPostClick,
    showToast,
    initialTab = 'published', // Default
    onProfileUpdate,
    scrollTrigger,
    handleLogout,
    isActive
}) {
  const isOwner = !targetUser || targetUser === currentUser
  
  // 1. REF FOR TABS SCROLLING
  const tabsRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // Track if user clicked the "Remove" button
  const [removeImage, setRemoveImage] = useState(false);
  const BIO_LIMIT = 150;
  const [editBio, setEditBio] = useState('')
  const [editInterests, setEditInterests] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)
// === DELETE ACCOUNT STATE ===
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const TOPICS = [
    { id: 'TECH', label: 'Technology' }, { id: 'PHIL', label: 'Philosophy' },
    { id: 'SCI',  label: 'Science' },    { id: 'SOC',  label: 'Society' },
    { id: 'ART',  label: 'Art' },        { id: 'LIFE', label: 'Life' },
  ]
  
  const TOPIC_LABELS = {
    'TECH': 'Technology', 'PHIL': 'Philosophy', 'SCI': 'Science',
    'SOC': 'Society', 'ART': 'Art & Culture', 'LIFE': 'Life & Self'
  }

  // === 2. AGGRESSIVE SCROLL & TAB SYNC LOGIC ===
  useEffect(() => {
    // A. Sync State: Always force the tab to match what the App requested
    if (initialTab) {
        setActiveTab(initialTab);
    }

    // B. Mobile Library Scroll Logic
    const isMobile = window.innerWidth < 768;
    
    // We run this if the requested tab is 'bookmarks' AND we are on mobile.
    if (initialTab === 'bookmarks' && isMobile) {
        
        const forceScroll = () => {
            if (tabsRef.current) {
                const element = tabsRef.current;
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Calculate Exact Position: Element Top + Current Scroll - Header Offset (85px)
                const targetY = rect.top + scrollTop - 85;

                window.scrollTo({
                    top: targetY,
                    behavior: 'smooth'
                });
            }
        };

        // STRATEGY: Fire multiple times to beat the parent App's "Scroll to Top"
        const t1 = setTimeout(forceScroll, 100);
        const t2 = setTimeout(forceScroll, 300);
        const t3 = setTimeout(forceScroll, 600);

        return () => { 
            clearTimeout(t1); 
            clearTimeout(t2); 
            clearTimeout(t3);
        };
    }
  }, [initialTab, targetUser, scrollTrigger]); 

  // 1. FETCH PROFILE INFO
  useEffect(() => {
    // SECURITY GUARD: Stop right here if the page is hidden.
    // This prevents "messing up" anything when you leave the page.
    if (!isActive) return; 

    setProfile(null)
    setLoading(true)
    
    const getProfileData = async () => {
        try {
            let res;
            // CACHE BUSTER: Add timestamp to force fresh data
            const timestamp = new Date().getTime(); 

            if (isOwner) {
                res = await api.get(`profile/?t=${timestamp}`)
            } else {
                res = await api.get(`profile/${targetUser}/?t=${timestamp}`)
            }
            
            setProfile(res.data)
            setEditBio(res.data.bio || '')
            
            let interestsData = res.data.interests;
            if (typeof interestsData === 'string') {
                interestsData = interestsData.split(',').filter(x => x.trim() !== '');
            }
            setEditInterests(interestsData || [])
            setLoading(false)
        } catch (err) {
            console.error("Profile Fetch Error:", err)
            setLoading(false)
        }
    }

    getProfileData()
    
    // DEPENDENCIES: Now we listen to 'isActive'.
    // Because of the 'if' check at the top, this will only trigger a refresh
    // when you ARRIVE at the page, not when you leave it.
  }, [targetUser, isOwner, isActive])

  
  // 2. FETCH POSTS BASED ON ACTIVE TAB
  useEffect(() => {
    if (!profile) return; 

    setPosts([])
    setNextPage(null)
    setLoadingMore(true) 

    let endpoint = ''

    if (activeTab === 'bookmarks' && isOwner) {
        endpoint = 'posts/bookmarks/'
    } else {
        endpoint = `posts/?author__username=${profile.username}`
    }

    api.get(endpoint)
        .then(res => {
            if (res.data.results) {
                setPosts(res.data.results)
                setNextPage(res.data.next)
            } else {
                setPosts(res.data)
                setNextPage(null)
            }
            setLoadingMore(false)
        })
        .catch(err => {
            console.error(err)
            setLoadingMore(false)
        })

  }, [activeTab, profile]) 


  // === AUTO-CANCEL EDIT WHEN LEAVING PAGE ===
  useEffect(() => {
    // If the tab is no longer active, but we were editing...
    if (!isActive && isEditing) {
        setIsEditing(false); // Turn off edit mode
        setPreviewImage(null); // Clear preview image
        
        // Reset form fields back to original data
        if (profile) {
            setEditBio(profile.bio || '');
            let interestsData = profile.interests;
            if (typeof interestsData === 'string') {
                interestsData = interestsData.split(',').filter(x => x.trim() !== '');
            }
            setEditInterests(interestsData || []);
        }
    }
  }, [isActive]); // Run this whenever visibility changes


  // === DELETE HANDLER ===
    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            // Call the API
            await authService.deleteAccount();
            
            showToast('Account scheduled for deletion', 'info');
            
            // Close Modal
            setShowDeleteModal(false);
            
            // LOGOUT IMMEDIATELY
            // This ensures they can't keep browsing with a "deleted" token
            handleLogout(); 
            
        } catch (err) {
            console.error(err);
            // Handle error (e.g., if they are already deleted)
            const errorMsg = err.response?.data?.message || 'Failed to delete account';
            showToast(errorMsg, 'error');
        } finally {
            setDeleteLoading(false);
        }
    };







  // === INFINITE SCROLL OBSERVER ===
  const observer = useRef()
  const lastPostElementRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPage) {
        setLoadingMore(true)
        const nextUrl = nextPage.replace(/^https?:\/\/[^\/]+\/api\//, '');
        api.get(nextUrl)
          .then(res => {
            setPosts(prev => [...prev, ...res.data.results])
            setNextPage(res.data.next)
            setLoadingMore(false)
          })
          .catch(() => setLoadingMore(false))
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, loadingMore, nextPage])

  const handleBookmark = async (postId) => {
    try {
        await postService.toggleBookmark(postId);
        if (activeTab === 'bookmarks') {
            setPosts(posts.filter(p => p.id !== postId))
        } else {
            setPosts(posts.map(p => 
                p.id === postId ? { ...p, is_bookmarked: !p.is_bookmarked } : p
            ));
        }
        if (showToast) showToast("Library updated", "success");
    } catch (err) {
        if (showToast) showToast("Failed to update bookmark", "error");
    }
  };

  // 1. User clicks the "Trash" icon
const handleRemoveImage = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop it from triggering the upload label
    setPreviewImage(null); // Clear UI
    setRemoveImage(true);  // Set Flag
    if (fileInputRef.current) fileInputRef.current.value = ""; // Clear input
};

// 2. User changes mind and selects a NEW file
const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setPreviewImage(URL.createObjectURL(file));
        setRemoveImage(false); // Un-set the flag since they picked a new one
    }
};




  const handleSave = async () => {
    const formData = new FormData()
    formData.append('bio', editBio)
    editInterests.forEach(topic => { formData.append('interests_list', topic); });
    formData.append('interests', editInterests.join(',')) 
    if (fileInputRef.current && fileInputRef.current.files[0]) {
        // Case A: Uploading a new file
        formData.append('image', fileInputRef.current.files[0])
    } else if (removeImage) {
        // Case B: Explicitly removing the old file
        formData.append('remove_image', 'true')
    }

    try {
        const res = await api.put('profile/', formData, {
            headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
        })
        setProfile(res.data)
        if (isOwner && onProfileUpdate) { onProfileUpdate(res.data) }
        
        let interestsData = res.data.interests;
        if (typeof interestsData === 'string') {
            interestsData = interestsData.split(',').filter(x => x.trim() !== '');
        }
        setEditInterests(interestsData || [])
        setIsEditing(false)
        setPreviewImage(null)
        if (showToast) showToast("Profile updated successfully", "success")
    } catch (err) { 
        console.error(err)
        if (showToast) showToast("Failed to save profile", "error")
    }
  }

  const toggleInterest = (id) => {
    if (editInterests.includes(id)) {
        setEditInterests(editInterests.filter(i => i !== id))
    } else {
        if (editInterests.length < 5) setEditInterests([...editInterests, id])
    }
  }


  const getInitials = () => {
      if (!profile) return '?'
      const name = profile.username 
      return name ? name[0].toUpperCase() : '?'
  }

  const getImageUrl = (path) => {
      if (!path) return null
      if (path.startsWith('http')) return path
      return `${API_URL}${path}`;
  }

  if (loading) return <div className="text-center py-20 animate-pulse text-gray-500 dark:text-gray-400">Loading Profile...</div>
  if (!profile) return <div className="text-center py-20 text-gray-500 dark:text-gray-400">User not found.</div>

  const displayedPosts = activeTab === 'bookmarks' 
    ? posts 
    : (activeTab === 'published' ? posts.filter(p => p.status === 1) : posts.filter(p => p.status === 0));

return (
    <div className="profile-page max-w-4xl mx-auto animate-fade-in pb-24 md:pb-20 px-4 md:px-0">
      
      {/* HEADER CARD */}
      <div className="profile-header bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800 mb-8 relative transition-colors duration-300">
         
         {/* === HEADER ACTIONS (Edit + Delete) === */}
         {isOwner && !isEditing && (
             <div className="absolute top-2 right-2 md:top-6 md:right-6 flex items-center gap-2">
                 {/* Edit Button */}
                 <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wide bg-transparent"
                    title="Edit Profile"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-4 md:h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    <span className="hidden md:inline">Edit</span>
                </button>

                {/* Delete Icon */}
                <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete Account"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-5 md:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
             </div>
         )}

         <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
             
             {/* AVATAR SECTION */}
             <div className="relative group mx-auto md:mx-0 flex-shrink-0">
                <div className="profile-avatar w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-inner bg-gray-50 dark:bg-gray-800">
                    {previewImage ? (
                        <img src={previewImage} className="w-full h-full object-cover" alt="preview" />
                    ) : (profile.image && !removeImage) ? (  
                        <img src={getImageUrl(profile.image)} className="w-full h-full object-cover" alt="profile" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-500 to-purple-600 text-white text-4xl font-bold">
                            {getInitials()}
                        </div>
                    )}
                </div>
                
                {isOwner && isEditing && (
                    <>
                        {/* 1. UPLOAD OVERLAY */}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition backdrop-blur-sm font-bold text-sm z-10">
                            <div className="flex flex-col items-center">
                                {/* Upload Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                </svg>
                                Upload
                            </div>
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>

                        {/* 2. REMOVE BUTTON (Only show if there is an image AND we haven't removed it yet) */}
                        {(profile.image || previewImage) && !removeImage && (
                            <button
                                onClick={handleRemoveImage}
                                className="absolute top-0 right-0 z-20 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition transform hover:scale-110 border-2 border-white dark:border-gray-800"
                                title="Remove Photo"
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 md:w-4 md:h-4">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </>
                )}
             </div>

             <div className="flex-1 w-full text-center md:text-left">
                {isEditing ? (
                    /* === EDIT MODE UI === */
                    <div className="space-y-6 animate-fade-in text-left">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Bio</label>
                                {/* Character Counter */}
                                <span className={`text-xs font-bold transition-colors ${editBio.length >= BIO_LIMIT ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {editBio.length}/{BIO_LIMIT}
                                </span>
                            </div>
                            
                            <textarea 
                                className={`w-full p-4 border bg-white dark:bg-[#111827] text-gray-900 dark:text-white rounded-xl outline-none transition text-sm leading-relaxed 
                                    ${editBio.length >= BIO_LIMIT 
                                        ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                                        : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500'
                                    }`}
                                rows="3" 
                                placeholder="Tell the world about yourself..." 
                                value={editBio} 
                                onChange={e => {
                                    // Hard limit: Don't allow typing past BIO_LIMIT chars
                                    if (e.target.value.length <= BIO_LIMIT) {
                                        setEditBio(e.target.value)
                                    }
                                }} 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Interests</label>
                            <div className="flex flex-wrap gap-2">
                                {TOPICS.map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => toggleInterest(t.id)} 
                                        className={`flex-grow md:flex-grow-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border
                                            ${editInterests.includes(t.id) 
                                                ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-md' 
                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}
                                    >
                                            {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <button 
                                onClick={() => { setIsEditing(false); setPreviewImage(null) }} 
                                className="h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="h-10 flex-1 flex items-center justify-center bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-md transition active:scale-95"
                            >
                                <span className="md:hidden">Save</span>
                                <span className="hidden md:inline">Save Changes</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* === VIEW MODE UI === */
                    <>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">{profile.username}</h1>
                        
                        {isOwner && <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{profile.email}</p>}
                        {!isOwner && <p className="text-gray-400 text-xs mb-4 uppercase tracking-wide font-bold">Writer</p>}

                        <p className="profile-bio text-gray-700 dark:text-gray-300 mb-6 leading-relaxed max-w-lg mx-auto md:mx-0 break-words whitespace-pre-wrap">
                            {profile.bio || <span className="text-gray-400 italic">No bio yet.</span>}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {profile.interests && profile.interests.length > 0 ? (
                                (typeof profile.interests === 'string' ? profile.interests.split(',') : profile.interests)
                                .filter(i => i.trim() !== '')
                                .map(code => (
                                    <span key={code} className="tag-topic">
                                        {TOPIC_LABELS[code.trim()] || code}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 px-3 py-1 rounded-full">No interests selected</span>
                            )}
                        </div>
                    </>
                )}
             </div>
         </div>
      </div>

      {/* TABS */}
      {isOwner ? (
          <div 
              id="profile-tabs" 
              ref={tabsRef} 
              className="profile-tabs scroll-mt-24 grid grid-cols-3 border-b border-gray-200 dark:border-gray-800 mb-6"
          >
            <button onClick={() => setActiveTab('published')} className={`pb-3 text-center font-bold text-sm transition border-b-2 ${activeTab === 'published' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Published</button>
            <button onClick={() => setActiveTab('drafts')} className={`pb-3 text-center font-bold text-sm transition border-b-2 ${activeTab === 'drafts' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Drafts</button>
            <button onClick={() => setActiveTab('bookmarks')} className={`pb-3 text-center font-bold text-sm transition border-b-2 ${activeTab === 'bookmarks' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Bookmarks</button>
          </div>
      ) : (
          <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-3">
              <span className="font-bold text-lg text-gray-900 dark:text-white">Posts by {profile.username}</span>
          </div>
      )}

      {/* DISPLAY POSTS */}
      <div className="space-y-4">
        {displayedPosts.map((post, index) => {
            const isLastPost = displayedPosts.length === index + 1
            return (
            <div 
                ref={isLastPost ? lastPostElementRef : null}
                key={post.id} 
                className={`profile-post bg-white dark:bg-[#1a1a1a] p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center transition cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500 dark:hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] group`}
            >
                <div 
                    className="flex-1 w-full sm:w-auto"
                    onClick={() => { 
                        if (isOwner && post.status === 0) { 
                            onEdit(post); 
                        } else { 
                            onPostClick(post.id); 
                        }
                    }} 
                >
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:!text-blue-400 transition">
                            {post.title || <span className="text-gray-400 italic">Untitled Draft</span>}
                        </h3>
                        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>{new Date(post.date_posted).toLocaleDateString()}</span>
                            {post.topic_name && <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">{post.topic_name}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4 sm:mt-0 ml-0 sm:ml-4 self-end sm:self-auto">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleBookmark(post.id); }}
                        className={`p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${post.is_bookmarked ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 opacity-100' : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        title={post.is_bookmarked ? "Remove from Library" : "Save to Library"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill={post.is_bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                    </button>
                    {isOwner && activeTab !== 'bookmarks' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${post.status===1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                            {post.status===1 ? 'Published' : 'Draft'}
                        </span>
                    )}
                </div>
            </div>
        )})}
        
        {loadingMore && <div className="text-center py-4 text-sm text-gray-500">Loading more...</div>}
        {!loading && displayedPosts.length === 0 && <div className="text-center py-10 text-gray-400">No items found.</div>}
      </div>


      {/* === DELETE CONFIRMATION MODAL (NEW) === */}
      <DeleteAccountModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
      />

    </div>
  )
}

export default Profile