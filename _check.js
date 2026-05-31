
// ── CONSTANTS ──────────────────────────────────────────────────────────────
const ACC_COLORS=['#F0924A','#4A78C4','#5A9068','#C45555','#8B6CC8','#C49830','#4AA8A8','#A86870'];
const ACC_TYPES=[
  {id:'cash',name:'現金',icon:'💵'},{id:'bank',name:'銀行',icon:'🏦'},
  {id:'credit',name:'信用卡',icon:'💳'},{id:'invest',name:'投資',icon:'📈'},{id:'other',name:'其他',icon:'💰'},
];
const DEFAULT_ACCOUNTS=[
  {id:'cash',name:'現金',type:'cash',icon:'💵',color:'#F0924A',init:0},
  {id:'bank1',name:'銀行帳戶',type:'bank',icon:'🏦',color:'#4A78C4',init:0},
];
const DEFAULT_EXP_CATS=[
  {id:'food',name:'餐飲',icon:'🍜',budget:0,subcats:[
    {id:'sc_breakfast',name:'早餐',icon:'🌅'},{id:'sc_lunch',name:'午餐',icon:'🍱'},
    {id:'sc_dinner',name:'晚餐',icon:'🍽️'},{id:'sc_drink',name:'飲料',icon:'🧋'},
  ]},
  {id:'transport',name:'交通',icon:'🚌',budget:0,subcats:[]},
  {id:'shopping',name:'購物',icon:'🛍️',budget:0,subcats:[]},
  {id:'entertain',name:'娛樂',icon:'🎮',budget:0,subcats:[]},
  {id:'health',name:'醫療',icon:'💊',budget:0,subcats:[]},
  {id:'housing',name:'住宅',icon:'🏠',budget:0,subcats:[]},
  {id:'education',name:'教育',icon:'📚',budget:0,subcats:[]},
  {id:'other_e',name:'其他',icon:'📦',budget:0,subcats:[]},
];
const DEFAULT_INC_CATS=[
  {id:'salary',name:'薪資',icon:'💰',budget:0,subcats:[]},
  {id:'parttime',name:'兼職',icon:'💼',budget:0,subcats:[]},
  {id:'invest_i',name:'投資',icon:'📈',budget:0,subcats:[]},
  {id:'gift',name:'禮金',icon:'🎁',budget:0,subcats:[]},
  {id:'other_i',name:'其他',icon:'➕',budget:0,subcats:[]},
];
const MONTHS=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const EMOJI_QUICK=['🍜','🍱','🍽️','🍔','🍕','🧋','☕','🥗','🍰','🎂','🥩','🍣','🥘','🌮',
  '🚌','🚗','🚆','✈️','🛵','🚲','⛽','🚕',
  '🛍️','👗','👟','💄','🧴','👜','💍','🎁','🧸',
  '🎮','🎬','🎵','🎨','🎲','📱','🎭','🎯',
  '💊','🏥','🩺','🏃','💪','🧘','🌿',
  '🏠','🔑','🪴','🛋️','💡','🔧',
  '📚','📖','✏️','🎓','💻','🖊️',
  '💰','💳','📦','⭐','🌟','❤️','🌈','🐱','🐶','🌸','🌺','🎀'];

const INS_TYPES=['壽險','醫療險','意外險','車險','產險','其他'];
const INS_TCOLORS={'壽險':'#5A9068','醫療險':'#4A78C4','意外險':'#C49830','車險':'#C45555','產險':'#8B6CC8','其他':'#888888'};
const INS_TICONS={'壽險':'🛡️','醫療險':'🏥','意外險':'⚡','車險':'🚗','產險':'🏠','其他':'📋'};
const INS_FREQS=[{id:'yearly',label:'每年'},{id:'semi',label:'每半年'},{id:'quarterly',label:'每季'},{id:'monthly',label:'每月'}];

// ── INDEXEDDB (PDF storage) ────────────────────────────────────────────────
let _idb=null;
function openIDB(){
  if(_idb)return Promise.resolve(_idb);
  return new Promise((res,rej)=>{
    const r=indexedDB.open('budget_ins_db',1);
    r.onupgradeneeded=e=>{if(!e.target.result.objectStoreNames.contains('pdfs'))e.target.result.createObjectStore('pdfs',{keyPath:'id'});};
    r.onsuccess=e=>{_idb=e.target.result;res(_idb);};
    r.onerror=()=>rej(r.error);
  });
}
function idbPut(id,data,name){return openIDB().then(db=>new Promise((res,rej)=>{const tx=db.transaction('pdfs','readwrite');tx.objectStore('pdfs').put({id,data,name});tx.oncomplete=res;tx.onerror=()=>rej(tx.error);}));}
function idbGet(id){return openIDB().then(db=>new Promise((res,rej)=>{const r=db.transaction('pdfs','readonly').objectStore('pdfs').get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));}
function idbDel(id){return openIDB().then(db=>new Promise((res,rej)=>{const tx=db.transaction('pdfs','readwrite');tx.objectStore('pdfs').delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);}));}

// ── STORAGE ────────────────────────────────────────────────────────────────
function load(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}

// ── STATE ──────────────────────────────────────────────────────────────────
const _now=new Date();
let state={
  view:'add',
  txs:load('budget_txs',[]),
  accounts:load('budget_accounts',DEFAULT_ACCOUNTS),
  cats:{expense:load('budget_cats_exp',DEFAULT_EXP_CATS),income:load('budget_cats_inc',DEFAULT_INC_CATS)},
  emergencyFund:load('budget_ef',{accountId:null}),
  form:null,
  calMonth:{y:_now.getFullYear(),m:_now.getMonth()},
  statsMonth:{y:_now.getFullYear(),m:_now.getMonth()},
  histFilter:'all',
  histPeriod:'month',
  settingsTab:'main',
  catTypeTab:'expense',
  nickname:load('budget_nickname',''),
  homeDayOffset:0,
  dreamFund:load('budget_df',{accountId:null,target:0,wish:''}),
  accHideBalance:load('budget_hide_bal',false),
  loans:load('budget_loans',[]),
  fixedExpenses:load('budget_fixed',[]),
  insurances:load('budget_insurances',[]),
  insFilter:'all',
  assetsTab:'accounts',
  statsView:'month',
  statsYear:{y:_now.getFullYear()},
  modal:null,
  editForm:{},
};
state.form=defaultForm();
// 啟動時自動處理到期固定費用
setTimeout(()=>{const n=processFixedExpenses();if(n>0)showToast(`已自動記入 ${n} 筆固定費用 ✓`);},300);

function defaultForm(){
  const accs=state?state.accounts:DEFAULT_ACCOUNTS;
  const fromId=accs[0]?.id||'cash';
  const toId=accs[1]?.id||fromId;
  return{type:'expense',category:'food',subCategory:'',amount:'',
    date:todayStr(),note:'',accountId:fromId,installment:0,
    fromAccountId:fromId,toAccountId:toId};
}
function saveAll(){
  save('budget_txs',state.txs);
  save('budget_accounts',state.accounts);
  save('budget_cats_exp',state.cats.expense);
  save('budget_cats_inc',state.cats.income);
  save('budget_ef',state.emergencyFund);
  save('budget_nickname',state.nickname);
  save('budget_df',state.dreamFund);
  save('budget_hide_bal',state.accHideBalance);
  save('budget_loans',state.loans);
  save('budget_fixed',state.fixedExpenses);
  save('budget_insurances',state.insurances);
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function todayStr(){return new Date().toISOString().split('T')[0]}
function fmt(n){return Math.abs(n).toLocaleString('zh-TW')}
function fmtS(n){return(n>=0?'+':'-')+'$'+fmt(n)}
function getCat(type,id){
  return(type==='income'?state.cats.income:state.cats.expense).find(c=>c.id===id)||{name:id,icon:'📌',budget:0,subcats:[]};
}
function getSubCat(cat,subId){return cat.subcats?.find(s=>s.id===subId)||null}
function getAcc(id){return state.accounts.find(a=>a.id===id)||{name:'',icon:'💰',color:'#F0924A',init:0}}
function monthTxs(y,m){
  return state.txs.filter(t=>{const d=new Date(t.date);return d.getFullYear()===y&&d.getMonth()===m;});
}
function calcSum(txs){
  const ops=txs.filter(t=>t.type!=='transfer');
  const income=ops.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense=ops.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const nec=ops.filter(t=>t.necessity==='必要').reduce((s,t)=>s+t.amount,0);
  const want=ops.filter(t=>t.necessity==='想要').reduce((s,t)=>s+t.amount,0);
  return{income,expense,nec,want,balance:income-expense};
}
function accBalance(id){
  const acc=getAcc(id);
  return(acc.init||0)+state.txs.reduce((s,t)=>{
    if(t.type==='transfer'){
      if(t.fromAccountId===id)return s-t.amount;
      if(t.toAccountId===id)return s+t.amount;
      return s;
    }
    if(t.accountId!==id)return s;
    return t.type==='income'?s+t.amount:s-t.amount;
  },0);
}
function calcEFTarget(){
  const n=new Date();let total=0,cnt=0;
  for(let i=1;i<=3;i++){
    let y=n.getFullYear(),m=n.getMonth()-i;
    if(m<0){m+=12;y--;}
    const exp=monthTxs(y,m).filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    if(exp>0){total+=exp;cnt++;}
  }
  return cnt>0?(total/cnt)*6:0;
}
function relDate(ds){
  const d=new Date(ds+'T00:00:00'),t=new Date();t.setHours(0,0,0,0);
  const diff=Math.round((t-d)/86400000);
  if(diff===0)return'今天';if(diff===1)return'昨天';
  const dd=new Date(ds+'T00:00:00');return`${dd.getMonth()+1}/${dd.getDate()}`;
}
function offsetDate(off){const d=new Date();d.setDate(d.getDate()+off);return d.toISOString().split('T')[0]}
function showToast(msg){
  const old=document.querySelector('.toast');if(old)old.remove();
  const el=document.createElement('div');el.className='toast';el.textContent=msg;
  document.body.appendChild(el);setTimeout(()=>el.remove(),2500);
}

// ── ACTIONS ────────────────────────────────────────────────────────────────
function addTransfer(){
  const amt=parseFloat(state.form.amount);
  if(!amt||amt<=0){showToast('請輸入正確金額');return;}
  if(!state.form.fromAccountId||!state.form.toAccountId){showToast('請選擇帳戶');return;}
  if(state.form.fromAccountId===state.form.toAccountId){showToast('請選擇不同的帳戶');return;}
  state.txs.unshift({
    id:Date.now()+Math.random().toString(36).slice(2),
    date:state.form.date,type:'transfer',
    fromAccountId:state.form.fromAccountId,
    toAccountId:state.form.toAccountId,
    accountId:state.form.fromAccountId,
    amount:amt,note:state.form.note.trim(),
    necessity:null,category:'transfer',subCategory:null,
  });
  saveAll();state.form=defaultForm();state.modal=null;showToast('轉帳已記錄 ✓');renderApp();
}
function addTx(){
  const amt=parseFloat(state.form.amount);
  if(!amt||amt<=0){showToast('請輸入正確金額');return;}
  const acc=getAcc(state.form.accountId);
  const n=acc.type==='credit'&&state.form.type==='expense'?(parseInt(state.form.installment)||0):0;
  if(n>=2){
    const per=Math.floor(amt/n);
    const baseDate=new Date(state.form.date+'T00:00:00');
    const baseNote=state.form.note.trim();
    for(let i=0;i<n;i++){
      const tm=baseDate.getMonth()+i;
      const yn=baseDate.getFullYear()+Math.floor(tm/12),mn=((tm%12)+12)%12;
      const maxD=new Date(yn,mn+1,0).getDate();
      const dd=Math.min(baseDate.getDate(),maxD);
      const ds=`${yn}-${String(mn+1).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
      const monthAmt=i===0?amt-per*(n-1):per;
      state.txs.unshift({
        id:`${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        date:ds,type:state.form.type,necessity:null,
        category:state.form.category,subCategory:state.form.subCategory||null,
        amount:monthAmt,
        note:baseNote?`${baseNote} · 分${n}期第${i+1}期`:`分${n}期第${i+1}期`,
        accountId:state.form.accountId,
      });
    }
    saveAll();state.form=defaultForm();state.modal=null;showToast(`已拆為 ${n} 筆分期記錄 ✓`);renderApp();
  } else {
    state.txs.unshift({
      id:Date.now()+Math.random().toString(36).slice(2),
      date:state.form.date,type:state.form.type,necessity:null,
      category:state.form.category,subCategory:state.form.subCategory||null,
      amount:amt,note:state.form.note.trim(),accountId:state.form.accountId,
    });
    saveAll();state.form=defaultForm();state.modal=null;showToast('已儲存 ✓');renderApp();
  }
}
function updateTx(){
  const f=state.editForm;
  const amt=parseFloat(f.amount);
  if(!amt||amt<=0){showToast('請輸入正確金額');return;}
  const idx=state.txs.findIndex(t=>t.id===f.id);
  if(idx<0)return;
  state.txs[idx]={...state.txs[idx],
    date:f.date,type:f.type,category:f.category,
    subCategory:f.subCategory||null,amount:amt,
    note:(f.note||'').trim(),accountId:f.accountId,
    necessity:f.necessity||null,
  };
  saveAll();state.modal=null;showToast('已更新 ✓');renderApp();
}
function getInstallmentInfo(tx){
  const m=(tx.note||'').match(/^(.*?)(?:\s*·\s*)?分(\d+)期第\d+期$/);
  if(!m)return null;
  return{baseNote:m[1].trim(),total:parseInt(m[2])};
}
function findRelatedInstallments(tx){
  const info=getInstallmentInfo(tx);if(!info)return null;
  const related=state.txs.filter(t=>{
    const ti=getInstallmentInfo(t);if(!ti)return false;
    return ti.baseNote===info.baseNote&&ti.total===info.total&&t.accountId===tx.accountId&&t.category===tx.category&&t.type===tx.type;
  });
  return related.length>1?related:null;
}
function deleteTx(id){
  const tx=state.txs.find(t=>t.id===id);if(!tx)return;
  const related=findRelatedInstallments(tx);
  if(related){
    if(!confirm(`此筆為分期消費，刪除後將一併刪除全部 ${related.length} 期記錄，確定刪除？`))return;
    const ids=new Set(related.map(t=>t.id));
    state.txs=state.txs.filter(t=>!ids.has(t.id));
  }else{
    if(!confirm('確定刪除這筆記錄？'))return;
    state.txs=state.txs.filter(t=>t.id!==id);
  }
  saveAll();state.modal=null;renderApp();
}
function setNecessity(txId,val){
  const tx=state.txs.find(t=>t.id===txId);
  if(!tx)return;
  tx.necessity=val||null;
  saveAll();
  // 更新 nec-mini 按鈕 class
  document.querySelectorAll(`[data-a="setNec"][data-id="${txId}"]`).forEach(b=>{
    b.classList.remove('an','aw','au');
    if(b.dataset.v==='必要'&&val==='必要')b.classList.add('an');
    else if(b.dataset.v==='想要'&&val==='想要')b.classList.add('aw');
    else if(!b.dataset.v&&!val)b.classList.add('au');
  });
  // 更新 tx-item 裡的 nec-tag
  const mini=document.querySelector(`[data-a="setNec"][data-id="${txId}"]`)?.closest('.nec-mini');
  const txMeta=mini?.previousElementSibling?.querySelector('.tx-meta');
  if(txMeta){
    const old=txMeta.querySelector('.nec-tag');
    if(val){
      const html=`<span class="nec-tag ${val==='必要'?'n':'w'}">${val}</span>`;
      old?old.outerHTML=html:txMeta.insertAdjacentHTML('beforeend',html);
    }else{old?.remove();}
  }
}
function saveAccount(){
  const f=state.editForm;
  if(!f.name?.trim()){showToast('請輸入帳戶名稱');return;}
  const obj={...f,init:parseFloat(f.init)||0,creditLimit:parseFloat(f.creditLimit)||0,
    billingDay:parseInt(f.billingDay)||0,paymentDay:parseInt(f.paymentDay)||0};
  if(f.id){const i=state.accounts.findIndex(a=>a.id===f.id);if(i>=0)state.accounts[i]=obj;}
  else state.accounts.push({...obj,id:'acc_'+Date.now()});
  saveAll();state.modal=null;renderApp();
}
function deleteAccount(id){
  if(state.txs.some(t=>t.accountId===id)){showToast('此帳戶有記錄，無法刪除');return;}
  if(!confirm('確定刪除此帳戶？'))return;
  state.accounts=state.accounts.filter(a=>a.id!==id);
  saveAll();renderApp();
}
function saveCat(){
  const f=state.editForm;
  if(!f.name?.trim()){showToast('請輸入類別名稱');return;}
  const type=f.catType||'expense';
  const obj={id:f.id||'cat_'+Date.now(),name:f.name,icon:f.icon||'🏷️',
    budget:parseFloat(f.budget)||0,subcats:f.subcats||[]};
  if(f.id){const i=state.cats[type].findIndex(c=>c.id===f.id);if(i>=0)state.cats[type][i]=obj;}
  else state.cats[type].push(obj);
  saveAll();state.modal=null;renderApp();
}
function deleteCat(type,id){
  if(state.txs.some(t=>t.category===id)){showToast('此類別有記錄，無法刪除');return;}
  if(!confirm('確定刪除此類別？'))return;
  state.cats[type]=state.cats[type].filter(c=>c.id!==id);
  saveAll();renderApp();
}

