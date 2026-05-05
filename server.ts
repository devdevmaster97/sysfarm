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
  const PORT = process.env.PORT || 3000;

  // CORS configuration
  app.use(cors({
    origin: ['https://sysfarm.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }));

  // Database Connection Pool
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sysfarm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_HOST?.includes('localhost') ? false : { rejectUnauthorized: false }
  };
  
  console.log('Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    hasPassword: !!dbConfig.password
  });
  
  const pool = new Pool(dbConfig);

  app.use(express.json());

  // --- API Routes ---

  // Login Route
  app.post("/api/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    try {
      console.log('Connecting to database...');
      const result = await pool.query(
        'SELECT id_usuario, nome, email FROM usuarios WHERE email = $1 AND senha = $2 AND ativo = true',
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
      res.status(500).json({ status: "error", message: "Database connection failed" });
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

  // Banks routes
  app.get("/api/banks", async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT * FROM banco ORDER BY nome ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  // Expenses/Transactions routes
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, categoria, natureza } = req.query;
      let query = `
        SELECT c.*, cat.descricao as categoria_nome 
        FROM caixa c
        LEFT JOIN categoria_caixa cat ON c.id_categoria_caixa = cat.id_categoria_caixa
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      if (startDate) {
        query += ` AND c.data_lancamento >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }
      if (endDate) {
        query += ` AND c.data_lancamento <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }
      if (categoria) {
        query += ` AND c.id_categoria_caixa = $${paramCount}`;
        params.push(categoria);
        paramCount++;
      }
      if (natureza) {
        query += ` AND c.natureza = $${paramCount}`;
        params.push(natureza);
        paramCount++;
      }

      query += ' ORDER BY c.data_lancamento DESC, c.id_caixa DESC LIMIT 100';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco } = req.body;
      
      if (!data_lancamento || !historico || !valor || !natureza || !id_categoria_caixa) {
        return res.status(400).json({ status: "error", message: "Campos obrigatórios faltando" });
      }

      const result = await pool.query(
        `INSERT INTO caixa (data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco || null]
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

  // Dashboard summary
  app.get("/api/dashboard/summary", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      let dateFilter = '';
      const params: any[] = [];

      if (startDate && endDate) {
        dateFilter = 'WHERE data_lancamento BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      }

      const result = await pool.query(`
        SELECT 
          SUM(CASE WHEN natureza = 'C' THEN valor ELSE 0 END) as total_creditos,
          SUM(CASE WHEN natureza = 'D' THEN valor ELSE 0 END) as total_debitos,
          SUM(CASE WHEN natureza = 'C' THEN valor ELSE -valor END) as saldo_liquido,
          COUNT(*) as total_lancamentos
        FROM caixa
        ${dateFilter}
      `, params);

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
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
