// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Membership system (product concept demo): login state and tier are stored only in
  // the browser's local localStorage — no real account, payment, or backend database.
  // It exists purely to demonstrate the "tiered visibility" product idea.
  const TIER_LEVELS = { free: 0, plus: 1, premium: 2 };
  const TIER_LABELS = { free: 'Free', plus: 'Plus Member', premium: 'Premium Member' };
  function getMember() {
    try {
      return {
        loggedIn: localStorage.getItem('metagyny_logged_in') === 'true',
        name: localStorage.getItem('metagyny_name') || '',
        tier: localStorage.getItem('metagyny_tier') || 'free',
      };
    } catch (e) {
      return { loggedIn: false, name: '', tier: 'free' };
    }
  }
  function setMember(name, tier) {
    try {
      localStorage.setItem('metagyny_logged_in', 'true');
      localStorage.setItem('metagyny_name', name);
      localStorage.setItem('metagyny_tier', tier);
    } catch (e) { /* localStorage unavailable — demo just won't persist */ }
  }
  function clearMember() {
    try {
      localStorage.removeItem('metagyny_logged_in');
      localStorage.removeItem('metagyny_name');
      localStorage.removeItem('metagyny_tier');
    } catch (e) { /* ignore */ }
  }

  // Header nav: login-state chip
  function initMemberBar() {
    const navList = document.querySelector('.main-nav ul');
    if (!navList) return;
    const member = getMember();
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = 'membership.html';
    a.className = 'member-chip' + (member.loggedIn ? ` tier-${member.tier}` : '');
    if (member.loggedIn) {
      a.innerHTML = `<span class="tier-dot"></span>${member.name || 'Member'} · ${TIER_LABELS[member.tier] || ''}`;
    } else {
      a.innerHTML = `<span class="tier-dot"></span>Log In / Membership`;
    }
    li.appendChild(a);
    navList.appendChild(li);
  }

  // Tiered content lock: overlays a blurred lock + upgrade prompt on any [data-min-tier] element
  function initTierGates() {
    const member = getMember();
    const level = TIER_LEVELS[member.tier] ?? 0;
    document.querySelectorAll('[data-min-tier]').forEach((el) => {
      const required = TIER_LEVELS[el.dataset.minTier] ?? 0;
      const locked = level < required;
      el.classList.toggle('tier-locked', locked);
      const existing = el.querySelector(':scope > .tier-lock-overlay');
      if (locked && !existing) {
        const tierName = TIER_LABELS[el.dataset.minTier] || 'Member';
        const overlay = document.createElement('div');
        overlay.className = 'tier-lock-overlay';
        overlay.innerHTML = `<svg class="icon-svg" aria-hidden="true"><use href="../assets/icons.svg#i-lock"></use></svg><span>${tierName} only</span><a href="membership.html" class="btn btn-primary">Upgrade Now</a>`;
        el.appendChild(overlay);
      } else if (!locked && existing) {
        existing.remove();
      }
    });
  }

  initMemberBar();

  // Homepage hero: falling petal decoration
  const petalField = document.getElementById('petal-field');
  if (petalField) {
    const PETAL_COUNT = 16;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      const size = 8 + Math.random() * 10;
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      petal.style.opacity = String(0.35 + Math.random() * 0.35);
      petal.style.animationDuration = `${9 + Math.random() * 8}s, ${3 + Math.random() * 2}s`;
      petal.style.animationDelay = `${Math.random() * -14}s, ${Math.random() * -4}s`;
      petalField.appendChild(petal);
    }
  }

  // Generic category filter (shared by FAQ / Articles / Clinics)
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const filterBtns = group.querySelectorAll('.filter-btn');
    const targetSelector = group.dataset.filterGroup;
    const items = document.querySelectorAll(targetSelector);
    if (!filterBtns.length || !items.length) return;
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.category;
        items.forEach((item) => {
          const match = category === 'all' || item.dataset.category === category;
          item.hidden = !match;
        });
      });
    });
  });

  // Consult form submit (demo only, not actually sent anywhere)
  const consultForm = document.querySelector('.consult-form');
  if (consultForm) {
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const card = consultForm.closest('.form-card');
      if (card) {
        card.classList.add('submitted');
        card.querySelector('.form-success')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Clinics directory: dynamically generate Google Maps / Yelp links per clinic
  // We never scrape or display third-party rating numbers (against Google/Yelp ToS) —
  // only outbound links, so users always see real, live data.
  document.querySelectorAll('.clinic-row').forEach((row) => {
    const nameEl = row.querySelector('.cr-name');
    const locEl = row.querySelector('.cr-location');
    const infoEl = row.querySelector('.cr-info');
    if (!nameEl || !infoEl) return;
    const name = (nameEl.childNodes[0]?.textContent || '').trim();
    if (!name) return;
    const cleanCjk = (s) => s.replace(/[一-鿿]/g, '').replace(/[·（）()]/g, ' ').replace(/\s+/g, ' ').trim();
    const searchName = cleanCjk(name) || name;
    let loc = locEl ? locEl.textContent.trim() : '';
    loc = cleanCjk(loc);
    const mapsQuery = encodeURIComponent(loc ? `${searchName} ${loc}` : `${searchName} USA`);
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
    const yelpUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(searchName)}&find_loc=${encodeURIComponent(loc || 'USA')}`;
    const extDiv = document.createElement('div');
    extDiv.className = 'cr-external';
    extDiv.innerHTML = `<a href="${gmapsUrl}" target="_blank" rel="noopener">Google Reviews ↗</a><a href="${yelpUrl}" target="_blank" rel="noopener">Yelp Reviews ↗</a>`;
    infoEl.appendChild(extDiv);
  });

  // Clinics directory: sort & filter
  const clinicControls = document.querySelector('.clinic-controls');
  if (clinicControls) {
    const filterBtns = clinicControls.querySelectorAll('.chip-filter');
    const sortSelect = document.getElementById('clinic-sort');
    const lists = document.querySelectorAll('.clinic-list');
    const tagMap = { lgbtq: 'LGBTQ+', academic: 'Academic Medical Center', network: 'Network' };

    // Record each row's original order, to restore "default order"; keep 3 free
    // preview clinics per state, the rest are Plus-member only
    lists.forEach((list) => {
      [...list.querySelectorAll('.clinic-row')].forEach((row, idx) => {
        row.dataset.idx = idx;
        if (idx >= 3) row.dataset.minTier = 'plus';
      });
    });

    function applyFilter(filter) {
      document.querySelectorAll('.clinic-row').forEach((row) => {
        let match = true;
        if (filter === 'rated') {
          match = !!row.querySelector('.cr-rating');
        } else if (filter !== 'all') {
          const tagText = tagMap[filter];
          const tags = [...row.querySelectorAll('.cr-tags .tag')].map((t) => t.textContent);
          match = tags.some((t) => t.includes(tagText));
        }
        row.hidden = !match;
      });
    }

    function applySort(mode) {
      lists.forEach((list) => {
        const rows = [...list.querySelectorAll('.clinic-row')];
        rows.sort((a, b) => {
          if (mode === 'score-desc') {
            const scoreA = parseFloat(a.querySelector('.cr-rating .cr-score')?.textContent) || -1;
            const scoreB = parseFloat(b.querySelector('.cr-rating .cr-score')?.textContent) || -1;
            return scoreB - scoreA;
          }
          if (mode === 'name-asc') {
            const nameA = (a.querySelector('.cr-name')?.childNodes[0]?.textContent || '').trim();
            const nameB = (b.querySelector('.cr-name')?.childNodes[0]?.textContent || '').trim();
            return nameA.localeCompare(nameB);
          }
          return Number(a.dataset.idx) - Number(b.dataset.idx);
        });
        rows.forEach((r) => list.appendChild(r));
      });
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilter(btn.dataset.filter);
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', () => applySort(sortSelect.value));
    }
  }

  // Articles: mark some articles as Plus-member exclusive (1 in every 3, to demo tiered content)
  document.querySelectorAll('.article-card').forEach((card, idx) => {
    if (idx % 3 === 2) card.dataset.minTier = 'plus';
  });

  // AI report interpretation (product concept demo)
  // Interpretation logic is based on published general medical reference ranges and runs
  // entirely in the browser against the values a user types in — nothing is uploaded,
  // stored, or sent to an external AI API. For general education only, not a diagnosis.
  const uploadStep = document.getElementById('upload-step');
  const aiLoading = document.getElementById('ai-loading');
  const aiResult = document.getElementById('ai-result');
  if (uploadStep && aiLoading && aiResult) {
    const useSampleBtn = document.getElementById('use-sample-btn');
    const resetBtn = document.getElementById('ai-reset-btn');
    const reportForm = document.getElementById('report-form');
    const loadingStepEl = document.getElementById('ai-loading-step');
    const fileNameEl = document.getElementById('ai-file-name');
    const metricGrid = document.getElementById('metric-grid');
    const narrativeBody = document.getElementById('ai-narrative-body');

    const SAMPLE_VALUES = { amh: 2.1, afc: 12, fsh: 7.8, lh: 5.2, e2: 45, prl: 15, t: 35, p: 0.5 };

    // Reference ranges & interpretation copy (general educational baseline, not a diagnostic
    // standard; ranges vary slightly by lab/hospital)
    const FIELD_DEFS = {
      amh: {
        label: 'AMH (Anti-Müllerian Hormone)', unit: 'ng/mL',
        evaluate: (v) => {
          if (v < 1.0) return { flag: 'watch', flagLabel: 'Low', text: `AMH ${v} ng/mL is on the low side, suggesting ovarian reserve may be below the average for your age group — expect a more conservative egg yield during stimulation.` };
          if (v > 4.0) return { flag: 'watch', flagLabel: 'High', text: `AMH ${v} ng/mL is on the high side, which is common in younger patients or those with PCOS — worth watching for ovarian hyperstimulation risk during stimulation.` };
          return { flag: 'normal', flagLabel: 'Normal range', text: `AMH ${v} ng/mL falls within the typical reference range, suggesting ovarian reserve is roughly normal for now.` };
        },
      },
      afc: {
        label: 'Antral Follicle Count (AFC)', unit: '',
        evaluate: (v) => {
          if (v < 7) return { flag: 'watch', flagLabel: 'Low', text: `An AFC of ${v} is on the low side. Like AMH, it's a key ovarian reserve marker — worth reviewing alongside your AMH result.` };
          if (v > 15) return { flag: 'watch', flagLabel: 'High', text: `An AFC of ${v} is on the high side — worth checking for a polycystic-appearing ovary pattern.` };
          return { flag: 'normal', flagLabel: 'Mid-range', text: `An AFC of ${v} falls within the typical range and is broadly consistent with normal ovarian reserve.` };
        },
      },
      fsh: {
        label: 'FSH (Follicle-Stimulating Hormone)', unit: 'mIU/mL',
        evaluate: (v) => {
          if (v > 15) return { flag: 'watch', flagLabel: 'High', text: `FSH ${v} mIU/mL is on the high side, suggesting ovarian reserve may be somewhat reduced, and the ovarian response to stimulation drugs may be weaker.` };
          if (v > 10) return { flag: 'watch', flagLabel: 'Borderline high', text: `FSH ${v} mIU/mL is borderline high — best reviewed together with AMH and AFC.` };
          return { flag: 'normal', flagLabel: 'Normal range', text: `FSH ${v} mIU/mL is within the normal range, suggesting the pituitary-ovarian signaling baseline is currently normal.` };
        },
      },
      lh: {
        label: 'LH (Luteinizing Hormone)', unit: 'mIU/mL',
        evaluate: (v) => {
          if (v > 12) return { flag: 'watch', flagLabel: 'High', text: `LH ${v} mIU/mL is on the high side — combined with the FSH ratio, it's worth checking for signs associated with PCOS.` };
          if (v < 2) return { flag: 'watch', flagLabel: 'Low', text: `LH ${v} mIU/mL is on the low side — best evaluated alongside your other results.` };
          return { flag: 'normal', flagLabel: 'Normal range', text: `LH ${v} mIU/mL is within the normal range.` };
        },
      },
      e2: {
        label: 'E2 (Estradiol, baseline)', unit: 'pg/mL',
        evaluate: (v) => {
          if (v > 75) return { flag: 'watch', flagLabel: 'High', text: `Baseline E2 of ${v} pg/mL is on the high side, which can indicate an ovarian cyst or early follicle recruitment — this can affect how your FSH result should be read, so it's worth reviewing together with an ultrasound.` };
          return { flag: 'normal', flagLabel: 'Normal range', text: `Baseline E2 of ${v} pg/mL is within the typical range, so it shouldn't interfere with how your FSH result is interpreted.` };
        },
      },
      prl: {
        label: 'PRL (Prolactin)', unit: 'ng/mL',
        evaluate: (v) => {
          if (v > 23.3) return { flag: 'watch', flagLabel: 'High', text: `PRL ${v} ng/mL is on the high side — elevated prolactin can interfere with ovulation, so it's worth having your doctor assess whether further testing is needed.` };
          return { flag: 'normal', flagLabel: 'Normal range', text: `PRL ${v} ng/mL is within the normal range.` };
        },
      },
      t: {
        label: 'Testosterone (T)', unit: 'ng/dL',
        evaluate: (v) => {
          if (v > 70) return { flag: 'watch', flagLabel: 'High', text: `Testosterone ${v} ng/dL is on the high side — worth checking for PCOS or other endocrine factors.` };
          return { flag: 'normal', flagLabel: 'Normal range', text: `Testosterone ${v} ng/dL is within the normal range.` };
        },
      },
      p: {
        label: 'Progesterone (P, baseline)', unit: 'ng/mL',
        evaluate: (v) => {
          if (v >= 1.5) return { flag: 'watch', flagLabel: 'High', text: `Follicular-phase progesterone of ${v} ng/mL is on the high side, which can relate to luteal function or blood-draw timing — best assessed by your doctor together with your cycle day.` };
          return { flag: 'normal', flagLabel: 'Normal range', text: `Follicular-phase progesterone of ${v} ng/mL is within the normal range.` };
        },
      },
    };

    function collectFormValues() {
      const ids = { amh: 'f-amh', afc: 'f-afc', fsh: 'f-fsh', lh: 'f-lh', e2: 'f-e2', prl: 'f-prl', t: 'f-t', p: 'f-p' };
      const values = {};
      Object.keys(ids).forEach((key) => {
        const el = document.getElementById(ids[key]);
        const raw = el ? el.value.trim() : '';
        if (raw !== '') {
          const num = parseFloat(raw);
          if (!Number.isNaN(num)) values[key] = num;
        }
      });
      return values;
    }

    function fillSampleValues() {
      const ids = { amh: 'f-amh', afc: 'f-afc', fsh: 'f-fsh', lh: 'f-lh', e2: 'f-e2', prl: 'f-prl', t: 'f-t', p: 'f-p' };
      Object.keys(SAMPLE_VALUES).forEach((key) => {
        const el = document.getElementById(ids[key]);
        if (el) el.value = SAMPLE_VALUES[key];
      });
    }

    function renderResult(values, sourceLabel) {
      const results = Object.keys(values)
        .filter((key) => FIELD_DEFS[key])
        .map((key) => {
          const def = FIELD_DEFS[key];
          const v = values[key];
          const evalResult = def.evaluate(v);
          return { key, label: def.label, unit: def.unit, value: v, ...evalResult };
        });

      // Metric cards
      metricGrid.innerHTML = results.map((r) => `
        <div class="metric-cell">
          <div class="metric-label">${r.label}</div>
          <div class="metric-value">${r.value}<span class="metric-unit">${r.unit}</span></div>
          <span class="metric-flag ${r.flag}">${r.flagLabel}</span>
        </div>
      `).join('');

      // Narrative text (the per-value breakdown is Plus-member only; free users see the
      // metric cards and the overall summary line, but not the detailed read on each value)
      const watchItems = results.filter((r) => r.flag === 'watch');
      const normalItems = results.filter((r) => r.flag === 'normal');
      const member = getMember();
      const memberLevel = TIER_LEVELS[member.tier] ?? 0;
      let paragraphs = [];
      if (results.length === 0) {
        paragraphs.push('<p>You haven\'t entered any values yet — try filling in one or two, or click "Use sample values" to see how it works.</p>');
      } else {
        if (watchItems.length === 0) {
          paragraphs.push(`<p><strong>Overall:</strong> all ${results.length} of the values you entered fall within the typical reference range, with no clear flags.</p>`);
        } else {
          paragraphs.push(`<p><strong>Overall:</strong> of the ${results.length} values you entered, ${normalItems.length} are within the typical range, and ${watchItems.length} are worth a closer look:</p>`);
        }
        if (memberLevel >= TIER_LEVELS.plus) {
          results.forEach((r) => {
            paragraphs.push(`<p>${r.text}</p>`);
          });
          paragraphs.push('<p><strong>Reminder:</strong> this compares each value to a general reference range only. The real clinical picture depends on your age, medical history, cycle day and more — please don\'t draw conclusions from this interpretation alone; discuss it with your doctor.</p>');
        } else {
          paragraphs.push(`<div class="tier-lock-inline"><svg class="icon-svg" aria-hidden="true" style="width:22px;height:22px;color:var(--color-primary-dark);"><use href="../assets/icons.svg#i-lock"></use></svg><p>The detailed, value-by-value interpretation is a <strong>Plus member</strong> feature. Upgrade to see what each individual result means and what to watch for.</p><a class="btn btn-primary" href="membership.html">Upgrade to See the Full Interpretation</a></div>`);
        }
      }
      narrativeBody.innerHTML = paragraphs.join('');
      if (fileNameEl) fileNameEl.textContent = sourceLabel;
    }

    function runInterpretation(values, sourceLabel) {
      uploadStep.style.display = 'none';
      aiResult.style.display = 'none';
      aiLoading.style.display = 'block';

      const loadingSteps = ['Comparing against reference ranges…', 'Generating plain-language summary…'];
      let stepIndex = 0;
      loadingStepEl.textContent = loadingSteps[0];
      const stepTimer = setInterval(() => {
        stepIndex += 1;
        if (stepIndex < loadingSteps.length) loadingStepEl.textContent = loadingSteps[stepIndex];
      }, 600);

      setTimeout(() => {
        clearInterval(stepTimer);
        aiLoading.style.display = 'none';
        renderResult(values, sourceLabel);
        aiResult.style.display = 'block';
        aiResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1300);
    }

    if (reportForm) {
      reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const values = collectFormValues();
        runInterpretation(values, 'Generated from the values you entered');
      });
    }
    if (useSampleBtn) {
      useSampleBtn.addEventListener('click', () => {
        fillSampleValues();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        aiResult.style.display = 'none';
        uploadStep.style.display = 'block';
        if (reportForm) reportForm.reset();
        uploadStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  // Glossary search
  const searchInput = document.getElementById('glossary-search');
  if (searchInput) {
    const terms = document.querySelectorAll('.term');
    const groups = document.querySelectorAll('.glossary-group');
    const emptyState = document.querySelector('.glossary-empty');
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      let anyVisible = false;
      groups.forEach((group) => {
        let groupHasVisible = false;
        group.querySelectorAll('.term').forEach((term) => {
          const text = term.textContent.toLowerCase();
          const match = text.includes(q);
          term.hidden = !match;
          if (match) { groupHasVisible = true; anyVisible = true; }
        });
        group.hidden = !groupHasVisible;
      });
      if (emptyState) emptyState.style.display = anyVisible ? 'none' : 'block';
    });
  }

  // Membership page: demo login / logout (local simulation, no real account system)
  const memberForm = document.getElementById('member-login-form');
  const memberStatusEl = document.getElementById('member-status');
  function renderMemberStatus() {
    const member = getMember();
    if (!memberStatusEl) return;
    if (member.loggedIn) {
      memberStatusEl.hidden = false;
      if (memberForm) memberForm.hidden = true;
      memberStatusEl.innerHTML = `
        <span class="avatar-initial">${(member.name || 'M').slice(0, 1)}</span>
        <div><strong>${member.name || 'Guest'}</strong><span>Current tier: ${TIER_LABELS[member.tier] || ''}</span></div>
        <button type="button" class="btn btn-outline" id="member-logout-btn">Log Out</button>
      `;
      const btn = memberStatusEl.querySelector('#member-logout-btn');
      if (btn) btn.addEventListener('click', () => {
        clearMember();
        location.reload();
      });
    } else {
      memberStatusEl.hidden = true;
      if (memberForm) memberForm.hidden = false;
    }
  }
  if (memberForm) {
    renderMemberStatus();
    memberForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('member-name');
      const tierInput = memberForm.querySelector('input[name="member-tier"]:checked');
      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Demo User';
      const tier = tierInput ? tierInput.value : 'free';
      setMember(name, tier);
      renderMemberStatus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  document.querySelectorAll('[data-select-tier]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = btn.dataset.selectTier;
      const tierRadio = document.querySelector(`input[name="member-tier"][value="${tier}"]`);
      if (tierRadio) tierRadio.checked = true;
      const nameInput = document.getElementById('member-name');
      if (nameInput) nameInput.focus();
      document.getElementById('member-login-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // Apply lock overlays once every tiered element has been tagged
  initTierGates();
});
