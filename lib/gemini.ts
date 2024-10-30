import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("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");

export async function generateQuestions(topic: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `Generate 10 interview questions about ${topic}. Format the response as a JSON array of objects, where each object has a 'question' field. The questions should be challenging but clear.`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return JSON.parse(text);
}

export async function generateFeedback(topic: string, questionAnswers: { question: string; answer: string }[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `Analyze these interview answers about ${topic}:\n\n${JSON.stringify(questionAnswers)}\n\nProvide detailed feedback for each answer and suggest ideal responses. Format the response as a JSON object with 'overallFeedback' and 'detailedFeedback' fields, where 'detailedFeedback' is an array of objects containing 'question', 'feedback', and 'idealAnswer' fields.`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return JSON.parse(text);
}