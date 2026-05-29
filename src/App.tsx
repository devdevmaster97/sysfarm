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
  EyeOff,
  Download,
  Share,
  Printer,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_URL } from './config';

// --- Types ---
interface User {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'readonly';
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

const PWA_DISMISSED_KEY = 'sysfarm_pwa_dismissed';

function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [browser, setBrowser] = useState<'ios' | 'samsung' | 'chrome' | 'other'>('other');

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem(PWA_DISMISSED_KEY)) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const samsung = /SamsungBrowser/i.test(ua);

    if (ios) setBrowser('ios');
    else if (samsung) setBrowser('samsung');
    else setBrowser('chrome');

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setBrowser('chrome');
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    const timer = setTimeout(() => setShow(true), 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    dismiss();
  };

  const dismiss = () => {
    localStorage.setItem(PWA_DISMISSED_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  const instructions: Record<string, React.ReactNode> = {
    ios: (
      <p className="text-farm-cream/80 text-xs mt-1 leading-relaxed">
        No Safari, toque em <Share size={11} className="inline mx-0.5 mb-0.5" /> e depois <strong>"Adicionar à Tela de Início"</strong>.
      </p>
    ),
    samsung: (
      <p className="text-farm-cream/80 text-xs mt-1 leading-relaxed">
        Toque no menu <strong>⋮</strong> do Samsung Internet e selecione <strong>"Adicionar página à Tela inicial"</strong>.
      </p>
    ),
    chrome: deferredPrompt ? null : (
      <p className="text-farm-cream/80 text-xs mt-1 leading-relaxed">
        Toque no menu <strong>⋮</strong> do Chrome e selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong>.
      </p>
    ),
    other: (
      <p className="text-farm-cream/80 text-xs mt-1 leading-relaxed">
        Use o menu do navegador e selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
      </p>
    ),
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-[100] max-w-sm mx-auto"
      >
        <div className="bg-farm-green text-farm-cream rounded-2xl shadow-2xl p-4 flex gap-3 items-start border border-farm-cream/10">
          <div className="bg-farm-cream/20 p-2 rounded-xl flex-shrink-0 mt-0.5">
            <Coffee size={20} className="text-farm-cream" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Instalar SysFarm</p>
            {instructions[browser]}
            {browser === 'chrome' && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="mt-2 flex items-center gap-1.5 bg-farm-cream text-farm-green px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-farm-cream/90 transition-colors"
              >
                <Download size={12} />
                Instalar agora
              </button>
            )}
            <button onClick={dismiss} className="mt-2 block text-farm-cream/50 text-xs underline">
              Fechar
            </button>
          </div>
          <button onClick={dismiss} className="text-farm-cream/50 hover:text-farm-cream transition-colors flex-shrink-0 p-1">
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
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
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null);
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

  const confirmDeleteExpense = async () => {
    if (deletingExpenseId === null) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions/${deletingExpenseId}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (res.ok) fetchTransactions(currentPage);
    } catch (err) {
      console.error('Erro ao excluir lançamento.');
    } finally {
      setDeletingExpenseId(null);
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
    return (
      <>
        <LoginScreen onLogin={(u) => {
          localStorage.setItem('sysfarm_user', JSON.stringify(u));
          setUser(u);
        }} />
        <PWAInstallBanner />
      </>
    );
  }

  const isReadonly = user?.perfil === 'readonly';

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
              <p className="text-[10px] text-farm-cream/50 truncate uppercase tracking-widest">
                {user.perfil}
              </p>
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
            {!isReadonly && (
              <button 
                onClick={() => setExpenseModalOpen(true)}
                className="bg-farm-green text-farm-cream p-2 lg:px-4 lg:py-2 rounded-xl flex items-center gap-2 hover:bg-farm-coffee transition-colors shadow-md text-sm lg:text-base"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Lançamento</span>
              </button>
            )}
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
                onDelete={(id) => setDeletingExpenseId(id)}
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalRecords}
                onPageChange={setCurrentPage}
                isReadonly={isReadonly}
              />
            )}
            {activeTab === 'categories' && (
              <CategoryList categories={categories} onUpdate={handleUpdateCategory} isReadonly={isReadonly} />
            )}
            {activeTab === 'banks' && <BankList banks={banks} onUpdate={handleUpdateBank} isReadonly={isReadonly} />}
            {activeTab === 'reports' && <ReportsHub categories={categories} />}
          </AnimatePresence>
        </div>
      </main>

      {/* Expense Modal */}
      <ExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        categories={categories}
        banks={banks}
        expense={editingExpense}
        onSave={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
          fetchTransactions(editingExpense ? currentPage : 1);
          if (!editingExpense) setCurrentPage(1);
        }}
      />
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deletingExpenseId !== null}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeletingExpenseId(null)}
      />

      <PWAInstallBanner />
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