function saveLoan(){
  const f=state.editForm;
  if(!f.loanName?.trim()){showToast('請輸入貸款名稱');return;}
  const yrs=parseFloat(f.loanYears)||0;
  if(f.loanYears&&yrs<=0){showToast('貸款年限需大於 0');return;}
  const obj={id:f.loanId||'loan_'+Date.now(),name:f.loanName,icon:f.loanIcon||'🏠',
    totalAmount:parseFloat(f.loanTotal)||0,remainingAmount:parseFloat(f.loanRemaining)||0,
    monthlyPayment:parseFloat(f.loanMonthly)||0,rate:parseFloat(f.loanRate)||0,
    years:yrs,startDate:f.loanStart||todayStr(),color:f.loanColor||ACC_COLORS[0]};
  if(f.loanId){const i=state.loans.findIndex(l=>l.id===f.loanId);if(i>=0)state.loans[i]=obj;}
  else state.loans.push(obj);
  saveAll();state.modal=null;showToast('已儲存 ✓');renderApp();
}
function deleteLoan(id){
  if(!confirm('確定刪除此貸款記錄？'))return;
  state.loans=state.loans.filter(l=>l.id!==id);
  saveAll();renderApp();
}
function saveFixed(){
  const f=state.editForm;
  if(!f.fixedName?.trim()){showToast('請輸入名稱');return;}
  const obj={id:f.fixedId||'fixed_'+Date.now(),name:f.fixedName,icon:f.fixedIcon||'📋',
    amount:parseFloat(f.fixedAmount)||0,frequency:f.fixedFreq||'monthly',
    accountId:f.fixedAccountId||'',nextDate:f.fixedNext||todayStr(),
    color:f.fixedColor||ACC_COLORS[2],catId:f.fixedCatId||'other_e',
    active:f.fixedActive!==false};
  if(f.fixedId){const i=state.fixedExpenses.findIndex(x=>x.id===f.fixedId);if(i>=0)state.fixedExpenses[i]=obj;}
  else state.fixedExpenses.push(obj);
  saveAll();state.modal=null;showToast('已儲存 ✓');renderApp();
}
function processFixedExpenses(){
  const today=todayStr();let created=0;
  state.fixedExpenses.forEach(f=>{
    if(f.active===false||!f.nextDate)return;
    let iter=0;
    while(f.nextDate<=today&&iter<36){
      iter++;
      if(!state.txs.some(t=>t.fixedId===f.id&&t.date===f.nextDate)){
        state.txs.unshift({
          id:'fx_'+f.id+'_'+f.nextDate.replace(/-/g,''),
          date:f.nextDate,type:'expense',necessity:null,
          category:f.catId||'other_e',subCategory:null,
          amount:f.amount,note:f.name,
          accountId:f.accountId||state.accounts[0]?.id||'',
          fixedId:f.id,
        });
        created++;
      }
      const d=new Date(f.nextDate+'T00:00:00');
      if(f.frequency==='monthly')d.setMonth(d.getMonth()+1);
      else if(f.frequency==='quarterly')d.setMonth(d.getMonth()+3);
      else d.setFullYear(d.getFullYear()+1);
      f.nextDate=d.toISOString().split('T')[0];
    }
  });
  if(created>0){saveAll();}
  return created;
}
function deleteFixed(id){
  if(!confirm('確定刪除此固定費用？'))return;
  state.fixedExpenses=state.fixedExpenses.filter(x=>x.id!==id);
  saveAll();renderApp();
}

// ── INSURANCE HELPERS ─────────────────────────────────────────────────────
function insStatus(ins){
  const now=new Date();now.setHours(0,0,0,0);
  if(ins.endDate){const e=new Date(ins.endDate+'T00:00:00');if(e<now)return{label:'已到期',cls:'expired'};const d=Math.round((e-now)/86400000);if(d<=30)return{label:`${d}天後到期`,cls:'expiring'};}
  if(ins.renewalDate){const r=new Date(ins.renewalDate+'T00:00:00');const d=Math.round((r-now)/86400000);if(d>=0&&d<=30)return{label:`${d}天後繳費`,cls:'expiring'};}
  if(ins.startDate&&new Date(ins.startDate+'T00:00:00')>now)return{label:'未生效',cls:'expiring'};
  return{label:'生效中',cls:'active'};
}
function insYearlyPremium(ins){
  const m={yearly:1,semi:2,quarterly:4,monthly:12};
  return(ins.premium||0)*(m[ins.premFreq||'yearly']||1);
}
function insAlerts(){
  return state.insurances.filter(ins=>insStatus(ins).cls==='expiring');
}

// ── PDF HELPERS ────────────────────────────────────────────────────────────
function loadPdfJs(){
  return new Promise(res=>{
    if(window.pdfjsLib){res(window.pdfjsLib);return;}
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload=()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';res(pdfjsLib);};
    document.head.appendChild(s);
  });
}
async function extractPdfText(buf){
  const pdfjs=await loadPdfJs();
  const pdf=await pdfjs.getDocument({data:buf}).promise;
  let text='';
  for(let i=1;i<=Math.min(pdf.numPages,5);i++){
    const pg=await pdf.getPage(i);
    const c=await pg.getTextContent();
    text+=c.items.map(x=>x.str).join(' ')+'\n';
  }
  return text;
}
function parseInsText(text){
  const r={};
  const pno=text.match(/保單號碼[：:﹕]\s*([A-Z0-9\-]{4,20})/)||text.match(/契約編號[：:﹕]\s*([A-Z0-9\-]{4,20})/)||text.match(/保單號[：:]\s*([A-Z0-9\-]{4,20})/);
  if(pno)r.policyNo=pno[1].trim();
  const cos=['國泰人壽','富邦人壽','南山人壽','新光人壽','台灣人壽','中國人壽','遠雄人壽','第一金人壽','三商美邦','全球人壽','安聯人壽','保誠人壽','宏泰人壽','元大人壽','台銀人壽','凱基人壽','富邦產險','國泰產險','新光產險','明台產險'];
  for(const c of cos){if(text.includes(c)){r.company=c;break;}}
  if(!r.company){const m=text.match(/([^\s]{2,6}(?:人壽|產險|保險))/);if(m)r.company=m[1];}
  const prem=text.match(/年繳保費[：:\s]*[NT$]*\s*([\d,，]+)/)||text.match(/每年保費[：:\s]*[NT$]*\s*([\d,，]+)/)||text.match(/保費[：:\s]*[NT$]*\s*([\d,，]+)/);
  if(prem){const v=parseInt(prem[1].replace(/[,，]/g,''));if(v>100)r.premium=v;}
  const dates=[];
  [...text.matchAll(/(\d{2,3})年\s*(\d{1,2})月\s*(\d{1,2})日/g)].slice(0,8).forEach(m=>{
    const roc=parseInt(m[1]),mo=String(m[2]).padStart(2,'0'),dd=String(m[3]).padStart(2,'0');
    const yr=roc<500?roc+1911:roc;
    if(yr>=2000&&yr<=2060)dates.push(`${yr}-${mo}-${dd}`);
  });
  if(dates.length>=1)r.startDate=dates[0];
  if(dates.length>=2)r.endDate=dates[dates.length-1];
  return r;
}

function saveIns(){
  const f=state.editForm;
  const obj={
    id:f.id||'ins_'+Date.now(),
    name:(f.insName||'').trim()||(f.insCompany||'保單'),
    company:(f.insCompany||'').trim(),type:f.insType||'壽險',
    policyNo:(f.insPolicyNo||'').trim(),insured:(f.insInsured||'').trim(),
    premium:parseFloat(f.insPremium)||0,premFreq:f.premFreq||'yearly',
    startDate:f.insStart||'',endDate:f.insEnd||'',renewalDate:f.insRenewal||'',
    coverage:(f.insCoverage||'').trim(),pdfId:f.pdfId||null,pdfName:f.pdfName||'',
  };
  const finish=(pdfId,pdfName)=>{
    if(pdfId)obj.pdfId=pdfId;if(pdfName)obj.pdfName=pdfName;
    if(f.id){const i=state.insurances.findIndex(x=>x.id===f.id);if(i>=0)state.insurances[i]=obj;}
    else state.insurances.push(obj);
    save('budget_insurances',state.insurances);
    state.modal=null;showToast('保單已儲存 ✓');renderApp();
  };
  if(f._pdfData){
    const pid=f.pdfId||'pdf_'+Date.now();
    idbPut(pid,f._pdfData,f._pdfName||'保單.pdf').then(()=>finish(pid,f._pdfName||'保單.pdf')).catch(()=>finish(null,null));
  }else{finish(null,null);}
}
function deleteIns(id){
  if(!confirm('確定刪除此保單記錄？'))return;
  const ins=state.insurances.find(i=>i.id===id);
  if(ins?.pdfId)idbDel(ins.pdfId).catch(()=>{});
  state.insurances=state.insurances.filter(i=>i.id!==id);
  save('budget_insurances',state.insurances);renderApp();
}

// ── RENDER: FRAMEWORK ──────────────────────────────────────────────────────
function renderModalOnly(){
  if(!state.modal){renderApp();return;}
  const ov=document.getElementById('modal-overlay');
  if(!ov){
    document.getElementById('app').insertAdjacentHTML('beforeend',renderModal());
    bindOverlay();attachInputs();return;
  }
  const tmp=document.createElement('div');
  tmp.innerHTML=renderModal();
  const nM=tmp.querySelector('.modal'),cM=ov.querySelector('.modal');
  if(nM&&cM){cM.innerHTML=nM.innerHTML;}
  else{ov.outerHTML=renderModal();}
  bindOverlay();attachInputs();
}
// 直接更新 class，完全不碰 DOM 結構
function dmActive(sel,v){document.querySelectorAll(sel).forEach(b=>b.classList.toggle('active',b.dataset.v===v));}
function dmSel(sel,v,cls='sel'){document.querySelectorAll(sel).forEach(b=>b.classList.toggle(cls,b.dataset.v===v));}
function renderApp(){
  document.getElementById('app').innerHTML=
    renderTopBar()+renderView()+(state.modal?renderModal():'')+renderBottomNav()+
    '';
  attachInputs();bindOverlay();
  if(state.view==='stats'&&state.statsView==='month')setTimeout(()=>drawDonut(),50);
  if(state.view==='calendar')setTimeout(()=>drawDonut('cal-donut',state.calMonth.y,state.calMonth.m),50);
}
function renderTopBar(){
  const tabs=[{id:'add',ico:'🏠',lbl:'首頁'},{id:'calendar',ico:'📅',lbl:'行事曆'},
    {id:'assets',ico:'🏦',lbl:'資產'},{id:'stats',ico:'📊',lbl:'統計'},
    {id:'history',ico:'📋',lbl:'歷史'},{id:'insurance',ico:'🛡️',lbl:'保險'},
    {id:'settings',ico:'⚙️',lbl:'設定'}];
  return`<div class="top-bar"><div class="tbi"><div class="top-logo">🏡 記帳本</div>
    <nav class="top-nav">${tabs.map(t=>
      `<button class="tnb${state.view===t.id?' active':''}" data-nav="${t.id}"><span>${t.ico}</span>${t.lbl}</button>`
    ).join('')}</nav></div></div>`;
}
function renderBottomNav(){
  const tabs=[{id:'add',ico:'🏠',lbl:'首頁'},{id:'calendar',ico:'📅',lbl:'行事曆'},
    {id:'assets',ico:'🏦',lbl:'資產'},{id:'stats',ico:'📊',lbl:'統計'},
    {id:'history',ico:'📋',lbl:'歷史'},{id:'insurance',ico:'🛡️',lbl:'保險'},
    {id:'settings',ico:'⚙️',lbl:'設定'}];
  return`<nav class="bottom-nav">${tabs.map(t=>
    `<button class="nav-btn${state.view===t.id?' active':''}" data-nav="${t.id}">
      <span class="nav-ico">${t.ico}</span><span class="nav-lbl">${t.lbl}</span></button>`
  ).join('')}</nav>`;
}
function renderModal(){
  const{type}=state.modal;
  if(type==='addTx')return renderAddModal();
  if(type==='day')return renderDayModal(state.modal.data);
  if(type==='sum')return renderSumModal(state.modal.data);
  if(type==='editAcc')return renderEditAccModal();
  if(type==='editCat')return renderEditCatModal();
  if(type==='editTx')return renderEditTxModal();
  if(type==='editEF')return renderEditEFModal();
  if(type==='editDF')return renderEditDFModal();
  if(type==='nickModal')return renderNickModal();
  if(type==='editLoan')return renderEditLoanModal();
  if(type==='editFixed')return renderEditFixedModal();
  if(type==='editIns')return renderEditInsModal();
  if(type==='viewPDF')return renderViewPdfModal();
  return'';
}
function renderView(){
  switch(state.view){
    case'add':return renderHomeView();
    case'calendar':return renderCalView();
    case'assets':return renderAssetsView();
    case'accounts':return renderAssetsView();
    case'stats':return renderStatsView();
    case'history':return renderHistView();
    case'insurance':return renderInsView();
    case'settings':return renderSettingsView();
  }return'';
}

function creditCardReminders(){
  const now=new Date();now.setHours(0,0,0,0);
  const res=[];
  state.accounts.filter(a=>a.type==='credit'&&a.paymentDay).forEach(a=>{
    const day=parseInt(a.paymentDay);
    let d=new Date(now.getFullYear(),now.getMonth(),day);
    if(d<now)d=new Date(now.getFullYear(),now.getMonth()+1,day);
    const days=Math.round((d-now)/86400000);
    if(days<=7)res.push({acc:a,date:d,days});
  });
  return res.sort((a,b)=>a.days-b.days);
}

