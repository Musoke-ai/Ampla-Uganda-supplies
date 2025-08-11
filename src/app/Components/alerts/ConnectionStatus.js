import React, { useState, useEffect } from 'react';

function ConnectionStatus() {
  // 1. Remembers the current status (true for online, false for offline)
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 2. This whole block sets up the automatic listening process
  useEffect(() => {
    // This function will run automatically when the browser comes online
    const handleOnline = () => setIsOnline(true);
    
    // This function will run automatically when the browser goes offline
    const handleOffline = () => setIsOnline(false);

    // 3. Tells the browser to start listening for connection changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 4. (Important!) Cleans up the listeners when the component is removed
    // to prevent memory leaks.
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // The empty array [] means this setup runs only once

  // 5. React automatically shows the correct text based on the `isOnline` state
  return (
    <>
      {isOnline ? (
        <span className="text-white fw-bold">● Online</span>
      ) : (
        <span className="text-white fw-bold">● Offline</span>
      )}
    </>
  );
}

export default ConnectionStatus;