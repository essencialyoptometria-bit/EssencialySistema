// Execute com: node tests/agenda-regression.cjs
// Testa os handlers reais com respostas simuladas; não acessa dados de pacientes.
process.env.TZ = 'America/Sao_Paulo';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
let states = [], refs = [], index = 0, refIndex = 0, replies = [], calls = [], notices = [], closed = 0;
const hooks = { ...React,
  useState(initial) { const i=index++; if (!(i in states)) states[i]=typeof initial==='function'?initial():initial; return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v}]; },
  useRef(initial) {const i=refIndex++;return refs[i]||(refs[i]={current:initial});},
  useMemo:f=>f(), useEffect:()=>{}, useCallback:f=>f
};
const supabase = {
 from(table) {
   const call={table,op:'select',filters:[]};
   const chain={select(){return chain},eq(k,v){call.filters.push([k,v]);return chain},is(k,v){call.filters.push([k,v]);return chain},update(value){call.op='update';call.value=value;return chain},insert(value){call.op='insert';call.value=value;return chain},
   async single(){return run()},async maybeSingle(){return run()}};
   function run(){calls.push(call);assert(replies.length,'Resposta simulada ausente');return replies.shift()}
   return chain;
 },functions:{invoke:async()=>({error:null})}
};
function load(file, extra={}) {
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const mocks={'react':hooks,'@/lib/supabase':{supabase},'@/components/essencialy/shared-ui':{Modal:({children})=>React.createElement('div',null,children),Status:({value})=>React.createElement('span',null,value),Empty:({children})=>React.createElement('div',null,children)},...extra};
 vm.runInNewContext(code,{module,exports:module.exports,require:n=>mocks[n]||require(n),FormData:class{constructor(d){this.d=d}get(k){return this.d[k]??null}},window:{confirm:()=>true},Date,console});
 return module.exports;
}
const utils=load('lib/essencialy-utils.ts');
const {BookingForm,Agenda}=load('components/essencialy/modules/agenda.tsx',{'@/lib/essencialy-utils':utils});
function reset(){states=[];refs=[];replies=[];calls=[];notices=[];closed=0}
function render(component,props){index=0;refIndex=0;return component(props)}
function find(node,pred){if(!node||typeof node!=='object')return; if(pred(node))return node;for(const child of React.Children.toArray(node.props?.children)){const v=find(child,pred);if(v)return v}}
const schedule={id:'s1',city_id:'c1',store_id:'l1',schedule_date:'2026-10-02',start_time:'08:00',end_time:'09:00',interval_minutes:30};
const patient={id:'p1',full_name:'Paciente teste',phone:'44999999999',cpf:'',birth_date:'1990-05-20'};
const base={profile:{id:'user'},patients:[patient],item:{schedule,time:'08:00'},close:()=>closed++,load:async()=>{},flash:m=>notices.push(m)};
const ok=data=>({data,error:null});
function cpfTree(props,cpf){let t=render(BookingForm,props);find(t,n=>n.props?.name==='birth_date').props.onChange({target:{value:'1990-05-20'}});find(t,n=>n.props?.name==='cpf').props.onChange({target:{value:cpf}});return render(BookingForm,props)}
async function submit(tree){await find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){},currentTarget:{name:'Paciente teste',phone:'(44) 99999-9999',plan:'false',value:'120'}})}
(async()=>{
 reset(); let tree=cpfTree(base,'111.444.777-35');replies=[ok(schedule),ok(null),ok({id:'p1'}),ok({id:'a1'})];await submit(tree);
 assert.equal(calls.find(c=>c.table==='patients'&&c.op==='insert').value.cpf,'11144477735');assert.equal(closed,1);
 reset();const editing={...base,item:{...base.item,appointment:{id:'a1',patient_id:'p1',patients:patient,has_plan:false,exam_value:120}}};
 tree=cpfTree(editing,'111.444.777-35');replies=[ok(schedule),ok(patient),ok({id:'p1',cpf:'11144477735',birth_date:'1990-05-20'}),ok({id:'a1'})];await submit(tree);
 assert.equal(calls.find(c=>c.table==='patients'&&c.op==='update').value.cpf,'11144477735');assert(!('booked_by' in calls.at(-1).value));assert.equal(closed,1);
 reset();tree=cpfTree(editing,'111.444.777-35');replies=[ok(schedule),ok(patient),ok(null)];await submit(tree);assert.equal(closed,0);assert(!calls.some(c=>c.table==='appointments'));assert(notices.some(n=>n.includes('dados do paciente não foram salvos')));
 reset();tree=cpfTree(editing,'');replies=[ok(schedule),ok(patient),ok({id:'a1'})];await submit(tree);assert(!calls.some(c=>c.table==='patients'&&c.op==='update'));assert.equal(closed,1);
 reset();tree=cpfTree(base,'123');await submit(tree);assert.equal(calls.length,0);assert(notices.some(n=>n.includes('11 dígitos')));
 reset();tree=cpfTree(base,'11144477735');replies=[ok({...schedule,closed_at:'2026-10-02'})];await submit(tree);assert.equal(calls.length,1);assert.equal(closed,0);
 reset();tree=cpfTree(base,'11144477735');replies=[ok(schedule),{error:{message:'falha na consulta'},data:null}];await submit(tree);assert.equal(closed,0);assert.equal(calls.length,2);
 reset();tree=cpfTree(editing,'');replies=[ok(schedule),ok(patient),ok(null)];await submit(tree);assert.equal(closed,0);assert(notices.some(n=>n.includes('não foi salvo')));
 reset();tree=cpfTree(base,'11144477735');replies=[ok(schedule),ok({...patient,cpf:'52998224725'})];await submit(tree);assert.equal(closed,0);assert.equal(calls.length,2);
 // Nascimento obrigatório para novos pacientes e cadastros antigos incompletos.
 reset();tree=render(BookingForm,base);assert.equal(find(tree,n=>n.props?.name==='birth_date').props.required,true);await submit(tree);assert.equal(calls.length,0);assert(notices.some(n=>n.includes('data de nascimento')));
 reset();tree=render(BookingForm,editing);assert.equal(find(tree,n=>n.props?.name==='birth_date').props.value,'1990-05-20');
 const missingBirth={...editing,item:{...editing.item,appointment:{...editing.item.appointment,patients:{...patient,birth_date:null}}}};
 reset();tree=render(BookingForm,missingBirth);await submit(tree);assert.equal(calls.length,0);
 tree=cpfTree(missingBirth,'');replies=[ok(schedule),ok({...patient,birth_date:null}),ok(patient),ok({id:'a1'})];await submit(tree);assert.equal(calls.find(c=>c.table==='patients'&&c.op==='update').value.birth_date,'1990-05-20');assert.equal(closed,1);
 reset();tree=cpfTree(missingBirth,'');replies=[ok(schedule),ok({...patient,birth_date:null}),ok(null)];await submit(tree);assert.equal(closed,0);assert(!calls.some(c=>c.table==='appointments'));
 for(const date of ['2999-01-01','2026-02-30']){reset();tree=render(BookingForm,base);find(tree,n=>n.props?.name==='birth_date').props.onChange({target:{value:date}});tree=render(BookingForm,base);await submit(tree);assert.equal(calls.length,0)}
 reset();tree=render(BookingForm,base);find(tree,n=>n.props?.placeholder==='Nome, telefone ou CPF').props.onChange({target:{value:'Paciente'}});tree=render(BookingForm,base);find(tree,n=>n.type==='button'&&n.props.type==='button').props.onClick();tree=render(BookingForm,base);assert.equal(find(tree,n=>n.props?.name==='birth_date').props.value,'1990-05-20');find(tree,n=>n.props?.placeholder==='Nome, telefone ou CPF').props.onChange({target:{value:'Outro'}});tree=render(BookingForm,base);assert.equal(find(tree,n=>n.props?.name==='birth_date').props.value,'');
 const appointment={id:'a1',schedule_id:'s1',patient_id:'p1',patients:patient,starts_at:'2026-10-02T08:00:00-03:00',status:'AGENDADO'};
 function agendaProps(apps,s= schedule){return {...base,profiles:[],cities:[],stores:[],schedules:[s],appointments:apps,agendaDate:'2026-10-02',clinical:true}}
 function openAgenda(props){let t=render(Agenda,props);find(t,n=>n.type==='button'&&n.props.children==='Abrir agenda').props.onClick();return render(Agenda,props)}
 reset();let props=agendaProps([appointment]);tree=openAgenda(props);await find(tree,n=>n.type==='button'&&n.props.children==='Concluir e encerrar agenda').props.onClick();assert.equal(calls.length,0);assert(notices.some(n=>n.includes('pendente')));
 reset();props=agendaProps([{...appointment,status:'ATENDIDO'}]);tree=openAgenda(props);replies=[ok({id:'s1'})];await find(tree,n=>n.type==='button'&&n.props.children==='Concluir e encerrar agenda').props.onClick();assert.equal(calls[0].table,'schedules');assert(calls[0].value.closed_at);
 reset();props=agendaProps([{...appointment,status:'ATENDIDO'}],{...schedule,closed_at:'2026-10-02'});tree=render(Agenda,props);find(tree,n=>n.props?.['aria-label']==='Situação da agenda').props.onChange({target:{value:'encerradas'}});tree=openAgenda(props);let block=find(tree,n=>typeof n.type==='function'&&n.type.name==='ScheduleBlock');let html=renderToStaticMarkup(block);assert(!html.includes('Adicionar paciente'));assert(!html.includes('>Editar<'));assert(!html.includes('Cancelar'));assert(html.includes('Paciente teste'));
 reset();props=agendaProps([appointment]);tree=openAgenda(props);block=find(tree,n=>typeof n.type==='function'&&n.type.name==='ScheduleBlock');html=renderToStaticMarkup(React.cloneElement(block,{statusFilter:'CONFIRMADO'}));assert(!html.includes('Adicionar paciente'));assert(!html.includes('Disponível'));
 console.log('PASS: nascimento obrigatório/preenchido/inválido/persistido, CPF novo/existente/vazio/incompleto, permissões, erro de leitura, conflito de CPF, fechamento com/sem pendência, leitura de encerradas e filtros de horários.');
})().catch(e=>{console.error(e);process.exitCode=1});
