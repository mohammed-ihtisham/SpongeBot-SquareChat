<script>
  export let agent = 'spongebob';
  export let size = 'medium'; // small, medium, large
  export let showBorder = true;
  export let showStatus = false;
  export let isOnline = true;
  export let shape = 'circle'; // circle, square
  
  const agentImages = {
    spongebob: '/spongebob.jpg',
    squidward: '/squidward.jpeg', 
    mrkrabs: '/mrkrabs.jpg',
    patrick: '/patrick.jpeg',
    'bikini-bottom-chorus': '/bikini-bottom.jpg',
    default: '/default.png',
    thinking: '/default.png',
    assistant: '/default.png'
  };
  
  const agentColors = {
    spongebob: { bg: '#FFE066', border: '#FFD700' },
    squidward: { bg: '#87CEEB', border: '#4682B4' },
    mrkrabs: { bg: '#FF6347', border: '#DC143C' },
    patrick: { bg: '#DDA0DD', border: '#9370DB' },
    'bikini-bottom-chorus': { bg: '#20B2AA', border: '#008B8B' },
    default: { bg: '#6B7280', border: '#9CA3AF' },
    thinking: { bg: '#6B7280', border: '#9CA3AF' },
    assistant: { bg: '#6B7280', border: '#9CA3AF' }
  };
  
  const sizeClasses = {
    small: { size: '32px', border: '2px' },
    medium: { size: '40px', border: '3px' },
    large: { size: '56px', border: '4px' }
  };
  
  $: imageSrc = agentImages[agent] || '/default.png';
  $: colors = agentColors[agent] || agentColors.default;
  $: dimensions = sizeClasses[size] || sizeClasses.medium;
</script>

<div 
  class="avatar-container" 
  class:show-border={showBorder}
  class:shape-square={shape === 'square'}
  style="--avatar-size: {dimensions.size}; --border-width: {dimensions.border};"
>
  <div 
    class="avatar-image"
    style="background-image: url('{imageSrc}'); --agent-bg: {colors.bg}; --agent-border: {colors.border};"
  >
    {#if showStatus}
      <div class="status-dot" class:online={isOnline}></div>
    {/if}
  </div>
  
  {#if showBorder}
    <div class="avatar-border" style="--agent-border: {colors.border};"></div>
  {/if}
</div>

<style>
  .avatar-container {
    position: relative;
    display: inline-block;
    width: var(--avatar-size);
    height: var(--avatar-size);
  }
  
  .avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .avatar-container.shape-square .avatar-image {
    border-radius: 12px;
  }

  .avatar-image::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--agent-bg) 0%, rgba(255,255,255,0.1) 100%);
    opacity: 0.3;
    transition: opacity 0.3s ease;
  }

  .avatar-container.shape-square .avatar-image::before {
    border-radius: 12px;
  }
  
  .avatar-container:hover .avatar-image::before {
    opacity: 0.1;
  }
  
  .avatar-container:hover .avatar-image {
    transform: scale(1.05);
  }
  
  .avatar-border {
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      var(--agent-border),
      rgba(255,255,255,0.8),
      var(--agent-border),
      transparent,
      var(--agent-border)
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  .avatar-container.shape-square .avatar-border {
    border-radius: 14px;
  }
  
  .show-border:hover .avatar-border {
    opacity: 1;
  }
  
  .status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    background: #ef4444;
    transition: all 0.3s ease;
  }
  
  .status-dot.online {
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  }
  
  /* Size variants */
  .avatar-container:global(.size-small) {
    --avatar-size: 28px;
  }
  
  .avatar-container:global(.size-large) {
    --avatar-size: 64px;
  }
  
  /* Animation for new messages */
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  .avatar-image:global(.new-message) {
    animation: pulse 0.6s ease-in-out;
  }
</style>
