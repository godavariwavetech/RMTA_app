import { useEffect, useRef } from 'react';

// Lets the open screen take over Android's system back button / gesture.
// App.tsx's hardwareBackPress listener calls runScreenBack() first; if the screen
// registered a handler, that handler runs (e.g. a form step saving its draft
// before going back) instead of App's plain history pop.
let current = null;

export function runScreenBack() {
  if (!current) return false;
  current();
  return true;
}

// Use in a screen: useScreenBack(handleBackPress). Always calls the latest
// handler, so it sees the current form values.
export function useScreenBack(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn = () => ref.current && ref.current();
    current = fn;
    return () => {
      if (current === fn) current = null;
    };
  }, []);
}
