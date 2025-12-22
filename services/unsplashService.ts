const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export interface UnsplashImage {
  id: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
  };
  description: string | null;
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

/**
 * Search for images on Unsplash
 * @param query - Search query (e.g., "white cat", "beach kitty")
 * @param page - Page number (default: 1)
 * @param perPage - Results per page (default: 20, max: 30)
 */
export async function searchUnsplashImages(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<UnsplashSearchResponse> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('Unsplash Access Key is not configured');
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${Math.min(perPage, 30)}&client_id=${UNSPLASH_ACCESS_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Unsplash API Error:', error);
    throw error;
  }
}

/**
 * Get a random image from Unsplash based on a query
 * @param query - Search query
 */
export async function getRandomUnsplashImage(query: string): Promise<UnsplashImage | null> {
  try {
    const response = await searchUnsplashImages(query, 1, 1);
    return response.results[0] || null;
  } catch (error) {
    console.error('Error fetching random image:', error);
    return null;
  }
}

