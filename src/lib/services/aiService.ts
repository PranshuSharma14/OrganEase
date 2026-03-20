const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function isApiKeyConfigured(): boolean {
  return !!OPENAI_API_KEY && OPENAI_API_KEY !== "your-openai-api-key-here";
}

/**
 * Detect suspicious patterns in a donor-recipient match.
 * Returns risk flags and a risk score (0-100).
 */
export async function detectRisk(matchData: {
  donorAge: number;
  recipientAge: number;
  donorCity: string;
  recipientCity: string;
  donorState: string;
  recipientState: string;
  organType: string;
  matchScore: number;
  donorRegistrationDate: string;
  recipientRegistrationDate: string;
}): Promise<{ riskScore: number; flags: string[]; explanation: string }> {
  if (!isApiKeyConfigured()) {
    return {
      riskScore: 0,
      flags: [],
      explanation: "AI risk detection unavailable. Please add your OPENAI_API_KEY in .env file.",
    };
  }

  try {
    const prompt = `You are a medical ethics AI assistant for an organ donation platform. Analyze this donor-recipient match for suspicious patterns that might indicate organ trafficking, coercion, or fraud.

Match Data:
- Donor Age: ${matchData.donorAge}, Recipient Age: ${matchData.recipientAge}
- Donor Location: ${matchData.donorCity}, ${matchData.donorState}
- Recipient Location: ${matchData.recipientCity}, ${matchData.recipientState}
- Organ Type: ${matchData.organType}
- Match Score: ${matchData.matchScore}%
- Donor Registration Date: ${matchData.donorRegistrationDate}
- Recipient Registration Date: ${matchData.recipientRegistrationDate}

Respond in JSON format:
{
  "riskScore": <0-100, where 0 is no risk and 100 is extreme risk>,
  "flags": ["<list of specific risk flags found, empty if none>"],
  "explanation": "<brief explanation of the risk assessment>"
}

Look for patterns like: very young donors, same-day registrations, unusual organ types for age, etc.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return { riskScore: 0, flags: [], explanation: "AI risk detection temporarily unavailable." };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    try {
      const parsed = JSON.parse(content);
      return {
        riskScore: Math.min(100, Math.max(0, parsed.riskScore || 0)),
        flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        explanation: parsed.explanation || "No explanation available.",
      };
    } catch {
      return { riskScore: 0, flags: [], explanation: content || "Unable to parse AI response." };
    }
  } catch (error) {
    console.error("AI risk detection error:", error);
    return { riskScore: 0, flags: [], explanation: "AI risk detection failed." };
  }
}

/**
 * Generate a human-readable explanation for why a match was made.
 */
export async function explainMatch(matchData: {
  donorBloodGroup: string;
  recipientBloodGroup: string;
  organType: string;
  matchScore: number;
  scoreBreakdown: {
    bloodCompatibility: number;
    urgency: number;
    distance: number;
    waitingTime: number;
    verification: number;
  };
  urgencyLevel: string;
  sameCity: boolean;
  sameState: boolean;
}): Promise<string> {
  if (!isApiKeyConfigured()) {
    // Fallback: generate a simple template-based explanation
    return generateTemplateExplanation(matchData);
  }

  try {
    const prompt = `You are a medical coordination assistant. Explain this organ donation match in clear, compassionate language suitable for hospital staff.

Match Details:
- Organ: ${matchData.organType.replace(/_/g, " ")}
- Match Score: ${matchData.matchScore}%
- Blood Groups: Donor ${matchData.donorBloodGroup} → Recipient ${matchData.recipientBloodGroup}
- Urgency: ${matchData.urgencyLevel}
- Location: ${matchData.sameCity ? "Same city" : matchData.sameState ? "Same state" : "Different states"}

Score Breakdown:
- Blood Compatibility: ${matchData.scoreBreakdown.bloodCompatibility}/30
- Urgency: ${matchData.scoreBreakdown.urgency}/25
- Distance: ${matchData.scoreBreakdown.distance}/15
- Waiting Time: ${matchData.scoreBreakdown.waitingTime}/20
- Verification: ${matchData.scoreBreakdown.verification}/10

Write a 2-3 sentence explanation of why this match was recommended. Be factual and professional.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      return generateTemplateExplanation(matchData);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateTemplateExplanation(matchData);
  } catch {
    return generateTemplateExplanation(matchData);
  }
}

function generateTemplateExplanation(matchData: any): string {
  const organ = matchData.organType.replace(/_/g, " ");
  const score = matchData.matchScore;
  const urgency = matchData.urgencyLevel;

  let explanation = `This ${organ} donation match has a compatibility score of ${score}%. `;
  explanation += `Blood groups are compatible (${matchData.donorBloodGroup} → ${matchData.recipientBloodGroup}). `;

  if (urgency === "emergency") {
    explanation += `This is an EMERGENCY case requiring immediate attention. `;
  } else if (urgency === "high") {
    explanation += `This case has HIGH urgency priority. `;
  }

  if (matchData.sameCity) {
    explanation += `Both parties are in the same city, facilitating logistics.`;
  } else if (matchData.sameState) {
    explanation += `Both parties are in the same state.`;
  }

  return explanation;
}
