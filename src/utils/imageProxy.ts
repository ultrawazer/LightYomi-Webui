/**
 * Image URL utility - routes all external images through proxy for CORS bypass and caching
 */

export const getProxiedImageUrl = (url: string | undefined | null): string => {
    if (!url) {
        return '/placeholder-cover.svg';
    }

    // Already proxied or local
    if (url.startsWith('/api/') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }

    // External URL - proxy it
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }

    // Relative path
    return url;
};

export const getCoverUrl = getProxiedImageUrl;
