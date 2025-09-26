/* مبسّط وواضح */
const KEY = 'oqati_simple_v2';
let db = { subjects: [], tasks: [] };
let currentSubject = null; // id

// DOM
const subjectsContainer = document.getElementById('subjectsContainer');
const stats = document.getElementById('stats');
const resetBtn = document.getElementById('resetBtn');

const subjectModal = document.getElementById('subjectModal');
const subjectModalTitle = document.getElementById('subjectModalTitle');
const subjectNameInput = document.getElementById('subjectNameInput');
const subjectColorInput = document.getElementById('subjectColorInput');
const subjectSave = document.getElementById('subjectSave');
const subjectCancel = document.getElementById('subjectCancel');

const taskModal = document.getElementById('taskModal');
const taskModalTitle = document.getElementById('taskModalTitle');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDescInput = document.getElementById('taskDescInput');
const taskDueInput = document.getElementById('taskDueInput');
const taskStateInput = document.getElementById('taskStateInput');
const taskSave = document.getElementById('taskSave');
const taskCancel = document.getElementById('taskCancel');

const home = document.getElementById('home');
const subjectPage = document.getElementById('subjectPage');
const backBtn = document.getElementById('backBtn');
const subjectName = document.getElementById('subjectName');
const subjectInfo = document.getElementById('subjectInfo');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksContainer = document.getElementById('tasksContainer');
const sortSelect = document.getElementById('sortSelect');
const filterSelect = document.getElementById('filterSelect');

let editSubjectId = null;
let editTaskId = null;

// --- utils ---
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function save(){ localStorage.setItem(KEY, JSON.stringify(db)); renderOverview(); }
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    db = raw ? JSON.parse(raw) : {subjects:[],tasks:[]};
  }catch(e){
    db = {subjects:[],tasks:[]};
    console.error('load error',e);
  }
}

// --- render overview & subjects ---
function renderOverview(){
  const totalSub = db.subjects.length;
  const totalTasks = db.tasks.length;
  const done = db.tasks.filter(t=>t.state==='done').length;
  stats.textContent = `${totalSub} مادة · ${done}/${totalTasks} مُنجزة`;
}
function renderSubjects(){
  subjectsContainer.innerHTML = '';
  // add card
  const addCard = document.createElement('div'); addCard.className='card add-card';
  addCard.innerHTML = '<div>+ إضافة مادة</div>';
  addCard.onclick = ()=>{ openAddSubject(); };
  subjectsContainer.appendChild(addCard);

  db.subjects.forEach(s=>{
    const card = document.createElement('div'); card.className='card';
    const pending = db.tasks.filter(t=>t.subjectId===s.id && t.state!=='done').length;
    const total = db.tasks.filter(t=>t.subjectId===s.id).length;
    card.innerHTML = `<div style="display:flex;justify-content:space-between"><div style="font-weight:700">${escapeHtml(s.name)}</div><div class="small">${pending} متبقي</div></div>
                      <div class="small" style="margin-top:8px">${total} واجبات</div>`;
    card.onclick = ()=> openSubject(s.id);
    // actions (edit/delete) small buttons appended
    const actions = document.createElement('div'); actions.style.marginTop='8px'; actions.style.display='flex'; actions.style.gap='6px';
    const edit = document.createElement('button'); edit.className='btn btn-ghost small'; edit.textContent='تعديل';
    edit.onclick = (e)=>{ e.stopPropagation(); openEditSubject(s.id); };
    const del = document.createElement('button'); del.className='btn btn-ghost small'; del.textContent='حذف';
    del.onclick = (e)=>{ e.stopPropagation(); if(confirm('حذف المادة وكل واجباتها؟')) deleteSubject(s.id); };
    actions.appendChild(edit); actions.appendChild(del);
    card.appendChild(actions);
    subjectsContainer.appendChild(card);
  });
}

