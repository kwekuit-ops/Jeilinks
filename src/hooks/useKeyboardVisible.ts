import { useState, useEffect } from 'react';

export function useKeyboardVisible() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Focus-based detection: Keyboard is up when a text input is focused
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        const type = (target as HTMLInputElement).type;
        // Only trigger for text-entry input types
        if (!['checkbox', 'radio', 'submit', 'button', 'file', 'hidden', 'range', 'color'].includes(type)) {
          setKeyboardVisible(true);
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      // If focus is moving to another input/textarea, keep keyboard state as visible
      if (
        relatedTarget &&
        (relatedTarget.tagName === 'INPUT' ||
          relatedTarget.tagName === 'TEXTAREA' ||
          relatedTarget.isContentEditable)
      ) {
        const type = (relatedTarget as HTMLInputElement).type;
        if (!['checkbox', 'radio', 'submit', 'button', 'file', 'hidden', 'range', 'color'].includes(type)) {
          return;
        }
      }
      setKeyboardVisible(false);
    };

    // 2. Viewport/Resize-based detection: Keyboard shrinks the visual viewport height on iOS Safari & Android
    const initialHeight = window.innerHeight;
    const handleResize = () => {
      if (window.visualViewport) {
        // Visual viewport height is smaller when keyboard is up on iOS and Android
        const isVisible = window.visualViewport.height < window.innerHeight * 0.85;
        setKeyboardVisible(isVisible);
      } else {
        const isVisible = window.innerHeight < initialHeight * 0.8;
        setKeyboardVisible(isVisible);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    window.addEventListener('resize', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Run initial check
    handleResize();

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return isKeyboardVisible;
}
