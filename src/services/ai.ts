import { getDevSettings, addAIHistoryItem } from './db';

// System instruction to guide the real Gemini responses
const SYSTEM_INSTRUCTION = `You are QuoteVerse AI, an advanced motivational intelligence and coaching companion. 
You provide wisdom, goal planning, mood analysis, resume coaching, and productivity advice. 
Always return response in clean JSON or well-formatted markdown as requested. Do not include markdown code block syntax inside JSON responses.`;

export interface AIResponse {
  content: string;
  rawJson?: any;
}

// ----------------------------------------------------
// Gemini SDK Connection
// ----------------------------------------------------
const callRealGemini = async (prompt: string, expectJson = false): Promise<string> => {
  const settings = getDevSettings();
  if (!settings.geminiApiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: expectJson ? { responseMimeType: "application/json" } : undefined
    });

    const result = await model.generateContent([
      { text: SYSTEM_INSTRUCTION },
      { text: prompt }
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API call failed, using mock:", error);
    throw error;
  }
};

// ----------------------------------------------------
// Intelligent Local Fallback Engine (Demo Mode)
// ----------------------------------------------------
const generateLocalAIResponse = (
  type: string,
  prompt: string,
  inputs: Record<string, string>
): string => {
  switch (type) {
    case 'generator': {
      const topic = inputs.topic || 'Life';
      const mood = inputs.mood || 'Optimistic';
      const category = inputs.category || 'General';
      const quotesByTopic: Record<string, string[]> = {
        success: [
          "Opportunities don't happen. You create them.",
          "Great things are done by a series of small things brought together.",
          "The distance between sanity and greatness is measured only by success."
        ],
        motivation: [
          "Action is the foundational key to all success.",
          "Your limit is only your imagination. Push your boundaries today.",
          "Do something today that your future self will thank you for."
        ],
        life: [
          "Life is not a problem to be solved, but a reality to be experienced.",
          "The purpose of our lives is to be happy.",
          "In three words I can sum up everything I've learned about life: it goes on."
        ]
      };
      
      const list = quotesByTopic[topic.toLowerCase()] || quotesByTopic.motivation;
      const text = list[Math.floor(Math.random() * list.length)];
      
      return JSON.stringify({
        text,
        author: "AI Smart Generator",
        category,
        explanation: {
          meaning: `Generated quote for your ${mood} mood. This quote highlights that taking active ownership is essential for achieving progress.`,
          lesson: "Waiting for perfect conditions is a form of procrastination. Action creates its own momentum.",
          application: "Write down one task you've been delaying, and work on it for just 5 minutes today."
        }
      });
    }

    case 'career': {
      const feature = inputs.feature || 'roadmap';
      const profession = inputs.profession || 'Software Engineer';
      
      if (feature === 'resume') {
        return `### Resume Optimizer for ${profession}
1. **Highlight Impact Over Actions**: Use bullet points starting with strong action verbs and quantifying results (e.g., "Reduced page load time by 34% using Vite bundling optimizations").
2. **Technical Skills Stack**: Group skills by category (Languages, Frameworks, Tools) at the top of your resume.
3. **Tailor for ATS**: Scan job descriptions and insert critical keywords (e.g., "Responsive UI design", "State Management", "Rest APIs").`;
      } else if (feature === 'roadmap') {
        return `### Career Roadmap: ${profession}
* **Phase 1: Foundations (Months 1-3)**: Master core languages, version control (Git), and responsive layout design.
* **Phase 2: Framework Mastery (Months 4-6)**: Adopt modern component architectures (React, Vue) and state managers.
* **Phase 3: Backend & Deployment (Months 7-9)**: Connect to databases (Firestore, SQL), design APIs, and configure cloud hosting.
* **Phase 4: Optimization & Scalability (Months 10-12)**: Explore testing frameworks, performance audits, and advanced deployment workflows.`;
      } else if (feature === 'interview') {
        return `### Interview Preparation Guide: ${profession}
* **Behavioral Question**: "Tell me about a time you solved a complex bug."
  * *Tip*: Use the STAR method (Situation, Task, Action, Result) to demonstrate structured problem solving.
* **Technical Topic**: State management and API caching strategies.
  * *Tip*: Be prepared to explain how you sync cache with databases and optimize page re-renders.`;
      } else {
        return `### Skills suggestions for ${profession}:
* Professional adaptability
* Deep conceptual debugging
* Cross-functional communication`;
      }
    }

    case 'productivity': {
      const goal = inputs.goal || 'General Focus';
      return `### Productivity Plan: ${goal}
1. **The 90-Minute Rule**: Work on your primary priority for 90 minutes first thing in the morning before checking emails.
2. **Time Boxing**: Allocate 25-minute sprints (Pomodoro technique) for highly focused creation.
3. **Minimize Cognitive Switching**: Turn off notifications and use a single notepad for active thoughts.
4. **End-of-Day Review**: List your top 3 tasks for tomorrow to offload planning anxiety from your evening.`;
    }

    case 'mood': {
      const thoughts = prompt;
      let score = 7;
      let label = "Balanced";
      let analysis = "Your thoughts reflect a state of calm contemplation. You are navigating your responsibilities with stable energy.";
      let recommendations = [
        "Take a 10-minute mindful walk without your phone.",
        "Reflect on one item you completed successfully today.",
        "Drink a warm cup of herbal tea and rest your eyes."
      ];

      if (thoughts.toLowerCase().includes('sad') || thoughts.toLowerCase().includes('depressed') || thoughts.toLowerCase().includes('lonely')) {
        score = 3;
        label = "Sad/Melancholy";
        analysis = "You seem to be experiencing a period of low emotional energy. This is a natural phase of life, suggesting a need for self-compassion.";
        recommendations = [
          "Connect with a close friend or family member for a light chat.",
          "Engage in a creative activity like sketching or listening to soft music.",
          "Write a list of three small things you appreciate."
        ];
      } else if (thoughts.toLowerCase().includes('stress') || thoughts.toLowerCase().includes('anxious') || thoughts.toLowerCase().includes('worry') || thoughts.toLowerCase().includes('overwhelm')) {
        score = 4;
        label = "Stressed/Anxious";
        analysis = "Your text indicates elevated levels of tension or worry. Your nervous system is in a heightened state of alert, likely due to external pressures.";
        recommendations = [
          "Practice box breathing: inhale for 4s, hold 4s, exhale 4s, hold 4s.",
          "Write down all your worries on paper to physically offload them.",
          "De-clutter your immediate physical desk space."
        ];
      } else if (thoughts.toLowerCase().includes('happy') || thoughts.toLowerCase().includes('excited') || thoughts.toLowerCase().includes('glad') || thoughts.toLowerCase().includes('proud')) {
        score = 9;
        label = "Joyful/Energized";
        analysis = "You are experiencing a peak emotional state! Your text vibrates with gratitude, satisfaction, and optimism.";
        recommendations = [
          "Journal this moment in detail so you can revisit this feeling later.",
          "Share your positive energy by sending a word of appreciation to someone.",
          "Use this momentum to tackle a challenging creative goal."
        ];
      }

      return JSON.stringify({
        score,
        label,
        analysis,
        recommendations,
        suggestedQuoteIds: ['q_mot_1', 'q_hap_1', 'q_self_1']
      });
    }

    case 'journal': {
      const journalText = prompt;
      let score = 50;
      let label: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
      let analysis = "You recorded daily events with an objective, neutral perspective, focusing on details rather than intense emotion.";

      if (journalText.toLowerCase().includes('good') || journalText.toLowerCase().includes('great') || journalText.toLowerCase().includes('love') || journalText.toLowerCase().includes('happy')) {
        score = 85;
        label = 'Positive';
        analysis = "Your journal reflects a constructive day filled with gratitude, accomplishments, and positive emotional states.";
      } else if (journalText.toLowerCase().includes('bad') || journalText.toLowerCase().includes('hate') || journalText.toLowerCase().includes('angry') || journalText.toLowerCase().includes('sad')) {
        score = 25;
        label = 'Negative';
        analysis = "Your journal logs high levels of frustration or dissatisfaction. Today brought emotional challenges that require rest and reflection.";
      }

      return JSON.stringify({
        score,
        label,
        analysis
      });
    }

    case 'explainer': {
      const quoteText = prompt;
      return JSON.stringify({
        meaning: `This quote indicates that internal growth and mental preparedness are the ultimate catalysts for transforming external circumstances.`,
        lesson: "Do not wait for things to happen around you. Invest in your capabilities, and the environment will align.",
        application: `When reading this quote ("${quoteText}"), reflect on one skill you can study for 15 minutes today to increase your self-confidence.`
      });
    }

    case 'feed': {
      return JSON.stringify({
        quoteIds: ['q_mot_1', 'q_std_1', 'q_prod_1', 'q_self_1', 'q_create_1']
      });
    }

    default:
      return "Generic AI Motivation Insight: Continue pushing forward. Success is a series of consistent days combined.";
  }
};

