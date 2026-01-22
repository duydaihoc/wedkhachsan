import { useState } from 'react'

const ImageWithFallback = ({ src, alt, className, fallbackIcon = 'image' }) => {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className || ''}`}>
        <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">
          {fallbackIcon}
        </span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

export default ImageWithFallback
