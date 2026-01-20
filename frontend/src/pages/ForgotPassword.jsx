import { useState } from 'react';
import api from '../services/api';

export default function ForgotPassword({ setView }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api.post('password_reset/', { email });
            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative">
                
                {/* Back Button */}
                <button 
                    onClick={() => setView('login')} 
                    className="absolute top-6 left-6 text-gray-400 hover:text-black font-bold text-sm flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Login
                </button>
                
                {status === 'success' ? (
                    <div className="text-center pt-8">
                        {/* PROFESSIONAL SUCCESS ICON */}
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                        <p className="text-gray-500 mb-6">
                            We have sent a password reset link to <br/>
                            <span className="font-medium text-gray-900">{email}</span>
                        </p>
                        
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-extrabold text-center mb-2 pt-4">Reset Password</h1>
                        <p className="text-center text-gray-500 mb-8 text-sm">Enter your email to receive instructions</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black transition"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
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
                                ) : 'Send Reset Link'}
                            </button>
                            
                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100">
                                    We couldn't find an account with that email.
                                </div>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}