// ----------------------------------------------------
// Public AI Services Interfaces
// ----------------------------------------------------
export const askAISmart = async (
  userId: string,
  type: 'generator' | 'career' | 'productivity' | 'mood' | 'journal' | 'explainer' | 'feed',
  prompt: string,
  inputs: Record<string, string> = {}
): Promise<string> => {
  const settings = getDevSettings();
  let responseText: string;

  if (settings.useRealGemini && settings.geminiApiKey) {
    try {
      const isJson = ['generator', 'mood', 'journal', 'explainer', 'feed'].includes(type);
      let fullPrompt = prompt;
      
      if (type === 'generator') {
        fullPrompt = `Generate a single premium motivational quote in JSON format with fields: 
        "text" (the quote), "author", "category", and "explanation" containing subfields "meaning", "lesson", and "application".
        The quote should be tailored to Topic: "${inputs.topic}", Mood: "${inputs.mood}", Goal: "${inputs.goal}", Category: "${inputs.category}".`;
      } else if (type === 'mood') {
        fullPrompt = `Analyze this mood diary text: "${prompt}". 
        Return a JSON response with fields: 
        "score" (number from 0 to 10), "label" (string naming the emotional state), "analysis" (1-2 sentences explaining why), "recommendations" (array of 3 practical exercises).`;
      } else if (type === 'journal') {
        fullPrompt = `Perform a sentiment analysis on this journal entry: "${prompt}". 
        Return JSON containing: "score" (number 0-100), "label" ('Positive', 'Neutral', or 'Negative'), and "analysis" (summary of emotional tone).`;
      } else if (type === 'explainer') {
        fullPrompt = `Analyze this quote: "${prompt}". 
        Return JSON containing: "meaning" (deep interpretation), "lesson" (core moral/learning), and "application" (practical, actionable step).`;
      } else if (type === 'feed') {
        fullPrompt = `Given the user interests: "${inputs.interests}" and favorites list: "${inputs.favorites}", suggest a list of 5 categories or quote IDs they would enjoy. Return JSON format with field "quoteIds" (array of strings).`;
      }

      responseText = await callRealGemini(fullPrompt, isJson);
    } catch (e) {
      console.warn("Real Gemini call failed, falling back to mock:", e);
      responseText = generateLocalAIResponse(type, prompt, inputs);
    }
  } else {
    // Artificial latency for a smooth premium loading experience
    await new Promise((resolve) => setTimeout(resolve, 1200));
    responseText = generateLocalAIResponse(type, prompt, inputs);
  }

  // Save interaction to database AI history
  try {
    await addAIHistoryItem(userId, {
      type,
      prompt: prompt || JSON.stringify(inputs),
      response: responseText
    });
  } catch (dbError) {
    console.error("Failed to save AI history:", dbError);
  }

  return responseText;
};
