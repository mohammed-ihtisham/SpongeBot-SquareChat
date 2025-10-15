<script>
    import AgentAvatar from './AgentAvatar.svelte';
  
    const agents = [
      { 
        key: 'spongebob',
        name: 'SpongeBob',
        emoji: '🧽',
        hue: 48, // warm yellow
        description: 'Joyful and overenthusiastic! Always finds the bright side with playful metaphors.'
      },
      { 
        key: 'squidward',
        name: 'Squidward',
        emoji: '🦑',
        hue: 190, // teal
        description: 'Sarcastic realist with dry wit. Grumpy but points out problems logically.'
      },
      { 
        key: 'mrkrabs',
        name: 'Mr. Krabs',
        emoji: '🦀',
        hue: 355, // red
        description: 'Money-obsessed! Sees everything through a financial lens.'
      },
      { 
        key: 'patrick',
        name: 'Patrick',
        emoji: '⭐',
        hue: 320, // magenta
        description: 'Simple and goofy but occasionally profound with wise insights.'
      }
    ];
  </script>
  
  <div class="agent-showcase" role="region" aria-labelledby="crew-title">
    <div class="showcase-header">
      <h3 id="crew-title">Meet the Crew</h3>
      <p>Hover or focus a card to flip.</p>
    </div>
  
    <div class="agents-grid">
      {#each agents as agent, i}
        <div
          class="flip-card"
          role="button"
          style={`--accent-h:${agent.hue}; --delay:${i * 60}ms`}
          tabindex="0"
          aria-label={`${agent.name} agent card`}
        >
          <div class="flip-card-inner">
            <!-- Front -->
            <div class="flip-card-front" aria-hidden="false">
              <div class="ring">
                <AgentAvatar agent={agent.key} size="medium" showBorder={false} showStatus={false} />
              </div>
  
              <div class="agent-info">
                <span class="agent-emoji" aria-hidden="true">{agent.emoji}</span>
                <span class="agent-name">{agent.name}</span>
                <span class="chip">Agent</span>
              </div>
  
              <!-- spotlight + shine -->
              <div class="shine" aria-hidden="true"></div>
              <div class="spotlight" aria-hidden="true"></div>
            </div>
  
            <!-- Back -->
            <div class="flip-card-back" aria-hidden="true">
              <div class="agent-description">
                <div class="profile-section">
                  <div class="profile-image">
                    <AgentAvatar agent={agent.key} size="large" showBorder={false} showStatus={false} shape="square" />
                  </div>
                  <div class="profile-info">
                    <h4>{agent.name}</h4>
                    <p>{agent.description}</p>
                  </div>
                </div>
              </div>

              <div class="glow" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <style>
     /* Container */
     .agent-showcase {
       background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
       border: 1px solid var(--stroke);
       border-radius: var(--radius-xl);
       padding: 1.25rem;
       margin: 0.75rem 0;
       backdrop-filter: blur(10px);
       box-shadow: 0 10px 30px rgba(0,0,0,0.28);
     }
  
    .showcase-header {
      text-align: center;
      margin-bottom: 0.9rem;
    }
  
    .showcase-header h3 {
      margin: 0 0 0.25rem;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text);
      letter-spacing: .2px;
    }
  
    .showcase-header p {
      margin: 0;
      font-size: 0.8rem;
      color: var(--muted);
    }
  
     /* Grid */
     .agents-grid {
       --col: 4;
       display: grid;
       grid-template-columns: repeat(var(--col), minmax(0, 1fr));
       gap: 0.9rem;
       width: 100%;
       max-width: none;
     }
  
    /* Card base */
    .flip-card {
      position: relative;
      isolation: isolate;
      background: transparent;
      width: 100%;
      height: 110px;
      perspective: 1200px;
      outline: none;
      border-radius: var(--radius-lg);
      animation: pop-in .5s var(--delay, 0ms) both cubic-bezier(.2,.8,.2,1);
    }
  
    @keyframes pop-in {
      from { transform: translateY(6px) scale(.98); opacity: 0; }
      to   { transform: translateY(0)   scale(1);    opacity: 1; }
    }
  
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transition: transform .7s cubic-bezier(.25,.85,.25,1),
                  filter .3s ease;
      cursor: pointer;
    }
  
    /* hover/focus flip */
    .flip-card:hover .flip-card-inner,
    .flip-card:focus-visible .flip-card-inner {
      transform: rotateY(180deg);
    }
  
    /* Faces */
    .flip-card-front,
    .flip-card-back {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: .55rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--stroke);
      backface-visibility: hidden;
      overflow: hidden;
    }
  
    .flip-card-front {
      background:
        radial-gradient(120% 140% at 90% -10%, rgba(255,255,255,0.06), transparent 40%),
        linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
    }
  
    .flip-card-back {
      transform: rotateY(180deg);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
      border-color: hsl(var(--accent-h) 70% 62% / .35);
    }
  
    /* Avatar ring */
    .ring {
      position: relative;
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 999px;
    }
  
    .ring::before {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: 999px;
      background:
        conic-gradient(from 0deg,
          hsl(var(--accent-h) 80% 60%),
          hsl(calc(var(--accent-h) + 40) 70% 58%),
          hsl(calc(var(--accent-h) - 40) 70% 58%),
          hsl(var(--accent-h) 80% 60%)
        );
      filter: blur(10px);
      opacity: .45;
      z-index: -1;
    }
  
    /* Front meta */
    .agent-info {
      position: absolute;
      bottom: 8px;
      left: 8px;
      right: 8px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: .45rem;
      padding: .35rem .5rem;
      border-radius: 10px;
      background: rgba(10,14,28,0.45);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
      box-shadow: 0 6px 16px rgba(0,0,0,.28);
    }
  
    .agent-emoji { font-size: 1.05rem; }
    .agent-name {
      font-size: .82rem;
      font-weight: 700;
      color: var(--text);
      letter-spacing: .2px;
      line-height: 1;
    }
  
    .chip {
      font-size: .68rem;
      font-weight: 700;
      padding: .18rem .45rem;
      border-radius: 999px;
      color: white;
      background: hsl(var(--accent-h) 80% 52% / .28);
      border: 1px solid hsl(var(--accent-h) 80% 60% / .35);
    }
  
    /* Back content */
    .agent-description {
      display: flex;
      align-items: stretch;
      height: 100%;
      padding: .35rem .6rem .55rem;
    }

    .profile-section {
      display: flex;
      align-items: center;
      gap: .6rem;
      width: 100%;
      height: 100%;
    }

    .profile-image {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100% - 1rem);
      margin: 0.5rem 0;
    }

    .profile-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: .3rem;
      min-width: 0;
    }

    .profile-info h4 {
      margin: 0;
      font-size: .9rem;
      font-weight: 800;
      letter-spacing: .2px;
      color: var(--text);
    }

    .profile-info p {
      margin: 0;
      font-size: .72rem;
      color: var(--muted);
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  
  
    /* Shine & spotlight (front) */
    .shine {
      position: absolute;
      inset: -50% -50% auto auto;
      width: 180%;
      height: 180%;
      transform: rotate(35deg);
      background: linear-gradient( to right,
        transparent 0%,
        rgba(255,255,255,0.08) 28%,
        rgba(255,255,255,0.02) 34%,
        transparent 55%
      );
      opacity: 0;
      transition: opacity .35s ease;
      pointer-events: none;
    }
  
    .spotlight {
      position: absolute;
      inset: -30% -30% auto auto;
      width: 120%;
      height: 120%;
      background: radial-gradient(circle at 60% 20%, rgba(255,255,255,.12), transparent 60%);
      opacity: .35;
      pointer-events: none;
      mix-blend-mode: soft-light;
    }
  
    .flip-card:hover .shine,
    .flip-card:focus-visible .shine {
      opacity: 1;
    }
  
    /* Back glow */
    .glow {
      position: absolute;
      inset: -20%;
      background: radial-gradient(60% 60% at 50% 30%, hsl(var(--accent-h) 80% 55% / .22), transparent 60%);
      filter: blur(22px);
      z-index: -1;
    }
  
    /* Motion preferences */
    @media (prefers-reduced-motion: reduce) {
      .flip-card-inner { transition: transform .001s; }
      .flip-card { animation: none; }
      .shine { display: none; }
    }
  
     /* Responsive */
     @media (max-width: 1000px) {
       .agents-grid { --col: 4; gap: .8rem; }
     }
     @media (max-width: 860px) {
       .agents-grid { --col: 4; gap: .7rem; }
     }
     @media (max-width: 640px) {
       .agents-grid { --col: 2; gap: .7rem; }
       .flip-card { height: 96px; }
     }
     @media (max-width: 420px) {
       .agents-grid { --col: 2; gap: .55rem; }
       .flip-card { height: 90px; }
       .agent-description p { -webkit-line-clamp: 3; line-clamp: 3; }
     }
  </style>
  