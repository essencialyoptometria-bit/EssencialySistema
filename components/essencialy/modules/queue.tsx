'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Cake, Check, ClipboardList, Clock3, FilePlus2, FileText,
  History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
<<<<<<< HEAD
import { br, calculateAge, cash, digits, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
=======
import { br, cash, digits, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
import { Empty, Modal, Status } from '@/components/essencialy/shared-ui';
export function Queue({ appointments, setTarget, setModal, load, flash }: any) {
  const queue = appointments.filter((a:Appointment)=>a.status==='AGUARDANDO_ATENDIMENTO');
  async function start(a:Appointment) {
    const { error } = await supabase.rpc('start_attendance',{p_appointment_id:a.id});
    if(error) return flash(error.message);
    setTarget({patient:a.patients,appointment:a}); setModal('consultation'); load();
  }
  return <><h2 className="text-3xl font-black">Pacientes aguardando atendimento</h2>
    <p className="text-[#778079]">Fila em tempo real após a conclusão da anamnese.</p>
    <div className="space-y-3 mt-5">{queue.length?queue.map((a:Appointment)=>{
      const since=new Date(a.starts_at); const mins=Math.max(0,Math.floor((Date.now()-since.getTime())/60000));
      return <article key={a.id} className="card p-5 grid md:grid-cols-[1fr_auto] gap-4">
<<<<<<< HEAD
        <div><b className="text-lg">{a.patients?.full_name}</b><p className="text-sm text-[#778079]">{new Date(a.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · {calculateAge(a.patients?.birth_date)??'—'} anos · {a.cities?.name} · {a.optical_stores?.name}</p><p className="text-sm text-emerald-700 mt-2">✓ Anamnese concluída · espera {mins} min</p></div>
        <button className="btn-primary" onClick={()=>start(a)}>Iniciar atendimento</button>
      </article>}) : <section className="card"><Empty>Nenhum paciente aguardando.</Empty></section>}</div></>;
}
=======
        <div><b className="text-lg">{a.patients?.full_name}</b><p className="text-sm text-[#778079]">{new Date(a.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · {a.patients?.age||'—'} anos · {a.cities?.name} · {a.optical_stores?.name}</p><p className="text-sm text-emerald-700 mt-2">✓ Anamnese concluída · espera {mins} min</p></div>
        <button className="btn-primary" onClick={()=>start(a)}>Iniciar atendimento</button>
      </article>}) : <section className="card"><Empty>Nenhum paciente aguardando.</Empty></section>}</div></>;
}

>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
