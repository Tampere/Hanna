import { RefObject, useEffect } from 'react';

/**
 * Hook for waiting for all the content inside a given element to load.
 * @param ref Element ref
 * @param callback Callback
 */
export function useOnContentLoaded<T extends HTMLElement>(ref: RefObject<T>, callback: () => void) {
  useEffect(() => {
    async function wait() {
      // Wait for the 'load' event for every image element
      const images = Array.from(ref.current?.querySelectorAll('img') ?? []);
      await Promise.all(
        images.map(
          (image) =>
            new Promise((resolve) => {
              image.addEventListener('load', resolve);
              // If there are any load errors, consider the content still loaded
              image.addEventListener('error', resolve);
            })
        )
      );

      callback();
    }

    wait();
  }, [ref]);
}
