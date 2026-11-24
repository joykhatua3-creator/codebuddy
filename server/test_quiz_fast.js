const { generateQuiz } = require('./services/aiService');

async function test() {
  console.time('FirstCall');
  await generateQuiz(['Loops', 'Functions']);
  console.timeEnd('FirstCall');

  console.time('SecondCall_Cached');
  const result = await generateQuiz(['Loops', 'Functions']);
  console.timeEnd('SecondCall_Cached');

  console.log('Sample question:', result.questions[0].question);
}

test().catch(console.error);
