import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  BarChart3, 
  PiggyBank, 
  Settings, 
  Plus, 
  Menu,
  X,
  Coffee,
  Calendar,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  LogOut,
  User,
  Lock,
  Pencil,
  Trash2,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_URL } from './config';

// --- Types ---
interface User {
  id_usuario: number;
  nome: string;
  email: string;
}

interface Category {
  id_categoria_caixa: number;
  descricao: string;
}

interface Expense {
  id_caixa: number;
  data_lancamento: string;
  historico: string;
  valor: number;
  natureza: 'D' | 'C';
  id_categoria_caixa: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sysfarm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile closed by default
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<{ id_banco: number; nome: string; numero_agencia: string; numero_conta: string; cidade: string }[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 50;

  // Fetch categories and banks on login
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/categories`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data))
      .catch(() => {});
    fetch(`${API_URL}/api/banks`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setBanks(data))
      .catch(() => {});
  }, [user]);

  // Fetch transactions when expenses tab is active or page changes
  useEffect(() => {
    if (activeTab === 'expenses' && user) {
      fetchTransactions(currentPage);
    }
  }, [activeTab, user, currentPage]);

  // Reset page when leaving expenses tab
  useEffect(() => {
    if (activeTab !== 'expenses') setCurrentPage(1);
  }, [activeTab]);

  const fetchTransactions = async (page = 1) => {
    try {
      const res = await fetch(`${API_URL}/api/transactions?page=${page}&limit=${PAGE_SIZE}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data ?? json);
        setTotalPages(json.totalPages ?? 1);
        setTotalRecords(json.total ?? 0);
      }
    } catch (err) {
      console.error("Erro ao buscar lançamentos.");
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Confirma a exclusão deste lançamento?')) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (res.ok) fetchTransactions(currentPage);
    } catch (err) {
      console.error('Erro ao excluir lançamento.');
    }
  };

  const handleUpdateBank = async (id: number, fields: { nome: string; numero_agencia: string; numero_conta: string; cidade: string }) => {
    try {
      const res = await fetch(`${API_URL}/api/banks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        setBanks(prev => prev.map(b => b.id_banco === id ? { ...b, ...fields } : b));
      }
    } catch (err) {
      console.error('Erro ao atualizar banco.');
    }
  };

  const handleUpdateCategory = async (id: number, descricao: string) => {
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ descricao })
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id_categoria_caixa === id ? { ...c, descricao } : c));
      }
    } catch (err) {
      console.error('Erro ao atualizar categoria.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sysfarm_user');
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={(u) => {
      localStorage.setItem('sysfarm_user', JSON.stringify(u));
      setUser(u);
    }} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'expenses', label: 'Lançamentos', icon: Receipt },
    { id: 'categories', label: 'Categorias', icon: Tags },
    { id: 'banks', label: 'Bancos', icon: PiggyBank },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-farm-cream p-2 rounded-lg">
            <Coffee className="text-farm-green" size={24} />
          </div>
          {(isMobile || isDesktopSidebarOpen) && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-serif text-2xl font-bold tracking-tight text-farm-cream"
            >
              SysFarm
            </motion.h1>
          )}
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-farm-cream">
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (isMobile) setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-farm-cream text-farm-green shadow-lg' 
                : 'hover:bg-farm-cream/10 text-farm-cream/80'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-farm-green' : 'text-farm-cream/70'} />
            {(isMobile || isDesktopSidebarOpen) && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            {(isMobile || isDesktopSidebarOpen) && activeTab === item.id && (
              <motion.div layoutId={isMobile ? "indicator-mob" : "indicator"} className="ml-auto">
                <ChevronRight size={16} />
              </motion.div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-farm-cream/10">
        {(isMobile || isDesktopSidebarOpen) && (
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className="w-8 h-8 rounded-full bg-farm-cream/20 flex items-center justify-center">
              <User size={16} className="text-farm-cream" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-farm-cream">{user.nome}</p>
              <p className="text-[10px] text-farm-cream/50 truncate uppercase tracking-widest">Admin</p>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-rose-500/20 text-rose-300 transition-all"
        >
          <LogOut size={20} />
          {(isMobile || isDesktopSidebarOpen) && <span className="font-medium">Sair</span>}
        </button>

        {!isMobile && (
          <button 
            onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)}
            className="p-2 mt-4 hover:bg-farm-cream/10 rounded-lg w-full flex justify-center text-farm-cream/40"
          >
            {isDesktopSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-farm-cream text-farm-brown overflow-x-hidden">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-farm-green z-50 lg:hidden flex flex-col"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Persistent) */}
      <aside 
        className={`hidden lg:flex flex-col flex-shrink-0 bg-farm-green transition-all duration-300 ${
          isDesktopSidebarOpen ? 'w-[280px]' : 'w-[80px]'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 lg:h-20 border-b border-farm-green/10 flex items-center justify-between px-4 lg:px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 lg:hidden text-farm-green hover:bg-farm-green/5 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl lg:text-2xl font-serif font-semibold truncate max-w-[150px] sm:max-w-none">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setExpenseModalOpen(true)}
              className="bg-farm-green text-farm-cream p-2 lg:px-4 lg:py-2 rounded-xl flex items-center gap-2 hover:bg-farm-coffee transition-colors shadow-md text-sm lg:text-base"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Lançamento</span>
            </button>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'expenses' && (
              <ExpenseList
                expenses={expenses}
                categories={categories}
                onEdit={(exp) => { setEditingExpense(exp); setExpenseModalOpen(true); }}
                onDelete={handleDeleteExpense}
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalRecords}
                onPageChange={setCurrentPage}
              />
            )}
            {activeTab === 'categories' && (
              <CategoryList categories={categories} onUpdate={handleUpdateCategory} />
            )}
            {activeTab === 'banks' && <BankList banks={banks} onUpdate={handleUpdateBank} />}
          </AnimatePresence>
        </div>
      </main>

      {/* Expense Modal */}
      <ExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        categories={categories}
        expense={editingExpense}
        onSave={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
          fetchTransactions(editingExpense ? currentPage : 1);
          if (!editingExpense) setCurrentPage(1);
        }}
      />
    </div>
  );
}

