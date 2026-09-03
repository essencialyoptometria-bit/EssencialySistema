# Essencialy — frontend

Frontend modular do sistema Essencialy conectado ao Supabase existente.

## Instalação manual

1. Copie .env.example para .env.local.
2. Preencha a URL e a chave pública do projeto Supabase.
3. Execute npm install.
4. Execute npm run dev durante o desenvolvimento.
5. Execute npm run build antes do deploy.

## Atualização do Supabase

1. Execute a migração em `supabase/migrations/20260903010000_unified_patient_records_and_notifications.sql`.
2. Publique as funções `create-user` e `notify-appointment` da pasta `supabase/functions`.
3. Na função `notify-appointment`, configure os segredos `RESEND_API_KEY` e `NOTIFICATION_FROM_EMAIL`.
4. Ative o Realtime para a tabela `notifications` caso o projeto ainda não publique essa tabela.

O perfil `AGENDA` enxerga somente a agenda no frontend. As políticas RLS do projeto devem manter esse perfil sem acesso a consultas, prescrições e anamneses.

Nunca coloque a chave service_role no frontend.

## Estrutura

- app/: rotas independentes.
- components/essencialy/app.tsx: autenticação, sessão, layout e carregamento compartilhado.
- components/essencialy/modules/: módulos de negócio.
- components/essencialy/shared-ui.tsx: componentes visuais compartilhados.
- lib/supabase.ts: cliente único do Supabase.
- lib/essencialy-utils.ts: datas, valores e impressão.
- types/essencialy.ts: tipos do banco utilizados pelo frontend.

## Módulos

- Dashboard
- Agenda e agendamentos
- Pacientes e prontuário
- Triagem/anamnese
- Fila de atendimento
- Consulta, prescrição e retorno
- Histórico
- CRM
- Cadastro direto
- Usuários
- Configurações

O projeto usa Vinext, que é executado sobre Vite. Essa estrutura foi preservada para não quebrar o frontend funcional nem o deploy existente.