// ── RENDER: HOME ───────────────────────────────────────────────────────────
function renderHomeView(){
  const n=new Date();
  const sum=calcSum(monthTxs(n.getFullYear(),n.getMonth()));

  // Emergency fund
  const ef=state.emergencyFund;
  const efAcc=ef.accountId?getAcc(ef.accountId):null;
  const efBal=efAcc?accBalance(ef.accountId):null;
  const efTarget=ef.targetAmount>0?ef.targetAmount:calcEFTarget();
  const efPct=efTarget>0&&efBal!==null?Math.min(Math.round((efBal/efTarget)*100),100):null;

  // Dream fund
  const df=state.dreamFund;
  const dfAcc=df.accountId?getAcc(df.accountId):null;
  const dfBal=dfAcc?accBalance(df.accountId):null;
  const dfPct=df.target>0&&dfBal!==null?Math.min(Math.round((dfBal/df.target)*100),100):null;

  // Day navigation
  const dayStr=offsetDate(state.homeDayOffset);
  const dayD=new Date(dayStr+'T00:00:00');
  const dayTxs=state.txs.filter(t=>t.date===dayStr);
  const dayLabel=state.homeDayOffset===0?'今天':state.homeDayOffset===-1?'昨天':`${dayD.getMonth()+1}/${dayD.getDate()}`;

  const efCard=`<div class="card ef-card">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <div style="font-size:12px;font-weight:800;color:#7A4848;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🛡️ 緊急預備金</div>
      <button class="icon-btn edit" data-a="editEF" style="flex-shrink:0">✏️</button>
    </div>
    <div class="ef-bal" style="color:${(efBal||0)>=0?'var(--income)':'var(--expense)'}">$${fmt(efBal||0)}</div>
    <div class="ef-bar-wrap">
      <div class="bar-bg" style="height:6px">
        <div class="bar-fill ${(efPct||0)<50?'over':(efPct||0)<80?'warn':'ok'}" style="width:${efPct||0}%"></div>
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:3px">
        ${efTarget>0?`${efPct||0}% · 目標 $${fmt(efTarget)}`:'尚未設定目標'}
      </div>
    </div>
    <div class="ef-hint" style="margin-top:4px">${efAcc?`${efAcc.icon} ${efAcc.name}`:'尚未連結帳戶'}</div>
  </div>`;

  const dfCard=`<div class="card" style="background:linear-gradient(135deg,#FBF4F3,#F5ECEA);border-color:#E0CECC">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:800;color:#7A4848;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🌟 夢想基金</div>
        ${df.wish?`<div style="font-size:10px;color:#906060;font-weight:600;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">「${df.wish}」</div>`:''}
      </div>
      <button class="icon-btn edit" data-a="editDF" style="flex-shrink:0">✏️</button>
    </div>
    <div class="ef-bal" style="color:${(dfBal||0)>=0?'var(--income)':'var(--expense)'}">$${fmt(dfBal||0)}</div>
    <div class="ef-bar-wrap">
      <div class="bar-bg" style="height:6px">
        <div class="bar-fill ok" style="width:${dfPct||0}%"></div>
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:3px">
        ${df.target>0?`${dfPct||0}% · 目標 $${fmt(df.target)}`:'尚未設定目標'}
      </div>
    </div>
    <div class="ef-hint" style="margin-top:4px">${dfAcc?`${dfAcc.icon} ${dfAcc.name}`:'尚未連結帳戶'}</div>
  </div>`;

  const dayE=dayTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const dayI=dayTxs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);

  return`<div class="hdr"><div class="hdr-in">
    <h1>${n.getFullYear()}年${n.getMonth()+1}月</h1>
    <div class="sum-bar">
      <div class="sum-item"><div class="lbl">本月收入</div><div class="val">$${fmt(sum.income)}</div></div>
      <div class="sum-item"><div class="lbl">本月支出</div><div class="val">$${fmt(sum.expense)}</div></div>
      <div class="sum-item"><div class="lbl">結餘</div>
        <div class="val" style="color:${sum.balance>=0?'#1A7A50':'#B02828'}">$${fmt(sum.balance)}</div>
      </div>
    </div>
  </div></div>
  <div class="content">
    ${(()=>{const rs=creditCardReminders();return rs.length?`<div class="card" style="background:linear-gradient(135deg,#FBF4F3,#F5ECEA);border-color:#E0CECC;margin-bottom:12px">
      <div style="font-size:12px;font-weight:800;color:#7A4848;margin-bottom:8px">💳 繳款提醒</div>
      ${rs.map(r=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:20px">${r.acc.icon}</span>
        <span style="flex:1;font-size:14px;font-weight:700">${r.acc.name}</span>
        <span style="font-size:13px;color:${r.days<=2?'var(--expense)':'var(--text2)'}">
          ${r.date.getMonth()+1}/${r.date.getDate()} 繳款${r.days===0?' · 今天':r.days===1?' · 明天':` · ${r.days}天後`}
        </span>
      </div>`).join('')}
    </div>`:'';})()}
    <div class="add-layout" style="margin-bottom:12px">${efCard}${dfCard}</div>
    <button class="save-btn" data-a="openAdd" style="margin-bottom:12px">📝 記一筆</button>
    <div class="card">
      <div class="day-nav">
        <button class="day-nb" data-a="homeDayPrev">‹</button>
        <span style="font-size:14px;font-weight:700;color:var(--text2)">
          ${dayD.getMonth()+1}月${dayD.getDate()}日
        </span>
        <button class="day-nb" data-a="homeDayNext"${state.homeDayOffset>=0?' disabled':''}>›</button>
      </div>
      ${dayTxs.length>0?dayTxs.map(t=>txItem(t,true,false)).join(''):`<div class="empty" style="padding:24px 0"><div class="ei" style="font-size:36px">📭</div><p>這天沒有記錄</p></div>`}
    </div>
  </div>`;
}

function renderAddModal(){
  const f=state.form;
  const typeToggle=`<div class="type-toggle">
      <button class="type-btn${f.type==='income'?' ai':''}" data-a="type" data-v="income">＋ 收入</button>
      <button class="type-btn${f.type==='expense'?' ae':''}" data-a="type" data-v="expense">－ 支出</button>
      <button class="type-btn${f.type==='transfer'?' at':''}" data-a="type" data-v="transfer">🔄 轉帳</button>
    </div>`;
  if(f.type==='transfer'){
    return`<div class="overlay" id="modal-overlay"><div class="modal" style="max-height:90vh">
      <div class="modal-handle"></div>
      ${typeToggle}
      <div class="amt-wrap">
        <span class="amt-pre">$</span>
        <input class="amt-input" id="amt" type="number" inputmode="decimal" placeholder="0" value="${f.amount}" autofocus>
      </div>
      <div class="slabel">從哪個帳戶</div>
      <div class="acc-row" style="margin-bottom:14px;flex-wrap:wrap">${state.accounts.map(acc=>
        `<button class="acc-pill${f.fromAccountId===acc.id?' active':''}"
          style="--acc-c:${acc.color}" data-a="setFromAcc" data-v="${acc.id}">${acc.icon} ${acc.name}</button>`
      ).join('')}</div>
      <div class="slabel">轉到哪個帳戶</div>
      <div class="acc-row" style="margin-bottom:14px;flex-wrap:wrap">${state.accounts.map(acc=>
        `<button class="acc-pill${f.toAccountId===acc.id?' active':''}"
          style="--acc-c:${acc.color};${acc.id===f.fromAccountId?'opacity:.4;pointer-events:none':''}"
          data-a="setToAcc" data-v="${acc.id}">${acc.icon} ${acc.name}</button>`
      ).join('')}</div>
      <div class="form-row">
        <div class="form-field"><label>日期</label>
          <input class="form-input" id="fdate" type="date" value="${f.date}"></div>
        <div class="form-field"><label>備註</label>
          <input class="form-input" id="fnote" type="text" placeholder="選填" value="${f.note}"></div>
      </div>
      <button class="save-btn" data-a="save">儲存轉帳</button>
    </div></div>`;
  }
  const cats=f.type==='income'?state.cats.income:state.cats.expense;
  const selCatExists=cats.some(c=>c.id===f.category);
  if(!selCatExists){state.form.category=cats[0]?.id||'';state.form.subCategory='';}
  const selCat=cats.find(c=>c.id===f.category);
  const subcats=selCat?.subcats||[];
  const selAcc=state.accounts.find(a=>a.id===f.accountId);
  const isCredit=selAcc?.type==='credit';
  return`<div class="overlay" id="modal-overlay"><div class="modal" style="max-height:90vh">
    <div class="modal-handle"></div>
    ${typeToggle}
    <div class="amt-wrap">
      <span class="amt-pre">$</span>
      <input class="amt-input" id="amt" type="number" inputmode="decimal" placeholder="0" value="${f.amount}" autofocus>
    </div>
    <div class="slabel">類別</div>
    <div class="cat-grid">${cats.map(c=>
      `<button class="cat-btn${f.category===c.id?' ac':''}" data-a="cat" data-v="${c.id}">
        <span class="ci">${c.icon}</span><span>${c.name}</span></button>`
    ).join('')}</div>
    ${subcats.length>0?`
    <div class="slabel">細分類別</div>
    <div class="subcat-row">
      <button class="subcat-btn${!f.subCategory?' as':''}" data-a="subcat" data-v="">不細分</button>
      ${subcats.map(s=>
        `<button class="subcat-btn${f.subCategory===s.id?' as':''}" data-a="subcat" data-v="${s.id}">${s.icon||''} ${s.name}</button>`
      ).join('')}
    </div>`:''}
    ${state.accounts.length>0?`
    <div class="slabel">帳戶</div>
    <div class="acc-row">${state.accounts.map(acc=>
      `<button class="acc-pill${f.accountId===acc.id?' active':''}"
        style="--acc-c:${acc.color}" data-a="setAcc" data-v="${acc.id}">${acc.icon} ${acc.name}</button>`
    ).join('')}</div>`:''}
    ${isCredit&&f.type==='expense'?`
    <div class="slabel">信用卡分期</div>
    <div class="acc-row" style="margin-bottom:${(f.installment||0)>=2?'8px':'14px'}">
      <button class="acc-pill${(f.installment||0)===0?' active':''}" style="--acc-c:var(--latte)" data-a="setInstall" data-v="0">不分期</button>
      <button class="acc-pill${(f.installment||0)===3?' active':''}" style="--acc-c:var(--latte)" data-a="setInstall" data-v="3">3 期</button>
      <button class="acc-pill${(f.installment||0)===6?' active':''}" style="--acc-c:var(--latte)" data-a="setInstall" data-v="6">6 期</button>
      <button class="acc-pill${(f.installment||0)===9?' active':''}" style="--acc-c:var(--latte)" data-a="setInstall" data-v="9">9 期</button>
    </div>
    ${(f.installment||0)>=2&&f.amount?`<div style="font-size:12px;color:var(--text2);background:var(--bg);padding:8px 12px;border-radius:8px;margin-bottom:14px;line-height:1.7">
      共 ${f.installment} 筆 · 首期 <b>$${(parseFloat(f.amount)-Math.floor(parseFloat(f.amount)/f.installment)*(f.installment-1)).toLocaleString('zh-TW')}</b> · 之後每月 <b>$${Math.floor(parseFloat(f.amount)/f.installment).toLocaleString('zh-TW')}</b>
    </div>`:''}`:''}
    <div class="form-row">
      <div class="form-field"><label>日期</label>
        <input class="form-input" id="fdate" type="date" value="${f.date}"></div>
      <div class="form-field"><label>備註</label>
        <input class="form-input" id="fnote" type="text" placeholder="選填" value="${f.note}"></div>
    </div>
    <button class="save-btn" data-a="save">儲存記錄</button>
  </div></div>`;
}

// ── RENDER: ACCOUNTS ───────────────────────────────────────────────────────
function renderAccountsView(){
  const hide=state.accHideBalance;
  const total=state.accounts.reduce((s,acc)=>s+accBalance(acc.id),0);
  const rows=state.accounts.map(acc=>{
    const bal=accBalance(acc.id);
    const type=ACC_TYPES.find(t=>t.id===acc.type);
    const isCredit=acc.type==='credit';
    const balColor=hide?'var(--text2)':isCredit?(bal<0?'var(--expense)':'var(--income)'):(bal>=0?'var(--income)':'var(--expense)');
    const balText=hide?'••••':isCredit?`待繳 $${fmt(Math.abs(bal))}`:`$${fmt(bal)}`;
    return`<div class="setting-row">
      <div class="setting-ico" style="background:var(--bg);border:1px solid var(--border)">${acc.icon}</div>
      <div class="setting-info">
        <div class="setting-name">${acc.name}</div>
        <div class="setting-sub">${type?.name||acc.type}${acc.creditLimit>0?` · 額度 $${fmt(acc.creditLimit)}`:''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:17px;font-weight:800;color:${balColor}">${balText}</span>
        <div style="display:flex;gap:4px">
          <button class="icon-btn edit" data-a="editAcc" data-v="${acc.id}">✏️</button>
          <button class="icon-btn del" data-a="delAcc" data-v="${acc.id}">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
  return`<div class="hdr"><div class="hdr-in">
    <h1>帳戶總覽</h1>
    <div style="display:flex;align-items:center;gap:12px;margin-top:14px">
      <div>
        <div style="font-size:13px;opacity:.85">淨資產</div>
        <div style="font-size:34px;font-weight:800">${hide?'••••••':'$'+fmt(total)}</div>
      </div>
      <button class="cal-nb" data-a="toggleHideBal" style="font-size:18px">${hide?'🙈':'👁'}</button>
    </div>
  </div></div>
  <div class="content"><div class="card">
    ${rows}
    <button class="add-fab" data-a="newAcc">＋ 新增帳戶</button>
  </div></div>`;
}

