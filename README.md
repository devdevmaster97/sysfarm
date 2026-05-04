# 🌿 SysFarm - Sistema de Gestão para Fazendas de Café

Sistema completo de gestão financeira para fazendas de café, desenvolvido com React, TypeScript, PostgreSQL e pronto para deploy na Vercel.

## 🎨 Design Theme

- **Paleta de Cores**: Tons terrosos de fazenda de café
  - Verde Oliva: `#5A5A40` (farm-green)
  - Marrom Café: `#6f4e37` (farm-coffee)
  - Creme: `#f5f5f0` (farm-cream)
  - Marrom Escuro: `#3d2b1f` (farm-brown)
- **Tipografia**: Cormorant Garamond (serif) + Inter (sans-serif)
- **PWA**: Totalmente configurado para instalação em dispositivos móveis

## 🚀 Tecnologias

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS 4
- **Animações**: Motion (Framer Motion)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Deploy**: Vercel

## 📋 Funcionalidades

- ✅ **Dashboard** com resumo financeiro (entradas, saídas, saldo)
- ✅ **Lançamentos** de caixa (débitos e créditos)
- ✅ **Categorias** de despesas e receitas
- ✅ **Bancos** para controle de contas
- ✅ **Relatórios** financeiros
- ✅ **Sistema de Login** com autenticação
- ✅ **PWA** - Funciona offline e pode ser instalado

## 🛠️ Setup Local

### 1. Clonar o repositório

```bash
git clone https://github.com/devdevmaster97/sysfarm.git
cd sysfarm
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure sua conexão com PostgreSQL:

```env
DATABASE_URL=postgres://usuario:senha@host:5432/sysfarm
NODE_ENV=development
```

### 4. Criar o banco de dados

Execute o script SQL para criar as tabelas:

```bash
psql -U seu_usuario -d sysfarm -f imports/sysfarm.sql
```

Ou importe via ferramenta gráfica (pgAdmin, DBeaver, etc.)

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse: `http://localhost:3000`

**Credenciais padrão:**

- Email: `admin@sysfarm.com`
- Senha: `admin123`

## 🌐 Deploy na Vercel

### 1. Conectar repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe o repositório do GitHub

### 2. Configurar variáveis de ambiente

Na aba "Environment Variables", adicione:

```env
DATABASE_URL = postgres://usuario:senha@host:5432/sysfarm
NODE_ENV = production
```

### 3. Deploy

Clique em "Deploy" e aguarde o build.

A Vercel automaticamente detectará o `vercel.json` e configurará o projeto corretamente.

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **usuarios**: Controle de acesso ao sistema
- **categoria_caixa**: Categorias de lançamentos
- **caixa**: Lançamentos financeiros (débitos e créditos)
- **banco**: Contas bancárias da fazenda

### Relacionamentos

```sql
caixa → categoria_caixa (FK: id_categoria_caixa)
caixa → banco (FK: id_banco)
```

## 🎯 Próximos Passos

- [ ] Implementar CRUD completo de lançamentos
- [ ] Adicionar filtros de data e categoria
- [ ] Gráficos de análise financeira
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Sistema de permissões de usuários
- [ ] Backup automático de dados

## 📱 PWA - Progressive Web App

O sistema pode ser instalado como aplicativo no celular:

1. Acesse pelo navegador mobile
2. Clique em "Adicionar à tela inicial"
3. Use como app nativo!

## 🔒 Segurança

⚠️ **IMPORTANTE**:

- Nunca commite o arquivo `.env` com credenciais reais
- Use senhas fortes em produção
- Configure SSL/TLS no PostgreSQL para produção
- Implemente hash de senhas (bcrypt) antes do deploy final

## 📝 Licença

MIT License - Livre para uso e modificação

## 👨‍💻 Desenvolvido por

William (devdevmaster97)

---

**Versão**: 2.1.0  
**Status**: ✅ Pronto para deploy na Vercel
