
import { GoogleGenAI } from "@google/genai";
import { Report } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const summarizeDailyReports = async (reports: Report[]): Promise<string> => {
  try {
    const ai = getAIClient();
    
    const prompt = `
      Based on the following team daily reports, provide a concise 2-sentence executive summary of today's progress and main blockers.
      
      Reports:
      ${reports.map(r => `- ${r.userName} (${r.status}): ${r.content}`).join('\n')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI summary is currently unavailable. Please check your configuration.";
  }
};

export const optimizeEODContent = async (
  content: string, 
  blockers: string, 
  plan: string, 
  user: { name: string }, 
  shift: { start: string, end: string },
  breaks: { start: string, end: string }[],
  date: string,
  links: string[] = [],
  files: { name: string }[] = []
): Promise<string> => {
  try {
    const ai = getAIClient();

    const breakLog = breaks.length > 0 
      ? breaks.map(b => `${b.start} – ${b.end}`).join(', ')
      : 'None';

    const linksLog = links.length > 0
      ? `\n\n### **Related Links**\n${links.map(l => `* ${l}`).join('\n')}`
      : '';

    const filesLog = files.length > 0
      ? `\n\n### **Attachments**\n${files.map(f => `* ${f.name}`).join('\n')}`
      : '';

    const prompt = `
      Draft a professional EOD email using the following components. 
      IMPORTANT: You MUST include the links and files provided at the end of the summary if they are present.
      
      Subject: EOD Report | ${user.name} – ${date}

      Details provided:
      Shift Schedule: ${shift.start} – ${shift.end}
      Breaks: ${breakLog}
      Achievements: ${content}
      Blockers: ${blockers}
      Plan: ${plan}
      Links: ${links.join(', ')}
      Files: ${files.map(f => f.name).join(', ')}

      Please produce a refined, professional version of this report.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    let result = response.text || content;
    if (linksLog && !result.includes(links[0] || '___')) result += linksLog;
    if (filesLog && !result.includes(files[0]?.name || '___')) result += filesLog;
    return result;
  } catch (error) {
    console.error("Gemini Optimization Error:", error);
    const linksLog = links.length > 0 ? `\n\n### **Related Links**\n${links.map(l => `* ${l}`).join('\n')}` : '';
    const filesLog = files.length > 0 ? `\n\n### **Attachments**\n${files.map(f => `* ${f.name}`).join('\n')}` : '';
    return content + linksLog + filesLog;
  }
};
