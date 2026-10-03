# Atualização: nascimento obrigatório, CPF e encerramento de agendas

## Atualização de 03/10/2026 — data de nascimento obrigatória

Na tela de agendamento, a data de nascimento agora é obrigatória para pacientes novos e existentes, inclusive ao editar um agendamento.
Quando já cadastrada, aparece preenchida. Quando ausente, precisa ser informada para continuar.
Datas futuras ou inválidas são recusadas. A data e a idade calculada são salvas no cadastro do paciente antes do agendamento; falhas de permissão impedem que a tela confirme o salvamento.

Esta alteração não exige nova atualização no Supabase.
Se você já publicou o ZIP anterior de CPF e encerramento de agendas, substitua apenas `components/essencialy/modules/agenda.tsx` e atualize `tests/agenda-regression.cjs` e este documento.
Se ainda não publicou, siga as instruções completas abaixo. Este ZIP inclui todas as correções anteriores.

Verificação desta alteração: testes do agendamento e TypeScript aprovados. O build completo não foi repetido; permanece a limitação de acesso ao Google Fonts descrita abaixo.


## O que foi corrigido

- CPF disponível no agendamento para pacientes novos e existentes.
- CPF enviado ao cadastro sem pontos ou traço, com verificação de 11 dígitos quando preenchido.
- Ao selecionar um paciente, seu CPF aparece preenchido. Deixar o campo vazio não apaga um CPF existente.
- Falhas de consulta ou falta de permissão não são mais apresentadas como salvamento bem-sucedido.
- O autor original do agendamento é preservado durante a edição.
- Horários ocupados não aparecem disponíveis ao filtrar pacientes por status.

## Encerrar uma agenda

1. Abra a agenda.
2. Finalize as consultas e registre eventuais faltas ou cancelamentos.
3. Clique em **Concluir e encerrar agenda** e confirme.

Não é possível encerrar uma agenda vazia ou com atendimentos pendentes.
São considerados resolvidos os status ATENDIDO, FALTOSO e CANCELADO.
A agenda encerrada sai da lista padrão de abertas e pode ser vista no filtro **Agendas encerradas** ou **Todas as agendas**.
O histórico permanece preservado. A agenda encerrada não aceita novos agendamentos, edição nem exclusão pela tela.
O encerramento não marca pacientes como atendidos automaticamente.

## Banco de dados

O suporte ao encerramento já foi aplicado e testado em 02/10/2026 no projeto Supabase **Sistema de consultas**.
Não é necessário executar SQL novamente nesse projeto.
O script idempotente `database/encerrar_agendas.sql` está incluído para referência ou instalação em outro banco compatível.
Mantém as políticas de acesso existentes por loja; não amplia as permissões de edição de pacientes.

## Publicar os arquivos

Esta entrega contém o projeto completo, incluindo a alteração anterior de Lensometria.
A base foi conferida com a versão atual disponível no GitHub em 02/10/2026.

Copie para seu clone do repositório:

- `components/essencialy/modules/agenda.tsx`
- `types/essencialy.ts`
- `database/encerrar_agendas.sql`
- `tests/agenda-regression.cjs`
- `ATUALIZACAO-AGENDA.md`

Mantenha sua `.env.local` atual. Não envie chaves ou arquivos `.env.local` ao GitHub.

Na pasta do repositório, execute:

```powershell
npm ci
node tests/agenda-regression.cjs
npm run build
git add components/essencialy/modules/agenda.tsx types/essencialy.ts database/encerrar_agendas.sql tests/agenda-regression.cjs ATUALIZACAO-AGENDA.md
git commit -m "Corrige CPF no agendamento e adiciona encerramento de agendas"
git push origin main
```

Se estiver começando diretamente da pasta deste ZIP, abra o PowerShell na pasta que contém `package.json` e primeiro crie um clone:

```powershell
$pastaZip = (Get-Location).Path
git clone https://github.com/essencialyoptometria-bit/EssencialySistema.git EssencialySistema-github
```

Se o clone concluir com sucesso, copie os arquivos:

```powershell
Copy-Item "$pastaZip\components\essencialy\modules\agenda.tsx" "$pastaZip\EssencialySistema-github\components\essencialy\modules\agenda.tsx"
Copy-Item "$pastaZip\types\essencialy.ts" "$pastaZip\EssencialySistema-github\types\essencialy.ts"
New-Item -ItemType Directory -Force "$pastaZip\EssencialySistema-github\database"
New-Item -ItemType Directory -Force "$pastaZip\EssencialySistema-github\tests"
Copy-Item "$pastaZip\database\encerrar_agendas.sql" "$pastaZip\EssencialySistema-github\database\encerrar_agendas.sql"
Copy-Item "$pastaZip\tests\agenda-regression.cjs" "$pastaZip\EssencialySistema-github\tests\agenda-regression.cjs"
Copy-Item "$pastaZip\ATUALIZACAO-AGENDA.md" "$pastaZip\EssencialySistema-github\ATUALIZACAO-AGENDA.md"
Set-Location "$pastaZip\EssencialySistema-github"
```

Configure sua `.env.local` nesse clone para executar o build, e siga os comandos de instalação, teste, commit e push acima.
Se algum comando falhar, pare e confira a mensagem antes de continuar.

## Verificações feitas

- TypeScript: aprovado.
- Testes dos handlers com dados simulados: CPF novo/existente/vazio/incompleto, falha de permissão, falha de leitura, conflito de CPF, encerramento, histórico e filtro de horários: aprovados.
- Testes no Supabase com registros temporários, em transação revertida: CPF inserido/atualizado, bloqueio com pendências, encerramento após resolução e bloqueio de inclusão/edição/movimentação/exclusão depois do encerramento: aprovados.
- Nenhum paciente real foi alterado nos testes; nenhuma agenda real foi encerrada.
- O build completo neste ambiente foi bloqueado pelo download da fonte Manrope do Google Fonts. O erro não veio de TypeScript. O build deve ser executado no ambiente de deploy com acesso ao Google Fonts.

O frontend ainda precisa ser publicado para os novos campos e botões aparecerem no sistema.
