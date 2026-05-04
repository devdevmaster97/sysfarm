# 🚀 Guia de Deploy - SysFarm

## Deploy na Vercel (Recomendado)

### Pré-requisitos

1. Conta no GitHub
2. Conta na Vercel (gratuita)
3. Banco de dados PostgreSQL (pode usar Neon, Supabase, Railway, etc.)

### Passo a Passo

#### 1. Preparar o Banco de Dados

Escolha um provedor de PostgreSQL:

**Opção A: Neon (Recomendado - Gratuito)**
- Acesse: https://neon.tech
- Crie um novo projeto
- Copie a connection string

**Opção B: Supabase**
- Acesse: https://supabase.com
- Crie um novo projeto
- Vá em Database → Connection String
- Copie a connection string

**Opção C: Railway**
- Acesse: https://railway.app
- Crie um PostgreSQL database
- Copie a connection string

#### 2. Importar o Schema

Execute o arquivo SQL no seu banco:

```bash
psql "sua_connection_string_aqui" -f imports/sysfarm.sql
```

Ou use uma ferramenta gráfica (pgAdmin, DBeaver, TablePlus) para importar o arquivo `imports/sysfarm.sql`.

#### 3. Push para o GitHub

```bash
git add .
git commit -m "Initial commit - SysFarm"
git push origin main
```

#### 4. Deploy na Vercel

1. Acesse https://vercel.com
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente:
   - `DATABASE_URL`: Sua connection string do PostgreSQL
   - `NODE_ENV`: `production`
5. Clique em "Deploy"

#### 5. Verificar Deploy

Após o deploy:
- Acesse a URL fornecida pela Vercel
- Faça login com: `admin@sysfarm.com` / `admin123`
- Teste as funcionalidades

## Configurações Adicionais

### Custom Domain (Opcional)

1. Na Vercel, vá em Settings → Domains
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções

### Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas na Vercel:

```env
DATABASE_URL=postgres://user:password@host:5432/database
NODE_ENV=production
```

### Build Settings

A Vercel detecta automaticamente, mas se precisar configurar manualmente:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Troubleshooting

### Erro: "Database connection failed"

- Verifique se a `DATABASE_URL` está correta
- Confirme que o banco permite conexões externas
- Teste a connection string localmente

### Erro: "Cannot find module"

- Execute `npm install` localmente
- Verifique se todas as dependências estão no `package.json`
- Limpe o cache da Vercel e faça redeploy

### Página em branco após deploy

- Verifique os logs na Vercel Dashboard
- Confirme que o build foi concluído com sucesso
- Teste a rota `/api/health` para verificar o backend

## Monitoramento

### Logs

Acesse os logs em tempo real:
- Vercel Dashboard → Seu Projeto → Logs

### Performance

Monitore o desempenho:
- Vercel Dashboard → Analytics
- Verifique tempo de resposta das APIs
- Monitore uso de recursos

## Backup

### Backup do Banco de Dados

Configure backups automáticos no seu provedor PostgreSQL:

**Neon**: Backups automáticos incluídos
**Supabase**: Configure em Database → Backups
**Railway**: Configure em Database Settings

### Backup Manual

```bash
pg_dump "sua_connection_string" > backup_$(date +%Y%m%d).sql
```

## Atualizações

Para atualizar o sistema após mudanças:

```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

A Vercel fará o deploy automático!

## Segurança

### Checklist de Segurança

- [ ] Alterar senha padrão do admin
- [ ] Usar senhas fortes no banco de dados
- [ ] Habilitar SSL no PostgreSQL
- [ ] Configurar CORS adequadamente
- [ ] Implementar rate limiting (futuro)
- [ ] Adicionar hash de senhas (bcrypt)

### Recomendações

1. **Nunca** commite arquivos `.env` com credenciais reais
2. Use variáveis de ambiente para todas as secrets
3. Mantenha o banco de dados em rede privada quando possível
4. Ative 2FA na Vercel e GitHub

## Suporte

Para problemas ou dúvidas:
- Verifique os logs da Vercel
- Consulte a documentação: https://vercel.com/docs
- Revise o README.md do projeto

---

**Última atualização**: 04/05/2026  
**Versão**: 2.1.0
