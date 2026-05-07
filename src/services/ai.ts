import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const model = 'gemini-flash-latest';
const config = {};

export async function summarizeCommits(commits: string[]): Promise<string> {
  if (commits.length === 0) {
    return 'No commits were made today.';
  }

  const prompt = `
    You are an AI assistant helping a developer report their daily work to their manager.
    Below is a list of git commit messages for today. 
    Please summarize these commits into a professional, concise, and easy-to-read bulleted list for a daily report.
    Ensure the tone is professional and focuses on the value delivered.

    Commit Messages:
    ${commits.map(c => `- ${c}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      config,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    return response.text || 'Failed to generate summary.';
  } catch (error: any) {
    logger.error(`Error generating AI summary: ${error.message || error}`);
    return `Summary of today's work:\n${commits.map(c => `- ${c}`).join('\n')}`;
  }
}
