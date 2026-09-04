-- As políticas RLS existentes chamam helpers de autorização no schema private.
-- USAGE permite resolver os nomes das funções, mas não expõe tabelas ou dados.
grant usage on schema private to authenticated;

