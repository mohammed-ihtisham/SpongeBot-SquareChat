import { geminiGenerate } from '../gemini.js';
import { SpongeBobAgent } from '../agents/SpongeBobAgent.js';
import { SquidwardAgent } from '../agents/SquidwardAgent.js';
import { MrKrabsAgent } from '../agents/MrKrabsAgent.js';
import { PatrickAgent } from '../agents/PatrickAgent.js';

const SYNTHESIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    response: { type: 'STRING' },
    episode_moral: { type: 'STRING' }
  },
  required: ['response', 'episode_moral']
};

export class BikiniBottomChorus {
  constructor() {
    this.name = 'bikini_bottom_chorus';
    this.agents = {
      spongebob: new SpongeBobAgent(),
      squidward: new SquidwardAgent(),
      mrkrabs: new MrKrabsAgent(),
      patrick: new PatrickAgent()
    };
  }

  async orchestrate(contents) {
    try {
      // Validate input
      if (!Array.isArray(contents) || contents.length === 0) {
        throw new Error('Invalid contents: must be a non-empty array');
      }

      // Get responses from all agents
      const agentResponses = {};
      for (const [name, agent] of Object.entries(this.agents)) {
        try {
          const response = await agent.respond(contents);
          agentResponses[name] = response?.text || '';
        } catch (error) {
          console.warn(`Agent ${name} failed to respond:`, error);
          agentResponses[name] = '';
        }
      }

      // Check if we have any valid responses
      const hasValidResponses = Object.values(agentResponses).some(response => 
        response && response.trim().length > 0
      );

      if (!hasValidResponses) {
        throw new Error('No agents could provide valid responses');
      }

      const synthesisPrompt = `You are the Bikini Bottom Chorus - a harmonious ensemble of voices from the deep blue sea! 🌊

You are given responses from four beloved Bikini Bottom residents. Your task is to create a beautiful chorus that weaves their voices together in perfect harmony, like a school of fish swimming in sync!

🎵 CHORUS COMPOSITION RULES:
- Start with a warm, welcoming tone that captures the spirit of community
- Weave together SpongeBob's infectious optimism and enthusiasm
- Blend in Squidward's practical wisdom and realistic perspective  
- Harmonize with Mr. Krabs' business-savvy, money-smart advice
- Add Patrick's delightful comic relief as a sweet, simple counterpoint
- Create a flowing, musical rhythm in your language
- Use phrases like "Together we say...", "In harmony...", "As one voice..."
- End with a beautiful moral that sounds like a chorus singing in unison

🎼 VOICE BLENDING TECHNIQUE:
- Let each character's essence shine through while creating unity
- Use transitions like "And as SpongeBob would say...", "Squidward adds...", "Mr. Krabs reminds us..."
- Create a crescendo of wisdom that builds to a satisfying conclusion
- Keep the tone warm, supportive, and community-focused
- Maximum 7 sentences for the main response

Agent voices to harmonize:
SpongeBob: "${agentResponses.spongebob}"
Squidward: "${agentResponses.squidward}"
Mr. Krabs: "${agentResponses.mrkrabs}"
Patrick: "${agentResponses.patrick}"

Output as JSON:
{
  "response": "Your harmonious chorus response here",
  "episode_moral": "Chorus: Your beautiful moral sung in unison here"
}`;

      const result = await geminiGenerate({
        contents,
        systemPrompt: synthesisPrompt,
        config: { responseMimeType: 'application/json', responseSchema: SYNTHESIS_SCHEMA }
      });

      // Validate Gemini response
      if (!result || typeof result.text !== 'string') {
        throw new Error('Invalid response from Gemini API');
      }

      let response = '🎵 Together we sing: "Oh my barnacles!" It seems our voices got a little tangled up, like when SpongeBob tried to conduct an orchestra of jellyfish - sometimes even the most beautiful melodies need a moment to find their rhythm! 🌊';
      let episodeMoral = 'Chorus: When our voices get out of tune, we simply take a deep breath and sing again in perfect harmony!';

      try {
        const parsed = JSON.parse(result.text || '{}');
        if (parsed?.response && typeof parsed.response === 'string') {
          response = parsed.response;
        }
        if (parsed?.episode_moral && typeof parsed.episode_moral === 'string') {
          episodeMoral = parsed.episode_moral;
        }
      } catch (parseError) {
        console.warn('Failed to parse synthesis response:', parseError);
        // Use fallback values
      }

      const finalResponse = `${response}\n\n${episodeMoral}`;
      const frameSet = { 
        frames: { 
          persona: { 
            value: 'chorus', 
            rationale: ['Synthesized response from all Bikini Bottom residents'] 
          },
          agent_responses: {
            value: agentResponses,
            rationale: ['Individual agent responses used for synthesis']
          }
        } 
      };

      return { 
        assistantMessage: finalResponse, 
        frameSet, 
        agent: 'chorus', 
        reasons: 'Synthesized response from all agents',
        agentResponses,
        displayName: '🎪 Bikini Bottom Chorus'
      };
    } catch (error) {
      console.error('BikiniBottomChorus orchestrate error:', error);
      
      // Fallback response with character-specific message
      const fallbackMessage = '🎵 In harmony we sing: "Oh my barnacles and sea stars!" It seems our beautiful chorus got a bit out of sync, like when Patrick tried to lead a choir of sea horses - sometimes even the most well-intentioned performances need a moment to find their perfect pitch!\n\nChorus: When our melody gets a little off-key, we simply gather our voices together and sing with renewed spirit! 🌊';
      return {
        assistantMessage: fallbackMessage,
        frameSet: { 
          frames: { 
            persona: { 
              value: 'chorus', 
              rationale: ['Fallback due to error'] 
            } 
          } 
        },
        agent: 'chorus',
        reasons: 'Fallback due to orchestration error',
        agentResponses: {},
        displayName: 'Bikini Bottom Chorus'
      };
    }
  }
}
