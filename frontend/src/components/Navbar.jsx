import { API_URL } from '../config';
import ThemeToggle from './ThemeToggle';

const Navbar = ({
    // State
    view,
    token,
    currentUser,
    myProfile,
    darkMode,
    targetUser,
    initialProfileTab,
    // Notifications
    notifications,
    hasUnread,
    showNotifDropdown,
    setShowNotifDropdown,
    // Handlers
    toggleTheme,
    handleGoHome,
    handleGoExplore,
    handleGoProfile,
    openProfile, // For Library click
    handleLogout,
    markRead,
    openPost,
    setView, // For Login/Register buttons
    onCreateClick // <---  Connects to Create Post Modal
}) => {

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`;
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all">
            <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex justify-between items-center gap-4">
                
                {/* LOGO */}
                <div 
                    className="flex items-center gap-2 cursor-pointer group flex-shrink-0" 
                    onClick={handleGoHome}
                >
                    <div className="w-8 h-8 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                        <img src="/podium.png" alt="Podium" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">Podium</span>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">

                    <ThemeToggle isDark={darkMode} toggleTheme={toggleTheme} />
                    
                    {/* DESKTOP LINKS */}
                    <div className="hidden md:flex items-center gap-6 mr-2">
                        <button 
                            onClick={handleGoHome} 
                            className={`text-sm font-semibold transition ${view === 'home' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            Home
                        </button>
                        <button 
                            onClick={handleGoExplore} 
                            className={`text-sm font-semibold transition flex items-center gap-1 ${view === 'explore' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            Explore
                        </button>
                        
                        {token && (
                            <button 
                                onClick={() => openProfile(currentUser, 'bookmarks')}
                                className={`text-sm font-semibold transition flex items-center gap-1 ${targetUser === currentUser && view === 'profile' && initialProfileTab === 'bookmarks' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                            >
                                Library
                            </button>
                        )}
                    </div>
                    
                    {/* AUTH SECTION */}
                    {token ? (
                        <>
                            {/* === NEW: WRITE BUTTON (Desktop Only) === */}
                            <button 
                                onClick={onCreateClick}
                                className="hidden md:flex items-center gap-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-full font-bold shadow-sm transition active:scale-95 text-sm mr-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                                <span>Write</span>
                            </button>

                            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

                            {/* NOTIFICATIONS */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotifDropdown(!showNotifDropdown)} 
                                    className="notif-bell relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                    </svg>
                                    {hasUnread && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}
                                </button>

                                {showNotifDropdown && (
                                    <div className="notif-dropdown absolute right-[-50px] md:right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fade-in-up">
                                        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/50">
                                            <span className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">Notifications</span>
                                            {hasUnread && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">New</span>}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400 dark:text-gray-600"><p className="text-xs">All caught up!</p></div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div key={n.id} onClick={() => { markRead(n.id); if(n.post_id) openPost(n.post_id, true); setShowNotifDropdown(false); }} className={`p-4 text-sm cursor-pointer border-b border-gray-50 dark:border-gray-800 transition hover:bg-gray-50 dark:hover:bg-gray-800 flex gap-3 ${!n.is_read ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'bg-white dark:bg-[#1a1a1a]'}`}>
                                                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                                        <p className="text-gray-800 dark:text-gray-200 leading-snug">{n.text}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* PROFILE AVATAR */}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleGoProfile} 
                                    className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-80 transition flex-shrink-0"
                                    title="View Profile"
                                >
                                    {(myProfile?.image || myProfile?.profile_picture) ? (
                                        <img src={getAvatarUrl(myProfile.image || myProfile.profile_picture)} alt={currentUser} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{currentUser.charAt(0).toUpperCase()}</div>
                                    )}
                                </button>
                                
                                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Logout">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
                            <button 
                                onClick={() => setView('login')} 
                                className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition px-2 py-1.5 md:px-3 md:py-2"
                            >
                                Log In
                            </button>
                            <button 
                                onClick={() => setView('register')} 
                                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-white bg-black dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-md flex items-center gap-1 whitespace-nowrap"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;