// --- Sub-components ---

const SAVED_EMAIL_KEY = 'sysfarm_saved_email';

function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState(() => localStorage.getItem(SAVED_EMAIL_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
        onLogin(data.user);
      } else {
        setError(data.message || 'Erro ao realizar login.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-farm-cream flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-farm-green/5"
      >
        <div className="bg-farm-green p-10 text-center">
          <div className="w-20 h-20 bg-farm-cream rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner transform -rotate-6">
            <Coffee size={40} className="text-farm-green" />
          </div>
          <h1 className="font-serif text-3xl font-black text-farm-cream tracking-tight">SysFarm</h1>
          <p className="text-farm-cream/60 text-sm mt-2 font-medium italic">Gestão de Fazendas de Café</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100 italic"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-farm-green/40 ml-1">E-mail de Acesso</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-farm-green/30" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-farm-cream/50 border border-farm-green/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-farm-green/20 focus:border-farm-green outline-none transition-all placeholder:text-farm-green/20"
                placeholder="exemplo@sysfarm.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-farm-green/40 ml-1">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-farm-green/30" />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-farm-cream/50 border border-farm-green/10 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-farm-green/20 focus:border-farm-green outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-farm-green/30 hover:text-farm-green transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-farm-green text-farm-cream py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-farm-coffee transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Acessar Sistema'}
          </button>

          <p className="text-center text-[10px] text-farm-green/30 uppercase tracking-[0.2em] font-black mt-8">
            Versão 2.1.0 • PWA Ativado
          </p>
        </form>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState<{ total_creditos: number; total_debitos: number; saldo_liquido: number; total_lancamentos: number } | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [recentError, setRecentError] = useState('');
  const [byCategory, setByCategory] = useState<{ categoria: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

  const formatDate = (d: string) => {
    const p = String(d).split('T')[0].split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : d;
  };

  useEffect(() => {
    setLoading(true);
    setRecentError('');

    const safeJson = async (url: string) => {
      try {
        const r = await fetch(`${API_URL}${url}`, { credentials: 'include' });
        const data = await r.json();
        return data;
      } catch {
        return null;
      }
    };

    Promise.all([
      safeJson('/api/dashboard/summary'),
      safeJson('/api/dashboard/recent'),
      safeJson('/api/dashboard/by-category'),
    ]).then(([s, r, c]) => {
      if (s && !s.status) setSummary(s);
      if (Array.isArray(r)) {
        setRecent(r);
      } else if (r?.status === 'error') {
        setRecentError(r.detail || r.message || 'Erro ao buscar atividade recente.');
      }
      setByCategory(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, []);

  const maxCategoria = byCategory.length > 0 ? Math.max(...byCategory.map(c => c.total)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={`Entradas — ${monthName}`}
          value={loading ? '...' : fmt(summary?.total_creditos ?? 0)}
          icon={ArrowUpCircle}
          color="text-emerald-600"
          trend={`${summary?.total_lancamentos ?? 0} lançamentos no mês`}
        />
        <StatCard
          title={`Saídas — ${monthName}`}
          value={loading ? '...' : fmt(summary?.total_debitos ?? 0)}
          icon={ArrowDownCircle}
          color="text-rose-600"
          trend="Total de despesas"
        />
        <StatCard
          title="Saldo Líquido"
          value={loading ? '...' : fmt(summary?.saldo_liquido ?? 0)}
          icon={Wallet}
          color={(summary?.saldo_liquido ?? 0) >= 0 ? 'text-farm-green' : 'text-rose-600'}
          trend="Entradas menos saídas"
        />
      </div>

      {/* Recent Activity — full width */}
      <div className="bg-white rounded-3xl shadow-sm border border-farm-green/5 overflow-hidden">
        <div className="p-6 border-b border-farm-green/10 flex items-center gap-2">
          <Calendar size={20} className="text-farm-green" />
          <h3 className="text-xl font-serif font-bold">Atividade Recente</h3>
          <span className="ml-auto text-xs text-farm-green/40 font-medium">Últimos 10 lançamentos</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-farm-cream/40 rounded-2xl animate-pulse" />)}
          </div>
          ) : recentError ? (
          <div className="p-6 text-center">
            <p className="text-rose-500 text-sm font-bold">Erro ao carregar lançamentos:</p>
            <p className="text-rose-400 text-xs mt-1 font-mono break-all">{recentError}</p>
          </div>
          ) : recent.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto text-farm-green/20 mb-3" size={40} />
            <p className="text-farm-green/40 text-sm italic">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-farm-cream/50">
                <tr className="text-xs uppercase tracking-widest text-farm-green/50">
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Histórico</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farm-green/5">
                {recent.map((item, i) => (
                  <tr key={i} className="hover:bg-farm-cream/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium whitespace-nowrap text-farm-green/70">{formatDate(item.data_lancamento)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${item.natureza === 'D' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                          {item.natureza === 'D'
                            ? <ArrowDownCircle size={13} className="text-rose-500" />
                            : <ArrowUpCircle size={13} className="text-emerald-500" />
                          }
                        </div>
                        <span className="text-sm font-bold uppercase truncate max-w-[200px]">{item.historico}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-farm-cream text-farm-green rounded-full text-xs font-bold uppercase">
                        {item.categoria_nome ?? '—'}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-black text-sm whitespace-nowrap ${item.natureza === 'D' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {item.natureza === 'D' ? '- ' : '+ '}{fmt(item.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* By Category */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-farm-green/5">
        <h3 className="text-xl font-serif font-bold mb-1">Despesas por Categoria</h3>
        <p className="text-xs text-farm-green/40 mb-5 italic capitalize">{monthName}</p>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-farm-cream/40 rounded-xl animate-pulse" />)}
          </div>
        ) : byCategory.length === 0 ? (
          <p className="text-farm-green/40 text-sm italic text-center py-8">Nenhuma despesa no mês.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {byCategory.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-tight text-farm-brown truncate pr-2">{c.categoria ?? 'Sem categoria'}</span>
                  <span className="text-xs font-black text-rose-600 flex-shrink-0">{fmt(c.total)}</span>
                </div>
                <div className="h-2 bg-farm-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-farm-green rounded-full transition-all"
                    style={{ width: `${Math.round((c.total / maxCategoria) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-farm-green/5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-farm-cream rounded-2xl">
          <Icon className={color} size={24} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-farm-green/40">Geral</span>
      </div>
      <div>
        <h4 className="text-sm font-medium text-farm-green/60 uppercase tracking-wide">{title}</h4>
        <p className="text-3xl font-serif font-black mt-1">{value}</p>
      </div>
      <p className="text-xs font-semibold text-farm-green/40 italic">{trend}</p>
    </div>
  );
}

function ExpenseList({ expenses, categories, onEdit, onDelete, currentPage, totalPages, totalRecords, onPageChange }: {
  expenses: Expense[];
  categories: Category[];
  onEdit: (exp: Expense) => void;
  onDelete: (id: number) => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
}) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const datePart = String(dateStr).split('T')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getCategoryName = (id: number) =>
    categories.find(c => c.id_categoria_caixa === id)?.descricao ?? `Cat. ${id}`;

  const sortedExpenses = [...expenses].sort((a, b) => {
    const da = String(a.data_lancamento).split('T')[0];
    const db = String(b.data_lancamento).split('T')[0];
    return db.localeCompare(da) || (b.id_caixa - a.id_caixa);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-3xl shadow-sm border border-farm-green/5 overflow-hidden"
    >
      {expenses.length === 0 ? (
        <div className="p-12 text-center">
          <Receipt className="mx-auto text-farm-green/20 mb-4" size={48} />
          <p className="text-farm-green/40 font-medium italic">Nenhum lançamento cadastrado ainda.</p>
          <p className="text-farm-green/30 text-sm mt-2">Clique no botão "Lançamento" para adicionar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-farm-cream/50 border-b border-farm-green/10">
              <tr className="text-xs uppercase tracking-widest text-farm-green/60">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Histórico</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-green/5">
              {sortedExpenses.map(expense => (
                <tr key={expense.id_caixa} className="hover:bg-farm-cream/20 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">{formatDate(expense.data_lancamento)}</td>
                  <td className="px-6 py-4 text-sm font-bold group-hover:text-farm-green uppercase">{expense.historico}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-farm-cream text-farm-green rounded-full text-xs font-bold uppercase tracking-tight">
                      {getCategoryName(expense.id_categoria_caixa)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black whitespace-nowrap ${expense.natureza === 'D' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {expense.natureza === 'D' ? '- ' : '+ '}{formatCurrency(expense.valor)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-2 text-farm-green hover:bg-farm-cream rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id_caixa)}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-farm-green/10 bg-farm-cream/30">
          <span className="text-xs text-farm-green/50 font-medium">
            {totalRecords.toLocaleString('pt-BR')} registros · Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs font-bold text-farm-green disabled:opacity-30 hover:bg-farm-cream rounded-lg transition-all"
            >
              «
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs font-bold text-farm-green disabled:opacity-30 hover:bg-farm-cream rounded-lg transition-all"
            >
              ‹ Anterior
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (currentPage <= 3) p = i + 1;
              else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
              else p = currentPage - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                    p === currentPage
                      ? 'bg-farm-green text-farm-cream shadow'
                      : 'text-farm-green hover:bg-farm-cream'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-xs font-bold text-farm-green disabled:opacity-30 hover:bg-farm-cream rounded-lg transition-all"
            >
              Próxima ›
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs font-bold text-farm-green disabled:opacity-30 hover:bg-farm-cream rounded-lg transition-all"
            >
              »
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ExpenseModal({ isOpen, onClose, categories, onSave, expense }: { 
  isOpen: boolean; 
  onClose: () => void; 
  categories: Category[];
  onSave: () => void;
  expense?: Expense | null;
}) {
  const isEditing = !!expense;

  const [formData, setFormData] = useState({
    data_lancamento: new Date().toISOString().split('T')[0],
    historico: '',
    valor: '',
    natureza: 'D' as 'D' | 'C',
    id_categoria_caixa: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setFormData({
        data_lancamento: expense.data_lancamento.split('T')[0],
        historico: expense.historico,
        valor: String(expense.valor),
        natureza: expense.natureza,
        id_categoria_caixa: String(expense.id_categoria_caixa)
      });
    } else {
      setFormData({
        data_lancamento: new Date().toISOString().split('T')[0],
        historico: '',
        valor: '',
        natureza: 'D',
        id_categoria_caixa: ''
      });
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEditing
        ? `${API_URL}/api/transactions/${expense!.id_caixa}`
        : `${API_URL}/api/expenses`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          id_categoria_caixa: parseInt(formData.id_categoria_caixa)
        })
      });

      if (res.ok) {
        onSave();
      } else {
        setError('Erro ao salvar lançamento.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="bg-farm-green p-8 rounded-t-3xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-farm-cream rounded-2xl">
                  <Receipt className="text-farm-green" size={24} />
                </div>
                <h2 className="font-serif text-2xl font-bold text-farm-cream">
                  {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-farm-cream/10 rounded-xl transition-colors text-farm-cream"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-farm-green/80 mb-2 uppercase tracking-wide">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_lancamento}
                  onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none transition-colors font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-farm-green/80 mb-2 uppercase tracking-wide">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, natureza: 'D' })}
                    className={`p-3 rounded-xl font-bold uppercase text-sm transition-all ${
                      formData.natureza === 'D'
                        ? 'bg-rose-500 text-white shadow-lg'
                        : 'bg-farm-cream text-farm-green hover:bg-rose-100'
                    }`}
                  >
                    <ArrowDownCircle size={18} className="inline mr-2" />
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, natureza: 'C' })}
                    className={`p-3 rounded-xl font-bold uppercase text-sm transition-all ${
                      formData.natureza === 'C'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-farm-cream text-farm-green hover:bg-emerald-100'
                    }`}
                  >
                    <ArrowUpCircle size={18} className="inline mr-2" />
                    Receita
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-farm-green/80 mb-2 uppercase tracking-wide">
                Histórico
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Compra de Adubo NPK"
                value={formData.historico}
                onChange={(e) => setFormData({ ...formData, historico: e.target.value })}
                className="w-full px-4 py-3 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none transition-colors font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-farm-green/80 mb-2 uppercase tracking-wide">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none transition-colors font-bold text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-farm-green/80 mb-2 uppercase tracking-wide">
                  Categoria
                </label>
                <select
                  required
                  value={formData.id_categoria_caixa}
                  onChange={(e) => setFormData({ ...formData, id_categoria_caixa: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none transition-colors font-medium"
                >
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat.id_categoria_caixa} value={cat.id_categoria_caixa}>
                      {cat.descricao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-farm-green/20 text-farm-green rounded-xl font-bold hover:bg-farm-cream transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-farm-green text-farm-cream rounded-xl font-bold hover:bg-farm-coffee transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Lançamento'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type BankRow = { id_banco: number; nome: string; numero_agencia: string; numero_conta: string; cidade: string };

function BankList({ banks, onUpdate }: { banks: BankRow[]; onUpdate: (id: number, fields: Omit<BankRow, 'id_banco'>) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: '', numero_agencia: '', numero_conta: '', cidade: '' });

  const startEdit = (b: BankRow) => {
    setEditingId(b.id_banco);
    setForm({ nome: b.nome, numero_agencia: b.numero_agencia || '', numero_conta: b.numero_conta || '', cidade: b.cidade || '' });
  };

  const confirmEdit = (id: number) => {
    if (form.nome.trim()) onUpdate(id, { ...form, nome: form.nome.trim().toUpperCase() });
    setEditingId(null);
  };

  const field = (key: keyof typeof form, placeholder: string) => (
    <input
      value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      onKeyDown={e => { if (e.key === 'Enter') confirmEdit(editingId!); if (e.key === 'Escape') setEditingId(null); }}
      placeholder={placeholder}
      className="w-full px-2 py-1 border-2 border-farm-green/30 rounded-lg text-sm font-medium focus:outline-none focus:border-farm-green"
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-3xl shadow-sm border border-farm-green/5 overflow-hidden"
    >
      {banks.length === 0 ? (
        <div className="p-12 text-center">
          <PiggyBank className="mx-auto text-farm-green/20 mb-4" size={48} />
          <p className="text-farm-green/40 font-medium italic">Nenhum banco cadastrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-farm-cream/50 border-b border-farm-green/10">
              <tr className="text-xs uppercase tracking-widest text-farm-green/60">
                <th className="px-6 py-4">Nome</th>
                <th className="px-4 py-4">Agência</th>
                <th className="px-4 py-4">Conta</th>
                <th className="px-4 py-4">Cidade</th>
                <th className="px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-green/5">
              {banks.map(bank => (
                <tr key={bank.id_banco} className="hover:bg-farm-cream/20 transition-colors group">
                  {editingId === bank.id_banco ? (
                    <>
                      <td className="px-4 py-2">{field('nome', 'Nome')}</td>
                      <td className="px-4 py-2">{field('numero_agencia', 'Agência')}</td>
                      <td className="px-4 py-2">{field('numero_conta', 'Conta')}</td>
                      <td className="px-4 py-2">{field('cidade', 'Cidade')}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => confirmEdit(bank.id_banco)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Salvar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold text-sm uppercase">{bank.nome}</td>
                      <td className="px-4 py-4 text-sm text-farm-green/70">{bank.numero_agencia || '—'}</td>
                      <td className="px-4 py-4 text-sm text-farm-green/70">{bank.numero_conta || '—'}</td>
                      <td className="px-4 py-4 text-sm text-farm-green/70">{bank.cidade || '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => startEdit(bank)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-farm-green hover:bg-farm-cream rounded-lg transition-all"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function CategoryList({ categories, onUpdate }: { categories: Category[]; onUpdate: (id: number, descricao: string) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (cat: Category) => {
    setEditingId(cat.id_categoria_caixa);
    setEditValue(cat.descricao);
  };

  const confirmEdit = (id: number) => {
    if (editValue.trim()) {
      onUpdate(id, editValue.trim().toUpperCase());
    }
    setEditingId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {categories.length > 0 ? (
        categories.map(cat => (
          <div key={cat.id_categoria_caixa} className="bg-white p-5 rounded-2xl shadow-sm border border-farm-green/5 hover:border-farm-green/20 transition-all group">
            {editingId === cat.id_categoria_caixa ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmEdit(cat.id_categoria_caixa); if (e.key === 'Escape') setEditingId(null); }}
                  className="flex-1 px-3 py-2 border-2 border-farm-green rounded-xl text-sm font-bold uppercase focus:outline-none"
                />
                <button onClick={() => confirmEdit(cat.id_categoria_caixa)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm uppercase tracking-tight text-farm-brown leading-snug pr-2">{cat.descricao}</span>
                <button
                  onClick={() => startEdit(cat)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-farm-green hover:bg-farm-cream rounded-xl transition-all flex-shrink-0"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="col-span-full border-2 border-dashed border-farm-green/10 rounded-3xl p-12 text-center">
          <Tags className="mx-auto text-farm-green/20 mb-4" size={48} />
          <p className="text-farm-green/40 font-medium italic">Nenhuma categoria encontrada ou banco desconectado.</p>
        </div>
      )}
    </motion.div>
  );
}
