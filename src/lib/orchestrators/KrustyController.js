import { geminiGenerate } from '../gemini.js';
import { SpongeBobAgent } from '../agents/SpongeBobAgent.js';
import { SquidwardAgent } from '../agents/SquidwardAgent.js';
import { MrKrabsAgent } from '../agents/MrKrabsAgent.js';
import { PatrickAgent } from '../agents/PatrickAgent.js';

const SELECTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    agent: { type: 'STRING' },
    reasons: { type: 'STRING' }
  },
  required: ['agent']
};

export class KrustyController {
  constructor() {
    this.name = 'krusty_controller';
    this.agentByName = {
      spongebob: new SpongeBobAgent(),
      squidward: new SquidwardAgent(),
      mrkrabs: new MrKrabsAgent(),
      patrick: new PatrickAgent()
    };
    
    // Agent display names (no emojis)
    this.agentDisplayNames = {
      spongebob: 'SpongeBob',
      squidward: 'Squidward', 
      mrkrabs: 'Mr. Krabs',
      patrick: 'Patrick'
    };
  }

  _identifyAgentFromMessage(message) {
    if (!message?.parts?.[0]?.text) return null;
    
    const text = message.parts[0].text.toLowerCase();
    
    // Enhanced agent identification with more comprehensive keywords
    // Mr. Krabs patterns
    if (text.includes('aye') || text.includes('clams') || text.includes('krabby') || 
        text.includes('krusty') || text.includes('money') || text.includes('business') ||
        text.includes('sorry, i had trouble') || text.includes('could you try again') ||
        text.includes('customer') || text.includes('patty') || text.includes('restaurant') ||
        text.includes('krusty krab') || text.includes('profit') || text.includes('cost')) {
      return 'mrkrabs';
    }
    
    // SpongeBob patterns
    if (text.includes('oh boy') || text.includes('gary') || text.includes('jellyfish') || 
        text.includes('i\'m ready') || text.includes('best day ever') || 
        text.includes('whoopsie') || text.includes('spongey brain') || 
        text.includes('bubble') || text.includes('fun') || text.includes('excited') ||
        text.includes('pal') || text.includes('wonderful') || text.includes('amazing') ||
        text.includes('sorry, i encountered') || text.includes('catch') || text.includes('dreaming')) {
      return 'spongebob';
    }
    
    // Squidward patterns
    if (text.includes('squidward') || text.includes('clarinet') || text.includes('tentacle') || 
        text.includes('octopus') || text.includes('ugh') || text.includes('boring') ||
        text.includes('annoying') || text.includes('whatever') || text.includes('dull')) {
      return 'squidward';
    }
    
    // Patrick patterns
    if (text.includes('patrick') || text.includes('star') || text.includes('rock') || 
        text.includes('under a rock') || text.includes('bouncy') || text.includes('is this') ||
        text.includes('i don\'t know') || text.includes('huh') || text.includes('what')) {
      return 'patrick';
    }
    
    return null;
  }

  async _respondWith(agentName, contents) {
    const agent = this.agentByName[agentName] || this.agentByName.spongebob;
    const res = await agent.respond(contents);
    return res?.text || '';
  }

  _getCharacterSpecificErrorMessage(agent) {
    const errorMessages = {
      spongebob: "Whoopsie-doodle! My spongey brain must have been dreaming of a triple Krabby Patty and didn't quite *catch* your wonderful words! Could you please say that again, super loud and clear, like a triumphant bubble horn? I don't want to miss a single drop of fun!",
      mrkrabs: "Aye, me apologies, lad! Must've been countin' me clams and lost track of what ye were sayin'. Could ye repeat that for this old crab? I want to make sure I give ye the best service at the Krusty Krab!",
      squidward: "Ugh, what was that? My clarinet practice must have distracted me from your... whatever you were saying. Could you repeat that? Not that I care much, but I suppose I should at least pretend to listen.",
      patrick: "Huh? What did you say? I was thinking about... well, I don't really know what I was thinking about. Is this the part where I'm supposed to say something smart? Could you say that again?"
    };
    
    // Always return a character-specific message, default to SpongeBob if agent is unknown
    return errorMessages[agent] || errorMessages.spongebob;
  }