// --- subject actions ---
function openAddSubject(){ editSubjectId = null; subjectModalTitle.textContent='إضافة مادة'; subjectNameInput.value=''; subjectColorInput.value=''; showModal(subjectModal); }
function openEditSubject(id){ editSubjectId = id; const s = db.subjects.find(x=>x.id===id); if(!s) return; subjectModalTitle.textContent='تعديل مادة'; subjectNameInput.value = s.name; subjectColorInput.value = s.color || ''; showModal(subjectModal); }
function saveSubject(){
  const name = subjectNameInput.value.trim();
  const color = subjectColorInput.value.trim() || randomColor();
  if(!name){ alert('أدخل اسم المادة'); return; }
  if(editSubjectId){
    const s = db.subjects.find(x=>x.id===editSubjectId);
    if(!s) return alert('المادة غير موجودة');
    s.name = name; s.color = color;
  } else {
    db.subjects.push({id: uid('sub'), name, color, createdAt: new Date().toISOString()});
  }
  hideModal(subjectModal); save(); renderSubjects();
}
function deleteSubject(id){
  db.tasks = db.tasks.filter(t=>t.subjectId!==id);
  db.subjects = db.subjects.filter(s=>s.id!==id);
  if(currentSubject === id){ goHome(); }
  save(); renderSubjects();
}
function openSubject(id){
  currentSubject = id;
  const s = db.subjects.find(x=>x.id===id);
  if(!s) return alert('المادة غير موجودة');
  subjectName.textContent = s.name;
  const total = db.tasks.filter(t=>t.subjectId===id).length;
  const done = db.tasks.filter(t=>t.subjectId===id && t.state==='done').length;
  subjectInfo.textContent = `${done}/${total} مُنجزة`;
  home.style.display = 'none';
  subjectPage.style.display = 'block';
  renderTasks();
}
function goHome(){ currentSubject = null; subjectPage.style.display='none'; home.style.display='block'; renderSubjects(); }

// --- tasks ---
function openAddTask(){ if(!currentSubject) return alert('اختر مادة أولًا'); editTaskId = null; taskModalTitle.textContent='إضافة واجب'; taskTitleInput.value=''; taskDescInput.value=''; taskDueInput.value=''; taskStateInput.value='pending'; showModal(taskModal); }
function openEditTask(id){ editTaskId = id; const t = db.tasks.find(x=>x.id===id); if(!t) return; taskModalTitle.textContent='تعديل واجب'; taskTitleInput.value = t.title; taskDescInput.value = t.desc || ''; taskDueInput.value = t.due || ''; taskStateInput.value = t.state || 'pending'; showModal(taskModal); }
function saveTask(){
  const title = taskTitleInput.value.trim();
  if(!title) return alert('أدخل عنوان الواجب');
  const desc = taskDescInput.value.trim();
  const due = taskDueInput.value || '';
  const state = taskStateInput.value || 'pending';
  if(editTaskId){
    const t = db.tasks.find(x=>x.id===editTaskId);
    if(!t) return alert('الواجب غير موجود');
    t.title = title; t.desc = desc; t.due = due; t.state = state;
  } else {
    db.tasks.push({id: uid('task'), subjectId: currentSubject, title, desc, due, state, createdAt: new Date().toISOString()});
  }
  hideModal(taskModal); save(); renderTasks(); renderSubjects();
}
function deleteTask(id){ if(!confirm('حذف هذا الواجب؟')) return; db.tasks = db.tasks.filter(t=>t.id!==id); save(); renderTasks(); renderSubjects(); }
function toggleDone(id){ const t = db.tasks.find(x=>x.id===id); if(!t) return; t.state = (t.state==='done') ? 'pending' : 'done'; save(); renderTasks(); renderSubjects(); }

