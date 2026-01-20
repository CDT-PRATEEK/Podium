import { useState, useEffect, useRef } from 'react'
import api from './services/api' 
import ThemeToggle from './components/ThemeToggle'
import { API_URL } from './config';

// === IMPORT SEPARATE COMPONENTS ===
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';

// COMPONENTS
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'    
import Toast from './components/Toast'
import Onboarding from './components/Onboarding'
import Recommendations from './components/Recommendations';

// AUTH PAGES
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// MAIN PAGES
import Explore from './pages/Explore'
import Home from './pages/Home' 
import PostDetail from './pages/PostDetail'

function App() {

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleTheme = () => setDarkMode(!darkMode)

  // === 1. AUTH STATE ===
  const [token, setToken] = useState(localStorage.getItem('myBlogToken') || null)
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('myBlogUser') || '') 
  
  const [view, setView] = useState('home')
  const [myProfile, setMyProfile] = useState(null) 

  // === 2. NAVIGATION STATE ===
  const [currentPostId, setCurrentPostId] = useState(null) 
  const [targetUser, setTargetUser] = useState(null) 
  const [postToEdit, setPostToEdit] = useState(null) 
  const [focusComments, setFocusComments] = useState(false)
  const [initialProfileTab, setInitialProfileTab] = useState('published')
  const [libraryScrollTrigger, setLibraryScrollTrigger] = useState(0)
  const [createTrigger, setCreateTrigger] = useState(false)

  // === HISTORY STATE (For Back Button Logic) ===
  const [navHistory, setNavHistory] = useState({ view: 'home', scroll: 0 })

  // === SCROLL REFS (For Tab Switching Logic) ===
  const scrollPos = useRef({ home: 0, explore: 0, profile: 0 });

  // === 3. UI STATES ===
  const [toast, setToast] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  const [notifications, setNotifications] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  const [feedVersion, setFeedVersion] = useState(0);

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  // === 4. DATA FETCHING ===
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
        setView('reset-password');
    }

    if (token) {
       api.get('profile/')
       .then(res => {
          setMyProfile(res.data) 
          const interests = res.data.interests;
          const isEmpty = !interests || (Array.isArray(interests) && interests.length === 0) || (typeof interests === 'string' && interests.trim() === "");
          if (isEmpty) setShowOnboarding(true)
       })
       .catch(err => {
            console.error("Profile fetch error", err);
            //If profile fails (401), force logout
            if (err.response?.status === 401) handleLogout();
        });
       fetchNotifications()
       const interval = setInterval(fetchNotifications, 30000)
       return () => clearInterval(interval)
    } else {
       setMyProfile(null)
    }
  }, [token]); 


  useEffect(() => {
    const handleResize = () => {
      // 768px is the standard 'md' breakpoint in Tailwind
      if (window.innerWidth >= 768) {
        if (view === 'recommendations') {
            setView('home'); // Kick user back to Home
        }
        // Add other mobile-only views here if you have them (e.g., 'create')
        if (view === 'create') {
             // Optional: if you don't want the mobile create screen on desktop
             setView('home'); 
        }
      }
    };

    // Attach listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  const fetchNotifications = async () => {
    if (!token) return; 
    try {
        const res = await api.get('notifications/')
        setNotifications(res.data)
        setHasUnread(res.data.some(n => !n.is_read))
    } catch (err) { console.error("Notif error", err) }
  }

  const markRead = async (id) => {
    try {
        await api.post(`notifications/${id}/read/`)
        setNotifications(notifications.map(n => n.id === id ? {...n, is_read: true} : n))
        setHasUnread(notifications.some(n => n.id !== id && !n.is_read))
    } catch (err) { }
  }

  // === 5. HANDLERS ===
  const handleLogout = () => {
    localStorage.clear(); 
    setToken(null); 
    setCurrentUser(''); 
    setTargetUser(null);
    setMyProfile(null); 
    setView('home'); 
    showToast("Logged out successfully", 'info')
  }

  // === SMART NAVIGATION LOGIC ===
  const smartSwitch = (targetView) => {
      // 1. Double Tap: If already active, scroll to top
      if (view === targetView) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }

      // 2. Save current scroll position before switching away
      // (Only if we are currently on a main tab)
      if (['home', 'explore', 'profile'].includes(view)) {
          scrollPos.current[view] = window.scrollY;
      }

      // 3. Switch View
      setView(targetView);

      // 4. Restore scroll for the target view
      setTimeout(() => {
          const savedY = scrollPos.current[targetView] || 0;
          window.scrollTo({ top: savedY, behavior: 'auto' });
      }, 10);
  }

  // Handlers for Navbar
  const handleGoHome = () => smartSwitch('home');
  const handleGoExplore = () => smartSwitch('explore');
  const handleGoRecommendations = () => smartSwitch('recommendations');
  
 const handleGoProfile = () => {
      // 1. If already on MY profile, scroll top (Double Tap)
      if (view === 'profile' && (!targetUser || targetUser === currentUser)) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }
      
      // 2. Save previous scroll of Home or Explore before leaving
      if (['home', 'explore'].includes(view)) {
          scrollPos.current[view] = window.scrollY;
      }

      // 3. Open Profile
      openProfile(currentUser, 'published');

      // 4. FORCE SCROLL TO TOP (The Fix)
      // Previously, this restored 'scrollPos.current.profile'. 
      // Now we force it to 0 so it always starts at the top.
      setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
      }, 10);
  }

  // === POST & PROFILE ACTIONS ===
  const openPost = (id, shouldFocus = false) => {
      const currentScroll = window.scrollY;
      
      // 1. Save state for Back Button logic
      setNavHistory({ view: view, scroll: currentScroll });
      
      // 2. ALSO save to Ref so Navbar navigation works correctly from PostDetail
      if(['home', 'explore', 'profile'].includes(view)) {
          scrollPos.current[view] = currentScroll;
      }

      setCurrentPostId(id)
      setFocusComments(shouldFocus) 
      setView('post-detail')
      window.scrollTo(0, 0) 
  }

  const handleBackFromPost = () => {
      setView(navHistory.view);
      setTimeout(() => {
          window.scrollTo({ top: navHistory.scroll, behavior: 'auto' });
      }, 0); 
  }

  const openProfile = (username, tab = 'published') => {
      // === PREVENT GUESTS FROM OPENING PROFILE ===
      if (!token) {
          showToast("Please log in to view user profiles.", "error"); // Or use 'info'
          return; // Stop here! Do not switch view.
      }

      setInitialProfileTab(tab)
      setView('profile')
      
      if (username === currentUser) { 
          setTargetUser(null) 
      } else { 
          setTargetUser(username) 
      }
      
      if (tab === 'bookmarks') { 
          setLibraryScrollTrigger(Date.now()) 
      } else { 
          window.scrollTo(0,0) 
      }
  }

  const handleEditRequest = (post) => {
      setPostToEdit(post) 
      setView('home')     
      window.scrollTo(0,0)
  }

  const handleMobileCreate = () => {
      setView('home')
      setCreateTrigger(true)
      window.scrollTo(0,0)
  }

  const isAuthView = ['login', 'register', 'forgot-password', 'reset-password'].includes(view);

  return (
    <div className={`min-h-screen font-sans text-gray-900 transition-colors duration-300 bg-white dark:bg-black ${isAuthView ? '' : 'pb-24 md:pb-10'}`}>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {view === 'login' && <Login setView={setView} onLogin={(t, u) => { localStorage.setItem('myBlogToken', t); localStorage.setItem('myBlogUser', u); setToken(t); setCurrentUser(u); setView('home'); }} showToast={showToast} />}
        {view === 'register' && <Register setView={setView} showToast={showToast} />}
        {view === 'forgot-password' && <ForgotPassword setView={setView} />}
        {view === 'reset-password' && <ResetPassword setView={setView} />}
        
        {!isAuthView && (
            <>
                {showOnboarding && token && (
                    <Onboarding 
                        token={token} 
                        onComplete={() => {
                            setShowOnboarding(false); 
                            setFeedVersion(prev => prev + 1); 
                            
                        
                            api.get('profile/').then(res => setMyProfile(res.data));
                        }} 
                    />
                )}

                {/* === NAVBAR COMPONENT === */}
                <Navbar 
                    view={view}
                    token={token}
                    currentUser={currentUser}
                    myProfile={myProfile}
                    darkMode={darkMode}
                    targetUser={targetUser}
                    initialProfileTab={initialProfileTab}
                    notifications={notifications}
                    hasUnread={hasUnread}
                    showNotifDropdown={showNotifDropdown}
                    setShowNotifDropdown={setShowNotifDropdown}
                    toggleTheme={toggleTheme}
                    handleGoHome={handleGoHome}
                    handleGoExplore={handleGoExplore}
                    handleGoProfile={handleGoProfile}
                    openProfile={openProfile}
                    handleLogout={handleLogout}
                    markRead={markRead}
                    openPost={openPost}
                    setView={setView}
                    onCreateClick={() => {
                        setView('home');        //  Go to Home (so the modal isn't hidden)
                        setCreateTrigger(true); //  Trigger the modal
                    }}
                />

                {/* === MOBILE NAV COMPONENT === */}
                <MobileNav 
                    view={view}
                    createTrigger={createTrigger}
                    handleGoHome={handleGoHome}
                    handleGoExplore={handleGoExplore}
                    handleMobileCreate={handleMobileCreate}
                    handleGoRecommendations={handleGoRecommendations}
                    openProfile={openProfile}
                    currentUser={currentUser}
                    initialProfileTab={initialProfileTab}
                    handleGoProfile={handleGoProfile}
                    token={token}
                />

                {/* MAIN CONTENT AREA */}
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
                    
                    {/* HOME (Keep Alive) */}
                    <div style={{ display: view === 'home' ? 'block' : 'none' }}>
                        <Home 
                            key={`${token}-${feedVersion}`}
                            token={token} 
                            currentUser={currentUser} 
                            showToast={showToast} 
                            onPostClick={openPost} 
                            onProfileClick={openProfile} 
                            postToEdit={postToEdit}      
                            clearPostToEdit={() => setPostToEdit(null)} 
                            isModerator={myProfile?.is_moderator}
                            createTrigger={createTrigger}
                            clearCreateTrigger={() => setCreateTrigger(false)}
                            userProfile={myProfile}
                        />
                    </div>

                    {/* EXPLORE (Keep Alive) */}
                    <div style={{ display: view === 'explore' ? 'block' : 'none' }}>
                        <Explore 
                            key={`${token}-${feedVersion}`}
                            token={token} 
                            currentUser={currentUser} 
                            onPostClick={openPost} 
                            onProfileClick={openProfile} 
                            showToast={showToast}
                            setView={setView}
                        />
                    </div>

                    {/* RECOMMENDATIONS (New Mobile View) */}
                    <div style={{ display: view === 'recommendations' ? 'block' : 'none' }}>
                        <Recommendations 
                            key={`${token}-${feedVersion}`}
                            token={token} 
                            onPostClick={openPost}
                            isFullPage={true} 
                        />
                    </div>
                    
                    {/* PROFILE (Keep Alive) */}
                    {token && (
                    <div style={{ display: view === 'profile' ? 'block' : 'none' }}>
                        <Profile 
                            token={token} 
                            setView={setView} 
                            targetUser={targetUser}   
                            currentUser={currentUser} 
                            onEdit={handleEditRequest} 
                            onPostClick={openPost}
                            isModerator={myProfile?.is_moderator}
                            showToast={showToast}
                            initialTab={initialProfileTab} 
                            onProfileUpdate={(data) => setMyProfile(data)}
                            scrollTrigger={libraryScrollTrigger}
                            isActive={view === 'profile'}
                            handleLogout={handleLogout}
                        />
                    </div>
                    )}

                    {/* POST DETAIL (Transient View) */}
                    {view === 'post-detail' && (
                        <PostDetail 
                            postId={currentPostId} 
                            token={token} 
                            currentUser={currentUser}
                            userProfile={myProfile}
                            onBack={handleBackFromPost} 
                            showToast={showToast}
                            onProfileClick={openProfile} 
                            focusComments={focusComments}
                            setView={setView}
                        />
                    )}
                </div>
            </>
        )}
    </div>
  )
}

export default App