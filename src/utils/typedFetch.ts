export const typedFetch = <T>(input: URL | RequestInfo, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json()) as Promise<T>;
