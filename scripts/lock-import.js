/* scripts/lock-import.js
   Добавляет:
   - 🔒 Режим занятия (редактируются только Факт/RPE/Заметка)
   - Многострочный просмотр текста в таблицах
   - Быстрый ввод плана из чата
   Работает поверх существующей разметки. Ничего в других файлах менять не нужно.
*/

(function () {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ---- ВСТАВКА НЕОБХОДИМОГО CSS ----
  (function injectCSS(){
    const css = `
    /* Читаемый многострочный слой поверх полей */
    table[data-sec] td{ position: relative; vertical-align: top; }
    table[data-sec] td .cell-view{
      position:relative; display:block; width:100%;
      padding:10px 12px; border-radius:10px;
      background: var(--panel, #0f141d); border:1px solid #22314a;
      color:#dbe9ff; min-height:42px; line-height:1.35;
      white-space: normal; overflow-wrap: anywhere;
    }
    table[data-sec] td input, table[data-sec] td textarea{
      position:absolute; inset:0; width:100%; height:100%;
      background:transparent; border:0; color:transparent;
      caret-color:#dbe9ff;
    }
    table[data-sec] td textarea{ resize:none; }
    /* Блокируем клики по всем readOnly полям в замке */
    table[data-sec].locked input[readonly],
    table[data-sec].locked textarea[readonly]{ pointer-events:none; }
    /* Кнопка замка + подпись */
    #toggleLock.btn{ margin-left:8px; }
    .lockBadge{ font-size:12px; color:#7f9bbd; margin-left:8px; }
    `;
    const st = document.createElement('style');
    st.id = 'lock-import-style';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  // ---- ОБЕСПЕЧИВАЕМ data-sec ДЛЯ ТАБЛИЦ ----
  (function ensureDataSec(){
    const map = {
      warmTable: 'warm',
      strengthTable: 'strength',
      hiitTable: 'hiit',
      coolTable: 'cool'
    };
    Object.entries(map).forEach(([id, sec])=>{
      const t = $('#'+id);
      if (t) t.setAttribute('data-sec', sec);
    });
  })();

  // ---- КНОПКА ЗАМКА ----
  let workoutLocked = true;
  (function injectLockButton(){
    if ($('#toggleLock')) return;
    // вставим после кнопки "Настройки" если найдём
    const buttons = $$('button, .btn');
    let anchor = buttons.find(b => /настрой/i.test(b.textContent||''));
    anchor = anchor || $('.tabs') || $('header') || document.body;
    const wrap = anchor.parentElement || $('main') || document.body;

    const btn = document.createElement('button');
    btn.id = 'toggleLock';
    btn.className = 'btn';
    btn.textContent = '🔒 Режим занятия';

    const span = document.createElement('span');
    span.id = 'lockState';
    span.className = 'lockBadge';
    span.textContent = '(редактируются: «Факт», «RPE», «Заметка»)';

    if (anchor && anchor.nextSibling) {
      wrap.insertBefore(btn, anchor.nextSibling);
      wrap.insertBefore(span, btn.nextSibling);
    } else {
      wrap.appendChild(btn);
      wrap.appendChild(span);
    }

    btn.addEventListener('click', ()=>{
      workoutLocked = !workoutLocked;
      btn.textContent = workoutLocked ? '🔒 Режим занятия' : '🔓 Режим редактирования';
      span.textContent = workoutLocked
        ? '(редактируются: «Факт», «RPE», «Заметка»)'
        : '(можно менять план/технику/названия)';
      lockAll();
    });
  })();

  // ---- ОБЁРТКА ЯЧЕЕК «ПРОСМОТР + ПОЛЕ» ----
  function wrapCell(td){
    if (!td) return;
    if (td.querySelector('.cell-view')) return;
    const field = td.querySelector('input,textarea');
    if (!field) return;
    const view = document.createElement('div');
    view.className = 'cell-view';
    view.textContent = field.value || '';
    td.prepend(view);

    if (field.tagName === 'TEXTAREA') autoResize(field);
    field.addEventListener('input', ()=>{
      view.textContent = field.value || '';
      if (field.tagName === 'TEXTAREA') autoResize(field);
    });
  }
  function autoResize(ta){
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }
  function prepareRow(tr){
    $$('td', tr).forEach(wrapCell);
    lockRow(tr);
  }

  // ---- ЛОГИКА ЗАМКА ----
  function lockRow(tr){
    const fields = $$('input,textarea', tr);
    fields.forEach(f=>{
      const ph = (f.getAttribute('placeholder')||'').toLowerCase();
      const label = (f.closest('td')?.dataset?.label||'').toLowerCase();
      const isFact  = ph.includes('факт')   || label.includes('факт');
      const isRpe   = ph.includes('rpe')    || label.includes('rpe');
      const isNote  = ph.includes('замет')  || label.includes('замет');
      const editable = (isFact || isRpe || isNote);
      f.readOnly = workoutLocked ? !editable : false;
    });
  }
  function lockAll(){
    ['warm','strength','hiit','cool'].forEach(sec=>{
      const t = document.querySelector(`table[data-sec="${sec}"]`);
      if (!t) return;
      t.classList.toggle('locked', !!workoutLocked);
      $$('tbody tr', t).forEach(lockRow);
    });
  }

  // ---- ПОДГОТОВКА ТЕКУЩИХ СТРОК ----
  function prepareAllExisting(){
    ['warm','strength','hiit','cool'].forEach(sec=>{
      const t = document.querySelector(`table[data-sec="${sec}"]`);
      if (!t) return;
      $$('tbody tr', t).forEach(prepareRow);
    });
    lockAll();
  }
  document.addEventListener('DOMContentLoaded', prepareAllExisting);
  window.addEventListener('load', prepareAllExisting);

  // Следим за появлением новых строк (кнопки «+ Добавить …»)
  const mo = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes && m.addedNodes.forEach(n=>{
        if (n.nodeType===1 && n.matches && n.matches('tr')) prepareRow(n);
        if (n.nodeType===1) $$('tr', n).forEach(prepareRow);
      });
    });
  });
  mo.observe(document.body, {childList:true, subtree:true});

  // ---- БЫСТРЫЙ ВВОД ----
  (function injectQuickIfMissing(){
    if ($('#bulkAdd')) return; // уже есть
    const box = document.createElement('details');
    box.innerHTML = `
      <summary>Быстрый ввод / вставка плана из чата</summary>
      <textarea id="bulkAdd" rows="4"
        placeholder="Блоки: Разминка:, Силовая:, Высокоинтенсив:, Заминка:. Строки: Название — мышцы — план — tip:техника — note:заметка"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:8px">
        <button class="btn" id="bulkAddBtn">Разобрать и заполнить</button>
      </div>`;
    // вставим перед таблицей «Разминка» или в начало main
    const warm = $('#warmTable');
    if (warm && warm.parentElement) warm.parentElement.insertBefore(box, warm);
    else $('main')?.prepend(box);
  })();

  function clickAddFor(sec){
    const btn = document.querySelector(`button[data-add="${sec}"]`);
    if (btn) btn.click();
  }
  function lastRowOf(sec){
    const t = document.querySelector(`table[data-sec="${sec}"] tbody`);
    if (!t) return null;
    const trs = $$('tr', t);
    return trs[trs.length-1] || null;
  }
  function setCellValue(tr, colIndex, value){
    const td = $$('td', tr)[colIndex];
    if (!td) return;
    const field = $('input,textarea', td);
    if (!field) return;
    field.value = value || '';
    field.dispatchEvent(new Event('input', {bubbles:true}));
  }

  // Парсер строк плана
  function importFromQuick(text){
    const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    let sec = 'strength';
    const mapSec = {
      'разминка':'warm',
      'силовая':'strength',
      'высокоинтенсив':'hiit',
      'заминка':'cool'
    };

    lines.forEach(raw=>{
      const l = raw.toLowerCase().replace(/\s*:\s*$/,'');
      if (mapSec[l]) { sec = mapSec[l]; return; }

      // «Название — мышцы — план — tip:техника — note:заметка»
      const obj = { name:'', muscles:'', plan:'', tip:'', note:'' };
      // выделим tip/note из произвольного места
      const tipM  = raw.match(/tip:([^—]+)/i);  if (tipM)  obj.tip  = tipM[1].trim();
      const noteM = raw.match(/note:([^—]+)/i); if (noteM) obj.note = noteM[1].trim();

      // уберём их из строки и разрежем остальное
      const base = raw.replace(/tip:[^—]+/ig,'').replace(/note:[^—]+/ig,'');
      const parts = base.split('—').map(s=>s.trim()).filter(Boolean);
      obj.name    = parts[0] || '';
      obj.muscles = parts[1] || '';
      obj.plan    = parts[2] || '';

      // создаём строку штатной кнопкой + заполняем поля
      clickAddFor(sec);
      const tr = lastRowOf(sec);
      if (!tr) return;
      setCellValue(tr, 0, obj.name);       // Название
      setCellValue(tr, 1, obj.muscles);    // Мышцы
      setCellValue(tr, 2, obj.plan);       // План
      setCellValue(tr, 5, obj.tip);        // Техника
      setCellValue(tr, 6, obj.note);       // Заметка
      // «Факт» и «RPE» заполняешь уже по ходу занятия
    });

    // включаем замок после автозаполнения
    workoutLocked = true;
    const btn = $('#toggleLock'), span = $('#lockState');
    if (btn) btn.textContent = '🔒 Режим занятия';
    if (span) span.textContent = '(редактируются: «Факт», «RPE», «Заметка»)';
    lockAll();
  }

  document.addEventListener('click', (e)=>{
    if (e.target && e.target.id === 'bulkAddBtn'){
      const ta = $('#bulkAdd');
      if (ta && ta.value.trim()) importFromQuick(ta.value);
    }
  });

})();
