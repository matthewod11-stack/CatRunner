import React from 'react';
import { useMatteCatUrl } from '../hooks/useMatteCatUrl';

export type MattedCatMattingState = {
  displayUrl: string | null;
  isProcessing: boolean;
};

interface MatteCatImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Default `eager` so equipped cat / customizer preview paint immediately. */
  loading?: 'eager' | 'lazy';
  showSpinner?: boolean;
  /**
   * When set, skips internal matting so menus and gameplay share one `useMatteCatUrl` in App.
   */
  mattedFromParent?: MattedCatMattingState;
}

const MatteCatImage: React.FC<MatteCatImageProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  loading = 'eager',
  showSpinner = true,
  mattedFromParent,
}) => {
  const internal = useMatteCatUrl(mattedFromParent ? null : (src ?? null));
  const displayUrl = mattedFromParent ? mattedFromParent.displayUrl : internal.displayUrl;
  const isProcessing = mattedFromParent ? mattedFromParent.isProcessing : internal.isProcessing;

  if (!src) return null;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src={displayUrl || src}
        alt={alt}
        loading={loading}
        className={`${imgClassName} ${isProcessing && !displayUrl ? 'opacity-0' : 'opacity-100'}`}
      />
      {showSpinner && isProcessing && !displayUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="motion-intense w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default MatteCatImage;
