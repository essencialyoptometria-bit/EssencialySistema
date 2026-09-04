'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  CalendarDays,
  Bell,
  Cake,
  Check,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Stethoscope,
  UserRound,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Notification, Patient, Prescription, Profile, Schedule, Store, TriageRecord } from '@/types/essencialy';
import { iso } from '@/lib/essencialy-utils';
import { Spinner } from '@/components/essencialy/shared-ui';
import { Dashboard } from '@/components/essencialy/modules/dashboard';
import { Agenda, BookingForm, ScheduleForm } from '@/components/essencialy/modules/agenda';
import { PatientRecord, Patients } from '@/components/essencialy/modules/patients';
import { Triage } from '@/components/essencialy/modules/triage';
import { Queue } from '@/components/essencialy/modules/queue';
import { ConsultForm, Consultations } from '@/components/essencialy/modules/consultations';
import { HistoryPage } from '@/components/essencialy/modules/history';
import { ContactForm, CRM } from '@/components/essencialy/modules/crm';
import { DirectForm, DirectPage } from '@/components/essencialy/modules/direct-registration';
import { PasswordForm, UserForm, UsersPage } from '@/components/essencialy/modules/users';
import { Config } from '@/components/essencialy/modules/config';
const nav = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['agenda', 'Agenda', CalendarDays],
  ['pacientes', 'Pacientes', Users],
  ['triagem', 'Triagem', ClipboardList],
  ['fila', 'Fila de atendimento', Clock3],
  ['crm', 'CRM', MessageCircle],
  ['cadastro-direto', 'Cadastro direto', FilePlus2],
  ['usuarios', 'Usuários', UserPlus],
  ['configuracoes', 'Configurações', Settings],
] as const;

function Auth() {
  const signup = false;
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email'));
    const password = String(f.get('password'));
    const result = signup
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: f.get('name') } },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setMsg(result.error.message);
    else if (signup && !result.data.session)
      setMsg('Confira seu e-mail para confirmar o acesso.');
  }
  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_.9fr]">
      <section className="hidden lg:flex bg-[#111111] text-white p-14 flex-col justify-between">
        <b className="text-[#e0c47d] tracking-[.28em]">ESSENCIALY</b>
        <div>
          <p className="text-[#e0c47d] text-xs font-black tracking-[.2em]">
            GESTÃO OPTOMÉTRICA
          </p>
          <h1 className="text-5xl font-semibold leading-tight mt-4">
            Do agendamento ao retorno, tudo conectado.
          </h1>
          <p className="text-white/60 mt-5 max-w-xl">
            Agenda visual, cadastro único de pacientes, consulta e CRM
            protegidos pelo Supabase.
          </p>
        </div>
        <small className="text-white/40">Ambiente seguro · Essencialy</small>
      </section>
      <section className="grid place-items-center p-5">
        <div className="card p-8 w-full max-w-md">
          <b className="lg:hidden text-[#111111] tracking-[.25em]">
            ESSENCIALY
          </b>
          <h2 className="text-3xl font-black mt-6 lg:mt-0">
            {signup ? 'Criar primeiro acesso' : 'Bem-vindo'}
          </h2>
          <p className="text-[#778179] mt-2">
            {signup
              ? 'O primeiro usuário será administrador.'
              : 'Entre com seu e-mail e senha.'}
          </p>
          <form onSubmit={submit} className="space-y-4 mt-7">
            {signup && (
              <label className="label">
                Nome completo
                <input name="name" className="field" required />
              </label>
            )}
            <label className="label">
              E-mail
              <input name="email" type="email" className="field" required />
            </label>
            <label className="label">
              Senha
              <input
                name="password"
                type="password"
                minLength={6}
                className="field"
                required
              />
            </label>
            {msg && (
              <p className="bg-amber-50 text-amber-900 rounded-xl p-3 text-sm">
                {msg}
              </p>
            )}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? 'Aguarde…' : signup ? 'Criar acesso' : 'Entrar'}
            </button>
          </form>
          <p className="text-xs text-[#778179] mt-5">Novos acessos são criados pelo administrador.</p>
        </div>
      </section>
    </main>
  );
}

