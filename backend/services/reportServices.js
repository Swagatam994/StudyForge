export const analyzeAttempt = (answers, score, timeTaken) => {
  // Group by topic
  const topicMap = {};
  answers.forEach(({ topic, isCorrect }) => {
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    if (isCorrect) topicMap[topic].correct++;
  });

  const topicScores = Object.entries(topicMap).map(([topic, val]) => ({
    topic,
    score: Math.round((val.correct / val.total) * 100),
  }));

  const strongTopics = topicScores.filter(t => t.score >= 70).map(t => t.topic);
  const weakTopics = topicScores.filter(t => t.score < 70).map(t => t.topic);

  // Classify learner
  let learnerType;
  if (score >= 80) learnerType = "Fast Learner";
  else if (score >= 50) learnerType = "Medium Learner";
  else learnerType = "Slow Learner";

  return { learnerType, strongTopics, weakTopics, topicScores };
};
