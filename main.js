/* ═══════════════════════════════════════
   THE QUALITY CATALYST — main.js
   Slider · Nav · Services · Contact · Admin
═══════════════════════════════════════ */

/* ── SLIDER ── */
let currentSlide = 0;
let slideTimer;

function resetProgress() {
  const bar = document.getElementById('sliderProgressBar');
  if (!bar) return;
  bar.classList.remove('running');
  bar.style.transition = 'none';
  bar.style.width = '0%';
  // Force reflow
  bar.getBoundingClientRect();
  bar.style.transition = 'width 5.5s linear';
  requestAnimationFrame(() => bar.classList.add('running'));
}

function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const dotsContainer = document.getElementById('sliderDots');
  if (!slides.length || !dotsContainer) return;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    dot.onclick = () => { clearInterval(slideTimer); goToSlide(i); startAutoPlay(); };
    dotsContainer.appendChild(dot);
  });

  startAutoPlay();
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (!slides.length) return;
  slides[currentSlide].classList.remove('active');
  if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  if (dots[currentSlide]) dots[currentSlide].classList.add('active');
  resetProgress();
}

function changeSlide(dir) {
  clearInterval(slideTimer);
  goToSlide(currentSlide + dir);
  startAutoPlay();
}

function startAutoPlay() {
  clearInterval(slideTimer);
  resetProgress();
  slideTimer = setInterval(() => goToSlide(currentSlide + 1), 5500);
}

/* ── MOBILE NAV ── */
function toggleNav() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('open');
}

// Close nav on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('navMenu');
  const hamburger = document.getElementById('hamburger');
  if (menu && hamburger && !menu.contains(e.target) && !hamburger.contains(e.target)) {
    menu.classList.remove('open');
  }
});

/* ── SERVICES ACCORDION ── */
let activeServiceBtn = null;

function toggleService(btn) {
  const card = btn.closest('.service-card');
  const expanded = card.querySelector('.service-expanded');
  const isOpen = expanded.classList.contains('open');

  // Close currently open card
  if (activeServiceBtn && activeServiceBtn !== btn) {
    const prevCard = activeServiceBtn.closest('.service-card');
    const prevExpanded = prevCard.querySelector('.service-expanded');
    prevExpanded.classList.remove('open');
    activeServiceBtn.classList.remove('open');
    setReadBtnText(activeServiceBtn, false);
  }

  if (isOpen) {
    expanded.classList.remove('open');
    btn.classList.remove('open');
    setReadBtnText(btn, false);
    activeServiceBtn = null;
  } else {
    expanded.classList.add('open');
    btn.classList.add('open');
    setReadBtnText(btn, true);
    activeServiceBtn = btn;
  }
}

function setReadBtnText(btn, isOpen) {
  const textNode = btn.childNodes[0];
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    textNode.textContent = isOpen ? 'Read Less ' : 'Read More ';
  }
}