export function EssencialyApp({ initialView = 'dashboard' }: { initialView?: string }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setViewState] = useState(initialView);
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [triageRecords, setTriageRecords] = useState<TriageRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [agendaDate, setAgendaDate] = useState(iso());
  const [modal, setModal] = useState<
    'schedule' | 'booking' | 'consultation' | 'patient' | 'direct' | 'user' | 'password' | 'contact' | ''
  >('');
  const [target, setTarget] = useState<any>(null);
  const clinical =
    profile?.role === 'ADMIN' || profile?.role === 'OPTOMETRISTA';
  const setView = useCallback((nextView: string) => {
    setViewState(nextView);
    const nextPath = nextView === 'dashboard' ? '/dashboard' : `/${nextView}`;
    if (window.location.pathname !== nextPath)
      window.history.pushState({ view: nextView }, '', nextPath);
  }, []);
  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(''), 3000);
  };
  const load = useCallback(async () => {
    if (!userId) return;
    setBusy(true);
    const [p, c, s, pt, sc, ap, co, rx, ct, pf, tr, nt] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('cities').select('*').order('name'),
      supabase.from('optical_stores').select('*').order('name'),
      supabase.from('patients').select('*').order('full_name'),
      supabase
        .from('schedules')
        .select('*,cities(*),optical_stores(*)')
        .order('schedule_date'),
      supabase.from('appointments').select('*,patients(*),cities(*),optical_stores(*),booker:profiles!appointments_booked_by_fkey(full_name)').order('starts_at'),
      supabase
        .from('consultations')
        .select('*,patients(*)')
        .order('exam_date', { ascending: false }),
      supabase
        .from('prescriptions')
        .select('*,patients(*)')
        .order('exam_date', { ascending: false }),
      supabase.from('crm_contacts').select('*,patients(*),contact_user:profiles!crm_contacts_contacted_by_fkey(full_name)').order('contacted_at', { ascending: false }),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('triage_history').select('*').order('recorded_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    ]);
    if (p.data) setProfile(p.data);
    setCities(c.data || []);
    setStores(s.data || []);
    setPatients(pt.data || []);
    setSchedules(sc.data || []);
    setAppointments(ap.data || []);
    setConsultations(co.data || []);
    setPrescriptions(rx.data || []);
    setContacts(ct.data || []);
    setProfiles(pf.data || []);
    setTriageRecords(tr.data || []);
    setNotifications(nt.data || []);
    setBusy(false);
  }, [userId]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id || null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`notifications:${userId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},payload=>setNotifications(current=>[payload.new as Notification,...current])).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);
  useEffect(() => {
    const syncRoute = () => {
      const route = window.location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
      setViewState(nav.some(([id]) => id === route) ? route : 'dashboard');
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);
  useEffect(() => {
    if (['RECEPCAO','AGENDA'].includes(profile?.role || '') && !(profile?.role === 'AGENDA' ? ['agenda'] : ['agenda', 'pacientes', 'triagem', 'crm']).includes(view))
      setView('agenda');
  }, [profile, view]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool?: (
            tool: unknown,
            options?: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'open_agenda',
          title: 'Abrir Agenda',
          description:
            'Abre a Agenda Essencialy na data solicitada sem divulgar dados de pacientes.',
          inputSchema: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                description: 'Data no formato AAAA-MM-DD',
              },
            },
            required: ['date'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute: (input: unknown) => {
            const date = String((input as { date?: string }).date || '');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
              throw new Error('Data inválida');
            setAgendaDate(date);
            setView('agenda');
            return { opened: true, date };
          },
        },
        { signal: lifecycle.signal },
      ),
    );
    return () => lifecycle.abort();
  }, []);
  if (!isSupabaseConfigured)
    return <p className="p-10">Supabase não configurado.</p>;
  if (!ready) return null;
  if (!userId) return <Auth />;
  const allowed = nav.filter(
    ([id]) => profile?.role === 'ADMIN'
      ? true
      : profile?.role === 'AGENDA'
        ? id === 'agenda'
        : profile?.role === 'RECEPCAO'
        ? ['agenda', 'pacientes', 'triagem', 'crm'].includes(id)
        : !['configuracoes', 'usuarios'].includes(id),
  );
  const props = {
    profile,
    cities,
    stores,
    patients,
    schedules,
    appointments,
    consultations,
    prescriptions,
    contacts,
    profiles,
    triageRecords,
    notifications,
    agendaDate,
    setAgendaDate,
    setView,
    setModal,
    setTarget,
    target,
    load,
    flash,
    clinical,
  };
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[242px_1fr]">
      <aside
        className={`${mobile ? 'fixed' : 'hidden'} lg:flex inset-y-0 left-0 z-50 w-[280px] lg:w-auto bg-[#111111] text-white p-5 flex-col no-print`}
      >
        <div className="flex justify-between p-2">
          <div>
            <b className="text-[#e0c47d] tracking-[.24em]">ESSENCIALY</b>
            <p className="text-xs text-white/40 mt-1">Gestão Optométrica</p>
          </div>
          <button className="lg:hidden" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <nav className="space-y-1 mt-8">
          {allowed.map(([id, label, Icon]) => (
            <a
              key={id}
              href={id === 'dashboard' ? '/dashboard' : `/${id}`}
              onClick={(event) => {
                event.preventDefault();
                setView(id);
                setMobile(false);
              }}
              className={`w-full flex gap-3 p-3 rounded-xl font-bold text-sm ${view === id ? 'bg-white/12 text-[#e3c986]' : 'text-white/60 hover:bg-white/7'}`}
            >
              <Icon size={19} />
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <b className="text-sm">{profile?.full_name || profile?.email}</b>
          <p className="text-xs text-white/40 mt-1">{profile?.role}</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex gap-2 mt-4 text-white/60"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <main className="min-w-0">
        <header className="h-17 bg-white/85 backdrop-blur border-b border-[#ded9cd] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-7 no-print">
          <button className="lg:hidden" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div>
            <p className="text-[10px] tracking-[.2em] text-[#8a918c] font-black">
              ÁREA DE TRABALHO
            </p>
            <h1 className="font-black capitalize">{view}</h1>
          </div>
          <div className="flex items-center gap-2">{notifications.length>0&&<button className="relative btn-secondary" title={notifications[0].message} onClick={async()=>{await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',userId).is('read_at',null);load()}}><Bell size={18}/>{notifications.some(n=>!n.read_at)&&<span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-600"/>}</button>}<button onClick={load} className="btn-secondary">Atualizar</button></div>
        </header>
        <div className="p-4 sm:p-7 max-w-[1500px] mx-auto">
          {busy ? <Spinner /> : <Screen view={view} {...props} />}
        </div>
      </main>
      {notice && (
        <div className="fixed z-[80] right-5 bottom-5 bg-[#111111] text-white rounded-xl px-5 py-3 shadow-xl">
          {notice}
        </div>
      )}
      {modal === 'schedule' && (
        <ScheduleForm {...props} close={() => setModal('')} />
      )}{' '}
      {modal === 'booking' && (
        <BookingForm {...props} item={target} close={() => setModal('')} />
      )}{' '}
      {modal === 'consultation' && (
        <ConsultForm {...props} target={target} close={() => setModal('')} />
      )}
      {modal === 'patient' && <PatientRecord {...props} patient={target} close={() => setModal('')} />}
      {modal === 'direct' && <DirectForm {...props} close={() => setModal('')} />}
      {modal === 'user' && <UserForm {...props} close={() => setModal('')} />}
      {modal === 'password' && <PasswordForm {...props} close={() => setModal('')} />}
      {modal === 'contact' && <ContactForm {...props} target={target} close={() => setModal('')} />}
    </div>
  );
}

function Screen({ view, ...p }: any) {
  if (view === 'dashboard') return <Dashboard {...p} />;
  if (view === 'agenda') return <Agenda {...p} />;
  if (view === 'pacientes') return <Patients {...p} />;
  if (view === 'triagem') return <Triage {...p} />;
  if (view === 'fila') return <Queue {...p} />;
  if (view === 'consulta') return <Consultations {...p} />;
  if (view === 'historico') return <HistoryPage {...p} />;
  if (view === 'crm') return <CRM {...p} />;
  if (view === 'cadastro-direto') return <DirectPage {...p} />;
  if (view === 'usuarios') return <UsersPage {...p} />;
  return <Config {...p} />;
}
