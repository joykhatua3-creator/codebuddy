const { reviewCode } = require('./services/aiService');

async function test() {
  console.time('CodeReviewTime');
  const code = 'function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));';
  const result = await reviewCode(code, 'javascript');
  console.timeEnd('CodeReviewTime');
  console.log('Score:', result.score);
  console.log('Summary:', result.summary);
  console.log('Complexity:', result.complexity);
}

test().catch(console.error);
