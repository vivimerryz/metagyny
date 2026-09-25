// 移动端导航开关
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

  // 会员体系（产品概念演示）：登录状态与等级仅保存在浏览器本地 localStorage，
  // 不涉及真实账号、支付或后端数据库，仅用于演示"分级可见"的产品思路。
  const TIER_LEVELS = { free: 0, plus: 1, premium: 2 };
  const TIER_LABELS = { free: '免费用户', plus: '进阶会员', premium: '尊享会员' };
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
    } catch (e) { /* localStorage 不可用时静默忽略，仅演示效果受限 */ }
  }
  function clearMember() {
    try {
      localStorage.removeItem('metagyny_logged_in');
      localStorage.removeItem('metagyny_name');
      localStorage.removeItem('metagyny_tier');
    } catch (e) { /* ignore */ }
  }

  // 顶部导航：登录状态徽标
  function initMemberBar() {
    const navList = document.querySelector('.main-nav ul');
    if (!navList) return;
    const member = getMember();
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = 'membership.html';
    a.className = 'member-chip' + (member.loggedIn ? ` tier-${member.tier}` : '');
    if (member.loggedIn) {
      a.innerHTML = `<span class="tier-dot"></span>${member.name || '会员'} · ${TIER_LABELS[member.tier] || ''}`;
    } else {
      a.innerHTML = `<span class="tier-dot"></span>登录 / 会员中心`;
    }
    li.appendChild(a);
    navList.appendChild(li);
  }

  // 分级内容锁：为带 data-min-tier 的元素叠加模糊遮罩与升级引导
  function initTierGates() {
    const member = getMember();
    const level = TIER_LEVELS[member.tier] ?? 0;
    document.querySelectorAll('[data-min-tier]').forEach((el) => {
      const required = TIER_LEVELS[el.dataset.minTier] ?? 0;
      const locked = level < required;
      el.classList.toggle('tier-locked', locked);
      const existing = el.querySelector(':scope > .tier-lock-overlay');
      if (locked && !existing) {
        const tierName = TIER_LABELS[el.dataset.minTier] || '会员';
        const overlay = document.createElement('div');
        overlay.className = 'tier-lock-overlay';
        overlay.innerHTML = `<svg class="icon-svg" aria-hidden="true"><use href="assets/icons.svg#i-lock"></use></svg><span>${tierName}可见</span><a href="membership.html" class="btn btn-primary">立即升级</a>`;
        el.appendChild(overlay);
      } else if (!locked && existing) {
        existing.remove();
      }
    });
  }

  initMemberBar();

  // 首页 Hero：飘落花瓣装饰动画
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

  // 通用分类筛选（FAQ / 资讯 / 机构库 共用）
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

  // 咨询表单提交（演示用，不会真实发送）
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

  // 机构库：为每家机构动态生成 Google 地图 / Yelp 评价跳转链接
  // 不抓取/展示第三方评分数字（Google、Yelp 服务条款禁止抓取），只做跳转，保证用户看到的是实时真实数据
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
    extDiv.innerHTML = `<a href="${gmapsUrl}" target="_blank" rel="noopener">Google 评价 ↗</a><a href="${yelpUrl}" target="_blank" rel="noopener">Yelp 评价 ↗</a>`;
    infoEl.appendChild(extDiv);
  });

  // 机构库：排序与筛选
  const clinicControls = document.querySelector('.clinic-controls');
  if (clinicControls) {
    const filterBtns = clinicControls.querySelectorAll('.chip-filter');
    const sortSelect = document.getElementById('clinic-sort');
    const lists = document.querySelectorAll('.clinic-list');
    const tagMap = { lgbtq: 'LGBTQ+', academic: '学术医疗中心', network: '网络' };

    // 记录每行原始顺序，供"默认顺序"还原；每个州保留 3 家免费预览，其余为进阶会员可见
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

  // 资讯中心：将部分文章标记为进阶会员专享（每 3 篇锁 1 篇，用于演示分级内容）
  document.querySelectorAll('.article-card').forEach((card, idx) => {
    if (idx % 3 === 2) card.dataset.minTier = 'plus';
  });

  // AI 报告解读（产品概念演示）
  // 解读逻辑基于公开的通用医学参考区间，在浏览器本地对用户填写的数值做规则判断——
  // 不上传、不存储任何数据，也不调用外部 AI 接口。仅作"读懂数值"的科普用途，不构成诊断。
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

    // 参考区间与解读文案（通用科普口径，非诊断标准；不同医院/检测设备略有差异）
    const FIELD_DEFS = {
      amh: {
        label: 'AMH 抗缪勒管激素', unit: 'ng/mL',
        evaluate: (v) => {
          if (v < 1.0) return { flag: 'watch', flagLabel: '偏低', text: `AMH ${v} ng/mL 偏低，提示卵巢储备可能低于同龄平均水平，促排时卵子数量预期会相对保守。` };
          if (v > 4.0) return { flag: 'watch', flagLabel: '偏高', text: `AMH ${v} ng/mL 偏高，年轻女性或多囊卵巢综合征（PCOS）人群中较常见，促排时需关注卵巢过度刺激风险。` };
          return { flag: 'normal', flagLabel: '正常范围', text: `AMH ${v} ng/mL 处于常见参考范围内，提示当前卵巢储备大致正常。` };
        },
      },
      afc: {
        label: '基础窦卵泡数（AFC）', unit: '个',
        evaluate: (v) => {
          if (v < 7) return { flag: 'watch', flagLabel: '偏少', text: `窦卵泡数 ${v} 个偏少，与 AMH 一样是评估卵巢储备的重要指标，建议结合 AMH 一起看。` };
          if (v > 15) return { flag: 'watch', flagLabel: '偏多', text: `窦卵泡数 ${v} 个偏多，需关注是否存在多囊样卵巢表现。` };
          return { flag: 'normal', flagLabel: '中等水平', text: `窦卵泡数 ${v} 个处于常见范围，与卵巢储备评估大致吻合。` };
        },
      },
      fsh: {
        label: 'FSH 卵泡刺激素', unit: 'mIU/mL',
        evaluate: (v) => {
          if (v > 15) return { flag: 'watch', flagLabel: '偏高', text: `FSH ${v} mIU/mL 偏高，提示卵巢储备可能有所下降，卵巢对促排药物的反应可能减弱。` };
          if (v > 10) return { flag: 'watch', flagLabel: '临界偏高', text: `FSH ${v} mIU/mL 处于临界偏高区间，建议结合 AMH、AFC 一起综合判断。` };
          return { flag: 'normal', flagLabel: '正常范围', text: `FSH ${v} mIU/mL 处于正常范围，说明脑垂体调控卵巢的基础信号目前正常。` };
        },
      },
      lh: {
        label: 'LH 黄体生成素', unit: 'mIU/mL',
        evaluate: (v) => {
          if (v > 12) return { flag: 'watch', flagLabel: '偏高', text: `LH ${v} mIU/mL 偏高，结合 FSH 比值需关注是否存在多囊卵巢综合征相关表现。` };
          if (v < 2) return { flag: 'watch', flagLabel: '偏低', text: `LH ${v} mIU/mL 偏低，建议结合其他指标一并评估。` };
          return { flag: 'normal', flagLabel: '正常范围', text: `LH ${v} mIU/mL 处于正常范围内。` };
        },
      },
      e2: {
        label: 'E2 雌二醇（基础值）', unit: 'pg/mL',
        evaluate: (v) => {
          if (v > 75) return { flag: 'watch', flagLabel: '偏高', text: `E2 基础值 ${v} pg/mL 偏高，可能存在卵巢囊肿或卵泡提前募集，会影响 FSH 数值的准确解读，建议结合超声一起看。` };
          return { flag: 'normal', flagLabel: '正常范围', text: `E2 基础值 ${v} pg/mL 处于常见范围，FSH 数值的参考意义不会受到干扰。` };
        },
      },
      prl: {
        label: 'PRL 泌乳素', unit: 'ng/mL',
        evaluate: (v) => {
          if (v > 23.3) return { flag: 'watch', flagLabel: '偏高', text: `PRL ${v} ng/mL 偏高，泌乳素升高可能影响排卵，建议医生评估是否需要进一步检查。` };
          return { flag: 'normal', flagLabel: '正常范围', text: `PRL ${v} ng/mL 处于正常范围内。` };
        },
      },
      t: {
        label: 'T 睾酮', unit: 'ng/dL',
        evaluate: (v) => {
          if (v > 70) return { flag: 'watch', flagLabel: '偏高', text: `睾酮 ${v} ng/dL 偏高，需关注是否存在多囊卵巢综合征或其他内分泌因素。` };
          return { flag: 'normal', flagLabel: '正常范围', text: `睾酮 ${v} ng/dL 处于正常范围内。` };
        },
      },
      p: {
        label: 'P 孕酮（基础值）', unit: 'ng/mL',
        evaluate: (v) => {
          if (v >= 1.5) return { flag: 'watch', flagLabel: '偏高', text: `卵泡期孕酮 ${v} ng/mL 偏高，可能与黄体功能或采血时机有关，建议医生结合周期天数判断。` };
          return { flag: 'normal', flagLabel: '正常范围', text: `卵泡期孕酮 ${v} ng/mL 处于正常范围内。` };
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

      // 指标卡片
      metricGrid.innerHTML = results.map((r) => `
        <div class="metric-cell">
          <div class="metric-label">${r.label}</div>
          <div class="metric-value">${r.value}<span class="metric-unit">${r.unit}</span></div>
          <span class="metric-flag ${r.flag}">${r.flagLabel}</span>
        </div>
      `).join('');

      // 解读文字（逐项解读为进阶会员专享，免费用户可见指标卡片与总体结论，看不到逐项细读）
      const watchItems = results.filter((r) => r.flag === 'watch');
      const normalItems = results.filter((r) => r.flag === 'normal');
      const member = getMember();
      const memberLevel = TIER_LEVELS[member.tier] ?? 0;
      let paragraphs = [];
      if (results.length === 0) {
        paragraphs.push('<p>还没有填写任何数值，先填一两项试试，或点击"填入示例数值体验效果"。</p>');
      } else {
        if (watchItems.length === 0) {
          paragraphs.push(`<p><strong>总体来看：</strong>您填写的 ${results.length} 项指标均处于常见参考范围内，没有显示明显异常信号。</p>`);
        } else {
          paragraphs.push(`<p><strong>总体来看：</strong>您填写的 ${results.length} 项指标中，${normalItems.length} 项处于常见范围，${watchItems.length} 项建议进一步关注：</p>`);
        }
        if (memberLevel >= TIER_LEVELS.plus) {
          results.forEach((r) => {
            paragraphs.push(`<p>${r.text}</p>`);
          });
          paragraphs.push('<p><strong>提醒：</strong>以上仅基于单项数值与通用参考区间对比，实际临床意义需要医生结合您的年龄、病史、周期天数等综合判断，不能仅凭这份解读自行下结论。</p>');
        } else {
          paragraphs.push(`<div class="tier-lock-inline"><svg class="icon-svg" aria-hidden="true" style="width:22px;height:22px;color:var(--color-primary-dark);"><use href="assets/icons.svg#i-lock"></use></svg><p>逐项指标的详细解读为<strong>进阶会员</strong>专享内容，升级后可查看每一项数值的具体含义与关注建议。</p><a class="btn btn-primary" href="membership.html">升级查看完整解读</a></div>`);
        }
      }
      narrativeBody.innerHTML = paragraphs.join('');
      if (fileNameEl) fileNameEl.textContent = sourceLabel;
    }

    function runInterpretation(values, sourceLabel) {
      uploadStep.style.display = 'none';
      aiResult.style.display = 'none';
      aiLoading.style.display = 'block';

      const loadingSteps = ['正在比对参考区间…', '正在生成通俗解读…'];
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
        runInterpretation(values, '基于您填写的数值生成');
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

  // 术语词典搜索
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

  // 会员中心页：演示登录 / 退出（本地模拟，无真实账号系统）
  const memberForm = document.getElementById('member-login-form');
  const memberStatusEl = document.getElementById('member-status');
  const memberLogoutBtn = document.getElementById('member-logout-btn');
  function renderMemberStatus() {
    const member = getMember();
    if (!memberStatusEl) return;
    if (member.loggedIn) {
      memberStatusEl.hidden = false;
      if (memberForm) memberForm.hidden = true;
      memberStatusEl.innerHTML = `
        <span class="avatar-initial">${(member.name || '会').slice(0, 1)}</span>
        <div><strong>${member.name || '匿名用户'}</strong><span>当前身份：${TIER_LABELS[member.tier] || ''}</span></div>
        <button type="button" class="btn btn-outline" id="member-logout-btn">退出登录</button>
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
      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '演示用户';
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

  // 所有分级内容标记完成后，统一应用锁定遮罩
  initTierGates();
});
