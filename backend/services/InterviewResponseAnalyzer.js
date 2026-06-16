const MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-3.1-pro-preview",
];

async function callOpenRouter(prompt, temperature, requestTimeoutMs) {
  const API_KEY = process.env.OPENROUTER_API_KEY;

  for (const model of MODELS) {
    try {
      const response = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://localhost:5173",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: temperature,
            response_format: { type: "json_object" },
          }),
        },
        requestTimeoutMs,
      );

      if (response.status === 429) {
        console.warn(`Model ${model} is rate limited. Trying next...`);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `API request failed: ${response.status} - ${errorBody}`,
        );
      }

      const data = await response.json();
      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid API response structure");
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (MODELS.indexOf(model) === MODELS.length - 1) throw error;
      console.warn(
        `Error with model ${model}: ${error.message}. Trying next...`,
      );
    }
  }
}

const InterviewResponseAnalyzer = async (question, answer) => {
  const prompt = `
  You are an expert Interview Analyst. Analyze the following interview response and provide a report in JSON format.
  
  **Question:** "${question}"
  **Answer:** "${answer}"

  The report should include:
  1. **Scores** (0-100 scale):
     - correctness, clarity, relevance, detail, efficiency, creativity, communication, problemSolving.
  2. **Feedback**: Specific constructive feedback for this answer.
  3. **Expected Answer**: A comprehensive and correct way this question should be answered.
  4. **Improved Answer**: A sample of how the candidate could have answered better.

  Return ONLY a JSON object in this format:
  {
    "scores": {
      "correctness": number, "clarity": number, "relevance": number, "detail": number, "efficiency": number, "creativity": number, "communication": number, "problemSolving": number
    },
    "feedback": string,
    "expectedAnswer": string,
    "improvedAnswer": string
  }
  `;

  try {
    const rawOutput = await callOpenRouter(prompt, 0.2, 30000);
    const jsonString = extractJsonFromResponse(rawOutput);
    const analysis = JSON.parse(jsonString);

    const scores = Object.values(analysis.scores);
    analysis.overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );

    return analysis;
  } catch (error) {
    console.error("Error in InterviewResponseAnalyzer:", error);
    return {
      scores: {
        correctness: 0,
        clarity: 0,
        relevance: 0,
        detail: 0,
        efficiency: 0,
        creativity: 0,
        communication: 0,
        problemSolving: 0,
      },
      feedback: "Error analyzing response.",
      improvedAnswer: "N/A",
      overallScore: 0,
    };
  }
};

const AnalyzeFullTranscript = async (transcriptText) => {
  const prompt = `
  You are an expert Interview Analyst. Analyze the following interview transcript and provide a comprehensive report in JSON format.
  
  Transcript:
  """
  ${transcriptText}
  """

  The report should include:
  1. **Overall Scores** (0-100 scale):
     - correctness, clarity, relevance, detail, efficiency, creativity, communication, problemSolving.
  2. **Question-by-Question Analysis**:
     For each question asked by the interviewer:
     - question: The interviewer's question.
     - answer: The candidate's response.
     - feedback: Specific constructive feedback for this particular answer.
     - expectedAnswer: A comprehensive and correct way this question should be answered.
     - improvedAnswer: A sample of how the candidate's answer could be improved.
     - scores (0-100 scale): Individual scores for correctness, clarity, relevance, detail, efficiency, creativity, communication, and problemSolving.

  Return ONLY a JSON object in this format:
  {
    "overall": {
      "correctness": number, "clarity": number, "relevance": number, "detail": number, "efficiency": number, "creativity": number, "communication": number, "problemSolving": number
    },
    "questions": [
      {
        "question": string,
        "answer": string,
        "feedback": string,
        "expectedAnswer": string,
        "improvedAnswer": string,
        "scores": {
          "correctness": number, "clarity": number, "relevance": number, "detail": number, "efficiency": number, "creativity": number, "communication": number, "problemSolving": number
        }
      }
    ]
  }
  `;

  try {
    const rawOutput = await callOpenRouter(prompt, 0.3, 60000);
    const jsonString = extractJsonFromResponse(rawOutput);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error in AnalyzeFullTranscript:", error);
    throw error;
  }
};

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractJsonFromResponse(rawString) {
  const codeBlockMatch = rawString.match(/```(?:json)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) return codeBlockMatch[1];
  const jsonMatch = rawString.match(/{[\s\S]*}/);
  if (jsonMatch) return jsonMatch[0];
  return rawString
    .replace(/^```(?:json)?/, "")
    .replace(/```$/, "")
    .trim();
}

module.exports = { InterviewResponseAnalyzer, AnalyzeFullTranscript };
