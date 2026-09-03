import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request: Request) => {
  const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
  if(request.method==='OPTIONS') return new Response('ok',{headers:cors});
  try{
    const auth=request.headers.get('Authorization'); if(!auth) throw new Error('Usuário não autenticado.');
    const url=Deno.env.get('SUPABASE_URL')!;
    const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
    const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:{user}}=await caller.auth.getUser(); if(!user) throw new Error('Sessão inválida.');
    const {data:profile}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
    if(profile?.role!=='ADMIN'||!profile.active) throw new Error('Somente administradores podem alterar senhas.');
    const {user_id,password}=await request.json();
    if(typeof user_id!=='string'||typeof password!=='string'||password.length<8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
    const {error}=await admin.auth.admin.updateUserById(user_id,{password}); if(error) throw error;
    return Response.json({ok:true},{headers:cors});
  }catch(error){return Response.json({ok:false,error:error instanceof Error?error.message:'Erro inesperado'},{status:400,headers:cors});}
});
