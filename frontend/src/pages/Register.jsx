import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)

    try {
      const result = await register(username, email, password)
      
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
    <main className="flex min-h-screen bg-background-light dark:bg-background-dark font-display text-charcoal dark:text-white antialiased overflow-hidden">
      {/* Left Side - Image Section */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzUQsCo8Xks3GsUXrJmKtdCZOLfBNuQqcZnDtIl5o0HWiUD42vcUbXrJVhjSXIHAJuavGEIkkQWCtQCxiJ0Rwu9nTDU7ISU04dVix7ZgZIthxObOdAKe-FZqQsZ6JHRQQgqbBwg8RkhZSe3B-_68BXFixESyXBFzvJ_41jaLHdAaEiyWoCQ5oToTgdb51T8HvjubLaZEXgh6vAoNI5gvb1gNLpARKNKD38N69RK2fdQvEJTGByaPrab9Avo5PGcG3743wFZic3H7uA')"
          }}
        ></div>
        <div className="absolute inset-0 flex flex-col justify-end p-20 bg-gradient-to-t from-charcoal/80 to-transparent">
          <div className="max-w-md">
            <div className="flex items-center gap-3 text-primary mb-6">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
              </svg>
              <span className="serif-heading text-2xl font-bold uppercase tracking-widest text-white">Aurelius Grand</span>
            </div>
            <h2 className="serif-heading text-4xl text-white mb-4">Di Sản Tinh Tế Đang Chờ Đợi</h2>
            <p className="text-white/80 font-light leading-relaxed">
              Tham gia vào cộng đồng khách hàng độc quyền của chúng tôi và trải nghiệm đỉnh cao của dịch vụ hiếu khách tùy chỉnh, từ dịch vụ quản gia riêng đến những hành trình ẩm thực được chọn lọc.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-background-light dark:bg-background-dark overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h1 className="serif-heading text-4xl mb-3">Tạo Tài Khoản Của Bạn</h1>
            <p className="text-charcoal/60 dark:text-white/60 font-light">
              Nhập thông tin của bạn để bắt đầu hành trình cùng Aurelius Grand.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-primary block" htmlFor="username">
                Tên Đăng Nhập
              </label>
              <input
                className="w-full bg-transparent border-0 border-b border-charcoal/10 dark:border-white/10 px-0 py-3 text-sm focus:ring-0 focus:border-primary placeholder:text-charcoal/30 dark:placeholder:text-white/30 transition-all"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập của bạn"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-primary block" htmlFor="email">
                Địa Chỉ Email
              </label>
              <input
                className="w-full bg-transparent border-0 border-b border-charcoal/10 dark:border-white/10 px-0 py-3 text-sm focus:ring-0 focus:border-primary placeholder:text-charcoal/30 dark:placeholder:text-white/30 transition-all"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-primary block" htmlFor="password">
                Mật Khẩu
              </label>
              <input
                className="w-full bg-transparent border-0 border-b border-charcoal/10 dark:border-white/10 px-0 py-3 text-sm focus:ring-0 focus:border-primary placeholder:text-charcoal/30 dark:placeholder:text-white/30 transition-all"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-primary block" htmlFor="confirm-password">
                Xác Nhận Mật Khẩu
              </label>
              <input
                className="w-full bg-transparent border-0 border-b border-charcoal/10 dark:border-white/10 px-0 py-3 text-sm focus:ring-0 focus:border-primary placeholder:text-charcoal/30 dark:placeholder:text-white/30 transition-all"
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                className="mt-1 rounded border-charcoal/20 dark:border-white/20 text-primary focus:ring-primary h-4 w-4 transition-colors"
                id="newsletter"
                type="checkbox"
              />
              <label className="text-xs text-charcoal/60 dark:text-white/60 leading-relaxed cursor-pointer" htmlFor="newsletter">
                Đăng ký nhận bản tin của chúng tôi để nhận ưu đãi độc quyền, lời mời sự kiện riêng và cập nhật theo mùa.
              </label>
            </div>

            <button
              className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-luxury transition-all mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}
            </button>

            <div className="text-center pt-8">
              <p className="text-xs text-charcoal/40 dark:text-white/40 uppercase tracking-widest">
                Đã có tài khoản?{' '}
                <Link className="text-primary font-bold hover:underline ml-1" to="/login">
                  Đăng nhập thay vào đó
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-16 flex justify-center opacity-20">
            <span className="material-symbols-outlined text-4xl text-primary">diamond</span>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Register
