import { useState } from 'react'
import api from '../services/api' 

export default function Login({ onLogin, showToast, setView }) { 
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Call the backend
      const res = await api.post('api-token-auth/', { username, password })
      const token = res.data.token 
      
      if (!token) throw new Error("Server login succeeded but no token found!")

      // 2. Save Token Manually (Safety Check)
      localStorage.setItem('myBlogToken', token);
      localStorage.setItem('myBlogUser', username);

      // 3. Update App State (This triggers the smooth UI update)
      onLogin(token, username) 
      
      showToast(`Welcome, ${username}!`, 'success')
      
      // === REMOVED THE HARD RELOAD ===
      // React will now see the new token, re-render App.jsx, 
      // and Home.jsx will automatically fetch the fresh feed.
      
    } catch (err) {
      console.error("Login Error:", err)
      let errorMessage = "Something went wrong"
      
      if (err.response?.data?.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
      } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
      } else if (err.message) {
          errorMessage = err.message;
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modern-grid-bg min-h-screen w-full flex items-center justify-center p-4">
      
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 transition-colors duration-300">

          <button 
              onClick={() => setView('home')}
              className="absolute top-4 left-4 md:top-6 md:left-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition flex items-center gap-1 text-xs md:text-sm font-bold"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Home
          </button>

          <div className="text-center mb-6 md:mb-8 mt-6 md:mt-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Enter your details to sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 md:mb-2">Username</label>
              <input 
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white border-none focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm md:text-base"
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. batman"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 md:mb-2">Password</label>
              <input 
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white border-none focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm md:text-base"
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
              <div className="flex justify-end mt-2">
                  <button 
                      type="button" 
                      onClick={() => setView('forgot-password')} 
                      className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition"
                  >
                      Forgot Password?
                  </button>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-bold py-3 md:py-4 rounded-xl transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex justify-center items-center text-sm md:text-base"
            >
              {loading ? (
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <button 
              onClick={() => setView('register')} 
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition"
            >
              Create new account
            </button>
          </div>

      </div>
    </div>
  )
}