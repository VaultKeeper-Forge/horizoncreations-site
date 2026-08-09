  (() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scenes = [...document.querySelectorAll('[data-scroll-scene]')];
    let sceneFrameRequested = false;

    const updateScenes = () => {
      sceneFrameRequested = false;
      scenes.forEach((scene) => {
        const property = scene.dataset.scrollScene === 'collapse' ? '--collapse' : '--mesh-reveal';
        if (reducedMotion.matches) {
          scene.style.setProperty(property, scene.dataset.scrollScene === 'collapse' ? '.72' : '1');
          return;
        }
        const rect = scene.getBoundingClientRect();
        const travel = Math.max(1, rect.height - window.innerHeight);
        const progress = Math.max(0, Math.min(1, -rect.top / travel));
        scene.style.setProperty(property, progress.toFixed(3));
      });
    };

    const requestSceneUpdate = () => {
      if (sceneFrameRequested) return;
      sceneFrameRequested = true;
      window.requestAnimationFrame(updateScenes);
    };

    const configureMotion = () => {
      const canObserve = 'IntersectionObserver' in window;
      document.documentElement.classList.toggle('motion-ready', canObserve && !reducedMotion.matches);
      updateScenes();
    };

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
      document.querySelectorAll('[data-reveal]').forEach((item) => revealObserver.observe(item));
    }

    window.addEventListener('scroll', requestSceneUpdate, { passive: true });
    window.addEventListener('resize', requestSceneUpdate, { passive: true });
    reducedMotion.addEventListener?.('change', configureMotion);
    configureMotion();

    window.VAULT_COMPILER_CONFIG = {requestEndpoint: 'https://horizon-creations.the-vaultkeeper.chatgpt.site/api/vault-requests', sourceVersion: 'SIO-2026-08-08-VC-WAITLIST-LIVE-010'};
  })();