// ── RENDER: ASSETS ─────────────────────────────────────────────────────────
function renderAssetsView(){
  const hide=state.accHideBalance;
  const acsBal=state.accounts.map(a=>({id:a.id,b:accBalance(a.id)}));
  const totalAssets=acsBal.filter(x=>x.b>0).reduce((s,x)=>s+x.b,0);
  const ccDebt=acsBal.filter(x=>x.b<0).reduce((s,x)=>s+Math.abs(x.b),0);
  const loanDebt=state.loans.reduce((s,l)=>s+(l.remainingAmount||0),0);
  const netWorth=totalAssets-ccDebt-loanDebt;
  const tab=(state.assetsTab==='fixed'?'accounts':state.assetsTab)||'accounts';
  const subTabs=[{id:'accounts',lbl:'帳戶'},{id:'loans',lbl:'貸款'}];
  let content='';
  if(tab==='accounts'){
    const rows=state.accounts.map(acc=>{
      const bal=accBalance(acc.id);const type=ACC_TYPES.find(t=>t.id===acc.type);
      const isCredit=acc.type==='credit';
      const balColor=hide?'var(--text2)':isCredit?(bal<0?'var(--expense)':'var(--income)'):(bal>=0?'var(--income)':'var(--expense)');
      const balText=hide?'* * * *':isCredit?`待繳 $${fmt(Math.abs(bal))}`:`$${fmt(bal)}`;
      return`<div class="setting-row">
        <div class="setting-ico" style="background:var(--bg);border:1px solid var(--border)">${acc.icon}</div>
        <div class="setting-info"><div class="setting-name">${acc.name}</div>
          <div class="setting-sub">${type?.name||acc.type}${acc.creditLimit>0?` · 額度 $${fmt(acc.creditLimit)}`:''}</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:17px;font-weight:800;color:${balColor}">${balText}</span>
          <div style="display:flex;gap:4px">
            <button class="icon-btn edit" data-a="editAcc" data-v="${acc.id}">✏️</button>
            <button class="icon-btn del" data-a="delAcc" data-v="${acc.id}">🗑️</button>
          </div>
        </div>
      </div>`;}).join('');
    content=`<div class="card">${rows}<button class="add-fab" data-a="newAcc">＋ 新增帳戶</button></div>`;
  } else if(tab==='loans'){
    const totalDebt=state.loans.reduce((s,l)=>s+(l.remainingAmount||0),0);
    const totalMonthly=state.loans.reduce((s,l)=>s+(l.monthlyPayment||0),0);
    const rows=state.loans.map(l=>`<div class="setting-row">
      <div class="setting-ico" style="background:var(--bg);border:1px solid var(--border)">${l.icon}</div>
      <div class="setting-info"><div class="setting-name">${l.name}</div>
        <div class="setting-sub">每月 $${fmt(l.monthlyPayment)} · 利率 ${l.rate}%${l.years?` · ${l.years}年`:''}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:15px;font-weight:800;color:var(--expense)">$${fmt(l.remainingAmount)}</span>
        <div style="display:flex;gap:4px">
          <button class="icon-btn edit" data-a="editLoan" data-v="${l.id}">✏️</button>
          <button class="icon-btn del" data-a="delLoan" data-v="${l.id}">🗑️</button>
        </div>
      </div></div>`).join('');
    content=`${totalDebt>0?`<div class="card" style="background:linear-gradient(135deg,#FBF4F3,#F5ECEA);border-color:#E0CECC;margin-bottom:12px;display:flex;gap:24px">
      <div><div style="font-size:11px;color:var(--text2);font-weight:700">總負債</div><div style="font-size:22px;font-weight:800;color:var(--expense)">$${fmt(totalDebt)}</div></div>
      <div><div style="font-size:11px;color:var(--text2);font-weight:700">每月還款</div><div style="font-size:22px;font-weight:800">$${fmt(totalMonthly)}</div></div>
    </div>`:''}
    <div class="card">${rows||`<div class="empty" style="padding:24px 0"><div class="ei" style="font-size:36px">🏦</div><p>尚無貸款記錄</p></div>`}
      <button class="add-fab" data-a="newLoan">＋ 新增貸款</button></div>`;
  }
  return`<div class="hdr"><div class="hdr-in">
    <h1>資產總覽</h1>
    <div style="margin-top:6px">
      <div style="font-size:13px;opacity:.85">家庭淨資產</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-size:30px;font-weight:800">${hide?'* * * *':'$'+fmt(Math.abs(netWorth))}</div>
        <button class="cal-nb" data-a="toggleHideBal" style="font-size:18px">${hide?'🙈':'👁'}</button>
      </div>
      ${!hide?`<div style="font-size:12px;opacity:.8;margin-top:2px">資產 $${fmt(totalAssets)} · 負債 $${fmt(ccDebt+loanDebt)}</div>`:''}
    </div>
  </div></div>
  <div class="content">
    <div class="stabs" style="margin-bottom:16px">
      ${subTabs.map(t=>`<button class="stab${tab===t.id?' active':''}" data-a="assetsTab" data-v="${t.id}">${t.lbl}</button>`).join('')}
    </div>
    ${content}
  </div>`;
}

// ── RENDER: CALENDAR ───────────────────────────────────────────────────────
function renderCalView(){
  const{y,m}=state.calMonth;
  const first=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();
  const today=todayStr();
  const txs=monthTxs(y,m);
  const sum=calcSum(txs);
  const dayMap={};
  txs.filter(t=>t.type==='expense').forEach(t=>{
    const d=parseInt(t.date.split('-')[2]);dayMap[d]=(dayMap[d]||0)+t.amount;
  });
  let cells=Array.from({length:first},()=>'<div class="cal-day empty"></div>').join('');
  for(let d=1;d<=days;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow=new Date(ds+'T00:00:00').getDay();
    const isToday=ds===today;const amt=dayMap[d];
    const amtStr=amt?'$'+(amt>=10000?(amt/10000).toFixed(1)+'萬':amt>=1000?(amt/1000).toFixed(1)+'k':String(Math.round(amt))):'';
    cells+=`<div class="cal-day${isToday?' today':''}${amt?' has-exp':''}${dow===0?' sun':dow===6?' sat':''}"
      data-a="openDay" data-v="${ds}">
      <span class="cdn">${d}</span>
      <span class="cda">${amtStr}</span>
    </div>`;
  }
  return`<div class="hdr"><div class="hdr-in">
    <div class="cal-nav">
      <button class="cal-nb" data-a="cprev">‹</button>
      <span class="cal-title-text">${y}年 ${MONTHS[m]}</span>
      <button class="cal-nb" data-a="cnext">›</button>
    </div>
    <div class="sum-bar">
      <div class="sum-item"><div class="lbl">收入</div><div class="val">$${fmt(sum.income)}</div></div>
      <div class="sum-item"><div class="lbl">支出</div><div class="val">$${fmt(sum.expense)}</div></div>
      <div class="sum-item"><div class="lbl">結餘</div>
        <div class="val" style="color:${sum.balance>=0?'#1A7A50':'#B02828'}">$${fmt(sum.balance)}</div>
      </div>
    </div>
  </div></div>
  <div class="content">
    <div class="card">
      <div class="weekdays">${['日','一','二','三','四','五','六'].map(d=>`<div class="wday">${d}</div>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
    </div>
    ${sum.expense>0?`<div class="card" style="margin-top:12px">
      <div class="card-title">本月必要 vs 想要</div>
      <div class="donut-wrap">
        <canvas id="cal-donut" width="120" height="120" style="flex-shrink:0"></canvas>
        <div class="donut-legend">
          <div class="leg-item"><div class="leg-dot" style="background:var(--nec)"></div>
            <span class="leg-lbl">必要</span><span class="leg-val" style="color:var(--nec)">$${fmt(sum.nec)}</span></div>
          <div class="leg-item"><div class="leg-dot" style="background:var(--want)"></div>
            <span class="leg-lbl">想要</span><span class="leg-val" style="color:var(--want)">$${fmt(sum.want)}</span></div>
          <div style="font-size:13px;color:var(--text2)">想要佔 ${Math.round((sum.want/(sum.expense||1))*100)}%</div>
        </div>
      </div>
    </div>`:''}
  </div>`;
}

function renderDayModal(date){
  const txs=state.txs.filter(t=>t.date===date);
  const d=new Date(date+'T00:00:00');
  const expTotal=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const incTotal=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const rows=txs.map(t=>{
    const cat=getCat(t.type,t.category);
    const sub=t.subCategory?getSubCat(cat,t.subCategory):null;
    const acc=getAcc(t.accountId);
    const catLabel=sub?`${cat.name} · ${sub.name}`:cat.name;
    const necRow=t.type==='expense'?`
    <div class="nec-mini">
      <button class="nec-mbtn${t.necessity==='必要'?' an':''}" data-a="setNec" data-id="${t.id}" data-v="必要">必要</button>
      <button class="nec-mbtn${t.necessity==='想要'?' aw':''}" data-a="setNec" data-id="${t.id}" data-v="想要">想要</button>
      <button class="nec-mbtn${!t.necessity?' au':''}" data-a="setNec" data-id="${t.id}" data-v="">未設定</button>
    </div>`:'';
    return`<div class="tx-item">
      <div class="tx-ico ${t.type}">${cat.icon}</div>
      <div class="tx-info">
        <div class="tx-cat">${catLabel}${t.note?' · '+t.note:''}</div>
        <div class="tx-meta">
          <span>${acc.icon} ${acc.name}</span>
          ${t.necessity?`<span class="nec-tag ${t.necessity==='必要'?'n':'w'}">${t.necessity}</span>`:''}
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amt ${t.type}">$${fmt(t.amount)}</div>
        <div class="tx-actions">
          <button class="icon-btn edit" data-a="openEditTx" data-v="${t.id}">✏️</button>
          <button class="icon-btn del" data-a="del" data-id="${t.id}">🗑️</button>
        </div>
      </div>
    </div>${necRow}`;
  }).join('');
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">${d.getMonth()+1}月${d.getDate()}日</div>
    ${txs.length===0?`<div class="empty"><div class="ei">📭</div><p>這天沒有記錄</p></div>`:rows}
  </div></div>`;
}

// ── RENDER: EDIT TX MODAL ──────────────────────────────────────────────────
function renderEditTxModal(){
  const f=state.editForm;
  const cats=f.type==='income'?state.cats.income:state.cats.expense;
  const selCat=cats.find(c=>c.id===f.category);
  const subcats=selCat?.subcats||[];
  const isInstallment=/分\d+期第\d+期/.test(f.note||'');
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">編輯記錄</div>
    <div class="type-toggle" style="margin-bottom:12px">
      <button class="type-btn${f.type==='income'?' ai':''}" data-a="ef-type" data-v="income">＋ 收入</button>
      <button class="type-btn${f.type==='expense'?' ae':''}" data-a="ef-type" data-v="expense">－ 支出</button>
    </div>
    <div class="amt-wrap" style="margin-bottom:${isInstallment?'4px':'12px'}">
      <span class="amt-pre">$</span>
      <input class="amt-input" id="ef-amt" type="number" inputmode="decimal" placeholder="0" value="${f.amount||''}"${isInstallment?' readonly style="opacity:.5;cursor:not-allowed"':''}>
    </div>
    ${isInstallment?`<div style="font-size:12px;color:var(--text2);margin-bottom:12px;padding:0 2px">⚠️ 分期消費金額不可修改</div>`:''}
    ${f.type==='expense'?`
    <div class="slabel">必要 / 想要</div>
    <div class="nec-row" style="margin-bottom:12px">
      <button class="nec-btn${f.necessity==='必要'?' an':''}" data-a="ef-nec" data-v="必要">✅ 必要支出</button>
      <button class="nec-btn${f.necessity==='想要'?' aw':''}" data-a="ef-nec" data-v="想要">🛒 想要購買</button>
      <button class="nec-btn${!f.necessity?' au':''}" data-a="ef-nec" data-v="">未設定</button>
    </div>`:''}
    <div class="slabel">類別</div>
    <div class="cat-grid" style="margin-bottom:12px">${cats.map(c=>
      `<button class="cat-btn${f.category===c.id?' ac':''}" data-a="ef-cat" data-v="${c.id}">
        <span class="ci">${c.icon}</span><span>${c.name}</span></button>`
    ).join('')}</div>
    ${subcats.length>0?`
    <div class="slabel">細分類別</div>
    <div class="subcat-row" style="margin-bottom:12px">
      <button class="subcat-btn${!f.subCategory?' as':''}" data-a="ef-subcat" data-v="">不細分</button>
      ${subcats.map(s=>
        `<button class="subcat-btn${f.subCategory===s.id?' as':''}" data-a="ef-subcat" data-v="${s.id}">${s.icon||''} ${s.name}</button>`
      ).join('')}
    </div>`:''}
    ${state.accounts.length>0?`
    <div class="slabel">帳戶</div>
    <div class="acc-row" style="margin-bottom:12px">${state.accounts.map(acc=>
      `<button class="acc-pill${f.accountId===acc.id?' active':''}"
        style="--acc-c:${acc.color}" data-a="ef-acc" data-v="${acc.id}">${acc.icon} ${acc.name}</button>`
    ).join('')}</div>`:''}
    <div class="form-row">
      <div class="form-field"><label>日期</label>
        <input class="form-input" id="ef-date" type="date" value="${f.date||''}"></div>
      <div class="form-field"><label>備註</label>
        <input class="form-input" id="ef-note" type="text" placeholder="選填" value="${f.note||''}"></div>
    </div>
    <div class="modal-btns">
      <button class="save-btn" data-a="updateTx">儲存變更</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}

// ── RENDER: STATS ──────────────────────────────────────────────────────────
function renderStatsView(){
  if(state.statsView==='year')return renderYearStatsView();
  const{y,m}=state.statsMonth;
  const txs=monthTxs(y,m);const sum=calcSum(txs);
  const catMap={};
  txs.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const catArr=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const catCard=catArr.length>0?`<div class="card">
    <div class="card-title">支出類別</div>
    ${catArr.map(([id,amt])=>{
      const cat=getCat('expense',id);const budget=cat.budget||0;
      const pct=budget>0?Math.min(Math.round((amt/budget)*100),150):null;
      const cls=pct===null?'ok':pct<70?'ok':pct<100?'warn':'over';
      return`<div class="bar-wrap">
        <div class="bar-lbl"><span>${cat.icon} ${cat.name}</span><span style="font-weight:800">$${fmt(amt)}</span></div>
        <div class="bar-bg"><div class="bar-fill ${cls}" style="width:${Math.round((amt/(catArr[0][1]||1))*100)}%"></div></div>
        ${budget>0?`<div class="budget-note">預算 $${fmt(budget)} · 已用 ${pct}%${pct>=100?' ⚠️':''}</div>`:''}
      </div>`;
    }).join('')}
  </div>`:'';
  const allMonths=[];
  {const ms=new Set(state.txs.map(t=>{const d=new Date(t.date);return`${d.getFullYear()}-${d.getMonth()}`}));
  const now=new Date();ms.add(`${now.getFullYear()}-${now.getMonth()}`);
  Array.from(ms).sort().reverse().forEach(k=>{const[ky,km]=k.split('-').map(Number);allMonths.push({y:ky,m:km});});}

  return`<div class="hdr"><div class="hdr-in">
    <div class="hdr-row">
      <div style="display:flex;align-items:center;gap:8px">
        <h1>月份統計</h1>
        <button class="stats-toggle-btn active" data-a="statsView" data-v="month">月</button>
        <button class="stats-toggle-btn" data-a="statsView" data-v="year">年</button>
      </div>
      <select id="stats-month-sel" class="stats-sel">
        ${allMonths.map(({y:my,m:mm})=>`<option value="${my}-${mm}" ${state.statsMonth.y===my&&state.statsMonth.m===mm?'selected':''} style="color:#2D1A0E;background:white">${my}年 ${MONTHS[mm]}</option>`).join('')}
      </select>
    </div>
    <div class="sum-bar">
      <div class="sum-item"><div class="lbl">收入</div><div class="val">$${fmt(sum.income)}</div></div>
      <div class="sum-item"><div class="lbl">支出</div><div class="val">$${fmt(sum.expense)}</div></div>
      <div class="sum-item"><div class="lbl">結餘</div>
        <div class="val" style="color:${sum.balance>=0?'#1A7A50':'#B02828'}">$${fmt(sum.balance)}</div>
      </div>
    </div>
  </div></div>
  <div class="content">
    ${txs.length===0?`<div class="empty" style="padding:60px 20px"><div class="ei">📊</div><p>本月還沒有記錄</p></div>`:`
    ${catCard||''}
    ${renderSumContent({y,m})}`}
  </div>`;
}

function renderSumContent({y,m}){
  const txs=monthTxs(y,m);const sum=calcSum(txs);
  const sr=sum.income>0?Math.round((sum.balance/sum.income)*100):0;
  const wr=sum.expense>0?Math.round((sum.want/sum.expense)*100):0;
  const catMap={};txs.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const top=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
  const insights=[];
  if(!txs.length)insights.push('本月還沒有記錄，快去新增第一筆吧！');
  else{
    if(sum.income===0)insights.push('本月尚未記錄收入，記得把薪資也加進來。');
    else if(sr>=30)insights.push(`太棒了！本月儲蓄率高達 ${sr}%，財務管理非常優秀！`);
    else if(sr>=20)insights.push(`不錯！儲蓄率 ${sr}%，已達 20% 目標。`);
    else if(sr>=0)insights.push(`儲蓄率 ${sr}%，建議目標設在 20% 以上。`);
    else insights.push(`⚠️ 本月超支 $${fmt(-sum.balance)}，要注意控制花費。`);
    if(sum.expense>0){
      if(wr>50)insights.push(`「想要」支出佔 ${wr}%，超過半數為非必要消費，可試著減少衝動購物。`);
      else if(wr>0)insights.push(`「想要」支出佔比 ${wr}%，消費自律做得不錯！`);
    }
    if(top){const cat=getCat('expense',top[0]);insights.push(`最大支出是「${cat.name}」，共 $${fmt(top[1])}，佔總支出 ${Math.round((top[1]/(sum.expense||1))*100)}%。`);}
  }
  return`<div class="card" style="margin-top:12px">
    <div class="card-title">月底總結</div>
    <div class="sum-grid">
      <div class="sum-metric"><div class="ml">總收入</div><div class="mv i">$${fmt(sum.income)}</div></div>
      <div class="sum-metric"><div class="ml">總支出</div><div class="mv e">$${fmt(sum.expense)}</div></div>
      <div class="sum-metric"><div class="ml">結餘</div><div class="mv ${sum.balance>=0?'i':'e'}">$${fmt(sum.balance)}</div></div>
      <div class="sum-metric"><div class="ml">儲蓄率</div><div class="mv p">${sr}%</div></div>
      <div class="sum-metric"><div class="ml">必要支出</div><div class="mv n">$${fmt(sum.nec)}</div></div>
      <div class="sum-metric"><div class="ml">想要購買</div><div class="mv w">$${fmt(sum.want)}</div></div>
    </div>
    ${insights.map(i=>`<div class="insight"><div class="it">💡 分析</div><p>${i}</p></div>`).join('')}
  </div>`;
}