function ExpenseList({ expenses, categories, onEdit, onDelete, currentPage, totalPages, totalRecords, onPageChange, isReadonly }: {
  expenses: Expense[];
  categories: Category[];
  onEdit: (exp: Expense) => void;
  onDelete: (id: number) => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  isReadonly?: boolean;
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
                    {!isReadonly && (
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
                    )}
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

function ExpenseModal({ isOpen, onClose, categories, banks, onSave, expense }: { 
  isOpen: boolean; 
  onClose: () => void; 
  categories: Category[];
  banks: { id_banco: number; nome: string }[];
  onSave: () => void;
  expense?: Expense | null;
}) {
  const isEditing = !!expense;

  const [formData, setFormData] = useState({
    data_lancamento: new Date().toISOString().split('T')[0],
    historico: '',
    valor: '',
    natureza: 'D' as 'D' | 'C',
    id_categoria_caixa: '',
    id_banco: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setFormData({
        data_lancamento: String(expense.data_lancamento).split('T')[0],
        historico: expense.historico,
        valor: String(expense.valor),
        natureza: expense.natureza,
        id_categoria_caixa: String(expense.id_categoria_caixa),
        id_banco: (expense as any).id_banco ? String((expense as any).id_banco) : ''
      });
    } else {
      setFormData({
        data_lancamento: new Date().toISOString().split('T')[0],
        historico: '',
        valor: '',
        natureza: 'D',
        id_categoria_caixa: '',
        id_banco: ''
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
          id_categoria_caixa: parseInt(formData.id_categoria_caixa),
          id_banco: formData.id_banco ? parseInt(formData.id_banco) : null
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

            <div>
              <label className="block text-sm font-bold text-farm-green/80 mb-2 uppercase tracking-wide">
                Banco <span className="text-farm-green/40 font-normal normal-case">(opcional)</span>
              </label>
              <select
                value={formData.id_banco}
                onChange={(e) => setFormData({ ...formData, id_banco: e.target.value })}
                className="w-full px-4 py-3 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none transition-colors font-medium"
              >
                <option value="">Nenhum</option>
                {banks.map(b => (
                  <option key={b.id_banco} value={b.id_banco}>
                    {b.nome}
                  </option>
                ))}
              </select>
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

function ReportsHub({ categories }: { categories: Category[] }) {
  const [selected, setSelected] = useState<'fechamento' | 'movimentos' | 'categorias'>('fechamento');
  const tabs = [
    { id: 'fechamento',  label: 'Fechamento do Caixa' },
    { id: 'movimentos',  label: 'Movimentos por Data' },
    { id: 'categorias',  label: 'Movimentos por Categoria' },
  ] as const;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSelected(t.id)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${selected === t.id ? 'bg-farm-green text-farm-cream shadow-md' : 'bg-white text-farm-green border-2 border-farm-green/20 hover:bg-farm-cream'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {selected === 'fechamento' && <FechamentoCaixa />}
      {selected === 'movimentos' && <MovimentosPeriodo />}
      {selected === 'categorias' && <MovimentosPorCategoria categories={categories} />}
    </div>
  );
}

function FechamentoCaixa() {
  const today = new Date().toISOString().split('T')[0];
  const [dataFim, setDataFim] = useState(today);
  const [data, setData] = useState<{ rows: any[]; total: number; dataFim: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatDateBR = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const buscar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/reports/fechamento-caixa?dataFim=${dataFim}`, { credentials: 'include' });
      const json = await res.json();
      if (json.status === 'error') { setError(json.detail || json.message); }
      else setData(json);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const imprimir = () => {
    if (!data) return;
    const formatBR = (iso: string) => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };
    const fmtVal = (v: number) => Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const linhas = data.rows.map(row => {
      const saldo = parseFloat(row.saldo);
      const label = saldo > 0 ? 'C' : saldo < 0 ? 'D' : '';
      const cor = saldo > 0 ? '#16a34a' : saldo < 0 ? '#dc2626' : '#999';
      return `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:6px 8px;font-weight:900;color:${cor};width:24px;">${label}</td>
          <td style="padding:6px 4px;color:#999;font-size:12px;">${row.id_banco}</td>
          <td style="padding:6px 4px;font-weight:700;text-transform:uppercase;font-size:13px;">${row.nome}</td>
          <td style="padding:6px 8px;color:#666;font-size:12px;">${row.numero_agencia || '—'}</td>
          <td style="padding:6px 8px;color:#666;font-size:12px;">${row.numero_conta || '—'}</td>
          <td style="padding:6px 12px;text-align:right;font-weight:900;color:${cor};font-size:13px;">${fmtVal(saldo)}</td>
        </tr>`;
    }).join('');

    const total = data.total;
    const totalCor = total >= 0 ? '#16a34a' : '#dc2626';
    const totalLabel = total >= 0 ? 'C' : 'D';

    const html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Fechamento do Caixa — ${formatBR(data.dataFim)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 32px; }
        h2 { font-size: 20px; font-weight: 900; letter-spacing: 0.02em; margin-bottom: 4px; }
        .sub { color: #666; font-size: 12px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f5f5f0; border-bottom: 2px solid #ccc; }
        thead th { padding: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; text-align: left; }
        tfoot tr { border-top: 2px solid #333; background: #f5f5f0; }
        tfoot td { padding: 10px 8px; font-weight: 900; font-size: 14px; }
        @page { margin: 1.5cm; }
      </style>
    </head><body>
      <h2>FECHAMENTO DO CAIXA</h2>
      <p class="sub">Saldo acumulado até ${formatBR(data.dataFim)} &nbsp;·&nbsp; Gerado em ${formatBR(new Date().toISOString().split('T')[0])}</p>
      <table>
        <thead>
          <tr>
            <th style="width:24px;"></th>
            <th style="width:32px;">#</th>
            <th>Banco</th>
            <th>Agência</th>
            <th>Conta</th>
            <th style="text-align:right;">Saldo</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
        <tfoot>
          <tr>
            <td style="color:${totalCor};">${totalLabel}</td>
            <td colspan="4">SALDO TOTAL</td>
            <td style="text-align:right;color:${totalCor};">${fmtVal(total)}</td>
          </tr>
        </tfoot>
      </table>
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Filtro */}
      <div className="bg-white rounded-3xl shadow-sm border border-farm-green/5 p-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-farm-green/60 mb-2">
            Saldo acumulado até a data
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="px-4 py-2.5 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none font-medium"
          />
        </div>
        <button
          onClick={buscar}
          disabled={loading}
          className="px-6 py-2.5 bg-farm-green text-farm-cream rounded-xl font-bold hover:bg-farm-coffee transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
        >
          <FileText size={18} />
          {loading ? 'Calculando...' : 'Gerar Relatório'}
        </button>
        {data && (
          <button
            onClick={imprimir}
            className="px-6 py-2.5 border-2 border-farm-green/20 text-farm-green rounded-xl font-bold hover:bg-farm-cream transition-colors flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm font-mono">
          {error}
        </div>
      )}

      {/* Relatório */}
      {data && (
        <div id="relatorio-fechamento" className="bg-white rounded-3xl shadow-sm border border-farm-green/5 overflow-hidden print:shadow-none print:rounded-none print:border-0">
          {/* Cabeçalho */}
          <div className="bg-farm-green text-farm-cream px-8 py-6 print:bg-white print:text-black print:border-b-2 print:border-black">
            <h2 className="font-serif text-2xl font-bold tracking-tight">FECHAMENTO DO CAIXA</h2>
            <p className="text-farm-cream/70 text-sm mt-1 print:text-gray-600">
              Saldo acumulado até {formatDateBR(data.dataFim)} &nbsp;·&nbsp; Gerado em {formatDateBR(today)}
            </p>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-farm-cream/50 border-b-2 border-farm-green/10 print:bg-gray-100">
                <tr className="text-xs uppercase tracking-widest text-farm-green/60 print:text-gray-600">
                  <th className="px-6 py-3 w-8"></th>
                  <th className="px-2 py-3 w-10">#</th>
                  <th className="px-2 py-3">Banco</th>
                  <th className="px-4 py-3">Agência</th>
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-6 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farm-green/5">
                {data.rows.map((row, i) => {
                  const saldo = parseFloat(row.saldo);
                  const label = saldo > 0 ? 'C' : saldo < 0 ? 'D' : '';
                  return (
                    <tr key={i} className={`transition-colors ${saldo !== 0 ? 'hover:bg-farm-cream/20' : 'opacity-60'}`}>
                      <td className={`px-6 py-3 text-xs font-black ${saldo > 0 ? 'text-emerald-600' : saldo < 0 ? 'text-rose-600' : 'text-transparent'}`}>
                        {label}
                      </td>
                      <td className="px-2 py-3 text-sm text-farm-green/50">{row.id_banco}</td>
                      <td className="px-2 py-3 text-sm font-bold uppercase">{row.nome}</td>
                      <td className="px-4 py-3 text-sm text-farm-green/70">{row.numero_agencia || '—'}</td>
                      <td className="px-4 py-3 text-sm text-farm-green/70">{row.numero_conta || '—'}</td>
                      <td className={`px-6 py-3 text-right font-black text-sm ${saldo > 0 ? 'text-emerald-700' : saldo < 0 ? 'text-rose-600' : 'text-farm-green/40'}`}>
                        {fmt(Math.abs(saldo))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Rodapé total */}
              <tfoot className="border-t-2 border-farm-green/20 bg-farm-cream/30">
                <tr>
                  <td className={`px-6 py-4 text-sm font-black ${data.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.total >= 0 ? 'C' : 'D'}
                  </td>
                  <td colSpan={4} className="px-2 py-4 text-sm font-black uppercase tracking-wide text-farm-brown">
                    SALDO TOTAL
                  </td>
                  <td className={`px-6 py-4 text-right text-lg font-black ${data.total >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {fmt(Math.abs(data.total))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MovimentosPeriodo() {
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().split('T')[0];

  const [dataInicio, setDataInicio] = useState(firstDay);
  const [dataFim, setDataFim] = useState(today);
  const [data, setData] = useState<{ rows: any[]; dataInicio: string; dataFim: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (v: number) => Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtBR = (iso: string) => { const [y, m, d] = String(iso).split('T')[0].split('-'); return `${d}/${m}/${y}`; };

  const buscar = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/reports/movimentos-periodo?dataInicio=${dataInicio}&dataFim=${dataFim}`, { credentials: 'include' });
      const json = await res.json();
      if (json.status === 'error') setError(json.detail || json.message);
      else setData(json);
    } catch { setError('Erro de conexão.'); }
    finally { setLoading(false); }
  };

  const imprimir = () => {
    if (!data) return;
    let saldo = 0;
    let totalC = 0, totalD = 0;

    const linhas = data.rows.map(row => {
      const val = parseFloat(row.valor);
      const nat = row.natureza;
      if (nat === 'C') { saldo += val; totalC += val; }
      else { saldo -= val; totalD += val; }
      const saldoCor = saldo >= 0 ? '#16a34a' : '#dc2626';
      const saldoLabel = saldo >= 0 ? 'C' : 'D';
      const natCor = nat === 'C' ? '#16a34a' : '#dc2626';
      return `<tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:4px 6px;font-weight:900;color:${natCor};width:20px">${nat}</td>
        <td style="padding:4px 6px;font-size:12px;max-width:200px;overflow:hidden">${row.historico || ''}</td>
        <td style="padding:4px 6px;text-align:right;font-weight:700;color:${natCor};white-space:nowrap">${fmt(val)}</td>
        <td style="padding:4px 6px;font-size:11px;color:#666">${row.categoria}</td>
        <td style="padding:4px 6px;font-size:11px;color:#666;text-align:center">${row.id_banco || ''}</td>
        <td style="padding:4px 6px;text-align:right;font-weight:700;color:${saldoCor};white-space:nowrap">${saldoLabel} ${fmt(saldo)}</td>
        <td style="padding:4px 6px;font-size:11px;color:#666;white-space:nowrap">${fmtBR(row.data_lancamento)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Movimentos por Data — ${fmtBR(data.dataInicio)} a ${fmtBR(data.dataFim)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:24px}
        h2{font-size:18px;font-weight:900;margin-bottom:2px}
        .sub{color:#666;font-size:11px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        thead tr{background:#f5f5f0;border-bottom:2px solid #ccc}
        thead th{padding:6px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666;text-align:left}
        .total-row td{padding:8px 6px;font-weight:900;font-size:13px;border-top:2px solid #333;background:#f5f5f0}
        @page{margin:1.5cm;size:A4 landscape}
      </style>
    </head><body>
      <h2>MOVIMENTOS POR DATA</h2>
      <p class="sub">Período: ${fmtBR(data.dataInicio)} a ${fmtBR(data.dataFim)} &nbsp;·&nbsp; ${data.rows.length} lançamentos</p>
      <table>
        <thead><tr>
          <th style="width:20px">D/C</th>
          <th>Histórico</th>
          <th style="text-align:right">Valor</th>
          <th>Categoria</th>
          <th style="text-align:center">Banco</th>
          <th style="text-align:right">Saldo Acum.</th>
          <th>Data</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2">TOTAIS</td>
            <td></td>
            <td style="color:#16a34a">Recebimentos: ${fmt(totalC)}</td>
            <td style="color:#dc2626">Pagamentos: ${fmt(totalD)}</td>
            <td style="text-align:right;color:${totalC - totalD >= 0 ? '#16a34a' : '#dc2626'}">
              ${totalC - totalD >= 0 ? 'C' : 'D'} ${fmt(totalC - totalD)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 400);
  };

  // Calcula saldo acumulado para a tela
  let saldoAcum = 0;
  let totalC = 0, totalD = 0;
  const rows = (data?.rows ?? []).map(row => {
    const val = parseFloat(row.valor);
    if (row.natureza === 'C') { saldoAcum += val; totalC += val; }
    else { saldoAcum -= val; totalD += val; }
    return { ...row, saldoAcum, val };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Filtro */}
      <div className="bg-white rounded-3xl shadow-sm border border-farm-green/5 p-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-farm-green/60 mb-2">Data Inicial</label>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="px-4 py-2.5 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-farm-green/60 mb-2">Data Final</label>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="px-4 py-2.5 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none font-medium" />
        </div>
        <button onClick={buscar} disabled={loading}
          className="px-6 py-2.5 bg-farm-green text-farm-cream rounded-xl font-bold hover:bg-farm-coffee transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
          <FileText size={18} />{loading ? 'Buscando...' : 'Gerar Relatório'}
        </button>
        {data && (
          <button onClick={imprimir}
            className="px-6 py-2.5 border-2 border-farm-green/20 text-farm-green rounded-xl font-bold hover:bg-farm-cream transition-colors flex items-center gap-2">
            <Printer size={18} />Imprimir
          </button>
        )}
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm font-mono">{error}</div>}

      {data && (
        <>
          {/* Totalizadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-farm-green/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-farm-green/50 mb-1">Total Recebimentos</p>
              <p className="text-xl font-black text-emerald-600">R$ {totalC.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-farm-green/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-farm-green/50 mb-1">Total Pagamentos</p>
              <p className="text-xl font-black text-rose-600">R$ {totalD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-farm-green/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-farm-green/50 mb-1">Saldo do Período</p>
              <p className={`text-xl font-black ${(totalC - totalD) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                R$ {(totalC - totalD).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-3xl shadow-sm border border-farm-green/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-farm-green/10 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Movimentos — {fmtBR(data.dataInicio)} a {fmtBR(data.dataFim)}</h3>
              <span className="text-xs text-farm-green/40 font-medium">{rows.length} lançamentos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-farm-cream/50 border-b border-farm-green/10">
                  <tr className="text-xs uppercase tracking-widest text-farm-green/50">
                    <th className="px-4 py-3 w-8">D/C</th>
                    <th className="px-4 py-3">Histórico</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3 text-center">Banco</th>
                    <th className="px-4 py-3 text-right">Saldo Acum.</th>
                    <th className="px-4 py-3 w-8 text-center">D/C</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farm-green/5">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-farm-cream/20 transition-colors text-sm">
                      <td className={`px-4 py-2.5 font-black text-xs ${row.natureza === 'C' ? 'text-emerald-600' : 'text-rose-600'}`}>{row.natureza}</td>
                      <td className="px-4 py-2.5 font-medium uppercase max-w-xs truncate">{row.historico}</td>
                      <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap ${row.natureza === 'C' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fmt(row.val)}
                      </td>
                      <td className="px-4 py-2.5 text-farm-green/60 text-xs">{row.categoria}</td>
                      <td className="px-4 py-2.5 text-center text-farm-green/50 text-xs">{row.id_banco || '—'}</td>
                      <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap ${row.saldoAcum >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {fmt(row.saldoAcum)}
                      </td>
                      <td className={`px-4 py-2.5 text-center font-black text-xs ${row.saldoAcum >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {row.saldoAcum >= 0 ? 'C' : 'D'}
                      </td>
                      <td className="px-4 py-2.5 text-farm-green/60 text-xs whitespace-nowrap">{fmtBR(row.data_lancamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MovimentosPorCategoria({ categories }: { categories: Category[] }) {
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().split('T')[0];

  const [dataInicio, setDataInicio] = useState(firstDay);
  const [dataFim, setDataFim] = useState(today);
  const [categoriaId, setCategoriaId] = useState('');
  const [data, setData] = useState<{ rows: any[]; dataInicio: string; dataFim: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (v: number) => Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtBR = (iso: string) => { const [y, m, d] = String(iso).split('T')[0].split('-'); return `${d}/${m}/${y}`; };

  const buscar = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ dataInicio, dataFim });
      if (categoriaId) params.set('categoriaId', categoriaId);
      const res = await fetch(`${API_URL}/api/reports/movimentos-categoria?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.status === 'error') setError(json.detail || json.message);
      else setData(json);
    } catch { setError('Erro de conexão.'); }
    finally { setLoading(false); }
  };

  // Agrupa as linhas por categoria
  const grupos = React.useMemo(() => {
    if (!data) return [];
    const map = new Map<string, any[]>();
    for (const row of data.rows) {
      const key = row.categoria || 'Sem categoria';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).map(([cat, rows]) => {
      const total = rows.reduce((acc, r) => {
        const v = parseFloat(r.valor);
        return acc + (r.natureza === 'C' ? v : -v);
      }, 0);
      return { cat, rows, total };
    });
  }, [data]);

  const imprimir = () => {
    if (!data || grupos.length === 0) return;
    let totalAcum = 0;
    const secoes = grupos.map(g => {
      totalAcum += g.rows.length;
      const linhas = g.rows.map(r => {
        const v = parseFloat(r.valor);
        const nat = r.natureza;
        const cor = nat === 'C' ? '#16a34a' : '#dc2626';
        return `<tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:4px 6px;font-weight:900;color:${cor};width:20px">${nat}</td>
          <td style="padding:4px 6px;font-size:11px;color:#555;white-space:nowrap">${fmtBR(r.data_lancamento)}</td>
          <td style="padding:4px 6px;font-size:12px">${r.historico || ''}</td>
          <td style="padding:4px 6px;font-size:11px;text-align:center;color:#666">${r.id_banco || ''}</td>
          <td style="padding:4px 6px;text-align:right;font-weight:700;color:${cor};white-space:nowrap">${fmt(v)}</td>
        </tr>`;
      }).join('');
      const totCor = g.total >= 0 ? '#16a34a' : '#dc2626';
      const totLabel = g.total >= 0 ? 'C' : 'D';
      const totSign = g.total >= 0 ? '' : '-';
      return `
        <div style="margin-bottom:24px;page-break-inside:avoid">
          <h3 style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #333;padding-bottom:4px;margin-bottom:8px">${g.cat}</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f5f5f0;border-bottom:1px solid #ccc">
              <th style="padding:5px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666;text-align:left;width:20px">D/C</th>
              <th style="padding:5px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666;text-align:left">Data</th>
              <th style="padding:5px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666;text-align:left">Histórico</th>
              <th style="padding:5px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666;text-align:center">Banco</th>
              <th style="padding:5px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666;text-align:right">Valor</th>
            </tr></thead>
            <tbody>${linhas}</tbody>
          </table>
          <p style="text-align:right;font-weight:900;font-size:13px;margin-top:6px;color:${totCor}">${totSign}R$${fmt(g.total)} ${totLabel}</p>
          <p style="font-size:11px;color:#999;margin-top:2px">${totalAcum} Lançamentos acumulados</p>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Movimentos por Categoria — ${fmtBR(data.dataInicio)} a ${fmtBR(data.dataFim)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:24px}
        h2{font-size:18px;font-weight:900;margin-bottom:2px}
        .sub{color:#666;font-size:11px;margin-bottom:20px}
        @page{margin:1.5cm;size:A4}
      </style>
    </head><body>
      <h2>MOVIMENTOS POR CATEGORIA</h2>
      <p class="sub">Período: ${fmtBR(data.dataInicio)} a ${fmtBR(data.dataFim)} &nbsp;·&nbsp; ${data.rows.length} lançamentos &nbsp;·&nbsp; ${grupos.length} categorias</p>
      ${secoes}
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-sm border border-farm-green/5 p-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-farm-green/60 mb-2">Data Inicial</label>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="px-4 py-2.5 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-farm-green/60 mb-2">Data Final</label>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="px-4 py-2.5 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-farm-green/60 mb-2">Categoria</label>
          <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
            className="px-4 py-2.5 border-2 border-farm-green/10 rounded-xl focus:border-farm-green focus:outline-none font-medium min-w-[200px]">
            <option value="">Todas as categorias</option>
            {categories.map(c => (
              <option key={c.id_categoria_caixa} value={c.id_categoria_caixa}>{c.descricao}</option>
            ))}
          </select>
        </div>
        <button onClick={buscar} disabled={loading}
          className="px-6 py-2.5 bg-farm-green text-farm-cream rounded-xl font-bold hover:bg-farm-coffee transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
          <FileText size={18} />{loading ? 'Buscando...' : 'Gerar Relatório'}
        </button>
        {data && (
          <button onClick={imprimir}
            className="px-6 py-2.5 border-2 border-farm-green/20 text-farm-green rounded-xl font-bold hover:bg-farm-cream transition-colors flex items-center gap-2">
            <Printer size={18} />Imprimir
          </button>
        )}
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm font-mono">{error}</div>}

      {data && grupos.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center text-farm-green/40 italic">Nenhum lançamento encontrado no período.</div>
      )}

      {/* Grupos por categoria */}
      {grupos.map((g, gi) => (
        <div key={gi} className="bg-white rounded-3xl shadow-sm border border-farm-green/5 overflow-hidden">
          <div className={`px-6 py-4 border-b-2 ${g.total >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold uppercase tracking-wide">{g.cat}</h3>
              <div className="text-right">
                <span className={`text-lg font-black ${g.total >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {g.total < 0 ? '-' : ''}R$ {fmt(g.total)}&nbsp;
                  <span className="text-sm">{g.total >= 0 ? 'C' : 'D'}</span>
                </span>
                <p className="text-xs text-farm-green/40">{g.rows.length} lançamento{g.rows.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-farm-cream/30 border-b border-farm-green/10">
                <tr className="text-xs uppercase tracking-widest text-farm-green/50">
                  <th className="px-4 py-2.5 w-8">D/C</th>
                  <th className="px-4 py-2.5">Data</th>
                  <th className="px-4 py-2.5">Histórico</th>
                  <th className="px-4 py-2.5 text-center">Banco</th>
                  <th className="px-4 py-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farm-green/5">
                {g.rows.map((row, ri) => {
                  const v = parseFloat(row.valor);
                  const cor = row.natureza === 'C' ? 'text-emerald-600' : 'text-rose-600';
                  return (
                    <tr key={ri} className="hover:bg-farm-cream/20 transition-colors text-sm">
                      <td className={`px-4 py-2 font-black text-xs ${cor}`}>{row.natureza}</td>
                      <td className="px-4 py-2 text-farm-green/60 text-xs whitespace-nowrap">{fmtBR(row.data_lancamento)}</td>
                      <td className="px-4 py-2 font-medium uppercase">{row.historico}</td>
                      <td className="px-4 py-2 text-center text-farm-green/50 text-xs">{row.id_banco || '—'}</td>
                      <td className={`px-4 py-2 text-right font-bold whitespace-nowrap ${cor}`}>{fmt(v)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {data && grupos.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-farm-green/5 p-6 flex gap-8 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase text-farm-green/50 mb-1">Total lançamentos</p>
            <p className="text-2xl font-black">{data.rows.length}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-farm-green/50 mb-1">Categorias</p>
            <p className="text-2xl font-black">{grupos.length}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-farm-green/50 mb-1">Total C (recebimentos)</p>
            <p className="text-2xl font-black text-emerald-600">
              R$ {fmt(grupos.reduce((a, g) => a + g.rows.filter(r => r.natureza === 'C').reduce((s, r) => s + parseFloat(r.valor), 0), 0))}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-farm-green/50 mb-1">Total D (pagamentos)</p>
            <p className="text-2xl font-black text-rose-600">
              R$ {fmt(grupos.reduce((a, g) => a + g.rows.filter(r => r.natureza !== 'C').reduce((s, r) => s + parseFloat(r.valor), 0), 0))}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ConfirmDeleteModal({ isOpen, onConfirm, onCancel }: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => cancelRef.current?.focus(), 50);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
        >
          <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 size={26} className="text-rose-500" />
          </div>
          <h3 className="font-serif text-xl font-bold text-farm-brown mb-2">Excluir lançamento?</h3>
          <p className="text-sm text-farm-green/60 mb-8">
            Esta ação não pode ser desfeita. O lançamento será removido permanentemente.
          </p>
          <div className="flex gap-3">
            <button
              ref={cancelRef}
              onClick={onCancel}
              className="flex-1 px-4 py-3 border-2 border-farm-green/20 text-farm-green rounded-2xl font-bold hover:bg-farm-cream transition-colors focus:outline-none focus:ring-2 focus:ring-farm-green/30"
            >
              Não, manter
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              Sim, excluir
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BankList({ banks, onUpdate, isReadonly }: { banks: BankRow[]; onUpdate: (id: number, fields: Omit<BankRow, 'id_banco'>) => void; isReadonly?: boolean }) {
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
                        {!isReadonly && (
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => startEdit(bank)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-farm-green hover:bg-farm-cream rounded-lg transition-all"
                              title="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                          </div>
                        )}
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

function CategoryList({ categories, onUpdate, isReadonly }: { categories: Category[]; onUpdate: (id: number, descricao: string) => void; isReadonly?: boolean }) {
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
                {!isReadonly && (
                  <button
                    onClick={() => startEdit(cat)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-farm-green hover:bg-farm-cream rounded-xl transition-all flex-shrink-0"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                )}
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
