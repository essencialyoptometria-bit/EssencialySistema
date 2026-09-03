# Auditoria do frontend Essencialy

O index.html legado foi usado como fonte de verdade para aparência, campos clínicos e fluxos existentes. Agenda e CRM foram preservados como extensões integradas ao Supabase.

| Funcionalidade | No legado | No frontend | Verificação |
|---|---:|---:|---:|
| Login e sessão | Sim | Sim | Tipagem/build |
| Dashboard | Sim | Sim | Tipagem/build |
| Pacientes | Sim | Sim | Tipagem/build |
| Prontuário | Sim | Sim | Tipagem/build |
| Triagem | Sim | Sim, campos restaurados | Tipagem/build |
| Fila | Sim | Sim | Tipagem/build |
| Consulta | Sim | Sim, com retorno | Tipagem/build |
| Prescrição anterior e atual | Sim | Sim | Tipagem/build |
| Teste bicromático | Sim | Sim, restaurado | Tipagem/build |
| Receitas | Sim | Sim | Tipagem/build |
| Declaração | Sim | Sim | Tipagem/build |
| Cadastro direto | Sim | Sim | Tipagem/build |
| Histórico | Sim | Sim | Tipagem/build |
| Agenda | Não | Sim | Tipagem/build |
| CRM | Não | Sim | Tipagem/build |
| Usuários e perfis | Parcial | Sim | Tipagem/build |
| Responsividade | Parcial | Sim | Regras responsivas preservadas |

## Correções desta revisão

- Identidade visual aproximada do modelo original: preto, dourado e fundo cinza.
- Triagem restaurada com queixas, saúde do paciente e histórico familiar.
- Consulta com visualização explícita da prescrição anterior.
- Campos de teste bicromático verde e vermelho restaurados.
- Data de retorno mantida na consulta.
- Prescrição atual escolhida por ordenação explícita da data.
- Timeline do paciente ordenada cronologicamente.
- Agenda e CRM mantidos sem criar cadastro paralelo de pacientes.

## Itens que dependem do ambiente do responsável pelo deploy

- Instalação das dependências.
- Configuração das variáveis públicas do Supabase.
- Teste com credenciais reais de ADMIN, RECEPCAO e OPTOMETRISTA.
- Testes de gravação sujeitos às políticas RLS do projeto de destino.
- Deploy no provedor escolhido.