function renderSumModal({y,m}){
  return`<div class="overlay" id="modal-overlay"><div class="modal" style="max-height:82vh">
    <div class="modal-handle"></div>
    <div class="modal-title">${y}年 ${MONTHS[m]} 月底總結</div>
    ${renderSumContent({y,m}).replace('<div class="card" style="margin-top:12px">','<div>').replace('<div class="card-title">月底總結</div>','')}
  </div></div>`;
}

// ── RENDER: HISTORY ────────────────────────────────────────────────────────
function renderHistView(){
  const now=new Date();
  const period=state.histPeriod||'month';
  const periods=[{id:'month',lbl:'本月'},{id:'prev',lbl:'上月'},{id:'3m',lbl:'近三月'},{id:'all',lbl:'全部'}];
  const filters=[{id:'all',lbl:'全部'},{id:'expense',lbl:'支出'},{id:'income',lbl:'收入'},
    {id:'transfer',lbl:'🔄 轉帳'},{id:'必要',lbl:'必要'},{id:'想要',lbl:'想要'},
    ...state.accounts.map(a=>({id:'acc:'+a.id,lbl:a.icon+a.name}))];
  let list=[...state.txs];
  if(period==='month'){list=list.filter(t=>{const d=new Date(t.date);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();});}
  else if(period==='prev'){let pm=now.getMonth()-1,py=now.getFullYear();if(pm<0){pm=11;py--;}list=list.filter(t=>{const d=new Date(t.date);return d.getFullYear()===py&&d.getMonth()===pm;});}
  else if(period==='3m'){const cut=new Date();cut.setMonth(cut.getMonth()-3);list=list.filter(t=>new Date(t.date+'T00:00:00')>=cut);}
  if(state.histFilter==='income')list=list.filter(t=>t.type==='income');
  else if(state.histFilter==='expense')list=list.filter(t=>t.type==='expense');
  else if(state.histFilter==='transfer')list=list.filter(t=>t.type==='transfer');
  else if(state.histFilter==='必要')list=list.filter(t=>t.necessity==='必要');
  else if(state.histFilter==='想要')list=list.filter(t=>t.necessity==='想要');
  else if(state.histFilter.startsWith('acc:'))list=list.filter(t=>t.accountId===state.histFilter.slice(4)||t.fromAccountId===state.histFilter.slice(4)||t.toAccountId===state.histFilter.slice(4));
  const groups={};list.forEach(t=>{(groups[t.date]=groups[t.date]||[]).push(t);});
  const dates=Object.keys(groups).sort((a,b)=>b.localeCompare(a));
  return`<div class="hdr"><div class="hdr-in">
    <h1>歷史記錄</h1><div class="sub">共 ${list.length} 筆</div>
  </div></div>
  <div class="content">
    <div class="chips" style="margin-bottom:8px">
      ${periods.map(p=>`<div class="chip${period===p.id?' ac':''}" data-a="histPeriod" data-v="${p.id}">${p.lbl}</div>`).join('')}
    </div>
    <div class="chips">${filters.map(f=>
      `<div class="chip${state.histFilter===f.id?' ac':''}" data-a="filt" data-v="${f.id}">${f.lbl}</div>`
    ).join('')}</div>
    ${list.length===0?`<div class="empty"><div class="ei">📭</div><p>沒有符合的記錄</p></div>`:
      dates.map(date=>{
        const dt=groups[date];
        const de=dt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
        const di=dt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
        const dd=new Date(date+'T00:00:00');
        const rel=relDate(date);
        return`<div class="day-hdr">
          <span>${dd.getMonth()+1}/${dd.getDate()}</span>
          <span>${di>0?`<span style="color:var(--income)">+$${fmt(di)} </span>`:''}${de>0?`<span style="color:var(--expense)">-$${fmt(de)}</span>`:''}</span>
        </div>
        <div class="card" style="margin-bottom:14px">${dt.map(t=>txItem(t,true,false)).join('')}</div>`;
      }).join('')
    }
  </div>`;
}

// ── RENDER: SETTINGS ───────────────────────────────────────────────────────
function renderSettingsView(){
  const nick=state.nickname||'';

  if(state.settingsTab==='categories'){
    const showType=state.catTypeTab;
    const rows=state.cats[showType].map(cat=>`
    <div class="setting-row">
      <div class="setting-ico" style="background:var(--bg);border:1px solid var(--border)">${cat.icon}</div>
      <div class="setting-info">
        <div class="setting-name">${cat.name}${cat.subcats?.length>0?` <span style="font-size:12px;color:var(--text2)">(${cat.subcats.length}子類)</span>`:''}</div>
        <div class="setting-sub">${cat.budget>0?`月預算 $${fmt(cat.budget)}`:'不設預算'}</div>
      </div>
      <div class="setting-actions">
        <button class="icon-btn edit" data-a="editCat" data-v="${showType}:${cat.id}">✏️</button>
        <button class="icon-btn del" data-a="delCat" data-v="${showType}:${cat.id}">🗑️</button>
      </div>
    </div>`).join('');
    return`<div class="hdr"><div class="hdr-in">
      <div class="hdr-row">
        <div><h1>類別管理</h1></div>
        <button class="cal-nb" data-a="stab" data-v="main">←</button>
      </div>
    </div></div>
    <div class="content">
      <div class="stabs" style="margin-bottom:12px">
        <button class="stab${showType==='expense'?' active':''}" data-a="setCatType" data-v="expense">支出類別</button>
        <button class="stab${showType==='income'?' active':''}" data-a="setCatType" data-v="income">收入類別</button>
      </div>
      <div class="card">${rows}
        <button class="add-fab" data-a="newCat" data-v="${showType}">＋ 新增類別</button>
      </div>
    </div>`;
  }

  if(state.settingsTab==='fixed'){
    const freqLabel={monthly:'每月',quarterly:'每季',yearly:'每年'};
    const monthlyEq=state.fixedExpenses.reduce((s,f)=>{
      if(f.frequency==='monthly')return s+f.amount;
      if(f.frequency==='quarterly')return s+f.amount/3;
      if(f.frequency==='yearly')return s+f.amount/12;return s;},0);
    const rows=state.fixedExpenses.map(f=>{
      const acc=getAcc(f.accountId);
      return`<div class="setting-row" style="${f.active===false?'opacity:.5':''}">
        <div class="setting-ico" style="background:var(--bg);border:1px solid var(--border)">${f.icon}</div>
        <div class="setting-info"><div class="setting-name">${f.name}${f.active===false?` <span style="font-size:11px;color:var(--text2);font-weight:600">暫停中</span>`:''}</div>
          <div class="setting-sub">${freqLabel[f.frequency]||'每月'} · $${fmt(f.amount)}${f.nextDate?' · 下次 '+f.nextDate.slice(5):''}${f.accountId&&acc.name?' · '+acc.icon+acc.name:''}</div></div>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="sw ${f.active===false?'off':'on'}" data-a="toggleFixed" data-v="${f.id}"></button>
          <button class="icon-btn edit" data-a="editFixed" data-v="${f.id}">✏️</button>
          <button class="icon-btn del" data-a="delFixed" data-v="${f.id}">🗑️</button>
        </div>
      </div>`;}).join('');
    return`<div class="hdr"><div class="hdr-in">
      <div class="hdr-row">
        <div><h1>固定費用</h1>
          ${monthlyEq>0?`<div style="font-size:13px;opacity:.85;margin-top:2px">每月約 $${fmt(Math.round(monthlyEq))}</div>`:''}
        </div>
        <button class="cal-nb" data-a="stab" data-v="main">←</button>
      </div>
    </div></div>
    <div class="content"><div class="card">
      ${rows||`<div class="empty" style="padding:24px 0"><div class="ei" style="font-size:36px">📋</div><p>尚無固定費用</p></div>`}
      <button class="add-fab" data-a="newFixed">＋ 新增固定費用</button>
    </div></div>`;
  }

  const sectionLabels={currency:'幣別管理',export:'匯出資料',password:'密碼鎖定',reset:'重設記帳',language:'語言設定',guide:'使用說明',theme:'主題風格'};
  if(sectionLabels[state.settingsTab]){
    return`<div class="hdr"><div class="hdr-in">
      <div class="hdr-row">
        <div><h1>${sectionLabels[state.settingsTab]}</h1></div>
        <button class="cal-nb" data-a="stab" data-v="main">←</button>
      </div>
    </div></div>
    <div class="content"><div class="card" style="text-align:center;padding:40px 20px">
      <div style="font-size:48px;margin-bottom:12px">🚧</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">此功能開發中</div>
      <div style="font-size:14px;color:var(--text2)">敬請期待！</div>
    </div></div>`;
  }

  // Main menu
  const menuItems=[
    {id:'categories',ico:'🏷️',name:'類別管理',sub:'支出 / 收入類別'},
    {id:'fixed',ico:'📋',name:'固定費用',sub:'月費、訂閱、房租'},
    {id:'currency',ico:'💱',name:'幣別管理',sub:'台幣 TWD'},
    {id:'export',ico:'📤',name:'匯出資料',sub:'CSV / JSON'},
    {id:'password',ico:'🔒',name:'密碼鎖定',sub:'未設定'},
    {id:'reset',ico:'🗑️',name:'重設記帳',sub:'清除所有資料'},
    {id:'language',ico:'🌐',name:'語言設定',sub:'繁體中文'},
    {id:'guide',ico:'📖',name:'使用說明',sub:'功能介紹'},
    {id:'theme',ico:'🎨',name:'主題風格',sub:'暖橘色'},
  ];
  return`<div class="hdr"><div class="hdr-in">
    <h1>設定</h1>
  </div></div>
  <div class="content">
    <div class="nick-block">
      <div class="nick-avatar">🐱</div>
      <div style="flex:1;display:flex;align-items:center;gap:10px">
        <span style="font-size:16px;font-weight:700">${nick||'使用者暱稱'}</span>
        <button class="icon-btn edit" data-a="openNickModal" style="background:transparent;border:none;flex-shrink:0;color:rgba(255,255,255,.85)">✏️</button>
      </div>
    </div>
    <div class="card">${menuItems.map(item=>`
    <div class="setting-row" style="cursor:pointer" data-a="stab" data-v="${item.id}">
      <div class="setting-ico" style="background:var(--bg);border:1px solid var(--border)">${item.ico}</div>
      <div class="setting-info">
        <div class="setting-name">${item.name}</div>
        <div class="setting-sub">${item.sub}</div>
      </div>
      <span style="color:var(--text2);font-size:20px;padding-right:2px">›</span>
    </div>`).join('')}
    </div>
  </div>`;
}

// ── RENDER: SETTINGS MODALS ────────────────────────────────────────────────
function renderEditAccModal(){
  const f=state.editForm;
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">${f.id?'編輯帳戶':'新增帳戶'}</div>
    <div class="form-field" style="margin-bottom:14px"><label>帳戶名稱</label>
      <input class="form-input" id="ef-name" type="text" placeholder="例：台新銀行" value="${f.name||''}"></div>
    <div class="slabel">帳戶類型</div>
    <div class="type-chips" style="margin-bottom:14px">
      ${ACC_TYPES.map(t=>`<button class="type-chip${(f.type||'bank')===t.id?' active':''}" data-a="efAccType" data-v="${t.id}">${t.icon} ${t.name}</button>`).join('')}
    </div>
    <div class="form-row">
      <div class="form-field" style="max-width:80px"><label>圖示</label>
        <button class="icon-field" id="emoji-field-btn" data-a="toggleEmojiPicker" data-field="icon">${f.icon||'🏦'}</button>
        <input id="ef-icon" type="hidden" value="${f.icon||''}"></div>
      <div class="form-field"><label>${(f.type||'bank')==='credit'?'初始欠款':'初始餘額'}</label>
        <input class="form-input" id="ef-init" type="number" inputmode="decimal" placeholder="0" value="${f.init||''}"></div>
    </div>
    <div id="emoji-picker-grid" class="emoji-grid" style="display:none;margin-bottom:14px">
      ${EMOJI_QUICK.map(e=>`<button class="emoji-btn${(f.icon||'')===e?' active':''}" data-a="pickEmoji" data-v="${e}">${e}</button>`).join('')}
    </div>
    ${(f.type||'bank')==='credit'?`
    <div class="form-field" style="margin-bottom:14px"><label>信用額度 (0 = 不設定)</label>
      <input class="form-input" id="ef-creditlimit" type="number" inputmode="decimal" placeholder="0" value="${f.creditLimit||''}"></div>
    <div class="form-row">
      <div class="form-field"><label>結帳日（每月幾號）</label>
        <input class="form-input" id="ef-billingday" type="number" inputmode="numeric" placeholder="例：25" value="${f.billingDay||''}"></div>
      <div class="form-field"><label>繳款截止日（每月幾號）</label>
        <input class="form-input" id="ef-paymentday" type="number" inputmode="numeric" placeholder="例：15" value="${f.paymentDay||''}"></div>
    </div>`:''}
    <div class="slabel">帳戶顏色</div>
    <div class="color-swatches" style="margin-bottom:14px">
      ${ACC_COLORS.map(c=>`<div class="swatch${(f.color||ACC_COLORS[0])===c?' sel':''}" style="background:${c}" data-a="efColor" data-v="${c}"></div>`).join('')}
    </div>
    <div class="modal-btns">
      <button class="save-btn" data-a="saveAcc">儲存</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}

