(() => {
  let currentObjectURL = null;
  let injected = false;

  // ── Selectores confirmados do YouTube ────────────────────────

  function getYTVideo() {
    return document.querySelector('#movie_player video.html5-main-video');
  }

  function getYTPlayer() {
    return document.querySelector('#movie_player');
  }

  function getRightControls() {
    return document.querySelector('#movie_player .ytp-right-controls');
  }

  // ── Pausa o YouTube ──────────────────────────────────────────

  function pauseYouTube() {
    const p = getYTPlayer();
    if (p && typeof p.pauseVideo === 'function') p.pauseVideo();
    const v = getYTVideo();
    if (v) v.pause();
  }

  // ── Injeta o botão ───────────────────────────────────────────

  function injectButton() {
    // Já existe?
    if (document.getElementById('ytlp-btn')) {
      injected = true;
      return;
    }

    const rightControls = getRightControls();
    if (!rightControls) return;

    const btn = document.createElement('button');
    btn.id = 'ytlp-btn';
    btn.className = 'ytp-button';
    btn.title = 'Abrir vídeo local';
    btn.setAttribute('aria-label', 'Abrir vídeo local');

    // Estilos inline — imune ao CSS do YouTube
    btn.style.cssText = `
      width:48px !important;
      height:48px !important;
      padding:0 !important;
      margin:0 !important;
      background:none !important;
      background-color:transparent !important;
      border:none !important;
      cursor:pointer !important;
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
      opacity:0.85;
      flex-shrink:0;
      position:relative;
      vertical-align:top;
    `;

    // SVG construído via DOM — evita que o YouTube sanitize innerHTML
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('xmlns', ns);
    svg.style.cssText = 'display:block;pointer-events:none;overflow:visible;';

    // Ícone: pasta com seta de upload
    const paths = [
      // pasta
      ['M2 8.5A2.5 2.5 0 014.5 6H9l2 2h8.5A2.5 2.5 0 0122 10.5V17a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17V8.5z',
        { stroke:'#ffffff', 'stroke-width':'1.5', 'stroke-linejoin':'round', fill:'none' }],
      // seta para cima
      ['M12 18v-6', { stroke:'#ffffff', 'stroke-width':'1.5', 'stroke-linecap':'round', fill:'none' }],
      ['M9.5 14l2.5-2.5 2.5 2.5', { stroke:'#ffffff', 'stroke-width':'1.5', 'stroke-linecap':'round', 'stroke-linejoin':'round', fill:'none' }],
    ];

    paths.forEach(([d, attrs]) => {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v));
      svg.appendChild(p);
    });

    btn.appendChild(svg);

    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.85'; });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openFilePicker();
    });

    // Insere mesmo antes do botão de fullscreen
    const fullscreenBtn = rightControls.querySelector(':scope > .ytp-fullscreen-button');
    rightControls.insertBefore(btn, fullscreenBtn || rightControls.firstChild);

    injected = true;
    console.log('[YT Local Player] Botão injectado.');
  }

  // ── File picker ──────────────────────────────────────────────

  function openFilePicker() {
    let input = document.getElementById('ytlp-file-input');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.id = 'ytlp-file-input';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadLocalVideo(file);
        input.value = '';
      });
    }
    input.click();
  }

  // ── Swap de vídeo ────────────────────────────────────────────

  function loadLocalVideo(file) {
    const ytVideo = getYTVideo();
    if (!ytVideo) {
      alert('YT Local Player: player não encontrado. Recarrega a página.');
      return;
    }

    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = URL.createObjectURL(file);

    pauseYouTube();

    ytVideo.src = currentObjectURL;
    ytVideo.load();
    ytVideo.play().catch(() => {});

    // Badge no botão
    const btn = document.getElementById('ytlp-btn');
    if (btn) {
      btn.title = `YT Local Player ✓\n${file.name}\n\nClica para trocar vídeo`;
      btn.style.opacity = '1';
    }

    showToast(`▶ ${file.name}`);
  }

  // ── Toast ────────────────────────────────────────────────────

  function showToast(msg) {
    let toast = document.getElementById('ytlp-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ytlp-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('ytlp-toast-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('ytlp-toast-show'), 3500);
  }

  // ── Observer: detecta quando o player aparece/muda ───────────

  function watchForPlayer() {
    // Tenta injectar imediatamente se já estiver no DOM
    injectButton();

    const observer = new MutationObserver(() => {
      // Botão desapareceu (ex: YT reconstruiu o player)?
      if (!document.getElementById('ytlp-btn')) {
        injected = false;
      }
      if (!injected && getRightControls()) {
        injectButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Também observa mudanças de URL (SPA)
    let lastURL = location.href;
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastURL) {
        lastURL = location.href;
        if (currentObjectURL) {
          URL.revokeObjectURL(currentObjectURL);
          currentObjectURL = null;
        }
        injected = false;
      }
    });
    urlObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ── Mensagem do background (clique no ícone da extensão) ─────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'openLocalVideo') openFilePicker();
  });

  // ── Arranque ─────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForPlayer);
  } else {
    watchForPlayer();
  }

})();
