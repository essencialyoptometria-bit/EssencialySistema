'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ClipboardList, Search, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Appointment, Patient, Profile, Schedule } from '@/types/essencialy';
import { calculateAge, digits, formatCpf, formatPhone, iso } from '@/lib/essencialy-utils';

type TriageMode = 'new' | 'returning';

const complaintFields = [
  ['headache', 'Dor de cabeça'],
  ['near_vision_difficulty', 'Baixa visão para perto'],
  ['far_vision_difficulty', 'Baixa visão para longe'],
  ['dizziness', 'Tontura / náusea'],
  ['ocular_pain', 'Dor ocular / cansaço'],
  ['photophobia', 'Fotofobia'],
] as const;

const healthFields = [
  ['diabetes', 'Diabetes'],
  ['hypertension', 'Hipertensão'],
  ['labyrinthitis', 'Labirintite'],
  ['glaucoma', 'Glaucoma'],
  ['pterygium', 'Pterígio'],
  ['ocular_surgery', 'Cirurgia ocular anterior'],
] as const;

const familyFields = [
  ['family_diabetes', 'Diabetes na família'],
  ['family_hypertension', 'Hipertensão na família'],
  ['family_glaucoma', 'Glaucoma na família'],
] as const;

function CheckGroup({
  title,
  fields,
  triage,
}: {
  title: string;
  fields: ReadonlyArray<readonly [string, string]>;
  triage?: Record<string, unknown>;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="w-full border-b pb-2 font-black">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([key, label]) => (
          <label
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border bg-white p-3"
            key={key}
          >
            <input
              className="size-4 accent-[#c8a74e]"
              name={key}
              type="checkbox"
              defaultChecked={Boolean(triage?.[key])}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Triage({
  profile,
  patients,
  appointments,
  schedules,
  target,
  setTarget,
  load,
  flash,
}: {
  profile: Profile;
  patients: Patient[];
  appointments: Appointment[];
  schedules: Schedule[];
  target?: Appointment | null;
  setTarget: (value: unknown) => void;
  load: () => Promise<void>;
  flash: (message: string) => void;
}) {
  // `target` pode ser um Appointment vindo da Agenda ou da Fila.
  const initialPatientId = target?.patient_id || target?.id || '';
  const [mode, setMode] = useState<TriageMode>(initialPatientId ? 'returning' : 'new');
  const [selectedId, setSelectedId] = useState(initialPatientId);
  const [search, setSearch] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [step, setStep] = useState<'patient' | 'anamnesis'>(
    initialPatientId ? 'anamnesis' : 'patient',
  );
  const [saving, setSaving] = useState(false);

  const selectedPatient = patients.find((patient) => patient.id === selectedId);
  const normalizedSearch = search.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];
    const searchDigits = digits(normalizedSearch);
    return patients
      .filter((patient) => {
        const text = [
          patient.full_name,
          patient.cpf || '',
          patient.phone,
        ].join(' ').toLowerCase();
        return (
          text.includes(normalizedSearch) ||
          (searchDigits.length >= 3 &&
            (digits(patient.cpf || '').includes(searchDigits) ||
              digits(patient.phone).includes(searchDigits)))
        );
      })
      .slice(0, 20);
  }, [normalizedSearch, patients]);

  function changeMode(nextMode: TriageMode) {
    setMode(nextMode);
    setSelectedId('');
    setSearch('');
    setNewBirthDate('');
    setStep('patient');
    setTarget(null);
  }

  async function ensureQueueAppointment(patientId: string) {
    const existing = appointments.find(
      (appointment) =>
        appointment.patient_id === patientId &&
        !['ATENDIDO', 'FALTOSO', 'CANCELADO'].includes(appointment.status),
    );
    if (existing) return existing.id;

    if (!profile?.id || !profile.city_id || !profile.store_id) {
      throw new Error(
        'O usuário precisa ter cidade e ótica configuradas para enviar um encaixe à fila.',
      );
    }

    let dailySchedule = schedules.find(
      (schedule) =>
        schedule.schedule_date === iso() &&
        schedule.city_id === profile.city_id &&
        schedule.store_id === profile.store_id &&
        schedule.professional_name === 'Encaixes do dia',
    );

    if (!dailySchedule) {
      const { data: savedSchedules, error: scheduleSearchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_date', iso())
        .eq('city_id', profile.city_id)
        .eq('store_id', profile.store_id)
        .eq('professional_name', 'Encaixes do dia')
        .limit(1);
      if (scheduleSearchError) throw scheduleSearchError;
      dailySchedule = savedSchedules?.[0] as Schedule | undefined;
    }

    if (!dailySchedule) {
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          city_id: profile.city_id,
          store_id: profile.store_id,
          professional_name: 'Encaixes do dia',
          schedule_date: iso(),
          start_time: '00:00',
          end_time: '23:59',
          interval_minutes: 30,
          created_by: profile.id,
        })
        .select()
        .single();
      if (error) throw error;
      dailySchedule = data as Schedule;
    }

    const [startHour, startMinute] = dailySchedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = dailySchedule.end_time.split(':').map(Number);
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    const interval = dailySchedule.interval_minutes;
    const now = new Date();
    const nowTotal = now.getHours() * 60 + now.getMinutes();
    let slotTotal =
      startTotal + Math.max(0, Math.ceil((nowTotal - startTotal) / interval)) * interval;

    const { data: scheduleAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('starts_at')
      .eq('schedule_id', dailySchedule.id)
      .neq('status', 'CANCELADO');
    if (appointmentsError) throw appointmentsError;

    const occupiedSlots = new Set(
      (scheduleAppointments || []).map((appointment) => {
        const date = new Date(appointment.starts_at);
        return date.getHours() * 60 + date.getMinutes();
      }),
    );
    while (slotTotal < endTotal && occupiedSlots.has(slotTotal)) slotTotal += interval;
    if (slotTotal >= endTotal) {
      throw new Error('Não há mais horários disponíveis para encaixe na agenda de hoje.');
    }

    const slotHour = String(Math.floor(slotTotal / 60)).padStart(2, '0');
    const slotMinute = String(slotTotal % 60).padStart(2, '0');
    const startsAt = new Date(`${iso()}T${slotHour}:${slotMinute}:00-03:00`).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        schedule_id: dailySchedule.id,
        patient_id: patientId,
        city_id: profile.city_id,
        store_id: profile.store_id,
        booked_by: profile.id,
        starts_at: startsAt,
        has_plan: false,
        exam_value: 0,
        notes: 'Encaixe criado pela triagem',
        status: 'AGUARDANDO_ATENDIMENTO',
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);

    try {
      let patientId = selectedId;

      if (mode === 'new') {
        const cpf = digits(String(form.get('cpf') || ''));
        const phone = digits(String(form.get('phone') || ''));
        const duplicate = patients.find(
          (patient) =>
            (cpf && digits(patient.cpf || '') === cpf) ||
            (phone && digits(patient.phone) === phone),
        );
        if (duplicate) {
          throw new Error(
            'Já existe um paciente com este CPF ou telefone. Use a opção “Paciente retornando”.',
          );
        }

        const birthDate = String(form.get('birth_date') || '');
        const { data, error } = await supabase
          .from('patients')
          .insert({
            full_name: String(form.get('full_name') || '').trim(),
            cpf,
            birth_date: birthDate || null,
            age: calculateAge(birthDate),
            phone,
            address: String(form.get('address') || '').trim(),
            city_name: String(form.get('city_name') || '').trim() || null,
            notes: String(form.get('patient_notes') || '').trim() || null,
            created_by: profile.id,
            created_store_id: profile.store_id,
          })
          .select('id')
          .single();
        if (error) throw error;
        patientId = data.id;
      }

      if (!patientId) throw new Error('Selecione um paciente para continuar.');

      const triage = {
        ...Object.fromEntries(
          [...complaintFields, ...healthFields, ...familyFields].map(([key]) => [
            key,
            form.get(key) === 'on',
          ]),
        ),
        glasses: form.get('glasses') === 'on',
        contacts: form.get('contacts') === 'on',
        complaint: String(form.get('complaint') || '').trim(),
        ocular_history: String(form.get('ocular_history') || '').trim(),
        medications: String(form.get('medications') || '').trim(),
        notes: String(form.get('notes') || '').trim(),
      };

      const appointmentId = await ensureQueueAppointment(patientId);
      const { error } = await supabase.rpc('submit_triage', {
        p_patient_id: patientId,
        p_appointment_id: appointmentId,
        p_triage: triage,
      });
      if (error) throw error;
      const { error: historyError } = await supabase.from('triage_history').insert({patient_id:patientId,appointment_id:appointmentId,recorded_by:profile.id,data:triage});
      if (historyError) throw historyError;

      flash('Triagem salva. Paciente enviado para a fila de atendimento.');
      setTarget(null);
      setSelectedId('');
      setSearch('');
      setStep('patient');
      await load();
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Não foi possível salvar a triagem.');
    } finally {
      setSaving(false);
    }
  }

  const canOpenAnamnesis = mode === 'new' || Boolean(selectedPatient);
  const triageData = selectedPatient?.triage;

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-bold text-[#9a7b2f]">Atendimento inicial</p>
        <h2 className="text-3xl font-black">Triagem / Anamnese</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre um paciente novo ou localize quem está retornando.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => changeMode('new')}
          className={
            'flex min-h-16 items-center justify-center gap-3 rounded-xl border-2 font-black ' +
            (mode === 'new'
              ? 'border-[#c8a74e] bg-[#fff9e8] text-[#8a6a1f]'
              : 'border-gray-200 bg-white text-gray-500')
          }
        >
          <UserPlus size={21} /> Novo paciente
        </button>
        <button
          type="button"
          onClick={() => changeMode('returning')}
          className={
            'flex min-h-16 items-center justify-center gap-3 rounded-xl border-2 font-black ' +
            (mode === 'returning'
              ? 'border-[#c8a74e] bg-[#fff9e8] text-[#8a6a1f]'
              : 'border-gray-200 bg-white text-gray-500')
          }
        >
          <Users size={21} /> Paciente retornando
        </button>
      </div>

      <form className="card mt-5 overflow-hidden" onSubmit={submit}>
        <div className="grid grid-cols-2 border-b bg-gray-50">
          <button
            type="button"
            className={
              'p-4 text-sm font-black ' +
              (step === 'patient' ? 'border-b-2 border-[#c8a74e] text-[#9a7b2f]' : 'text-gray-500')
            }
            onClick={() => setStep('patient')}
          >
            1. Dados do paciente
          </button>
          <button
            type="button"
            disabled={!canOpenAnamnesis}
            className={
              'p-4 text-sm font-black disabled:opacity-40 ' +
              (step === 'anamnesis' ? 'border-b-2 border-[#c8a74e] text-[#9a7b2f]' : 'text-gray-500')
            }
            onClick={() => setStep('anamnesis')}
          >
            2. Anamnese
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {step === 'patient' && mode === 'returning' && (
            <section>
              <label className="label">Pesquisar por nome, CPF ou telefone</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3.5 text-gray-400" size={19} />
                <input
                  className="field pl-10"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Comece a digitar..."
                  autoFocus
                />
              </div>

              <div className="mt-4 space-y-2">
                {search && !searchResults.length && (
                  <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                    Nenhum paciente encontrado. Confira os dados ou use “Novo paciente”.
                  </p>
                )}
                {searchResults.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() => {
                      setSelectedId(patient.id);
                      setSearch(patient.full_name);
                    }}
                    className={
                      'w-full rounded-lg border p-4 text-left transition ' +
                      (selectedId === patient.id
                        ? 'border-[#c8a74e] bg-[#fff9e8]'
                        : 'bg-white hover:bg-gray-50')
                    }
                  >
                    <b>{patient.full_name}</b>
                    <p className="mt-1 text-sm text-gray-500">
                      CPF: {formatCpf(patient.cpf) || '—'} · Telefone: {formatPhone(patient.phone) || '—'}
                    </p>
                  </button>
                ))}
              </div>

              {selectedPatient && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <b className="text-emerald-900">Paciente selecionado</b>
                  <p className="text-sm text-emerald-800">
                    {selectedPatient.full_name} · {formatPhone(selectedPatient.phone)}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedPatient}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setStep('anamnesis')}
                >
                  Continuar para anamnese
                </button>
              </div>
            </section>
          )}

          {mode === 'new' && (
            <section className={(step === 'patient' ? 'grid' : 'hidden') + ' gap-4 sm:grid-cols-2'}>
              <label className="label sm:col-span-2">
                Nome completo *
                <input className="field" name="full_name" required />
              </label>
              <label className="label">
                CPF *
                <input className="field" name="cpf" inputMode="numeric" onInput={e=>e.currentTarget.value=formatCpf(e.currentTarget.value)} required />
              </label>
              <label className="label">
                Data de nascimento
                <input className="field" name="birth_date" type="date" value={newBirthDate} onChange={e=>setNewBirthDate(e.target.value)} />
              </label>
              <label className="label">
                Idade calculada
                <input className="field" value={calculateAge(newBirthDate)??''} readOnly placeholder="Informe a data de nascimento" />
              </label>
              <label className="label">
                Telefone / WhatsApp *
                <input className="field" name="phone" inputMode="tel" onInput={e=>e.currentTarget.value=formatPhone(e.currentTarget.value)} required />
              </label>
              <label className="label sm:col-span-2">
                Endereço completo *
                <input className="field" name="address" required />
              </label>
              <label className="label">
                Cidade / Estado
                <input className="field" name="city_name" />
              </label>
              <label className="label">
                Observação cadastral
                <input className="field" name="patient_notes" />
              </label>
              <div className="flex justify-end sm:col-span-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={(event) => {
                    if (event.currentTarget.form?.reportValidity()) setStep('anamnesis');
                  }}
                >
                  Continuar para anamnese
                </button>
              </div>
            </section>
          )}

          {step === 'anamnesis' && canOpenAnamnesis && (
            <section className="space-y-6">
              {selectedPatient && (
                <div className="rounded-lg bg-gray-100 p-3 text-sm">
                  Anamnese de <b>{selectedPatient.full_name}</b>
                </div>
              )}
              <CheckGroup title="Queixas principais" fields={complaintFields} triage={triageData} />
              <CheckGroup title="Saúde do paciente" fields={healthFields} triage={triageData} />
              <CheckGroup title="Histórico familiar" fields={familyFields} triage={triageData} />


              <div className="flex flex-col-reverse justify-end gap-3 border-t pt-5 sm:flex-row">
                <button type="button" className="btn-secondary" onClick={() => setStep('patient')}>
                  Voltar aos dados
                </button>
                <button disabled={saving} className="btn-primary">
                  <ClipboardList className="mr-2 inline" size={18} />
                  {saving ? 'Salvando...' : 'Salvar e enviar para fila'}
                </button>
              </div>
            </section>
          )}
        </div>
      </form>
    </div>
  );
}
