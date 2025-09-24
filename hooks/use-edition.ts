"use client";

import { useState, useEffect } from 'react';
import { type Edition, fetchCurrentEdition, getEdition, refreshEditionCache } from '@/lib/edition';

export function useEdition() {
  const [edition, setEdition] = useState<Edition>(() => getEdition());
  const [isLoading, setIsLoading] = useState(false);

  const refreshEdition = async () => {
    setIsLoading(true);
    try {
      // Clear the cache first
      refreshEditionCache();
      const currentEdition = await fetchCurrentEdition();
      setEdition(currentEdition);
    } catch (error) {
      console.error('Failed to refresh edition:', error);
      // Fallback to cached edition
      setEdition(getEdition());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the latest edition on mount
    refreshEdition();
  }, []);

  return {
    edition,
    isLoading,
    refreshEdition
  };
}