/* ── CONTACT FORM ── */
async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('formAlert');
  const btn = form.querySelector('.submit-btn');
  const data = Object.fromEntries(new FormData(form).entries());

  alertEl.style.display = 'none';
  alertEl.className = 'alert';
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alertEl.className = 'alert success';
      alertEl.textContent = '✅ Thank you! Your enquiry has been submitted successfully. Our team will respond within 24 hours.';
      form.reset();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Server error');
    }
  } catch (err) {
    alertEl.className = 'alert error';
    alertEl.textContent = '❌ Unable to send your enquiry. Please try again or contact us directly at tqc.delhi@gmail.com';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✉️ &nbsp; Send Enquiry';
    alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* ── ADMIN LOGIN ── */
function adminLogin(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('loginAlert');
  const username = form.username.value.trim();
  const password = form.password.value;

  if (username === 'admin' && password === 'admin123') {
    sessionStorage.setItem('tqc_admin', 'true');
    window.location.href = 'admin-dashboard.html';
  } else {
    alertEl.className = 'alert error';
    alertEl.textContent = '❌ Invalid username or password. Please try again.';
    alertEl.style.display = 'block';
  }
}

function adminLogout() {
  sessionStorage.removeItem('tqc_admin');
  window.location.href = 'admin-login.html';
}

function checkAdminAuth() {
  if (window.location.pathname.includes('admin-dashboard')) {
    if (!sessionStorage.getItem('tqc_admin')) {
      window.location.href = 'admin-login.html';
    } else {
      loadEnquiries();
    }
  }
}

/* ── ADMIN DASHBOARD ── */
async function loadEnquiries() {
  const tbody = document.getElementById('enquiriesBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon">⏳</div><p>Loading enquiries...</p></div></td></tr>';

  try {
    const res = await fetch('/api/contact');
    if (!res.ok) throw new Error('API error');
    const enquiries = await res.json();

    updateStats(enquiries);

    if (!enquiries.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon">📭</div><p>No enquiries yet. Share the contact page!</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = enquiries.map((eq, i) => `
      <tr>
        <td><span class="badge badge-blue">#${i + 1}</span></td>
        <td>
          <strong>${esc(eq.name)}</strong>
          ${eq.company ? `<br><span style="font-size:12px;color:var(--muted);">${esc(eq.company)}</span>` : ''}
          ${eq.country ? `<br><span style="font-size:11px;color:var(--muted);">📍 ${esc(eq.country)}</span>` : ''}
        </td>
        <td style="word-break:break-all;font-size:13px;">
          <a href="mailto:${esc(eq.email)}" style="color:var(--blue);">${esc(eq.email)}</a>
        </td>
        <td style="white-space:nowrap;font-size:13px;">${esc(eq.phone)}</td>
        <td style="font-size:13px;font-weight:500;">${esc(eq.subject)}</td>
        <td style="max-width:200px;font-size:13px;">
          <span title="${esc(eq.message)}" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${esc(eq.message)}
          </span>
        </td>
        <td style="white-space:nowrap;font-size:12px;color:var(--muted);">${formatDate(eq.createdAt)}</td>
        <td>
          <button class="delete-btn" onclick="deleteEnquiry('${eq._id}')">🗑 Delete</button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon">⚠️</div><p>Failed to load enquiries.<br><small>Is the Node.js server running?</small></p></div></td></tr>';
  }
}

function updateStats(enquiries) {
  const totalEl = document.getElementById('totalCount');
  const todayEl = document.getElementById('todayCount');
  const weekEl = document.getElementById('weekCount');
  if (!totalEl) return;

  const now = new Date();
  const todayStr = now.toDateString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  totalEl.textContent = enquiries.length;
  todayEl.textContent = enquiries.filter(e => new Date(e.createdAt).toDateString() === todayStr).length;
  weekEl.textContent = enquiries.filter(e => new Date(e.createdAt) >= weekAgo).length;
}

async function deleteEnquiry(id) {
  if (!confirm('Delete this enquiry permanently? This action cannot be undone.')) return;
  try {
    const res = await fetch('/api/contact/' + id, { method: 'DELETE' });
    if (res.ok) {
      loadEnquiries();
    } else {
      alert('Failed to delete. Please try again.');
    }
  } catch {
    alert('Network error. Please check server connection.');
  }
}

/* ── HELPERS ── */
function esc(str) {
  if (!str) return '—';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initSlider();
  checkAdminAuth();

  /* Set topbar height CSS variable for mobile drawer positioning */
  function setTopbarHeight() {
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      document.documentElement.style.setProperty('--topbar-h', topbar.getBoundingClientRect().height + 'px');
    }
  }
  setTopbarHeight();
  window.addEventListener('resize', setTopbarHeight);
});

/* ═══════════════════════════════════════════════════════════════
   PROGRESSIVE FLYOUT MENU v5
   Level 1: hover nav item → L1 dropdown slides down
   Level 2: hover L1 item  → L2 panel slides out to the right
   Level 3: hover L2 item  → L3 panel slides out further right
   Each level opens one-by-one. Hover-safe with delay timers.
   Desktop: hover | Mobile: tap accordion
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ════════ DATA ════════ */
  const L1_ITEMS = [
    { key: 'consulting', label: 'Consulting' },
    { key: 'training',   label: 'Training'   },
    { key: 'auditing',   label: 'Auditing'   }
  ];

  const L2_BY_L1 = {
    consulting: [
      { key: 'quality',        label: 'Quality Management'     },
      { key: 'social',         label: 'Social Compliances'     },
      { key: 'product',        label: 'Product Certification'  },
      { key: 'sustainability', label: 'Sustainability'         },
      { key: 'software',       label: 'Software & ITES'        },
      { key: 'food',           label: 'Food Safety / GMP'      },
      { key: 'lab',            label: 'Lab / Inspection Body'  },
      { key: 'business',       label: 'Business Excellence'    }
    ],
    training: [
      { key: 'quality',        label: 'Quality Systems'        },
      { key: 'social',         label: 'Social Compliance'      },
      { key: 'sustainability', label: 'Sustainability'         },
      { key: 'software',       label: 'IT & Cyber Security'    },
      { key: 'food',           label: 'Food Safety'            },
      { key: 'business',       label: 'Process Excellence'     }
    ],
    auditing: [
      { key: 'quality',        label: 'Quality Audits'         },
      { key: 'social',         label: 'Social / HSE Audits'    },
      { key: 'software',       label: 'IS / VAPT Audits'       },
      { key: 'sustainability', label: 'Energy & Environment'   },
      { key: 'food',           label: 'Food Safety Audits'     },
      { key: 'lab',            label: 'Lab Accreditation'      }
    ]
  };

  const L3_BY_L2 = {
    quality:        ['ISO 9001:2015', 'IATF 16949', 'AS 9100 / 9110 / 9120', 'ISO/TS 22163 (IRIS)', 'ISO 13485', 'API Q1 / Q2', 'VDA 6.3', 'ISO 29001', 'TL 9000', 'ISO 15378', 'GMP / cGMP / GLP / GHP'],
    social:         ['BSCI Audit', 'SEDEX / SMETA', 'WRAP Certification', 'SA 8000', 'CTPAT / SCAN', 'RBA', 'ICTI Ethical Toy Prog', 'ISO 26000', 'Higg FSLM', 'PoSH Compliance'],
    product:        ['CE Marking (MDD/PED/LVD)', 'UL Certification', 'UKCA Mark', 'Ecocert', 'FSC Certification', 'BIS / ISI Mark', 'AGMARK', 'FSSAI', 'ISO 17065'],
    sustainability: ['ISO 14001:2015', 'ISO 14064 (GHG Accounting)', 'ISO 14044 (LCA)', 'ISO 50001 (EnMS)', 'GRS – Global Recycled Standard', 'GOTS Certification', 'Higg FEM 3.0', 'RoHS 3', 'Water Stewardship', 'Carbon Footprint Assessment'],
    software:       ['ISO 27001 (ISMS)', 'ISO 20000-1 (ITSM)', 'ISO 22301 (BCMS)', 'COBIT Framework', 'PCI DSS', 'SOC 2', 'VAPT Assessment', 'Web Application Audit', 'Network Security Audit', 'Penetration Testing'],
    food:           ['ISO 22000', 'HACCP Plan', 'FSSC 22000', 'BRC Food Standard', 'SQF Certification', 'IFS Food', 'ISO 22716 (Cosmetics GMP)', 'GMP / cGMP', 'Halal Certification', 'Organic Certification'],
    lab:            ['ISO 17025 (Testing & Calibration)', 'ISO 15189 (Medical Lab)', 'ISO 17020 (Inspection Body)', 'ISO 17021 (Certification Body)', 'ISO 17065', 'NABL Accreditation', 'Lab Quality Manual', 'Measurement Uncertainty', 'Proficiency Testing'],
    business:       ['Six Sigma – DMAIC & DFSS', 'SPC / SQC / DOE', 'Kaizen & 5S / JIT', 'Total Productive Maintenance', 'Total Quality Management', 'Process Development', 'ISO 56002 (Innovation Mgmt)', 'ISO 31000 (Risk Mgmt)', 'ISO 41001 (Facility Mgmt)']
  };

  /* ════════ HELPERS ════════ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* Check if a panel would overflow right edge; if so, add flip-left */
  function checkFlip(panel) {
    panel.classList.remove('flip-left');
    const r = panel.getBoundingClientRect();
    if (r.right > window.innerWidth - 8) panel.classList.add('flip-left');
  }

  /* ════════ BUILD L1 PANEL ════════ */
  function buildL1Panel(navLi) {
    // Remove old panel if any
    navLi.querySelectorAll('.mm-l1-panel').forEach(p => p.remove());

    const panel = el('div', 'mm-l1-panel');
    panel.appendChild(el('div', 'mm-panel-head', 'Services'));

    L1_ITEMS.forEach((l1, i) => {
      const item = el('div', 'mm-l1-item');
      item.dataset.key = l1.key;
      item.innerHTML = `${l1.label}<i class="mm-caret">›</i>`;

      // Build nested L2 panel inside this item
      const l2Panel = buildL2Panel(l1.key);
      item.appendChild(l2Panel);

      // Desktop hover: activate this L1 item
      let l1Timer;
      item.addEventListener('mouseenter', () => {
        clearTimeout(l1Timer);
        // Deactivate siblings
        panel.querySelectorAll('.mm-l1-item').forEach(s => { s.classList.remove('mm-active'); });
        item.classList.add('mm-active');
        checkFlip(l2Panel);
      });
      item.addEventListener('mouseleave', () => {
        l1Timer = setTimeout(() => {
          // Only deactivate if cursor not inside its own l2 panel
          if (!item.matches(':hover') && !l2Panel.matches(':hover')) {
            item.classList.remove('mm-active');
          }
        }, 100);
      });
      l2Panel.addEventListener('mouseenter', () => clearTimeout(l1Timer));

      // Mobile: tap L1 item toggles its L2 panel
      item.addEventListener('click', (e) => {
        if (window.innerWidth > 1023) return;
        e.stopPropagation();
        const wasOpen = l2Panel.classList.contains('mob-open');
        panel.querySelectorAll('.mm-l2-panel').forEach(p => p.classList.remove('mob-open'));
        panel.querySelectorAll('.mm-l1-item').forEach(s => s.classList.remove('mob-open'));
        if (!wasOpen) { l2Panel.classList.add('mob-open'); item.classList.add('mob-open'); }
      });

      panel.appendChild(item);
    });

    navLi.appendChild(panel);
    return panel;
  }

  /* ════════ BUILD L2 PANEL ════════ */
  function buildL2Panel(l1Key) {
    const panel = el('div', 'mm-l2-panel');
    const sectorHead = {
      consulting: 'Sector / Domain',
      training:   'Training Area',
      auditing:   'Audit Type'
    };
    panel.appendChild(el('div', 'mm-panel-head', sectorHead[l1Key] || 'Sector'));

    (L2_BY_L1[l1Key] || []).forEach(l2 => {
      const item = el('div', 'mm-l2-item');
      item.dataset.key = l2.key;
      item.innerHTML = `${l2.label}<i class="mm-caret">›</i>`;

      // Build nested L3 panel
      const l3Panel = buildL3Panel(l2.key);
      item.appendChild(l3Panel);

      let l2Timer;
      item.addEventListener('mouseenter', () => {
        clearTimeout(l2Timer);
        panel.querySelectorAll('.mm-l2-item').forEach(s => s.classList.remove('mm-active'));
        item.classList.add('mm-active');
        checkFlip(l3Panel);
      });
      item.addEventListener('mouseleave', () => {
        l2Timer = setTimeout(() => {
          if (!item.matches(':hover') && !l3Panel.matches(':hover')) {
            item.classList.remove('mm-active');
          }
        }, 100);
      });
      l3Panel.addEventListener('mouseenter', () => clearTimeout(l2Timer));

      // Mobile: tap L2 item toggles its L3 panel
      item.addEventListener('click', (e) => {
        if (window.innerWidth > 1023) return;
        e.stopPropagation();
        const wasOpen = l3Panel.classList.contains('mob-open');
        panel.querySelectorAll('.mm-l3-panel').forEach(p => p.classList.remove('mob-open'));
        panel.querySelectorAll('.mm-l2-item').forEach(s => s.classList.remove('mob-open'));
        if (!wasOpen) { l3Panel.classList.add('mob-open'); item.classList.add('mob-open'); }
      });

      panel.appendChild(item);
    });

    return panel;
  }

  /* ════════ BUILD L3 PANEL ════════ */
  function buildL3Panel(l2Key) {
    const panel = el('div', 'mm-l3-panel');
    panel.appendChild(el('div', 'mm-panel-head', 'Standards & Services'));

    (L3_BY_L2[l2Key] || []).forEach(label => {
      const item = el('div', 'mm-l3-item', label);
      item.setAttribute('role', 'menuitem');
      item.addEventListener('click', () => {
        window.location.href = 'services.html';
      });
      panel.appendChild(item);
    });

    return panel;
  }

  /* ════════ INIT NAV LI ════════ */
  function initMegaLi(navLi) {
    // Update trigger link: replace old ▾ text, add proper caret span
    const a = navLi.querySelector('a');
    if (a) {
      a.classList.add('mega-trigger');
      // Clean old arrow characters from text
      a.childNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
          n.textContent = n.textContent.replace(/[▾▼▲▴‣›»]/g, '').trim();
        }
      });
      // Remove old caret spans if any
      a.querySelectorAll('.nav-caret').forEach(c => c.remove());
      // Add clean caret
      const caret = el('span', 'nav-caret');
      caret.setAttribute('aria-hidden', 'true');
      a.appendChild(caret);
    }

    navLi.classList.add('has-mega');
    const l1Panel = buildL1Panel(navLi);

    // ── DESKTOP: hover on nav <li> opens L1 panel ──
    let navTimer;
    navLi.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 1023) return;
      clearTimeout(navTimer);
      navLi.classList.add('mm-open');
    });
    navLi.addEventListener('mouseleave', () => {
      if (window.innerWidth <= 1023) return;
      navTimer = setTimeout(() => {
        // If pointer isn't inside the panel, close
        if (!l1Panel.matches(':hover')) navLi.classList.remove('mm-open');
      }, 120);
    });
    l1Panel.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 1023) return;
      clearTimeout(navTimer);
      navLi.classList.add('mm-open');
    });
    l1Panel.addEventListener('mouseleave', () => {
      if (window.innerWidth <= 1023) return;
      navTimer = setTimeout(() => {
        if (!navLi.matches(':hover')) navLi.classList.remove('mm-open');
      }, 120);
    });

    // ── MOBILE: trigger link tap ──
    if (a) {
      a.addEventListener('click', (e) => {
        if (window.innerWidth > 1023) return;
        e.preventDefault();
        e.stopPropagation();
        const open = l1Panel.classList.contains('mob-open');
        l1Panel.classList.toggle('mob-open', !open);
        navLi.classList.toggle('mm-open', !open);
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navLi.contains(e.target)) {
        navLi.classList.remove('mm-open');
        l1Panel.classList.remove('mob-open');
      }
    });

    // Recheck flip on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1023) return;
      l1Panel.querySelectorAll('.mm-l2-panel, .mm-l3-panel').forEach(p => {
        if (p.parentElement.classList.contains('mm-active')) checkFlip(p);
      });
    });
  }

  /* ════════ ACTIVE PAGE HIGHLIGHT ════════ */
  function setActiveNav() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav ul li a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        // Don't remove active from mega-trigger — handled separately
        if (!link.classList.contains('mega-trigger')) {
          link.classList.remove('active');
        }
      }
    });
    // Active on services page: highlight Services trigger
    if (page === 'services.html') {
      document.querySelectorAll('.mega-trigger').forEach(t => t.classList.add('active'));
    }
  }

  /* ════════ ENTRY POINT ════════ */
  function init() {
    document.querySelectorAll('li.has-mega, #servicesMega').forEach(li => {
      initMegaLi(li);
    });
    setActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ═══════════════════════════════════════════════════════════════
   MOBILE SIDE DRAWER v3 — Complete rebuild
   Mirrors desktop nav: Home · About Us · Services (expandable)
   Industries (expandable) · Blog · Contact
   Search bar with live filter across services
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ════ NAV STRUCTURE (exact match to desktop navbar) ════ */
  const NAV_ITEMS = [
    {
      label: 'Home',
      href: 'index.html',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L10 3l7 6.5"/><path d="M5 8v8h4v-4h2v4h4V8"/></svg>`
    },
    {
      label: 'About Us',
      href: 'about.html',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>`
    },
    {
      label: 'Services',
      href: 'services.html',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>`,
      children: [
        {
          label: 'Consulting',
          icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17V7l8-4 8 4v10"/><path d="M9 17v-5h2v5"/></svg>`,
          children: [
            'ISO 9001:2015 — Quality Management',
            'IATF 16949 — Automotive Quality',
            'ISO 14001:2015 — Environment',
            'ISO 45001 — Health & Safety',
            'ISO 27001 — Information Security',
            'ISO 22000 / FSSC 22000 — Food Safety',
            'ISO 50001 — Energy Management',
            'SA 8000 — Social Accountability',
            'ISO 13485 — Medical Devices',
            'ISO 17025 — Testing & Calibration Labs',
            'ISO 22301 — Business Continuity',
            'GMP / cGMP / HACCP',
            'CE Marking & Product Certification',
            'NABL Accreditation',
            'Six Sigma & Business Excellence',
          ]
        },
        {
          label: 'Training',
          icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5l8-3 8 3-8 3-8-3z"/><path d="M18 5v5"/><path d="M6 7.5v4.5c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5V7.5"/></svg>`,
          children: [
            'ISO 9001 Awareness & Internal Auditor',
            'ISO 14001 Environmental Auditor',
            'ISO 45001 OH&S Auditor',
            'IATF 16949 Core Tools (APQP, PPAP, FMEA, SPC, MSA)',
            'ISO 27001 Lead Implementer',
            'Food Safety Management Training',
            'Social Compliance Training',
            'Kaizen & 5S Workplace Training',
            'Total Productive Maintenance (TPM)',
            'SPC / Statistical Process Control',
            'Problem Solving Techniques',
            'Change Management & Leadership',
          ]
        },
        {
          label: 'Auditing & Inspection',
          icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l2 2 4-4"/><rect x="3" y="3" width="14" height="14" rx="2"/></svg>`,
          children: [
            '2nd Party Quality Audits',
            '3rd Party Quality Audits',
            'Social / HSE Audits (BSCI, SEDEX, SMETA)',
            'IS / VAPT Security Audits',
            'Energy & Environmental Audits',
            'Food Safety Audits (BRC, SQF, IFS)',
            'Lab Accreditation Audits (ISO 17025)',
            'SA 8000 Social Compliance Audit',
            'Fire & Safety Inspection',
            'Special Process Audits',
          ]
        }
      ]
    },
    
    {
      label: 'Blog',
      href: 'blog.html',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2.5a2.121 2.121 0 013 3L6 17l-4 1 1-4L14.5 2.5z"/></svg>`
    },
    {
      label: 'Contact',
      href: 'contact.html',
      icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12c1.1 0 2 .9 2 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z"/><polyline points="2,6 10,11 18,6"/></svg>`
    }
  ];

  /* ════ SEARCH DATA — all searchable pages/services ════ */
  const SEARCH_DATA = [
    { title: 'Home', desc: 'The Quality Catalyst — consulting, training, inspection & auditing', href: 'index.html' },
    { title: 'About Us', desc: 'About The Quality Catalyst organization', href: 'about.html' },
    { title: 'Services', desc: 'All consulting, training and auditing services', href: 'services.html' },
    { title: 'Contact Us', desc: 'Get in touch with TQC team', href: 'contact.html' },
    { title: 'ISO 9001:2015', desc: 'Quality Management System consulting', href: 'services.html' },
    { title: 'ISO 14001', desc: 'Environmental Management System', href: 'services.html' },
    { title: 'ISO 45001', desc: 'Occupational Health & Safety Management', href: 'services.html' },
    { title: 'ISO 27001', desc: 'Information Security Management System', href: 'services.html' },
    { title: 'IATF 16949', desc: 'Automotive Quality Management', href: 'services.html' },
    { title: 'SA 8000', desc: 'Social Accountability Standard', href: 'services.html' },
    { title: 'FSSC 22000', desc: 'Food Safety System Certification', href: 'services.html' },
    { title: 'ISO 50001', desc: 'Energy Management System', href: 'services.html' },
    { title: 'HACCP', desc: 'Hazard Analysis Critical Control Points', href: 'services.html' },
    { title: 'ISO 22000', desc: 'Food Safety Management', href: 'services.html' },
    { title: 'CE Marking', desc: 'European Conformity product certification', href: 'services.html' },
    { title: 'ISO 17025', desc: 'Testing and Calibration Laboratories', href: 'services.html' },
    { title: 'NABL Accreditation', desc: 'National Accreditation Board for Testing', href: 'services.html' },
    { title: 'Six Sigma', desc: 'Process improvement and quality methodology', href: 'services.html' },
    { title: 'Kaizen & 5S', desc: 'Lean manufacturing and workplace organization', href: 'services.html' },
    { title: 'VAPT Audit', desc: 'Vulnerability Assessment and Penetration Testing', href: 'services.html' },
    { title: 'BSCI Audit', desc: 'Business Social Compliance Initiative', href: 'services.html' },
    { title: 'Quality Training', desc: 'ISO awareness and internal auditor training', href: 'services.html' },
    { title: 'Manufacturing', desc: 'Services for manufacturing industry', href: 'services.html' },
    { title: 'Automotive Industry', desc: 'Automotive sector quality solutions', href: 'services.html' },
    { title: 'Healthcare & Pharma', desc: 'Healthcare and pharmaceutical compliance', href: 'services.html' }
  ];

  /* ════ HELPERS ════ */
  function mk(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function caretSVG() {
    return `<svg class="dr3-caret-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,6 8,10 12,6"/></svg>`;
  }

  function plusSVG() {
    return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>`;
  }

  function minusSVG() {
    return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="2" y1="8" x2="14" y2="8"/></svg>`;
  }

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  /* ════ BUILD DRAWER NAV ════ */
  function buildDrawer() {
    const nav = document.getElementById('drawerNav');
    if (!nav) return;
    nav.innerHTML = '';
    const page = currentPage();

    NAV_ITEMS.forEach(item => {
      if (item.children) {
        /* ── Expandable item ── */
        const wrapper = mk('div', 'dr3-section');

        const row = mk('div', 'dr3-parent-row' + (page === (item.href || '') ? ' dr3-active' : ''));
        row.setAttribute('role', 'button');
        row.setAttribute('aria-expanded', 'false');

        const rowInner = mk('div', 'dr3-row-inner');
        rowInner.innerHTML = `
          <span class="dr3-icon">${item.icon}</span>
          <span class="dr3-label">${item.label}</span>
        `;
        const toggle = mk('span', 'dr3-toggle');
        toggle.innerHTML = plusSVG();

        row.appendChild(rowInner);
        row.appendChild(toggle);

        /* Sub panel */
        const panel = mk('div', 'dr3-sub-panel');

        /* If Services — 2 levels deep */
        if (item.label === 'Services') {
          /* View All link */
          const viewAll = mk('a', 'dr3-viewall');
          viewAll.href = 'services.html';
          viewAll.innerHTML = `<span>View All Services</span><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><polyline points="3,2 9,6 3,10"/></svg>`;
          viewAll.addEventListener('click', () => closeDrawer());
          panel.appendChild(viewAll);

          item.children.forEach(l1 => {
            const l1Wrap = mk('div', 'dr3-l1-wrap');
            const l1Row = mk('div', 'dr3-l1-row');
            l1Row.setAttribute('role', 'button');

            const l1Inner = mk('div', 'dr3-row-inner');
            l1Inner.innerHTML = `<span class="dr3-icon dr3-icon-sm">${l1.icon}</span><span>${l1.label}</span>`;
            const l1Toggle = mk('span', 'dr3-toggle dr3-toggle-sm');
            l1Toggle.innerHTML = plusSVG();

            l1Row.appendChild(l1Inner);
            l1Row.appendChild(l1Toggle);

            const l1Panel = mk('div', 'dr3-l2-panel');
            l1.children.forEach(std => {
              const li = mk('a', 'dr3-leaf');
              li.href = 'services.html';
              li.textContent = std;
              li.addEventListener('click', () => closeDrawer());
              l1Panel.appendChild(li);
            });

            l1Row.addEventListener('click', function(e) {
              e.stopPropagation();
              const open = l1Row.classList.contains('dr3-expanded');
              /* close siblings */
              panel.querySelectorAll('.dr3-l1-row.dr3-expanded').forEach(r => {
                if (r !== l1Row) {
                  r.classList.remove('dr3-expanded');
                  r.querySelector('.dr3-toggle').innerHTML = plusSVG();
                  r.nextElementSibling && r.nextElementSibling.classList.remove('dr3-open');
                }
              });
              l1Row.classList.toggle('dr3-expanded', !open);
              l1Toggle.innerHTML = open ? plusSVG() : minusSVG();
              l1Panel.classList.toggle('dr3-open', !open);
            });

            l1Wrap.appendChild(l1Row);
            l1Wrap.appendChild(l1Panel);
            panel.appendChild(l1Wrap);
          });

        } else {
          /* Industries — flat list */
          item.children.forEach(child => {
            const li = mk('a', 'dr3-leaf dr3-leaf-l1');
            li.href = item.href || 'services.html';
            li.textContent = child;
            li.addEventListener('click', () => closeDrawer());
            panel.appendChild(li);
          });
        }

        row.addEventListener('click', function(e) {
          e.stopPropagation();
          const open = row.classList.contains('dr3-expanded');
          row.classList.toggle('dr3-expanded', !open);
          row.setAttribute('aria-expanded', String(!open));
          toggle.innerHTML = open ? plusSVG() : minusSVG();
          panel.classList.toggle('dr3-open', !open);
        });

        wrapper.appendChild(row);
        wrapper.appendChild(panel);
        nav.appendChild(wrapper);

      } else {
        /* ── Simple link ── */
        const a = mk('a', 'dr3-link' + (item.href === page ? ' dr3-active' : ''));
        a.href = item.href;
        a.innerHTML = `<span class="dr3-icon">${item.icon}</span><span class="dr3-label">${item.label}</span>`;
        a.addEventListener('click', () => closeDrawer());
        nav.appendChild(a);
      }
    });
  }

  /* ════ SEARCH FUNCTIONALITY ════ */
  function initSearch() {
    const input = document.getElementById('drawerSearchInput');
    const resultsBox = document.getElementById('drawerSearchResults');
    if (!input || !resultsBox) return;

    function doSearch(q) {
      q = q.trim().toLowerCase();
      resultsBox.innerHTML = '';
      if (!q) { resultsBox.style.display = 'none'; return; }

      const matches = SEARCH_DATA.filter(d =>
        d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)
      ).slice(0, 6);

      if (!matches.length) {
        resultsBox.innerHTML = `<div class="dr3-no-result">No results for "<strong>${q}</strong>"</div>`;
        resultsBox.style.display = 'block';
        return;
      }

      matches.forEach(m => {
        const item = mk('a', 'dr3-result-item');
        item.href = m.href;
        item.innerHTML = `
          <span class="dr3-result-title">${m.title}</span>
          <span class="dr3-result-desc">${m.desc}</span>
        `;
        item.addEventListener('click', () => {
          resultsBox.style.display = 'none';
          input.value = '';
          closeDrawer();
        });
        resultsBox.appendChild(item);
      });
      resultsBox.style.display = 'block';
    }

    input.addEventListener('input', () => doSearch(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) { window.location.href = 'services.html?q=' + encodeURIComponent(q); }
      }
      if (e.key === 'Escape') { resultsBox.style.display = 'none'; }
    });

    /* Close results when clicking outside */
    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
        resultsBox.style.display = 'none';
      }
    });
  }

  /* ════ OPEN / CLOSE ════ */
  let _scrollY = 0;

  window.openDrawer = function () {
    buildDrawer();

    const drawer  = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const btn     = document.getElementById('mobMenuBtn');
    if (!drawer || !overlay) return;

    /* iOS scroll lock */
    _scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('drawer-open');

    if (btn) btn.setAttribute('aria-expanded', 'true');

    overlay.style.display = 'block';
    overlay.getBoundingClientRect();
    overlay.classList.add('active');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  };

  window.closeDrawer = function () {
    const drawer  = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const btn     = document.getElementById('mobMenuBtn');
    if (!drawer || !overlay) return;

    drawer.classList.remove('open');
    overlay.classList.remove('active');

    /* Restore iOS scroll position */
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    document.body.classList.remove('drawer-open');
    window.scrollTo(0, _scrollY);

    if (btn) btn.setAttribute('aria-expanded', 'false');
    setTimeout(() => { overlay.style.display = 'none'; }, 360);
    drawer.setAttribute('aria-hidden', 'true');
  };

  /* Wire ESC key to close drawer */
  document.addEventListener('DOMContentLoaded', () => {
    const d = document.getElementById('sideDrawer');
    if (d) d.setAttribute('aria-hidden', 'true');
    initSearch();
  });
  window.handleDrawerSearch = function(e) {
    if (e.key === 'Enter') {
      const input = document.getElementById('drawerSearchInput');
      if (input && input.value.trim()) {
        window.location.href = 'services.html?q=' + encodeURIComponent(input.value.trim());
      }
    }
  };
  window.submitDrawerSearch = function() {
    const input = document.getElementById('drawerSearchInput');
    if (input && input.value.trim()) {
      window.location.href = 'services.html?q=' + encodeURIComponent(input.value.trim());
    }
  };

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1023) closeDrawer(); });

  document.addEventListener('DOMContentLoaded', () => {
    const d = document.getElementById('sideDrawer');
    if (d) d.setAttribute('aria-hidden', 'true');
    initSearch();
  });

})();
