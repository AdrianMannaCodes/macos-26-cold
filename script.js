(function(){
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const store = {
  get(k, d){ try { const v = localStorage.getItem('mc26_'+k); return v ? JSON.parse(v) : d; } catch(e){ return d; } },
  set(k, v){ localStorage.setItem('mc26_'+k, JSON.stringify(v)); }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Apps (16) ---------- */
const APPS = [
  {id:'finder',  name:'Finder',      icon:'\u{1F5C2}', open:openFinder},
  {id:'safari',  name:'Safari',      icon:'\u{1F9ED}', open:openSafari},
  {id:'mail',    name:'Mail',        icon:'\u2709\uFE0F', open:openMail},
  {id:'messages',name:'Messages',    icon:'\u{1F4AC}', open:openMessages},
  {id:'notes',   name:'Notes',       icon:'\u{1F4DD}', open:openNotes},
  {id:'textedit',name:'TextEdit',    icon:'\u{1F4C4}', open:openTextEdit},
  {id:'calc',    name:'Calculator',  icon:'\u{1F9EE}', open:openCalc},
  {id:'terminal',name:'Terminal',    icon:'\u{1F4BB}', open:openTerminal},
  {id:'calendar',name:'Calendar',    icon:'\u{1F4C5}', open:openCalendar},
  {id:'clock',   name:'Clock',       icon:'\u23F0',    open:openClock},
  {id:'photos',  name:'Photos',      icon:'\u{1F305}', open:openPhotos},
  {id:'music',   name:'Music',       icon:'\u{1F3B5}', open:openMusic},
  {id:'settings',name:'System Settings', icon:'\u2699\uFE0F', open:openSettings},
  {id:'disk',    name:'Online Disk', icon:'\u2601\uFE0F', open:openDisk},
  {id:'appstore',name:'App Store',   icon:'\u{1F6CD}', open:openAppStore},
  {id:'about',   name:'About This Mac', icon:'\u{1F309}', open:openAbout}
];

const windows = new Map();
let zTop = 100, winSeq = 0;

/* ---------- Desktop icons & dock ---------- */
function renderDesktop(){
  const icons = $('#icons'); icons.innerHTML = '';
  APPS.forEach(a => {
    const d = document.createElement('div');
    d.className = 'icon'; d.dataset.app = a.id;
    d.innerHTML = '<div class="glyph">'+a.icon+'</div>'+esc(a.name);
    d.addEventListener('click', e => { e.stopPropagation(); selectIcon(d); });
    d.addEventListener('dblclick', () => launch(a.id));
    d.addEventListener('touchend', e => { e.preventDefault(); if(d.classList.contains('sel')) launch(a.id); else selectIcon(d); }, {passive:false});
    icons.appendChild(d);
  });
  const dock = $('#dock'); dock.innerHTML = '';
  APPS.slice(0,10).forEach(a => {
    const b = document.createElement('div');
    b.className = 'dock-item'; b.title = a.name; b.textContent = a.icon; b.dataset.app = a.id;
    b.style.background = 'linear-gradient(145deg,rgba(255,255,255,.4),rgba(255,255,255,.08))';
    b.addEventListener('click', () => launch(a.id));
    dock.appendChild(b);
  });
}
function selectIcon(el){
  document.querySelectorAll('.icon.sel').forEach(i => i.classList.remove('sel'));
  el.classList.add('sel');
}

/* ---------- Window manager ---------- */
function launch(id){
  const app = APPS.find(a => a.id === id); if(!app) return;
  const existing = [...windows.values()].find(w => w.appId === id);
  if(existing && !app.multi){ focus(existing.el); return; }
  const w = createWindow(app.name, 560, 380, app.id);
  app.open(w.content, w);
  return w;
}
function createWindow(title, width, height, appId, dark){
  const id = ++winSeq;
  const el = document.createElement('div');
  el.className = 'win' + (dark ? ' dark' : '');
  const count = windows.size;
  el.style.width = Math.min(width, innerWidth - 20) + 'px';
  el.style.height = height + 'px';
  el.style.left = (80 + (count*28)%260) + 'px';
  el.style.top = (60 + (count*28)%200) + 'px';
  el.innerHTML = '<div class="titlebar"><div class="lights"><span class="light r"></span><span class="light y"></span><span class="light g"></span></div><div class="title">'+esc(title)+'</div></div><div class="content"></div>';
  $('#windows').appendChild(el);
  const content = el.querySelector('.content');
  const w = {id, el, appId, content, title};
  windows.set(id, w);
  el.addEventListener('mousedown', () => focus(el));
  el.querySelector('.light.r').addEventListener('click', e => { e.stopPropagation(); closeWin(id); });
  el.querySelector('.light.y').addEventListener('click', e => { e.stopPropagation(); el.style.height = height+'px'; });
  el.querySelector('.light.g').addEventListener('click', e => { e.stopPropagation(); el.classList.toggle('max'); });
  dragify(el, el.querySelector('.titlebar'));
  focus(el);
  setRunning(appId, true);
  return w;
}
function focus(el){ el.style.zIndex = ++zTop; }
function closeWin(id){
  const w = windows.get(id); if(!w) return;
  w.el.remove(); windows.delete(id);
  if(![...windows.values()].some(x => x.appId === w.appId)) setRunning(w.appId, false);
}
function setRunning(appId, on){
  document.querySelectorAll('.dock-item[data-app="'+appId+'"]').forEach(d => d.style.outline = on ? '2px solid rgba(255,255,255,.8)' : '');
}
/* Drag with mouse AND touch via pointer events */
function dragify(el, handle){
  let sx, sy, ox, oy, drag = false;
  handle.addEventListener('pointerdown', e => {
    if(e.target.classList.contains('light')) return;
    if(el.classList.contains('max')) return;
    drag = true; sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop;
    handle.setPointerCapture(e.pointerId); focus(el);
  });
  handle.addEventListener('pointermove', e => {
    if(!drag) return;
    el.style.left = Math.max(0, ox + e.clientX - sx) + 'px';
    el.style.top = Math.max(26, oy + e.clientY - sy) + 'px';
  });
  handle.addEventListener('pointerup', () => drag = false);
  handle.addEventListener('pointercancel', () => drag = false);
}

/* ---------- Clock ---------- */
function tick(){
  const d = new Date();
  $('#clock').textContent = d.toLocaleString(undefined,{weekday:'short',hour:'numeric',minute:'2-digit',month:'short',day:'numeric'});
}

/* ---------- Local Apple ID ---------- */
function account(){ return store.get('account', null); }
function renderLogin(){
  const acc = account();
  $('#user-label').textContent = acc ? acc.email.split('@')[0] : 'Not signed in';
  $('#login').classList.toggle('hidden', !!acc);
  $('#logout-btn').classList.toggle('hidden', !acc);
}
function setupLogin(){
  $('#login-btn').addEventListener('click', () => {
    const email = $('#login-email').value.trim();
    const pass = $('#login-pass').value;
    const msg = $('#login-msg');
    if(!/^[^@\s]+@[^@\s]+$/.test(email)){ msg.textContent = 'Enter an Apple ID (any email-style name).'; return; }
    if(pass.length < 4){ msg.textContent = 'Password must be at least 4 characters.'; return; }
    const existing = account();
    if(existing && existing.email !== email){ msg.textContent = 'Only one local Apple ID is stored. Sign out first.'; return; }
    store.set('account', {email, pass: btoa(unescape(encodeURIComponent(pass)))});
    $('#login-pass').value = ''; msg.textContent = '';
    renderLogin();
  });
  $('#logout-btn').addEventListener('click', () => { store.set('account', null); renderLogin(); });
  $('#login-pass').addEventListener('keydown', e => { if(e.key === 'Enter') $('#login-btn').click(); });
}

/* ---------- Online Disk (localStorage-backed cloud drive) ---------- */
function diskFiles(){ return store.get('disk', {}); }
function saveDisk(f){ store.set('disk', f); }
function openDisk(c){
  const acc = account();
  if(!acc){ c.innerHTML = '<p class="muted">Sign in with your local Apple ID to use Online Disk.</p>'; return; }
  c.innerHTML = '<div class="row"><div class="sidebar"><div><b>iCloud-style Disk</b></div><p class="muted">'+esc(acc.email)+'</p><button class="btn" id="d-new">New File</button></div><div style="flex:1"><div class="grid" id="d-grid"></div></div></div>';
  const grid = c.querySelector('#d-grid');
  function draw(){
    const files = diskFiles(); grid.innerHTML = '';
    const names = Object.keys(files).sort();
    if(!names.length){ grid.innerHTML = '<p class="muted">Disk is empty.</p>'; }
    names.forEach(n => {
      const f = document.createElement('div'); f.className='file';
      f.innerHTML = '<div style="font-size:36px">\u{1F4C4}</div>'+esc(n);
      f.addEventListener('click', () => { const w = createWindow(n, 480, 340, 'textedit'); openEditor(w.content, n, files[n], draw); });
      f.addEventListener('contextmenu', e => { e.preventDefault(); if(confirm('Delete '+n+'?')){ const x = diskFiles(); delete x[n]; saveDisk(x); draw(); } });
      grid.appendChild(f);
    });
  }
  c.querySelector('#d-new').addEventListener('click', () => {
    const n = prompt('File name (e.g. notes.txt)'); if(!n) return;
    const x = diskFiles(); if(x[n] !== undefined){ alert('A file with that name exists.'); return; }
    x[n] = ''; saveDisk(x); draw();
  });
  draw();
}
function openEditor(c, name, text, onSave){
  c.innerHTML = '<textarea></textarea><button class="btn" style="margin-top:8px">Save to Disk</button>';
  const ta = c.querySelector('textarea'); ta.value = text || '';
  c.querySelector('button').addEventListener('click', () => {
    const x = diskFiles(); x[name] = ta.value; saveDisk(x); if(onSave) onSave(); alert('Saved.');
  });
}

/* ---------- Finder ---------- */
function openFinder(c){
  c.innerHTML = '<div class="row"><div class="sidebar"><ul class="list"><li>Desktop</li><li>Documents</li><li>Downloads</li><li>Online Disk</li></ul></div><div style="flex:1" class="grid"><div class="file"><div style="font-size:36px">\u{1F4C1}</div>Desktop</div><div class="file"><div style="font-size:36px">\u{1F4C1}</div>Documents</div><div class="file"><div style="font-size:36px">\u{1F4C1}</div>Downloads</div></div></div>';
  c.querySelectorAll('.sidebar li').forEach(li => li.addEventListener('click', () => {
    if(li.textContent === 'Online Disk') launch('disk'); }));
}

/* ---------- Safari (simple address bar; embeds only allowed sites) ---------- */
function openSafari(c){
  c.innerHTML = '<input placeholder="Enter a web address and press Return"><div class="muted" id="s-out" style="padding:20px">Pages that refuse embedding will open in a new tab.</div>';
  const inp = c.querySelector('input'), out = c.querySelector('#s-out');
  inp.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    let u = inp.value.trim(); if(!u) return;
    if(!/^https?:\/\//.test(u)) u = 'https://' + u;
    try { const url = new URL(u); window.open(url.href, '_blank', 'noopener'); out.textContent = 'Opened ' + url.href + ' in a new tab.'; }
    catch(err){ out.textContent = 'Invalid address.'; }
  });
}

/* ---------- Mail / Messages (local only) ---------- */
function openMail(c){
  const msgs = store.get('mail', [{from:'Apple', subject:'Welcome to MacOS 26.0.1 Cold', body:'Thanks for trying the emulator.'}]);
  c.innerHTML = '<div class="row"><div class="sidebar"><ul class="list" id="m-list"></ul></div><div style="flex:1;padding:8px" id="m-body"><p class="muted">Select a message.</p></div></div>';
  const list = c.querySelector('#m-list');
  msgs.forEach(m => { const li = document.createElement('li'); li.textContent = m.subject; li.addEventListener('click', () => { c.querySelector('#m-body').innerHTML = '<b>'+esc(m.subject)+'</b><p class="muted">From: '+esc(m.from)+'</p><p>'+esc(m.body)+'</p>'; }); list.appendChild(li); });
}
function openMessages(c){
  const log = store.get('chat', []);
  c.innerHTML = '<div id="chat" style="height:calc(100% - 50px);overflow:auto"></div><div style="display:flex;gap:6px"><input placeholder="iMessage"><button class="btn">Send</button></div>';
  const chat = c.querySelector('#chat'), inp = c.querySelector('input');
  function draw(){ chat.innerHTML = log.map(m => '<div style="margin:6px 0;text-align:right"><span style="background:#0a7aff;color:#fff;padding:6px 10px;border-radius:14px;display:inline-block">'+esc(m)+'</span></div>').join(''); chat.scrollTop = chat.scrollHeight; }
  function send(){ const t = inp.value.trim(); if(!t) return; log.push(t); store.set('chat', log); inp.value=''; draw(); }
  c.querySelector('button').addEventListener('click', send);
  inp.addEventListener('keydown', e => { if(e.key==='Enter') send(); });
  draw();
}

/* ---------- Notes / TextEdit ---------- */
function openNotes(c){
  const n = store.get('notes', '');
  c.innerHTML = '<textarea placeholder="Start typing a note..."></textarea>';
  const ta = c.querySelector('textarea'); ta.value = n;
  ta.addEventListener('input', () => store.set('notes', ta.value));
}
function openTextEdit(c){
  c.innerHTML = '<textarea placeholder="Untitled"></textarea>';
  c.querySelector('textarea').focus();
}

/* ---------- Calculator ---------- */
function openCalc(c){
  c.innerHTML = '<div class="calc"><div class="disp">0</div>' + ['C','±','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(k => '<button data-k="'+k+'" class="'+('/*-+='.includes(k)?'op':'')+'">'+k+'</button>').join('') + '</div>';
  let cur = '0', prev = null, op = null, fresh = true;
  const disp = c.querySelector('.disp');
  const calc = (a,b,o) => ({'+':a+b,'-':a-b,'*':a*b,'/':b===0?NaN:a/b}[o]);
  c.querySelector('.calc').addEventListener('click', e => {
    const k = e.target.dataset.k; if(k === undefined) return;
    if(/\d|\./.test(k)){ if(fresh){ cur = k === '.' ? '0.' : k; fresh=false; } else if(k==='.' && cur.includes('.')){} else cur = cur==='0' && k!=='.' ? k : cur + k; }
    else if(k==='C'){ cur='0'; prev=null; op=null; fresh=true; }
    else if(k==='±'){ cur = String(-parseFloat(cur)); }
    else if(k==='%'){ cur = String(parseFloat(cur)/100); }
    else if(k==='='){ if(op!==null && prev!==null){ cur = String(calc(parseFloat(prev), parseFloat(cur), op)); } op=null; prev=null; fresh=true; }
    else { if(op && prev!==null && !fresh){ cur = String(calc(parseFloat(prev), parseFloat(cur), op)); } prev = cur; op = k; fresh = true; }
    disp.textContent = cur;
  });
}

/* ---------- Terminal ---------- */
function openTerminal(c){
  c.innerHTML = '<div class="term"><div>MacOS 26.0.1 Cold Terminal. Type help.</div><div class="out"></div><div><span>adr@cold % </span><input autofocus></div></div>';
  const out = c.querySelector('.out'), inp = c.querySelector('input'), term = c.querySelector('.term');
  const cmds = {
    help: () => 'Commands: help, date, whoami, echo <text>, clear, ls, uname',
    date: () => new Date().toString(),
    whoami: () => (account()||{email:'guest'}).email.split('@')[0],
    ls: () => Object.keys(diskFiles()).join('  ') || '(empty)',
    uname: () => 'Darwin 25.0.1 MacOS-Cold arm64',
    clear: () => { out.textContent=''; return null; }
  };
  inp.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    const line = inp.value.trim(); inp.value='';
    out.insertAdjacentText('beforeend', 'adr@cold % ' + line + '\n');
    if(!line) return;
    let res;
    if(line.startsWith('echo ')) res = line.slice(5);
    else if(cmds[line]) res = cmds[line]();
    else res = 'zsh: command not found: ' + line;
    if(res) out.insertAdjacentText('beforeend', res + '\n');
    term.scrollTop = term.scrollHeight;
  });
  term.addEventListener('click', () => inp.focus());
}

/* ---------- Calendar / Clock ---------- */
function openCalendar(c){
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  let h = '<h3 style="text-align:center">'+d.toLocaleString(undefined,{month:'long',year:'numeric'})+'</h3><div class="grid" style="grid-template-columns:repeat(7,1fr);text-align:center">';
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(x => h += '<b>'+x+'</b>');
  for(let i=0;i<first;i++) h += '<span></span>';
  for(let day=1;day<=days;day++) h += '<span style="padding:6px;'+(day===d.getDate()?'background:#ff3b30;color:#fff;border-radius:50%':'')+'">'+day+'</span>';
  c.innerHTML = h + '</div><p class="muted">Today: '+d.toDateString()+'</p>';
}
function openClock(c){
  const draw = () => { c.innerHTML = '<div class="clock-big">'+new Date().toLocaleTimeString()+'</div><p style="text-align:center" class="muted">'+new Date().toDateString()+'</p>'; };
  draw(); const t = setInterval(() => { if(!c.isConnected){ clearInterval(t); return; } draw(); }, 1000);
}

/* ---------- Photos / Music (placeholders with local data) ---------- */
function openPhotos(c){
  c.innerHTML = '<div class="grid">' + [0,1,2,3,4,5].map(i => '<div class="photo" style="filter:hue-rotate('+(i*25)+'deg)"></div>').join('') + '</div>';
}
function openMusic(c){
  const songs = ['Golden Hour','Bay Fog','Red Span','Harbor Lights'];
  c.innerHTML = '<ul class="list">'+songs.map(s => '<li>'+esc(s)+'<span class="muted">\u25B6</span></li>').join('')+'</ul><p class="muted">Playback is simulated.</p>';
}

/* ---------- Settings ---------- */
function openSettings(c){
  const acc = account();
  c.innerHTML = '<ul class="list"><li>Apple ID: '+esc(acc ? acc.email : 'not signed in')+'</li><li><span>Dark mode</span><button class="btn secondary" id="dm">Toggle</button></li><li><span>Reset desktop</span><button class="btn secondary" id="rst">Reset</button></li></ul>';
  c.querySelector('#dm').addEventListener('click', () => { const b = !store.get('dark', false); store.set('dark', b); document.body.style.filter = b ? 'brightness(.8)' : ''; });
  c.querySelector('#rst').addEventListener('click', () => { if(confirm('Clear all local data (Apple ID, disk, notes)?')){ Object.keys(localStorage).filter(k=>k.startsWith('mc26_')).forEach(k=>localStorage.removeItem(k)); location.reload(); } });
}

/* ---------- App Store (catalog info only) ---------- */
function openAppStore(c){
  c.innerHTML = '<ul class="list">' + APPS.map(a => '<li>'+a.icon+' '+esc(a.name)+'<span class="muted">Installed</span></li>').join('') + '</ul>';
}

/* ---------- About ---------- */
function openAbout(c){
  c.innerHTML = '<h2>MacOS 26.0.1 Cold</h2><p>Tahoe styling, Golden Gate theme.</p><p class="muted">16 built-in apps. Local Apple ID and Online Disk stored in this browser. Works with touch and mouse.</p>';
}

/* ---------- Boot ---------- */
function init(){
  renderDesktop(); setupLogin(); renderLogin(); tick(); setInterval(tick, 15000);
  $('#desktop').addEventListener('click', () => document.querySelectorAll('.icon.sel').forEach(i => i.classList.remove('sel')));
  document.querySelector('#menubar .apple').addEventListener('click', () => launch('about'));
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const top = [...windows.values()].sort((a,b)=>b.el.style.zIndex-a.el.style.zIndex)[0]; if(top) closeWin(top.id); } });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
