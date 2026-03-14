export const typedFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Fetch error: ${response.status} ${response.statusText} for URL ${url}`,
    );
  }

  try {
    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    throw new Error(`Failed to parse JSON response from ${url}: ${error}`);
  }
};
