
import React, { memo } from 'react';
import { Obstacle } from '../types';
import { useLevelContext } from '../contexts/LevelContext';
import { BeachObstacleIcon, isBeachObstacleType } from '../levels';
import { CoinIcon, ShellIcon } from './PickupIcons';

interface ObstacleComponentProps {
  obstacle: Obstacle;
  groundY: number;
}

const ObstacleComponent: React.FC<ObstacleComponentProps> = memo(({ obstacle, groundY }) => {
  const { levelId } = useLevelContext();

  const renderIcon = () => {
    if (levelId === 'BEACH' && isBeachObstacleType(obstacle.type)) {
      return <BeachObstacleIcon obstacle={obstacle} />;
    }

    switch (obstacle.type) {
      case 'COIN':
        return <CoinIcon />;
      case 'SHELL':
        return <ShellIcon />;
      case 'SPEED':
        return (
          <div className="bg-blue-500 rounded-lg p-2 border-2 border-white shadow-lg animate-pulse h-full w-full flex items-center justify-center">
            <span className="text-white font-black text-2xl italic">S</span>
          </div>
        );
      case 'MAGNET':
        return (
          <div className="bg-yellow-500 rounded-lg p-2 border-2 border-white shadow-lg animate-pulse h-full w-full flex items-center justify-center">
            <span className="text-red-600 font-black text-2xl italic">U</span>
          </div>
        );
      case 'SUPER_SIZE':
        return (
          <div className="bg-purple-500 rounded-lg p-2 border-2 border-white shadow-lg animate-pulse h-full w-full flex items-center justify-center relative">
            <span className="text-white font-black text-2xl italic">S</span>
            <div className="absolute inset-0 bg-purple-300 rounded-lg animate-ping opacity-75" />
          </div>
        );
      default:
        return null;
    }
  };

  const yPos = obstacle.y !== undefined ? obstacle.y : obstacle.type === 'SEAGULL' ? 220 : groundY;

  if (obstacle.isCollected) return null;

  return (
    <div
      className="absolute game-obstacle"
      style={{
        transform: `translate3d(${obstacle.x}px, ${-yPos}px, 0)`,
        width: `${obstacle.width}px`,
        height: `${obstacle.height}px`,
        bottom: 0,
        left: 0,
      }}
    >
      {renderIcon()}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.obstacle.x === nextProps.obstacle.x &&
    prevProps.obstacle.y === nextProps.obstacle.y &&
    prevProps.obstacle.isCollected === nextProps.obstacle.isCollected &&
    prevProps.obstacle.isSwooping === nextProps.obstacle.isSwooping &&
    prevProps.obstacle.rotation === nextProps.obstacle.rotation
  );
});

export default ObstacleComponent;
