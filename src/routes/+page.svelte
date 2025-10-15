<script>
  import { onMount, tick } from 'svelte';
  import { browser } from '$app/environment';
  import AgentAvatar from '$lib/components/AgentAvatar.svelte';
  import AgentShowcase from '$lib/components/AgentShowcase.svelte';

  // ---------- State ----------
  let input = '';
  let messages = [
    // Intro message from SpongeBob - always present at the start
    {
      role: 'assistant',
      content: "Hi there, pal! Welcome to Bikini Bottom! 🌊 I'm SpongeBob SquarePants, and I'm so excited you're here! My friends Squidward, Mr. Krabs, and Patrick are all ready to chat with you too! What brings you to our wonderful underwater world today?",
      agent: 'SpongeBob',
      ts: Date.now(),
      isIntro: true
    }
  ]; // [{ role:'user'|'assistant', content, agent?, ts }]
  let debugOpen = false;
  let replierInput = null; // { frameSet, contextCount, agent, reasons, ... }
  let isLoading = false;
  let errorMsg = '';
  let mode = 'router'; // 'router' | 'aggregator'
  let isMac = false; // Will be set based on platform

  // ---------- Agent meta (extend freely) ----------
  const AGENTS = {
    'SpongeBob': { avatar: '/spongebob.jpg', hue: 48, key: 'spongebob' },
    'Squidward': { avatar: '/squidward.jpeg', hue: 190, key: 'squidward' },
    'Mr. Krabs': { avatar: '/mrkrabs.jpg', hue: 355, key: 'mrkrabs' },
    'Patrick': { avatar: '/patrick.jpeg', hue: 320, key: 'patrick' },
    'Bikini Bottom Chorus': { avatar: '/bikini-bottom.jpg', hue: 160, key: 'bikini-bottom-chorus' },
    'Assistant': { avatar: '/spongebob.jpg', hue: 220, key: 'assistant' }
  };

  function metaForAgent(name) {
    const key = Object.keys(AGENTS).find(k => name?.includes(k.replace(/^[^\s]+\s/, ''))) || name;
    return AGENTS[name] || AGENTS[key] || AGENTS['Assistant'];
  }

  // ---------- UI helpers ----------
  let chatEl;
  let inputEl;

  async function autoscroll() {
    await tick();
    if (chatEl) {
      chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: 'smooth' });
    }
  }

  function onInput(e) {
    // Keep textarea at fixed height - no auto-resize
    // The textarea will scroll internally when content exceeds the fixed height
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // ---------- Send ----------
  async function send() {
    const content = input.trim();
    if (!content || isLoading) return;
    const ts = Date.now();

    messages = [...messages, { role: 'user', content, ts }];
    input = '';

    isLoading = true;
    errorMsg = '';
    await autoscroll();

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: messages, mode })
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok || data?.error) {
      errorMsg = data?.error || 'Request failed';
      isLoading = false;
      return;
    }

    if (data.assistantMessage) {
      const displayName = data.replierInput?.displayName || '🤖 Assistant';
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: data.assistantMessage,
          agent: displayName,
          ts: Date.now()
        }
      ];
      replierInput = data.replierInput || null;
    }

    isLoading = false;
    await autoscroll();
  }

  function keyHandler(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }


  function handleKeyboardShortcut(e) {
    // Cmd/Ctrl + D to toggle debug modal
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      debugOpen = !debugOpen;
    }
    // ESC to close debug modal
    if (e.key === 'Escape' && debugOpen) {
      debugOpen = false;
    }
  }

  function closeDebugModal(e) {
    if (e.target === e.currentTarget) {
      debugOpen = false;
    }
  }

  onMount(() => {
    // Focus input on load
    inputEl?.focus();
    
    // Detect platform for keyboard shortcuts
    if (browser && navigator?.platform) {
      isMac = navigator.platform.includes('Mac');
    }
    
    // Add keyboard shortcut handler
    document.addEventListener('keydown', handleKeyboardShortcut);
    
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  });

  $: autoscroll(); // scroll on changes
</script>

