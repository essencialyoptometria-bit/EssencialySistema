'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Cake, Check, ClipboardList, Clock3, FilePlus2, FileText,
  History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
import { br, brDateTime, cash, digits, formatCpf, formatPhone, googleCalendarContactUrl, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
import { Empty, Modal, Status } from '@/components/essencialy/shared-ui';
export function CRM({ appointments, consultations, prescriptions, patients, contacts, target, setTarget, setModal, setView, setAgendaDate, load, flash }: any) {
  const [consultationPeriod,setConsultationPeriod]=useState({start:'',end:''});
  async function confirm(a:Appointment){const{error}=await supabase.from('appointments').update({status:'CONFIRMADO',updated_at:new Date().toISOString()}).eq('id',a.id);if(error)flash(error.message);else{flash('Consulta confirmada.');load();}}
  const expired = prescriptions.filter((r:Prescription)=>{const d=new Date(r.exam_date+'T12:00:00');d.setFullYear(d.getFullYear()+1);return d<new Date()});
  const birthdays = patients.filter((p:Patient)=>p.birth_date?.slice(5)===iso().slice(5));
  const groups = [
    [
      'Pendentes de confirmação',
      appointments.filter(
        (a: Appointment) =>
          a.starts_at.slice(0, 10) === tomorrow() && a.status === 'AGENDADO',
      ),
    ],
    [
      'Faltosos',
      appointments.filter((a: Appointment) => a.status === 'FALTOSO'),
    ],
    [
      'Retornos',
      consultations.filter(
        (c: Consultation) => c.return_date && c.return_date >= iso(),
      ),
    ],
    ['Receitas vencidas', expired],
    ['Aniversariantes', birthdays],
  ];
  const selected = target?.crmFilter;
  const {start,end}=consultationPeriod;
  const hasConsultationPeriod=Boolean(start||end);
  const consultationsByPeriod = hasConsultationPeriod
    ? consultations.filter((c:Consultation)=>{
        const examDate=c.exam_date.slice(0,10);
        return (!start||examDate>=start)&&(!end||examDate<=end);
      })
    : [];
  const periodTitle=start&&end
    ? `Consultas de ${br(start)} até ${br(end)}`
    : start
      ? `Consultas a partir de ${br(start)}`
      : `Consultas até ${br(end)}`;
  return (
    <>
      <h2 className="text-3xl font-black">CRM</h2>
      <p className="text-[#778079]">Dados reais da agenda e das consultas.</p>
      <section className="card mt-4 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="label flex-1">Data inicial<input className="field" type="date" value={start} max={end||undefined} onChange={e=>setConsultationPeriod(period=>({...period,start:e.target.value}))}/></label><label className="label flex-1">Data final<input className="field" type="date" value={end} min={start||undefined} onChange={e=>setConsultationPeriod(period=>({...period,end:e.target.value}))}/></label>{hasConsultationPeriod&&<button className="btn-secondary" onClick={()=>setConsultationPeriod({start:'',end:''})}>Limpar período</button>}</div>{hasConsultationPeriod&&<div className="mt-4 border-t pt-4"><div className="flex justify-between"><b>{periodTitle}</b><span className="badge bg-[#edf2ef]">{consultationsByPeriod.length}</span></div><div className="mt-2 divide-y">{consultationsByPeriod.map((c:Consultation)=><div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={c.id}><div><b>{c.patients?.full_name}</b><p className="text-sm text-[#778079]">Consulta em {br(c.exam_date.slice(0,10))} · {formatPhone(c.patients?.phone)||'Sem telefone'} · CPF {formatCpf(c.patients?.cpf)||'—'}</p></div><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>{setTarget(c.patients);setModal('patient')}}>Abrir paciente</button><a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/55${digits(c.patients?.phone)}`}>WhatsApp</a><button className="btn-secondary" onClick={()=>{setTarget({patient:c.patients,consultation:c});setModal('contact')}}>Registrar contato</button></div></div>)}{!consultationsByPeriod.length&&<Empty>Nenhuma consulta encontrada neste período.</Empty>}</div></div>}</section>
      <div className="flex flex-wrap gap-2 mt-4">{groups.map(([title]:any)=><button key={title} className="btn-secondary" onClick={()=>setTarget({crmFilter:String(title).toLowerCase()})}>{title}</button>)}</div>
      <div className="grid xl:grid-cols-3 gap-4 mt-5">
        {groups.filter(([title]:any)=>!selected||String(title).toLowerCase().includes(String(selected).replace('confirmacoes','confirma').replace('receitas','receita').replace('retornos','retorno').replace('faltosos','faltoso').replace('aniversariantes','anivers'))).map(([title, items]: any) => (
          <section className="card p-5" key={title}>
            <div className="flex justify-between">
              <b>{title}</b>
              <span className="badge bg-[#edf2ef]">{items.length}</span>
            </div>
            <div className="divide-y mt-3">
              {items.length ? (
                items.map((x: any) => (
                  <div className="py-3" key={x.id}>
                    <b>{x.patients?.full_name || x.full_name}</b>
                    <p className="text-xs text-[#778079]">
                      {x.return_date
                        ? `Retorno ${br(x.return_date)}`
                        : `${br(x.starts_at)} · ${formatPhone(x.patients?.phone) || ''}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button className="btn-secondary" onClick={()=>{setTarget(x.patients||x);setModal('patient')}}>Abrir paciente</button>
                      <a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/55${digits((x.patients||x)?.phone)}`}>WhatsApp</a>
                      <button className="btn-secondary" onClick={()=>{setTarget({patient:x.patients||x,appointment:x.starts_at?x:null,consultation:x.return_date?x:null});setModal('contact')}}>Registrar contato</button>
                      {x.status==='AGENDADO'&&<button className="btn-secondary" onClick={()=>confirm(x)}>Confirmar</button>}
                      {x.return_date&&<button className="btn-secondary" onClick={()=>{setAgendaDate(x.return_date);setView('agenda')}}>Agendar retorno</button>}
                    </div>
                  </div>
                ))
              ) : (
                <Empty>Nenhuma pendência.</Empty>
              )}
            </div>
          </section>
        ))}
      </div>
      <section className="card p-5 mt-5"><h3 className="font-black">Histórico de contatos</h3>
        <div className="divide-y">{contacts.slice(0,20).map((c:Contact)=><div className="py-3" key={c.id}><b>{c.patients?.full_name}</b><p className="text-sm">{br(c.contacted_at)} · {c.contact_user?.full_name} · {c.reason}</p><p className="text-sm text-[#778079]">{c.result}{c.notes?` — ${c.notes}`:''}{c.scheduled_return_at?` · Retornar em ${brDateTime(c.scheduled_return_at)}`:''}</p></div>)}</div>
      </section>
    </>
  );
}

export function ContactForm({profile,target,close,load,flash}:any){const p=target.patient;const[scheduled,setScheduled]=useState('');async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const scheduledReturn=scheduled?new Date(scheduled).toISOString():null;const{error}=await supabase.from('crm_contacts').insert({patient_id:p.id,appointment_id:target.appointment?.id||null,consultation_id:target.consultation?.id||null,contacted_by:profile.id,reason:f.get('reason'),result:f.get('result'),notes:f.get('notes')||null,scheduled_return_at:scheduledReturn});if(error)return flash(error.message);if(target.contactReminder?.id){const{error:completeError}=await supabase.from('crm_contacts').update({return_completed_at:new Date().toISOString()}).eq('id',target.contactReminder.id);if(completeError)return flash(`Contato salvo, mas o lembrete anterior não foi concluído: ${completeError.message}`)}if(target.consultation?.id)await supabase.from('consultations').update({return_status:scheduledReturn?'AGENDADO':'CONTATAR'}).eq('id',target.consultation.id);flash(scheduledReturn?'Contato salvo e retorno enviado ao dashboard.':'Contato registrado.');close();load()}return <Modal title={`Registrar contato · ${p.full_name}`} close={close}><form onSubmit={save} className="space-y-4"><label className="label">Motivo<input className="field" name="reason" required/></label><label className="label">Resultado<select className="field" name="result" required><option value="">Selecione</option><option>Confirmou interesse</option><option>Não respondeu</option><option>Retorno agendado</option><option>Não tem interesse</option></select></label><label className="label">Retorno agendado<input className="field" name="scheduled_return_at" type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)}/></label>{scheduled&&<a className="btn-secondary block w-full text-center" target="_blank" rel="noreferrer" href={googleCalendarContactUrl(p,scheduled)}>Adicionar também ao Google Agenda</a>}<label className="label">Observação<textarea className="field" name="notes"/></label><button className="btn-primary w-full">Salvar contato</button></form></Modal>}
