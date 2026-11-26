const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test() {
  const activeModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  console.log('Testing model:', activeModel);
  console.time('gemini_call_default');
  const model = genAI.getGenerativeModel({
    model: activeModel,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });
  const res = await model.generateContent('Generate 5 multiple-choice questions about JavaScript loops as JSON with question, options (4 strings), correctAnswer (0-3), explanation.');
  console.timeEnd('gemini_call_default');
  console.log('Length:', res.response.text().length);

  console.time('gemini_call_with_thinking_0');
  const fastModel = genAI.getGenerativeModel({
    model: activeModel,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  const res2 = await fastModel.generateContent('Generate 5 multiple-choice questions about JavaScript loops as JSON with question, options (4 strings), correctAnswer (0-3), explanation.');
  console.timeEnd('gemini_call_with_thinking_0');
  console.log('Fast length:', res2.response.text().length);
}

test().catch(console.error);
