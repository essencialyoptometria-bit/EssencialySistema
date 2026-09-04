import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request) => {
  const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
  if (request.method === 'OPTIONS') return new Response('ok',{headers:cors});
  try {
    const auth = request.headers.get('Authorization');
    if (!auth) throw new Error('Usuário não autenticado.');
    const admin = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const caller = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
    const {data:{user}}=await caller.auth.getUser();
    if(!user) throw new Error('Sessão inválida.');
    const {schedule_id,patient_id,starts_at}=await request.json();
    const [{data:schedule},{data:patient}]=await Promise.all([
      admin.from('schedules').select('professional_id,professional_name').eq('id',schedule_id).single(),
      admin.from('patients').select('full_name').eq('id',patient_id).single(),
    ]);
    if(!schedule?.professional_id) return Response.json({ok:true,emailed:false},{headers:cors});
    const {data:professional}=await admin.from('profiles').select('email,full_name').eq('id',schedule.professional_id).single();
    if(!professional?.email) return Response.json({ok:true,emailed:false},{headers:cors});
    const apiKey=Deno.env.get('RESEND_API_KEY');
    const from=Deno.env.get('NOTIFICATION_FROM_EMAIL');
    if(!apiKey||!from) throw new Error('Configure RESEND_API_KEY e NOTIFICATION_FROM_EMAIL.');
    const when=new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(starts_at));
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[professional.email],subject:'Nova consulta marcada — Essencialy',html:`<h2>Nova consulta marcada</h2><p>Olá, ${professional.full_name}.</p><p><b>${patient?.full_name||'Paciente'}</b> foi agendado(a) para <b>${when}</b>.</p><p>Acesse a agenda da Essencialy para consultar os detalhes.</p>`})});
    if(!response.ok) throw new Error(`Falha no envio: ${await response.text()}`);
    return Response.json({ok:true,emailed:true},{headers:cors});
  } catch(error){return Response.json({ok:false,error:error instanceof Error?error.message:'Erro inesperado'},{status:400,headers:cors});}
});