function renderEditCatModal(){
  const f=state.editForm;
  const subcats=f.subcats||[];
  const editIdx=f.editingSubIdx??-1;
  const subcatRows=subcats.map((s,i)=>{
    if(editIdx===i){
      return`<div class="subcat-inline-form">
        <input class="icon-inp" id="ef-editsubicon" type="text" maxlength="4" placeholder="🏷️" value="${f.editSubIcon||s.icon||''}">
        <input id="ef-editsubname" type="text" placeholder="子類別名稱" value="${f.editSubName||s.name||''}">
        <button class="sm-btn" data-a="saveEditSub" data-v="${i}">✓</button>
        <button class="sm-btn cancel" data-a="cancelEditSub">✕</button>
      </div>`;
    }
    return`<div class="subcat-row-item">
      <span style="font-size:18px">${s.icon||'🏷️'}</span>
      <span class="sn">${s.name}</span>
      <button class="icon-btn edit" style="width:28px;height:28px;font-size:14px" data-a="startEditSub" data-v="${i}">✏️</button>
      <button class="icon-btn del" style="width:28px;height:28px;font-size:14px" data-a="delSub" data-v="${i}">🗑️</button>
    </div>`;
  }).join('');
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">${f.id?'編輯類別':'新增類別'}</div>
    <div class="form-row">
      <div class="form-field"><label>類別名稱</label>
        <input class="form-input" id="ef-name" type="text" placeholder="例：娛樂" value="${f.name||''}"></div>
      <div class="form-field" style="max-width:80px"><label>圖示</label>
        <button class="icon-field" id="emoji-field-btn" data-a="toggleEmojiPicker" data-field="icon">${f.icon||'🏷️'}</button>
        <input id="ef-icon" type="hidden" value="${f.icon||''}">
      </div>
    </div>
    <div id="emoji-picker-grid" class="emoji-grid" style="display:none;margin-bottom:14px">
      ${EMOJI_QUICK.map(e=>`<button class="emoji-btn${f.icon===e?' active':''}" data-a="pickEmoji" data-v="${e}">${e}</button>`).join('')}
    </div>
    ${!f.id?`<div class="slabel">類型</div><div class="type-chips" style="margin-bottom:14px">
      <button class="type-chip${(f.catType||'expense')==='expense'?' active':''}" data-a="efCatType" data-v="expense">支出</button>
      <button class="type-chip${(f.catType||'expense')==='income'?' active':''}" data-a="efCatType" data-v="income">收入</button>
    </div>`:''}
    ${(f.catType||'expense')==='expense'?`
    <div class="form-field" style="margin-bottom:14px"><label>月預算 (0=不限制)</label>
      <input class="form-input" id="ef-budget" type="number" inputmode="decimal" placeholder="0" value="${f.budget||''}"></div>`:''}
    <div class="slabel">子類別</div>
    <div class="subcat-list">${subcatRows||'<div style="font-size:13px;color:var(--text2);padding:6px 0">尚無子類別</div>'}</div>
    <div class="subcat-inline-form" style="border-bottom:none;padding-bottom:0">
      <input class="icon-inp" id="ef-subicon" type="text" maxlength="4" placeholder="🏷️" value="${f.newSubIcon||''}">
      <input id="ef-subname" type="text" placeholder="新增子類別名稱" value="${f.newSubName||''}">
      <button class="sm-btn" data-a="addSubcat">＋</button>
    </div>
    <div class="modal-btns">
      <button class="save-btn" data-a="saveCat">儲存類別</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}

function renderEditEFModal(){
  const f=state.editForm;
  const autoTarget=calcEFTarget();
  const autoHint=autoTarget>0?Math.round(autoTarget).toLocaleString('zh-TW')+'元（以過去3個月推估）':'0';
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">設定緊急預備金</div>
    <div class="slabel">連結帳戶</div>
    <div class="acc-row" style="margin-bottom:14px;flex-wrap:wrap">
      <button class="acc-pill${!f.accountId?' active':''}" style="--acc-c:#8C6A50" data-a="ef-efacc" data-v="">不連結</button>
      ${state.accounts.map(acc=>
        `<button class="acc-pill${f.accountId===acc.id?' active':''}"
          style="--acc-c:${acc.color}" data-a="ef-efacc" data-v="${acc.id}">${acc.icon} ${acc.name}</button>`
      ).join('')}
    </div>
    <div class="form-field" style="margin-bottom:14px">
      <label>目標金額（留空 = 使用推算值）</label>
      <input class="form-input" id="ef-target" type="text" inputmode="decimal"
        placeholder="${autoHint}" value="${f.targetAmount||''}"></div>
    <div class="insight"><div class="it">💡 說明</div>
      <p>緊急預備金金額建議為 6 個月生活開銷。連結帳戶的餘額即為緊急預備金金額；目標未填則自動以過去 3 個月平均支出推算。</p>
    </div>
    <div class="modal-btns">
      <button class="save-btn" data-a="saveEF">儲存</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}

function renderEditDFModal(){
  const f=state.editForm;
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">🌟 設定夢想基金</div>
    <div class="form-field" style="margin-bottom:14px"><label>願望名稱</label>
      <input class="form-input" id="df-wish" type="text" placeholder="例：買新電腦、旅遊日本" value="${f.wish||''}"></div>
    <div class="form-field" style="margin-bottom:14px"><label>目標金額</label>
      <input class="form-input" id="df-target" type="number" inputmode="decimal" placeholder="0" value="${f.target||''}"></div>
    <div class="slabel">連結帳戶（錢存在此帳戶）</div>
    <div class="acc-row" style="margin-bottom:14px;flex-wrap:wrap">
      <button class="acc-pill${!f.accountId?' active':''}" style="--acc-c:#8C6A50" data-a="df-acc" data-v="">不連結</button>
      ${state.accounts.map(acc=>
        `<button class="acc-pill${f.accountId===acc.id?' active':''}"
          style="--acc-c:${acc.color}" data-a="df-acc" data-v="${acc.id}">${acc.icon} ${acc.name}</button>`
      ).join('')}
    </div>
    <div class="modal-btns">
      <button class="save-btn green" data-a="saveDF">儲存</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}

function renderNickModal(){
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">編輯暱稱</div>
    <div class="form-field" style="margin-bottom:16px"><label>使用者暱稱</label>
      <input class="form-input" id="nick-modal-input" type="text" placeholder="輸入暱稱" value="${state.nickname||''}"></div>
    <div class="modal-btns">
      <button class="save-btn" data-a="saveNickModal">✓ 儲存</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}

function renderEditLoanModal(){
  const f=state.editForm;
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">${f.loanId?'編輯貸款':'新增貸款'}</div>
    <div class="form-row">
      <div class="form-field"><label>貸款名稱</label>
        <input class="form-input" id="ef-loanname" type="text" placeholder="例：房貸" value="${f.loanName||''}"></div>
      <div class="form-field" style="max-width:80px"><label>圖示</label>
        <button class="icon-field" id="emoji-field-btn" data-a="toggleEmojiPicker" data-field="loanIcon">${f.loanIcon||'🏠'}</button>
        <input id="ef-loanicon" type="hidden" value="${f.loanIcon||''}"></div>
    </div>
    <div id="emoji-picker-grid" class="emoji-grid" style="display:none;margin-bottom:14px">
      ${EMOJI_QUICK.map(e=>`<button class="emoji-btn${(f.loanIcon||'')===e?' active':''}" data-a="pickEmoji" data-v="${e}">${e}</button>`).join('')}
    </div>
    <div class="form-row">
      <div class="form-field"><label>貸款總額</label>
        <input class="form-input" id="ef-loantotal" type="number" inputmode="decimal" placeholder="0" value="${f.loanTotal||''}"></div>
      <div class="form-field"><label>剩餘還款金額</label>
        <input class="form-input" id="ef-loanremaining" type="number" inputmode="decimal" placeholder="0" value="${f.loanRemaining||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>每月還款</label>
        <input class="form-input" id="ef-loanmonthly" type="number" inputmode="decimal" placeholder="0" value="${f.loanMonthly||''}"></div>
      <div class="form-field"><label>年利率 (%)</label>
        <input class="form-input" id="ef-loanrate" type="number" inputmode="decimal" placeholder="0" value="${f.loanRate||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>貸款年限（年）</label>
        <input class="form-input" id="ef-loanyears" type="number" inputmode="numeric" placeholder="例：20" min="1" max="50" value="${f.loanYears||''}"></div>
      <div class="form-field"><label>開始日期</label>
        <input class="form-input" id="ef-loanstart" type="date" value="${f.loanStart||todayStr()}"></div>
    </div>
    <div class="slabel">顏色</div>
    <div class="color-swatches" style="margin-bottom:14px">
      ${ACC_COLORS.map(c=>`<div class="swatch${(f.loanColor||ACC_COLORS[0])===c?' sel':''}" style="background:${c}" data-a="loanColor" data-v="${c}"></div>`).join('')}
    </div>
    <div class="modal-btns">
      <button class="save-btn" data-a="saveLoanBtn">儲存</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}
