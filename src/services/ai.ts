import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const model = 'gemini-flash-latest';
const config = {};

export async function summarizeCommits(commits: any[], sessions: any[]): Promise<string> {
  if (commits.length === 0) {
    return 'No commits were made today.';
  }

  let prompt = `
    You are an AI assistant helping a developer report their daily work to their manager.
    Below is a list of git commit messages for today, along with "Focus Sessions" (periods of continuous deep work).

    Please summarize this into a professional, concise, and easy-to-read daily report.
    - DO NOT use markdown characters like **, #, or / in your response.
    - Use plain text only.
    - Group the report into sections: "Focus Sessions", "Accomplishments", and "Value Delivered".
    - Use simple dashes (-) for bullet points.
    - Highlight the "Focus Sessions" to show deep work.
    - Summarize the commits into clear bullet points.
    - Focus on value delivered.

    Focus Sessions: ${sessions.length} sessions detected.
  `;

  for (const session of sessions) {
    const start = new Date(session.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = new Date(session.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    prompt += `\n- Session: ${start} to ${end} (${session.count} commits)`;
  }

  prompt += `\n\nCommits:`;
  for (const commit of commits) {
    prompt += `\n- [${commit.project_name}] ${commit.message}`;
  }

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
    return `Summary of today's work:\n${commits.map(c => `- [${c.project_name}] ${c.message}`).join('\n')}`;
  }
}
