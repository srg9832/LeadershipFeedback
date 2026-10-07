/* CAP Leadership Feedback - Supabase production build */
const CFG=window.CAP_LEADERSHIP_CONFIG||{};
const SUPABASE_READY=!!(window.supabase&&CFG.supabaseUrl&&CFG.supabaseAnonKey&&!String(CFG.supabaseAnonKey).includes('PASTE_'));
const sb=SUPABASE_READY?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey):null;
const DEFAULT_KEY_PREFIX='capLeadershipDefaultLocation:';

const RATINGS4=['Needs Improvement','Satisfactory','Very Good','Excellent'];
const RATINGS5=['Does Not Meet','Needs Improvement','Meets','Exceeds','Far Exceeds'];
const CADET_GRADES=['C/AB','C/Amn','C/A1C','C/SrA','C/SSgt','C/TSgt','C/MSgt','C/SMSgt','C/CMSgt','C/2d Lt','C/1st Lt','C/Capt','C/Maj','C/Lt Col','C/Col'];
const SENIOR_GRADES=['SM','SSgt','TSgt','MSgt','SMSgt','CMSgt','FO','TFO','SFO','2d Lt','1st Lt','Capt','Maj','Lt Col','Col','Brig Gen','Maj Gen'];
const ROLES={
  cadetEvaluator:{label:'Cadet Evaluator',desc:'Enter Phase I–IV cadet feedback for authorized units; view only records they personally entered.'},
  cadetReviewer:{label:'Cadet Reviewer',desc:'View all Phase I–IV cadet feedback, member reports, and unit trends for authorized units.'},
  encampmentEvaluator:{label:'Encampment Evaluator',desc:'Use active encampments as evaluation units and enter Encampment Student / Cadre feedback during the authorized event window.'},
  encampmentReviewer:{label:'Encampment Reviewer',desc:'View Encampment Student / Cadre feedback, reports, and encampment trends.'},
  seniorEvaluator:{label:'Senior Evaluator',desc:'Enter Senior feedback; view only Senior records they personally entered.'},
  seniorReviewer:{label:'Senior Reviewer',desc:'View all Senior feedback and Senior reports for the assigned unit.'},
  encampmentAdmin:{label:'Encampment Admin',desc:'Add and edit encampment events, including names, locations, dates, and active status. Does not grant feedback viewing rights.'},
  unitAdmin:{label:'Unit Admin',desc:'Manage users, permissions, and the shared member list for authorized units; see cadet unit trends.'},
  appAdmin:{label:'App Admin',desc:'Manage the application and all units; full visibility.'}
};
const FORMS={
  phase1:{label:'Phase 1',group:'cadet',title:'Cadet Leadership Feedback – Phase I',ratings:RATINGS4,categories:[
    ['Attitude','Displays a positive attitude; optimistic; enthusiastic; team-oriented'],
    ['Core Values','Aware of the Core Values; honest; practices customs & courtesies; polite and respectful; wears uniform properly'],
    ['Communication Skills','Listens actively; attentive; asks good questions'],
    ['Sense of Responsibility','Follows directions; dependable; arrives ready to learn and serve; effective in managing own time']
  ],narratives:[['cadetSuccess','Cadet’s Perspective — successes they are proud of'],['leaderSuccess','Leader’s Perspective — observed successes'],['cadetImprove','Cadet’s Perspective — leadership skills they plan to improve'],['leaderImprove','Leader’s Perspective — how the cadet can improve leadership skills']],decision:'promotion'},
  phase2:{label:'Phase 2',group:'cadet',title:'Cadet Leadership Feedback – Phase II',ratings:RATINGS4,categories:[
    ['Attitude','Maintains a positive attitude and encourages good attitudes in others; does not flaunt rank or authority'],
    ['Core Values','Displays a commitment to the Core Values; promotes team spirit, professionalism, and good sportsmanship as a team leader'],
    ['Communication Skills','Proficient in informal public speaking, including giving directions to and training junior cadets'],
    ['Sense of Responsibility','Enforces standards; trustworthy in supervising a small team; given a plan, is able to carry it out'],
    ['Inter-Personal Skills','Guides and coaches junior cadets; recognizes when junior cadets need help; leads by example; is not a “boss”']
  ],narratives:[['cadetSuccess','Cadet’s Perspective — successes they are proud of'],['leaderSuccess','Leader’s Perspective — observed successes'],['cadetImprove','Cadet’s Perspective — leadership skills they plan to improve'],['leaderImprove','Leader’s Perspective — how the cadet can improve leadership skills']],decision:'promotion'},
  phase3:{label:'Phase 3',group:'cadet',title:'Cadet Leadership Feedback – Phase III',ratings:RATINGS4,categories:[
    ['Attitude','Conscious of own performance; takes initiative to develop new skills; self-motivated and able to motivate others'],
    ['Core Values','Fair, just, and consistent in dealing with subordinates; exercises good judgment in knowing which matters should be referred up the chain'],
    ['Communication Skills','Writes and speaks clearly; presents ideas logically; wins through persuasion'],
    ['Sense of Responsibility','Takes projects from beginning to end; develops goals, plans, standards, and follows through; demonstrates ownership'],
    ['Inter-Personal Skills','Actively mentors NCOs; resolves conflicts fairly; criticizes constructively; dissents respectfully'],
    ['Critical Thinking','Plans ahead to meet the unit’s short-term needs; imaginative and not tied to old ideas'],
    ['Delegation Skills','Delegates routine tasks effectively; works through NCOs; keeps people informed; makes expectations clear; supervises other leaders']
  ],narratives:[['cadetSuccess','Cadet’s Perspective — successes they are proud of'],['leaderSuccess','Leader’s Perspective — observed successes'],['cadetImprove','Cadet’s Perspective — leadership skills they plan to improve'],['leaderImprove','Leader’s Perspective — how the cadet can improve leadership skills']],decision:'promotion'},
  phase4:{label:'Phase 4',group:'cadet',title:'Cadet Leadership Feedback – Phase IV',ratings:RATINGS4,categories:[
    ['Attitude','Resilient; disciplined in working toward long-term goals; welcomes change; practices continual self-improvement'],
    ['Core Values','Uses empathy; recognizes how Core Values apply to unfamiliar situations; makes sound and timely decisions independently'],
    ['Communication Skills','Articulate; succinct; persuasive; varies message to fit audience; explains complex issues'],
    ['Sense of Responsibility','Completes large projects with little supervision; follows and sets command intent; self-starter'],
    ['Inter-Personal Skills','Develops and mentors cadet officers; adapts leadership style to the situation; calm under pressure'],
    ['Critical Thinking','Sets long-term goals; visionary; recognizes long-term needs; mentally agile with unfamiliar problems'],
    ['Delegation Skills','Directs multiple teams and tasks; assigns people to the right jobs; delegates well; enables others to take charge']
  ],narratives:[['cadetSuccess','Cadet’s Perspective — successes they are proud of'],['leaderSuccess','Leader’s Perspective — observed successes'],['cadetImprove','Cadet’s Perspective — leadership skills they plan to improve'],['leaderImprove','Leader’s Perspective — how the cadet can improve leadership skills']],decision:'promotion'},
  encStudent:{label:'Encampment Student',group:'cadet',title:'Encampment Student Leadership Feedback',ratings:RATINGS4,categories:[
    ['Attitude','Willing to try new experiences; follows staff directions; open to feedback; bounces back after temporary setbacks'],
    ['Self-Discipline','Wears uniform properly; customs & courtesies; basic drill & ceremonies; maintains dorm and personal areas to standard'],
    ['Teamwork','Helps the team get the job done; encourages teammates; actively supports and relies on Cadet Wingman'],
    ['Career Exploration','Actively participates in tours/projects/classes; asks good questions; able to self-reflect on experiences']
  ],narratives:[['studentSuccess','Student Perspective — successes'],['studentImprove','Student Perspective — areas to improve post Encampment'],['capGoal','Student Perspective — CAP goal post Encampment'],['personalGoal','Student Perspective — personal goal post Encampment'],['observedSuccess','Flight Leader / Training Officer — observed successes'],['futureGoals','Flight Leader / Training Officer — suggested goals for the future']],decision:'graduate',encampment:true},
  encCadre:{label:'Encampment Cadre',group:'cadet',title:'Encampment Cadre Leadership Feedback',ratings:RATINGS4,categories:[
    ['Personal Integrity','Honest; good role model of the Core Values; does not show favoritism; humble'],
    ['People Skills','Positive leadership approach; motivates individuals and team; empathy; emphasizes learning and growth; appropriate intensity'],
    ['Communication Skills','Asks questions; listens carefully; speaks clearly and concisely; able to speak in front of groups; keeps superiors informed'],
    ['Safety Focus','Proactively keeps people safe; knows location of subordinates; safety-conscious attitude'],
    ['Mission Effectiveness','Clear vision; teaches and develops team; knowledgeable; thorough; on time; professional'],
    ['Delegation Skills','Encourages questions and creativity; gives clear directions; monitors progress and redirects as needed']
  ],narratives:[['cadreSuccess','Cadre Perspective — most successful with'],['cadreImprove','Cadre Perspective — areas to improve'],['cadreGoals','Cadre Perspective — goals for the future'],['observedSuccess','Supervisor — observed successes'],['observedImprove','Supervisor — observed areas for improvement']],decision:null,encampment:true},
  senior:{label:'Senior',group:'senior',title:'CAP Performance Feedback Form — Senior',ratings:RATINGS5,categories:[
    ['Job Knowledge','Knowledge required to perform duties effectively; improves knowledge; applies knowledge to non-routine situations'],
    ['Leadership Skills','Sets and enforces standards; teamwork; initiative; motivates subordinates; fair and consistent; fosters safety'],
    ['Professional Qualities','Loyalty, discipline, dedication, integrity, honesty, officership; CAP standards; personal responsibility; fair and objective'],
    ['Organizational Skills','Plans, coordinates, schedules, uses resources effectively; meets suspenses; solves problems; delegates effectively'],
    ['Judgment and Decisions','Makes timely and accurate decisions; uses logic and information; retains composure; recognizes opportunities; safety'],
    ['Communications Skills','Listens, speaks, and writes effectively'],
    ['Equipment and Resource Management','Ensures accountability for aircraft, vehicles, communications, and computer equipment'],
    ['Financial Management','Understands financial management; ensures fiscal accountability, solvency, internal controls, and regulatory compliance']
  ],narratives:[['otherFeedback','Other Feedback — Communication, Mentoring, and Guidance (officer receiving feedback)'],['professionalDevelopment','Civil Air Patrol professional development'],['accomplishments','Accomplishments and successes'],['strengths','Strengths'],['goals','Suggested goals / areas for concentration or improvement'],['additionalComments','Additional comments']],decision:null,senior:true}
};



