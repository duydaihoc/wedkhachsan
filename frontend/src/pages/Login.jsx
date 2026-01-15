import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        setLoading(false)
        // Small delay to ensure state updates
        setTimeout(() => {
          if (result.data?.isAdmin) {
            navigate('/admin', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        }, 100)
      } else {
        setError(result.message)
        setLoading(false)
      }
    } catch (error) {
      setError('Có lỗi xảy ra, vui lòng thử lại')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background-light dark:bg-background-dark font-display text-charcoal dark:text-white antialiased">
      {/* Left Side - Image Section */}
      <section className="hidden md:block md:w-[60%] lg:w-[65%] relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzUQsCo8Xks3GsUXrJmKtdCZOLfBNuQqcZnDtIl5o0HWiUD42vcUbXrJVhjSXIHAJuavGEIkkQWCtQCxiJ0Rwu9nTDU7ISU04dVix7ZgZIthxObOdAKe-FZqQsZ6JHRQQgqbBwg8RkhZSe3B-_68BXFixESyXBFzvJ_41jaLHdAaEiyWoCQ5oToTgdb51T8HvjubLaZEXgh6vAoNI5gvb1gNLpARKNKD38N69RK2fdQvEJTGByaPrab9Avo5PGcG3743wFZic3H7uA')"
          }}
        ></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute bottom-16 left-16 max-w-lg z-10">
          <div className="text-primary mb-6">
            <svg className="size-12" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="serif-heading text-4xl lg:text-5xl text-white font-medium mb-4 leading-tight">
            Cánh cổng dẫn đến sự hùng vĩ vượt thời gian
          </h1>
          <p className="text-white/80 text-lg font-light">
            Bước vào không gian riêng tư của bạn và quản lý những trải nghiệm sắp tới cùng chúng tôi.
          </p>
        </div>
        <div className="absolute top-12 left-12 z-10 flex items-center gap-2">
          <h2 className="serif-heading text-white text-xl font-bold uppercase tracking-[0.3em]">Aurelius Grand</h2>
        </div>
      </section>

      {/* Right Side - Form Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-white dark:bg-background-dark relative">
        {/* Mobile Logo */}
        <div className="md:hidden mb-12 flex flex-col items-center">
          <div className="text-primary mb-4">
            <svg className="size-10" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="serif-heading text-xl font-bold uppercase tracking-widest">Aurelius Grand</h2>
        </div>

        <div className="w-full max-w-sm">
          <header className="mb-10">
            <h3 className="serif-heading text-3xl mb-3">Chào Mừng Trở Lại</h3>
            <p className="text-charcoal/50 dark:text-white/50 text-sm">
              Vui lòng nhập thông tin đăng nhập để truy cập tài khoản của bạn.
            </p>
          </header>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" method="POST">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-primary block" htmlFor="email">
                Địa Chỉ Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 dark:text-white/30 text-lg">
                  mail
                </span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-background-light dark:bg-white/5 border border-charcoal/5 rounded-lg text-sm transition-all focus:ring-primary focus:border-primary"
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold tracking-widest text-primary block" htmlFor="password">
                  Mật Khẩu
                </label>
                <a className="text-[10px] uppercase font-bold tracking-widest text-charcoal/40 hover:text-primary transition-colors" href="#">
                  Quên Mật Khẩu?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 dark:text-white/30 text-lg">
                  lock
                </span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-background-light dark:bg-white/5 border border-charcoal/5 rounded-lg text-sm transition-all focus:ring-primary focus:border-primary"
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                className="size-4 rounded border-charcoal/10 text-primary focus:ring-primary"
                id="remember"
                type="checkbox"
              />
              <label className="text-xs text-charcoal/60 dark:text-white/60" htmlFor="remember">
                Giữ tôi đăng nhập trong 30 ngày
              </label>
            </div>

            <button
              className="w-full bg-charcoal dark:bg-primary text-white dark:text-background-dark py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-luxury disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <footer className="mt-10 pt-10 border-t border-charcoal/5 dark:border-white/5 text-center">
            <p className="text-sm text-charcoal/50 dark:text-white/50 mb-4">Mới đến với Aurelius Grand?</p>
            <Link
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:gap-3 transition-all"
              to="/register"
            >
              Đăng ký tài khoản mới
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </footer>
        </div>

        <Link
          className="absolute top-8 right-8 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-charcoal/40 hover:text-charcoal transition-colors"
          to="/"
        >
          <span className="material-symbols-outlined text-sm">close</span>
          Thoát
        </Link>
      </section>
    </main>
  )
}

export default Login
