// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
let state = {
  user: null,          // {firstName, lastName, email, monthlyIncome}
  transactions: [],    // {id, type:'income'|'expense', source/category, amount, desc, date}
  budgets: {           // category -> limit (₹)
    'Food & Snacks': 1500,
    'Academic': 1500,
    'Transportation': 1000,
    'Digital & Tech': 800,
    'Entertainment': 700,
    'Accommodation': 3000,
    'Health': 500,
    'Personal': 600,
    'Others': 400
  },
  goals: [],           // {id, name, target, saved}
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  pendingExpense: null // holds expense data waiting for budget-warn confirm
};

const CAT_ICONS = {
  'Food & Snacks':    '🍕', 'Canteen Meals':'🍱','Outside Food / Cafe':'☕','Snacks':'🍫','Groceries':'🛒',
  'Academic':         '📚', 'Books & Notebooks':'📖','Exam Fees':'📝','Printing':'🖨️','Online Courses':'💻',
  'Transportation':   '🚌', 'Bus / Metro Pass':'🚇','Fuel':'⛽','Cab / Auto':'🛺',
  'Accommodation':    '🏠', 'Hostel Fees':'🛏️','PG / Rent':'🏠','Electricity':'💡',
  'Digital & Tech':   '📱', 'Mobile Recharge':'📲','Internet':'🌐','OTT Subscriptions':'🎬','Software':'💾',
  'Entertainment':    '🎬', 'Movies / Outings':'🎥','Parties':'🎉','Gaming':'🎮',
  'Health':           '💊', 'Medicines':'💊','Doctor Visit':'🏥',
  'Personal':         '👗', 'Clothes':'👕','Grooming':'✂️','Gym':'🏋️',
  'Others':           '📦', 'Gifts':'🎁','Club Fees':'🎓','Miscellaneous':'📦',
  'Pocket Allowance': '💵', 'Part-Time Job':'💼','Freelancing':'🖥️','Tutoring / Teaching':'📐','Small Business':'🏪','Other':'💰',
};

function catIcon(c){ return CAT_ICONS[c] || '💸'; }
function fmt(n){ return '₹'+(+n).toLocaleString('en-IN'); }
function today(){ return new Date().toISOString().split('T')[0]; }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2); }

// ════ MAP sub-categories to budget groups ════
const CAT_GROUP = {
  'Books & Notebooks':'Academic','Exam Fees':'Academic','Printing':'Academic','Online Courses':'Academic',
  'Canteen Meals':'Food & Snacks','Outside Food / Cafe':'Food & Snacks','Snacks':'Food & Snacks','Groceries':'Food & Snacks',
  'Bus / Metro Pass':'Transportation','Fuel':'Transportation','Cab / Auto':'Transportation',
  'Hostel Fees':'Accommodation','PG / Rent':'Accommodation','Electricity':'Accommodation',
  'Mobile Recharge':'Digital & Tech','Internet':'Digital & Tech','OTT Subscriptions':'Digital & Tech','Software':'Digital & Tech',
  'Movies / Outings':'Entertainment','Parties':'Entertainment','Gaming':'Entertainment',
  'Medicines':'Health','Doctor Visit':'Health',
  'Clothes':'Personal','Grooming':'Personal','Gym':'Personal',
  'Gifts':'Others','Club Fees':'Others','Miscellaneous':'Others',
};
function getGroup(cat){ return CAT_GROUP[cat] || cat; }

// ════ SPEND BY GROUP ════
function spendByGroup(){
  const now = new Date(); const m=now.getMonth(), y=now.getFullYear();
  const map={};
  state.transactions.filter(t=>t.type==='expense').forEach(t=>{
    const d=new Date(t.date);
    if(d.getMonth()===m && d.getFullYear()===y){
      const g=getGroup(t.category);
      map[g]=(map[g]||0)+t.amount;
    }
  });
  return map;
}

function totalIncome(){
  return state.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
}
function totalExpense(){
  const now=new Date();const m=now.getMonth(),y=now.getFullYear();
  return state.transactions.filter(t=>t.type==='expense'&&new Date(t.date).getMonth()===m&&new Date(t.date).getFullYear()===y).reduce((s,t)=>s+t.amount,0);
}

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
function showAuth(id){
  document.querySelectorAll('.auth-wrap').forEach(a=>a.classList.remove('visible'));
  document.getElementById(id).classList.add('visible');
}

