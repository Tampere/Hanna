/**
 * Retries a given promise until it's resolved or it gets rejected after given amount of times.
 *
 * @param promiseFn Function returning the promise to retry
 * @param options Options
 * @returns Promise result
 */
export async function retry<T>(
  promiseFn: () => Promise<T>,
  options: {
    /**
     * Maximum amount of retries
     */
    retries?: number;
    /**
     * Initial delay between retries
     */
    retryDelay?: number;
    /**
     * Timeout
     */
    timeout?: number;
    /**
     * Exponential factor to lengthen the delay as attempts grow
     */
    factor?: number;
    /**
     * Function that is called after each failed attempt before retrying
     */
    onRetry?: (data: { attempt: number; delay: number; error: any }) => void;
  }
) {
  // Destructure & assign default values if not specified
  const { retries = 10, retryDelay = 5000, timeout = 10000, factor = 2, onRetry } = options;
  let errors: any[] = [];

  for (let i = 0; i < retries; ++i) {
    // Try to execute the promise inside a wrapping promise
    try {
      return await new Promise<T>((resolve, reject) => {
        // Reject the wrapper promise if timeout is reached
        if (timeout) {
          setTimeout(() => {
            reject('timeout');
          }, timeout);
        }
        // Try to execute the original promise, pipe resolve & reject functions to the wrapping promise
        promiseFn().then(resolve).catch(reject);
      });
    } catch (error) {
      // On any error (timeout or promise rejection) wait for a while and retry
      errors.push(error);
      const delay = retryDelay * Math.pow(factor, i);
      onRetry?.({ attempt: i, delay, error });
      await sleep(delay);
    }
  }

  // No results were returned within given retries - throw all gathered errors
  throw errors;
}

/**
 * Sleeps for a given time
 *
 * @param ms Time to sleep (in milliseconds)
 * @returns
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
