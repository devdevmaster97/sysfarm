import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // CORS configuration
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Database Connection Pool
  // Use DATABASE_URL from Railway or fallback to individual variables
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // supabase exige ssl true para conexão externa
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS saldo_bancario (
      id_saldo BIGSERIAL PRIMARY KEY,
      data_referencia DATE NOT NULL UNIQUE,
      saldo NUMERIC(15, 2) NOT NULL,
      id_usuario INTEGER,
      registro_unico BOOLEAN NOT NULL DEFAULT TRUE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE saldo_bancario
      ADD COLUMN IF NOT EXISTS registro_unico BOOLEAN NOT NULL DEFAULT TRUE
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_saldo_bancario_registro_unico
      ON saldo_bancario (registro_unico)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_saldo_bancario_data
      ON saldo_bancario (data_referencia DESC)
  `);

  const isIsoDate = (value: unknown) =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''));

  const previousIsoDate = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  };

  const monthEndIsoDate = (value: unknown) => {
    const match = String(value ?? '').match(/^(\d{4})-(\d{2})/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isInteger(year) || month < 1 || month > 12) return null;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  const getBankBalanceAtDate = async (targetDate: string) => {
    const result = await pool.query(`
      WITH referencia AS (
        SELECT data_referencia, saldo
        FROM saldo_bancario
        WHERE registro_unico = TRUE
        ORDER BY id_saldo ASC
        LIMIT 1
      ),
      ajuste AS (
        SELECT COALESCE(SUM(
          CASE
            WHEN r.data_referencia <= $1::date THEN
              CASE WHEN UPPER(TRIM(c.natureza)) = 'C' THEN c.valor ELSE -c.valor END
            ELSE
              CASE WHEN UPPER(TRIM(c.natureza)) = 'C' THEN -c.valor ELSE c.valor END
          END
        ), 0) AS valor
        FROM referencia r
        LEFT JOIN caixa c ON c.id_banco IS NOT NULL AND (
          (
            r.data_referencia <= $1::date
            AND c.data_lancamento > r.data_referencia
            AND c.data_lancamento <= $1::date
          )
          OR
          (
            r.data_referencia > $1::date
            AND c.data_lancamento > $1::date
            AND c.data_lancamento <= r.data_referencia
          )
        )
      )
      SELECT
        r.data_referencia,
        r.saldo AS saldo_referencia,
        (r.saldo + a.valor) AS saldo
      FROM referencia r
      CROSS JOIN ajuste a
    `, [targetDate]);

    if (result.rows.length === 0) {
      return { configured: false, saldo: 0, dataReferencia: null, saldoReferencia: 0 };
    }

    const row = result.rows[0];
    return {
      configured: true,
      saldo: parseFloat(row.saldo),
      dataReferencia: String(row.data_referencia).split('T')[0],
      saldoReferencia: parseFloat(row.saldo_referencia)
    };
  };
  
  const connSource = process.env.DATABASE_PUBLIC_URL ? 'DATABASE_PUBLIC_URL' : process.env.DATABASE_URL ? 'DATABASE_URL' : 'NONE';
  console.log('Database source:', connSource);
  console.log('Connection host:', connectionString ? connectionString.replace(/:([^:@]+)@/, ':***@') : 'NOT SET');

  app.use(express.json());

  // --- API Routes ---

  // Login Route
  app.post("/api/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    try {
      console.log('Connecting to database...');
      const result = await pool.query(
        `SELECT id_usuario, nome, email,
                COALESCE(perfil, 'admin') as perfil
         FROM usuarios WHERE email = $1 AND senha = $2 AND ativo = true`,
        [email, password]
      );
      console.log('Query executed, rows found:', result.rows.length);

      if (result.rows.length > 0) {
        console.log('Login successful for:', email);
        res.json({ success: true, user: result.rows[0] });
      } else {
        console.log('Invalid credentials for:', email);
        res.status(401).json({ success: false, message: "Credenciais inválidas ou usuário inativo." });
      }
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: "Erro no servidor ao tentar logar.", error: String(err) });
    }
  });

  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ status: "ok", db_time: result.rows[0].now });
    } catch (err) {
      res.status(500).json({ status: "error", message: "Database connection failed", detail: String(err) });
    }
  });

  app.get("/api/ip", async (req: Request, res: Response) => {
    try {
      // Get public IP by querying an external service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      res.json({ ip: data.ip, headers: req.headers });
    } catch (err) {
      res.status(500).json({ error: "Failed to get IP" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT * FROM categoria_caixa ORDER BY descricao ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const { descricao } = req.body;
      if (!descricao) return res.status(400).json({ status: "error", message: "Descrição obrigatória" });
      const result = await pool.query(
        'INSERT INTO categoria_caixa (descricao) VALUES ($1) RETURNING *',
        [descricao]
      );
      res.status(201).json({ status: "success", data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { descricao } = req.body;
      if (!descricao) return res.status(400).json({ status: "error", message: "Descrição obrigatória" });
      const result = await pool.query(
        'UPDATE categoria_caixa SET descricao = $1 WHERE id_categoria_caixa = $2 RETURNING *',
        [descricao, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ status: "error", message: "Categoria não encontrada" });
      res.json({ status: "success", data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  // Banks routes
  app.get("/api/banks", async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT * FROM banco ORDER BY nome ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/banks/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nome, numero_agencia, numero_conta, cidade } = req.body;
      if (!nome) return res.status(400).json({ status: "error", message: "Nome obrigatório" });
      const result = await pool.query(
        `UPDATE banco SET nome = $1, numero_agencia = $2, numero_conta = $3, cidade = $4
         WHERE id_banco = $5 RETURNING *`,
        [nome, numero_agencia || '', numero_conta || '', cidade || '', id]
      );
      if (result.rows.length === 0) return res.status(404).json({ status: "error", message: "Banco não encontrado" });
      res.json({ status: "success", data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  // Saldo consolidado informado (soma de todas as contas bancárias)
  app.get("/api/bank-balance", async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const current = await getBankBalanceAtDate(today);
      res.json({ ...current, dataSaldo: today });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/bank-balance", async (req: Request, res: Response) => {
    try {
      const { data_referencia, saldo, id_usuario } = req.body;
      const saldoNumber = Number(saldo);
      if (!isIsoDate(data_referencia) || !Number.isFinite(saldoNumber)) {
        return res.status(400).json({
          status: "error",
          message: "Informe uma data de referência e um saldo válidos."
        });
      }

      const result = await pool.query(`
        INSERT INTO saldo_bancario (data_referencia, saldo, id_usuario, registro_unico)
        VALUES ($1, $2, $3, TRUE)
        ON CONFLICT (registro_unico) DO UPDATE SET
          data_referencia = EXCLUDED.data_referencia,
          saldo = EXCLUDED.saldo,
          id_usuario = EXCLUDED.id_usuario,
          atualizado_em = NOW()
        RETURNING *
      `, [data_referencia, saldoNumber, id_usuario || null]);

      res.status(201).json({ status: "success", data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  // Expenses/Transactions routes
  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const { data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco, id_usuario } = req.body;

      const colCheck = await pool.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='caixa' AND column_name='id_usuario'
      `);
      const hasUsuario = colCheck.rowCount > 0;

      const result = await pool.query(
        hasUsuario
          ? `INSERT INTO caixa (data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco, id_usuario)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`
          : `INSERT INTO caixa (data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        hasUsuario
          ? [data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco || null, id_usuario || null]
          : [data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco || null]
      );

      res.json({ success: true, expense: result.rows[0] });
    } catch (err) {
      console.error('Error saving expense:', err);
      res.status(500).json({ success: false, message: "Erro ao salvar lançamento.", error: String(err) });
    }
  });

  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, categoria, natureza, page, limit, historico, banco, valor, usuario } = req.query;
      const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
      const limitNum = Math.min(200, Math.max(1, parseInt(String(limit || '50'), 10)));
      const offset = (pageNum - 1) * limitNum;

      // Verifica se a coluna id_usuario existe na tabela caixa
      const colCheck = await pool.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='caixa' AND column_name='id_usuario'
      `);
      const hasUsuario = colCheck.rowCount > 0;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      const startDateValue = startDate ? String(startDate) : '';
      const endDateValue = endDate ? String(endDate) : '';
      if (startDateValue && !isIsoDate(startDateValue)) {
        return res.status(400).json({ status: "error", message: "Data inicial inválida." });
      }
      if (endDateValue && !isIsoDate(endDateValue)) {
        return res.status(400).json({ status: "error", message: "Data final inválida." });
      }
      if (startDateValue && endDateValue && startDateValue > endDateValue) {
        return res.status(400).json({
          status: "error",
          message: "A data inicial não pode ser posterior à data final."
        });
      }

      if (startDateValue) {
        whereClause += ` AND c.data_lancamento::date >= $${paramCount++}::date`;
        params.push(startDateValue);
      }
      if (endDateValue) {
        whereClause += ` AND c.data_lancamento::date <= $${paramCount++}::date`;
        params.push(endDateValue);
      }
      if (categoria) { whereClause += ` AND c.id_categoria_caixa = $${paramCount++}`; params.push(categoria); }
      if (natureza)  { whereClause += ` AND c.natureza = $${paramCount++}`; params.push(natureza); }
      if (historico) { whereClause += ` AND c.historico ILIKE $${paramCount++}`; params.push(`%${historico}%`); }
      if (banco)     { whereClause += ` AND c.id_banco = $${paramCount++}`; params.push(banco); }
      if (valor) {
        const valorNum = parseFloat(String(valor).replace(',', '.'));
        if (!isNaN(valorNum)) { whereClause += ` AND c.valor = $${paramCount++}`; params.push(valorNum); }
      }
      if (usuario && hasUsuario) {
        whereClause += ` AND c.id_usuario IN (SELECT id_usuario FROM usuarios WHERE nome ILIKE $${paramCount++})`;
        params.push(`%${usuario}%`);
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM caixa c ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const dataResult = await pool.query(
        `SELECT c.*, cat.descricao as categoria_nome,
                NOT EXISTS (
                  SELECT 1
                  FROM caixa month_row
                  WHERE month_row.data_lancamento >= date_trunc('month', c.data_lancamento)
                    AND month_row.data_lancamento < date_trunc('month', c.data_lancamento) + INTERVAL '1 month'
                    AND (
                      month_row.data_lancamento < c.data_lancamento
                      OR (
                        month_row.data_lancamento = c.data_lancamento
                        AND month_row.id_caixa < c.id_caixa
                      )
                    )
                ) AS encerra_mes
                ${hasUsuario ? ', u.nome as usuario_nome' : ", '' as usuario_nome"}
         FROM caixa c
         LEFT JOIN categoria_caixa cat ON c.id_categoria_caixa = cat.id_categoria_caixa
         ${hasUsuario ? 'LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario' : ''}
         ${whereClause}
         ORDER BY c.data_lancamento DESC, c.id_caixa DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, limitNum, offset]
      );

      const today = new Date().toISOString().slice(0, 10);
      const monthEndDates = Array.from(new Set(
        dataResult.rows
          .filter((row: any) => row.encerra_mes)
          .map((row: any) => monthEndIsoDate(row.data_lancamento))
          .filter((date): date is string => !!date && date <= today)
      ));
      const balances = new Map<string, Awaited<ReturnType<typeof getBankBalanceAtDate>>>();
      await Promise.all(monthEndDates.map(async date => {
        balances.set(date, await getBankBalanceAtDate(date));
      }));
      const rows = dataResult.rows.map((row: any) => {
        if (!row.encerra_mes) return row;
        const date = monthEndIsoDate(row.data_lancamento);
        if (!date || date > today) return { ...row, encerra_mes: false };
        const balance = balances.get(date);
        return {
          ...row,
          data_saldo_mes: date,
          saldo_fim_mes: balance?.saldo ?? null,
          saldo_configurado: balance?.configured ?? false
        };
      });

      res.json({
        data: rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum
      });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco, id_usuario } = req.body;
      
      if (!data_lancamento || !historico || !valor || !natureza || !id_categoria_caixa) {
        return res.status(400).json({ status: "error", message: "Campos obrigatórios faltando" });
      }

      const result = await pool.query(
        `INSERT INTO caixa (data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco, id_usuario) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco || null, id_usuario || null]
      );

      res.status(201).json({ status: "success", data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco } = req.body;

      const result = await pool.query(
        `UPDATE caixa 
         SET data_lancamento = $1, historico = $2, valor = $3, natureza = $4, 
             id_categoria_caixa = $5, id_banco = $6
         WHERE id_caixa = $7 RETURNING *`,
        [data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco || null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ status: "error", message: "Lançamento não encontrado" });
      }

      res.json({ status: "success", data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM caixa WHERE id_caixa = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ status: "error", message: "Lançamento não encontrado" });
      }

      res.json({ status: "success", message: "Lançamento excluído com sucesso" });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  // Dashboard summary — defaults to current month
  app.get("/api/dashboard/summary", async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const lastDay = new Date(y, m, 0).getDate();
      const startDate = req.query.startDate as string || `${y}-${String(m).padStart(2, '0')}-01`;
      const endDate   = req.query.endDate   as string || `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const result = await pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN UPPER(TRIM(natureza)) = 'C' THEN valor ELSE 0 END), 0) as total_creditos,
          COALESCE(SUM(CASE WHEN UPPER(TRIM(natureza)) = 'D' THEN valor ELSE 0 END), 0) as total_debitos,
          COALESCE(SUM(CASE WHEN UPPER(TRIM(natureza)) = 'C' THEN valor ELSE -valor END), 0) as saldo_liquido,
          COUNT(*) as total_lancamentos
        FROM caixa
        WHERE data_lancamento BETWEEN $1 AND $2
      `, [startDate, endDate]);

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  // Dashboard recent transactions
  app.get("/api/dashboard/recent", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT c.data_lancamento, c.historico, c.valor, c.natureza,
               cat.descricao as categoria_nome
        FROM caixa c
        LEFT JOIN categoria_caixa cat ON c.id_categoria_caixa = cat.id_categoria_caixa
        ORDER BY c.data_lancamento DESC
        LIMIT 10
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error", detail: String(err) });
    }
  });

  // Dashboard expenses by category — current month
  app.get("/api/dashboard/by-category", async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const lastDay = new Date(y, m, 0).getDate();
      const startDate = req.query.startDate as string || `${y}-${String(m).padStart(2, '0')}-01`;
      const endDate   = req.query.endDate   as string || `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const result = await pool.query(`
        SELECT
          cat.descricao as categoria,
          COALESCE(SUM(c.valor), 0) as total
        FROM caixa c
        LEFT JOIN categoria_caixa cat ON c.id_categoria_caixa = cat.id_categoria_caixa
        WHERE UPPER(TRIM(c.natureza)) = 'D'
          AND c.data_lancamento BETWEEN $1 AND $2
        GROUP BY cat.descricao
        ORDER BY total DESC
        LIMIT 10
      `, [startDate, endDate]);

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error", detail: String(err) });
    }
  });

  // Fechamento do Caixa — saldo acumulado por banco até a data informada
  app.get("/api/reports/fechamento-caixa", async (req: Request, res: Response) => {
    try {
      const dataFim = req.query.dataFim as string || new Date().toISOString().split('T')[0];

      const result = await pool.query(`
        SELECT
          b.id_banco,
          b.nome,
          b.numero_agencia,
          b.numero_conta,
          COALESCE(SUM(
            CASE WHEN UPPER(TRIM(c.natureza)) = 'C' THEN c.valor
                 WHEN UPPER(TRIM(c.natureza)) = 'D' THEN -c.valor
                 ELSE 0 END
          ), 0) AS saldo
        FROM banco b
        LEFT JOIN caixa c
          ON c.id_banco = b.id_banco
          AND c.data_lancamento <= $1
        GROUP BY b.id_banco, b.nome, b.numero_agencia, b.numero_conta
        ORDER BY b.id_banco ASC
      `, [dataFim]);

      const total = result.rows.reduce((acc: number, r: any) => acc + parseFloat(r.saldo), 0);
      res.json({ rows: result.rows, total, dataFim });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error", detail: String(err) });
    }
  });

  // Movimentos por Período
  app.get("/api/reports/movimentos-periodo", async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim } = req.query;
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ status: "error", message: "dataInicio e dataFim são obrigatórios" });
      }
      const result = await pool.query(`
        SELECT
          c.id_caixa,
          c.data_lancamento,
          UPPER(TRIM(c.natureza)) AS natureza,
          c.historico,
          c.valor,
          COALESCE(cat.descricao, 'Sem categoria') AS categoria,
          c.id_banco
        FROM caixa c
        LEFT JOIN categoria_caixa cat ON c.id_categoria_caixa = cat.id_categoria_caixa
        WHERE c.data_lancamento BETWEEN $1 AND $2
        ORDER BY c.data_lancamento ASC, c.id_caixa ASC
      `, [dataInicio, dataFim]);

      res.json({ rows: result.rows, dataInicio, dataFim });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error", detail: String(err) });
    }
  });

  // Extrato consolidado — saldo de abertura + saldo após cada movimentação
  app.get("/api/reports/extrato-bancario", async (req: Request, res: Response) => {
    try {
      const dataInicio = String(req.query.dataInicio || '');
      const dataFim = String(req.query.dataFim || '');
      if (!isIsoDate(dataInicio) || !isIsoDate(dataFim)) {
        return res.status(400).json({
          status: "error",
          message: "dataInicio e dataFim são obrigatórios."
        });
      }
      if (dataInicio > dataFim) {
        return res.status(400).json({
          status: "error",
          message: "A data inicial não pode ser posterior à data final."
        });
      }

      const openingDate = previousIsoDate(dataInicio);
      const opening = await getBankBalanceAtDate(openingDate);
      if (!opening.configured) {
        return res.status(400).json({
          status: "error",
          message: "Cadastre o saldo bancário atual em Configurações antes de gerar o extrato."
        });
      }

      const result = await pool.query(`
        SELECT
          c.id_caixa,
          c.data_lancamento,
          UPPER(TRIM(c.natureza)) AS natureza,
          c.historico,
          c.valor,
          COALESCE(cat.descricao, 'Sem categoria') AS categoria,
          c.id_banco,
          COALESCE(b.nome, 'Sem banco') AS banco_nome
        FROM caixa c
        LEFT JOIN categoria_caixa cat ON c.id_categoria_caixa = cat.id_categoria_caixa
        LEFT JOIN banco b ON c.id_banco = b.id_banco
        WHERE c.id_banco IS NOT NULL
          AND c.data_lancamento BETWEEN $1 AND $2
        ORDER BY c.data_lancamento ASC, c.id_caixa ASC
      `, [dataInicio, dataFim]);

      let saldo = opening.saldo;
      let totalCreditos = 0;
      let totalDebitos = 0;
      const rows = result.rows.map((row: any) => {
        const value = parseFloat(row.valor);
        if (row.natureza === 'C') {
          saldo += value;
          totalCreditos += value;
        } else {
          saldo -= value;
          totalDebitos += value;
        }
        return { ...row, saldo_acumulado: saldo };
      });

      res.json({
        dataInicio,
        dataFim,
        dataSaldoInicial: openingDate,
        saldoInicial: opening.saldo,
        saldoFinal: saldo,
        totalCreditos,
        totalDebitos,
        rows
      });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error", detail: String(err) });
    }
  });

  // Movimentos por Categoria
  app.get("/api/reports/movimentos-categoria", async (req: Request, res: Response) => {
    try {
      const { dataInicio, dataFim, categoriaId } = req.query;
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ status: "error", message: "dataInicio e dataFim são obrigatórios" });
      }
      const params: any[] = [dataInicio, dataFim];
      let catFilter = '';
      if (categoriaId) {
        catFilter = ' AND c.id_categoria_caixa = $3';
        params.push(categoriaId);
      }
      const result = await pool.query(`
        SELECT
          COALESCE(cat.descricao, 'Sem categoria') AS categoria,
          cat.id_categoria_caixa,
          c.data_lancamento,
          UPPER(TRIM(c.natureza)) AS natureza,
          c.historico,
          c.valor,
          c.id_banco
        FROM caixa c
        LEFT JOIN categoria_caixa cat ON c.id_categoria_caixa = cat.id_categoria_caixa
        WHERE c.data_lancamento BETWEEN $1 AND $2${catFilter}
        ORDER BY cat.descricao ASC, c.data_lancamento ASC, c.id_caixa ASC
      `, params);

      res.json({ rows: result.rows, dataInicio, dataFim });
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error", detail: String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`PWA Ready at http://localhost:${PORT}`);
  });
}

startServer();