function doLogin(){
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const err   = document.getElementById('login-err');
  if(!email||!pass){ err.textContent='Please enter your email and password.'; err.classList.add('show'); return; }
  err.classList.remove('show');
  const btn=document.getElementById('login-btn');
  btn.textContent='Signing in…'; btn.disabled=true;
  setTimeout(()=>{
    // Use stored account if exists
    const stored = localStorage.getItem('ss_user_'+email);
    if(stored){
      state.user = JSON.parse(stored);
      loadUserData(email);
    } else {
      // Create demo account
      const parts = email.split('@')[0].split('.');
      state.user = { firstName: cap(parts[0]||'Student'), lastName: cap(parts[1]||''), email, monthlyIncome: 10000 };
    }
    enterApp();
    btn.textContent='Sign In'; btn.disabled=false;
  },700);
}

function doSignup(){
  const fname  = document.getElementById('su-fname').value.trim();
  const lname  = document.getElementById('su-lname').value.trim();
  const email  = document.getElementById('su-email').value.trim();
  const pass   = document.getElementById('su-pass').value;
  const pass2  = document.getElementById('su-pass2').value;
  const terms  = document.getElementById('su-terms').checked;
  const income = +document.getElementById('su-income').value || 10000;
  const err    = document.getElementById('signup-err');
  if(!fname||!lname||!email||!pass){ err.textContent='Please fill in all fields.'; err.classList.add('show'); return; }
  if(pass!==pass2){ err.textContent='Passwords do not match.'; err.classList.add('show'); return; }
  if(!terms){ err.textContent='Please accept the Terms & Conditions.'; err.classList.add('show'); return; }
  err.classList.remove('show');
  const btn=document.getElementById('signup-btn');
  btn.textContent='Creating account…'; btn.disabled=true;
  setTimeout(()=>{
    state.user = { firstName:fname, lastName:lname, email, monthlyIncome:income };
    localStorage.setItem('ss_user_'+email, JSON.stringify(state.user));
    enterApp();
    btn.textContent='Create Account'; btn.disabled=false;
  },700);
}

function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }

function loadUserData(email){
  const d = localStorage.getItem('ss_data_'+email);
  if(d){
    const parsed = JSON.parse(d);
    state.transactions = parsed.transactions||[];
    state.budgets = parsed.budgets||state.budgets;
    state.goals = parsed.goals||[];
  }
}

function saveUserData(){
  if(!state.user) return;
  localStorage.setItem('ss_user_'+state.user.email, JSON.stringify(state.user));
  localStorage.setItem('ss_data_'+state.user.email, JSON.stringify({
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals
  }));
}

function enterApp(){
  document.querySelectorAll('.auth-wrap').forEach(a=>{ a.classList.remove('visible'); a.style.display='none'; });
  document.getElementById('app').style.display='flex';
  updateUserUI();
  // Set today's date on modals
  document.getElementById('i-date').value = today();
  document.getElementById('e-date').value = today();
  navigate('pg-dashboard');
}

function doLogout(){
  saveUserData();
  state.user=null; state.transactions=[]; state.goals=[];
  document.getElementById('app').style.display='none';
  document.querySelectorAll('.auth-wrap').forEach(a=>{ a.style.display=''; a.classList.remove('visible'); });
  document.getElementById('page-login').classList.add('visible');
  document.getElementById('l-email').value='';
  document.getElementById('l-pass').value='';
}

function updateUserUI(){
  if(!state.user) return;
  const full = state.user.firstName + (state.user.lastName?' '+state.user.lastName:'');
  const initial = state.user.firstName[0].toUpperCase();
  document.getElementById('sb-av').textContent = initial;
  document.getElementById('sb-name').textContent = state.user.firstName;
  document.getElementById('profile-av').textContent = initial;
  document.getElementById('profile-name').textContent = full;
  document.getElementById('profile-email').textContent = state.user.email;
  document.getElementById('p-name').value = full;
  document.getElementById('p-email').value = state.user.email;
  document.getElementById('p-income').value = state.user.monthlyIncome||'';
  // topbar greeting
  const h=new Date().getHours();
  const greet = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  document.getElementById('topbar-sub').textContent = greet+', '+state.user.firstName+' 👋';
}

