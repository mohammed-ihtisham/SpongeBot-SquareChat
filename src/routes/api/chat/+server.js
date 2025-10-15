import { json } from '@sveltejs/kit';
import { KrustyController } from '$lib/orchestrators/KrustyController.js';
import { BikiniBottomChorus } from '$lib/orchestrators/BikiniBottomChorus.js';

/**
 * Handle chat POST requests for a single-turn pipeline execution.
 *
 * Parameters: ({ request }) SvelteKit request wrapper.
 * Returns: JSON response with pipeline output or error.
 */
export async function POST({ request }) {
  const body = await request.json();
  const { history, mode = 'router' } = body || {}; // Default to router mode for backward compatibility

  if (!Array.isArray(history)) {
    return json({ error: 'history array is required' }, { status: 400 });
  }

  try {
    // Choose orchestrator based on mode
    const orchestrator = mode === 'aggregator' ? new BikiniBottomChorus() : new KrustyController();
    const contents = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    
    const result = await orchestrator.orchestrate(contents);
    
    // Preserve existing API surface
    const response = {
      assistantMessage: result.assistantMessage,
      replierInput: { 
        frameSet: result.frameSet, 
        contextCount: history.length, 
        agent: result.agent, 
        reasons: result.reasons,
        displayName: result.displayName
      }
    };

    // Add additional data for aggregator mode
    if (mode === 'aggregator' && result.agentResponses) {
      response.replierInput.agentResponses = result.agentResponses;
    }
    
    return json(response);
  } catch (err) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('gemini_api_key') || msg.includes('gemini') || msg.includes('api key')) {
      return json({ error: 'Gemini API key not found' }, { status: 400 });
    }
    return json({ error: 'Pipeline error', details: String(err?.message || err) }, { status: 500 });
  }
}
