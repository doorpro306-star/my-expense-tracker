const DB='ExpenseTrackerDB', STORE='expenses';
const CATEGORIES=['Fuel','Groceries / Food','Office Supplies','Business Supplies','Equipment','Vehicle','Advertising','Professional Services','Utilities','Travel','Repairs & Maintenance','Other'];
const RULES={shell:'Fuel','petro-canada':'Fuel','petro canada':'Fuel','esso':'Fuel','costco':'Groceries / Food','walmart':'Groceries / Food','sobeys':'Groceries / Food','save on foods':'Groceries / Food','staples':'Office Supplies','home depot':'Business Supplies','rona':'Business Supplies','amazon':'Other','canadian tire':'Vehicle'};
let db, current;

const $=id=>document.getElementById(id);
function money(v){return Number(v||0).toLocaleString('en-CA',{style:'currency',currency:'CAD'});}
function today(){return new Date().toISOString().slice(0,10);}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>{db=r.result;res(db)};r.onerror=()=>rej(r.error)})}
function all(){return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res(r.result.sort((a,b)=>(b.date||'').localeCompare(a.date||'')));r.onerror=()=>rej(r.error)})}
function put(x){return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).put(x);r.onsuccess=()=>res(x);r.onerror=()=>rej(r.error)})}
function del(id){return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}

