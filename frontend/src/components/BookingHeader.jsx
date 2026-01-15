import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BookingHeader = ({ currentStep = 1 }) => {
  const { user } = useAuth()

  const steps = [
    { number: 1, label: 'Xác Nhận' },
    { number: 2, label: 'Thanh Toán' },
    { number: 3, label: 'Hoàn Tất' }
  ]

  return (
    <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-6 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-widest uppercase font-display">Aurelius Grand</h2>
        </Link>
        
        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-2">
                <span className={`${currentStep === step.number ? 'text-primary font-bold italic' : 'opacity-40'}`}>
                  {step.number}. {step.label}
                </span>
                {index < steps.length - 1 && (
                  <span className="material-symbols-outlined text-xs opacity-30">chevron_right</span>
                )}
              </div>
            ))}
          </div>
        </nav>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:block text-sm">
              <span className="opacity-60">Xin chào, </span>
              <span className="font-semibold">{user.fullName || user.username}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default BookingHeader
