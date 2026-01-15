import { useEffect, useState } from 'react'
import socket from '../services/socket'

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Lắng nghe thông báo booking được tạo
    socket.on('booking-created', (data) => {
      addNotification(data.message, 'success')
    })

    // Lắng nghe thông báo booking mới (cho admin)
    socket.on('new-booking', (data) => {
      addNotification(data.message, 'info')
    })

    // Lắng nghe thông báo booking được cập nhật (cho user)
    socket.on('booking-updated', (data) => {
      // Xác định loại thông báo dựa trên status
      let type = 'info'
      if (data.status === 'confirmed' || data.status === 'checked-in') {
        type = 'success'
      } else if (data.status === 'cancelled') {
        type = 'error'
      } else if (data.status === 'checked-out') {
        type = 'warning'
      }
      addNotification(data.message, type)
    })

    // Cleanup
    return () => {
      socket.off('booking-created')
      socket.off('new-booking')
      socket.off('booking-updated')
    }
  }, [])

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications((prev) => [...prev, notification])

    // Tự động xóa sau 5 giây
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    }, 5000)
  }

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getTypeStyles(notification.type)} px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] max-w-[400px] animate-slide-in`}
        >
          <p className="text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default NotificationToast
