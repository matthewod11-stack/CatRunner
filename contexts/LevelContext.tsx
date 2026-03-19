import React, { createContext, useContext } from 'react';
import type { LevelId } from '../types';

const LevelContext = createContext<{ levelId: LevelId }>({ levelId: 'BEACH' });

export function LevelProvider({
  levelId,
  children,
}: {
  levelId: LevelId;
  children: React.ReactNode;
}) {
  return <LevelContext.Provider value={{ levelId }}>{children}</LevelContext.Provider>;
}

export function useLevelContext(): { levelId: LevelId } {
  return useContext(LevelContext);
}
