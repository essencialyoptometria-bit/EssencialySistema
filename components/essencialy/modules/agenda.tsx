'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Cake, Check, ClipboardList, Clock3, FilePlus2, FileText, Pencil, Trash2,
  History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
import { br, calculateAge, cash, digits, formatCpf, formatPhone, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
import { Empty, Modal, Status } from '@/components/essencialy/shared-ui';
export function Agenda({
  profile,
  profiles,
  cities,
  stores,
  schedules,
  appointments,
  agendaDate,
  setAgendaDate,
  setModal,
  setTarget,
  setView,
  load,
  flash,
  clinical,
}: any) {
  const [mode, setMode] = useState<'dia'|'semana'|'mes'>('dia');
  const [cityFilter, setCityFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openedSchedule, setOpenedSchedule] = useState<Schedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const base = new Date(agendaDate + 'T12:00:00');
  const end = new Date(base);
  if (mode === 'semana') end.setDate(end.getDate() + 6);
  if (mode === 'mes') { base.setDate(1); end.setMonth(end.getMonth() + 1, 0); }
  const list = [...schedules].filter((s: Schedule) =>
    (!cityFilter || s.city_id === cityFilter) && (!storeFilter || s.store_id === storeFilter)
  ).sort((a:Schedule,b:Schedule)=>a.schedule_date.localeCompare(b.schedule_date));
  const pending = appointments.filter(
    (a: Appointment) =>
      a.starts_at.slice(0, 10) === tomorrow() && a.status === 'AGENDADO',
  );
  async function status(id: string, value: string) {
    if (value === 'CANCELADO') {
      if (!window.confirm('Cancelar e remover este agendamento? O cadastro do paciente será preservado.')) return;
      const { data, error } = await supabase.from('appointments').delete().eq('id', id).select('id').maybeSingle();
      if (error) return flash(error.message);
      if (!data) return flash('O agendamento não foi removido. Verifique sua permissão.');
      flash('Agendamento cancelado e removido.');
      await load();
      return;
    }
    const { error } = await supabase
      .from('appointments')
      .update({ status: value, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) flash(error.message);
    else {
      flash('Agendamento atualizado.');
      load();
    }
  }
  async function removeSchedule(schedule: Schedule) {
    const linked = appointments.filter((a: Appointment) => a.schedule_id === schedule.id);
    const active = linked.filter((a: Appointment) => a.status !== 'CANCELADO');
    if (active.length) return flash(`Não é possível excluir: esta agenda possui ${active.length} agendamento(s) ativo(s).`);
    if (!window.confirm(`Excluir a agenda de ${br(schedule.schedule_date)} em ${schedule.cities?.name}?`)) return;
    if (linked.length) {
      const { error: cleanupError } = await supabase.from('appointments').delete().eq('schedule_id', schedule.id).eq('status', 'CANCELADO');
      if (cleanupError) return flash(cleanupError.message);
    }
    const { error } = await supabase.from('schedules').delete().eq('id', schedule.id);
    if (error) return flash(error.message);
    flash('Agenda excluída.'); setOpenedSchedule(null); load();
  }
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#8a7560]">Agenda diária</p>
          <h2 className="text-3xl font-black">Atendimentos</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary whitespace-nowrap"
            onClick={() => setModal('schedule')}
          >
            <Plus className="inline" size={18} /> Nova agenda
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <select className="field" value={cityFilter} onChange={e=>setCityFilter(e.target.value)}>
          <option value="">Todas as cidades</option>{Array.from(new Map(schedules.map((s:Schedule)=>[s.city_id,s.cities])).values()).filter(Boolean).map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="field" value={storeFilter} onChange={e=>setStoreFilter(e.target.value)}>
          <option value="">Todas as óticas</option>{Array.from(new Map(schedules.map((s:Schedule)=>[s.store_id,s.optical_stores])).values()).filter(Boolean).map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select className="field" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option><option value="AGENDADO">Aguardando confirmação</option><option value="CONFIRMADO">Confirmados</option><option value="FALTOSO">Faltosos</option>
        </select>
      </div>
      {pending.length > 0 && (
        <button onClick={()=>setAgendaDate(tomorrow())} className="w-full text-left mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <b>⚠️ Confirmações pendentes</b>
          <p className="text-sm text-amber-800">
            {pending.length} exame(s) de amanhã aguardam confirmação.
          </p>
        </button>
      )}
      <div className="grid gap-4 mt-5 md:grid-cols-2 xl:grid-cols-3">
        {list.length ? (
          list.map((s: Schedule) => <article className="card p-5" key={s.id}><p className="text-xs font-black uppercase tracking-wide text-[#9a7b2f]">{s.cities?.name || 'Cidade não informada'}</p><h3 className="mt-1 text-lg font-black">{br(s.schedule_date)}</h3><p className="text-sm text-[#778079]">{s.optical_stores?.name} · {s.start_time.slice(0,5)} às {s.end_time.slice(0,5)}</p><p className="mt-1 text-sm">{s.professional_name}</p><button className="btn-primary mt-4 w-full" onClick={()=>setOpenedSchedule(s)}>Abrir agenda</button></article>)
        ) : (
          <section className="card p-12 text-center">
            <CalendarDays className="mx-auto text-[#b3aa9d]" />
            <b className="block mt-3">Nenhuma agenda nesta data.</b>
            <p className="text-sm text-[#7e877f]">
              Crie uma agenda para liberar horários.
            </p>
          </section>
        )}
      </div>
      {openedSchedule && <Modal wide title={`Agenda · ${br(openedSchedule.schedule_date)} · ${openedSchedule.cities?.name || ''}`} close={()=>setOpenedSchedule(null)}><ScheduleBlock schedule={openedSchedule} apps={appointments.filter((a:Appointment)=>a.schedule_id===openedSchedule.id&&(!statusFilter||a.status===statusFilter))} book={(time:string)=>{setTarget({schedule:openedSchedule,time});setModal('booking')}} status={status} open={(p:Patient)=>{setTarget(p);setModal('consultation')}} clinical={clinical} triage={(a:Appointment)=>{setTarget(a);setView?.('triagem');setOpenedSchedule(null)}} edit={(a:Appointment,time:string)=>{setTarget({schedule:openedSchedule,time,appointment:a});setModal('booking')}}/><footer className="mt-5 flex flex-wrap gap-2 border-t pt-4"><button className="btn-secondary" onClick={()=>setEditingSchedule(openedSchedule)}><Pencil className="mr-1 inline" size={16}/> Editar agenda e horários</button><button className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-700" onClick={()=>removeSchedule(openedSchedule)}><Trash2 className="mr-1 inline" size={16}/> Excluir agenda</button></footer></Modal>}
      {editingSchedule && <ScheduleEditor schedule={editingSchedule} appointments={appointments} profiles={profiles} cities={cities} stores={stores} flash={flash} load={load} close={()=>setEditingSchedule(null)} saved={()=>{setEditingSchedule(null);setOpenedSchedule(null)}}/>}
    </>
  );
}
function scheduleSlots(schedule: Schedule) {
  if (Array.isArray(schedule.slot_times)) return [...new Set(schedule.slot_times.map(time=>time.slice(0,5)))].sort();
  const slots:string[] = [];
  const [sh, sm] = schedule.start_time.split(':').map(Number);
  const [eh, em] = schedule.end_time.split(':').map(Number);
  for (let n = sh * 60 + sm; n < eh * 60 + em; n += schedule.interval_minutes)
    slots.push(`${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`);
  return slots;
}
function ScheduleBlock({ schedule, apps, book, status, open, clinical, triage, edit }: any) {
  const slots = scheduleSlots(schedule);
  const map = new Map(
    apps
      .filter((a: Appointment) => a.status !== 'CANCELADO')
      .map((a: Appointment) => [
        new Date(a.starts_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        a,
      ]),
  );
  return (
    <section className="card overflow-hidden">
      <header className="bg-[#111111] text-white p-5 flex justify-between">
        <div>
          <b>
            {schedule.cities?.name} · {schedule.optical_stores?.name}
          </b>
          <p className="text-sm text-white/55">{schedule.professional_name}</p>
        </div>
        <small className="text-[#e2c887]">
          {schedule.interval_minutes} min
        </small>
      </header>
      <div className="divide-y">
        {slots.map((time) => {
          const a = map.get(time) as Appointment | undefined;
          return a ? (
            <div
              key={time}
              className="p-4 grid lg:grid-cols-[80px_1fr_auto] gap-3 lg:items-center"
            >
              <b className="text-lg">{time}</b>
              <div>
                <b>{a.patients?.full_name}</b>
                <p className="text-sm text-[#778079]">
                  {formatPhone(a.patients?.phone)} · {a.has_plan ? 'Com plano' : 'Sem plano'}{' '}
                  · {cash(a.exam_value)}
                </p>
                 {a.notes && <p className="text-xs text-[#8a7560]">{a.notes}</p>}
                 <p className="text-xs text-[#778079] mt-1">📍 {a.cities?.name || schedule.cities?.name} · 🏪 {a.optical_stores?.name || schedule.optical_stores?.name} · 👤 Agendado por {a.booker?.full_name || '—'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Status value={a.status} />
                 {a.status === 'AGENDADO' && (
                  <button
                    className="btn-secondary"
                    onClick={() => status(a.id, 'CONFIRMADO')}
                  >
                    <Check className="inline" size={15} /> Confirmar
                  </button>
                 )}
                 {a.status === 'CONFIRMADO' && <button className="btn-secondary" onClick={() => status(a.id, 'CHEGOU')}>Paciente chegou</button>}
                 {['CONFIRMADO','CHEGOU','ANAMNESE_EM_ANDAMENTO'].includes(a.status) && <button className="btn-secondary" onClick={() => triage(a)}>Triagem</button>}
                 <a
                  className="btn-secondary"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/55${digits(a.patients?.phone)}`}
                >
                  WhatsApp
                 </a>
                 <button className="btn-secondary" onClick={()=>edit(a,time)}>Editar</button>
                {clinical && (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() => open({ patient: a.patients, appointment: a })}
                    >
                      Abrir
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => status(a.id, 'FALTOSO')}
                    >
                      Faltou
                    </button>
                  </>
                )}
                <button
                  className="btn-secondary text-red-700"
                  onClick={() => status(a.id, 'CANCELADO')}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div key={time} className="p-4 flex justify-between items-center">
              <div>
                <b>{time}</b>
                <p className="text-sm text-emerald-700">Disponível</p>
              </div>
              <button className="btn-secondary" onClick={() => book(time)}>
                Adicionar paciente
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScheduleEditor({schedule,appointments,profiles,cities,stores,close,saved,load,flash}:any){
  const linked=appointments.filter((appointment:Appointment)=>appointment.schedule_id===schedule.id);
  const occupied=new Set(linked.map((appointment:Appointment)=>new Date(appointment.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})));
  const locked=linked.length>0;
  const[city,setCity]=useState(schedule.city_id);
  const[store,setStore]=useState(schedule.store_id);
  const[slots,setSlots]=useState<string[]>(()=>scheduleSlots(schedule));
  const[newTime,setNewTime]=useState('');
  const visibleStores=stores.filter((store:Store)=>store.city_id===city);
  function addTime(){if(!/^\d{2}:\d{2}$/.test(newTime))return flash('Informe um horário válido.');if(slots.includes(newTime))return flash('Este horário já existe na agenda.');setSlots(current=>[...current,newTime].sort());setNewTime('')}
  function removeTime(time:string){if(occupied.has(time))return flash('Este horário possui paciente agendado e não pode ser removido.');setSlots(current=>current.filter(item=>item!==time))}
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!slots.length)return flash('A agenda precisa ter pelo menos um horário.');const f=new FormData(e.currentTarget);const professional=profiles.find((item:Profile)=>item.id===f.get('professional_id'));const interval=Math.max(5,Number(f.get('interval_minutes'))||30);const last=slots[slots.length-1].split(':').map(Number);const endMinutes=last[0]*60+last[1]+interval;const payload={city_id:locked?schedule.city_id:city,store_id:locked?schedule.store_id:store,professional_id:f.get('professional_id'),professional_name:professional?.full_name||schedule.professional_name,schedule_date:locked?schedule.schedule_date:f.get('schedule_date'),interval_minutes:interval,start_time:`${slots[0]}:00`,end_time:`${String(Math.floor(endMinutes/60)%24).padStart(2,'0')}:${String(endMinutes%60).padStart(2,'0')}:00`,slot_times:slots};const{data,error}=await supabase.from('schedules').update(payload).eq('id',schedule.id).select('id').maybeSingle();if(error)return flash(error.message);if(!data)return flash('A agenda não foi alterada. Verifique sua permissão.');flash('Agenda e horários atualizados.');await load();saved()}
  return <Modal wide title={`Editar agenda · ${br(schedule.schedule_date)}`} close={close}><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><label className="label">Cidade<select className="field" name="city_id" value={city} disabled={locked} onChange={e=>{const next=e.target.value;setCity(next);setStore(stores.find((item:Store)=>item.city_id===next)?.id||'')}} required>{cities.map((item:City)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="label">Ótica<select className="field" name="store_id" value={store} onChange={e=>setStore(e.target.value)} disabled={locked} required>{visibleStores.map((item:Store)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="label">Data<input className="field" type="date" name="schedule_date" defaultValue={schedule.schedule_date} disabled={locked} required/></label><label className="label">Profissional<select className="field" name="professional_id" defaultValue={schedule.professional_id||''} required><option value="">Selecione</option>{profiles.filter((item:Profile)=>['ADMIN','OPTOMETRISTA'].includes(item.role)&&item.active).map((item:Profile)=><option key={item.id} value={item.id}>{item.full_name}</option>)}</select></label><label className="label">Duração padrão<input className="field" type="number" min="5" name="interval_minutes" defaultValue={schedule.interval_minutes} required/></label>{locked&&<p className="self-end rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Cidade, ótica e data ficam protegidas porque esta agenda já possui paciente agendado.</p>}<section className="sm:col-span-2 rounded-xl border p-4"><b>Horários da agenda</b><div className="mt-3 flex gap-2"><input className="field" type="time" value={newTime} onChange={e=>setNewTime(e.target.value)}/><button type="button" className="btn-secondary whitespace-nowrap" onClick={addTime}><Plus className="mr-1 inline" size={16}/> Adicionar horário</button></div><div className="mt-4 flex flex-wrap gap-2">{slots.map(time=><span key={time} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${occupied.has(time)?'bg-amber-50':'bg-[#edf2ef]'}`}>{time}{occupied.has(time)?<small>ocupado</small>:<button type="button" aria-label={`Remover ${time}`} className="text-red-700" onClick={()=>removeTime(time)}><X size={15}/></button>}</span>)}</div></section><div className="flex flex-wrap gap-2 sm:col-span-2"><button className="btn-primary">Salvar alterações</button><button type="button" className="btn-secondary" onClick={close}>Cancelar</button></div></form></Modal>
}

export function ScheduleForm({ profile, profiles, cities, stores, close, load, flash }: any) {
  const [city, setCity] = useState(profile.city_id || '');
  const visible = stores.filter((s: Store) => !city || s.city_id === city);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const professional = profiles.find((p:Profile)=>p.id===f.professional_id);
    const { error } = await supabase.from('schedules').insert({
      ...f,
      professional_name: professional?.full_name || profile.full_name,
      interval_minutes: Number(f.interval_minutes),
      created_by: profile.id,
    });
    if (error) flash(error.message);
    else {
      flash('Agenda criada.');
      close();
      load();
    }
  }
  return (
    <Modal title="Nova agenda" close={close}>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <label className="label">
          Cidade
          <select
            className="field"
            name="city_id"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Selecione</option>
            {cities.map((c: City) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Ótica
          <select className="field" name="store_id" required>
            <option value="">Selecione</option>
            {visible.map((s: Store) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Data
          <input
            className="field"
            name="schedule_date"
            type="date"
            defaultValue={iso()}
            required
          />
        </label>
        <label className="label">
          Profissional
          <select className="field" name="professional_id" required defaultValue={profile.role==='OPTOMETRISTA'?profile.id:''}><option value="">Selecione</option>{profiles.filter((p:Profile)=>['ADMIN','OPTOMETRISTA'].includes(p.role)&&p.active).map((p:Profile)=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
        </label>
        <label className="label">
          Início
          <input
            className="field"
            name="start_time"
            type="time"
            defaultValue="08:00"
            required
          />
        </label>
        <label className="label">
          Fim
          <input
            className="field"
            name="end_time"
            type="time"
            defaultValue="18:00"
            required
          />
        </label>
        <label className="label">
          Intervalo
          <input
            className="field"
            name="interval_minutes"
            type="number"
            defaultValue="30"
            min="5"
            required
          />
        </label>
        <button className="btn-primary sm:col-span-2">Criar horários</button>
      </form>
    </Modal>
  );
}
export function BookingForm({ profile, patients, item, close, load, flash }: any) {
  const [q, setQ] = useState(item.appointment?.patients?.full_name || '');
  const [pid, setPid] = useState(item.appointment?.patient_id || '');
  const [birthDate,setBirthDate]=useState('');
  const found = patients
    .filter((p: Patient) =>
      `${p.full_name} ${p.phone} ${p.cpf}`
        .toLowerCase()
        .includes(q.toLowerCase()),
    )
    .slice(0, 6);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    let patientId = pid;
    if (!patientId) {
      const phone = digits(String(f.get('phone')));
      const name = String(f.get('name')).trim();
      const { data: existing } = await supabase.from('patients').select('id').eq('phone',phone).ilike('full_name',name).maybeSingle();
      if (existing?.id) patientId = existing.id;
    }
    if (!patientId) {
      const { data, error } = await supabase
        .from('patients')
        .insert({
           full_name: String(f.get('name')).trim(),
           phone: digits(String(f.get('phone'))),
          birth_date: birthDate || null,
          age: calculateAge(birthDate),
          notes: f.get('patient_notes'),
          created_store_id: item.schedule.store_id,
          created_by: profile.id,
        })
        .select()
        .single();
      if (error) return flash(error.message);
      patientId = data.id;
    }
    const payload = {
      schedule_id: item.schedule.id,
      patient_id: patientId,
      city_id: item.schedule.city_id,
      store_id: item.schedule.store_id,
      booked_by: profile.id,
      starts_at: `${item.schedule.schedule_date}T${item.time}:00-03:00`,
      has_plan: f.get('plan') === 'true',
      exam_value: Number(f.get('value')),
      notes: f.get('notes'),
    };
    const { error } = item.appointment
      ? await supabase.from('appointments').update(payload).eq('id',item.appointment.id)
      : await supabase.from('appointments').insert(payload);
    if (error) flash(error.message);
    else {
      flash('Paciente adicionado à agenda.');
      if (!item.appointment) {
        const { error: notifyError } = await supabase.functions.invoke('notify-appointment', { body: { schedule_id:item.schedule.id, patient_id:patientId, starts_at:payload.starts_at } });
        if (notifyError) flash('Agendamento salvo, mas o e-mail de notificação não pôde ser enviado.');
      }
      close();
      load();
    }
  }
  return (
    <Modal title={`Adicionar paciente · ${item.time}`} close={close}>
      <form onSubmit={submit} className="space-y-4">
        <label className="label">
          Buscar cadastro existente
          <input
            className="field"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPid('');
            }}
            placeholder="Nome, telefone ou CPF"
          />
        </label>
        {q && (
          <div className="border rounded-xl divide-y">
            {found.map((p: Patient) => (
              <button
                type="button"
                key={p.id}
                className="block w-full text-left p-3"
                onClick={() => {
                  setPid(p.id);
                  setQ(p.full_name);
                }}
              >
                <b>{p.full_name}</b> <small>{formatPhone(p.phone)} · CPF {formatCpf(p.cpf)||'—'}</small>
              </button>
            ))}
          </div>
        )}
        {!pid && (
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="label sm:col-span-2">
              Nome *<input name="name" className="field" required />
            </label>
            <label className="label">
              Telefone *<input name="phone" className="field" inputMode="tel" onInput={e=>e.currentTarget.value=formatPhone(e.currentTarget.value)} required />
            </label>
            <label className="label">
              Data de nascimento
              <input name="birth_date" className="field" type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} />
            </label>
            <label className="label">
              Idade calculada
              <input className="field" value={calculateAge(birthDate)??''} readOnly placeholder="Informe a data de nascimento" />
            </label>
            <label className="label sm:col-span-2">
              Observação do paciente
              <textarea name="patient_notes" className="field" />
            </label>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="label">
            Possui plano? *
            <select name="plan" className="field" required defaultValue={item.appointment ? String(item.appointment.has_plan) : ''}>
              <option value="">Selecione</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </label>
          <label className="label">
            Valor do exame *
            <input
              name="value"
              className="field"
              type="number"
              min="0"
              step="0.01"
              required defaultValue={item.appointment?.exam_value}
            />
          </label>
          <label className="label sm:col-span-2">
            Observação opcional
            <textarea name="notes" className="field" defaultValue={item.appointment?.notes} />
          </label>
        </div>
        <button className="btn-primary w-full">Salvar agendamento</button>
      </form>
    </Modal>
  );
}
