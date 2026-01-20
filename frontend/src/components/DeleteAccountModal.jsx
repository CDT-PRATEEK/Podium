import React, { useState } from 'react';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, loading }) => {
    const [confirmText, setConfirmText] = useState('');
    const isMatch = confirmText === 'DELETE';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md border border-red-100 dark:border-red-900/30 overflow-hidden animate-fade-in-up">
                
                {/* Header */}
                <div className="bg-red-50 dark:bg-red-900/20 p-5 md:p-6 text-center border-b border-red-100 dark:border-red-900/30">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-1">Delete Account?</h2>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">This action is serious.</p>
                </div>

                {/* Body */}
                <div className="p-5 md:p-6 space-y-4">
                    <div className="bg-gray-50 dark:bg-black/40 p-3 md:p-4 rounded-xl text-xs md:text-sm text-gray-700 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-800">
                        <p><strong>1. Grace Period:</strong> Your account will be deactivated for <span className="text-blue-600 font-bold">30 days</span>. You can restore it by logging in.</p>
                        <p><strong>2. Permanent Loss:</strong> After 30 days, your data will be wiped.</p>
                        <p><strong>3. Content:</strong> Posts remain visible but marked as <span className="font-mono bg-gray-200 dark:bg-gray-800 px-1 rounded text-[10px] md:text-xs">Deleted User</span>.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                            Type <span className="text-red-600">DELETE</span> to confirm
                        </label>
                        <input 
                            type="text" 
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-transparent font-bold focus:border-red-500 outline-none transition text-sm md:text-base"
                            placeholder="DELETE"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-xl transition text-sm md:text-base"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={!isMatch || loading}
                            className={`flex-1 py-3 font-bold text-white rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm md:text-base
                                ${isMatch ? 'bg-red-600 hover:bg-red-700 hover:scale-[1.02]' : 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed opacity-70'}
                            `}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Confirm"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;