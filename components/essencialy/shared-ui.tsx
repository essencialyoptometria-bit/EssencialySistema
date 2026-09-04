'use client';

import { X } from 'lucide-react';

export function Spinner() {
  return (
    <div className="h-[65vh] grid place-items-center">
      <span className="size-10 rounded-full border-4 border-[#c8a74e]/20 border-t-[#c8a74e] animate-spin" />
    </div>
  );
}
export function Empty({ children }: any) {
  return <p className="text-center text-sm text-[#858d87] py-7">{children}</p>;
}
export function Status({ value }: any) {
  const c = ['CONFIRMADO', 'ATENDIDO'].includes(value)
    ? 'bg-emerald-100 text-emerald-800'
    : ['FALTOSO', 'CANCELADO'].includes(value)
      ? 'bg-red-100 text-red-800'
      : 'bg-amber-100 text-amber-900';
  return <span className={`badge ${c}`}>{value}</span>;
}

// ---- Anamnese / Triagem formatada ----
// Dados de triagem podem vir tanto com as chaves novas (inglês, criadas pelo
// módulo de Triagem atual) quanto com as chaves legadas (português, vindas da
// migração da planilha antiga). Cada grupo abaixo lista os possíveis aliases
// de uma mesma pergunta — o primeiro que existir no registro é usado.
const TRIAGE_GROUPS: { title: string; items: { label: string; keys: string[] }[] }[] = [
  {
    title: 'Queixas principais',
    items: [
      { label: 'Dor de Cabeça', keys: ['headache', 'dorDeCabeca'] },
      { label: 'Baixa AV para Perto', keys: ['near_vision_difficulty', 'avPerto'] },
      { label: 'Baixa AV para Longe', keys: ['far_vision_difficulty', 'avLonge'] },
      { label: 'Tontura / Náusea', keys: ['dizziness', 'tontura'] },
      { label: 'Dor Ocular / Cansaço', keys: ['ocular_pain', 'dorOcular'] },
      { label: 'Fotofobia (Luz)', keys: ['photophobia', 'fotofobia'] },
    ],
  },
  {
    title: 'Saúde do paciente',
    items: [
      { label: 'Diabetes', keys: ['diabetes'] },
      { label: 'Hipertensão (Pressão Alta)', keys: ['hypertension', 'hipertensao'] },
      { label: 'Labirintite', keys: ['labyrinthitis', 'labirintite'] },
      { label: 'Glaucoma', keys: ['glaucoma'] },
      { label: 'Pterígio', keys: ['pterygium', 'pterigio'] },
      { label: 'Cirurgia nos Olhos', keys: ['ocular_surgery', 'cirurgiaNosOlhos'] },
    ],
  },
  {
    title: 'Histórico familiar',
    items: [
      { label: 'Diabetes na Família', keys: ['family_diabetes', 'diabetesFamilia'] },
      { label: 'Hipertensão na Família', keys: ['family_hypertension', 'hipertensaoFamilia'] },
      { label: 'Glaucoma na Família', keys: ['family_glaucoma', 'glaucomaFamilia'] },
    ],
  },
  {
    title: 'Uso de correção',
    items: [
      { label: 'Usa óculos', keys: ['glasses'] },
      { label: 'Usa lentes de contato', keys: ['contacts'] },
    ],
  },
];

const TRIAGE_TEXT_FIELDS: { label: string; keys: string[] }[] = [
  { label: 'Queixa principal', keys: ['complaint'] },
  { label: 'Histórico ocular', keys: ['ocular_history'] },
  { label: 'Sintomas', keys: ['symptoms'] },
  { label: 'Condições relevantes', keys: ['conditions'] },
  { label: 'Medicamentos em uso', keys: ['medications'] },
  { label: 'Observações da triagem', keys: ['notes', 'observacao'] },
];

const TRIAGE_KNOWN_KEYS = new Set(
  [...TRIAGE_GROUPS.flatMap((g) => g.items.flatMap((i) => i.keys)), ...TRIAGE_TEXT_FIELDS.flatMap((i) => i.keys), 'legacyStatus'],
);

function pickField(triage: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    if (triage[k] !== undefined) return triage[k];
  }
  return undefined;
}

function isBooleanish(value: unknown) {
  if (typeof value === 'boolean') return true;
  const s = String(value ?? '').trim().toUpperCase();
  return s === 'TRUE' || s === 'FALSE' || s === 'SIM' || s === 'NAO' || s === 'NÃO';
}

function toBool(value: unknown) {
  if (typeof value === 'boolean') return value;
  const s = String(value ?? '').trim().toUpperCase();
  return s === 'TRUE' || s === 'SIM';
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function BoolPill({ label, value }: { label: string; value: boolean }) {
  return (
    <span
      className={
        'px-2.5 py-1 rounded-full text-xs font-semibold border ' +
        (value
          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
          : 'bg-gray-100 text-gray-400 border-gray-200 opacity-60')
      }
    >
      {label}
    </span>
  );
}

export function TriageSummary({ triage }: { triage?: Record<string, unknown> | null }) {
  const t = triage || {};
  const legacyStatus = t.legacyStatus;
  const leftoverKeys = Object.keys(t).filter(
    (k) => !TRIAGE_KNOWN_KEYS.has(k) && t[k] !== '' && t[k] !== null && t[k] !== undefined,
  );

  if (!Object.keys(t).length) {
    return <Empty>Sem anamnese registrada.</Empty>;
  }

  return (
    <div className="space-y-5 mt-2">
      {legacyStatus !== undefined && legacyStatus !== '' && (
        <span className="badge bg-gray-200 text-gray-700">Status legado: {String(legacyStatus)}</span>
      )}
      {TRIAGE_GROUPS.map((group) => (
        <fieldset key={group.title}>
          <legend className="text-xs font-black uppercase tracking-wide text-[#8a918c] mb-2">
            {group.title}
          </legend>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <BoolPill
                key={item.label}
                label={item.label}
                value={toBool(pickField(t, item.keys))}
              />
            ))}
          </div>
        </fieldset>
      ))}
      <fieldset className="space-y-3">
        <legend className="text-xs font-black uppercase tracking-wide text-[#8a918c] mb-2">
          Informações complementares
        </legend>
        {TRIAGE_TEXT_FIELDS.map((item) => {
          const value = pickField(t, item.keys);
          const text = String(value ?? '').trim();
          if (!text) return null;
          return (
            <div key={item.label}>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">{item.label}</p>
              <p className="bg-[#edf2ef] rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{text}</p>
            </div>
          );
        })}
      </fieldset>
      {leftoverKeys.length > 0 && (
        <fieldset>
          <legend className="text-xs font-black uppercase tracking-wide text-[#8a918c] mb-2">
            Outras informações
          </legend>
          <div className="flex flex-wrap gap-2">
            {leftoverKeys.map((k) =>
              isBooleanish(t[k]) ? (
                <BoolPill key={k} label={humanizeKey(k)} value={toBool(t[k])} />
              ) : (
                <span
                  key={k}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-white text-gray-600 border-gray-200"
                >
                  {humanizeKey(k)}: {String(t[k])}
                </span>
              ),
            )}
          </div>
        </fieldset>
      )}
    </div>
  );
}

export function Modal({ title, close, children, wide = false }: any) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/45 p-3 grid place-items-center">
      <section className={`bg-[#f8f6f1] rounded-2xl w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} max-h-[94vh] overflow-auto`}>
        <header className="sticky top-0 bg-[#f8f6f1]/95 backdrop-blur border-b p-5 flex justify-between z-10">
          <h2 className="font-black text-xl">{title}</h2>
          <button onClick={close}>
            <X />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
