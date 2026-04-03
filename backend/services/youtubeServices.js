const axios = require("axios");

export const getVideosForTopics = async (topics) => {
  const results = [];
  for (const topic of topics) {
    const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: topic + " tutorial",
        maxResults: 1,
        type: "video",
        key: process.env.YOUTUBE_API_KEY,
      }
    });
    const item = res.data.items[0];
    if (item) {
      results.push({
        topic,
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
      });
    }
  }
  return results;
};