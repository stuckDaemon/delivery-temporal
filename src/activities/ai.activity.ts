import { httpClient } from '../api/utils/http';
import * as dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
const FALLBACK_MESSAGE =
  'We’re experiencing some traffic delays and your delivery might arrive later than expected. Thank you for your patience!';

const OPENAI_HEADERS = {
  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
};

function buildPrompt(template: string, name?: string, delay?: number): string {
  return template
    .replace('{name}', name || 'the customer')
    .replace('{delay}', delay != null ? String(delay) : '');
}

async function requestOpenAI(prompt: string, attempt = 1): Promise<string> {
  try {
    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: 'You generate delivery delay notifications via SMS.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    };

    const response = await httpClient.post<any>(OPENAI_API_URL, body, { headers: OPENAI_HEADERS });
    const message = response.choices?.[0]?.message?.content?.trim();

    if (message) {
      console.info(`[AI Activity] Generated message: ${message}`);
      return message;
    }

    console.warn('[AI Activity] Empty AI response, using fallback.');
    return FALLBACK_MESSAGE;
  } catch (err: any) {
    console.error(`[AI Activity] OpenAI request failed (attempt ${attempt}): ${err.message}`);

    // Simple retry for transient errors (network/5xx)
    if (attempt < 3 && (err.code === 'ECONNRESET' || err.response?.status >= 500)) {
      return requestOpenAI(prompt, attempt + 1);
    }

    return FALLBACK_MESSAGE;
  }
}

export async function generateIncreasedDelayMessage(name: string, delay: number) {
  const prompt = buildPrompt(
    'Let {name} know the traffic delay has increased to {delay} minutes.',
    name,
    delay
  );
  return requestOpenAI(prompt);
}

export async function generateReducedDelayMessage(name: string, delay: number) {
  const prompt = buildPrompt(
    'Let {name} know the delay has decreased. New estimated delay is {delay} minutes.',
    name,
    delay
  );
  return requestOpenAI(prompt);
}

export async function generateClearDelayMessage(name: string) {
  const prompt = buildPrompt(
    'Inform {name} that the delay has cleared and the delivery is now back on track.',
    name
  );
  return requestOpenAI(prompt);
}

export async function generateCustomDelayMessage(customerName: string, delayMinutes: number) {
  const prompt = `You're a friendly assistant. Write a short SMS message to ${
    customerName || 'the customer'
  } letting them know their delivery will be delayed by ${delayMinutes} minutes due to traffic. Be polite and reassuring.`;
  return requestOpenAI(prompt);
}