  async orchestrate(contents) {
    try {
      // Validate input
      if (!Array.isArray(contents) || contents.length === 0) {
        throw new Error('Invalid contents: must be a non-empty array');
      }

      // Get the last assistant message to understand conversation context
      const lastAssistantMessage = contents
        .slice()
        .reverse()
        .find(msg => msg.role === 'model');
      
      const lastAssistantAgent = this._identifyAgentFromMessage(lastAssistantMessage);
      
      // Get the current user message
      const currentUserMessage = contents
        .slice()
        .reverse()
        .find(msg => msg.role === 'user');

      const orchestratorPrompt = `You are the Krusty Controller, a routing orchestrator that chooses one agent to respond to the user.

CRITICAL CONTEXT:
- Last assistant message was from: ${lastAssistantAgent || 'unknown'}
- Current user message: "${currentUserMessage?.parts?.[0]?.text || 'No user message'}"
- Conversation history length: ${contents.length} messages

CONVERSATION CONTINUITY RULES (STRICT PRIORITY):
1. CONTINUE SAME AGENT: If user responds to last agent's message, keep that agent (90% of cases)
2. EXPLICIT CHARACTER REQUEST: Only switch if user explicitly asks for different character
3. TOPIC CHANGE: Only switch if conversation completely changes topics
4. FALLBACK: Default to spongebob if uncertain

AGENT PERSONALITIES:
- spongebob: Positive/Playful, seeking encouragement, uses words like "pal", "fun", "amazing"
- squidward: Cynical/Reflective, needs blunt clarity, uses words like "ugh", "boring", "whatever"  
- mrkrabs: Practical/Money/Efficiency/Tradeoffs, uses words like "aye", "clams", "business"
- patrick: Silly/Confused/Low-stakes whimsy, uses words like "what", "huh", "is this"

DECISION LOGIC:
- If user asks "where is [character]" → CONTINUE with last agent (they're still in conversation)
- If user says "I want to talk to [character]" → SWITCH to that character
- If user responds to last message → CONTINUE with same agent
- If user asks follow-up question → CONTINUE with same agent

Available agents: "spongebob", "squidward", "mrkrabs", "patrick". ONLY USE ONE OF THESE AGENTS.

Output strictly as JSON:
{
  "agent": "spongebob",
  "reasons": "Continuing conversation with the same agent for continuity"
}`;

      const result = await geminiGenerate({
        contents,
        systemPrompt: orchestratorPrompt,
        config: { responseMimeType: 'application/json', responseSchema: SELECTION_SCHEMA }
      });

      // Validate Gemini response
      if (!result || typeof result.text !== 'string') {
        throw new Error('Invalid response from Gemini API');
      }

      let agent = 'spongebob';
      let reasons = 'Defaulted to spongebob for positivity and welcoming interaction';
      
      try {
        const parsed = JSON.parse(result.text || '{}');
        if (parsed?.agent && this.agentByName[parsed.agent]) {
          agent = parsed.agent;
        } else {
          // Fallback: if orchestrator didn't choose a valid agent, use conversation continuity
          if (lastAssistantAgent && this.agentByName[lastAssistantAgent]) {
            agent = lastAssistantAgent;
            reasons = `Continuing with ${lastAssistantAgent} based on conversation context`;
          }
        }
        if (parsed?.reasons) {
          reasons = String(parsed.reasons);
        }
      } catch (parseError) {
        console.warn('Failed to parse orchestrator response:', parseError);
        // Enhanced fallback: use conversation continuity
        if (lastAssistantAgent && this.agentByName[lastAssistantAgent]) {
          agent = lastAssistantAgent;
          reasons = `Continuing with ${lastAssistantAgent} due to parsing error`;
        }
      }

      // Get agent response with error handling
      let text = '';
      try {
        text = await this._respondWith(agent, contents);
        if (!text || typeof text !== 'string') {
          // Character-specific error messages instead of generic ones
          text = this._getCharacterSpecificErrorMessage(agent);
        }
      } catch (agentError) {
        console.error(`Agent ${agent} failed to respond:`, agentError);
        text = this._getCharacterSpecificErrorMessage(agent);
      }

      const displayName = this.agentDisplayNames[agent] || '🤖 Assistant';
      const frameSet = { frames: { persona: { value: agent, rationale: [reasons] } } };
      
      return { 
        assistantMessage: text, 
        frameSet, 
        agent, 
        reasons, 
        displayName 
      };
    } catch (error) {
      console.error('KrustyController orchestrate error:', error);
      
      // Fallback response with character-specific message
      const fallbackMessage = this._getCharacterSpecificErrorMessage('spongebob');
      return {
        assistantMessage: fallbackMessage,
        frameSet: { frames: { persona: { value: 'spongebob', rationale: ['Fallback due to error'] } } },
        agent: 'spongebob',
        reasons: 'Fallback due to orchestration error',
        displayName: 'SpongeBob'
      };
    }
  }
}
