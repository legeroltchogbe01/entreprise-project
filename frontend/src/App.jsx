import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import Boutique from './pages/Boutique';
import Panier from './pages/Panier';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardClient from './pages/DashboardClient';
import DashboardAdmin from './pages/DashboardAdmin';
import { LogOut, ShoppingCart, LogIn } from 'lucide-react';
import { API_URL } from './config';

console.log("=== GMD CREANCE API URL CONFIGURATION ===");
console.log("API_URL is set to:", API_URL);
console.log("VITE_API_URL env is:", import.meta.env.VITE_API_URL);
console.log("=========================================");

function GmdLogo() {
  return (
    <div className="flex items-center select-none">
      <img src="/logo.jpeg" alt="GMD Logo" className="h-16 w-auto object-contain" />
    </div>
  );
}

function AppLayout({ user, setUser, cart, setCart }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'profil';
  
  const [forceShowProducts, setForceShowProducts] = useState(false);
  const [wallet, setWallet] = useState(null);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* Fetch wallet when user logs in */
  useEffect(() => {
    if (user?.role === 'CLIENT' && user?.company?.id) {
      fetch(`${API_URL}/api/wallets/${user.company.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setWallet(d); })
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('gmd_user');
    setUser(null);
    navigate('/');
  };

  /* Nav tab helper */
  const tabClass = (active) =>
    `nav-tab px-4 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors ${
      active
        ? 'active bg-red-950/30 border-red-800/70 text-red-400'
        : 'border-zinc-900/50 bg-zinc-950/30 text-zinc-400 hover:text-white hover:border-zinc-700'
    }`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#09090b' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="w-full bg-black/50 border-b border-zinc-900/60 px-4 sm:px-8 py-3 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">

          {/* Row 1: Logo + Actions */}
          <div className="flex items-center justify-between">
            <Link to="/" onClick={() => setForceShowProducts(false)}>
              <GmdLogo />
            </Link>

            <div className="flex items-center gap-2">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="btn-ghost px-3 py-1.5 rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={14} /> <span className="hidden sm:inline">Déconnexion</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="btn-connect px-4 py-1.5 rounded-lg bg-[#004d26] border border-[#00692f] text-[#4af296] text-xs font-bold flex items-center gap-1.5"
                >
                  <LogIn size={14} /> <span className="hidden sm:inline">Se connecter</span>
                </Link>
              )}

              {/* Cart icon — links to /panier */}
              <Link
                to="/panier"
                className="icon-btn relative w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800/70 flex items-center justify-center cursor-pointer"
              >
                <ShoppingCart size={15} className="text-red-500" />
                {cartCount > 0 && (
                  <span className="badge-pulse absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#cc0000] text-white text-[9px] font-black flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Row 2: Nav Tabs — scrollable horizontally on mobile, never wraps */}
          <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch'}}>

            {/* Accueil */}
            <Link
              to="/"
              onClick={() => setForceShowProducts(false)}
              className={tabClass(path === '/' && !forceShowProducts) + ' shrink-0'}
            >
              Accueil
            </Link>

            {/* Produits */}
            <Link
              to="/"
              onClick={() => { setForceShowProducts(true); }}
              className={tabClass(path === '/' && forceShowProducts) + ' shrink-0'}
            >
              Produits
            </Link>

            {/* Panier */}
            <Link
              to="/panier"
              className={tabClass(path === '/panier') + ' shrink-0'}
            >
              Panier {cartCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-400 text-[9px] font-black">{cartCount}</span>}
            </Link>

            {/* Profil */}
            {user ? (
              <Link
                to={user.role === 'ADMIN' ? '/admin' : '/dashboard?tab=profil'}
                className={tabClass(path === '/admin' || (path === '/dashboard' && activeTab === 'profil')) + ' shrink-0'}
              >
                Profil
              </Link>
            ) : (
              <Link
                to="/login"
                className={tabClass(path === '/login' || path === '/register') + ' shrink-0'}
              >
                Profil
              </Link>
            )}

            {/* Tabs Client connecté */}
            {user?.role === 'CLIENT' && (
              <>
                {['Créances', 'Paiements', 'Livraisons'].map(tab => {
                  const tabId = tab.toLowerCase().replace('é', 'e');
                  return (
                    <Link
                      key={tab}
                      to={`/dashboard?tab=${tabId}`}
                      className={tabClass(path === '/dashboard' && activeTab === tabId) + ' shrink-0'}
                    >
                      {tab}
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route
            path="/"
            element={
              <Boutique
                user={user}
                cart={cart}
                setCart={setCart}
                wallet={wallet}
                forceShowProducts={forceShowProducts}
                setForceShowProducts={setForceShowProducts}
              />
            }
          />
          <Route
            path="/panier"
            element={
              <Panier
                user={user}
                cart={cart}
                setCart={setCart}
                wallet={wallet}
                onGoShop={() => navigate('/')}
              />
            }
          />
          <Route path="/login"    element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/dashboard" element={user?.role === 'CLIENT' ? <DashboardClient user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin"    element={user?.role === 'ADMIN'  ? <DashboardAdmin />            : <Navigate to="/login" />} />
          <Route path="*"         element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser]   = useState(null);
  /* ── Cart state lifted here so Boutique & Panier share it ── */
  const [cart, setCart]   = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('gmd_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <Router>
      <AppLayout user={user} setUser={setUser} cart={cart} setCart={setCart} />
    </Router>
  );
}
