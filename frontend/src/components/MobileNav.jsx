import React from 'react';

const MobileNavItem = ({ active, icon, label, onClick }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center w-full h-full ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
    >
        <div className="mb-0.5">{icon}</div>
        <span className="text-[10px] font-bold leading-none">{label}</span>
    </button>
);

const MobileNav = ({
    view,
    createTrigger,
    handleGoHome,
    handleGoExplore,
    handleMobileCreate,
    openProfile,
    currentUser,
    initialProfileTab,
    handleGoRecommendations, 
    token
}) => {
    
    return (
        <div className="
            md:hidden fixed bottom-0 left-0 right-0 z-50
            bg-white/90 dark:bg-gray-900/90
            backdrop-blur-md
            border-t border-gray-200 dark:border-gray-800
            transition-all
            px-2 py-1 pb-safe h-14
        ">
            <div className="flex justify-around items-center h-full w-full">
                
                {/* 1. HOME (Always Visible) */}
                <MobileNavItem 
                    active={view === 'home' && !createTrigger} 
                    onClick={handleGoHome} 
                    label="Home"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={view === 'home' && !createTrigger ? "currentColor" : "none"} stroke="currentColor" strokeWidth={view === 'home' && !createTrigger ? 0 : 2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>}
                />
                
                {/* 2. EXPLORE (Always Visible) */}
                <MobileNavItem 
                    active={view === 'explore'} 
                    onClick={handleGoExplore} 
                    label="Explore"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={view === 'explore' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={view === 'explore' ? 0 : 2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" /></svg>}
                />
                
                {/* 3. CREATE BUTTON (Logged In Only) */}
                {token && (
                    <button
                        onClick={handleMobileCreate}
                        className="
                        flex items-center justify-center
                        bg-blue-600 text-white
                        w-11 h-11
                        rounded-xl
                        shadow-md shadow-blue-600/25
                        active:scale-95
                        transition
                        "
                    >
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                        >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                )}

                {/* 4. LIBRARY (Logged In Only) */}
                {token && (
                    <MobileNavItem 
                        active={view === 'profile' && initialProfileTab === 'bookmarks'} 
                        onClick={() => openProfile(currentUser, 'bookmarks')} 
                        label="Library"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={view === 'profile' && initialProfileTab === 'bookmarks' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={view === 'profile' && initialProfileTab === 'bookmarks' ? 0 : 2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>}
                    />
                )}
                
                {/* 5. FOR YOU (Logged In Only) - REPLACED PROFILE */}
                {token && (
                    <MobileNavItem 
                        active={view === 'recommendations'} 
                        onClick={handleGoRecommendations} 
                        label="For You" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={view === 'recommendations' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={view === 'recommendations' ? 0 : 2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>}
                    />
                )}
            </div>
        </div>
    );
};

export default MobileNav;