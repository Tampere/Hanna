const csrfErrorCodes = new Set(['FST_CSRF_INVALID_TOKEN', 'FST_CSRF_MISSING_SECRET']);

interface CsrfFetchDeps {
  getCsrfToken: () => string | undefined;
  refreshCsrfToken: () => Promise<string | undefined>;
  fetchImpl?: typeof fetch;
}


export async function csrfAwareFetch(
  url: Parameters<typeof fetch>[0],
  options: RequestInit | undefined,
  deps: CsrfFetchDeps,
): Promise<Response> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const withCsrfHeader = () => ({
    ...options,
    headers: { ...options?.headers, 'csrf-token': deps.getCsrfToken() ?? '' },
  });

  let result = await fetchImpl(url, withCsrfHeader());

  if (result.status === 403) {
    const body = await result
      .clone()
      .json()
      .catch(() => null);
    if (csrfErrorCodes.has(body?.code)) {
      await deps.refreshCsrfToken();
      result = await fetchImpl(url, withCsrfHeader());
    }
  }

  return result;
}