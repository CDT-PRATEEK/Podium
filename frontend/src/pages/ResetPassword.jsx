import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ResetPassword({ setView }) {
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [status, setStatus] = useState('idle');
    // 1. NEW STATE: To store the actual error text
    const [errorMessage, setErrorMessage] = useState(''); 

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        if (urlToken) {
            setToken(urlToken);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage(''); // Clear previous errors

        try {
            await api.post('password_reset/confirm/', { token, password });
            setStatus('success');
            setTimeout(() => {
                window.history.replaceState({}, document.title, "/");
                setView('login');
            }, 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            
            // 2. BETTER ERROR HANDLING
            // We check if the server sent a specific reason (like weak password)
            if (err.response && err.response.data) {
                const data = err.response.data;
                
                if (data.password) {
                    // Backend says password is bad (e.g., "Too common")
                    setErrorMessage(Array.isArray(data.password) ? data.password[0] : data.password);
                } else if (data.token) {
                    // Backend says token is bad
                    setErrorMessage("This link is invalid or has expired.");
                } else if (data.detail) {
                    // Generic API detail error
                    setErrorMessage(data.detail);
                } else {
                    // Fallback: Grab the first error value found
                    setErrorMessage("Failed to reset password. Please try again.");
                }
            } else {
                setErrorMessage("Network error. Please try again.");
            }
        }
    };

    if (!token) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
                <div className="text-red-500 font-bold mb-2">Invalid Link</div>
                <p className="text-sm text-gray-500">The reset token is missing or broken.</p>
                <button onClick={() => setView('login')} className="mt-4 text-sm font-bold text-black hover:underline">Go to Login</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                
                {status === 'success' ? (
                    <div className="text-center py-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                             <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                        <p className="text-gray-500 text-sm">Your password has been updated successfully.</p>
                        <p className="text-gray-400 text-xs mt-4">Redirecting to login...</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-extrabold text-center mb-2">Set New Password</h1>
                        <p className="text-gray-500 text-center mb-8 text-sm">Please create a strong password.</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black transition"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <button 
                                disabled={status === 'loading'} 
                                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 flex justify-center items-center"
                            >
                                {status === 'loading' ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Update Password'}
                            </button>
                            
                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100">
                                    {/* 3. SHOW DYNAMIC ERROR MESSAGE */}
                                    {errorMessage || "An error occurred. Please try again."}
                                </div>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}