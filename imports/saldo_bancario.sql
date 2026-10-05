-- Saldo bancário consolidado (soma das contas).
-- A aplicação também cria esta estrutura automaticamente ao iniciar.

CREATE TABLE IF NOT EXISTS saldo_bancario (
  id_saldo BIGSERIAL PRIMARY KEY,
  data_referencia DATE NOT NULL UNIQUE,
  saldo NUMERIC(15, 2) NOT NULL,
  id_usuario INTEGER,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saldo_bancario_data
  ON saldo_bancario (data_referencia DESC);
