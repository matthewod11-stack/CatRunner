import React from 'react';
import MatteCatImage from './MatteCatImage';
import { useCatAssetObjectUrl } from '../hooks/useCatAssetObjectUrl';
import type { HighScoreEntry } from '../types';

interface HallOfFameCatAvatarProps {
  entry: HighScoreEntry;
  storageReady: boolean;
}

const HallOfFameCatAvatar: React.FC<HallOfFameCatAvatarProps> = ({ entry, storageReady }) => {
  const assetUrl = useCatAssetObjectUrl(entry.catAssetId ?? null, storageReady);
  const src = assetUrl || entry.catUrl || null;

  if (!src) {
    return (
      <div className="w-12 h-12 rounded-full border-2 border-amber-200 bg-amber-100 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">🐾</span>
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-full border-2 border-amber-200 bg-amber-100 overflow-hidden flex items-center justify-center flex-shrink-0">
      <MatteCatImage
        src={src}
        alt={entry.name}
        className="w-full h-full"
        imgClassName="w-full h-full object-contain scale-110"
        loading="lazy"
        showSpinner={false}
      />
    </div>
  );
};

export default HallOfFameCatAvatar;
