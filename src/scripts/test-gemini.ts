import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

async function run() {
  try {
    // There isn't a direct listModels on the main class in the SDK usually, 
    // but we can try to see what's wrong by just testing a simple one.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('hi');
    console.log(result.response.text());
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Data:', JSON.stringify(error.response, null, 2));
    }
  }
}

run();
