/* ==========================================================================
   Coffee-Bike — interactions
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- header solid on scroll ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('is-solid');
    else header.classList.remove('is-solid');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => mobileNav.classList.toggle('is-open'));
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('is-open')));
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ---------- menu tabs ---------- */
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      panels.forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.getElementById(tab.dataset.target).classList.add('is-active');
    });
  });

  /* ==========================================================================
     Stories: render strip + modal viewer
     ========================================================================== */
  const stripEl = document.getElementById('storiesStrip');
  if (stripEl && typeof STORIES !== 'undefined') {
    stripEl.innerHTML = STORIES.map((s, i) => {
      const thumb = s.photos[0]
        ? `assets/stories/${s.id}/${s.photos[0]}`
        : (s.videos[0] ? `assets/stories/${s.id}/${s.videos[0].poster}` : '');
      const isVideo = !s.photos[0] && s.videos[0];
      return `
        <div class="story-card" data-index="${i}" tabindex="0" role="button" aria-label="Історія ${i + 1}">
          <span class="num">${String(i + 1).padStart(2, '0')}</span>
          ${isVideo ? `<span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>` : ''}
          <img src="${thumb}" alt="" loading="lazy">
          <div class="cap">${escapeHtml(s.text).slice(0, 70)}${s.text.length > 70 ? '…' : ''}</div>
        </div>`;
    }).join('');

    stripEl.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', () => openStory(parseInt(card.dataset.index, 10)));
      card.addEventListener('keypress', (e) => { if (e.key === 'Enter') openStory(parseInt(card.dataset.index, 10)); });
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ---- modal state ----
  const modal = document.getElementById('storyModal');
  const modalMedia = document.getElementById('storyModalMedia');
  const modalProgress = document.getElementById('storyModalProgress');
  const modalText = document.getElementById('storyModalText');
  const modalClose = document.getElementById('storyModalClose');
  const prevZone = document.getElementById('storyPrev');
  const nextZone = document.getElementById('storyNext');

  let currentStory = 0;
  let currentSlide = 0;
  let slides = [];
  let timer = null;
  const SLIDE_MS = 4200;

  function buildSlides(story) {
    const list = [];
    story.photos.forEach(p => list.push({ type: 'photo', src: `assets/stories/${story.id}/${p}` }));
    story.videos.forEach(v => list.push({ type: 'video', src: `assets/stories/${story.id}/${v.file}`, poster: `assets/stories/${story.id}/${v.poster}` }));
    return list;
  }

  function openStory(index) {
    if (typeof STORIES === 'undefined') return;
    currentStory = index;
    currentSlide = 0;
    const story = STORIES[currentStory];
    slides = buildSlides(story);
    modalProgress.innerHTML = slides.map(() => '<i><b></b></i>').join('');
    modalText.textContent = story.text;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    renderSlide();
  }

  function closeStory() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    clearTimer();
    modalMedia.innerHTML = '';
  }

  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
    modalProgress.querySelectorAll('i b').forEach(b => { b.style.transition = 'none'; b.style.width = '0%'; });
  }

  function renderSlide() {
    clearTimer();
    const bars = modalProgress.querySelectorAll('i');
    bars.forEach((bar, i) => {
      bar.classList.toggle('done', i < currentSlide);
      const b = bar.querySelector('b');
      b.style.transition = 'none';
      b.style.width = i < currentSlide ? '100%' : '0%';
    });

    const slide = slides[currentSlide];
    if (!slide) { closeStory(); return; }
    modalMedia.innerHTML = '';

    if (slide.type === 'photo') {
      const img = document.createElement('img');
      img.src = slide.src;
      img.alt = '';
      modalMedia.appendChild(img);
      animateBar(SLIDE_MS);
      timer = setTimeout(nextSlide, SLIDE_MS);
    } else {
      const video = document.createElement('video');
      video.src = slide.src;
      video.poster = slide.poster;
      video.autoplay = true;
      video.muted = false;
      video.playsInline = true;
      video.controls = false;
      video.addEventListener('loadedmetadata', () => animateBar(video.duration * 1000 || SLIDE_MS));
      video.addEventListener('ended', nextSlide);
      video.play().catch(() => {});
      modalMedia.appendChild(video);
    }
  }

  function animateBar(duration) {
    const bar = modalProgress.querySelectorAll('i')[currentSlide];
    if (!bar) return;
    const b = bar.querySelector('b');
    requestAnimationFrame(() => {
      b.style.transition = `width ${duration}ms linear`;
      b.style.width = '100%';
    });
  }

  function nextSlide() {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      renderSlide();
    } else if (currentStory < STORIES.length - 1) {
      openStory(currentStory + 1);
    } else {
      closeStory();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      renderSlide();
    } else if (currentStory > 0) {
      openStory(currentStory - 1);
      currentSlide = slides.length - 1;
      renderSlide();
    }
  }

  if (modalClose) modalClose.addEventListener('click', closeStory);
  if (nextZone) nextZone.addEventListener('click', nextSlide);
  if (prevZone) prevZone.addEventListener('click', prevSlide);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeStory(); });
  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeStory();
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });

  /* ==========================================================================
     Locations + Leaflet map
     ========================================================================== */
  const locListEl = document.getElementById('locList');
  if (locListEl && typeof LOCATIONS !== 'undefined') {
    locListEl.innerHTML = LOCATIONS.map((loc, i) => `
      <div class="loc-item" data-index="${i}">
        <div class="loc-index">${String(i + 1).padStart(2, '0')}</div>
        <div class="loc-body">
          <span class="loc-tag">${loc.tag}</span>
          <h3>${loc.name}</h3>
          <p class="loc-addr">${loc.address}</p>
          <p class="loc-hours">${loc.hours}</p>
          <p class="loc-desc">${loc.desc}</p>
          <a class="btn btn-primary" href="${loc.mapUrl}" target="_blank" rel="noopener">
            Побудувати маршрут
          </a>
        </div>
      </div>`).join('');

    let map, markers = [];
    if (window.L) {
      map = L.map('map', { scrollWheelZoom: false }).setView([48.6805, 26.5790], 13.4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const bikeIcon = (num) => L.divIcon({
        className: 'cb-marker',
        html: `<div style="
          background:#B9812E;color:#251712;font:600 12px 'IBM Plex Mono',monospace;
          width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(45deg);
          display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.35);
          border:2px solid #FBF7ED;">
          <span style="transform:rotate(-45deg);">${num}</span>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 28]
      });

      LOCATIONS.forEach((loc, i) => {
        const m = L.marker([loc.lat, loc.lng], { icon: bikeIcon(i + 1) }).addTo(map);
        m.bindPopup(`<b>${loc.name}</b><br>${loc.address}<br><a href="${loc.mapUrl}" target="_blank" rel="noopener">Маршрут →</a>`);
        markers.push(m);
      });
    }

    const items = locListEl.querySelectorAll('.loc-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        items.forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
        const idx = parseInt(item.dataset.index, 10);
        if (map && markers[idx]) {
          map.flyTo(markers[idx].getLatLng(), 15, { duration: 0.7 });
          markers[idx].openPopup();
        }
      });
    });
  }

  /* ---------- gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  document.querySelectorAll('[data-lightbox]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      lightboxImg.src = link.getAttribute('href');
      lightbox.classList.add('is-open');
    });
  });
  function closeLightbox() { lightbox.classList.remove('is-open'); lightboxImg.src = ''; }
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- contact form (demo, no backend) ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Надіслано ✓';
      form.reset();
      setTimeout(() => { btn.textContent = original; }, 2600);
    });
  }
});
