import type { Consultation, Patient, Prescription } from '@/types/essencialy';

export const iso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return iso(d);
};
export const br = (v?: string | null) =>
  v
    ? new Intl.DateTimeFormat('pt-BR').format(
        new Date(`${v.slice(0, 10)}T12:00:00`),
      )
    : '—';
<<<<<<< HEAD
export const brDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
};
export const cash = (v: number | string = 0) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const digits = (v = '') => v.replace(/\D/g, '');
export const calculateAge = (birthDate?: string | null) => {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};
export const formatCpf = (value?: string | null) => {
  const number = digits(value || '').slice(0, 11);
  return number
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};
export const formatPhone = (value?: string | null) => {
  const number = digits(value || '').slice(0, 11);
  if (number.length <= 10) return number.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return number.replace(/^(\d{2})(\d)(\d{4})(\d{0,4})$/, '($1) $2 $3-$4');
};
export const googleCalendarContactUrl = (
  patient: Pick<Patient, 'full_name' | 'phone'>,
  scheduledAt?: string | null,
) => {
  if (!scheduledAt) return '#';
  const start = new Date(scheduledAt);
  if (Number.isNaN(start.getTime())) return '#';
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const compact = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Retornar contato · ${patient.full_name}`,
    dates: `${compact(start)}/${compact(end)}`,
    details: `Retorno de contato do paciente ${patient.full_name}. Telefone: ${formatPhone(patient.phone) || '—'}`,
    authuser: 'essencialyoptometria@gmail.com',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
export const signedSphere = (value: unknown) => {
  const sphere = String(value ?? '').trim();
  return /^\d+(?:[.,]\d+)?$/.test(sphere) ? `+ ${sphere}` : sphere;
};
=======
export const cash = (v: number | string = 0) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const digits = (v = '') => v.replace(/\D/g, '');
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
const safe = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char] || char));
const printWindow = (title: string, body: string) => {
  const w = window.open('', '_blank', 'width=820,height=760');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(title)}</title><style>@page{margin:18mm}body{font:16px Arial;color:#171717;line-height:1.55}header{text-align:center;border-bottom:2px solid #c8a74e;padding-bottom:18px;margin-bottom:28px}header h1{letter-spacing:.18em;margin:0;font-size:24px}h2{text-align:center;margin:28px 0}.patient{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f5f5f5;padding:14px;border-radius:8px}.rx{width:100%;border-collapse:collapse;margin-top:22px}.rx th,.rx td{border:1px solid #bbb;padding:12px;text-align:center}.rx th{background:#f1ead7}.signature{margin:95px auto 0;max-width:360px;text-align:center;border-top:1px solid #222;padding-top:8px}.blank{display:inline-block;min-width:90px;border-bottom:1px solid #333}.muted{color:#555}</style></head><body>${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
};
<<<<<<< HEAD
const patientBlock = (patient: Patient) => `<div class="patient"><div><b>Paciente:</b> ${safe(patient.full_name)}</div><div><b>CPF:</b> ${safe(formatCpf(patient.cpf) || '—')}</div><div><b>Telefone:</b> ${safe(formatPhone(patient.phone) || '—')}</div><div><b>Idade:</b> ${safe(calculateAge(patient.birth_date) ?? '—')} anos</div></div>`;
=======
const patientBlock = (patient: Patient) => `<div class="patient"><div><b>Paciente:</b> ${safe(patient.full_name)}</div><div><b>CPF:</b> ${safe(patient.cpf || '—')}</div><div><b>Telefone:</b> ${safe(patient.phone || '—')}</div><div><b>Nascimento:</b> ${safe(br(patient.birth_date))}</div></div>`;
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
export const printPrescription = (patient: Patient, rx: Pick<Prescription, 'data'|'exam_date'|'pupillary_distance'|'notes'>) => {
  const d: any = rx.data || {};
  printWindow('Receita optométrica', `<header><h1>ESSENCIALY</h1><div>Clínica de Optometria</div></header><h2>Receita optométrica</h2>${patientBlock(patient)}<table class="rx"><thead><tr><th>Olho</th><th>Esférico</th><th>Cilíndrico</th><th>Eixo</th></tr></thead><tbody><tr><th>OD</th><td>${safe(d.od_spherical)}</td><td>${safe(d.od_cylindrical)}</td><td>${safe(d.od_axis)}</td></tr><tr><th>OE</th><td>${safe(d.oe_spherical)}</td><td>${safe(d.oe_cylindrical)}</td><td>${safe(d.oe_axis)}</td></tr></tbody></table><p><b>Adição:</b> ${safe(d.addition || '—')} &nbsp; <b>DP:</b> ${safe(rx.pupillary_distance || '—')}</p>${rx.notes ? `<p><b>Observações:</b> ${safe(rx.notes)}</p>` : ''}<p class="muted">Data do exame: ${safe(br(rx.exam_date))}</p><div class="signature">Carimbo e assinatura do optometrista</div>`);
};
export const printDeclaration = (patientOrConsultation: Patient | Consultation, examDate?: string) => {
  const consultation = 'patient_id' in patientOrConsultation ? patientOrConsultation as Consultation : null;
  const patient = (consultation?.patients || patientOrConsultation) as Patient;
  const date = examDate || consultation?.exam_date || iso();
<<<<<<< HEAD
  printWindow('Declaração de comparecimento', `<header><h1>ESSENCIALY</h1><div>Clínica de Optometria</div></header><h2>DECLARAÇÃO DE COMPARECIMENTO</h2><p>Declaramos, para os devidos fins, que <b>${safe(patient.full_name)}</b>, portador(a) do CPF <b>${safe(formatCpf(patient.cpf) || '________________')}</b>, compareceu à Clínica Essencialy para realizar exame de vista no dia <b>${safe(br(date))}</b>, no horário das <span class="blank">&nbsp;</span> às <span class="blank">&nbsp;</span>.</p><div class="signature">Carimbo e assinatura do optometrista</div>`);
=======
  printWindow('Declaração de comparecimento', `<header><h1>ESSENCIALY</h1><div>Clínica de Optometria</div></header><h2>DECLARAÇÃO DE COMPARECIMENTO</h2><p>Declaramos, para os devidos fins, que <b>${safe(patient.full_name)}</b>, portador(a) do CPF <b>${safe(patient.cpf || '________________')}</b>, compareceu à Clínica Essencialy para realizar exame de vista no dia <b>${safe(br(date))}</b>, no horário das <span class="blank">&nbsp;</span> às <span class="blank">&nbsp;</span>.</p><div class="signature">Carimbo e assinatura do optometrista</div>`);
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
};