<style>
  :global(:root) {
    --bg: #0b1020;
    --bg2: #0c1224;
    --glass: rgba(255, 255, 255, 0.06);
    --glass-2: rgba(255, 255, 255, 0.08);
    --stroke: rgba(255, 255, 255, 0.12);
    --text: #e7ecff;
    --muted: #a8b0c7;
    --primary: #7aa3ff;
    --primary-600: #5f8dff;
    --card: rgba(17, 25, 40, 0.58);
    --shadow: 0 8px 30px rgba(0,0,0,0.35);
    --radius-xl: 18px;
    --radius-lg: 14px;
  }

  :global(html, body) {
    height: 100%;
    margin: 0;
    color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
    background:
      radial-gradient(60% 80% at 70% 10%, rgba(22, 32, 61, 0.8) 0%, transparent 55%),
      radial-gradient(50% 50% at 10% 30%, rgba(19, 40, 79, 0.8) 0%, transparent 50%),
      linear-gradient(180deg, rgba(11, 16, 32, 0.85) 0%, rgba(12, 18, 36, 0.85) 100%),
      url('/bikini-bottom.jpg');
    background-attachment: fixed;
    background-size: auto, auto, auto, cover;
    background-position: center;
  }

  .container {
    max-width: 1200px;
    margin: 2.2rem auto;
    padding: 0 1rem;
  }

  .titleRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    margin-bottom: .6rem;
  }

  h1 {
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.2px;
    font-size: clamp(1.25rem, 1rem + 1.2vw, 1.75rem);
    display: flex; align-items: center; gap: .6rem;
  }

  .brand {
    padding: .35rem .6rem;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
    border: 1px solid var(--stroke);
    font-size: .78rem;
    color: var(--muted);
  }

  .subtitle {
    color: var(--muted);
    margin-bottom: .9rem;
  }

  /* Segmented control */
  .seg {
    display: inline-grid;
    grid-auto-flow: column;
    gap: 4px;
    padding: 4px;
    border-radius: 999px;
    background: var(--glass);
    border: 1px solid var(--stroke);
    backdrop-filter: blur(10px);
  }
  .seg button {
    border: none;
    background: transparent;
    color: var(--muted);
    padding: .45rem .85rem;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 0.9rem;
    position: relative;
  }
  .seg button:hover:not([aria-selected="true"]) {
    color: var(--text);
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }
  .seg button[aria-selected="true"] {
    color: #ffffff;
    background: linear-gradient(135deg, rgba(122, 163, 255, 0.35), rgba(122, 163, 255, 0.25));
    box-shadow: 
      inset 0 0 0 1.5px rgba(122, 163, 255, 0.6),
      0 4px 12px rgba(122, 163, 255, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.2);
    font-weight: 800;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  /* Chat card */
  .chatCard {
    border: 1px solid var(--stroke);
    background: var(--card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 430px; /* Fixed height for the entire card */
    margin-bottom: 2rem; /* Ensure margin below entire chat interface */
  }

  .chat {
    padding: 1rem;
    overflow-y: auto;
    flex: 1; /* Take up remaining space */
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  .row { display: flex; gap: .6rem; align-items: flex-end; }

  /* Bubbles */
  .bubble {
    position: relative;
    max-width: min(78%, 720px);
    padding: .8rem .95rem;
    border-radius: 16px;
    line-height: 1.5;
    border: 1px solid var(--stroke);
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
    box-shadow: 0 8px 18px rgba(0,0,0,0.22);
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .bubble.user {
    margin-left: auto;
    max-width: min(85%, 720px); /* Slightly wider for better balance */
    background: linear-gradient(180deg, rgba(122,163,255,0.14), rgba(122,163,255,0.06));
    border-color: rgba(122,163,255,0.35);
  }

  .bubble.assistant {
    margin-right: auto;
  }

  .bubble.intro {
    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
    border: 2px solid rgba(255,255,255,0.15);
    box-shadow: 0 12px 24px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.05);
    animation: introGlow 3s ease-in-out;
  }

  @keyframes introGlow {
    0%, 100% { box-shadow: 0 12px 24px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.05); }
    50% { box-shadow: 0 12px 24px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.1); }
  }

  .meta {
    display: flex; align-items: center; gap: .5rem;
    font-size: .78rem; color: var(--muted);
    margin-bottom: 0rem;
  }

  /* Avatar styling now handled by AgentAvatar component */

  .agentBadge {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .18rem .5rem; border-radius: 999px;
    border: 1px solid var(--stroke);
    background: rgba(255,255,255,0.05);
    font-weight: 600; font-size: .72rem;
  }

  /* Hue ring for agent identity */
  .hueDot {
    width: 8px; height: 8px; border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.15) inset;
  }

  /* Modern thinking state */
  .thinking-bubble {
    background: linear-gradient(135deg, rgba(122, 163, 255, 0.08), rgba(122, 163, 255, 0.04));
    border: 1px solid rgba(122, 163, 255, 0.2);
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(122, 163, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .thinking-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .thinking-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .thinking-dot-container {
    position: relative;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thinking-dot {
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, #7aa3ff, #5f8dff);
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(122, 163, 255, 0.4);
    z-index: 2;
  }

  .thinking-pulse {
    position: absolute;
    width: 20px;
    height: 20px;
    background: radial-gradient(circle, rgba(122, 163, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: thinkingPulse 2s ease-in-out infinite;
  }

  .thinking-text {
    font-weight: 600;
    color: var(--text);
    font-size: 0.9rem;
    letter-spacing: 0.3px;
  }

  .thinking-wave {
    display: flex;
    gap: 3px;
    align-items: flex-end;
    height: 20px;
  }

  .wave-bar {
    width: 3px;
    background: linear-gradient(to top, rgba(122, 163, 255, 0.6), rgba(122, 163, 255, 0.2));
    border-radius: 2px;
    animation: waveAnimation 1.5s ease-in-out infinite;
  }

  .wave-bar:nth-child(1) { animation-delay: 0s; height: 8px; }
  .wave-bar:nth-child(2) { animation-delay: 0.1s; height: 12px; }
  .wave-bar:nth-child(3) { animation-delay: 0.2s; height: 16px; }
  .wave-bar:nth-child(4) { animation-delay: 0.1s; height: 12px; }
  .wave-bar:nth-child(5) { animation-delay: 0s; height: 8px; }

  @keyframes thinkingPulse {
    0%, 100% { 
      transform: scale(1); 
      opacity: 0.3; 
    }
    50% { 
      transform: scale(1.5); 
      opacity: 0.1; 
    }
  }

  @keyframes waveAnimation {
    0%, 100% { 
      transform: scaleY(0.3); 
      opacity: 0.6; 
    }
    50% { 
      transform: scaleY(1); 
      opacity: 1; 
    }
  }

  /* Composer */
  .composer {
    border-top: 1px solid var(--stroke);
    padding: .75rem;
    padding-bottom: 1rem; /* Minimal padding for keyboard shortcuts */
    background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0));
    margin-bottom: 1.5rem; /* Add margin below the composer */
  }
  .inputWrap {
    position: relative;
    display: block;
  }
  
  .inputContainer {
    position: relative;
    display: block;
  }
  
  textarea {
    resize: none;
    min-height: 60px; /* Reduced from 80px */
    max-height: 300px; /* Increased from 180px for more expansion */
    padding: 0.75rem 3.5rem 3.5rem 0.75rem; /* Reduced padding slightly */
    border-radius: var(--radius-lg);
    border: 1px solid var(--stroke);
    background: rgba(10,14,28,0.6);
    color: var(--text);
    outline: none;
    backdrop-filter: blur(10px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    width: 100%;
    box-sizing: border-box;
    line-height: 1.5; /* Better line spacing */
    font-size: 0.95rem; /* Slightly larger font for better readability */
    text-align: left; /* Ensure text is left-aligned */
  }
  
  textarea::placeholder {
    text-align: left;
    color: var(--muted);
    opacity: 0.8;
  }
  textarea:focus { box-shadow: 0 0 0 3px rgba(122,163,255,.20); }
  
  .inputButtons {
    position: absolute;
    bottom: .75rem;
    right: .75rem;
    display: flex;
    gap: .5rem;
    align-items: center;
  }
  

  .sendBtn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--stroke);
    background: var(--glass);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }
  .sendBtn:hover { 
    background: var(--glass-2);
    transform: scale(1.05);
  }
  .sendBtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  
  /* Keyboard shortcuts text */
  .keyboardShortcuts {
    position: absolute;
    bottom: -1.5rem;
    left: 0;
    font-size: 0.75rem;
    color: var(--muted);
    opacity: 0.8;
    pointer-events: none;
  }

  /* Error */
  .error {
    background: rgba(255, 96, 96, 0.12);
    color: #ffd5d5;
    border: 1px solid rgba(255, 96, 96, 0.25);
    padding: .65rem .8rem;
    border-radius: 12px;
    margin: .75rem 0;
  }

  /* Debug Modal */
  .debugModalBackdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  .debugModal {
    background: linear-gradient(
      135deg,
      rgba(17, 25, 40, 0.95) 0%,
      rgba(12, 18, 36, 0.98) 100%
    );
    border: 1px solid rgba(122, 163, 255, 0.25);
    border-radius: var(--radius-xl);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    max-width: 900px;
    width: 100%;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .debugModalHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--stroke);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent);
  }

  .debugModalTitle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
  }

  .debugModalIcon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(122, 163, 255, 0.2), rgba(122, 163, 255, 0.1));
    border: 1px solid rgba(122, 163, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .debugModalClose {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--stroke);
    background: var(--glass);
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 1.2rem;
  }

  .debugModalClose:hover {
    background: var(--glass-2);
    color: var(--text);
    transform: scale(1.05);
  }

  .debugModalBody {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .debugSection {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--stroke);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .debugSection:last-child {
    margin-bottom: 0;
  }

  .debugSectionTitle {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .debugRow {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .debugRow:last-child {
    border-bottom: none;
  }

  .debugLabel {
    font-weight: 600;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .debugValue {
    color: var(--text);
    font-size: 0.9rem;
    word-break: break-word;
  }

  .debugGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .debugGridItem {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .debugGridLabel {
    font-weight: 600;
    color: var(--primary);
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }

  .debugGridValue {
    color: var(--text);
    font-size: 0.9rem;
  }

  .debugAgentResponses {
    margin-top: 0.75rem;
  }

  .debugAgentResponse {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .debugAgentResponse:last-child {
    margin-bottom: 0;
  }

  .debugAgentName {
    font-weight: 700;
    color: var(--primary);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .debugAgentText {
    color: var(--text);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .shortcutBadge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--stroke);
    font-size: 0.75rem;
    color: var(--muted);
    font-family: ui-monospace, monospace;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes modalSlideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 640px) {
    .chatCard { height: 500px; } /* Slightly shorter on mobile */
    .bubble { max-width: 92%; }
    
    .debugModal {
      max-height: 90vh;
      margin: 0.5rem;
    }
    
    .debugModalHeader {
      padding: 1rem;
    }
    
    .debugModalTitle {
      font-size: 1.1rem;
    }
    
    .debugModalBody {
      padding: 1rem;
    }
    
    .debugRow {
      grid-template-columns: 110px 1fr;
      gap: 0.5rem;
    }
    
    .debugGrid {
      grid-template-columns: 1fr;
    }
    
    .shortcutBadge {
      display: none;
    }
  }
</style>

<div class="container">
  <div class="titleRow">
    <h1>🏝️ Welcome to Bikini Bottom <span class="brand">multi-agent</span></h1>
    <div class="seg" role="tablist" aria-label="Mode">
      <button
        role="tab"
        aria-selected={mode === 'router'}
        aria-label="Single Agent Mode"
        on:click={() => (mode = 'router')}
      >🎯 Best Match</button>
      <button
        role="tab"
        aria-selected={mode === 'aggregator'}
        aria-label="All Agents Mode"
        on:click={() => (mode = 'aggregator')}
      >🎪 Team Reply</button>
    </div>
  </div>
  <div class="subtitle">Chat with Bikini Bottom's biggest stars: SpongeBob, Squidward, Mr. Krabs, and Patrick!</div>

  <AgentShowcase />


  {#if errorMsg}
    <div class="error" role="alert">{errorMsg}</div>
  {/if}

  <div class="chatCard">
    <!-- Messages -->
    <div class="chat" bind:this={chatEl} aria-live="polite">
      {#each messages as m}
        {#if m.role === 'user'}
          <div class="row" style="justify-content:flex-end; margin: .6rem 0;">
            <div class="bubble user">
              <div class="meta">You • {formatTime(m.ts)}</div>
              <div>{m.content}</div>
            </div>
          </div>
        {:else}
          {@const meta = metaForAgent(m.agent)}
          {#key m.ts}
            <div class="row" style="margin: .6rem 0;">
              <AgentAvatar agent={meta.key} size="medium" showBorder={true} showStatus={false} />
              <div class="bubble assistant" class:intro={m.isIntro}>
                <div class="meta">
                  <span class="agentBadge" style="--hue: {meta.hue}">
                    <span class="hueDot" style="background: hsl({meta.hue} 80% 58%);"></span>
                    {m.agent || '🤖 Assistant'}
                  </span>
                  <span>• {formatTime(m.ts)}</span>
                </div>
                <div>{m.content}</div>
              </div>
            </div>
          {/key}
        {/if}
      {/each}

      {#if isLoading}
        <div class="row" style="margin: .8rem 0;">
          <AgentAvatar agent="thinking" size="medium" showBorder={true} showStatus={false} isOnline={true} />
          <div class="bubble assistant thinking-bubble">
            <div class="thinking-content">
              <div class="thinking-header">
                <div class="thinking-dot-container">
                  <div class="thinking-pulse"></div>
                  <div class="thinking-dot"></div>
                </div>
                <span class="thinking-text">Thinking...</span>
              </div>
              <div class="thinking-wave">
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Composer -->
    <div class="composer">
      <div class="inputWrap">
        <div class="inputContainer">
          <textarea
            bind:this={inputEl}
            bind:value={input}
            rows="1"
            placeholder="Ask anything you want"
            on:input={onInput}
            on:keydown={keyHandler}
            aria-label="Message input"
          />
          <div class="inputButtons">
            <button class="sendBtn" on:click={send} disabled={!input.trim() || isLoading} aria-label="Send message">
              <span style="transform: rotate(-45deg);">➤</span>
            </button>
          </div>
        </div>
        <div class="keyboardShortcuts">
          Enter to send • Shift+Enter for newline • {isMac ? '⌘D' : 'Ctrl+D'} for debug
        </div>
      </div>
    </div>
  </div>

  <!-- Debug Modal -->
  {#if debugOpen}
    <div 
      class="debugModalBackdrop" 
      role="button" 
      tabindex="-1"
      on:click={closeDebugModal}
      on:keydown={(e) => {
        if (e.key === 'Escape') closeDebugModal();
      }}
    >
      <div class="debugModal" role="dialog" aria-labelledby="debug-modal-title" aria-modal="true">
        <div class="debugModalHeader">
          <div class="debugModalTitle" id="debug-modal-title">
            <div class="debugModalIcon">🐛</div>
            <span>Debug Information</span>
            <span class="shortcutBadge">
              {isMac ? '⌘' : 'Ctrl'} + D
            </span>
          </div>
          <button class="debugModalClose" on:click={() => debugOpen = false} aria-label="Close debug modal">
            ✕
          </button>
        </div>
        
        <div class="debugModalBody">
          <!-- General Info Section -->
          <div class="debugSection">
            <div class="debugSectionTitle">📊 General Information</div>
            <div class="debugRow">
              <div class="debugLabel">Messages</div>
              <div class="debugValue">{messages.length}</div>
            </div>
            <div class="debugRow">
              <div class="debugLabel">Mode</div>
              <div class="debugValue">
                {mode === 'router' ? '🎯 Best Match (Krusty Controller)' : '🎪 Team Reply (Bikini Bottom Chorus)'}
              </div>
            </div>
          </div>

          {#if replierInput}
            <!-- Last Response Section -->
            <div class="debugSection">
              <div class="debugSectionTitle">🤖 Last Response Details</div>
              <div class="debugRow">
                <div class="debugLabel">Context Count</div>
                <div class="debugValue">{replierInput.contextCount || 'n/a'}</div>
              </div>
              <div class="debugRow">
                <div class="debugLabel">Agent</div>
                <div class="debugValue">{replierInput.agent || 'n/a'}</div>
              </div>
              <div class="debugRow">
                <div class="debugLabel">Display Name</div>
                <div class="debugValue">{replierInput.displayName || 'n/a'}</div>
              </div>
              <div class="debugRow">
                <div class="debugLabel">Reason</div>
                <div class="debugValue">{replierInput.reasons || 'n/a'}</div>
              </div>
            </div>

            {#if mode === 'aggregator' && replierInput.agentResponses}
              <!-- Individual Agent Responses Section -->
              <div class="debugSection">
                <div class="debugSectionTitle">👥 Individual Agent Responses</div>
                <div class="debugAgentResponses">
                  {#each Object.entries(replierInput.agentResponses) as [agentName, response]}
                    <div class="debugAgentResponse">
                      <div class="debugAgentName">{agentName}</div>
                      <div class="debugAgentText">{response}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if replierInput.frameSet?.frames && Object.keys(replierInput.frameSet.frames).length > 0}
              <!-- Frame Set Section -->
              <div class="debugSection">
                <div class="debugSectionTitle">🎯 Frame Set</div>
                <div class="debugGrid">
                  {#each Object.entries(replierInput.frameSet.frames) as [name, p]}
                    <div class="debugGridItem">
                      <div class="debugGridLabel">{name}</div>
                      <div class="debugGridValue">{p?.value || 'n/a'}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {:else}
            <div class="debugSection">
              <div class="debugSectionTitle">ℹ️ Info</div>
              <div class="debugValue" style="color: var(--muted); text-align: center; padding: 1rem;">
                Send a message to see response details
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
