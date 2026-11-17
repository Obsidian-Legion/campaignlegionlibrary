(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const film = document.getElementById('legion-film');
  const sound = document.getElementById('sound-toggle');
  const motion = document.getElementById('motion-toggle');
  const replay = document.getElementById('replay');
  const skip = document.getElementById('skip-intro');
  const status = document.getElementById('playback-status');
  const canvas = document.getElementById('embers');
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const preferenceKey = 'legion-campaign-motion';
  let storedPreference;
  try { storedPreference = localStorage.getItem(preferenceKey); } catch { /* Storage is optional. */ }
  let paused = reduced.matches || storedPreference === 'paused';
  let intro = !paused;
  let failed = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let lastMediaTime = -1;
  let stalledFor = 0;
  let width = innerWidth;
  let height = innerHeight;
  let particles = [];

  document.getElementById('playback-controls').hidden = false;
  film.muted = true;
  film.volume = .65;

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context?.setTransform(density, 0, 0, density, 0, 0);
    // A deterministic field keeps resizing predictable and avoids dense sparks.
    particles = Array.from({ length: width < 700 ? 25 : 65 }, (_, index) => ({
      x: ((index * 0.61803398875) % 1) * width,
      y: ((index * 0.41421356237) % 1) * height,
      speed: 9 + (index % 7) * 3,
      size: index % 5 === 0 ? 1.5 : .7,
      phase: index * 2.37,
    }));
    draw(0.25);
  }

  function draw(beat) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    for (const p of particles) {
      const y = ((p.y - elapsed * p.speed) % (height + 40) + height + 40) % (height + 40) - 20;
      const x = p.x + Math.sin(elapsed * .22 + p.phase) * 19;
      const alpha = .12 + (Math.sin(elapsed * .7 + p.phase) + 1) * .15 + beat * .08;
      context.beginPath();
      context.strokeStyle = `rgba(233, ${71 + p.phase % 50}, 35, ${alpha})`;
      context.lineWidth = p.size;
      context.moveTo(x, y);
      context.lineTo(x - 1.5, y + p.size * 3);
      context.stroke();
    }
  }

  function finishIntro(animate = true) {
    const returnFocus = document.activeElement === skip;
    intro = false;
    body.classList.remove('is-intro');
    body.classList.toggle('has-revealed', animate && !paused);
    skip.hidden = true;
    film.loop = true;
    if (returnFocus) replay.focus({ preventScroll: true });
  }

  function updateControls() {
    body.classList.toggle('motion-paused', paused);
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? 'Resume motion' : 'Pause motion');
    motion.querySelector('span').textContent = paused ? 'Resume motion' : 'Pause motion';
    body.classList.toggle('sound-on', !film.muted);
    sound.setAttribute('aria-pressed', String(!film.muted));
    sound.setAttribute('aria-label', film.muted ? 'Enable sound' : 'Mute sound');
    sound.querySelector('span').textContent = film.muted ? 'Sound off' : 'Sound on';
  }

  function tick(now) {
    frame = 0;
    if (paused || document.hidden || failed) return;
    const delta = previous ? Math.min((now - previous) / 1000, .08) : 0;
    previous = now;
    elapsed += delta;
    const time = film.currentTime || 0;
    const duration = Number.isFinite(film.duration) ? film.duration : 8;
    const beat = .16 + .38 * Math.pow((Math.sin(time * Math.PI / 2 - .6) + 1) / 2, 3);
    root.style.setProperty('--beat', beat.toFixed(3));
    root.style.setProperty('--progress', String(Math.min(time / duration, 1)));
    root.style.setProperty('--sweep', `${Math.min(125, -125 + (time / duration) * 600)}%`);
    if (intro) {
      stalledFor = time === lastMediaTime ? stalledFor + delta : 0;
      lastMediaTime = time;
      if (stalledFor > 12) {
        finishIntro(false);
        setPaused(true, false);
        status.textContent = 'The intro is taking a while to load. The campaign is ready; use Replay intro to try again.';
        return;
      }
    }
    draw(beat);
    frame = requestAnimationFrame(tick);
  }

  function startFrames() {
    if (frame || paused || document.hidden || failed) return;
    previous = 0;
    frame = requestAnimationFrame(tick);
  }

  function play() {
    if (failed || paused || document.hidden) return;
    const attempt = film.play();
    if (attempt) attempt.catch(error => {
      if (error.name === 'AbortError' || paused || document.hidden) return;
      finishIntro(false);
      setPaused(true, false);
      status.textContent = 'Select Resume motion or Replay intro to start the presentation.';
    });
    startFrames();
  }

  function setPaused(value, persist = true) {
    paused = value;
    if (paused) {
      film.pause();
      cancelAnimationFrame(frame);
      frame = 0;
      // Make the banner immediately visible even if paused during its reveal.
      if (!intro) body.classList.remove('has-revealed');
      root.style.setProperty('--pointer-x', '0px');
      root.style.setProperty('--pointer-y', '0px');
    } else play();
    updateControls();
    if (persist) {
      try { localStorage.setItem(preferenceKey, paused ? 'paused' : 'playing'); } catch { /* Storage is optional. */ }
    }
  }

  film.addEventListener('ended', () => {
    finishIntro();
    film.currentTime = 0;
    play();
  });
  function handleMediaError() {
    failed = true;
    finishIntro(false);
    setPaused(true, false);
    motion.disabled = true;
    sound.disabled = true;
    replay.disabled = true;
    status.textContent = 'The video is unavailable. The Legion crest and campaign banner are still displayed.';
  }
  film.addEventListener('error', handleMediaError);
  film.querySelector('source').addEventListener('error', handleMediaError);
  skip.addEventListener('click', () => finishIntro());
  document.querySelector('.skip-link').addEventListener('click', () => finishIntro(false));
  motion.addEventListener('click', () => setPaused(!paused));
  sound.addEventListener('click', () => { film.muted = !film.muted; updateControls(); });
  replay.addEventListener('click', () => {
    if (failed) return;
    status.textContent = '';
    intro = true;
    stalledFor = 0;
    lastMediaTime = -1;
    film.loop = false;
    film.currentTime = 0;
    body.classList.remove('has-revealed');
    body.classList.add('is-intro');
    skip.hidden = false;
    skip.focus({ preventScroll: true });
    setPaused(false);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      film.pause();
      cancelAnimationFrame(frame);
      frame = 0;
    } else play();
  });
  reduced.addEventListener('change', event => {
    if (event.matches) {
      finishIntro(false);
      setPaused(true, false);
    }
  });
  document.addEventListener('pointermove', event => {
    if (paused || intro || !finePointer.matches || reduced.matches) return;
    root.style.setProperty('--pointer-x', `${((event.clientX / width) - .5) * 8}px`);
    root.style.setProperty('--pointer-y', `${((event.clientY / height) - .5) * 5}px`);
  });
  document.documentElement.addEventListener('pointerleave', () => {
    root.style.setProperty('--pointer-x', '0px');
    root.style.setProperty('--pointer-y', '0px');
  });
  addEventListener('resize', resize, { passive: true });
  resize();
  updateControls();
  if (film.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) handleMediaError();
  else if (intro) {
    body.classList.add('is-intro');
    skip.hidden = false;
    play();
  } else finishIntro(false);
})();
