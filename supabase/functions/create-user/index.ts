import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request) => {
  const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
  if(request.method==='OPTIONS') return new Response('ok',{headers:cors});
  try{
    const auth=request.headers.get('Authorization'); if(!auth) throw new Error('Usuário não autenticado.');
    const url=Deno.env.get('SUPABASE_URL')!; const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
    const admin=createClient(url,service);
    const {data:{user}}=await caller.auth.getUser(); if(!user) throw new Error('Sessão inválida.');
    const {data:callerProfile}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
    if(callerProfile?.role!=='ADMIN'||!callerProfile.active) throw new Error('Somente administradores podem criar usuários.');
    const body=await request.json();
    if(!['ADMIN','OPTOMETRISTA','RECEPCAO','AGENDA'].includes(body.role)) throw new Error('Perfil inválido.');
    const {data,error}=await admin.auth.admin.createUser({email:body.email,password:body.password,email_confirm:true,user_metadata:{full_name:body.name}}); if(error) throw error;
    const {error:profileError}=await admin.from('profiles').upsert({id:data.user.id,full_name:body.name,email:body.email,role:body.role,city_id:body.city_id||null,store_id:body.store_id||null,active:true});
    if(profileError){await admin.auth.admin.deleteUser(data.user.id);throw profileError;}
    return Response.json({ok:true},{headers:cors});
  }catch(error){return Response.json({ok:false,error:error instanceof Error?error.message:'Erro inesperado'},{status:400,headers:cors});}
});