function show(name){
 document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===name));
 document.querySelectorAll('.bottomnav button').forEach(x=>x.classList.toggle('active',x.dataset.screen===name));
 if(name==='dashboard') renderDashboard(); if(name==='expenses') renderExpenses(); if(name==='reports') renderReports();
}
function categoryOptions(){ $('category').innerHTML=CATEGORIES.map(c=>`<option>${c}</option>`).join(''); $('filterCategory').innerHTML='<option value="">All categories</option>'+CATEGORIES.map(c=>`<option>${c}</option>`).join('');}
function supplierFromText(t){let lines=t.split(/\n+/).map(x=>x.trim()).filter(Boolean);return lines.slice(0,4).find(x=>/[A-Za-z]{3,}/.test(x)&&!/^\d+$/.test(x))||''}
function amountMatches(t){return [...t.matchAll(/(?:\$\s*)?([0-9]{1,5}(?:[,.][0-9]{2}))/g)].map(m=>Number(m[1].replace(',',''))).filter(n=>n>0)}
function dateFromText(t){let m=t.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);if(m)return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;m=t.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);if(m)return `${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;return today()}
function categorize(s){let q=s.toLowerCase();for(const [k,v] of Object.entries(RULES))if(q.includes(k))return v;return 'Other'}
function extract(t){
 const supplier=supplierFromText(t), nums=amountMatches(t), total=nums.length?nums[nums.length-1]:0;
 const taxLine=t.match(/(?:gst|hst|pst|tax)\D{0,15}([0-9]+(?:[,.][0-9]{2}))/i);
 const tax=taxLine?Number(taxLine[1].replace(',','')):0;
 return {supplier,date:dateFromText(t),invoiceNumber:(t.match(/(?:invoice|inv\.?|receipt)\s*#?\s*([A-Z0-9-]+)/i)||[])[1]||'',category:categorize(supplier),subtotal:Math.max(0,total-tax),tax,total,paymentMethod:'',notes:'',ocrText:t};
}
async function processImage(file){
 $('processing').classList.remove('hidden'); $('processingText').textContent='Running OCR on the receipt…';
 try{
   const result=await Tesseract.recognize(file,'eng',{logger:m=>{if(m.status==='recognizing text')$('processingText').textContent=`Reading receipt… ${Math.round(m.progress*100)}%`;}});
   const data=extract(result.data.text);
   current={id:crypto.randomUUID(),createdAt:new Date().toISOString(),imageData:await dataUrl(file),...data};
   openReview(current);
 }catch(e){alert('Could not read this receipt. You can enter it manually.');current={id:crypto.randomUUID(),createdAt:new Date().toISOString(),supplier:'',date:today(),category:'Other',subtotal:0,tax:0,total:0,paymentMethod:'',notes:'',ocrText:'',imageData:await dataUrl(file)};openReview(current)}
 finally{$('processing').classList.add('hidden')}
}
function dataUrl(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function openReview(x){
 current=x; $('expenseId').value=x.id;$('supplier').value=x.supplier||'';$('expenseDate').value=x.date||today();$('invoiceNumber').value=x.invoiceNumber||'';$('category').value=x.category||'Other';$('subtotal').value=x.subtotal||'';$('tax').value=x.tax||'';$('total').value=x.total||'';$('paymentMethod').value=x.paymentMethod||'';$('notes').value=x.notes||'';$('ocrText').textContent=x.ocrText||'';
 $('receiptPreview').innerHTML=x.imageData?`<img src="${x.imageData}" alt="Receipt">`:'<div class="receiptPlaceholder">No receipt image</div>';
 show('review');
}
function renderDashboard(){
 all().then(xs=>{let m=new Date().toISOString().slice(0,7), cur=xs.filter(x=>(x.date||'').startsWith(m));$('monthTotal').textContent=money(cur.reduce((a,x)=>a+Number(x.total||0),0));$('monthTax').textContent=money(cur.reduce((a,x)=>a+Number(x.tax||0),0));$('monthCount').textContent=cur.length;$('recentList').innerHTML=xs.slice(0,8).map(card).join('')||'<div class="card muted">No expenses yet.</div>'})}
function card(x){return `<button class="card" style="text-align:left;width:100%;border:0" onclick="editExpense('${x.id}')"><div class="cardrow"><div><div class="supplier">${esc(x.supplier||'Unknown supplier')}</div><div class="muted">${esc(x.date||'')} · ${esc(x.invoiceNumber||'No invoice #')}</div></div><div class="amount">${money(x.total)}</div></div><span class="tag">${esc(x.category||'Other')}</span></button>`}
async function editExpense(id){let xs=await all();let x=xs.find(a=>a.id===id);if(x)openReview(x)}
async function renderExpenses(){let xs=await all(), q=$('search').value.toLowerCase(), cat=$('filterCategory').value, mon=$('filterMonth').value;let months=[...new Set(xs.map(x=>(x.date||'').slice(0,7)).filter(Boolean))];$('filterMonth').innerHTML='<option value="">All months</option>'+months.map(m=>`<option ${m===mon?'selected':''}>${m}</option>`).join('');xs=xs.filter(x=>(!q||JSON.stringify(x).toLowerCase().includes(q))&&(!cat||x.category===cat)&&(!mon||(x.date||'').startsWith(mon)));$('expenseList').innerHTML=xs.map(card).join('')||'<div class="card muted">No matching expenses.</div>'}
async function renderReports(){let xs=await all(), total=xs.reduce((a,x)=>a+Number(x.total||0),0), tax=xs.reduce((a,x)=>a+Number(x.tax||0),0), groups={};xs.forEach(x=>groups[x.category||'Other']=(groups[x.category||'Other']||0)+Number(x.total||0));$('reportContent').innerHTML=`<div class="reportGrid"><div class="reportBox"><span class="muted">All expenses</span><strong>${money(total)}</strong></div><div class="reportBox"><span class="muted">Tax</span><strong>${money(tax)}</strong></div></div><div class="card" style="margin-top:12px"><h3>By category</h3>${Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="categoryRow"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')||'<div class="muted">No expenses yet.</div>'}</div>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
async function csv(){let xs=await all(),head=['Date','Supplier','Invoice','Category','Subtotal','Tax','Total','Payment','Notes'];let rows=xs.map(x=>[x.date,x.supplier,x.invoiceNumber,x.category,x.subtotal,x.tax,x.total,x.paymentMethod,x.notes]);let out=[head,...rows].map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');download('expenses.csv','text/csv',out)}
async function backup(){download('expense-backup.json','application/json',JSON.stringify(await all(),null,2))}
function download(name,type,data){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function restore(file){let xs=JSON.parse(await file.text());for(const x of xs)await put(x);renderDashboard();alert(`Restored ${xs.length} expenses.`)}

document.addEventListener('DOMContentLoaded',async()=>{
 await openDB();categoryOptions();renderDashboard();
 document.querySelectorAll('.bottomnav button').forEach(b=>b.onclick=()=>show(b.dataset.screen));
 $('addBtn').onclick=()=>show('add');$('allBtn').onclick=()=>show('expenses');document.querySelectorAll('.backBtn').forEach(b=>b.onclick=()=>show('dashboard'));
 $('cameraInput').onchange=e=>e.target.files[0]&&processImage(e.target.files[0]);$('photoInput').onchange=e=>e.target.files[0]&&processImage(e.target.files[0]);
 $('pdfInput').onchange=async e=>{if(!e.target.files[0])return;alert('PDF storage is supported in the next update; for now, use a photo of the PDF page or enter the expense manually.');};
 $('expenseForm').onsubmit=async e=>{e.preventDefault();let x={...current,supplier:$('supplier').value,date:$('expenseDate').value,invoiceNumber:$('invoiceNumber').value,category:$('category').value,subtotal:Number($('subtotal').value||0),tax:Number($('tax').value||0),total:Number($('total').value||0),paymentMethod:$('paymentMethod').value,notes:$('notes').value};await put(x);show('dashboard')};
 $('deleteExpense').onclick=async()=>{if(confirm('Delete this expense?')){await del(current.id);show('dashboard')}};
 $('cancelReview').onclick=()=>show('dashboard');$('search').oninput=renderExpenses;$('filterCategory').onchange=renderExpenses;$('filterMonth').onchange=renderExpenses;
 $('csvBtn').onclick=csv;$('backupBtn').onclick=backup;$('restoreInput').onchange=e=>e.target.files[0]&&restore(e.target.files[0]);
 $('installHelp').onclick=()=>alert('In Safari, open this site, tap Share, then Add to Home Screen. It will behave like an app.');
 if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
});
