"use client";

import React, { useState, useEffect } from 'react';
import { getEdition, getEntitlements, fetchCurrentEdition } from '@/lib/edition';

export default function DebugEdition() {
  const [apiEdition, setApiEdition] = useState<string>('Loading...');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    // Fetch edition from API
    const fetchEdition = () => {
      fetch('/api/editions')
        .then(res => res.json())
        .then(data => setApiEdition(data.edition))
        .catch(() => setApiEdition('Error'));
    };

    fetchEdition();

    // Listen for edition updates
    const handleEditionUpdate = () => {
      fetchEdition();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('edition-updated', handleEditionUpdate);
    
    return () => {
      window.removeEventListener('edition-updated', handleEditionUpdate);
    };
  }, []);

  const localEdition = getEdition();
  const entitlements = getEntitlements();

  const handleForceSync = async () => {
    try {
      const newEdition = await fetchCurrentEdition();
      setApiEdition(newEdition);
      setRefreshKey(prev => prev + 1);
      // Force page reload to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to sync edition:', error);
    }
  };

  return (
    <div className="fixed top-4 left-4 bg-black text-white p-2 text-xs z-50 rounded max-w-xs">
      <div>Local Edition: {localEdition}</div>
      <div>API Edition: {apiEdition}</div>
      <div>Features: {entitlements.size} total</div>
      <div className="text-yellow-300">
        {localEdition !== apiEdition ? '⚠️ MISMATCH!' : '✅ Synced'}
      </div>
      {localEdition !== apiEdition && (
        <button 
          onClick={handleForceSync}
          className="mt-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          Force Sync
        </button>
      )}
    </div>
  );
}
