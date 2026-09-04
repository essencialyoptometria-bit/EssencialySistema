'use client';

import { FormEvent, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Cake, Check, ClipboardList, Clock3, FilePlus2, FileText,
  History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
<<<<<<< HEAD
import { br, calculateAge, formatCpf, formatPhone, iso, printDeclaration, printPrescription, signedSphere } from '@/lib/essencialy-utils';
=======
import { br, iso, printDeclaration, printPrescription } from '@/lib/essencialy-utils';
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
import { Empty, Modal, Status, TriageSummary } from '@/components/essencialy/shared-ui';
export function Consultations({ patients, consultations, setTarget, setModal }: any) {
  return (
    <>
      <h2 className="text-3xl font-black">Consulta</h2>
      <p className="text-[#778079]">Registre o exame e a data de retorno.</p>
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        {patients.map((p: Patient) => {
          const last = consultations.find(
            (c: Consultation) => c.patient_id === p.id,
          );
          return (
            <article
              className="card p-5 flex justify-between items-center"
              key={p.id}
            >
              <div>
                <b>{p.full_name}</b>
                <p className="text-sm text-[#778079]">
                  Última: {br(last?.exam_date)}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setTarget(p);
                  setModal('consultation');
                }}
              >
                Abrir
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
export function ConsultForm({ target, prescriptions, close, load, flash }: any) {
  const patient:Patient = target?.patient || target;
  const appointment:Appointment|undefined = target?.appointment;
  const [noReturn,setNoReturn]=useState(false);
  const formRef=useRef<HTMLFormElement>(null);
  const previous = [...(prescriptions || [])]
    .filter((rx: Prescription) => rx.patient_id === patient.id)
    .sort((a: Prescription, b: Prescription) => b.exam_date.localeCompare(a.exam_date))[0];
  const previousData: any = previous?.data || {};
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const screening = {
      visual_acuity_far_od:f.get('va_far_od'), visual_acuity_far_oe:f.get('va_far_oe'),
      visual_acuity_near_od:f.get('va_near_od'), visual_acuity_near_oe:f.get('va_near_oe'),
      corrected:f.get('corrected')==='on',
      bichrome_green:f.get('bichrome_green'),
      bichrome_red:f.get('bichrome_red')
    };
<<<<<<< HEAD
    const prescription={od_spherical:signedSphere(f.get('od_spherical')),od_cylindrical:f.get('od_cylindrical'),od_axis:f.get('od_axis'),oe_spherical:signedSphere(f.get('oe_spherical')),oe_cylindrical:f.get('oe_cylindrical'),oe_axis:f.get('oe_axis'),addition:f.get('addition')};
=======
    const prescription={od_spherical:f.get('od_spherical'),od_cylindrical:f.get('od_cylindrical'),od_axis:f.get('od_axis'),oe_spherical:f.get('oe_spherical'),oe_cylindrical:f.get('oe_cylindrical'),oe_axis:f.get('oe_axis'),addition:f.get('addition')};
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
    const { error } = await supabase.rpc('complete_consultation',{
      p_patient_id:patient.id,p_appointment_id:appointment?.id||null,p_exam_date:f.get('exam_date'),
      p_return_date:noReturn?null:(f.get('return_date')||null),p_screening:screening,p_notes:f.get('notes')||null,
      p_conduct:f.get('conduct')||null,p_prescription:prescription,p_dp:f.get('dp')||null
    });
    if (error) return flash(error.message);
    flash('Consulta, receita e retorno salvos.');
    close();
    load();
  }
<<<<<<< HEAD
  function currentPrescription(){const f=new FormData(formRef.current!);return {exam_date:String(f.get('exam_date')||iso()),pupillary_distance:String(f.get('dp')||''),notes:String(f.get('notes')||''),data:{od_spherical:signedSphere(f.get('od_spherical')),od_cylindrical:f.get('od_cylindrical'),od_axis:f.get('od_axis'),oe_spherical:signedSphere(f.get('oe_spherical')),oe_cylindrical:f.get('oe_cylindrical'),oe_axis:f.get('oe_axis'),addition:f.get('addition')}};}
  return (
    <Modal title={`Consulta · ${patient.full_name}`} close={close}>
      <section className="rounded-xl bg-[#edf2ef] p-4 mb-4">
        <b>Dados do paciente</b><div className="mt-2 grid gap-1 text-sm sm:grid-cols-2"><span><b>Nome:</b> {patient.full_name}</span><span><b>CPF:</b> {formatCpf(patient.cpf)||'—'}</span><span><b>Telefone:</b> {formatPhone(patient.phone)||'—'}</span><span><b>Nascimento:</b> {br(patient.birth_date)}</span><span><b>Idade:</b> {calculateAge(patient.birth_date)??'—'} anos</span></div>
=======
  function currentPrescription(){const f=new FormData(formRef.current!);return {exam_date:String(f.get('exam_date')||iso()),pupillary_distance:String(f.get('dp')||''),notes:String(f.get('notes')||''),data:{od_spherical:f.get('od_spherical'),od_cylindrical:f.get('od_cylindrical'),od_axis:f.get('od_axis'),oe_spherical:f.get('oe_spherical'),oe_cylindrical:f.get('oe_cylindrical'),oe_axis:f.get('oe_axis'),addition:f.get('addition')}};}
  return (
    <Modal title={`Consulta · ${patient.full_name}`} close={close}>
      <section className="rounded-xl bg-[#edf2ef] p-4 mb-4">
        <b>Dados do paciente</b><div className="mt-2 grid gap-1 text-sm sm:grid-cols-2"><span><b>Nome:</b> {patient.full_name}</span><span><b>CPF:</b> {patient.cpf||'—'}</span><span><b>Telefone:</b> {patient.phone||'—'}</span><span><b>Nascimento:</b> {br(patient.birth_date)}</span></div>
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
        <h3 className="mt-4 font-black">Triagem / Anamnese</h3>
        <TriageSummary triage={patient.triage} />
      </section>
      <form ref={formRef} onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <label className="label">
          Data do exame
          <input
            className="field"
            name="exam_date"
            type="date"
            defaultValue={iso()}
            required
          />
        </label>
        <label className="label">
          Data de retorno
          <input className="field" name="return_date" type="date" min={iso()} disabled={noReturn} />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" checked={noReturn} onChange={e=>setNoReturn(e.target.checked)}/> Sem retorno definido</label>
        <section className="sm:col-span-2 rounded-lg border bg-gray-50 p-4">
          <h3 className="font-black">Prescrição anterior</h3>
          {previous ? (
            <>
              <table className="w-full text-sm text-center mt-3">
                <thead className="text-gray-500">
                  <tr>
                    <th className="text-left font-semibold pb-1"></th>
                    <th className="font-semibold pb-1">Esf</th>
                    <th className="font-semibold pb-1">Cil</th>
                    <th className="font-semibold pb-1">Eixo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-left font-black text-[#9a7b2f] py-1">OD</td>
                    <td>{String(previousData.od_spherical ?? previousData.esfAtualOd ?? '—')}</td>
                    <td>{String(previousData.od_cylindrical ?? previousData.cilAtualOd ?? '—')}</td>
                    <td>{String(previousData.od_axis ?? previousData.eixAtualOd ?? '—')}</td>
                  </tr>
                  <tr>
                    <td className="text-left font-black text-[#9a7b2f] py-1">OE</td>
                    <td>{String(previousData.oe_spherical ?? previousData.esfAtualOe ?? '—')}</td>
                    <td>{String(previousData.oe_cylindrical ?? previousData.cilAtualOe ?? '—')}</td>
                    <td>{String(previousData.oe_axis ?? previousData.eixAtualOe ?? '—')}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-between text-sm mt-2 text-gray-600">
                <span>Adição: <b>{String(previousData.addition ?? previousData.addAtual ?? '—')}</b></span>
                <span>Exame: <b>{br(previous.exam_date)}</b></span>
              </div>
            </>
          ) : <p className="text-sm text-gray-500 mt-2">Nenhuma prescrição anterior registrada.</p>}
        </section>
        <h3 className="font-black sm:col-span-2">Receita</h3>
        <section className="sm:col-span-2 rounded-lg border bg-white p-4">
          <table className="w-full text-sm text-center">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left font-semibold pb-2"></th>
                <th className="font-semibold pb-2">Esf</th>
                <th className="font-semibold pb-2">Cil</th>
                <th className="font-semibold pb-2">Eixo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-left font-black text-[#9a7b2f] pr-2 w-10">OD</td>
                <td className="px-1 py-1"><input className="field text-center" name="od_spherical" placeholder="+ / -" /></td>
                <td className="px-1 py-1"><input className="field text-center" name="od_cylindrical" placeholder="+ / -" /></td>
                <td className="px-1 py-1"><input className="field text-center" name="od_axis" /></td>
              </tr>
              <tr>
                <td className="text-left font-black text-[#9a7b2f] pr-2 w-10">OE</td>
                <td className="px-1 py-1"><input className="field text-center" name="oe_spherical" placeholder="+ / -" /></td>
                <td className="px-1 py-1"><input className="field text-center" name="oe_cylindrical" placeholder="+ / -" /></td>
                <td className="px-1 py-1"><input className="field text-center" name="oe_axis" /></td>
              </tr>
            </tbody>
          </table>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="font-bold text-sm text-[#9a7b2f]">Adição:</span>
            <input className="field text-center w-28" name="addition" />
          </div>
        </section>
        <label className="label">DP<input className="field" name="dp" /></label>
        <h3 className="font-black sm:col-span-2">Acuidade visual</h3>
        {['va_far_od','va_far_oe','va_near_od','va_near_oe'].map((n,i)=><label className="label" key={n}>{['Longe OD','Longe OE','Perto OD','Perto OE'][i]}<input className="field" name={n}/></label>)}
        <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="corrected"/> Com correção</label>
        <h3 className="font-black sm:col-span-2">Teste bicromático</h3>
        <label className="label">Verde<input className="field bg-green-50" name="bichrome_green" /></label>
        <label className="label">Vermelho<input className="field bg-red-50" name="bichrome_red" /></label>
        <label className="label sm:col-span-2">Conduta e encaminhamentos<textarea className="field" rows={3} name="conduct" /></label>
        <label className="label sm:col-span-2">
          Observações clínicas
          <textarea className="field" rows={4} name="notes" />
        </label>
        <div className="sm:col-span-2 flex flex-wrap gap-2 border-t pt-4"><button className="btn-primary">Salvar consulta</button><button type="button" className="btn-secondary" onClick={()=>printDeclaration(patient,String(new FormData(formRef.current!).get('exam_date')||iso()))}>Gerar declaração de comparecimento</button><button type="button" className="btn-secondary" onClick={()=>printPrescription(patient,currentPrescription())}>Imprimir somente a receita</button></div>
      </form>
    </Modal>
  );
}
