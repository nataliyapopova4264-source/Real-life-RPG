(function(){
'use strict';
const KEY='rpg-custom-goals-v3',SKILLIDS=['appearance','endurance'];
let data={goals:[],claims:[]},editing=null,toDelete=null;
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Array.isArray(v.goals)&&Array.isArray(v.claims)){data.goals=v.goals;data.claims=v.claims}}catch(e){}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skill=s=>SKILLIDS.includes(s)?s:'appearance';
const skillName=s=>s==='endurance'?'Выносливость':'Внешность';
const validXP=x=>Number.isInteger(+x)&&+x>=1&&+x<=1000;
const date=()=>today();
const currentClaims=()=>data.claims.filter(c=>c.date===date());
function saveGoals(){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(e){message('Ошибка сохранения данных',true);return false}}
function message(s,err=false){const e=$('goalMessage');if(e){e.textContent=s;e.style.color=err?'#ffb0b0':'#74e5ae'}}
function done(g){return data.claims.some(c=>c.goalId===g.id&&(g.frequency==='once'||c.date===date()))}
function doneToday(g){return data.claims.some(c=>c.goalId===g.id&&c.date===date())}
function activeToday(g){return g.frequency==='daily'||!data.claims.some(c=>c.goalId===g.id&&c.date!==date())}
function customXP(s){return data.claims.reduce((n,c)=>n+(c.skill===s?Number(c.xp)||0:0),0)}
function complete(id){const g=data.goals.find(x=>x.id===id);if(!g||done(g))return;data.claims.push({goalId:id,date:date(),name:g.name,xp:g.xp,skill:g.skill,frequency:g.frequency});if(!saveGoals()){data.claims.pop();return}render();message('Выполнено! +'+g.xp+' XP')}
function card(g,manage){
 const d=done(g),prev=g.frequency==='once'&&d&&!doneToday(g);
 return `<div class="goal-tile"><div class="row"><strong>${esc(g.name)}</strong><span class="xp">+${Number(g.xp)} XP</span></div>
 <p class="muted">${esc(g.desc||'Без описания')}</p><small>${esc(skillName(g.skill))} · ${g.frequency==='once'?'Разовая':'Ежедневная'}</small>
 <div class="goal-actions"><button data-goal="claim" data-id="${esc(g.id)}" ${d?'disabled':''} class="${d?'quest-done':'green'}">${d?(prev?'✓ Выполнена ранее':'✓ Выполнено'):'+ Засчитать XP'}</button>
 ${manage?`<button class="subtle" data-goal="edit" data-id="${esc(g.id)}">✎ Изменить</button><button class="subtle" data-goal="delete" data-id="${esc(g.id)}">Удалить</button>`:''}</div></div>`;
}
const style=document.createElement('style');
style.textContent=`
.goal-tile{padding:13px 0;border-bottom:1px solid var(--stroke)}.goal-tile:last-child{border-bottom:0}.goal-tile p{font-size:13px;margin:6px 0}.goal-tile small{color:#bfa9f4;display:block}.goal-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.goal-actions button{padding:9px 11px;font-size:12px}
.goal-field{display:block;margin:11px 0;color:var(--muted);font-size:13px}.goal-field input,.goal-field textarea,.goal-field select{display:block;width:100%;margin-top:5px;border:1px solid #5d5079;border-radius:10px;background:#100f24;color:#fff;padding:11px;min-height:43px;color-scheme:dark}.goal-field textarea{height:76px;resize:vertical}
.goal-columns{display:grid;grid-template-columns:1fr 1fr;gap:9px}.goal-actions-wide{display:flex;gap:8px;margin-top:13px}.goal-actions-wide button{flex:1}.goal-json{display:block;width:100%;height:126px;background:#100f24;color:white;border:1px solid #5d5079;border-radius:9px;padding:10px;font:12px/1.4 monospace;margin:8px 0}
#goalMessage{min-height:20px;font-size:13px;margin:8px 0}.goal-helper{font-size:12px;color:var(--muted);margin:7px 0}
`;
document.head.appendChild(style);
const sec=document.createElement('section');sec.id='page-goals';sec.className='hidden';
sec.innerHTML=`
<div class="row wrap"><h2>🎯 Собственные цели</h2><button data-goal="new">+ Новая цель</button></div>
<p class="muted">Придумывай квесты, выбирай характеристику и награду в XP.</p>
<div id="goalMessage" role="status" aria-live="polite"></div>
<div class="card hidden" id="goalEditor"><h3 id="goalTitle">Новая цель</h3>
<form id="goalForm">
<label class="goal-field">Название <input id="goalName" type="text" maxlength="75" required placeholder="Например, утренняя прогулка"></label>
<label class="goal-field">Описание <textarea id="goalDesc" maxlength="300" placeholder="Как понять, что цель выполнена?"></textarea></label>
<div class="goal-columns">
<label class="goal-field">Характеристика <select id="goalSkill"><option value="appearance">Внешность</option><option value="endurance">Выносливость</option></select></label>
<label class="goal-field">Награда XP <input id="goalXP" type="number" required min="1" max="1000" step="1" value="10"></label></div>
<label class="goal-field">Повторение <select id="goalFrequency"><option value="daily">Каждый день</option><option value="once">Только один раз</option></select></label>
<p class="goal-helper">Награда от 1 до 1000 XP. Изменение награды не влияет на уже полученный опыт.</p>
<div class="goal-actions-wide"><button type="submit">Сохранить</button><button class="subtle" type="button" data-goal="cancel">Отмена</button></div>
</form></div>
<div class="card hidden" id="goalDelete"><h3>Удалить цель?</h3><p class="muted" id="goalDeleteName"></p><p class="goal-helper">Ранее начисленный опыт сохранится в журнале.</p>
<div class="goal-actions-wide"><button data-goal="delete-confirm" style="background:#83344c;color:white">Да, удалить</button><button data-goal="delete-cancel" class="subtle">Отмена</button></div></div>
<div class="card"><h3>Список целей <span id="goalCount" class="chip">0</span></h3><div id="goalList"></div></div>
<div class="card"><h3>Резервная копия и перенос данных</h3><p class="muted">В приложении 0.2.1 открой «Журнал → Резервная копия» и скопируй JSON. Вставь его сюда, чтобы перенести XP.</p>
<button class="subtle" data-goal="export">Показать резервную копию версии 0.3</button>
<textarea class="goal-json hidden" id="goalExport" readonly aria-label="Резервная копия"></textarea>
<label class="goal-field">Импорт JSON версии 0.2.1 или 0.3<textarea class="goal-json" id="goalImport" placeholder="Вставь сюда скопированный JSON"></textarea></label>
<button class="subtle" data-goal="import">Импортировать прогресс</button>
<p class="goal-helper">Записи объединяются без повторного начисления XP. Старое приложение можно оставить на телефоне.</p>
</div>`;
document.querySelector('nav.bottom').before(sec);
const nav=document.createElement('button');nav.id='nav-goals';nav.innerHTML='<b>🎯</b>Цели';nav.onclick=()=>showPage('goals');document.querySelector('nav.bottom').insertBefore(nav,$('nav-stats'));
const priorSkillXP=skillXp;
skillXp=function(id){return priorSkillXP(id)+customXP(id)};
const priorRender=render;
render=function(){
 priorRender();
 const available=data.goals.filter(activeToday);
 $('todayxp').textContent=QUESTS.reduce((n,q)=>n+(completedQuest(q.id)?q.xp:0),0)+currentClaims().reduce((n,c)=>n+Number(c.xp),0);
 $('todaycount').textContent=(QUESTS.filter(q=>completedQuest(q.id)).length+data.goals.filter(doneToday).length)+'/'+(QUESTS.length+available.length);
 $('goalCount').textContent=String(data.goals.length);
 $('goalList').innerHTML=data.goals.length?data.goals.map(g=>card(g,true)).join(''):'<p class="muted">Пока нет целей. Нажми «Новая цель».</p>';
 $('questlist').insertAdjacentHTML('beforeend',`<div class="card"><div class="row"><h3>🎯 Мои цели</h3><button class="subtle" data-goal="new">+ Добавить</button></div>${available.length?available.map(g=>card(g,false)).join(''):'<p class="muted">Создай собственную цель во вкладке «Цели».</p>'}</div>`);
 const entries=data.claims.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
 $('statscontent').insertAdjacentHTML('beforeend',`<div class="card"><h3>Мои цели · журнал XP</h3>${entries.length?entries.map(c=>`<div class="historyitem"><span>${esc(c.date)}<br><small>${esc(c.name)} · ${esc(skillName(c.skill))}</small></span><b class="xp">+${Number(c.xp)} XP</b></div>`).join(''):'<small>Пока нет выполненных собственных целей.</small>'}</div>`);
};
const priorShowPage=showPage;
showPage=function(p){$('page-goals').classList.toggle('hidden',p!=='goals');$('nav-goals').classList.toggle('active',p==='goals');if(p==='goals'){['hero','quests','tabata','stats'].forEach(x=>{$('page-'+x).classList.add('hidden');$('nav-'+x).classList.remove('active')});window.scrollTo(0,0);render()}else priorShowPage(p)};
const priorBackup=showBackup;
showBackup=function(){$('backup').classList.remove('hidden');$('backup').value=JSON.stringify({formatVersion:3,logs:db.logs,customGoals:data.goals,customClaims:data.claims},null,2);$('backup').focus();$('backup').select()};
function editor(id){
 editing=id;const g=data.goals.find(x=>x.id===id);
 $('goalEditor').classList.remove('hidden');$('goalDelete').classList.add('hidden');
 $('goalTitle').textContent=g?'Изменить цель':'Новая цель';
 $('goalName').value=g?g.name:'';$('goalDesc').value=g?g.desc:'';$('goalXP').value=g?g.xp:10;
 $('goalSkill').value=g?g.skill:'appearance';$('goalFrequency').value=g?g.frequency:'daily';
 $('goalEditor').scrollIntoView({behavior:'smooth',block:'start'});
}
$('goalForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('goalName').value.trim(),desc=$('goalDesc').value.trim(),xp=Number($('goalXP').value),s=skill($('goalSkill').value),f=$('goalFrequency').value==='once'?'once':'daily';
 if(!name||name.length>75||desc.length>300||!validXP(xp)){message('Проверь название, описание и XP от 1 до 1000.',true);return}
 if(editing){const i=data.goals.findIndex(g=>g.id===editing);if(i===-1)return;data.goals[i]={...data.goals[i],name,desc,xp,skill:s,frequency:f}}
 else data.goals.push({id:'g'+Date.now().toString(36)+Math.floor(Math.random()*1e8).toString(36),name,desc,xp,skill:s,frequency:f});
 if(!saveGoals())return;
 editing=null;$('goalEditor').classList.add('hidden');render();message('Цель сохранена.');
});
function exportObject(){return {formatVersion:3,logs:db.logs,customGoals:data.goals,customClaims:data.claims}}
function importProgress(){
 let v;try{v=JSON.parse($('goalImport').value)}catch(e){message('Некорректный JSON.',true);return}
 if(!v||typeof v!=='object'||!v.logs||typeof v.logs!=='object'||Array.isArray(v.logs)){message('Это не резервная копия REAL LIFE RPG.',true);return}
 const logs=JSON.parse(JSON.stringify(db.logs)),goals=data.goals.slice(),claims=data.claims.slice();
 for(const [day,items] of Object.entries(v.logs)){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!items||typeof items!=='object')continue;logs[day]=logs[day]||{};QUESTS.forEach(q=>{if(items[q.id])logs[day][q.id]=true})}
 if(Array.isArray(v.customGoals))for(const g of v.customGoals){
  if(!g||typeof g.id!=='string'||!/^[a-zA-Z0-9_-]{3,64}$/.test(g.id)||goals.some(x=>x.id===g.id))continue;
  const xp=Number(g.xp),name=String(g.name||'').trim().slice(0,75);
  if(!name||!validXP(xp))continue;
  goals.push({id:g.id,name,desc:String(g.desc||'').slice(0,300),xp,skill:skill(g.skill),frequency:g.frequency==='once'?'once':'daily'});
 }
 if(Array.isArray(v.customClaims))for(const c of v.customClaims){
  if(!c||typeof c.goalId!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(c.date)||!validXP(c.xp)||claims.some(x=>x.goalId===c.goalId&&x.date===c.date))continue;
  claims.push({goalId:c.goalId,date:c.date,name:String(c.name||'Цель').slice(0,75),xp:Number(c.xp),skill:skill(c.skill),frequency:c.frequency==='once'?'once':'daily'});
 }
 const oldLogs=db.logs,oldData=data;
 db.logs=logs;data={goals,claims};
 if(!saveGoals()){data=oldData;db.logs=oldLogs;return}
 save();$('goalImport').value='';render();message('Прогресс перенесён и объединён!');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-goal]');if(!b)return;
 const act=b.dataset.goal,id=b.dataset.id;
 if(act==='new'){showPage('goals');editor(null)}
 if(act==='edit'){showPage('goals');editor(id)}
 if(act==='claim')complete(id);
 if(act==='cancel'){$('goalEditor').classList.add('hidden');editing=null}
 if(act==='delete'){const g=data.goals.find(x=>x.id===id);if(!g)return;toDelete=id;$('goalEditor').classList.add('hidden');$('goalDeleteName').textContent=g.name;$('goalDelete').classList.remove('hidden');$('goalDelete').scrollIntoView({block:'nearest'})}
 if(act==='delete-cancel'){toDelete=null;$('goalDelete').classList.add('hidden')}
 if(act==='delete-confirm'){if(toDelete){data.goals=data.goals.filter(g=>g.id!==toDelete);saveGoals();toDelete=null;$('goalDelete').classList.add('hidden');render();message('Цель удалена, опыт сохранён.')}}
 if(act==='export'){$('goalExport').classList.remove('hidden');$('goalExport').value=JSON.stringify(exportObject(),null,2);$('goalExport').focus();$('goalExport').select()}
 if(act==='import')importProgress();
});
document.querySelector('.top .subtitle').insertAdjacentHTML('afterend','<div class="eyebrow" style="margin-top:7px">Версия 0.3 · Редактор целей</div>');
render();
})();