import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3EDE3] via-[#EAE0D2] to-[#E3D4DC] text-[#4A1D3D] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-5 h-5 text-[#B38838] mb-1.5 opacity-80" strokeWidth={1.5} />
        {fallbackTitle && (
          <span className="font-display text-sm font-medium text-[#4A1D3D] line-clamp-2">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
