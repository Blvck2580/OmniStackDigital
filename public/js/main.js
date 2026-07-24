/* ── Scroll reveal ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Nav: scroll shadow + scroll-spy ── */
const header = document.querySelector('header.site');
const navLinks = document.querySelectorAll('.nav-links a');
const sections = ['services', 'process', 'why', 'contact'].map(id => document.getElementById(id));

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);

  let current = '';
  sections.forEach(sec => {
    if (sec && window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}, { passive: true });

/* ── Mobile hamburger ── */
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.getElementById('mobileNav');

function openMenu() {
  hamburger.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  mobileNav.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileNav.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  hamburger.classList.contains('open') ? closeMenu() : openMenu();
});
mobileNav.addEventListener('click', e => {
  if (e.target === mobileNav || e.target.tagName === 'A') closeMenu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

/* ── Hero cycling word ── */
const words = document.querySelectorAll('#cycleWord .word');
let wordIdx = 0;
setInterval(() => {
  words[wordIdx].classList.remove('active');
  words[wordIdx].classList.add('exit');
  const prev = wordIdx;
  wordIdx = (wordIdx + 1) % words.length;
  words[wordIdx].classList.add('active');
  setTimeout(() => words[prev].classList.remove('exit'), 400);
}, 2400);

/* ── Animated stat counters ── */
function animateCount(el, target, duration = 1200) {
  if (target === 0) { el.textContent = '0'; return; }
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statEls = document.querySelectorAll('.stat b');
const statTargets = [4, 1, 0];
let statsDone = false;
const statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !statsDone) {
      statsDone = true;
      statEls.forEach((el, i) => animateCount(el, statTargets[i]));
    }
  });
}, { threshold: 0.5 });
if (statEls[0]) statObs.observe(statEls[0].closest('.stat-row'));

/* ── Process steps: click to expand ── */
document.querySelectorAll('.process-step').forEach(step => {
  function toggle() {
    const isActive = step.classList.contains('active-step');
    document.querySelectorAll('.process-step').forEach(s => s.classList.remove('active-step'));
    if (!isActive) step.classList.add('active-step');
  }
  step.addEventListener('click', toggle);
  step.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

/* ── Contact form ── */
const form = document.getElementById('contactForm');
const successMsg = document.getElementById('formSuccess');

function validateField(fieldWrap, inputEl) {
  const val = inputEl.value.trim();
  let ok = val.length > 0;
  if (inputEl.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  fieldWrap.classList.toggle('error', !ok);
  return ok;
}

['f-name', 'f-email', 'f-service', 'f-message'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', () => validateField(el.closest('.field'), el));
  el.addEventListener('input', () => {
    if (el.closest('.field').classList.contains('error')) validateField(el.closest('.field'), el);
  });
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  const fields = [
    { el: document.getElementById('f-name') },
    { el: document.getElementById('f-email') },
    { el: document.getElementById('f-service') },
    { el: document.getElementById('f-message') },
  ];
  const allValid = fields.every(f => validateField(f.el.closest('.field'), f.el));
  if (!allValid) {
    fields.find(f => f.el.closest('.field').classList.contains('error'))?.el.focus();
    return;
  }

  const btn = form.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    document.getElementById('f-name').value.trim(),
        email:   document.getElementById('f-email').value.trim(),
        service: document.getElementById('f-service').value,
        message: document.getElementById('f-message').value.trim(),
      }),
    });
    if (res.ok) {
      form.reset();
      btn.style.display = 'none';
      successMsg.style.display = 'flex';
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Something went wrong. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Send message';
    }
  } catch {
    alert('Network error — please try again.');
    btn.disabled = false;
    btn.textContent = 'Send message';
  }
});
