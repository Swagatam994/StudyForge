import axios from "axios";

export const getVideosForTopics = async (topics) => {
  if (!Array.isArray(topics) || topics.length === 0) {
    return [];
  }

  const results = [];
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Fallback recommendations when YouTube API key is not configured.
  if (!apiKey) {
    return topics.map((topic) => ({
      topic,
      title: `${topic} tutorial`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} tutorial`)}`,
      thumbnail: "",
    }));
  }

  for (const topic of topics) {
    try {
      const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          q: `${topic} tutorial`,
          maxResults: 1,
          type: "video",
          key: apiKey,
        },
      });

      const item = res.data?.items?.[0];
      if (item) {
        results.push({
          topic,
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnail: item.snippet.thumbnails?.medium?.url || "",
        });
      } else {
        results.push({
          topic,
          title: `${topic} tutorial`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} tutorial`)}`,
          thumbnail: "",
        });
      }
    } catch (_error) {
      results.push({
        topic,
        title: `${topic} tutorial`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} tutorial`)}`,
        thumbnail: "",
      });
    }
  }
  return results;
};