let DB={units:[],users:[],members:[],encampments:[],records:[]};
let currentUser=null;
let currentProfile=null;
let currentUnitId=null;
let activeView='entry';
let activeForm='phase1';
let editingUserId=null;
let editingMemberCapid=null;
let editingUnitId=null;
let editingEncampmentId=null;
let adminUsers=[];
let adminUsersUnitId=null;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.add('hidden'),3500)}
function escapeHtml(v=''){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setBusy(b){document.body.classList.toggle('busy',!!b)}
function friendlyError(err){return err?.message||err?.error_description||String(err||'Unknown error')}
function camelUnit(u){return{id:u.id,charterNumber:u.charter_number||'',name:u.name||'',active:u.active!==false,city:u.city||'',state:u.state||''}}
function camelEnc(e){return{id:e.id,name:e.name,location:e.location,startDate:e.start_date,endDate:e.end_date,active:e.active!==false,createdAt:e.created_at}}
function camelRecord(r){return{id:r.id,unitId:r.unit_id_at_evaluation||'',type:r.form_type,firstName:r.first_name_snapshot,lastName:r.last_name_snapshot,subjectName:[r.first_name_snapshot,r.last_name_snapshot].filter(Boolean).join(' '),capid:r.capid_snapshot,grade:r.grade_at_evaluation||'',reviewStart:r.review_start||'',reviewEnd:r.review_end||'',encampmentId:r.encampment_id||'',location:'',feedbackType:r.feedback_type||'',feedbackMode:r.feedback_mode||'',dutyTitle:r.duty_title||'',discussionDate:r.discussion_date||'',ratings:r.ratings||{},comments:r.comments||{},narratives:r.narratives||{},decision:r.decision||{},evaluatorTitle:r.evaluator_title||'',createdBy:r.evaluator_user_id,createdAt:r.created_at||'',evaluatorNameSnapshot:r.evaluator_name_snapshot||''}}
function memberName(obj){return [obj?.firstName,obj?.lastName].filter(Boolean).join(' ').trim()||obj?.subjectName||obj?.displayName||''}
function userName(id){const u=DB.users.find(x=>x.id===id);if(u)return memberName(u)||u.displayName||'CAP User';const r=DB.records.find(x=>x.createdBy===id&&x.evaluatorNameSnapshot);return r?.evaluatorNameSnapshot||'CAP User'}
function unitDisplay(u){if(!u)return'';return [u.charterNumber,u.name].filter(Boolean).join(' — ')}
function unitName(id){const u=DB.units.find(x=>x.id===id);return u?unitDisplay(u):id||''}
function activeUnits(){return DB.units.filter(u=>u.active!==false).sort((a,b)=>unitDisplay(a).localeCompare(unitDisplay(b)))}
function lookupMember(capid){return DB.members.find(m=>String(m.capid)===String(capid||'').trim())||null}
function isAppAdmin(){return !!currentUser?.globalRoles?.appAdmin}
function hasGlobal(role){return isAppAdmin()||!!currentUser?.globalRoles?.[role]}
function unitRole(unitId,role){return isAppAdmin()||!!currentUser?.unitRoles?.[unitId]?.[role]}
function hasAnyUnitRole(role){return isAppAdmin()||Object.values(currentUser?.unitRoles||{}).some(r=>!!r[role])}
function canEnterCadet(unitId){return unitId?unitRole(unitId,'cadetEvaluator'):hasAnyUnitRole('cadetEvaluator')}
function canReviewCadet(unitId){return unitId?(unitRole(unitId,'cadetReviewer')||unitRole(unitId,'unitAdmin')):(hasAnyUnitRole('cadetReviewer')||hasAnyUnitRole('unitAdmin'))}
function canEnterSenior(unitId){return unitId?unitRole(unitId,'seniorEvaluator'):hasAnyUnitRole('seniorEvaluator')}
function canReviewSenior(unitId){return unitId?unitRole(unitId,'seniorReviewer'):hasAnyUnitRole('seniorReviewer')}
function canEnterEncampment(){return hasGlobal('encampmentEvaluator')}
function canReviewEncampment(){return hasGlobal('encampmentReviewer')}
function canEncampmentAdmin(){return hasGlobal('encampmentAdmin')}
function canUserAdmin(unitId){return isAppAdmin()||(unitId?unitRole(unitId,'unitAdmin'):hasAnyUnitRole('unitAdmin'))}
function canAdminPage(){return canUserAdmin()||canEncampmentAdmin()}
function hasAnyReview(){return canReviewCadet()||canReviewSenior()||canReviewEncampment()}
function adminAccessibleUnits(){return (isAppAdmin()?DB.units:DB.units.filter(u=>unitRole(u.id,'unitAdmin'))).slice().sort((a,b)=>unitDisplay(a).localeCompare(unitDisplay(b)))}
function operationalAccessibleUnits(){return activeUnits().filter(u=>isAppAdmin()||currentUser?.unitRoles?.[u.id])}
function entryAccessibleLocations(){
  const opts=[];
  activeUnits().forEach(u=>{if(canEnterCadet(u.id)||canEnterSenior(u.id))opts.push({key:'unit:'+u.id,label:unitDisplay(u),kind:'unit'})});
  if(canEnterEncampment())activeEncampments().forEach(e=>opts.push({key:'enc:'+e.id,label:'Encampment — '+e.name,kind:'encampment'}));
  return opts;
}
function reportAccessibleUnits(){return activeUnits().filter(u=>isAppAdmin()||canReviewCadet(u.id)||canReviewSenior(u.id))}
function reportLocationOptions(includeAllUnits=false){
  const opts=[];const units=reportAccessibleUnits();if(includeAllUnits&&units.length)opts.push({key:'allunits',label:'All Units'});
  units.forEach(u=>opts.push({key:'unit:'+u.id,label:'Unit — '+unitDisplay(u)}));
  if(canReviewEncampment())allEncampments().forEach(e=>opts.push({key:'enc:'+e.id,label:'Encampment — '+e.name+(e.active?'':' (Inactive/Past)')}));
  return opts;
}
function myLocationOptions(){
  const map=new Map();entryAccessibleLocations().forEach(o=>map.set(o.key,o));
  DB.records.filter(r=>r.createdBy===currentUser?.id).forEach(r=>{const k=locationKeyForRecord(r);map.set(k,{key:k,label:locationLabel(k)})});
  return [...map.values()];
}
function visibleToCurrentUser(rec){
  if(isAppAdmin())return true;
  const f=FORMS[rec.type];if(!f)return false;
  if(rec.encampmentId)return canReviewEncampment()||(rec.createdBy===currentUser?.id&&canEnterEncampment());
  if(f.group==='senior')return canReviewSenior(rec.unitId)||(rec.createdBy===currentUser?.id&&canEnterSenior(rec.unitId));
  return canReviewCadet(rec.unitId)||(rec.createdBy===currentUser?.id&&canEnterCadet(rec.unitId));
}
function selectedDefaultLocationKey(){
  const opts=entryAccessibleLocations();
  const stored=localStorage.getItem(DEFAULT_KEY_PREFIX+(currentUser?.id||''));
  let key=window.__defaultLocationKey||stored||((currentUnitId&&opts.some(o=>o.key==='unit:'+currentUnitId))?'unit:'+currentUnitId:'');
  if(!opts.some(o=>o.key===key))key=opts[0]?.key||'';
  window.__defaultLocationKey=key;return key;
}
function selectedEntryLocationKey(){const opts=entryAccessibleLocations();let key=window.__entryLocationKey||selectedDefaultLocationKey();if(!opts.some(o=>o.key===key))key=selectedDefaultLocationKey()||opts[0]?.key||'';window.__entryLocationKey=key;return key}
function entryLocationUnitId(key=selectedEntryLocationKey()){return key?.startsWith('unit:')?key.slice(5):''}
function entryLocationEncampment(key=selectedEntryLocationKey()){return key?.startsWith('enc:')?DB.encampments.find(e=>e.id===key.slice(4))||null:null}
function allEncampments(){return (DB.encampments||[]).slice().sort((a,b)=>(b.startDate||'').localeCompare(a.startDate||'')||(b.createdAt||'').localeCompare(a.createdAt||''))}
function locationKeyForRecord(r){return r.encampmentId?'enc:'+r.encampmentId:'unit:'+r.unitId}
function recordMatchesLocation(r,key){if(!key||key==='all')return true;if(key==='allunits')return !r.encampmentId;if(key.startsWith('unit:'))return !r.encampmentId&&r.unitId===key.slice(5);if(key.startsWith('enc:'))return r.encampmentId===key.slice(4);return false}
function locationLabel(key){if(key==='all')return'All Locations';if(key==='allunits')return'All Units';if(key?.startsWith('unit:'))return unitName(key.slice(5));if(key?.startsWith('enc:')){const e=DB.encampments.find(x=>x.id===key.slice(4));return e?'Encampment — '+e.name:key}return key||''}
function locationOptionsHtml(opts,selected){return opts.map(o=>`<option value="${escapeHtml(o.key)}" ${o.key===selected?'selected':''}>${escapeHtml(o.label)}</option>`).join('')}
function reportScopeOptionsForLocation(location){
  const opts=[];
  if(location?.startsWith('enc:')){if(canReviewEncampment())opts.push(['cadet','Cadet']);return opts}
  if(location==='allunits'){if(canReviewCadet())opts.push(['cadet','Cadet']);if(canReviewSenior())opts.push(['senior','Senior']);return opts}
  const unitId=location?.startsWith('unit:')?location.slice(5):currentUnitId;
  if(canReviewCadet(unitId))opts.push(['cadet','Cadet']);if(canReviewSenior(unitId))opts.push(['senior','Senior']);return opts;
}
function reportScopeOptions(){return reportScopeOptionsForLocation(window.__reportLocation||('unit:'+currentUnitId))}

function permittedFormsForLocation(key=selectedEntryLocationKey()){
  if(key?.startsWith('enc:'))return canEnterEncampment()?Object.entries(FORMS).filter(([,f])=>f.encampment):[];
  const unitId=entryLocationUnitId(key),out=[];
  if(canEnterCadet(unitId))Object.entries(FORMS).filter(([,f])=>f.group==='cadet'&&!f.encampment).forEach(x=>out.push(x));
  if(canEnterSenior(unitId))out.push(['senior',FORMS.senior]);
  return out;
}
function activeEncampments(){return (DB.encampments||[]).filter(e=>e.active).sort((a,b)=>(b.startDate||'').localeCompare(a.startDate||'')||(b.createdAt||'').localeCompare(a.createdAt||''))}
function formatDatePretty(v){if(!v)return'';const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?v:d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function encampmentLabel(e){return e?`${e.name}${e.location?' — '+e.location:''}${e.startDate?' — '+formatDatePretty(e.startDate)+(e.endDate?' to '+formatDatePretty(e.endDate):''):''}`:''}
function localTodayISO(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function shiftISODate(v,days){if(!v)return'';const d=new Date(v+'T12:00:00');d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function encampmentEntryStatus(enc){const today=localTodayISO(),openDate=shiftISODate(enc.startDate,-3),closeDate=enc.endDate;const open=enc.active&&today>=openDate&&today<=closeDate;let message=open?`Entries are allowed through ${formatDatePretty(closeDate)}.`:today<openDate?`Entry opens ${formatDatePretty(openDate)} (3 days before the encampment).`:`Entry closed ${formatDatePretty(closeDate)}.`;if(!enc.active)message='This encampment is inactive; new entries are locked.';return{open,locked:!open,openDate,closeDate,message}}

async function invokeAdminFunction(payload){
  const {data,error}=await sb.functions.invoke(CFG.adminFunctionName||'leadership-admin-users',{body:payload});
  if(error)throw error;if(data?.error)throw new Error(data.error);return data;
}

async function loadAppData(){
  if(!sb)throw new Error('Supabase is not configured.');
  const {data:{user},error:userErr}=await sb.auth.getUser();if(userErr||!user)throw userErr||new Error('Not signed in');
  const [profileR,unitsR,globalR,unitPermR,encR,feedbackR,membersR,assignR,namesR]=await Promise.all([
    sb.from('profiles').select('id,display_name,member_id,default_unit_id').eq('id',user.id).single(),
    sb.from('units').select('id,charter_number,name,city,state,active').order('charter_number'),
    sb.from('leadership_global_permissions').select('*').eq('user_id',user.id).maybeSingle(),
    sb.from('leadership_unit_permissions').select('*').eq('user_id',user.id),
    sb.from('leadership_encampments').select('*').order('start_date',{ascending:false}),
    sb.from('leadership_feedback').select('*').order('created_at',{ascending:false}),
    sb.from('members').select('id,capid,first_name,last_name,member_type,active'),
    sb.from('member_unit_assignments').select('id,member_id,unit_id,is_primary,active,start_date,end_date').eq('active',true),
    sb.rpc('leadership_user_names')
  ]);
  for(const r of [profileR,unitsR,globalR,unitPermR,encR,feedbackR,membersR,assignR,namesR])if(r.error)throw r.error;
  currentProfile=profileR.data;
  DB.units=(unitsR.data||[]).map(camelUnit);
  DB.encampments=(encR.data||[]).map(camelEnc);
  DB.records=(feedbackR.data||[]).map(camelRecord);
  const primary=new Map();for(const a of assignR.data||[]){if(a.is_primary&&!primary.has(a.member_id))primary.set(a.member_id,a.unit_id)}
  DB.members=(membersR.data||[]).map(m=>({id:m.id,capid:m.capid,firstName:m.first_name,lastName:m.last_name,memberType:m.member_type,active:m.active!==false,unitId:primary.get(m.id)||''}));
  DB.users=(namesR.data||[]).map(u=>({id:u.user_id,displayName:u.display_name,firstName:u.first_name||'',lastName:u.last_name||'',memberType:u.member_type||'',email:'',roles:[],unitId:''}));

  const gp=globalR.data||{};const globalRoles={appAdmin:!!gp.is_app_admin,encampmentEvaluator:!!gp.encampment_evaluator,encampmentReviewer:!!gp.encampment_reviewer,encampmentAdmin:!!gp.encampment_admin};
  const unitRoles={};for(const p of unitPermR.data||[])unitRoles[p.unit_id]={cadetEvaluator:!!p.cadet_evaluator,cadetReviewer:!!p.cadet_reviewer,seniorEvaluator:!!p.senior_evaluator,seniorReviewer:!!p.senior_reviewer,unitAdmin:!!p.unit_admin};
  const display=currentProfile.display_name||user.email?.split('@')[0]||'CAP User';const parts=display.trim().split(/\s+/);const first=parts.shift()||display,last=parts.join(' ');
  const union=[];Object.entries(globalRoles).forEach(([k,v])=>{if(v)union.push(k)});Object.values(unitRoles).forEach(r=>Object.entries(r).forEach(([k,v])=>{if(v&&!union.includes(k))union.push(k)}));
  let defaultUnit=currentProfile.default_unit_id||Object.keys(unitRoles)[0]||'';if(globalRoles.appAdmin&&!defaultUnit)defaultUnit=activeUnits()[0]?.id||DB.units[0]?.id||'';
  currentUser={id:user.id,email:user.email||'',firstName:first,lastName:last,displayName:display,unitId:defaultUnit,roles:union,globalRoles,unitRoles};
  currentUnitId=defaultUnit;
  const me=DB.users.find(u=>u.id===user.id);if(me)Object.assign(me,currentUser);else DB.users.push({...currentUser});
  DB.records.forEach(r=>{if(r.encampmentId){const e=DB.encampments.find(x=>x.id===r.encampmentId);r.location=e?encampmentLabel(e):''}});
}

async function refreshData(render=true){await loadAppData();if(render)showApp()}

async function login(){
  $('#loginError').classList.add('hidden');if(!SUPABASE_READY){$('#configError').textContent='Edit config.js and paste the existing CAP Schedule Supabase anon/publishable key before using the app.';$('#configError').classList.remove('hidden');return}
  setBusy(true);try{const email=$('#loginEmail').value.trim(),password=$('#loginPassword').value;const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;await loadAppData();showApp()}catch(e){$('#loginError').textContent=friendlyError(e);$('#loginError').classList.remove('hidden')}finally{setBusy(false)}
}
async function logout(){if(sb)await sb.auth.signOut();currentUser=null;DB={units:[],users:[],members:[],encampments:[],records:[]};$('#app').classList.add('hidden');$('#loginScreen').classList.remove('hidden')}
function showApp(){
  $('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');
  $('#userName').textContent=memberName(currentUser)||currentUser.displayName;$('#memberTypePill').textContent=currentUser.memberType||'CAP User';
  $('#rolePill').textContent=currentUser.roles.length?currentUser.roles.map(r=>ROLES[r]?.label||r).join(' • '):'No Leadership permissions';
  const opts=entryAccessibleLocations(),def=selectedDefaultLocationKey(),sel=$('#defaultLocationSelect');
  sel.innerHTML=opts.length?opts.map(o=>`<option value="${escapeHtml(o.key)}" ${o.key===def?'selected':''}>${escapeHtml(o.label)}</option>`).join(''):'<option value="">No available evaluation units</option>';sel.disabled=!opts.length;
  buildNav();navigate(activeView);
}
function buildNav(){const nav=[];if(entryAccessibleLocations().length)nav.push(['entry','Feedback Entry']);if(entryAccessibleLocations().length)nav.push(['my','Feedback Records You Have Given']);if(hasAnyReview())nav.push(['reports','Reports']);if(hasAnyReview())nav.push(['trends','Unit Trends']);if(canAdminPage())nav.push(['admin','Administration']);$('#mainnav').innerHTML=nav.map(([id,label])=>`<button class="navbtn ${activeView===id?'active':''}" data-view="${id}">${label}</button>`).join('');$$('#mainnav .navbtn').forEach(b=>b.onclick=()=>navigate(b.dataset.view))}
function navigate(view){activeView=view;$$('.view').forEach(v=>v.classList.add('hidden'));const el=$('#view-'+view);if(!el)return;el.classList.remove('hidden');buildNav();const fn={entry:renderEntry,my:renderMy,reports:renderReports,trends:renderTrends,admin:renderAdmin}[view];if(fn)fn()}

function renderEntry(){
  const locations=entryAccessibleLocations();if(!locations.length){$('#view-entry').innerHTML='<div class="panel"><div class="empty">You do not have evaluator permissions for an active unit or encampment.</div></div>';return}
  const locKey=selectedEntryLocationKey(),p=permittedFormsForLocation(locKey),enc=entryLocationEncampment(locKey);
  if(!p.some(([k])=>k===activeForm))activeForm=p[0]?.[0]||'';
  const status=enc?encampmentEntryStatus(enc):null;
  $('#view-entry').innerHTML=`<div class="panel"><h2>Enter Leadership Feedback</h2><p class="sub">The Evaluation Unit controls which worksheets are available. Regular units show the Phase/Senior worksheets allowed by your permissions; encampments show only Encampment Student and Encampment Cadre. The header selector remains your default.</p>
  <div class="grid grid-2" style="align-items:end"><div class="field"><label>Evaluation Unit</label><select id="entryLocationSelect">${locations.map(o=>`<option value="${escapeHtml(o.key)}" ${o.key===locKey?'selected':''}>${escapeHtml(o.label)}</option>`).join('')}</select></div>${enc?`<div class="field"><label>Encampment Dates</label><input value="${escapeHtml(formatDatePretty(enc.startDate)+' – '+formatDatePretty(enc.endDate))}" disabled><div class="entry-window">Entry opens 3 days before the start date.</div></div>`:''}</div>
  ${status?`<div class="alert ${status.open?'alert-info':'alert-warn'}"><b>${status.open?'Encampment entry window is open.':'Encampment entry is locked.'}</b> ${escapeHtml(status.message)}</div>`:''}
  ${p.length?`<div class="form-tabs">${p.map(([k,x])=>`<button class="form-tab ${k===activeForm?'active':''}" data-form="${k}">${x.label}</button>`).join('')}</div><div id="feedbackForm"></div>`:'<div class="empty">No feedback worksheets are available for this Evaluation Unit with your current permissions.</div>'}</div>`;
  $$('#view-entry .form-tab').forEach(b=>b.onclick=()=>{activeForm=b.dataset.form;renderEntry()});
  $('#entryLocationSelect').onchange=e=>{window.__entryLocationKey=e.target.value;activeForm='';renderEntry()};
  if(p.length)renderFeedbackForm(activeForm);
}

function ratingName(i){return'rating_'+i}

function gradeOptions(group){const grades=group==='senior'?SENIOR_GRADES:CADET_GRADES;return '<option value="">Select grade...</option>'+grades.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')}

function renderFeedbackForm(type){
  const f=FORMS[type],locKey=selectedEntryLocationKey(),enc=entryLocationEncampment(locKey),unitId=entryLocationUnitId(locKey),isSenior=f.group==='senior',today=localTodayISO(),encStatus=enc?encampmentEntryStatus(enc):null,hasLocation=!!locKey;
  if(!permittedFormsForLocation(locKey).some(([k])=>k===type)){ $('#feedbackForm').innerHTML='<div class="empty">That worksheet is not available for the selected Evaluation Unit.</div>';return }
  let html=`<form id="entryForm" class="${encStatus?.locked?'locked-form':''}"><div class="section-title">${escapeHtml(f.title)}</div><div class="grid grid-4">
    <div class="field"><label>CAPID</label><input name="capid" id="subjectCapid" inputmode="numeric" autocomplete="off" required><div id="capidLookupStatus" class="lookup-status">Enter a CAPID to look up the member name.</div></div>
    <div class="field"><label>Last Name</label><input name="lastName" id="subjectLastName" required></div>
    <div class="field"><label>First Name</label><input name="firstName" id="subjectFirstName" required></div>
    <div class="field"><label>Grade</label><select name="grade" required>${gradeOptions(isSenior?'senior':'cadet')}</select></div>
  </div>`;
  if(isSenior)html+=`<div class="grid grid-4"><div class="field"><label>Feedback Type</label><select name="feedbackType"><option>Initial</option><option selected>Annual</option><option>Special</option></select></div><div class="field"><label>Feedback Mode</label><select name="feedbackMode"><option>Supervisor Feedback</option><option>Self Review</option></select></div><div class="field"><label>Duty Title</label><input name="dutyTitle"></div><div class="field"><label>Date of Discussion</label><input type="date" name="discussionDate" value="${today}" required></div></div><div class="field" style="max-width:520px"><label>Evaluation Unit</label><input value="${escapeHtml(unitName(unitId))}" disabled></div>`;
  else if(f.encampment)html+=`<div class="grid grid-2"><div class="field"><label>Evaluation Unit</label><input value="${escapeHtml(encampmentLabel(enc))}" disabled></div><div class="field"><label>Feedback Date</label><input name="reviewEnd" type="date" value="${today}" min="${escapeHtml(encStatus.openDate)}" max="${escapeHtml(encStatus.closeDate)}" required></div></div>`;
  else html+=`<div class="grid grid-2"><div class="field"><label>Inclusive Review Start <span style="font-weight:400;color:#71808d">(optional)</span></label><input name="reviewStart" type="date"></div><div class="field"><label>Inclusive Review End</label><input name="reviewEnd" type="date" value="${today}" required></div></div>`;
  html+=`<div class="section-title">Performance Ratings</div><div class="table-scroll"><table class="ratings"><thead><tr><th>Category</th><th>Performance Goals</th><th>Rating</th></tr></thead><tbody>`;
  f.categories.forEach((c,i)=>{html+=`<tr><td>${i+1}. ${escapeHtml(c[0])}</td><td class="goal">${escapeHtml(c[1])}</td><td><div class="rating-options">${f.ratings.map(r=>`<span class="rating-chip"><input id="${ratingName(i)}_${r.replace(/\W/g,'')}" type="radio" name="${ratingName(i)}" value="${escapeHtml(r)}"><label for="${ratingName(i)}_${r.replace(/\W/g,'')}">${escapeHtml(r)}</label></span>`).join('')}</div>${isSenior?`<div class="comment-box"><textarea name="comment_${i}" placeholder="Qualitative comments for this rating"></textarea></div>`:''}</td></tr>`});
  html+='</tbody></table></div><div class="section-title">Perspectives & Narrative</div><div class="grid grid-2">';
  f.narratives.forEach(([key,label])=>html+=`<div class="field"><label>${escapeHtml(label)}</label><textarea name="n_${key}"></textarea></div>`);html+='</div>';
  if(f.decision==='promotion')html+=`<div class="section-title">Promotion Recommendation</div><div class="grid grid-3"><div class="field"><label>Recommendation</label><select name="promotion"><option value="">Select...</option><option value="approved">Promotion Approved</option><option value="sustained">Sustained in Grade</option></select></div><div class="field"><label>Date of Next Review (if sustained)</label><input type="date" name="nextReview"></div><div class="field"><label>Evaluator Title</label><input name="evaluatorTitle" placeholder="Cadet Programs Officer"></div></div>`;
  else if(f.decision==='graduate')html+=`<div class="section-title">Graduation Recommendation</div><div class="grid grid-2"><div class="field"><label>Recommend Graduate?</label><select name="graduate"><option value="">Select...</option><option value="yes">Yes</option><option value="no">No</option></select></div><div class="field"><label>Evaluator Title</label><input name="evaluatorTitle"></div></div>`;
  else html+=`<div class="section-title">Evaluator</div><div class="grid grid-2"><div class="field"><label>Evaluator</label><input value="${escapeHtml(userName(currentUser.id))}" disabled></div><div class="field"><label>Evaluator Title</label><input name="evaluatorTitle"></div></div>`;
  html+=`<div class="form-actions"><button type="button" id="clearForm" class="btn btn-secondary">Clear</button><button type="submit" class="btn btn-primary" ${(!hasLocation||encStatus?.locked)?'disabled':''}>Save Feedback</button></div></form>`;
  $('#feedbackForm').innerHTML=html;$('#entryForm').onsubmit=saveFeedback;$('#clearForm').onclick=()=>renderFeedbackForm(activeForm);bindCapidLookup(f.group,locKey);
  if(encStatus?.locked)$('#entryForm').querySelectorAll('input,select,textarea,button[type="submit"]').forEach(el=>el.disabled=true);
}

function bindCapidLookup(group,locKey=selectedEntryLocationKey()){
  const cap=$('#subjectCapid'),first=$('#subjectFirstName'),last=$('#subjectLastName'),status=$('#capidLookupStatus');if(!cap)return;
  const run=()=>{
    const id=cap.value.trim(),m=lookupMember(id),unitId=entryLocationUnitId(locKey),isEnc=locKey?.startsWith('enc:');if(!id){status.textContent='Enter a CAPID to look up the member name.';status.className='lookup-status';return}
    if(m){
      first.value=m.firstName||'';last.value=m.lastName||'';first.dataset.autofilled='1';last.dataset.autofilled='1';
      const mismatch=(group==='senior'&&m.memberType!=='Senior')||(group!=='senior'&&m.memberType==='Senior');
      const wrongUnit=!isEnc&&!!unitId&&!!m.unitId&&m.unitId!==unitId;
      const inactive=m.active===false;
      let msg=`Found ${memberName(m)} — name populated automatically.`;
      if(mismatch)msg=`Found ${memberName(m)}, but this CAPID is listed as ${m.memberType}.`;
      else if(wrongUnit)msg=`Found ${memberName(m)}, but the member is assigned to ${unitName(m.unitId)}. Select that Evaluation Unit before saving.`;
      else if(isEnc&&m.unitId)msg=`Found ${memberName(m)} — home unit: ${unitName(m.unitId)}. The encampment remains the Evaluation Unit.`;
      if(inactive)msg+=` This member is inactive; saving new feedback will automatically reactivate the member.`;
      status.textContent=msg;status.className='lookup-status '+((mismatch||wrongUnit||inactive)?'lookup-warn':'lookup-ok');
    }else{
      if(first.dataset.autofilled==='1')first.value='';if(last.dataset.autofilled==='1')last.value='';delete first.dataset.autofilled;delete last.dataset.autofilled;
      status.textContent='CAPID not found in the shared member list. Enter Last Name and First Name manually; it will be saved as an active member for future lookup.';status.className='lookup-status lookup-warn';
    }
  };
  cap.addEventListener('input',run);cap.addEventListener('blur',run);
}

function effectiveRecordDate(r){return r.reviewEnd||r.discussionDate||(r.createdAt||'').slice(0,10)}

function compareRecordDates(a,b){return effectiveRecordDate(b).localeCompare(effectiveRecordDate(a))||(b.createdAt||'').localeCompare(a.createdAt||'')}

function recordTable(recs){if(!recs.length)return'<div class="empty">No feedback records found.</div>';return`<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Member</th><th>CAPID</th><th>Location</th><th>Type</th><th>Evaluator</th><th></th></tr></thead><tbody>${recs.map(r=>`<tr><td>${escapeHtml(formatDatePretty(effectiveRecordDate(r)))}</td><td>${escapeHtml(memberName(r))}</td><td>${escapeHtml(r.capid)}</td><td>${escapeHtml(locationLabel(locationKeyForRecord(r)))}</td><td>${escapeHtml(FORMS[r.type]?.label||r.type)}${FORMS[r.type]?.group==='senior'?' <span class="role-tag senior">Senior</span>':''}</td><td>${escapeHtml(userName(r.createdBy))}</td><td><button class="btn btn-sm btn-ghost view-record" data-id="${r.id}">View</button></td></tr>`).join('')}</tbody></table></div>`}

function bindRecordButtons(){$$('.view-record').forEach(b=>b.onclick=()=>openRecord(b.dataset.id))}

function openRecord(id){
  const r=DB.records.find(x=>x.id===id);if(!r||!visibleToCurrentUser(r)){toast('You do not have permission to view this record.');return}const f=FORMS[r.type];let h=`<div class="record-view">${f.group==='senior'?'<div class="alert alert-danger"><b>Restricted Senior Feedback</b></div>':''}<div class="grid grid-3"><div><b>${escapeHtml(memberName(r))}</b><br><small>${escapeHtml(r.grade||'')} ${r.capid?'• CAPID '+escapeHtml(r.capid):''}</small></div><div><b>${escapeHtml(f.title)}</b><br><small>${escapeHtml(unitName(r.unitId))}</small>${r.location?`<br><small>${escapeHtml(r.location)}</small>`:''}</div><div><b>Evaluator</b><br><small>${escapeHtml(userName(r.createdBy))} • ${escapeHtml(formatDatePretty(effectiveRecordDate(r)))}</small></div></div><h3>Ratings</h3>`;
  f.categories.forEach((c,i)=>{h+=`<div class="record-rating"><div><b>${escapeHtml(c[0])}</b><small>${escapeHtml(c[1])}</small>${r.comments?.[i]?`<div class="narrative" style="margin-top:6px"><b>Comment</b>${escapeHtml(r.comments[i])}</div>`:''}</div><span class="score-badge">${escapeHtml(r.ratings?.[i]||'Not Rated')}</span></div>`});
  h+='<h3>Narrative</h3>';f.narratives.forEach(([k,label])=>{if(r.narratives?.[k])h+=`<div class="narrative"><b>${escapeHtml(label)}</b>${escapeHtml(r.narratives[k])}</div>`});
  if(r.decision?.promotion)h+=`<div class="narrative"><b>Promotion Recommendation</b>${r.decision.promotion==='approved'?'Promotion Approved':'Sustained in Grade'} ${r.decision.nextReview?'— Next review '+escapeHtml(r.decision.nextReview):''}</div>`;
  if(r.decision?.graduate)h+=`<div class="narrative"><b>Graduation Recommendation</b>${r.decision.graduate.toUpperCase()}</div>`;
  h+='</div>';$('#modalTitle').textContent=f.label+' — '+memberName(r);$('#modalBody').innerHTML=h;$('#recordModal').showModal();
}

function isoToday(){return new Date().toISOString().slice(0,10)}

function monthsAgoIso(months){const d=new Date();d.setMonth(d.getMonth()-months);return d.toISOString().slice(0,10)}

function ensureDateState(prefix){const s='__'+prefix+'Start',e='__'+prefix+'End';if(!window[s])window[s]=monthsAgoIso(12);if(!window[e])window[e]=isoToday();return{start:window[s],end:window[e]}}

function dateInRange(date,start,end){if(!date)return false;return(!start||date>=start)&&(!end||date<=end)}

function renderDateControls(prefix){const state=ensureDateState(prefix);return`<div class="section-title">Date Range</div><div class="date-presets"><button type="button" class="btn btn-sm btn-ghost date-preset" data-prefix="${prefix}" data-months="1">1 Month</button><button type="button" class="btn btn-sm btn-ghost date-preset" data-prefix="${prefix}" data-months="3">3 Months</button><button type="button" class="btn btn-sm btn-ghost date-preset" data-prefix="${prefix}" data-months="6">6 Months</button><button type="button" class="btn btn-sm btn-ghost date-preset" data-prefix="${prefix}" data-months="12">1 Year</button></div><div class="grid grid-3" style="align-items:end"><div class="field"><label>Start Date</label><input id="${prefix}StartDate" type="date" value="${state.start}"></div><div class="field"><label>End Date</label><input id="${prefix}EndDate" type="date" value="${state.end}"></div><div class="field"><button id="${prefix}ApplyDates" type="button" class="btn btn-secondary">Apply Custom Range</button></div></div>`}

function bindDateControls(prefix,rerender){
  $$('.date-preset').filter(b=>b.dataset.prefix===prefix).forEach(b=>b.onclick=()=>{window['__'+prefix+'Start']=monthsAgoIso(Number(b.dataset.months));window['__'+prefix+'End']=isoToday();rerender()});
  const apply=$('#'+prefix+'ApplyDates');if(apply)apply.onclick=()=>{const start=$('#'+prefix+'StartDate').value,end=$('#'+prefix+'EndDate').value;if(start&&end&&start>end){toast('Start Date cannot be after End Date.');return}window['__'+prefix+'Start']=start;window['__'+prefix+'End']=end;rerender()};
}

function membersForReportLocation(locationKey,scope){
  const type=scope==='senior'?'Senior':'Cadet';
  let members=[];
  if(locationKey?.startsWith('unit:')){
    const unitId=locationKey.slice(5);members=DB.members.filter(m=>m.active!==false&&m.unitId===unitId&&m.memberType===type);
  }else if(locationKey?.startsWith('enc:')){
    const encId=locationKey.slice(4),capids=new Set(DB.records.filter(r=>r.encampmentId===encId&&FORMS[r.type]?.group===scope&&visibleToCurrentUser(r)).map(r=>String(r.capid)));
    members=DB.members.filter(m=>m.active!==false&&m.memberType===type&&capids.has(String(m.capid)));
  }
  return members.slice().sort((a,b)=>a.lastName.localeCompare(b.lastName)||a.firstName.localeCompare(b.firstName));
}

function historyTimeline(recs){if(!recs.length)return'<div class="empty">No records available for this member in the selected date range.</div>';return`<div class="timeline">${recs.map(r=>{const f=FORMS[r.type];const low=Object.entries(r.ratings||{}).filter(([i,v])=>v===f.ratings[0]||v===f.ratings[1]).map(([i])=>f.categories[i]?.[0]).filter(Boolean);return`<div class="timeline-item"><div class="timeline-head"><span class="timeline-title">${escapeHtml(f.label)}</span><span class="timeline-meta">${escapeHtml(formatDatePretty(effectiveRecordDate(r)))} • ${escapeHtml(userName(r.createdBy))}</span><button class="btn btn-sm btn-ghost view-record" data-id="${r.id}">Open</button></div><div class="timeline-body"><b>Focus areas:</b> ${low.length?escapeHtml(low.join(', ')):'No low-rated categories flagged.'}</div></div>`}).join('')}</div>`}

function normalizedAverage(recs){let vals=[];recs.forEach(r=>{const f=FORMS[r.type];Object.values(r.ratings||{}).forEach(v=>{const idx=f.ratings.indexOf(v);if(idx>=0)vals.push((idx/(f.ratings.length-1))*100)})});if(!vals.length)return null;return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}

function trendRecordMatchesFormLocation(r,location){
  const f=FORMS[r.type];if(!f)return false;
  // Keep encampment worksheets completely separate from normal unit trend statistics,
  // including older demo records that may have retained a home-unit id.
  if(location?.startsWith('enc:'))return f.encampment===true;
  if(location?.startsWith('unit:')||location==='allunits')return f.encampment!==true;
  return true;
}

function categoryStats(recs){const map={};recs.forEach(r=>{const f=FORMS[r.type];f.categories.forEach((c,i)=>{const v=r.ratings?.[i],idx=f.ratings.indexOf(v);if(idx<0)return;const key=c[0];if(!map[key])map[key]={name:key,sum:0,count:0};map[key].sum+=(idx/(f.ratings.length-1))*100;map[key].count++})});return Object.values(map).map(x=>({...x,avg:Math.round(x.sum/x.count)})).sort((a,b)=>a.avg-b.avg)}

function extractKeywords(recs){const stop=new Set('the and for with that this from have has had are was were will into your their they them our you but not can could should would need needs improve improvement areas area goals goal future more when where while during about after before better work working leadership cadet senior feedback member post observed suggested'.split(' '));const counts={};recs.forEach(r=>{Object.entries(r.narratives||{}).forEach(([k,v])=>{if(!/(improve|goal|concentration|area|additional)/i.test(k))return;String(v).toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(w=>w.length>3&&!stop.has(w)).forEach(w=>counts[w]=(counts[w]||0)+1)})});return Object.entries(counts).filter(([,c])=>c>1).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([word,count])=>({word,count}))}

function encampmentAdminPanel(){
  const events=allEncampments(),enc=editingEncampmentId?DB.encampments.find(x=>x.id===editingEncampmentId):null;
  return`<div class="panel"><h2>Encampment Events</h2><p class="sub">App Admins and Encampment Admins can add or edit encampment names, locations, dates, and status. Only active encampments appear as Evaluation Units for users with Encampment Evaluator permission. Entry is automatically limited to 3 days before the start date through the end date. Inactive/past encampments remain available in historical Reports and Unit Trends.</p><div class="section-title">${enc?'Edit Encampment':'Add Encampment'}</div><form id="encampmentForm"><input type="hidden" name="encampmentId" value="${escapeHtml(enc?.id||'')}"><div class="grid grid-4"><div class="field"><label>Encampment Name</label><input name="name" value="${escapeHtml(enc?.name||'')}" placeholder="Montana Wing Encampment 2027" required></div><div class="field"><label>Location</label><input name="location" value="${escapeHtml(enc?.location||'')}" placeholder="Fort Harrison, Montana" required></div><div class="field"><label>Start Date</label><input name="startDate" type="date" value="${escapeHtml(enc?.startDate||'')}" required></div><div class="field"><label>End Date</label><input name="endDate" type="date" value="${escapeHtml(enc?.endDate||'')}" required></div></div><div class="grid grid-2" style="align-items:end"><div class="check-card"><label><input type="checkbox" name="active" ${enc?.active===false?'':'checked'}> Active</label><small>Active events can appear as Evaluation Units for Encampment Evaluators.</small></div><div class="form-actions" style="justify-content:flex-start;margin-top:0"><button type="button" id="cancelEncampmentEdit" class="btn btn-secondary ${enc?'':'hidden'}">Cancel Edit</button><button type="submit" class="btn btn-primary">${enc?'Save Encampment Changes':'Add Encampment'}</button></div></div></form>${events.length?`<div class="table-wrap"><table class="data-table" style="min-width:820px"><thead><tr><th>Event</th><th>Location</th><th>Dates</th><th>Status</th><th></th></tr></thead><tbody>${events.map(e=>`<tr><td>${escapeHtml(e.name)}</td><td>${escapeHtml(e.location)}</td><td>${escapeHtml(formatDatePretty(e.startDate))} – ${escapeHtml(formatDatePretty(e.endDate))}</td><td><span class="role-tag ${e.active?'status-active':'status-inactive'}">${e.active?'Active':'Inactive'}</span></td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm btn-ghost edit-encampment" data-id="${e.id}">Edit</button><button class="btn btn-sm ${e.active?'btn-danger':'btn-secondary'} toggle-encampment" data-id="${e.id}">${e.active?'Mark Inactive':'Mark Active'}</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No encampment events have been entered.</div>'}</div>`
}

function unitsAdminPanel(){
  const u=editingUnitId?DB.units.find(x=>x.id===editingUnitId):null;
  return`<div class="panel"><h2>App Admin — Unit List</h2><p class="sub">Unit names and charter numbers are editable. Inactive units remain here for administration and history but are removed from operational pick lists.</p><div class="section-title">${u?'Edit Unit':'Add Unit'}</div><form id="unitForm"><input type="hidden" name="unitId" value="${escapeHtml(u?.id||'')}"><div class="grid grid-3"><div class="field"><label>Charter Number</label><input name="charterNumber" value="${escapeHtml(u?.charterNumber||'')}" placeholder="MT-003" required></div><div class="field"><label>Unit Name</label><input name="name" value="${escapeHtml(u?.name||'')}" placeholder="Example Composite Squadron" required></div><div class="check-card"><label><input type="checkbox" name="active" ${u?.active===false?'':'checked'}> Active</label><small>Inactive units do not appear in normal pick lists.</small></div></div><div class="form-actions" style="justify-content:flex-start"><button type="button" id="cancelUnitEdit" class="btn btn-secondary ${u?'':'hidden'}">Cancel Edit</button><button class="btn btn-primary" type="submit">${u?'Save Unit Changes':'Add Unit'}</button></div></form><div class="table-wrap"><table class="data-table" style="min-width:720px"><thead><tr><th>Charter</th><th>Unit Name</th><th>Status</th><th></th></tr></thead><tbody>${DB.units.slice().sort((a,b)=>unitDisplay(a).localeCompare(unitDisplay(b))).map(x=>`<tr><td>${escapeHtml(x.charterNumber)}</td><td>${escapeHtml(x.name)}</td><td><span class="role-tag ${x.active!==false?'status-active':'status-inactive'}">${x.active!==false?'Active':'Inactive'}</span></td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm btn-ghost edit-unit" data-id="${x.id}">Edit</button><button class="btn btn-sm ${x.active!==false?'btn-danger':'btn-secondary'} toggle-unit" data-id="${x.id}">${x.active!==false?'Mark Inactive':'Mark Active'}</button></div></td></tr>`).join('')}</tbody></table></div></div>`
}

async function saveFeedback(e){
  e.preventDefault();const form=new FormData(e.target),f=FORMS[activeForm],locKey=selectedEntryLocationKey(),enc=entryLocationEncampment(locKey),unitId=entryLocationUnitId(locKey),isEnc=!!enc;
  if(!locKey){toast('An Evaluation Unit is required.');return}
  if(f.encampment){if(!isEnc||!canEnterEncampment()){toast('Encampment Evaluator permission required.');return}}
  else if(isEnc){toast('Phase and Senior worksheets cannot be entered under an encampment Evaluation Unit.');return}
  else if(f.group==='senior'&&!canEnterSenior(unitId)){toast('Senior Evaluator permission required.');return}
  else if(f.group!=='senior'&&!canEnterCadet(unitId)){toast('Cadet Evaluator permission required.');return}
  if(isEnc&&!encampmentEntryStatus(enc).open){toast('Encampment feedback entry is locked outside the authorized date window.');return}
  const capid=String(form.get('capid')||'').trim(),known=lookupMember(capid);if(known){const mismatch=(f.group==='senior'&&known.memberType!=='Senior')||(f.group!=='senior'&&known.memberType==='Senior');if(mismatch){toast(`That CAPID is listed as ${known.memberType} and cannot be used on this form.`);return}if(!isEnc&&known.unitId&&known.unitId!==unitId){toast(`That member is assigned to ${unitName(known.unitId)}. Select that Evaluation Unit before saving.`);return}}
  const ratings={},comments={};let missing=false;f.categories.forEach((c,i)=>{const v=form.get(ratingName(i));if(!v)missing=true;ratings[i]=v||'';if(f.group==='senior')comments[i]=form.get('comment_'+i)||''});if(missing&&!confirm('Some rating categories are blank. Save anyway?'))return;
  const narratives={};f.narratives.forEach(([k])=>narratives[k]=form.get('n_'+k)||'');const firstName=String(form.get('firstName')||'').trim(),lastName=String(form.get('lastName')||'').trim();
  const payload={type:activeForm,unitId:isEnc?'':unitId,encampmentId:enc?.id||'',capid,firstName,lastName,grade:form.get('grade')||'',reviewStart:form.get('reviewStart')||'',reviewEnd:form.get('reviewEnd')||'',feedbackType:form.get('feedbackType')||'',feedbackMode:form.get('feedbackMode')||'',dutyTitle:form.get('dutyTitle')||'',discussionDate:form.get('discussionDate')||'',ratings,comments,narratives,decision:{promotion:form.get('promotion')||'',nextReview:form.get('nextReview')||'',graduate:form.get('graduate')||''},evaluatorTitle:form.get('evaluatorTitle')||''};
  if(!capid||!firstName||!lastName){toast('CAPID, Last Name, and First Name are required.');return}if(!f.senior&&!payload.reviewEnd){toast('The evaluation end / feedback date is required.');return}if(f.senior&&!payload.discussionDate){toast('The date of discussion is required.');return}
  setBusy(true);try{const {error}=await sb.rpc('leadership_save_feedback',{p_payload:payload});if(error)throw error;toast(known?.active===false?'Feedback saved and member reactivated.':'Feedback saved.');await refreshData(false);renderFeedbackForm(activeForm)}catch(err){toast(friendlyError(err))}finally{setBusy(false)}
}

function renderMy(){const opts=[{key:'all',label:'All Locations'},...myLocationOptions()];let loc=window.__myLocation||'all';if(!opts.some(o=>o.key===loc))loc='all';window.__myLocation=loc;const recs=DB.records.filter(r=>r.createdBy===currentUser.id&&visibleToCurrentUser(r)&&recordMatchesLocation(r,loc)).sort(compareRecordDates);$('#view-my').innerHTML=`<div class="panel"><h2>Feedback Records You Have Given</h2><p class="sub">Records you personally entered. Use the location selector here instead of relying on the header default.</p><div class="field" style="max-width:520px"><label>Unit / Encampment</label><select id="myLocation">${locationOptionsHtml(opts,loc)}</select></div>${recordTable(recs)}</div>`;$('#myLocation').onchange=e=>{window.__myLocation=e.target.value;renderMy()};bindRecordButtons()}

function reportTabsHtml(active){
  return`<div class="panel"><h2>Reports</h2><p class="sub">Use Unit Feedback for a running unit-level entry list, or Member Reports for an individual member's feedback history.</p><div class="form-tabs" style="margin-bottom:0"><button class="form-tab ${active==='unit'?'active':''}" data-report-tab="unit">Unit Feedback</button><button class="form-tab ${active==='member'?'active':''}" data-report-tab="member">Member Reports</button></div></div>`;
}
function bindReportTabs(){
  $$('#view-reports [data-report-tab]').forEach(b=>b.onclick=()=>{window.__reportsTab=b.dataset.reportTab;renderReports()});
}
function unitFeedbackOutcome(r){
  const promotion=String(r?.decision?.promotion||'').toLowerCase();
  if(promotion==='approved')return 'Pass';
  if(promotion==='sustained')return 'Retain in Grade';
  return '';
}
function renderReports(){
  const locations=reportLocationOptions(false);
  if(!locations.length){$('#view-reports').innerHTML='<div class="panel"><div class="empty">Reviewer permission required.</div></div>';return}
  const tab=window.__reportsTab==='member'?'member':'unit';window.__reportsTab=tab;
  if(tab==='member')renderMemberReports();else renderUnitFeedbackReport();
}
function renderUnitFeedbackReport(){
  const locations=reportLocationOptions(false);
  if(!locations.length){$('#view-reports').innerHTML='<div class="panel"><div class="empty">Reviewer permission required.</div></div>';return}
  let location=window.__reportLocation||('unit:'+currentUnitId);if(!locations.some(o=>o.key===location))location=locations[0]?.key||'';window.__reportLocation=location;
  const allRecords=DB.records.filter(r=>visibleToCurrentUser(r)&&recordMatchesLocation(r,location)).sort(compareRecordDates);
  let batchSize=Number(window.__unitFeedbackPageSize||10);if(!Number.isFinite(batchSize))batchSize=10;batchSize=Math.max(1,Math.min(100,Math.floor(batchSize)));window.__unitFeedbackPageSize=batchSize;
  let visibleCount=Number(window.__unitFeedbackVisibleCount||batchSize);if(!Number.isFinite(visibleCount)||visibleCount<1)visibleCount=batchSize;visibleCount=Math.max(batchSize,Math.floor(visibleCount));visibleCount=Math.min(visibleCount,Math.max(batchSize,allRecords.length));if(!allRecords.length)visibleCount=batchSize;window.__unitFeedbackVisibleCount=visibleCount;
  const visibleRecords=allRecords.slice(0,visibleCount),shown=visibleRecords.length,hasMore=shown<allRecords.length;
  const seniorVisible=allRecords.some(r=>FORMS[r.type]?.group==='senior');
  const table=visibleRecords.length?`<div class="table-wrap"><table class="data-table" style="min-width:1080px"><thead><tr><th>Evaluation Date</th><th>CAPID</th><th>Member</th><th>Grade</th><th>Pass / Retain in Grade</th><th>Feedback Type</th><th>Evaluator</th><th></th></tr></thead><tbody>${visibleRecords.map(r=>`<tr><td>${escapeHtml(formatDatePretty(effectiveRecordDate(r)))}</td><td>${escapeHtml(r.capid||'')}</td><td>${escapeHtml(memberName(r))}</td><td>${escapeHtml(r.grade||'')}</td><td>${escapeHtml(unitFeedbackOutcome(r)||'—')}</td><td>${escapeHtml(FORMS[r.type]?.label||r.type)}${FORMS[r.type]?.group==='senior'?' <span class="role-tag senior">Senior</span>':''}</td><td>${escapeHtml(userName(r.createdBy))}</td><td><button class="btn btn-sm btn-ghost view-record" data-id="${r.id}">View</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No feedback records are available for this location with your current permissions.</div>';
  $('#view-reports').innerHTML=`${reportTabsHtml('unit')}<div class="panel"><h2>Unit Feedback</h2><p class="sub">Running list of feedback submitted for the selected Unit or Encampment. This view is intended to make manual eServices entry easier. Records are shown newest first and only records you are authorized to review are included.</p>${seniorVisible?'<div class="alert alert-danger"><b>Senior records are confidential.</b> Senior feedback appears here only when your permissions allow it.</div>':''}<div class="grid grid-3" style="align-items:end"><div class="field"><label>Unit / Encampment</label><select id="unitFeedbackLocation">${locationOptionsHtml(locations,location)}</select></div><div class="field"><label>Records to Show at a Time</label><input id="unitFeedbackPageSize" type="number" min="1" max="100" step="1" value="${batchSize}"></div><div class="field"><button id="unitFeedbackApplyPageSize" type="button" class="btn btn-secondary">Apply Count</button></div></div><div class="sub" style="margin:14px 0 10px">Showing ${shown} of ${allRecords.length} records • Newest first</div>${table}${allRecords.length?`<div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:12px">${hasMore?`<button id="unitFeedbackNext" type="button" class="btn btn-sm btn-primary">Show Next ${Math.min(batchSize,allRecords.length-shown)}</button>`:'<span class="sub" style="margin:8px 0 0">All records are shown.</span>'}</div>`:''}</div>`;
  bindReportTabs();
  if($('#unitFeedbackLocation'))$('#unitFeedbackLocation').onchange=e=>{window.__reportLocation=e.target.value;window.__reportMember='';window.__reportScope='';window.__unitFeedbackVisibleCount=window.__unitFeedbackPageSize||10;renderReports()};
  const applySize=()=>{let n=Number($('#unitFeedbackPageSize')?.value||10);if(!Number.isFinite(n))n=10;n=Math.max(1,Math.min(100,Math.floor(n)));window.__unitFeedbackPageSize=n;window.__unitFeedbackVisibleCount=n;renderReports()};
  if($('#unitFeedbackApplyPageSize'))$('#unitFeedbackApplyPageSize').onclick=applySize;
  if($('#unitFeedbackPageSize'))$('#unitFeedbackPageSize').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();applySize()}};
  if($('#unitFeedbackNext'))$('#unitFeedbackNext').onclick=()=>{window.__unitFeedbackVisibleCount=Math.min(allRecords.length,shown+batchSize);renderReports()};
  bindRecordButtons();
}
function renderMemberReports(){
  const locations=reportLocationOptions(false);if(!locations.length){$('#view-reports').innerHTML='<div class="panel"><div class="empty">Reviewer permission required.</div></div>';return}
  let location=window.__reportLocation||('unit:'+currentUnitId);if(!locations.some(o=>o.key===location))location=locations[0]?.key||'';window.__reportLocation=location;
  const scopes=reportScopeOptionsForLocation(location);if(!scopes.length){$('#view-reports').innerHTML=`${reportTabsHtml('member')}<div class="panel"><div class="empty">You do not have reviewer permission for this location.</div></div>`;bindReportTabs();return}
  const scope=window.__reportScope&&scopes.some(s=>s[0]===window.__reportScope)?window.__reportScope:scopes[0][0];window.__reportScope=scope;const dates=ensureDateState('report');const members=membersForReportLocation(location,scope);
  let selected=window.__reportMember&&members.some(m=>String(m.capid)===String(window.__reportMember))?String(window.__reportMember):(members[0]?String(members[0].capid):'');window.__reportMember=selected;
  const recs=DB.records.filter(r=>FORMS[r.type]?.group===scope&&visibleToCurrentUser(r)&&recordMatchesLocation(r,location)&&dateInRange(effectiveRecordDate(r),dates.start,dates.end));const selectedRecs=recs.filter(r=>String(r.capid)===selected).sort(compareRecordDates),avg=normalizedAverage(selectedRecs);
  $('#view-reports').innerHTML=`${reportTabsHtml('member')}<div class="panel"><h2>Member Reports</h2><p class="sub">Select a Unit or Encampment, then Cadet or Senior where available. Reports default to the last year.</p>${scope==='senior'?'<div class="alert alert-danger"><b>Senior records are confidential.</b> This report is visible only to Senior Reviewers and Leadership App Admins.</div>':''}<div class="grid grid-3"><div class="field"><label>Unit / Encampment</label><select id="reportLocation">${locationOptionsHtml(locations,location)}</select></div><div class="field"><label>Report Type</label><select id="reportScope">${scopes.map(s=>`<option value="${s[0]}" ${s[0]===scope?'selected':''}>${s[1]}</option>`).join('')}</select></div><div class="field"><label>Member</label><select id="reportMember">${members.length?members.map(m=>`<option value="${escapeHtml(m.capid)}" ${String(m.capid)===selected?'selected':''}>${escapeHtml(m.lastName)}, ${escapeHtml(m.firstName)} — ${escapeHtml(m.capid)}</option>`).join(''):'<option value="">No active members for this selection</option>'}</select></div></div>${renderDateControls('report')}</div><div class="cards"><div class="metric"><div class="num">${selectedRecs.length}</div><div class="label">Feedback records</div></div><div class="metric"><div class="num">${avg===null?'—':avg+'%'}</div><div class="label">Normalized average rating</div></div><div class="metric"><div class="num">${selectedRecs[0]?escapeHtml(formatDatePretty(effectiveRecordDate(selectedRecs[0]))):'—'}</div><div class="label">Most recent feedback</div></div><div class="metric"><div class="num">${new Set(selectedRecs.map(r=>r.createdBy)).size}</div><div class="label">Unique evaluators</div></div></div><div class="panel"><h2>Feedback History</h2><p class="sub">${escapeHtml(locationLabel(location))} • Newest first • ${escapeHtml(formatDatePretty(dates.start)||'Beginning')} through ${escapeHtml(formatDatePretty(dates.end)||'Today')}</p>${historyTimeline(selectedRecs)}</div>`;
  bindReportTabs();
  $('#reportLocation').onchange=e=>{window.__reportLocation=e.target.value;window.__reportMember='';window.__reportScope='';renderReports()};$('#reportScope').onchange=e=>{window.__reportScope=e.target.value;window.__reportMember='';renderReports()};if($('#reportMember'))$('#reportMember').onchange=e=>{window.__reportMember=e.target.value;renderReports()};bindDateControls('report',renderReports);bindRecordButtons();
}

function renderTrends(){
  const locations=reportLocationOptions(true);if(!locations.length){$('#view-trends').innerHTML='<div class="panel"><div class="empty">Reviewer permission required.</div></div>';return}
  let location=window.__trendLocation||('unit:'+currentUnitId);if(!locations.some(o=>o.key===location))location=locations[0]?.key||'';window.__trendLocation=location;
  const scopes=reportScopeOptionsForLocation(location);const scope=window.__trendScope&&scopes.some(s=>s[0]===window.__trendScope)?window.__trendScope:scopes[0]?.[0];window.__trendScope=scope;if(!scope){$('#view-trends').innerHTML='<div class="panel"><div class="empty">No trend scope is available for this location.</div></div>';return}
  const dates=ensureDateState('trend'),isEncampment=location.startsWith('enc:');const recs=DB.records.filter(r=>FORMS[r.type]?.group===scope&&visibleToCurrentUser(r)&&recordMatchesLocation(r,location)&&trendRecordMatchesFormLocation(r,location)&&dateInRange(effectiveRecordDate(r),dates.start,dates.end));const avg=normalizedAverage(recs),subjects=new Set(recs.map(r=>(r.capid||memberName(r)).toLowerCase())).size,evals=new Set(recs.map(r=>r.createdBy)).size,cat=categoryStats(recs),keywords=extractKeywords(recs);
  const categoryNote=isEncampment?'Encampment category performance only. Categories come from the Encampment Student and Encampment Cadre worksheets; normal unit feedback categories are excluded.':(scope==='senior'?'Senior feedback categories for the selected unit or units. Encampment categories are excluded.':'Phase I–IV leadership categories for the selected unit or units. Encampment categories are excluded.');
  $('#view-trends').innerHTML=`<div class="panel"><h2>Unit Trends</h2><p class="sub">Regular unit statistics and encampment statistics are intentionally kept separate.</p><div class="grid grid-2"><div class="field"><label>Unit / Encampment</label><select id="trendLocation">${locationOptionsHtml(locations,location)}</select></div><div class="field"><label>Trend Scope</label><select id="trendScope">${scopes.map(s=>`<option value="${s[0]}" ${s[0]===scope?'selected':''}>${s[1]}</option>`).join('')}</select></div></div>${renderDateControls('trend')}</div><div class="cards"><div class="metric"><div class="num">${recs.length}</div><div class="label">Feedback records</div></div><div class="metric"><div class="num">${subjects}</div><div class="label">Members represented</div></div><div class="metric"><div class="num">${avg===null?'—':avg+'%'}</div><div class="label">Normalized average</div></div><div class="metric"><div class="num">${evals}</div><div class="label">Evaluators</div></div></div><div class="panel"><h2>Category Performance</h2><p class="sub">${escapeHtml(categoryNote)}</p>${cat.length?`<div class="bar-list">${cat.map(c=>`<div class="bar-row"><div class="bar-label">${escapeHtml(c.name)} <small>(${c.count})</small></div><div class="bar-track"><div class="bar-fill" style="width:${c.avg}%"></div></div><div class="bar-value">${c.avg}%</div></div>`).join('')}</div>`:'<div class="empty">No category ratings for this selection.</div>'}</div><div class="panel"><h2>Common Improvement / Goal Terms</h2><p class="sub">A simple keyword scan of improvement and goal narratives from the same selected location and form family. This is a reporting indicator, not automated judgment.</p>${keywords.length?`<div class="keyword-list">${keywords.map(k=>`<span class="keyword">${escapeHtml(k.word)} <b>${k.count}</b></span>`).join('')}</div>`:'<div class="empty">No repeated improvement terms found yet.</div>'}</div>`;
  $('#trendLocation').onchange=e=>{window.__trendLocation=e.target.value;window.__trendScope='';renderTrends()};$('#trendScope').onchange=e=>{window.__trendScope=e.target.value;renderTrends()};bindDateControls('trend',renderTrends);
}

function selectedAdminUnitId(){const units=adminAccessibleUnits();let id=window.__adminUnitId||currentUnitId||currentUser?.unitId||'';if(!units.some(u=>u.id===id))id=units[0]?.id||'';window.__adminUnitId=id;return id}
async function loadAdminUsers(unitId){if(!canUserAdmin(unitId)){adminUsers=[];adminUsersUnitId=unitId;return}try{const data=await invokeAdminFunction({action:'list',unitId});adminUsers=data.users||[];adminUsersUnitId=unitId}catch(e){adminUsers=[];toast(friendlyError(e))}}
function adminUserTable(users){if(!users.length)return'<div class="empty">No shared CAP Applications users are available for this administration scope yet.</div>';return`<div class="table-wrap"><table class="data-table" style="min-width:700px"><thead><tr><th>Name</th><th>Email</th><th>Leadership Roles</th><th></th></tr></thead><tbody>${users.map(u=>`<tr><td>${escapeHtml(u.displayName||u.email||'CAP User')}</td><td>${escapeHtml(u.email||'')}</td><td><div class="role-tags">${(u.roles||[]).length?(u.roles||[]).map(r=>`<span class="role-tag ${r.toLowerCase().includes('senior')?'senior':r.toLowerCase().includes('admin')?'admin':''}">${escapeHtml(ROLES[r]?.label||r)}</span>`).join(''):'<span class="role-tag">No Leadership permissions</span>'}</div></td><td><button class="btn btn-sm btn-ghost edit-user" data-id="${u.id}">Edit</button></td></tr>`).join('')}</tbody></table></div>`}
function userForm(user=null){
  const u=user||{displayName:'',email:'',roles:[]};
  const allowed=['cadetEvaluator','cadetReviewer','seniorEvaluator','seniorReviewer','unitAdmin'].concat(isAppAdmin()?['encampmentEvaluator','encampmentReviewer','encampmentAdmin','appAdmin']:[]);
  return`<form id="adminUserForm"><input type="hidden" name="userId" value="${escapeHtml(u.id||'')}"><div class="grid grid-3"><div class="field"><label>Display Name</label><input name="displayName" value="${escapeHtml(u.displayName||'')}" required></div><div class="field"><label>Email / Login</label><input name="email" type="email" value="${escapeHtml(u.email||'')}" required></div><div class="field"><label>${user?'New Password (optional)':'Temporary Password'}</label><input name="password" type="password" minlength="8"><small>${user?'Leave blank to keep the current password.':'Required only if this email is not already a shared CAP Applications account.'}</small></div></div><div class="alert alert-info"><b>Permissions are assigned by administrators.</b> Cadet and Senior evaluator/reviewer permissions are independent of the CAP member roster.</div><div class="section-title">Leadership Permissions</div><div class="checkbox-grid">${allowed.map(r=>`<div class="check-card"><label><input type="checkbox" name="roles" value="${r}" ${(u.roles||[]).includes(r)?'checked':''}> ${ROLES[r].label}</label><small>${ROLES[r].desc}</small></div>`).join('')}</div><div class="form-actions"><button type="button" id="cancelEdit" class="btn btn-secondary ${user?'':'hidden'}">Cancel</button><button type="submit" class="btn btn-primary">${user?'Save Leadership Access':'Add / Authorize User'}</button></div></form>`;
}
function memberListPanel(defaultUnitId){
  const units=adminAccessibleUnits();let unitId=window.__memberListUnitId||defaultUnitId;if(!units.some(u=>u.id===unitId))unitId=defaultUnitId||units[0]?.id||'';window.__memberListUnitId=unitId;const status=window.__memberStatus||'active';const member=editingMemberCapid?lookupMember(editingMemberCapid):null;const members=DB.members.filter(m=>m.unitId===unitId&&(status==='all'||(status==='active'?m.active!==false:m.active===false))).sort((a,b)=>a.lastName.localeCompare(b.lastName)||a.firstName.localeCompare(b.firstName));const formUnitId=member?.unitId||unitId;
  return`<div class="panel"><h2>Member List</h2><p class="sub">This is the shared CAP member table used across applications. CAPID is the business key; unit assignment history is kept separately. Names, member type, active status, and current unit can be maintained here.</p><div class="grid grid-2"><div class="field"><label>Member List Unit</label><select id="memberListUnitSelect">${units.map(u=>`<option value="${u.id}" ${u.id===unitId?'selected':''}>${escapeHtml(unitDisplay(u))}${u.active===false?' (Inactive)':''}</option>`).join('')}</select></div><div class="field"><label>Member Status</label><select id="memberStatusFilter"><option value="active" ${status==='active'?'selected':''}>Active</option><option value="inactive" ${status==='inactive'?'selected':''}>Inactive</option><option value="all" ${status==='all'?'selected':''}>All</option></select></div></div><div class="section-title">${member?'Edit Member':'Add Member'}</div><form id="memberForm"><input type="hidden" name="memberId" value="${escapeHtml(member?.id||'')}"><div class="grid grid-4"><div class="field"><label>CAPID</label><input name="capid" inputmode="numeric" value="${escapeHtml(member?.capid||'')}" required></div><div class="field"><label>Last Name</label><input name="lastName" value="${escapeHtml(member?.lastName||'')}" required></div><div class="field"><label>First Name</label><input name="firstName" value="${escapeHtml(member?.firstName||'')}" required></div><div class="field"><label>Member Type</label><select name="memberType"><option ${member?.memberType==='Cadet'?'selected':''}>Cadet</option><option ${member?.memberType==='Senior'?'selected':''}>Senior</option></select></div></div><div class="grid grid-2" style="align-items:end"><div class="field"><label>Current Unit</label><select name="unitId" ${isAppAdmin()?'':'disabled'}>${units.map(u=>`<option value="${u.id}" ${u.id===formUnitId?'selected':''}>${escapeHtml(unitDisplay(u))}${u.active===false?' (Inactive)':''}</option>`).join('')}</select>${!isAppAdmin()?`<input type="hidden" name="unitId" value="${escapeHtml(formUnitId)}">`:''}</div><div class="form-actions" style="justify-content:flex-start;margin-top:0"><button type="button" id="cancelMemberEdit" class="btn btn-secondary ${member?'':'hidden'}">Cancel Edit</button><button type="submit" class="btn btn-primary">${member?'Save Member Changes':'Add Member'}</button></div></div></form>${members.length?`<div class="table-wrap"><table class="data-table" style="min-width:760px"><thead><tr><th>CAPID</th><th>Last Name</th><th>First Name</th><th>Type</th><th>Status</th><th></th></tr></thead><tbody>${members.map(m=>`<tr><td>${escapeHtml(m.capid)}</td><td>${escapeHtml(m.lastName)}</td><td>${escapeHtml(m.firstName)}</td><td>${escapeHtml(m.memberType)}</td><td><span class="role-tag ${m.active!==false?'status-active':'status-inactive'}">${m.active!==false?'Active':'Inactive'}</span></td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm btn-ghost edit-member" data-capid="${escapeHtml(m.capid)}">Edit</button><button class="btn btn-sm ${m.active!==false?'btn-danger':'btn-secondary'} toggle-member" data-capid="${escapeHtml(m.capid)}">${m.active!==false?'Mark Inactive':'Mark Active'}</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No members match this unit/status filter.</div>'}</div>`;
}
async function renderAdmin(){
  if(!canAdminPage()){ $('#view-admin').innerHTML='<div class="panel"><div class="empty">Administrative permission required.</div></div>';return}
  let html=`<div class="panel"><h2>Administration</h2><p class="sub">Manage Leadership Feedback permissions, the shared member roster, encampments, and — for Leadership App Admins — the shared CAP unit list.</p><div class="alert alert-warn"><b>Senior-access rule:</b> Senior Evaluator and Senior Reviewer can only be assigned to Senior members. Unit Admin, Encampment Admin, and Encampment Evaluator do not grant Senior feedback access.</div></div>`;
  if(canUserAdmin()){
    const units=adminAccessibleUnits(),adminUnitId=selectedAdminUnitId();if(adminUsersUnitId!==adminUnitId)await loadAdminUsers(adminUnitId);const userHeading=isAppAdmin()?'Shared CAP Applications Users':`Users Associated with ${unitName(adminUnitId)}`;const userHelp=isAppAdmin()?(`All shared CAP Applications login accounts are shown here. Leadership role badges apply to ${unitName(adminUnitId)}; accounts with no badge do not yet have Leadership permissions for this unit.`):'Shared accounts associated with this unit through Leadership, Schedule, Uniform Inspections, Drill, the shared member roster, or default unit are shown here.';html+=`<div class="panel"><h2>Administration Unit</h2><div class="field" style="max-width:520px"><label>Unit</label><select id="adminUnitSelect">${units.map(u=>`<option value="${u.id}" ${u.id===adminUnitId?'selected':''}>${escapeHtml(unitDisplay(u))}${u.active===false?' (Inactive)':''}</option>`).join('')}</select></div></div><div class="admin-layout"><div class="panel"><h2>${escapeHtml(userHeading)}</h2><p class="sub">${escapeHtml(userHelp)}</p>${adminUserTable(adminUsers)}</div><div class="panel"><h2 id="userFormTitle">Add / Authorize User</h2>${userForm()}</div></div>${memberListPanel(adminUnitId)}`;
  }
  if(canEncampmentAdmin())html+=encampmentAdminPanel();if(isAppAdmin())html+=unitsAdminPanel();$('#view-admin').innerHTML=html;bindAdmin();
}
function bindAdmin(){
  if($('#adminUnitSelect'))$('#adminUnitSelect').onchange=async e=>{window.__adminUnitId=e.target.value;window.__memberListUnitId=e.target.value;editingUserId=null;editingMemberCapid=null;adminUsersUnitId=null;await renderAdmin()};
  $$('.edit-user').forEach(b=>b.onclick=()=>{editingUserId=b.dataset.id;const u=adminUsers.find(x=>x.id===editingUserId);$('#userFormTitle').textContent='Edit Leadership Access';$('#adminUserForm').outerHTML=userForm(u);bindAdminFormOnly()});bindAdminFormOnly();
  if($('#memberListUnitSelect'))$('#memberListUnitSelect').onchange=e=>{window.__memberListUnitId=e.target.value;editingMemberCapid=null;renderAdmin()};if($('#memberStatusFilter'))$('#memberStatusFilter').onchange=e=>{window.__memberStatus=e.target.value;editingMemberCapid=null;renderAdmin()};
  $$('.edit-member').forEach(b=>b.onclick=()=>{editingMemberCapid=b.dataset.capid;const m=lookupMember(editingMemberCapid);if(m)window.__memberListUnitId=m.unitId;renderAdmin()});$$('.toggle-member').forEach(b=>b.onclick=()=>toggleMember(b.dataset.capid));if($('#memberForm'))$('#memberForm').onsubmit=saveMember;if($('#cancelMemberEdit'))$('#cancelMemberEdit').onclick=()=>{editingMemberCapid=null;renderAdmin()};
  if($('#encampmentForm'))$('#encampmentForm').onsubmit=saveEncampment;$$('.edit-encampment').forEach(b=>b.onclick=()=>{editingEncampmentId=b.dataset.id;renderAdmin()});$$('.toggle-encampment').forEach(b=>b.onclick=()=>toggleEncampment(b.dataset.id));if($('#cancelEncampmentEdit'))$('#cancelEncampmentEdit').onclick=()=>{editingEncampmentId=null;renderAdmin()};
  if($('#unitForm'))$('#unitForm').onsubmit=saveUnit;$$('.edit-unit').forEach(b=>b.onclick=()=>{editingUnitId=b.dataset.id;renderAdmin()});$$('.toggle-unit').forEach(b=>b.onclick=()=>toggleUnit(b.dataset.id));if($('#cancelUnitEdit'))$('#cancelUnitEdit').onclick=()=>{editingUnitId=null;renderAdmin()};
}
function bindAdminFormOnly(){const form=$('#adminUserForm');if(!form)return;form.onsubmit=saveAdminUser;if($('#cancelEdit'))$('#cancelEdit').onclick=()=>{editingUserId=null;renderAdmin()}}
async function saveAdminUser(e){e.preventDefault();const fd=new FormData(e.target),roles=fd.getAll('roles');const payload={action:'save',unitId:selectedAdminUnitId(),userId:fd.get('userId')||null,displayName:fd.get('displayName').trim(),email:fd.get('email').trim().toLowerCase(),password:fd.get('password')||'',roles};setBusy(true);try{await invokeAdminFunction(payload);toast(payload.userId?'Leadership access updated.':'User added or authorized.');editingUserId=null;adminUsersUnitId=null;await refreshData(false);await renderAdmin()}catch(err){toast(friendlyError(err))}finally{setBusy(false)}}
async function saveMember(e){e.preventDefault();const fd=new FormData(e.target),memberId=fd.get('memberId')||null,unitId=fd.get('unitId');setBusy(true);try{const {error}=await sb.rpc('leadership_upsert_member',{p_member_id:memberId||null,p_capid:fd.get('capid').trim(),p_first_name:fd.get('firstName').trim(),p_last_name:fd.get('lastName').trim(),p_member_type:fd.get('memberType'),p_unit_id:unitId,p_active:true});if(error)throw error;toast(memberId?'Member updated.':'Member added.');editingMemberCapid=null;window.__memberListUnitId=unitId;await refreshData(false);await renderAdmin()}catch(err){toast(friendlyError(err))}finally{setBusy(false)}}
async function toggleMember(capid){const m=lookupMember(capid);if(!m)return;setBusy(true);try{const {error}=await sb.rpc('leadership_upsert_member',{p_member_id:m.id,p_capid:m.capid,p_first_name:m.firstName,p_last_name:m.lastName,p_member_type:m.memberType,p_unit_id:m.unitId,p_active:m.active===false});if(error)throw error;toast(`${memberName(m)} marked ${m.active===false?'active':'inactive'}.`);await refreshData(false);await renderAdmin()}catch(err){toast(friendlyError(err))}finally{setBusy(false)}}
async function saveEncampment(e){e.preventDefault();if(!canEncampmentAdmin())return;const fd=new FormData(e.target),id=fd.get('encampmentId')||null,row={name:fd.get('name').trim(),location:fd.get('location').trim(),start_date:fd.get('startDate'),end_date:fd.get('endDate'),active:fd.get('active')==='on'};if(row.start_date>row.end_date){toast('Encampment Start Date cannot be after End Date.');return}setBusy(true);try{let q;if(id)q=sb.from('leadership_encampments').update(row).eq('id',id);else q=sb.from('leadership_encampments').insert({...row,created_by:currentUser.id});const {error}=await q;if(error)throw error;toast(id?'Encampment updated.':'Encampment added.');editingEncampmentId=null;await refreshData(false);await renderAdmin()}catch(err){toast(friendlyError(err))}finally{setBusy(false)}}
async function toggleEncampment(id){const enc=DB.encampments.find(x=>x.id===id);if(!enc)return;setBusy(true);try{const {error}=await sb.from('leadership_encampments').update({active:!enc.active}).eq('id',id);if(error)throw error;toast(`${enc.name} marked ${!enc.active?'active':'inactive'}.`);await refreshData(false);await renderAdmin()}catch(err){toast(friendlyError(err))}finally{setBusy(false)}}
async function saveUnit(e){e.preventDefault();if(!isAppAdmin())return;const fd=new FormData(e.target),id=fd.get('unitId')||null,row={charter_number:fd.get('charterNumber').trim().toUpperCase(),name:fd.get('name').trim(),active:fd.get('active')==='on'};setBusy(true);try{let q=id?sb.from('units').update(row).eq('id',id):sb.from('units').insert(row);const {error}=await q;if(error)throw error;toast(id?'Unit updated.':'Unit added.');editingUnitId=null;await refreshData(false);showApp()}catch(err){toast(friendlyError(err))}finally{setBusy(false)}}
async function toggleUnit(id){if(!isAppAdmin())return;const u=DB.units.find(x=>x.id===id);if(!u)return;setBusy(true);try{const {error}=await sb.from('units').update({active:!u.active}).eq('id',id);if(error)throw error;toast(`${unitDisplay(u)} marked ${!u.active?'active':'inactive'}.`);await refreshData(false);showApp()}catch(err){toast(friendlyError(err))}finally{setBusy(false)}}

async function changeDefaultLocation(key){window.__defaultLocationKey=key;window.__entryLocationKey=key;window.__reportLocation=key;window.__trendLocation=key;window.__myLocation=key;window.__reportMember='';localStorage.setItem(DEFAULT_KEY_PREFIX+currentUser.id,key);if(key.startsWith('unit:')){currentUnitId=key.slice(5);currentUser.unitId=currentUnitId;try{await sb.from('profiles').update({default_unit_id:currentUnitId}).eq('id',currentUser.id)}catch{}window.__adminUnitId=currentUnitId;window.__memberListUnitId=currentUnitId;adminUsersUnitId=null}navigate(activeView)}

function setupPWA(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(console.warn);let deferred=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#installBtn')?.classList.remove('install-hidden')});$('#installBtn').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('#installBtn').classList.add('install-hidden')}}
async function boot(){setupPWA();if(!SUPABASE_READY){$('#configError').textContent='Setup required: edit config.js and paste the existing CAP Schedule Supabase anon/publishable key.';$('#configError').classList.remove('hidden');return}const {data}=await sb.auth.getSession();if(data.session){try{setBusy(true);await loadAppData();showApp()}catch(e){console.error(e);$('#loginError').textContent=friendlyError(e);$('#loginError').classList.remove('hidden')}finally{setBusy(false)}}}
$('#loginBtn').onclick=login;$('#loginPassword').onkeydown=e=>{if(e.key==='Enter')login()};$('#logoutBtn').onclick=logout;$('#defaultLocationSelect').onchange=e=>changeDefaultLocation(e.target.value);boot();