function renderEditFixedModal(){
  const f=state.editForm;
  const freqs=[{id:'monthly',lbl:'每月'},{id:'quarterly',lbl:'每季'},{id:'yearly',lbl:'每年'}];
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">${f.fixedId?'編輯固定費用':'新增固定費用'}</div>
    <div class="form-row">
      <div class="form-field"><label>名稱</label>
        <input class="form-input" id="ef-fixedname" type="text" placeholder="例：Netflix、房租" value="${f.fixedName||''}"></div>
      <div class="form-field" style="max-width:80px"><label>圖示</label>
        <button class="icon-field" id="emoji-field-btn" data-a="toggleEmojiPicker" data-field="fixedIcon">${f.fixedIcon||'📋'}</button>
        <input id="ef-fixedicon" type="hidden" value="${f.fixedIcon||''}"></div>
    </div>
    <div id="emoji-picker-grid" class="emoji-grid" style="display:none;margin-bottom:14px">
      ${EMOJI_QUICK.map(e=>`<button class="emoji-btn${(f.fixedIcon||'')===e?' active':''}" data-a="pickEmoji" data-v="${e}">${e}</button>`).join('')}
    </div>
    <div class="form-row">
      <div class="form-field"><label>金額</label>
        <input class="form-input" id="ef-fixedamt" type="number" inputmode="decimal" placeholder="0" value="${f.fixedAmount||''}"></div>
      <div class="form-field"><label>下次繳費日</label>
        <input class="form-input" id="ef-fixednext" type="date" value="${f.fixedNext||todayStr()}"></div>
    </div>
    <div class="slabel">頻率</div>
    <div class="type-chips" style="margin-bottom:14px">
      ${freqs.map(fr=>`<button class="type-chip${(f.fixedFreq||'monthly')===fr.id?' active':''}" data-a="fixedFreq" data-v="${fr.id}">${fr.lbl}</button>`).join('')}
    </div>
    <div class="slabel">費用類別（自動記帳時套用）</div>
    <div class="acc-row" style="margin-bottom:14px;flex-wrap:wrap">
      ${state.cats.expense.map(c=>`<button class="acc-pill${(f.fixedCatId||'other_e')===c.id?' active':''}" style="--acc-c:var(--p)" data-a="fixedCatId" data-v="${c.id}">${c.icon} ${c.name}</button>`).join('')}
    </div>
    ${state.accounts.length>0?`<div class="slabel">扣款帳戶</div>
    <div class="acc-row" style="margin-bottom:14px;flex-wrap:wrap">
      <button class="acc-pill${!f.fixedAccountId?' active':''}" style="--acc-c:#9A8E85" data-a="fixedAcc" data-v="">不指定</button>
      ${state.accounts.map(acc=>`<button class="acc-pill${f.fixedAccountId===acc.id?' active':''}" style="--acc-c:${acc.color}" data-a="fixedAcc" data-v="${acc.id}">${acc.icon} ${acc.name}</button>`).join('')}
    </div>`:''}
    <div class="slabel">顏色</div>
    <div class="color-swatches" style="margin-bottom:14px">
      ${ACC_COLORS.map(c=>`<div class="swatch${(f.fixedColor||ACC_COLORS[2])===c?' sel':''}" style="background:${c}" data-a="fixedColor" data-v="${c}"></div>`).join('')}
    </div>
    <div class="modal-btns">
      <button class="save-btn" data-a="saveFixedBtn">儲存</button>
      <button class="outline-btn" data-a="closeModal">取消</button>
    </div>
  </div></div>`;
}
function renderYearStatsView(){
  const y=state.statsYear?.y||new Date().getFullYear();
  const yearTxs=state.txs.filter(t=>new Date(t.date).getFullYear()===y&&t.type!=='transfer');
  const yearSum=calcSum(yearTxs);
  const monthlyData=Array.from({length:12},(_,i)=>{
    const mTxs=yearTxs.filter(t=>new Date(t.date).getMonth()===i);
    return{m:i,
      income:mTxs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
      expense:mTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)};
  });
  const maxVal=Math.max(...monthlyData.map(d=>Math.max(d.income,d.expense)),1);
  const bars=monthlyData.map(d=>`
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">
      <div style="width:100%;display:flex;align-items:flex-end;justify-content:center;gap:1px;height:70px">
        ${d.income>0?`<div style="width:46%;background:var(--income);border-radius:3px 3px 0 0;height:${Math.round((d.income/maxVal)*70)}px"></div>`:'<div style="width:46%"></div>'}
        ${d.expense>0?`<div style="width:46%;background:var(--expense);border-radius:3px 3px 0 0;height:${Math.round((d.expense/maxVal)*70)}px"></div>`:'<div style="width:46%"></div>'}
      </div>
      <div style="font-size:10px;color:var(--text2);font-weight:700">${d.m+1}</div>
    </div>`).join('');
  const allYears=[...new Set([...state.txs.map(t=>new Date(t.date).getFullYear()),new Date().getFullYear()])].sort().reverse();
  return`<div class="hdr"><div class="hdr-in">
    <div class="hdr-row">
      <div style="display:flex;align-items:center;gap:8px">
        <h1>年份統計</h1>
        <button class="stats-toggle-btn" data-a="statsView" data-v="month">月</button>
        <button class="stats-toggle-btn active" data-a="statsView" data-v="year">年</button>
      </div>
      <select id="stats-year-sel" class="stats-sel">
        ${allYears.map(yr=>`<option value="${yr}" ${y===yr?'selected':''} style="color:#3A2828;background:white">${yr}年</option>`).join('')}
      </select>
    </div>
    <div class="sum-bar">
      <div class="sum-item"><div class="lbl">年收入</div><div class="val">$${fmt(yearSum.income)}</div></div>
      <div class="sum-item"><div class="lbl">年支出</div><div class="val">$${fmt(yearSum.expense)}</div></div>
      <div class="sum-item"><div class="lbl">結餘</div>
        <div class="val" style="color:${yearSum.balance>=0?'#1A7A50':'#B02828'}">$${fmt(yearSum.balance)}</div>
      </div>
    </div>
  </div></div>
  <div class="content">
    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;gap:12px">收支走勢
        <span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--income)"><span style="width:10px;height:10px;background:var(--income);border-radius:2px;display:inline-block"></span>收入</span>
        <span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--expense)"><span style="width:10px;height:10px;background:var(--expense);border-radius:2px;display:inline-block"></span>支出</span>
      </div>
      <div style="display:flex;gap:2px;align-items:flex-end;padding-top:4px">${bars}</div>
    </div>
    <div class="card">
      <div class="card-title">年度摘要</div>
      <div class="sum-grid">
        <div class="sum-metric"><div class="ml">總收入</div><div class="mv i">$${fmt(yearSum.income)}</div></div>
        <div class="sum-metric"><div class="ml">總支出</div><div class="mv e">$${fmt(yearSum.expense)}</div></div>
        <div class="sum-metric"><div class="ml">年結餘</div><div class="mv ${yearSum.balance>=0?'i':'e'}">$${fmt(yearSum.balance)}</div></div>
        <div class="sum-metric"><div class="ml">儲蓄率</div><div class="mv p">${yearSum.income>0?Math.round((yearSum.balance/yearSum.income)*100):0}%</div></div>
      </div>
    </div>
  </div>`;
}

// ── RENDER: INSURANCE ──────────────────────────────────────────────────────
function renderInsView(){
  const total=state.insurances.reduce((s,ins)=>s+insYearlyPremium(ins),0);
  const active=state.insurances.filter(ins=>insStatus(ins).cls==='active').length;
  const alerts=insAlerts();
  const filtered=state.insFilter==='all'?state.insurances:state.insurances.filter(i=>i.type===state.insFilter);

  const hdr=`<div class="hdr ins-hdr">
    <div class="hdr-in">
      <div class="hdr-row">
        <div><h1>🛡️ 保險管理</h1>
        <div class="sub">共 ${state.insurances.length} 張保單・${active} 張生效中</div></div>
      </div>
      <div class="ins-total">
        <div class="ins-total-item"><div class="il">年繳總保費</div><div class="iv">$${fmt(total)}</div></div>
        <div class="ins-total-item"><div class="il">月均保費</div><div class="iv">$${fmt(Math.round(total/12))}</div></div>
      </div>
    </div>
  </div>`;

  const alertHtml=alerts.length?`<div style="padding:12px 14px 0">${alerts.map(ins=>`
    <div class="ins-alert">
      <span style="font-size:20px">${INS_TICONS[ins.type]||'📋'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700">${ins.name||ins.company}</div>
        <div style="font-size:12px;color:#8B5E00">${insStatus(ins).label}</div>
      </div>
    </div>`).join('')}</div>`:'';

  const chips=`<div class="chips">${['all',...INS_TYPES].map(t=>
    `<button class="chip${state.insFilter===t?' ac':''}" data-a="insFilt" data-v="${t}">${t==='all'?'全部':t}</button>`
  ).join('')}</div>`;

  const cards=filtered.length?filtered.map(ins=>{
    const st=insStatus(ins);
    const color=INS_TCOLORS[ins.type]||'#888';
    const icon=INS_TICONS[ins.type]||'📋';
    const freqLabel=(INS_FREQS.find(f=>f.id===ins.premFreq)||{label:'每年'}).label;
    return`<div class="ins-card" style="--ic:${color}">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="width:44px;height:44px;border-radius:12px;background:${color}22;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="ins-badge" style="background:${color}22;color:${color}">${ins.type||'其他'}</span>
            <span class="ins-st ${st.cls}">${st.label}</span>
          </div>
          <div style="font-size:16px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ins.name||'未命名保單'}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:1px">${ins.company||''}${ins.policyNo?' · '+ins.policyNo:''}</div>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;align-items:center">
        ${ins.premium?`<span style="font-size:13px;font-weight:700">💰 $${fmt(ins.premium)}/${freqLabel}</span>`:''}
        ${ins.endDate?`<span style="font-size:12px;color:var(--text2)">📅 到期 ${ins.endDate}</span>`:`<span style="font-size:12px;color:var(--text2)">♾️ 終身</span>`}
        ${ins.renewalDate?`<span style="font-size:12px;color:var(--text2)">🔔 繳費 ${ins.renewalDate}</span>`:''}
      </div>
      ${ins.coverage?`<div style="font-size:12px;color:var(--text2);margin-top:7px;padding:7px 10px;background:var(--bg);border-radius:8px">${ins.coverage}</div>`:''}
      <div style="display:flex;gap:7px;margin-top:10px;align-items:center">
        ${ins.pdfId?`<button class="outline-btn" style="flex:1;font-size:13px" data-a="viewPDF" data-v="${ins.id}">📄 查看保單</button>`:''}
        <button class="icon-btn edit" data-a="editIns" data-v="${ins.id}">✏️</button>
        <button class="icon-btn del" data-a="delIns" data-v="${ins.id}">🗑️</button>
      </div>
    </div>`;
  }).join(''):`<div class="empty"><div class="ei">🛡️</div><p>尚未新增保單<br><span style="font-size:13px">點下方 + 新增第一張保單</span></p></div>`;

  return hdr+alertHtml+`<div class="content" style="padding-top:12px">${chips}${cards}</div>`+
    `<button class="fab" data-a="newIns">＋</button>`;
}

function renderEditInsModal(){
  const f=state.editForm;
  return`<div class="overlay" id="modal-overlay"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">${f.id?'編輯保單':'新增保單'}</div>
    <div class="slabel">險種</div>
    <div class="type-chips" style="margin-bottom:14px">${INS_TYPES.map(t=>
      `<button class="type-chip${(f.insType||'壽險')===t?' active':''}" data-a="insType" data-v="${t}">${INS_TICONS[t]} ${t}</button>`
    ).join('')}</div>
    <div class="form-row">
      <div class="form-field"><label>保險公司</label>
        <input class="form-input" id="ins-company" value="${f.insCompany||''}" placeholder="例：國泰人壽"></div>
      <div class="form-field"><label>保單名稱</label>
        <input class="form-input" id="ins-name" value="${f.insName||''}" placeholder="例：終身壽險"></div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>保單號碼</label>
        <input class="form-input" id="ins-policyno" value="${f.insPolicyNo||''}" placeholder="選填"></div>
      <div class="form-field"><label>被保人</label>
        <input class="form-input" id="ins-insured" value="${f.insInsured||''}" placeholder="選填"></div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>保費金額</label>
        <input class="form-input" id="ins-premium" type="number" value="${f.insPremium||''}" placeholder="0"></div>
      <div class="form-field"><label>繳費頻率</label>
        <div style="display:flex;gap:5px;flex-wrap:wrap">${INS_FREQS.map(fr=>
          `<button class="type-chip${(f.premFreq||'yearly')===fr.id?' active':''}" style="font-size:12px;padding:5px 10px" data-a="insFreq" data-v="${fr.id}">${fr.label}</button>`
        ).join('')}</div></div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>生效日期</label>
        <input class="form-input" id="ins-start" type="date" value="${f.insStart||''}"></div>
      <div class="form-field"><label>到期日期（終身可不填）</label>
        <input class="form-input" id="ins-end" type="date" value="${f.insEnd||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>下次繳費日</label>
        <input class="form-input" id="ins-renewal" type="date" value="${f.insRenewal||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>保障摘要</label>
        <input class="form-input" id="ins-coverage" value="${f.insCoverage||''}" placeholder="例：壽險保額 500萬、醫療實支實付"></div>
    </div>
    <div class="slabel" style="margin-bottom:7px">保單 PDF</div>
    ${f._pdfName?
      `<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surface);border-radius:10px;border:1.5px solid var(--income);margin-bottom:14px">
        <span style="font-size:18px">📄</span>
        <span style="font-size:13px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f._pdfName}</span>
        <button class="sm-btn cancel" data-a="insClearPdf">✕</button>
      </div>`:
      `<button class="outline-btn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:14px" data-a="insUploadPdf">
        📎 上傳 PDF 保單（自動辨識資料）
      </button>`
    }
    ${f.pdfName&&!f._pdfName?`<div style="font-size:12px;color:var(--text2);margin-bottom:14px">現有附件：${f.pdfName}</div>`:''}
    <input type="file" id="ins-pdf-input" accept="application/pdf" style="display:none">
    <div class="modal-btns">
      <button class="outline-btn" data-a="closeModal" style="flex:1">取消</button>
      <button class="save-btn" data-a="saveIns" style="flex:2">儲存保單</button>
    </div>
  </div></div>`;
}

function renderViewPdfModal(){
  const ins=state.insurances.find(i=>i.id===state.modal.data);
  return`<div style="position:fixed;inset:0;background:white;z-index:250;display:flex;flex-direction:column">
    <div class="pdf-bar">
      <button class="outline-btn" data-a="closeModal" style="padding:7px 14px;flex-shrink:0">← 返回</button>
      <div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ins?.pdfName||'保單'}</div>
    </div>
    <div id="pdf-viewer-area" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#666;min-height:0">
      <div style="color:white;font-size:14px">載入中...</div>
    </div>
  </div>`;
}

// ── TX ITEM ────────────────────────────────────────────────────────────────
function txItem(t,showDel,showSign=true){
  if(t.type==='transfer'){
    const fromAcc=getAcc(t.fromAccountId);
    const toAcc=getAcc(t.toAccountId);
    return`<div class="tx-item">
      <div class="tx-ico transfer">🔄</div>
      <div class="tx-info">
        <div class="tx-cat">轉帳${t.note?' · '+t.note:''}</div>
        <div class="tx-meta">
          <span>${fromAcc.icon} ${fromAcc.name} → ${toAcc.icon} ${toAcc.name}</span>
          <span>${relDate(t.date)}</span>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amt" style="color:var(--text2)">$${fmt(t.amount)}</div>
        ${showDel?`<div class="tx-actions"><button class="del-btn" data-a="del" data-id="${t.id}">刪除</button></div>`:''}
      </div>
    </div>`;
  }
  const cat=getCat(t.type,t.category);
  const sub=t.subCategory?getSubCat(cat,t.subCategory):null;
  const acc=getAcc(t.accountId);
  const catLabel=sub?`${cat.name} · ${sub.name}`:cat.name;
  const necTag=t.necessity?`<span class="nec-tag ${t.necessity==='必要'?'n':'w'}">${t.necessity}</span>`:'';
  const accTag=acc.name?`<span class="acc-tag">${acc.icon} ${acc.name}</span>`:'';
  return`<div class="tx-item">
    <div class="tx-ico ${t.type}">${cat.icon}</div>
    <div class="tx-info">
      <div class="tx-cat">${catLabel}${t.note?' · '+t.note:''}</div>
      <div class="tx-meta">${necTag}${accTag}</div>
    </div>
    <div class="tx-right">
      <div class="tx-amt ${t.type}">${showSign?(t.type==='income'?'+':'-'):''}$${fmt(t.amount)}</div>
      ${showDel?`<div class="tx-actions">
        <button class="icon-btn edit" data-a="openEditTx" data-v="${t.id}">✏️</button>
        <button class="del-btn" data-a="del" data-id="${t.id}">刪除</button>
      </div>`:''}
    </div>
  </div>`;
}

// ── EVENTS ────────────────────────────────────────────────────────────────
function attachInputs(){
  const bind=(id,fn)=>{const el=document.getElementById(id);if(el)el.addEventListener('input',e=>fn(e.target.value));};
  bind('amt',v=>{state.form.amount=v});
  bind('fdate',v=>{state.form.date=v});
  bind('fnote',v=>{state.form.note=v});
  bind('ef-amt',v=>{state.editForm.amount=v});
  bind('ef-date',v=>{state.editForm.date=v});
  bind('ef-note',v=>{state.editForm.note=v});
  bind('ef-name',v=>{state.editForm.name=v});
  bind('ef-icon',v=>{state.editForm.icon=v});
  bind('ef-init',v=>{state.editForm.init=v});
  bind('ef-budget',v=>{state.editForm.budget=v});
  bind('ef-target',v=>{state.editForm.targetAmount=v});
  bind('ef-creditlimit',v=>{state.editForm.creditLimit=v});
  bind('df-wish',v=>{state.editForm.wish=v});
  bind('df-target',v=>{state.editForm.target=v});
  bind('ef-subname',v=>{state.editForm.newSubName=v});
  const statsSel=document.getElementById('stats-month-sel');
  if(statsSel)statsSel.addEventListener('change',e=>{
    const[sy,sm]=e.target.value.split('-').map(Number);state.statsMonth={y:sy,m:sm};renderApp();});
  const statsYearSel=document.getElementById('stats-year-sel');
  if(statsYearSel)statsYearSel.addEventListener('change',e=>{state.statsYear={y:parseInt(e.target.value)};renderApp();});
  const nickInline=document.getElementById('nick-inline');
  if(nickInline)nickInline.addEventListener('blur',e=>{
    const v=(e.target.value||'').trim();if(v!==state.nickname){state.nickname=v;save('budget_nickname',v);}});
  bind('ef-subicon',v=>{state.editForm.newSubIcon=v});
  bind('ef-editsubname',v=>{state.editForm.editSubName=v});
  bind('ef-editsubicon',v=>{state.editForm.editSubIcon=v});
  const insPdfInput=document.getElementById('ins-pdf-input');
  if(insPdfInput){
    insPdfInput.addEventListener('change',async e=>{
      const file=e.target.files[0];if(!file)return;
      showToast('正在解析 PDF...');
      const buf=await file.arrayBuffer();
      state.editForm._pdfData=buf;
      state.editForm._pdfName=file.name;
      try{
        const text=await extractPdfText(buf.slice(0));
        const parsed=parseInsText(text);
        if(parsed.policyNo&&!state.editForm.insPolicyNo)state.editForm.insPolicyNo=parsed.policyNo;
        if(parsed.company&&!state.editForm.insCompany)state.editForm.insCompany=parsed.company;
        if(parsed.premium&&!state.editForm.insPremium)state.editForm.insPremium=String(parsed.premium);
        if(parsed.startDate&&!state.editForm.insStart)state.editForm.insStart=parsed.startDate;
        if(parsed.endDate&&!state.editForm.insEnd)state.editForm.insEnd=parsed.endDate;
        renderModalOnly();showToast('PDF 解析完成，請確認資料 ✓');
      }catch{renderModalOnly();showToast('PDF 已上傳（無法自動解析）');}
    });
  }
}
function bindOverlay(){
  const ov=document.getElementById('modal-overlay');
  if(ov)ov.addEventListener('click',e=>{if(e.target===ov){state.modal=null;renderApp();}});
}

document.addEventListener('click',e=>{
  const navEl=e.target.closest('[data-nav]');
  if(navEl){state.view=navEl.dataset.nav;state.modal=null;renderApp();return;}
  const el=e.target.closest('[data-a]');if(!el)return;
  const a=el.dataset.a,v=el.dataset.v;
  switch(a){
    case'type':
      if(v==='transfer'){
        state.form={...state.form,type:'transfer',
          fromAccountId:state.form.accountId||state.accounts[0]?.id||'',
          toAccountId:state.accounts.find(a=>a.id!==(state.form.accountId||state.accounts[0]?.id))?.id||state.accounts[0]?.id||''
        };
      }else{
        state.form.type=v;state.form.category=(v==='income'?state.cats.income:state.cats.expense)[0]?.id||'';
        state.form.subCategory='';if(v==='income')state.form.installment=0;
      }
      renderModalOnly();break;
    case'setFromAcc':state.form.fromAccountId=v;dmActive('[data-a="setFromAcc"]',v);break;
    case'setToAcc':state.form.toAccountId=v;dmActive('[data-a="setToAcc"]',v);break;
    case'cat':state.form.category=v;state.form.subCategory='';renderModalOnly();break;
    case'subcat':state.form.subCategory=v;dmActive('[data-a="subcat"]',v);break;
    case'setAcc':{const na=state.accounts.find(a=>a.id===v);
      const wasCredit=state.accounts.find(a=>a.id===state.form.accountId)?.type==='credit';
      state.form.accountId=v;if(na?.type!=='credit')state.form.installment=0;
      if(wasCredit||na?.type==='credit'){renderModalOnly();}
      else{dmActive('[data-a="setAcc"]',v);}break;}
    case'save':{
      ['amt','fdate','fnote'].forEach(id=>{const el=document.getElementById(id);if(el){
        if(id==='amt')state.form.amount=el.value;
        else if(id==='fdate')state.form.date=el.value;
        else state.form.note=el.value;
      }});if(state.form.type==='transfer')addTransfer();else addTx();break;}
    case'del':deleteTx(el.dataset.id);break;
    case'setNec':setNecessity(el.dataset.id,v);break;
    case'openEditTx':{
      const tx=state.txs.find(t=>t.id===v);
      if(tx)state.editForm={...tx,amount:String(tx.amount),subCategory:tx.subCategory||''};
      state.modal={type:'editTx'};renderApp();break;}
    case'ef-type':state.editForm={...state.editForm,type:v,subCategory:''};renderModalOnly();break;
    case'ef-nec':
      state.editForm.necessity=v||null;
      document.querySelectorAll('[data-a="ef-nec"]').forEach(b=>{
        b.classList.toggle('an',b.dataset.v==='必要'&&v==='必要');
        b.classList.toggle('aw',b.dataset.v==='想要'&&v==='想要');
        b.classList.toggle('au',!b.dataset.v&&!v);
      });break;
    case'ef-cat':state.editForm={...state.editForm,category:v,subCategory:''};renderModalOnly();break;
    case'ef-subcat':state.editForm.subCategory=v;dmActive('[data-a="ef-subcat"]',v);break;
    case'ef-acc':state.editForm.accountId=v;dmActive('[data-a="ef-acc"]',v);break;
    case'updateTx':{
      ['ef-amt','ef-date','ef-note'].forEach(id=>{const el=document.getElementById(id);if(el){
        if(id==='ef-amt')state.editForm.amount=el.value;
        else if(id==='ef-date')state.editForm.date=el.value;
        else state.editForm.note=el.value;
      }});updateTx();break;}
    case'closeModal':state.modal=null;renderApp();break;
    case'cprev':
      if(state.calMonth.m===0){state.calMonth.y--;state.calMonth.m=11;}else state.calMonth.m--;
      renderApp();break;
    case'cnext':
      if(state.calMonth.m===11){state.calMonth.y++;state.calMonth.m=0;}else state.calMonth.m++;
      renderApp();break;
    case'sprev':
      if(state.statsMonth.m===0){state.statsMonth.y--;state.statsMonth.m=11;}else state.statsMonth.m--;
      renderApp();break;
    case'snext':
      if(state.statsMonth.m===11){state.statsMonth.y++;state.statsMonth.m=0;}else state.statsMonth.m++;
      renderApp();break;
    case'openDay':state.modal={type:'day',data:v};renderApp();break;
    case'openSum':state.modal={type:'sum',data:{...state.statsMonth}};renderApp();break;
    case'filt':state.histFilter=v;renderApp();break;
    case'histPeriod':state.histPeriod=v;renderApp();break;
    case'toggleEmojiPicker':{
      const g=document.getElementById('emoji-picker-grid');
      if(g){if(g.style.display==='none'){g.style.display='flex';g.dataset.field=el.dataset.field||'icon';}
        else g.style.display='none';}
      break;}
    case'pickEmoji':{
      const g=document.getElementById('emoji-picker-grid');
      const field=g?.dataset.field||'icon';
      const inputMap={icon:'ef-icon',loanIcon:'ef-loanicon',fixedIcon:'ef-fixedicon'};
      state.editForm[field]=v;
      const inp=document.getElementById(inputMap[field]||'ef-icon');if(inp)inp.value=v;
      const btn=document.getElementById('emoji-field-btn');if(btn)btn.textContent=v;
      document.querySelectorAll('#emoji-picker-grid .emoji-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===v));
      if(g)g.style.display='none';
      break;}
    case'stab':state.settingsTab=v;renderApp();break;
    case'setCatType':state.catTypeTab=v;renderApp();break;
    case'newAcc':
      state.editForm={type:'bank',icon:'🏦',color:ACC_COLORS[1],init:0,name:''};
      state.modal={type:'editAcc'};renderApp();break;
    case'editAcc':{
      const acc=state.accounts.find(a=>a.id===v);if(acc)state.editForm={...acc};
      state.modal={type:'editAcc'};renderApp();break;}
    case'delAcc':deleteAccount(v);break;
    case'saveAcc':{
      const nEl=document.getElementById('ef-name'),iEl=document.getElementById('ef-icon'),
        initEl=document.getElementById('ef-init'),clEl=document.getElementById('ef-creditlimit'),
        bdEl=document.getElementById('ef-billingday'),pdEl=document.getElementById('ef-paymentday');
      if(nEl)state.editForm.name=nEl.value;if(iEl&&iEl.value)state.editForm.icon=iEl.value;
      if(initEl)state.editForm.init=initEl.value;
      if(clEl)state.editForm.creditLimit=clEl.value;
      if(bdEl)state.editForm.billingDay=bdEl.value;
      if(pdEl)state.editForm.paymentDay=pdEl.value;
      saveAccount();break;}
    case'efAccType':state.editForm={...state.editForm,type:v};renderModalOnly();break;
    case'efColor':state.editForm.color=v;dmSel('[data-a="efColor"]',v);break;
    case'newCat':
      state.editForm={catType:v||state.catTypeTab,icon:'🏷️',budget:0,name:'',subcats:[],editingSubIdx:-1,newSubName:'',newSubIcon:''};
      state.modal={type:'editCat'};renderApp();break;
    case'editCat':{
      const[catType,catId]=v.split(':');
      const cat=state.cats[catType]?.find(c=>c.id===catId);
      if(cat)state.editForm={...cat,catType,subcats:[...(cat.subcats||[])],editingSubIdx:-1,newSubName:'',newSubIcon:''};
      state.modal={type:'editCat'};renderApp();break;}
    case'delCat':{const[t2,id2]=v.split(':');deleteCat(t2,id2);break;}
    case'saveCat':{
      const nEl=document.getElementById('ef-name'),iEl=document.getElementById('ef-icon'),bEl=document.getElementById('ef-budget');
      if(nEl)state.editForm.name=nEl.value;if(iEl&&iEl.value)state.editForm.icon=iEl.value;
      if(bEl)state.editForm.budget=bEl.value;saveCat();break;}
    case'efCatType':state.editForm={...state.editForm,catType:v};renderModalOnly();break;
    case'addSubcat':{
      const nEl=document.getElementById('ef-subname'),iEl=document.getElementById('ef-subicon');
      const name=(nEl?.value||'').trim();if(!name){showToast('請輸入子類別名稱');break;}
      const icon=iEl?.value||'🏷️';
      state.editForm.subcats=[...(state.editForm.subcats||[]),{id:'sc_'+Date.now(),name,icon}];
      state.editForm.newSubName='';state.editForm.newSubIcon='';renderModalOnly();break;}
    case'startEditSub':{
      const idx=parseInt(v);const sub=state.editForm.subcats[idx];
      state.editForm={...state.editForm,editingSubIdx:idx,editSubName:sub.name,editSubIcon:sub.icon||''};
      renderModalOnly();break;}
    case'saveEditSub':{
      const idx=parseInt(v);
      const nEl=document.getElementById('ef-editsubname'),iEl=document.getElementById('ef-editsubicon');
      const name=(nEl?.value||state.editForm.editSubName||'').trim();
      if(!name){showToast('請輸入名稱');break;}
      const icon=iEl?.value||state.editForm.editSubIcon||'🏷️';
      state.editForm.subcats[idx]={...state.editForm.subcats[idx],name,icon};
      state.editForm.editingSubIdx=-1;renderModalOnly();break;}
    case'cancelEditSub':state.editForm={...state.editForm,editingSubIdx:-1};renderModalOnly();break;
    case'delSub':{
      const idx=parseInt(v);state.editForm.subcats=state.editForm.subcats.filter((_,i)=>i!==idx);
      renderModalOnly();break;}
    case'editEF':
      state.editForm={accountId:state.emergencyFund.accountId||'',targetAmount:state.emergencyFund.targetAmount||0};
      state.modal={type:'editEF'};renderApp();break;
    case'ef-efacc':state.editForm.accountId=v;dmActive('[data-a="ef-efacc"]',v);break;
    case'saveEF':{
      const tEl=document.getElementById('ef-target');
      if(tEl)state.editForm.targetAmount=tEl.value;
      state.emergencyFund={accountId:state.editForm.accountId||null,targetAmount:parseFloat(state.editForm.targetAmount)||0};
      saveAll();state.modal=null;showToast('緊急預備金已設定 ✓');renderApp();break;}
    case'saveNick':{
      const el=document.getElementById('nick-input');
      if(el){state.nickname=(el.value||'').trim();saveAll();}
      showToast('暱稱已儲存 ✓');renderApp();break;}
    case'statsView':state.statsView=v;renderApp();break;
    case'assetsTab':state.assetsTab=v;renderApp();break;
    case'newLoan':state.editForm={loanColor:ACC_COLORS[0]};state.modal={type:'editLoan'};renderApp();break;
    case'editLoan':{const l=state.loans.find(x=>x.id===v);
      if(l)state.editForm={loanId:l.id,loanName:l.name,loanIcon:l.icon,loanTotal:String(l.totalAmount),loanRemaining:String(l.remainingAmount),loanMonthly:String(l.monthlyPayment),loanRate:String(l.rate),loanYears:String(l.years||''),loanStart:l.startDate,loanColor:l.color};
      state.modal={type:'editLoan'};renderApp();break;}
    case'delLoan':deleteLoan(v);break;
    case'saveLoanBtn':{
      ['ef-loanname','ef-loanicon','ef-loantotal','ef-loanremaining','ef-loanmonthly','ef-loanrate','ef-loanyears','ef-loanstart'].forEach((id,i)=>{
        const keys=['loanName','loanIcon','loanTotal','loanRemaining','loanMonthly','loanRate','loanYears','loanStart'];
        const el=document.getElementById(id);if(el)state.editForm[keys[i]]=el.value;});
      saveLoan();break;}
    case'loanColor':state.editForm.loanColor=v;dmSel('[data-a="loanColor"]',v);break;
    case'newFixed':state.editForm={fixedFreq:'monthly',fixedColor:ACC_COLORS[2],fixedCatId:'other_e',fixedActive:true};state.modal={type:'editFixed'};renderApp();break;
    case'editFixed':{const x=state.fixedExpenses.find(f=>f.id===v);
      if(x)state.editForm={fixedId:x.id,fixedName:x.name,fixedIcon:x.icon,fixedAmount:String(x.amount),fixedFreq:x.frequency,fixedAccountId:x.accountId||'',fixedNext:x.nextDate,fixedColor:x.color,fixedCatId:x.catId||'other_e',fixedActive:x.active!==false};
      state.modal={type:'editFixed'};renderApp();break;}
    case'delFixed':deleteFixed(v);break;
    case'saveFixedBtn':{
      ['ef-fixedname','ef-fixedicon','ef-fixedamt','ef-fixednext'].forEach((id,i)=>{
        const keys=['fixedName','fixedIcon','fixedAmount','fixedNext'];
        const el=document.getElementById(id);if(el)state.editForm[keys[i]]=el.value;});
      saveFixed();break;}
    case'fixedFreq':state.editForm.fixedFreq=v;dmActive('[data-a="fixedFreq"]',v);break;
    case'fixedAcc':state.editForm.fixedAccountId=v;dmActive('[data-a="fixedAcc"]',v);break;
    case'fixedColor':state.editForm.fixedColor=v;dmSel('[data-a="fixedColor"]',v);break;
    case'fixedCatId':state.editForm.fixedCatId=v;dmActive('[data-a="fixedCatId"]',v);break;
    case'toggleFixed':{const fx=state.fixedExpenses.find(f=>f.id===v);
      if(fx){fx.active=fx.active===false;saveAll();
        el.classList.toggle('on',fx.active);el.classList.toggle('off',!fx.active);
        const row=el.closest('.setting-row');
        if(row){row.style.opacity=fx.active?'':'0.5';
          const badge=row.querySelector('.setting-name span');
          if(fx.active){if(badge)badge.remove();}
          else if(!badge){row.querySelector('.setting-name')?.insertAdjacentHTML('beforeend',`<span style="font-size:11px;color:var(--text2);font-weight:600">暫停中</span>`);}
        }
      }break;}
    case'newIns':
      state.editForm={insType:'壽險',premFreq:'yearly'};
      state.modal={type:'editIns'};renderApp();break;
    case'editIns':{
      const ins=state.insurances.find(i=>i.id===v);
      if(ins)state.editForm={id:ins.id,insType:ins.type,insCompany:ins.company,insName:ins.name,
        insPolicyNo:ins.policyNo,insInsured:ins.insured,insPremium:String(ins.premium||''),
        premFreq:ins.premFreq||'yearly',insStart:ins.startDate,insEnd:ins.endDate,
        insRenewal:ins.renewalDate,insCoverage:ins.coverage,pdfId:ins.pdfId,pdfName:ins.pdfName};
      state.modal={type:'editIns'};renderApp();break;}
    case'delIns':deleteIns(v);break;
    case'insFilt':state.insFilter=v;renderApp();break;
    case'insType':state.editForm.insType=v;renderModalOnly();break;
    case'insFreq':state.editForm.premFreq=v;renderModalOnly();break;
    case'insClearPdf':state.editForm._pdfData=null;state.editForm._pdfName=null;renderModalOnly();break;
    case'insUploadPdf':document.getElementById('ins-pdf-input')?.click();break;
    case'saveIns':{
      ['ins-company','ins-name','ins-policyno','ins-insured','ins-premium',
       'ins-start','ins-end','ins-renewal','ins-coverage'].forEach((id,i)=>{
        const keys=['insCompany','insName','insPolicyNo','insInsured','insPremium',
                    'insStart','insEnd','insRenewal','insCoverage'];
        const el2=document.getElementById(id);if(el2)state.editForm[keys[i]]=el2.value;
      });
      saveIns();break;}
    case'viewPDF':{
      state.modal={type:'viewPDF',data:v};renderApp();
      const vinsp=state.insurances.find(i=>i.id===v);
      if(vinsp?.pdfId){
        idbGet(vinsp.pdfId).then(rec=>{
          const area=document.getElementById('pdf-viewer-area');
          if(!area||!rec)return;
          const blob=new Blob([rec.data],{type:'application/pdf'});
          const url=URL.createObjectURL(blob);
          area.innerHTML=`<iframe src="${url}" style="width:100%;height:100%;border:none;flex:1"></iframe>
            <a href="${url}" target="_blank" style="padding:10px 20px;background:var(--surface);color:var(--text);font-size:13px;font-weight:700;text-decoration:none;border-top:1px solid var(--border);width:100%;text-align:center">📤 在新分頁開啟</a>`;
        }).catch(()=>showToast('PDF 載入失敗'));
      }
      break;}
    case'openNickModal':state.modal={type:'nickModal'};renderApp();break;
    case'saveNickModal':{
      const el=document.getElementById('nick-modal-input');
      if(el){state.nickname=(el.value||'').trim();saveAll();}
      state.modal=null;showToast('暱稱已儲存 ✓');renderApp();break;}
    case'setInstall':state.form={...state.form,installment:parseInt(v)||0};renderModalOnly();break;
    case'openAdd':state.form=defaultForm();state.modal={type:'addTx'};renderApp();break;
    case'homeDayPrev':state.homeDayOffset--;renderApp();break;
    case'homeDayNext':if(state.homeDayOffset<0){state.homeDayOffset++;renderApp();}break;
    case'toggleHideBal':state.accHideBalance=!state.accHideBalance;save('budget_hide_bal',state.accHideBalance);renderApp();break;
    case'editDF':state.editForm={...state.dreamFund};state.modal={type:'editDF'};renderApp();break;
    case'df-acc':state.editForm.accountId=v;dmActive('[data-a="df-acc"]',v);break;
    case'saveDF':{
      const wEl=document.getElementById('df-wish'),tEl=document.getElementById('df-target');
      if(wEl)state.editForm.wish=wEl.value;if(tEl)state.editForm.target=tEl.value;
      state.dreamFund={accountId:state.editForm.accountId||null,target:parseFloat(state.editForm.target)||0,wish:(state.editForm.wish||'').trim()};
      saveAll();state.modal=null;showToast('夢想基金已設定 ✓');renderApp();break;}
  }
});

// ── DONUT CHART ─────────────────────────────────────────────────────────────
function drawDonut(canvasId='donut',y,m){
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const _y=y??state.statsMonth.y,_m=m??state.statsMonth.m;
  const sum=calcSum(monthTxs(_y,_m));
  const ctx=canvas.getContext('2d');const cx=60,cy=60,r=44,lw=14;
  ctx.clearRect(0,0,120,120);
  const draw=(start,angle,color)=>{
    if(angle<=0.01)return;
    ctx.beginPath();ctx.arc(cx,cy,r,start-Math.PI/2,start+angle-Math.PI/2);
    ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.lineCap='butt';ctx.stroke();
  };
  if(!sum.expense){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#E8D8D4';ctx.lineWidth=lw;ctx.stroke();}
  else{
    const na=(sum.nec/sum.expense)*Math.PI*2,wa=(sum.want/sum.expense)*Math.PI*2,ua=Math.PI*2-na-wa;
    draw(0,na,'#8090A8');draw(na,wa,'#B89860');if(ua>0.01)draw(na+wa,ua,'#E8D8D4');
  }
  const wp=sum.expense?Math.round((sum.want/sum.expense)*100):0;
  ctx.fillStyle='#3A2828';ctx.font='bold 18px Nunito,sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(wp+'%',cx,cy-8);
  ctx.font='11px Nunito,sans-serif';ctx.fillStyle='#907878';ctx.fillText('想要',cx,cy+10);
}

// ── SERVICE WORKER + INIT ───────────────────────────────────────────────────
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
renderApp();

