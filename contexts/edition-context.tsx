"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Edition, fetchCurrentEdition, getEdition } from '@/lib/edition';

interface EditionContextType {
  edition: Edition;
  isLoading: boolean;
  refreshEdition: () => Promise<void>;
}

const EditionContext = createContext<EditionContextType | undefined>(undefined);

export function EditionProvider({ children }: { children: React.ReactNode }) {
  const [edition, setEdition] = useState<Edition>(() => getEdition());
  const [isLoading, setIsLoading] = useState(false);

  const refreshEdition = async () => {
    setIsLoading(true);
    try {
      const currentEdition = await fetchCurrentEdition();
      setEdition(currentEdition);
    } catch (error) {
      console.error('Failed to refresh edition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the latest edition on mount
    refreshEdition();
  }, []);

  return (
    <EditionContext.Provider value={{ edition, isLoading, refreshEdition }}>
      {children}
    </EditionContext.Provider>
  );
}

export function useEditionContext() {
  const context = useContext(EditionContext);
  if (context === undefined) {
    throw new Error('useEditionContext must be used within an EditionProvider');
  }
  return context;
}
