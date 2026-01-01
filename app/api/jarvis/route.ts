import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are JARVIS, an advanced AI assistant inspired by Iron Man's AI. 
You are helpful, intelligent, witty, and speak in a sophisticated manner.
Keep responses concise but informative (2-3 sentences max for voice responses).
Address the user respectfully, occasionally using "sir" or "ma'am".
You can help with: information queries, calculations, advice, and general conversation.
Never mention that you're made by any company - you are JARVIS.`;

const AUTH_TOKEN = process.env.JARVIS_AUTH_TOKEN || 'jarvis-secret-2026';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    name: 'JARVIS',
    version: '2.0-cloud',
    message: 'Hello! I am JARVIS, your personal AI assistant.',
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const body = await req.json();
    const token = authHeader?.replace('Bearer ', '') || body?.token;

    if (token !== AUTH_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userQuestion = body.text || body.question || '';

    if (!userQuestion.trim()) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      const response = getSimpleResponse(userQuestion);
      return NextResponse.json({ response });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuestion },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content || 
      "I apologize, I couldn't process that request.";

    return NextResponse.json({ response });

  } catch (error) {
    console.error('JARVIS Error:', error);
    const response = getSimpleResponse('');
    return NextResponse.json({ response });
  }
}

function getSimpleResponse(question: string): string {
  const q = question.toLowerCase();

  if (/hello|hi|hey/.test(q)) {
    return "Good day! I am JARVIS, at your service. How may I assist you?";
  }
  if (/time|clock/.test(q)) {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `The current time is ${now}, sir.`;
  }
  if (/date|today/.test(q)) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `Today is ${today}.`;
  }
  if (/who are you|your name/.test(q)) {
    return "I am JARVIS - Just A Rather Very Intelligent System. Your personal AI assistant.";
  }
  if (/thank/.test(q)) {
    return "You're most welcome. Is there anything else I can help with?";
  }
  if (/bye|goodbye/.test(q)) {
    return "Goodbye! Feel free to call upon me whenever you need assistance.";
  }

  return "I understand your query. For more intelligent responses, please ensure the AI service is properly configured.";
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
