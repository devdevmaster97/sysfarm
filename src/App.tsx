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
  Lock
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/categories`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories.");
      }
    }
    fetchData();
  }, [user]);

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
            <div className="hidden sm:flex flex-col items-end mr-2 lg:mr-4">
              <span className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-farm-green/60">Saldo Atual</span>
              <span className="text-sm lg:text-lg font-bold">R$ 142.500,00</span>
            </div>
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
            {activeTab === 'expenses' && <ExpenseList expenses={expenses} />}
            {activeTab === 'categories' && <CategoryList categories={categories} />}
          </AnimatePresence>
        </div>
      </main>

      {/* Expense Modal */}
      <ExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        categories={categories}
        onSave={(newExpense) => {
          setExpenses([newExpense, ...expenses]);
          setExpenseModalOpen(false);
        }}
      />
    </div>
  );
}

// --- Sub-components ---

function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Tentando login em:', `${API_URL}/api/login`);
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      console.log('Resposta recebida:', res.status);
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Erro ao realizar login.');
      }
    } catch (err) {
      console.error('Erro no login:', err);
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-farm-cream/50 border border-farm-green/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-farm-green/20 focus:border-farm-green outline-none transition-all"
              />
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Entradas (Mês)" 
          value="R$ 85.200" 
          icon={ArrowUpCircle} 
          color="text-emerald-600"
          trend="+12% que mês passado"
        />
        <StatCard 
          title="Saídas (Mês)" 
          value="R$ 42.150" 
          icon={ArrowDownCircle} 
          color="text-rose-600"
          trend="-5% que mês passado"
        />
        <StatCard 
          title="Saldo Líquido" 
          value="R$ 43.050" 
          icon={Wallet} 
          color="text-farm-green"
          trend="Resultado operacional"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-farm-green/5">
          <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-farm-green" />
            Atividade Recente
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-farm-cream/30 rounded-2xl">
                <div className="flex gap-4 items-center">
                  <div className="p-2 bg-white rounded-xl">
                    <Receipt size={18} className="text-farm-green" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Adubo NPK 20-00-20</p>
                    <p className="text-xs text-farm-green/60">Insumos e Fertilizantes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-600">- R$ 1.250,00</p>
                  <p className="text-[10px] uppercase font-bold text-farm-green/40 tracking-widest">12 Mai</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-farm-green/5">
          <h3 className="text-xl font-serif font-bold mb-6">Despesas por Categoria</h3>
          <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-farm-green/10 rounded-2xl">
            <p className="text-farm-green/40 text-sm italic">Gráfico de distribuição (Mock)</p>
          </div>
        </div>
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

function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

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
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-farm-cream/50 border-b border-farm-green/10">
              <tr className="serif text-xs uppercase tracking-widest text-farm-green/60">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Histórico</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-green/5">
              {expenses.map(expense => (
                <tr key={expense.id_caixa} className="hover:bg-farm-cream/20 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">{formatDate(expense.data_lancamento)}</td>
                  <td className="px-6 py-4 text-sm font-bold group-hover:text-farm-green uppercase">{expense.historico}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-farm-cream text-farm-green rounded-full text-xs font-bold uppercase tracking-tight">
                      Cat. {expense.id_categoria_caixa}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black whitespace-nowrap ${expense.natureza === 'D' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {expense.natureza === 'D' ? '- ' : '+ '}{formatCurrency(expense.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function ExpenseModal({ isOpen, onClose, categories, onSave }: { 
  isOpen: boolean; 
  onClose: () => void; 
  categories: Category[];
  onSave: (expense: Expense) => void;
}) {
  const [formData, setFormData] = useState({
    data_lancamento: new Date().toISOString().split('T')[0],
    historico: '',
    valor: '',
    natureza: 'D' as 'D' | 'C',
    id_categoria_caixa: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          id_categoria_caixa: parseInt(formData.id_categoria_caixa)
        })
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data.expense);
        setFormData({
          data_lancamento: new Date().toISOString().split('T')[0],
          historico: '',
          valor: '',
          natureza: 'D',
          id_categoria_caixa: ''
        });
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
                <h2 className="font-serif text-2xl font-bold text-farm-cream">Novo Lançamento</h2>
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
                {loading ? 'Salvando...' : 'Salvar Lançamento'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {categories.length > 0 ? (
        categories.map(cat => (
          <div key={cat.id_categoria_caixa} className="bg-white p-6 rounded-3xl shadow-sm border border-farm-green/5 hover:border-farm-green/20 transition-all group">
            <div className="flex justify-between items-center">
              <h4 className="font-serif text-xl font-bold">{cat.descricao}</h4>
              <button className="opacity-0 group-hover:opacity-100 p-2 text-farm-green hover:bg-farm-cream rounded-xl transition-all">
                <Settings size={18} />
              </button>
            </div>
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
