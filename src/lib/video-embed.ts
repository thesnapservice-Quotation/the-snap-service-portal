/**
 * Video Embed Utilities
 * Supports YouTube (watch, share, shorts, embed) and Instagram (posts, reels, tv).
 */

export interface ParsedVideoEmbed {
  type: 'youtube' | 'instagram' | 'custom' | null;
  embedUrl: string | null;
  originalUrl: string;
  isValid: boolean;
  aspectRatio: '16/9' | '9/16' | '1/1' | 'auto';
}

/**
 * Extract YouTube video ID and build privacy-enhanced embed URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Match:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    const videoId = match[1];
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
  }

  return null;
}

/**
 * Extract Instagram shortcode and build embed URL
 */
export function getInstagramEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  if (!trimmed.includes('instagram.com')) return null;

  // Match:
  // https://www.instagram.com/p/SHORTCODE/
  // https://www.instagram.com/reel/SHORTCODE/
  // https://www.instagram.com/tv/SHORTCODE/
  const match = trimmed.match(/instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  if (match && match[1] && match[2]) {
    const kind = match[1];
    const code = match[2];
    return `https://www.instagram.com/${kind}/${code}/embed/`;
  }

  return null;
}

/**
 * Comprehensive parser for YouTube, Instagram, or direct video embed
 */
export function parseVideoEmbed(url?: string): ParsedVideoEmbed {
  if (!url || !url.trim()) {
    return {
      type: null,
      embedUrl: null,
      originalUrl: '',
      isValid: false,
      aspectRatio: 'auto',
    };
  }

  const trimmed = url.trim();

  // 1. YouTube
  const yt = getYouTubeEmbedUrl(trimmed);
  if (yt) {
    return {
      type: 'youtube',
      embedUrl: yt,
      originalUrl: trimmed,
      isValid: true,
      aspectRatio: '16/9',
    };
  }

  // 2. Instagram
  const ig = getInstagramEmbedUrl(trimmed);
  if (ig) {
    return {
      type: 'instagram',
      embedUrl: ig,
      originalUrl: trimmed,
      isValid: true,
      aspectRatio: '9/16',
    };
  }

  // 3. Fallback: If user passed an existing iframe src
  if (trimmed.startsWith('https://') && (trimmed.includes('player.vimeo.com') || trimmed.includes('embed'))) {
    return {
      type: 'custom',
      embedUrl: trimmed,
      originalUrl: trimmed,
      isValid: true,
      aspectRatio: '16/9',
    };
  }

  return {
    type: null,
    embedUrl: null,
    originalUrl: trimmed,
    isValid: false,
    aspectRatio: 'auto',
  };
}
