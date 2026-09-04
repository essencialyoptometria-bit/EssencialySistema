'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Cake, Check, ClipboardList, Clock3, FilePlus2, FileText,
<<<<<<< HEAD
  CalendarPlus, CheckCircle2, History, LayoutDashboard, LogOut, Menu, MessageCircle, PhoneCall, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
import { br, brDateTime, cash, digits, formatPhone, googleCalendarContactUrl, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
import { Empty, Modal, Status } from '@/components/essencialy/shared-ui';
export function Dashboard({ appointments, patients, consultations, prescriptions, contacts, setView, setTarget, setModal, load, flash }: any) {
=======
  History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
import { br, cash, digits, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
import { Empty, Modal, Status } from '@/components/essencialy/shared-ui';
export function Dashboard({ appointments, patients, consultations, prescriptions, setView, setTarget }: any) {
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
  const today = appointments.filter(
    (a: Appointment) =>
      a.starts_at.slice(0, 10) === iso() && a.status !== 'CANCELADO',
  );
  const pending = appointments.filter(
    (a: Appointment) =>
      a.starts_at.slice(0, 10) === tomorrow() && a.status === 'AGENDADO',
  );
  const returns = consultations.filter(
    (c: Consultation) => c.return_date && c.return_date >= iso(),
  );
  const missed = appointments.filter(
    (a: Appointment) => a.status === 'FALTOSO',
  );
  const startMonth = iso().slice(0, 7);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const week = consultations.filter((c: Consultation) => c.exam_date >= iso(weekAgo));
  const month = consultations.filter((c: Consultation) => c.exam_date.startsWith(startMonth));
  const birthdays = patients.filter((p: Patient) => p.birth_date?.slice(5) === iso().slice(5));
  const expired = prescriptions.filter((r: Prescription) => {
    const d = new Date(r.exam_date + 'T12:00:00'); d.setFullYear(d.getFullYear() + 1);
    return d < new Date();
  });
<<<<<<< HEAD
  const contactReturns = [...contacts]
    .filter((contact: Contact) => contact.scheduled_return_at && !contact.return_completed_at)
    .sort((a: Contact, b: Contact) => String(a.scheduled_return_at).localeCompare(String(b.scheduled_return_at)));
  async function completeContact(contact: Contact) {
    const { data, error } = await supabase
      .from('crm_contacts')
      .update({ return_completed_at: new Date().toISOString() })
      .eq('id', contact.id)
      .select('id')
      .maybeSingle();
    if (error) return flash(error.message);
    if (!data) return flash('O retorno não foi concluído. Verifique sua permissão.');
    flash('Retorno de contato concluído.');
    await load();
  }
=======
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
  const cards = [
    ['Consultas hoje', today.length, CalendarDays, 'agenda', 'hoje'],
    ['A confirmar', pending.length, MessageCircle, 'crm', 'confirmacoes'],
    ['Retornos', returns.length, History, 'crm', 'retornos'],
    ['Faltosos', missed.length, UserRound, 'crm', 'faltosos'],
    ['Consultas da semana', week.length, Stethoscope, 'historico', 'semana'],
    ['Consultas do mês', month.length, ClipboardList, 'historico', 'mes'],
    ['Aniversariantes hoje', birthdays.length, Cake, 'crm', 'aniversariantes'],
    ['Receitas vencidas', expired.length, FileText, 'crm', 'receitas'],
<<<<<<< HEAD
    ['Clientes para retornar contato', contactReturns.length, PhoneCall, 'dashboard', 'contatos'],
=======
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
  ];
  return (
    <>
      <div>
        <p className="text-sm font-bold text-[#8a7560]">Visão geral</p>
        <h2 className="text-3xl font-black">Bom trabalho hoje.</h2>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {cards.map(([label, count, Icon, to, filter]: any) => (
          <button
            key={label}
<<<<<<< HEAD
            onClick={() => {
              if (filter === 'contatos') {
                document.getElementById('contact-returns')?.scrollIntoView({ behavior: 'smooth' });
                return;
              }
              setTarget({ crmFilter: filter }); setView(to);
            }}
=======
            onClick={() => { setTarget({ crmFilter: filter }); setView(to); }}
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
            className="card p-5 text-left hover:-translate-y-0.5 transition"
          >
            <div className="p-2.5 w-fit rounded-xl bg-[#edf2ef] text-[#173f32]">
              <Icon size={21} />
            </div>
            <p className="mt-5 text-sm font-bold text-[#727c75]">{label}</p>
            <b className="text-4xl">{count}</b>
          </button>
        ))}
      </div>
<<<<<<< HEAD
      <section id="contact-returns" className="card p-5 mt-6 scroll-mt-24">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="font-black">Clientes para retornar contato</h3><p className="text-sm text-[#7d857f]">Lembretes agendados pelo CRM.</p></div>
          <span className="badge bg-[#edf2ef]">{contactReturns.length}</span>
        </div>
        <div className="mt-3 divide-y">
          {contactReturns.length ? contactReturns.map((contact: Contact) => (
            <article key={contact.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <b>{contact.patients?.full_name}</b>
                <p className="text-sm text-[#7d857f]">{brDateTime(contact.scheduled_return_at)} · {formatPhone(contact.patients?.phone) || 'Sem telefone'}</p>
                <p className="text-xs text-[#8a7560]">{contact.reason}{contact.notes ? ` — ${contact.notes}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/55${digits(contact.patients?.phone)}`}>WhatsApp</a>
                {contact.patients && <a className="btn-secondary" target="_blank" rel="noreferrer" href={googleCalendarContactUrl(contact.patients, contact.scheduled_return_at)}><CalendarPlus className="mr-1 inline" size={16}/> Google Agenda</a>}
                <button className="btn-primary" onClick={()=>{setTarget({patient:contact.patients,contactReminder:contact});setModal('contact')}}>Registrar contato</button>
                <button className="btn-secondary" onClick={()=>completeContact(contact)}><CheckCircle2 className="mr-1 inline" size={16}/> Concluir</button>
              </div>
            </article>
          )) : <Empty>Nenhum retorno de contato pendente.</Empty>}
        </div>
      </section>
=======
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
      <div className="grid lg:grid-cols-[1.4fr_.6fr] gap-5 mt-6">
        <section className="card p-5">
          <h3 className="font-black">Atendimentos de hoje</h3>
          <div className="divide-y mt-3">
            {today.length ? (
              today.slice(0, 6).map((a: Appointment) => (
                <div key={a.id} className="py-3 flex justify-between">
                  <div>
                    <b>{a.patients?.full_name}</b>
                    <p className="text-sm text-[#7d857f]">
                      {new Date(a.starts_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Status value={a.status} />
                </div>
              ))
            ) : (
              <Empty>Nenhum atendimento hoje.</Empty>
            )}
          </div>
        </section>
        <section className="card p-5">
          <h3 className="font-black">Pacientes</h3>
          <b className="text-5xl block mt-5">{patients.length}</b>
          <p className="text-sm text-[#7d857f] mt-2">
            cadastros únicos no Supabase
          </p>
        </section>
      </div>
    </>
  );
}
<<<<<<< HEAD
=======

>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