// render tasks for current subject
function renderTasks(){
  if(!currentSubject) return;
  tasksContainer.innerHTML = '';
  let tasks = db.tasks.filter(t=>t.subjectId===currentSubject);
  // filter
  const filter = filterSelect.value;
  if(filter === 'pending') tasks = tasks.filter(t=>t.state!=='done');
  else if(filter === 'done') tasks = tasks.filter(t=>t.state==='done');
  // sort
  const sort = sortSelect.value;
  tasks.sort((a,b)=>{
    if(sort==='due_asc'){
      if(!a.due) return 1; if(!b.due) return -1; return a.due.localeCompare(b.due);
    } else if(sort==='due_desc'){ if(!a.due) return 1; if(!b.due) return -1; return b.due.localeCompare(a.due); }
    else if(sort==='created_desc') return b.createdAt.localeCompare(a.createdAt);
    return 0;
  });

  if(tasks.length===0){ tasksContainer.innerHTML = '<div class="small muted">لا توجد واجبات بعد.</div>'; return; }

  tasks.forEach(t=>{
    const el = document.createElement('div'); el.className='task';
    const left = document.createElement('div');
    const title = document.createElement('div'); title.textContent = t.title; if(t.state==='done') title.className='done';
    const meta = document.createElement('div'); meta.className='small muted'; meta.textContent = (t.due?('تسليم: '+t.due+' · '):'') + 'أضيف: ' + t.createdAt.slice(0,10);
    left.appendChild(title); if(t.desc) left.appendChild(document.createElement('div')).textContent = t.desc; left.appendChild(meta);

    const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='6px';
    const toggle = document.createElement('button'); toggle.className='btn btn-ghost small'; toggle.textContent = t.state==='done' ? 'إلغاء كمنجز' : 'علامة تم'; toggle.onclick = ()=>toggleDone(t.id);
    const edit = document.createElement('button'); edit.className='btn btn-ghost small'; edit.textContent='تعديل'; edit.onclick = ()=>openEditTask(t.id);
    const del = document.createElement('button'); del.className='btn btn-ghost small'; del.textContent='حذف'; del.onclick = ()=>deleteTask(t.id);
    actions.appendChild(toggle); actions.appendChild(edit); actions.appendChild(del);

    el.appendChild(left); el.appendChild(actions);
    tasksContainer.appendChild(el);
  });

  // update subject info
  const total = db.tasks.filter(t=>t.subjectId===currentSubject).length;
  const done = db.tasks.filter(t=>t.subjectId===currentSubject && t.state==='done').length;
  subjectInfo.textContent = `${done}/${total} مُنجزة`;
}

// --- modal helpers ---
function showModal(el){ el.style.display = 'flex'; }
function hideModal(el){ el.style.display = 'none'; }
window.addEventListener('click', (e)=>{ if(e.target === subjectModal) hideModal(subjectModal); if(e.target === taskModal) hideModal(taskModal); });

// --- random color ---
function randomColor(){ const pal = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899']; return pal[Math.floor(Math.random()*pal.length)]; }

// --- escape html small util ---
function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// --- events ---
subjectSave.onclick = saveSubject;
subjectCancel.onclick = ()=>hideModal(subjectModal);
taskSave.onclick = saveTask;
taskCancel.onclick = ()=>hideModal(taskModal);
resetBtn.onclick = ()=>{ if(confirm('حذف كل البيانات نهائيًا؟')) { db = {subjects:[],tasks:[]}; save(); renderSubjects(); goHome(); } };
backBtn.onclick = goHome;
addTaskBtn.onclick = openAddTask;
sortSelect.onchange = renderTasks;
filterSelect.onchange = renderTasks;

// --- init ---
load();
renderSubjects();
renderOverview();

// add example if empty to help
if(db.subjects.length===0 && db.tasks.length===0){
  const sId = uid('sub');
  db.subjects.push({id:sId,name:'رياضيات',color:'#3b82f6',createdAt:new Date().toISOString()});
  db.tasks.push({id:uid('task'),subjectId:sId,title:'حل التمرين 5 صفحة 20',desc:'من كتاب المدرسة',due:getFutureDate(2),state:'pending',createdAt:new Date().toISOString()});
  save(); renderSubjects();
}

function getFutureDate(days){ const d = new Date(); d.setDate(d.getDate()+days); const m = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${m}-${dd}`; }