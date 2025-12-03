import { GoogleGenAI, Type } from "@google/genai";
import { Project, CalendarTask } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSchedule = async (
  projects: Project[],
  userPrompt: string,
  currentYear: number
): Promise<Partial<CalendarTask>[]> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `
    You are an expert family task planner and social media content strategist.
    The user has a set of projects for December ${currentYear}.
    Based on their request, generate a list of calendar tasks.
    Each task must belong to one of the provided projects.
    Tasks should have specific dates in December ${currentYear}.
    Time windows should be realistic (e.g., baking takes 2-3 hours).
    Include a checklist of sub-tasks for each task.
    
    CRITICAL: For each task, you MUST provide exactly 3 social media content ideas:
    1. A 'video' idea (e.g., Reel, TikTok trend)
    2. A 'story' idea (e.g., Behind the scenes, poll)
    3. An 'image' idea (e.g., Aesthetic photo, finished result)
    
    Available Projects: ${JSON.stringify(projects.map(p => ({ id: p.id, name: p.name })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              projectId: { type: Type.STRING, description: "The ID of the project this task belongs to" },
              title: { type: Type.STRING, description: "Short title of the task" },
              date: { type: Type.STRING, description: `Date in YYYY-MM-DD format (must be in December ${currentYear})` },
              startTime: { type: Type.STRING, description: "Start time in HH:mm 24h format" },
              endTime: { type: Type.STRING, description: "End time in HH:mm 24h format" },
              description: { type: Type.STRING, description: "Brief description of the task" },
              checklistItems: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of strings for checklist items"
              },
              contentIdeas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["video", "story", "image"] },
                    text: { type: Type.STRING, description: "Description of the content idea" }
                  },
                  required: ["type", "text"]
                },
                description: "List of 3 social media ideas (video, story, image)"
              }
            },
            required: ["projectId", "title", "date", "startTime", "endTime", "checklistItems", "contentIdeas"]
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Map raw data to partial CalendarTask structure
    return rawData.map((item: any) => ({
      projectId: item.projectId,
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      description: item.description,
      checklist: item.checklistItems?.map((text: string) => ({
        id: crypto.randomUUID(),
        text,
        completed: false
      })) || [],
      contentIdeas: item.contentIdeas?.map((idea: any) => ({
        id: crypto.randomUUID(),
        type: idea.type,
        text: idea.text
      })) || [],
      completed: false
    }));

  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};