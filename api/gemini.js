import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in backend environment variables");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({ error: 'Missing required fields: model, contents' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Call the Gemini API
    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    // We must explicitly extract the text property as it might be a getter in the SDK 
    // and would be lost during JSON serialization otherwise.
    return res.status(200).json({
      text: response.text,
      candidates: response.candidates,
      usageMetadata: response.usageMetadata
    });
  } catch (error) {
    console.error('[GEMINI PROXY ERROR]', error);
    return res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
}
