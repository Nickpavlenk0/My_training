// Kolya Training Diary — Variant A (localStorage only)
(() => {
  const KEY = 'kolyaTrainingV1';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ========== State ==========
  const state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { profile: defaultProfile(), sessions: [], templates: defaultTemplates() };
      const parsed = JSON.parse(raw);
      if (!parsed.profile) parsed.profile = defaultProfile();
      if (!parsed.templates) parsed.templates = defaultTemplates();
      if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
      return parsed;
    } catch (e) {
      console.error('loadState error', e);
      return { profile: defaultProfile(), sessions: [], templates: defaultTemplates() };
    }
  }
  function saveState() { localStorage.setItem(KEY, JSON.stringify(state)); }

  function defaultProfile() {
    return { name: 'Коля', goal: 'Сила + выносливость + Антибока', gear: 'Гиря 16 кг; гантель 10 кг; резинки; ролик; стул/диван' };
  }

  function defaultTemplates() {
    return [
      {
        id: 'd1', title: 'День 1 — Плечи/Руки/Пресс',
        items: [
          { name: 'Стойка у стены (изометрия)', muscles: 'плечи/кор', plan: '3×30с' },
          { name: 'Жим гири стоя (поочерёдно)', muscles: 'дельты/трицепс', plan: '3×8 на руку' },
          { name: 'Отжимания в треугольнике', muscles: 'трицепс/грудь', plan: '3×6–10' },
          { name: 'Сгибания с резинкой (21 метод)', muscles: 'бицепс', plan: '3×21' },
          { name: 'Французский жим с гирей', muscles: 'трицепс', plan: '3×10–12' },
          { name: 'Планка-дельфин', muscles: 'пресс/плечи', plan: '3×8–12' }
        ]
      },
      {
        id: 'd2', title: 'День 2 — Ноги/Ягодицы/Кор',
        items: [
          { name: 'Гоблет-присед (3-1-1)', muscles: 'квадрицепсы/ягодицы', plan: '3×10–12' },
          { name: 'Выпад назад с гантелью', muscles: 'квадрицепс/ягодицы', plan: '3×10 на ногу' },
          { name: 'Румынская тяга с гирей', muscles: 'бицепс бедра/ягодицы', plan: '3×10' },
          { name: 'Краб с резинкой', muscles: 'средняя ягодичная', plan: '3×12+12 шагов' },
          { name: 'Скользящие сгибания ног', muscles: 'бицепс бедра', plan: '3×10–12' },
          { name: 'Ролик для пресса', muscles: 'пресс/плечи', plan: '3×8–10' }
        ]
      },
      {
        id: 'd3', title: 'День 3 — Грудь/Спина/Пресс',
        items: [
          { name: 'Отжимания на диване (пауза)', muscles: 'грудь/трицепс', plan: '3×8–10' },
          { name: 'Тяга гири в наклоне', muscles: 'широчайшие/ромбовидные', plan: '3×10 на руку' },
          { name: 'Пуловер с гантелью', muscles: 'верх груди/латы', plan: '3×12' },
          { name: 'Тяга резинки сидя (через стопы)', muscles: 'спина', plan: '3×15' },
          { name: 'Разведения с резинкой в наклоне', muscles: 'задняя дельта', plan: '3×12–15' },
          { name: 'Ролик для пресса (пауза)', muscles: 'пресс', plan: '3×8–10' }
        ]
      }
    ];
  }

  // ========== Tabs ==========
  const panels = {
    today: $('#tab-today'),
    history: $('#tab-history'),
    templates: $('#tab-templates'),
    settings: $('#tab-settings')
  };

  $$('.wrap nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.wrap nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.values(panels).forEach(p => p.classList.add('hidden'));
      const tab = btn.dataset.tab;
      panels[tab].classList.remove('hidden');
      if (tab === 'history') renderHistory();
      if (tab === 'templates') renderTemplates();
      if (tab === 'settings') renderSettings();
    });
  });

  // ========== Today ==========
  const dateInput = $('#dateInput');
  const dayType = $('#dayType');
  const sessionNote = $('#sessionNote');
  const exTableBody = $('#exTable tbody');
  const reportText = $('#reportText');

  // init date
  try { dateInput.valueAsDate = new Date(); } catch(e){ /* Safari fallback */ }

  $('#addRowBtn').addEventListener('click', () => addRow());
  $('#loadTemplateBtn').addEventListener('click', () => {
    const t = state.templates.find(t => t.title.startsWith(dayType.value));
    if (!t) return alert('Нет шаблона для выбранного дня. Открой вкладку “Шаблоны” и добавь.');
    exTableBody.innerHTML = '';
    t.items.forEach(it => addRow(it.name, it.muscles, it.plan, '', '', ''));
  });
  $('#bulkAddBtn').addEventListener('click', () => {
    const txt = ($('#bulkText').value || '').trim();
    if (!txt) return;
    txt.split(/\n+/).forEach(line => {
      const parts = line.split('—').map(s => s.trim());
      if (parts.length >= 2) addRow(parts[0], parts[1], parts[2] || '', '', '', '');
    });
    $('#bulkText').value = '';
  });

  function addRow(name = '', muscles = '', plan = '', fact = '', rpe = '', note = '') {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${escapeHtml(name)}" placeholder="Название"></td>
      <td><input value="${escapeHtml(muscles)}" placeholder="Мышцы"></td>
      <td><input value="${escapeHtml(plan)}" placeholder="напр. 3×10 / 30с"></td>
      <td><input value="${escapeHtml(fact)}" placeholder="Факт (напр. 3×8)"></td>
      <td><input value="${escapeHtml(rpe)}" placeholder="RPE 1–10"></td>
      <td><input value="${escapeHtml(note)}" placeholder="Заметка"></td>
      <td><button class="btn ghost del">×</button></td>`;
    tr.querySelector('.del').addEventListener('click', () => tr.remove());
    exTableBody.appendChild(tr);
  }

  $('#saveBtn').addEventListener('click', () => {
    const session = collectSession();
    state.sessions = state.sessions.filter(s => !(s.date === session.date && s.dayType === session.dayType));
    state.sessions.push(session);
    state.sessions.sort((a, b) => a.date.localeCompare(b.date));
    saveState();
    alert('Сохранено ✅');
  });

  $('#exportTodayBtn').addEventListener('click', () => {
    const session = collectSession();
    download(`session_${session.date}.json`, JSON.stringify(session, null, 2));
  });

  $('#copySummaryBtn').addEventListener('click', () => {
    const s = collectSession();
    const lines = [];
    lines.push(`Дата: ${s.date} — ${s.dayType}`);
    if (s.note) lines.push(`Самочувствие: ${s.note}`);
    lines.push('Упражнения:');
    s.exercises.forEach(ex => {
      lines.push(`• ${ex.name} — план: ${ex.plan || '—'}; факт: ${ex.fact || '—'}${ex.rpe ? `; RPE: ${ex.rpe}` : ''}${ex.note ? `; заметка: ${ex.note}` : ''}`);
    });
    if (s.report) lines.push(`Отчёт: ${s.report}`);
    navigator.clipboard.writeText(lines.join('\n')).then(() => alert('Отчёт скопирован в буфер обмена ✅'))
      .catch(() => alert('Не удалось скопировать отчёт'));
  });

  function collectSession() {
    const rows = $$('#exTable tbody tr');
    const exercises = rows.map(r => {
      const inputs = r.querySelectorAll('input');
      const [n, m, p, f, rpe, note] = inputs;
      return { name: n.value.trim(), muscles: m.value.trim(), plan: p.value.trim(), fact: f.value.trim(), rpe: rpe.value.trim(), note: note.value.trim() };
    }).filter(x => x.name || x.plan || x.fact);
    const date = dateInput.value || new Date().toISOString().slice(0, 10);
    return { id: `${date}_${dayType.value}`.replace(/\s+/g, '_'), date, dayType: dayType.value, note: sessionNote.value.trim(), exercises, report: reportText.value.trim() };
  }

  function escapeHtml(s = '') { return s.replace(/[&<>\"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[m])); }

  // ========== History ==========
  const historyTbody = $('#historyTable tbody');
  const fromDate = $('#fromDate');
  const toDate = $('#toDate');
  const filterDay = $('#filterDay');

  $('#refreshHistory').addEventListener('click', renderHistory);
  $('#exportRangeJson').addEventListener('click', () => {
    const arr = filteredSessions();
    download(`sessions_${fromDate.value || 'all'}_${toDate.value || 'all'}.json`, JSON.stringify(arr, null, 2));
  });
  $('#exportRangeCsv').addEventListener('click', () => {
    const arr = filteredSessions();
    const rows = [['date', 'day', 'exercise', 'plan', 'fact', 'rpe', 'note']];
    arr.forEach(s => {
      s.exercises.forEach(e => rows.push([s.date, s.dayType, e.name, e.plan || '', e.fact || '', e.rpe || '', e.note || '']));
    });
    const csv = rows.map(r => r.map(x => `"${(x || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    download(`sessions_${fromDate.value || 'all'}_${toDate.value || 'all'}.csv`, csv);
  });

  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) return alert('Ожидался массив сессий (JSON).');
        const map = new Map(state.sessions.map(s => [s.id, s]));
        arr.forEach(s => map.set(s.id, s));
        state.sessions = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
        saveState();
        renderHistory();
        alert('Импортировано ✅');
      } catch (err) {
        alert('Ошибка чтения файла');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  function filteredSessions() {
    const fd = fromDate.value ? new Date(fromDate.value) : null;
    const td = toDate.value ? new Date(toDate.value) : null;
    return state.sessions.filter(s => {
      const d = new Date(s.date);
      if (fd && d < fd) return false;
      if (td && d > td) return false;
      if (filterDay.value && s.dayType !== filterDay.value) return false;
      return true;
    });
  }

  function renderHistory() {
    // default: last 30 days
    if (!fromDate.value && !toDate.value) {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 30);
      try { fromDate.valueAsDate = start; toDate.valueAsDate = d; } catch(e){}
    }
    const arr = filteredSessions();
    historyTbody.innerHTML = '';
    let totalSets = 0, rpeSum = 0, rpeCnt = 0;
    arr.forEach(s => {
      const sets = s.exercises.reduce((acc, e) => {
        const m = /([0-9]+)\s*×\s*([0-9]+)/i.exec(e.fact || e.plan || '');
        return acc + (m ? parseInt(m[1], 10) : 0);
      }, 0);
      totalSets += sets;
      s.exercises.forEach(e => { const r = parseFloat(e.rpe); if (!isNaN(r)) { rpeSum += r; rpeCnt++; } });
      const tr = document.createElement('tr');
      const list = s.exercises.slice(0, 4).map(e => `${e.name}${e.fact ? ` <span class="pill">${e.fact}</span>` : ''}`).join('<br>');
      tr.innerHTML = `
        <td>${s.date}</td>
        <td>${s.dayType}</td>
        <td>${list}${s.exercises.length > 4 ? `<div class='muted small'>…и ещё ${s.exercises.length - 4}</div>` : ''}</td>
        <td>${sets}</td>
        <td>${rpeCnt ? (rpeSum / rpeCnt).toFixed(1) : '—'}</td>
        <td class="right">
          <button class="btn ghost" data-view="${s.id}">Открыть</button>
          <button class="btn bad" data-del="${s.id}">Удалить</button>
        </td>`;
      historyTbody.appendChild(tr);
    });
    $('#kpiSessions').textContent = arr.length;
    $('#kpiSets').textContent = totalSets;
    $('#kpiRpe').textContent = rpeCnt ? (rpeSum / rpeCnt).toFixed(1) : '—';

    $$('#historyTable [data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = state.sessions.find(x => x.id === btn.dataset.view);
        if (!s) return;
        // load into Today
        $$('.wrap nav button').find(b => b.dataset.tab === 'today')?.click();
        dateInput.value = s.date; dayType.value = s.dayType; sessionNote.value = s.note || ''; reportText.value = s.report || '';
        exTableBody.innerHTML = '';
        s.exercises.forEach(e => addRow(e.name, e.muscles, e.plan, e.fact, e.rpe, e.note));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    $$('#historyTable [data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Удалить эту сессию?')) return;
        state.sessions = state.sessions.filter(s => s.id !== btn.dataset.del);
        saveState();
        renderHistory();
      });
    });
  }

  // ========== Templates ==========
  const templatesGrid = $('#templatesGrid');
  function renderTemplates() {
    templatesGrid.innerHTML = '';
    state.templates.forEach(t => {
      const card = document.createElement('div');
      card.className = 'kpi';
      card.innerHTML = `
        <div class="tag">Шаблон</div>
        <h3 style="font-size:16px;margin:4px 0 8px 0">${t.title}</h3>
        <div class="small muted">${t.items.map(i => `${i.name} <span class='pill'>${i.plan}</span>`).join('<br>')}</div>
        <div class="right" style="margin-top:10px">
          <button class="btn" data-load="${t.id}">Загрузить в Сегодня</button>
          <button class="btn ghost" data-edit="${t.id}">Редактировать</button>
        </div>`;
      templatesGrid.appendChild(card);
    });
    $$('#templatesGrid [data-load]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = state.templates.find(x => x.id === btn.dataset.load);
        if (!t) return;
        $$('.wrap nav button').find(b => b.dataset.tab === 'today')?.click();
        exTableBody.innerHTML = '';
        dayType.value = t.title.split(' — ')[0];
        t.items.forEach(it => addRow(it.name, it.muscles, it.plan));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    $$('#templatesGrid [data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = state.templates.find(x => x.id === btn.dataset.edit);
        if (!t) return;
        const txt = prompt('Редактируй шаблон в формате: Название — мышцы — план (по одной строке)',
          t.items.map(i => `${i.name} — ${i.muscles} — ${i.plan}`).join('\n'));
        if (txt === null) return;
        const items = [];
        txt.split(/\n+/).forEach(line => {
          const [name, muscles, plan] = line.split('—').map(s => s && s.trim());
          if (name) items.push({ name, muscles: muscles || '', plan: plan || '' });
        });
        t.items = items; saveState(); renderTemplates();
      });
    });
  }

  // ========== Settings ==========
  const nameInput = $('#nameInput');
  const goalInput = $('#goalInput');
  const gearInput = $('#gearInput');
  function renderSettings() {
    nameInput.value = state.profile.name || '';
    goalInput.value = state.profile.goal || '';
    gearInput.value = state.profile.gear || '';
  }
  $('#saveProfile').addEventListener('click', () => {
    state.profile.name = nameInput.value.trim();
    state.profile.goal = goalInput.value.trim();
    state.profile.gear = gearInput.value.trim();
    saveState();
    alert('Профиль сохранён ✅');
  });
  $('#wipeAll').addEventListener('click', () => {
    if (!confirm('Стереть все данные в этом браузере? Это действие нельзя отменить.')) return;
    localStorage.removeItem(KEY); location.reload();
  });

  // ========== Utils ==========
  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename; a.click(); URL.revokeObjectURL(a.href);
  }

})();