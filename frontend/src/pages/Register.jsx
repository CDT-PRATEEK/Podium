import { useState } from 'react'
import api from '../services/api' 

function Register({ setView, showToast }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') 
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
        showToast("Passwords do not match!", 'error')
        return 
    }

    setLoading(true)

    try {
      await api.post('register/', { username, email, password })
      showToast("Account created! Please login.", 'success')
      setView('login') 
    } catch (error) {
      if (error.response && error.response.data) {
          const data = error.response.data
          if (data.username) showToast(`Username error: ${data.username[0]}`, 'error')
          else if (data.email) showToast(`Email error: ${data.email[0]}`, 'error') 
          else if (data.password) showToast(`Password error: ${data.password[0]}`, 'error')
          else showToast("Registration failed.", 'error')
      } else {
          showToast("Server error.", 'error')
      }
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

        {/* COMPACT HEADER: Reduced mb-4 on mobile */}
        <div className="text-center mb-5 md:mb-8 mt-6 md:mt-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create Account</h1>
            <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 mt-1">Join the community today</p>
        </div>

        {/* TIGHTER FORM SPACING: space-y-3 on mobile */}
        <form onSubmit={handleRegister} className="space-y-3 md:space-y-5">
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Username <span className="text-red-500">*</span></label>
            <input 
                className="w-full px-4 py-2.5 md:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm md:text-base" 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
            <input 
                className="w-full px-4 py-2.5 md:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm md:text-base" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
            />
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password <span className="text-red-500">*</span></label>
            <input 
                className="w-full px-4 py-2.5 md:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm md:text-base" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                minLength="6" 
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Confirm <span className="text-red-500">*</span></label>
            <input 
                className={`w-full px-4 py-2.5 md:py-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 outline-none transition font-medium text-sm md:text-base ${
                    confirmPassword && password !== confirmPassword 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                minLength="6"
                placeholder="Retype password"
            />
             {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1 font-bold">Passwords must match.</p>
            )}
          </div>

        
          <div className="pt-2">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 md:py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
            >
                {loading ? <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Already have an account? 
            <button onClick={() => setView('login')} className="ml-1 text-blue-600 dark:text-blue-400 font-bold hover:underline transition">
                Sign In
            </button>
        </div>
      </div>
    </div>
  )
}

export default Register