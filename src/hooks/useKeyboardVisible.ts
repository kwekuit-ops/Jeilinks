import { useState, useEffect } from 'react';

export function useKeyboardVisible() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // If the window height is significantly smaller than the screen height, 
      // it's likely the keyboard is open.
      const isVisible = window.innerHeight < window.outerHeight * 0.75;
      setKeyboardVisible(isVisible);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isKeyboardVisible;
}