// ════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════
const PAGE_TITLES = {
  'pg-dashboard':'Dashboard','pg-income':'Income','pg-expenses':'Expenses',
  'pg-budget':'Budget','pg-savings':'Savings Goals','pg-reports':'Reports & Analytics',
  'pg-calendar':'Calendar','pg-alerts':'Alerts','pg-profile':'My Profile'
};

function navigate(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const page = document.getElementById(pageId);
  if(page) page.classList.add('active');
  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(n=>n.classList.add('active'));
  document.getElementById('topbar-title').textContent = PAGE_TITLES[pageId]||'';
  renderPage(pageId);
  window.scrollTo(0,0);
}

function renderPage(id){
  if(id==='pg-dashboard')  renderDashboard();
  if(id==='pg-income')     renderIncome();
  if(id==='pg-expenses')   renderExpenses();
  if(id==='pg-budget')     renderBudgetSettings();
  if(id==='pg-savings')    renderGoals();
  if(id==='pg-reports')    renderReports();
  if(id==='pg-calendar')   renderCalendar();
  if(id==='pg-alerts')     renderAlerts();
}

// ════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════
function renderDashboard(){
  const inc = totalIncome();
  const exp = totalExpense();
  const sav = inc - exp;
  document.getElementById('dash-income').textContent  = fmt(inc);
  document.getElementById('dash-expense').textContent = fmt(exp);
  document.getElementById('dash-savings').textContent = fmt(Math.max(0,sav));
  const incPct = state.user&&state.user.monthlyIncome ? Math.round(inc/state.user.monthlyIncome*100) : 0;
  document.getElementById('dash-income-sub').innerHTML  = `<span class="up">↑ ${incPct}%</span> of monthly target`;
  document.getElementById('dash-expense-sub').innerHTML = `<span class="${exp>inc?'dn':'up'}">${exp>inc?'⚠️ Over':'✓ Under'}</span> your income`;
  const savPct = inc>0?Math.round(sav/inc*100):0;
  document.getElementById('dash-savings-sub').innerHTML = `<span class="${sav<0?'dn':'up'}">${Math.max(0,savPct)}%</span> of total income saved`;

  const now=new Date();
  document.getElementById('dash-budget-month').textContent = now.toLocaleString('default',{month:'long'})+' '+now.getFullYear();

  // Alert banner
  const spend = spendByGroup();
  let exceeded=[];
  Object.entries(spend).forEach(([g,s])=>{ if(state.budgets[g]&&s>state.budgets[g]) exceeded.push(g); });
  const banner=document.getElementById('alert-banner');
  if(exceeded.length){
    document.getElementById('alert-banner-text').innerHTML = `⚠️ &nbsp;<strong>${exceeded.join(', ')}</strong> budget exceeded!`;
    banner.style.display='flex';
    document.getElementById('notif-dot').style.display='block';
    document.getElementById('alert-badge').textContent=exceeded.length;
  } else {
    banner.style.display='none';
    document.getElementById('notif-dot').style.display='none';
    document.getElementById('alert-badge').textContent='0';
    document.getElementById('alert-badge').style.display='none';
  }

  // Chart
  renderChart();

  // Recent transactions
  const recent = [...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const el=document.getElementById('recent-txns');
  if(!recent.length){ el.innerHTML='<div class="empty-state"><div class="e-ico">📭</div><p>No transactions yet.</p></div>'; }
  else el.innerHTML = recent.map(txnHTML).join('');

  // Budget bars
  renderBudgetBars('dash-budget-bars');

  // Goals
  renderGoalsMini();

  // AI
  renderAI();
}

function renderChart(){
  const now=new Date(); const m=now.getMonth(); const y=now.getFullYear();
  // Group by week
  const weeks=[{inc:0,exp:0},{inc:0,exp:0},{inc:0,exp:0},{inc:0,exp:0}];
  state.transactions.forEach(t=>{
    const d=new Date(t.date);
    if(d.getMonth()!==m||d.getFullYear()!==y) return;
    const w=Math.min(3,Math.floor((d.getDate()-1)/7));
    if(t.type==='income') weeks[w].inc+=t.amount;
    else weeks[w].exp+=t.amount;
  });
  const maxVal=Math.max(...weeks.flatMap(w=>[w.inc,w.exp]),1);
  const el=document.getElementById('chart-bars');
  el.innerHTML=weeks.map((w,i)=>`
    <div class="bar-group">
      <div class="bar-wrap">
        <div class="bar" style="height:${Math.max(4,w.inc/maxVal*120)}px;background:linear-gradient(180deg,#4ade80,#0d9488);" title="Income: ${fmt(w.inc)}"></div>
        <div class="bar" style="height:${Math.max(w.exp?4:0,w.exp/maxVal*120)}px;background:linear-gradient(180deg,#f87171,#dc2626);" title="Expense: ${fmt(w.exp)}"></div>
      </div>
      <div class="bar-label">W${i+1}</div>
    </div>`).join('');
}

function txnHTML(t){
  const ico=catIcon(t.category||t.source);
  const amt=t.type==='income'?`<span class="txn-amt plus">+${fmt(t.amount)}</span>`:`<span class="txn-amt minus">-${fmt(t.amount)}</span>`;
  const label=t.category||t.source;
  return `<div class="txn-item">
    <div class="txn-ico" style="background:${t.type==='income'?'#dcfce7':'#fff7ed'}">${ico}</div>
    <div class="txn-info"><div class="txn-name">${t.desc||label}</div><div class="txn-cat">${label} · ${formatDate(t.date)}</div></div>
    <div>${amt}<div class="txn-dt">${t.date}</div></div>
  </div>`;
}

function formatDate(d){
  const dt=new Date(d); const today2=new Date();
  if(dt.toDateString()===today2.toDateString()) return 'Today';
  const y=new Date(today2); y.setDate(today2.getDate()-1);
  if(dt.toDateString()===y.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}

function renderBudgetBars(containerId){
  const spend=spendByGroup();
  const groups=Object.keys(state.budgets).filter(g=>state.budgets[g]>0);
  const el=document.getElementById(containerId);
  if(!groups.length){ el.innerHTML='<div class="empty-state"><div class="e-ico">📋</div><p>No budgets set.</p></div>'; return; }
  el.innerHTML=groups.map(g=>{
    const used=spend[g]||0; const lim=state.budgets[g];
    const pct=Math.min(100,Math.round(used/lim*100));
    const cls=pct>=100?'fr':pct>=80?'fa':'fg';
    const col=pct>=100?'var(--red)':pct>=80?'var(--amber)':'var(--text)';
    return `<div class="budget-item">
      <div class="budget-row">
        <div class="budget-cat">${catIcon(g)} ${g}</div>
        <div class="budget-nums"><strong style="color:${col}">${fmt(used)}</strong> / ${fmt(lim)}</div>
      </div>
      <div class="prog"><div class="prog-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function renderGoalsMini(){
  const el=document.getElementById('dash-goals');
  if(!state.goals.length){ el.innerHTML='<div class="empty-state"><div class="e-ico">🎯</div><p>No goals yet.</p></div>'; return; }
  el.innerHTML=state.goals.slice(0,2).map(g=>{
    const pct=Math.min(100,Math.round(g.saved/g.target*100));
    return `<div class="goal-card">
      <div class="goal-row"><div class="goal-name">${g.name}</div><div class="goal-pct">${pct}%</div></div>
      <div class="goal-amts">Saved <span>${fmt(g.saved)}</span> of <span>${fmt(g.target)}</span></div>
      <div class="prog"><div class="prog-fill ${pct>=100?'fg':pct>=60?'fg':'fa'}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function renderAI(){
  const spend=spendByGroup();
  const inc=totalIncome();
  const exp=totalExpense();
  const tip=document.getElementById('ai-tip');
  const body=document.getElementById('ai-body');
  // Find biggest overspend
  let worst=null,worstAmt=0;
  Object.entries(spend).forEach(([g,s])=>{
    if(state.budgets[g]&&s>state.budgets[g]&&s-state.budgets[g]>worstAmt){
      worst=g; worstAmt=s-state.budgets[g];
    }
  });
  if(worst){
    tip.textContent=`Overspending on ${worst} by ${fmt(worstAmt)}`;
    body.textContent=`You've exceeded your ${worst} budget. Consider reducing spend in this area to stay on track this month.`;
  } else if(exp>0&&inc>0){
    const savePct=Math.round((inc-exp)/inc*100);
    tip.textContent=savePct>=30?`Great job! You're saving ${savePct}% 🎉`:`You're saving ${savePct}% of your income`;
    body.textContent=savePct>=30?'You\'re doing great! Keep it up and you\'ll hit your savings goals soon.':`Try to save at least 30% of your income. Review your spending to find areas to cut.`;
  } else {
    tip.textContent='Start tracking to get insights!';
    body.textContent='Add income and expenses to receive personalised financial tips.';
  }
}

// ════════════════════════════════════════
//  INCOME PAGE
// ════════════════════════════════════════
function renderIncome(){
  const sources=['Pocket Allowance','Part-Time Job','Freelancing','Tutoring / Teaching','Small Business','Other'];
  const totals={};
  state.transactions.filter(t=>t.type==='income').forEach(t=>{ totals[t.source]=(totals[t.source]||0)+t.amount; });
  document.getElementById('income-sources').innerHTML=sources.map(s=>`
    <div class="income-source-card" onclick="openModal('mod-income');document.getElementById('i-source').value='${s}'">
      <div class="s-ico">${catIcon(s)}</div>
      <div class="s-name">${s}</div>
      <div class="s-total">${totals[s]?fmt(totals[s]):'Tap to add'}</div>
    </div>`).join('');
  const incomes=[...state.transactions].filter(t=>t.type==='income').sort((a,b)=>new Date(b.date)-new Date(a.date));
  const el=document.getElementById('income-list');
  if(!incomes.length){ el.innerHTML='<div class="empty-state"><div class="e-ico">💰</div><p>No income recorded yet.</p></div>'; return; }
  el.innerHTML=incomes.map(t=>`
    <div class="txn-item">
      <div class="txn-ico" style="background:#dcfce7">${catIcon(t.source)}</div>
      <div class="txn-info"><div class="txn-name">${t.source}</div><div class="txn-cat">${t.desc||''} · ${t.date}</div></div>
      <div><span class="txn-amt plus">+${fmt(t.amount)}</span><div class="txn-dt"><button onclick="deleteTxn('${t.id}')" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:13px;">✕</button></div></div>
    </div>`).join('');
}

// ════════════════════════════════════════
//  EXPENSES PAGE
// ════════════════════════════════════════
function renderExpenses(){
  const expenses=[...state.transactions].filter(t=>t.type==='expense').sort((a,b)=>new Date(b.date)-new Date(a.date));
  const el=document.getElementById('expense-list');
  if(!expenses.length){ el.innerHTML='<div class="empty-state"><div class="e-ico">🧾</div><p>No expenses recorded yet.</p></div>'; return; }
  el.innerHTML=expenses.map(t=>`
    <div class="txn-item">
      <div class="txn-ico" style="background:#fff7ed">${catIcon(t.category)}</div>
      <div class="txn-info"><div class="txn-name">${t.desc||t.category}</div><div class="txn-cat">${t.category} · ${t.date}</div></div>
      <div><span class="txn-amt minus">-${fmt(t.amount)}</span><div class="txn-dt"><button onclick="deleteTxn('${t.id}')" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:13px;">✕</button></div></div>
    </div>`).join('');
}

// ════════════════════════════════════════
//  BUDGET SETTINGS
// ════════════════════════════════════════
const BUDGET_CATS = ['Food & Snacks','Academic','Transportation','Accommodation','Digital & Tech','Entertainment','Health','Personal','Others'];
function renderBudgetSettings(){
  document.getElementById('budget-set-list').innerHTML = BUDGET_CATS.map(g=>`
    <div class="budget-set-item">
      <div class="budget-set-ico">${catIcon(g)}</div>
      <div class="budget-set-name">${g}</div>
      <div class="pfx"><span class="sym" style="font-size:13px;">₹</span><input class="budget-set-input" id="bs-${g.replace(/[^a-z]/gi,'')}" type="number" value="${state.budgets[g]||0}" placeholder="0"/></div>
    </div>`).join('');
  renderBudgetBars('budget-usage-list');
}

function saveBudgets(){
  BUDGET_CATS.forEach(g=>{
    const el=document.getElementById('bs-'+g.replace(/[^a-z]/gi,''));
    if(el) state.budgets[g]=+el.value||0;
  });
  saveUserData();
  renderBudgetBars('budget-usage-list');
  showToast('Budgets saved! ✓');
}

// ════════════════════════════════════════
//  SAVINGS GOALS
// ════════════════════════════════════════
function addGoal(){
  const name=document.getElementById('g-name').value.trim();
  const target=+document.getElementById('g-target').value;
  const saved=+document.getElementById('g-saved').value||0;
  if(!name||!target){ showToast('Please fill in goal name and target.','warn'); return; }
  state.goals.push({id:uid(),name,target,saved});
  saveUserData();
  document.getElementById('g-name').value='';
  document.getElementById('g-target').value='';
  document.getElementById('g-saved').value='';
  renderGoals();
}

function renderGoals(){
  const el=document.getElementById('goals-list');
  if(!state.goals.length){ el.innerHTML='<div class="empty-state"><div class="e-ico">🎯</div><p>No savings goals yet. Add your first one above!</p></div>'; return; }
  el.innerHTML=state.goals.map(g=>{
    const pct=Math.min(100,Math.round(g.saved/g.target*100));
    return `<div class="goal-card card" style="padding:0;">
      <div class="card-body">
        <div class="goal-row">
          <div class="goal-name">${g.name}</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="goal-pct">${pct}%</div>
            <button onclick="deleteGoal('${g.id}')" style="background:none;border:none;cursor:pointer;color:var(--muted);">✕</button>
          </div>
        </div>
        <div class="goal-amts">Saved <span>${fmt(g.saved)}</span> of <span>${fmt(g.target)}</span> · ${pct>=100?'🎉 Goal reached!':fmt(g.target-g.saved)+' to go'}</div>
        <div class="prog"><div class="prog-fill ${pct>=100?'fg':pct>=60?'fg':'fa'}" style="width:${pct}%"></div></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <input type="number" id="gs-add-${g.id}" placeholder="Add amount" style="flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:9px;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;"/>
          <button class="btn btn-teal btn-sm" onclick="addToGoal('${g.id}')">Add ₹</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function addToGoal(id){
  const inp=document.getElementById('gs-add-'+id);
  const amt=+inp.value; if(!amt){ return; }
  const g=state.goals.find(g=>g.id===id);
  if(g){ g.saved=Math.min(g.target,g.saved+amt); saveUserData(); renderGoals(); showToast('Savings updated! ✓'); }
}

function deleteGoal(id){
  state.goals=state.goals.filter(g=>g.id!==id);
  saveUserData(); renderGoals();
}

// ════════════════════════════════════════
//  REPORTS
// ════════════════════════════════════════
function renderReports(){
  const spend=spendByGroup();
  const total=Object.values(spend).reduce((s,v)=>s+v,0)||1;
  const COLORS=['#0d9488','#2563eb','#d97706','#dc2626','#7c3aed','#059669','#0891b2','#db2777','#84cc16'];
  const groups=Object.entries(spend).filter(([,v])=>v>0);

  // Pie chart (SVG)
  let startAngle=-90, paths='', legendHTML='';
  groups.forEach(([g,v],i)=>{
    const pct=v/total; const angle=pct*360;
    const r=70; const cx=80; const cy=80;
    const start=polarToXY(cx,cy,r,startAngle);
    const end=polarToXY(cx,cy,r,startAngle+angle);
    const large=angle>180?1:0;
    paths+=`<path d="M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${large},1 ${end.x},${end.y} Z" fill="${COLORS[i%COLORS.length]}" opacity=".9"/>`;
    legendHTML+=`<div class="pie-legend-item"><div class="pie-dot" style="background:${COLORS[i%COLORS.length]}"></div><span>${g}: ${fmt(v)} (${Math.round(pct*100)}%)</span></div>`;
    startAngle+=angle;
  });

  document.getElementById('pie-chart-wrap').innerHTML = groups.length
    ? `<div class="pie-wrap"><svg class="pie-svg" width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="#f1f5f9"/>${paths}<circle cx="80" cy="80" r="38" fill="white"/><text x="80" y="85" text-anchor="middle" font-size="12" fill="#1e293b" font-family="DM Sans">${fmt(total)}</text></svg><div class="pie-legend">${legendHTML}</div></div>`
    : '<div class="empty-state"><div class="e-ico">📊</div><p>No expenses to show.</p></div>';

  // Monthly summary
  const inc=totalIncome(); const exp=totalExpense();
  document.getElementById('monthly-summary').innerHTML=`
    <div style="display:grid;gap:12px;">
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-weight:600;">Total Income</span><span style="color:var(--teal);font-weight:700;">${fmt(inc)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-weight:600;">Total Expenses</span><span style="color:var(--red);font-weight:700;">${fmt(exp)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-weight:600;">Net Savings</span><span style="color:${inc-exp>=0?'var(--teal)':'var(--red)'};font-weight:700;">${fmt(inc-exp)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-weight:600;">Savings Rate</span><span style="font-weight:700;">${inc>0?Math.round((inc-exp)/inc*100):0}%</span></div>
    </div>`;

  // All transactions
  const all=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('all-txns-report').innerHTML=all.length?all.map(txnHTML).join(''):'<div class="empty-state"><div class="e-ico">📭</div><p>No transactions yet.</p></div>';
}

function polarToXY(cx,cy,r,angle){
  const rad=(angle*Math.PI)/180;
  return { x: cx+r*Math.cos(rad), y: cy+r*Math.sin(rad) };
}

// ════════════════════════════════════════
//  CALENDAR
// ════════════════════════════════════════
function renderCalendar(){
  const m=state.calMonth; const y=state.calYear;
  const title=new Date(y,m,1).toLocaleString('default',{month:'long',year:'numeric'});
  document.getElementById('cal-title').textContent=title;
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('cal-headers').innerHTML=days.map(d=>`<div class="cal-day-header">${d}</div>`).join('');
  const first=new Date(y,m,1).getDay();
  const last=new Date(y,m+1,0).getDate();
  const today2=new Date(); 
  let html='';
  for(let i=0;i<first;i++) html+=`<div class="cal-day other-month"></div>`;
  for(let d=1;d<=last;d++){
    const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayTxns=state.transactions.filter(t=>t.date===dateStr);
    const hasInc=dayTxns.some(t=>t.type==='income');
    const hasExp=dayTxns.some(t=>t.type==='expense');
    const isToday=d===today2.getDate()&&m===today2.getMonth()&&y===today2.getFullYear();
    html+=`<div class="cal-day${isToday?' today':''}" onclick="showCalDay('${dateStr}')">
      <div class="cal-day-num">${d}</div>
      ${hasInc?'<div class="cal-dot inc"></div>':''}
      ${hasExp?'<div class="cal-dot exp"></div>':''}
    </div>`;
  }
  document.getElementById('cal-days').innerHTML=html;
}

function changeMonth(dir){
  state.calMonth+=dir;
  if(state.calMonth>11){ state.calMonth=0; state.calYear++; }
  if(state.calMonth<0){ state.calMonth=11; state.calYear--; }
  renderCalendar();
  document.getElementById('cal-detail').style.display='none';
}

function showCalDay(dateStr){
  const dayTxns=state.transactions.filter(t=>t.date===dateStr);
  const el=document.getElementById('cal-detail');
  const title=document.getElementById('cal-detail-title');
  const body=document.getElementById('cal-detail-body');
  title.textContent=new Date(dateStr+'T00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
  if(!dayTxns.length){ body.innerHTML='<div class="empty-state"><div class="e-ico">📭</div><p>No transactions on this day.</p></div>'; }
  else body.innerHTML=dayTxns.map(txnHTML).join('');
  el.style.display='block';
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ════════════════════════════════════════
//  ALERTS
// ════════════════════════════════════════
function renderAlerts(){
  const spend=spendByGroup();
  const alerts=[];
  Object.entries(spend).forEach(([g,s])=>{
    if(!state.budgets[g]) return;
    const lim=state.budgets[g];
    if(s>lim) alerts.push({ico:'🔴',bg:'var(--red-light)',msg:`<strong>${g}</strong> budget exceeded by ${fmt(s-lim)}`,time:'This month'});
    else if(s>lim*0.8) alerts.push({ico:'🟡',bg:'var(--amber-light)',msg:`<strong>${g}</strong> is ${Math.round(s/lim*100)}% used — approaching limit`,time:'This month'});
  });
  state.goals.forEach(g=>{
    const pct=Math.round(g.saved/g.target*100);
    if(pct>=100) alerts.push({ico:'🎉',bg:'var(--green-light)',msg:`Savings goal <strong>${g.name}</strong> reached!`,time:'Goal complete'});
  });
  document.getElementById('alert-badge').textContent=alerts.filter(a=>a.ico==='🔴').length||'';
  document.getElementById('alert-badge').style.display=alerts.length?'':'none';
  const el=document.getElementById('alerts-list');
  if(!alerts.length){ el.innerHTML='<div class="empty-state" style="padding:48px 20px;"><div class="e-ico">&#x2705;</div><p>No alerts &mdash; you are on track! Great job.</p></div>'; return; }
  el.innerHTML=alerts.map(a=>`
    <div class="alert-item">
      <div class="a-ico" style="background:${a.bg}">${a.ico}</div>
      <div><div class="a-msg">${a.msg}</div><div class="a-time">${a.time}</div></div>
    </div>`).join('');
}

// ════════════════════════════════════════
//  ADD INCOME / EXPENSE
// ════════════════════════════════════════
function saveIncome(){
  const amt=+document.getElementById('i-amount').value;
  const source=document.getElementById('i-source').value;
  const date=document.getElementById('i-date').value||today();
  const notes=document.getElementById('i-notes').value.trim();
  if(!amt||amt<=0){ showToast('Please enter a valid amount.','warn'); return; }
  state.transactions.push({id:uid(),type:'income',source,amount:amt,desc:notes,date});
  saveUserData();
  closeModal('mod-income');
  document.getElementById('i-amount').value='';
  document.getElementById('i-notes').value='';
  renderDashboard();
  showToast('Income added! ✓');
}

function saveExpense(){
  const amt=+document.getElementById('e-amount').value;
  const cat=document.getElementById('e-cat').value;
  const desc=document.getElementById('e-desc').value.trim();
  const date=document.getElementById('e-date').value||today();
  if(!amt||amt<=0){ showToast('Please enter a valid amount.','warn'); return; }
  // Check budget
  const group=getGroup(cat);
  const spend=spendByGroup();
  const used=(spend[group]||0)+amt;
  const lim=state.budgets[group];
  if(lim&&used>lim){
    state.pendingExpense={id:uid(),type:'expense',category:cat,amount:amt,desc,date};
    document.getElementById('warn-msg').innerHTML=`Adding this will exceed your <strong>${group}</strong> budget.`;
    document.getElementById('warn-nums').textContent=`${fmt(used)} of ${fmt(lim)} budget used`;
    closeModal('mod-expense');
    openModal('mod-warn');
    return;
  }
  commitExpense({id:uid(),type:'expense',category:cat,amount:amt,desc,date});
}

function confirmExpense(){
  closeModal('mod-warn');
  if(state.pendingExpense){ commitExpense(state.pendingExpense); state.pendingExpense=null; }
}

function commitExpense(t){
  state.transactions.push(t);
  saveUserData();
  document.getElementById('e-amount').value='';
  document.getElementById('e-desc').value='';
  renderDashboard();
  showToast('Expense added! ✓');
}

function deleteTxn(id){
  state.transactions=state.transactions.filter(t=>t.id!==id);
  saveUserData();
  renderDashboard();
  const cur=document.querySelector('.page.active');
  if(cur) renderPage(cur.id);
  showToast('Deleted.');
}

// ════════════════════════════════════════
//  PROFILE
// ════════════════════════════════════════
function saveProfile(){
  const name=document.getElementById('p-name').value.trim().split(' ');
  const income=+document.getElementById('p-income').value||0;
  state.user.firstName=name[0]||state.user.firstName;
  state.user.lastName=name.slice(1).join(' ')||'';
  state.user.monthlyIncome=income;
  saveUserData();
  updateUserUI();
  showToast('Profile saved! ✓');
}

// ════════════════════════════════════════
//  MODALS
// ════════════════════════════════════════
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click',function(e){ if(e.target===this) this.classList.remove('open'); });
});

// ════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════
function showToast(msg,type='ok'){
  let t=document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; document.body.appendChild(t);
    t.style.cssText='position:fixed;bottom:24px;right:24px;padding:11px 20px;border-radius:10px;font-family:DM Sans,sans-serif;font-size:13.5px;font-weight:600;z-index:9999;transition:opacity .3s;box-shadow:0 4px 20px rgba(0,0,0,.15);'; }
  t.style.background=type==='warn'?'var(--amber)':'var(--navy)';
  t.style.color='#fff';
  t.textContent=msg;
  t.style.opacity='1';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{ t.style.opacity='0'; },2500);
}

// ════════════════════════════════════════
//  NAV CLICKS
// ════════════════════════════════════════
document.querySelectorAll('.nav-item[data-page]').forEach(btn=>{
  btn.addEventListener('click',()=>navigate(btn.dataset.page));
});

// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
// Show login on load
document.getElementById('page-login').classList.add('visible');
