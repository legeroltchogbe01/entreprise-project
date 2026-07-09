import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Trash2, Plus, Minus, ChevronRight,
  ShoppingBag, AlertCircle, CheckCircle2, Wallet,
  Image, Info, Package, X, Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL, KKIAPAY_PUBLIC_KEY } from '../config';

/* ─── helpers ──────────────────────────────────────────── */
function fmt(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* Remaining months from wallet activation (max 12, block if < 8 remaining) */
function calcRemainingMonths(activatedAt) {
  if (!activatedAt) return 12;
  const months = Math.floor((Date.now() - new Date(activatedAt)) / (1000 * 60 * 60 * 24 * 30.44));
  return Math.max(0, 12 - months);
}

function getDeliveryDate() {
  return fmtDate(addMonths(new Date(), 0).setDate(new Date().getDate() + 20));
}

/* ─── ÉCHELONNÉ breakdown ───────────────────────────────── */
function calcEchelonne(total, activatedAt) {
  const remaining = calcRemainingMonths(activatedAt);
  const acompte = total / 3;
  const credit  = (total * 2) / 3;
  const monthly = remaining > 0 ? credit / remaining : credit;
  const today   = new Date();
  const payments = Array.from({ length: remaining }, (_, i) => ({
    n: i + 1,
    amount: monthly,
    date: fmtDate(addMonths(today, i + 1))
  }));
  return { acompte, credit, monthly, remaining, payments, total, todayDate: fmtDate(today) };
}

/* ─── Payment mode tabs ──────────────────────────────────── */
const TABS = [
  { id: 'echelonne', label: 'Paiement échelonné',        sub: 'Premier versement + 6 versements', badge: null, activeColor: '#b45309', activeBg: 'rgba(120,53,15,0.4)', activeBorder: '#d97706' },
  { id: 'acompte',   label: 'Paiement avec acompte 50%', sub: '50% à la commande, reste à la livraison', badge: '-5%', activeColor: '#d97706', activeBg: 'rgba(120,53,15,0.5)', activeBorder: '#f59e0b' },
  { id: 'cash',      label: 'Cash',                       sub: 'Paiement total immédiat (-5%)',      badge: '-5%', activeColor: '#065f46', activeBg: 'rgba(6,78,59,0.5)', activeBorder: '#10b981' },
];

/* ──────────────────────────────────────────────────────────
   SOUS-PANNEAU : Paiement échelonné (dans la carte produit)
────────────────────────────────────────────────────────── */
function EchelonnéPanel({ total, activatedAt, compact = false }) {
  const { acompte, payments, remaining } = calcEchelonne(total, activatedAt);
  const todayStr = fmtDate(new Date());

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700/50 text-xs">
      {/* Banner */}
      <div className="bg-white text-black font-semibold text-center py-2 text-[11px] tracking-wide">
        Le premier versement donne accès au meuble
      </div>
      <div className="bg-[#1a1a1a] px-4 py-3 space-y-1">
        <p className="text-red-500 font-bold">
          Acompte : {fmt(acompte)} FCFA <span className="text-zinc-500 font-normal">({todayStr})</span>
        </p>
        {payments.slice(0, compact ? 6 : remaining).map(p => (
          <p key={p.n} className="text-red-500">
            {p.n}- {fmt(p.amount)} FCFA <span className="text-zinc-500">({p.date})</span>
          </p>
        ))}
        {!compact && <p className="text-zinc-400 font-semibold mt-2 pt-2 border-t border-zinc-700">
          Prix total : {fmt(total)} FCFA
        </p>}
      </div>
      {/* Blue total bar */}
      <div className="bg-[#1e40af] text-white text-center font-black text-xs py-2.5 tracking-wide">
        TOTAL DES VERSEMENTS<br />{fmt(total)} FCFA
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   SOUS-PANNEAU : Acompte 50%
────────────────────────────────────────────────────────── */
function AcomptePanel({ total, compact = false }) {
  const remisé  = total * 0.95;
  const half    = remisé / 2;

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700/50 text-xs">
      <div className="bg-white text-black font-semibold text-center py-2 text-[11px] tracking-wide">
        Montant à verser (50% après remise)
      </div>
      <div className="bg-[#1a1a1a] px-4 py-3 space-y-2">
        {/* Barré */}
        <p className="text-red-600 line-through font-bold">{fmt(total)} FCFA</p>
        {/* Orange half */}
        <div className="bg-[#f59e0b] text-black font-black text-sm px-4 py-2.5 rounded-lg">
          {fmt(half)} FCFA
        </div>
        <p className="text-zinc-400 bg-zinc-900/50 rounded px-3 py-2">
          Solde à la livraison : {fmt(half)} FCFA
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   SOUS-PANNEAU : Cash
────────────────────────────────────────────────────────── */
function CashPanel({ total }) {
  const remisé = total * 0.95;

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700/50 text-xs">
      <div className="bg-white text-black font-semibold text-center py-2 text-[11px] tracking-wide">
        Montant total
      </div>
      <div className="bg-[#1a1a1a] px-4 py-3 space-y-2">
        <p className="text-red-600 line-through font-bold">{fmt(total)} FCFA</p>
        <div className="bg-[#059669] text-white font-black text-sm px-4 py-2.5 rounded-lg">
          {fmt(remisé)} FCFA
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   SIDEBAR SUMMARY selon le mode choisi
────────────────────────────────────────────────────────── */
function SidebarSummary({ paymentMode, total, activatedAt }) {
  if (!paymentMode || total === 0) {
    return (
      <p className="text-zinc-600 text-xs italic text-center py-4">
        Choisissez un mode de paiement
      </p>
    );
  }

  if (paymentMode === 'echelonne') {
    const { acompte, payments, remaining } = calcEchelonne(total, activatedAt);
    const todayStr = fmtDate(new Date());
    return (
      <div className="space-y-1 text-xs">
        <p className="text-red-500 font-bold">
          Acompte : {fmt(acompte)} FCFA <span className="text-zinc-500">({todayStr})</span>
        </p>
        {payments.map(p => (
          <p key={p.n} className="text-red-500">
            {p.n}- {fmt(p.amount)} FCFA <span className="text-zinc-500">({p.date})</span>
          </p>
        ))}
        <div className="bg-[#1e40af] text-white text-center font-black text-[11px] py-2 rounded-lg mt-3">
          TOTAL DES VERSEMENTS<br />{fmt(total)} FCFA
        </div>
      </div>
    );
  }

  if (paymentMode === 'acompte') {
    const remisé = total * 0.95;
    const half   = remisé / 2;
    return (
      <div className="space-y-2 text-xs">
        <p className="text-red-600 line-through font-bold">{fmt(total)} FCFA</p>
        <div className="bg-[#f59e0b] text-black font-black px-4 py-2.5 rounded-lg">
          {fmt(half)} FCFA
        </div>
        <p className="text-zinc-400 text-[11px] bg-zinc-900/50 rounded px-3 py-2">
          Vous devez verser {fmt(half)} FCFA avant de récupérer le produit.
        </p>
        <div className="bg-[#1e40af] text-white font-black text-[11px] px-4 py-2.5 rounded-lg">
          TOTAL APRÈS REMISE<br />{fmt(remisé)} FCFA
        </div>
      </div>
    );
  }

  if (paymentMode === 'cash') {
    const remisé = total * 0.95;
    return (
      <div className="space-y-2 text-xs">
        <p className="text-red-600 line-through font-bold">{fmt(total)} FCFA</p>
        <div className="bg-[#1e40af] text-white font-black text-[11px] px-4 py-2.5 rounded-lg">
          MONTANT TOTAL<br />{fmt(remisé)} FCFA
        </div>
      </div>
    );
  }
}

/* ──────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────── */
export default function Panier({ cart, setCart, user, wallet, onGoShop }) {
  const [paymentMode, setPaymentMode]   = useState(null);
  const [accepted,    setAccepted]      = useState(false);
  const [deliveryAccepted, setDeliveryAccepted] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderError,   setOrderError]   = useState('');
  const [zoomedImage,  setZoomedImage]  = useState(null);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [showConditions, setShowConditions] = useState(false);

  // Popups blocking states
  const [showActivationPopup, setShowActivationPopup] = useState(false);
  const [showSeuilPopup, setShowSeuilPopup] = useState(false);
  const [showExpirationPopup, setShowExpirationPopup] = useState(false);

  // Dynamic Settings States
  const [minActivationDeposit, setMinActivationDeposit] = useState(5000000);
  const [purchaseEligibilityPeriod, setPurchaseEligibilityPeriod] = useState(4);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/settings`);
        const data = await res.json();
        if (res.ok) {
          setMinActivationDeposit(data.minActivationDeposit);
          setPurchaseEligibilityPeriod(data.purchaseEligibilityPeriod || 4);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleKkiapaySuccess = async (response) => {
      console.log("Kkiapay callback in Panier received:", response);
      if (response && response.transactionId) {
        setOrderLoading(true);
        try {
          const res = await fetch(`${API_URL}/api/wallets/activate-client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: user.company.id,
              transactionId: response.transactionId
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          alert(data.message);
          window.location.reload();
        } catch (err) {
          console.error(err);
          alert(err.message || "Erreur lors de l'activation du portefeuille.");
        } finally {
          setOrderLoading(false);
        }
      }
    };

    if (window.addKkiapayListener) {
      window.addKkiapayListener('success', handleKkiapaySuccess);
    }

    return () => {
      if (window.removeKkiapayListener) {
        window.removeKkiapayListener('success', handleKkiapaySuccess);
      }
    };
  }, [user?.company?.id]);

  const handleOpenActivationPayment = () => {
    if (typeof window.openKkiapayWidget !== 'undefined') {
      window.openKkiapayWidget({
        amount: minActivationDeposit,
        position: "right",
        callback: "",
        data: "activation",
        key: KKIAPAY_PUBLIC_KEY,
        sandbox: true
      });
    } else {
      alert("La passerelle de paiement Kkiapay n'est pas chargée. Veuillez rafraîchir la page.");
    }
  };

  if (!user || (user.role === 'CLIENT' && user.company?.kyc_status !== 'APPROVED')) {
    return (
      <div className="flex-1 bg-[#0a0a0a] min-h-screen flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute max-w-[400px] w-[60vw] h-[60vw] max-h-[400px] rounded-full bg-red-950/10 blur-[130px] top-1/4 left-1/4"></div>
        <div className="absolute max-w-[300px] w-[50vw] h-[50vw] max-h-[300px] rounded-full bg-red-950/5 blur-[100px] bottom-1/4 right-1/4"></div>

        <div className="max-w-xl w-full glass-panel p-8 sm:p-10 rounded-2xl border border-zinc-850 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-red-950/30 border border-red-800/50 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse shadow-md shadow-red-950/30">
             <ShoppingCart size={28} />
          </div>
          <div className="space-y-3">
             <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Accès au Panier Restreint</h3>
             <p className="text-sm text-zinc-400 leading-relaxed">
               Le panier et les fonctionnalités de passation de commandes sont réservés exclusivement aux entreprises dont le dossier de conformité a été validé et approuvé par l'administration GMD.
             </p>
          </div>
          
          <div className="pt-4 flex justify-center">
             <Link to="/" className="px-6 py-2.5 rounded bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-bold transition-all shadow-md shadow-red-950/20 cursor-pointer">
                Retour à la Boutique
             </Link>
          </div>
        </div>
      </div>
    );
  }

  const activatedAt  = wallet?.activated_at || null;
  const remaining    = calcRemainingMonths(activatedAt);
  const kycApproved  = wallet?.company?.kyc_status === 'APPROVED';
  const walletActive = !!activatedAt;
  /* block if < 8 months remain */
  const canOrder     = !walletActive || remaining >= 8;

  const updateQty  = (id, d) => setCart(cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const removeItem = id => setCart(cart.filter(i => i.id !== id));
  const clearCart  = () => setCart([]);

  const rawTotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  const handleOrder = async () => {
    if (!paymentMode || !accepted) return;
    setOrderLoading(true); setOrderError('');

    // Pre-checks for B2B paymentMode === 'echelonne'
    if (paymentMode === 'echelonne') {
      // 1. Seuil Global check (minActivationDeposit * 3)
      const dynamicSeuil = minActivationDeposit * 3;
      if (rawTotal > dynamicSeuil) {
        setShowSeuilPopup(true);
        setOrderLoading(false);
        return;
      }

      // 2. Eligibility Period check
      const actDate = user?.company?.activated_at ? new Date(user.company.activated_at) : (wallet?.activated_at ? new Date(wallet.activated_at) : null);
      if (actDate) {
        const now = new Date();
        let diff = (now.getFullYear() - actDate.getFullYear()) * 12 + now.getMonth() - actDate.getMonth();
        if (now.getDate() < actDate.getDate() && diff > 0) diff--;

        if (diff >= purchaseEligibilityPeriod) {
          setShowExpirationPopup(true);
          setOrderLoading(false);
          return;
        }
      }

      // 3. Wallet activation check
      if (!walletActive) {
        setShowActivationPopup(true);
        setOrderLoading(false);
        return;
      }
    }

    try {
      const res  = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: user?.company?.id, items: cart.map(i => ({ productId: i.id, quantity: i.quantity })), paymentMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrderSuccess(data.message || 'Commande confirmée !');
      setCart([]);
    } catch (err) { setOrderError(err.message); }
    finally { setOrderLoading(false); }
  };

  /* ── EMPTY ─────────────────────────── */
  if (cart.length === 0 && !orderSuccess) return (
    <div className="flex-1 bg-[#0a0a0a] min-h-screen fade-up">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
          <ShoppingCart size={28} className="text-red-600" /> Mon panier
        </h1>
        <div className="rounded-2xl border border-zinc-800 bg-[#111111] p-16 flex flex-col items-center gap-5 text-center">
          <ShoppingBag size={48} className="text-zinc-700" />
          <p className="text-zinc-400 font-medium text-lg">Votre panier est vide.</p>
          <button onClick={onGoShop} className="btn-glow px-8 py-3 rounded-lg bg-[#cc0000] text-white font-bold text-sm cursor-pointer shadow-lg shadow-red-950/40">
            Découvrir les produits
          </button>
        </div>
      </div>
    </div>
  );

  /* ── SUCCESS ────────────────────────── */
  if (orderSuccess) return (
    <div className="flex-1 bg-[#0a0a0a] min-h-screen fade-up">
      <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-950/40 border border-emerald-700/50 flex items-center justify-center">
          <CheckCircle2 size={36} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Commande confirmée !</h1>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-md">{orderSuccess}</p>
        <button onClick={onGoShop} className="btn-glow px-8 py-3 rounded-lg bg-[#cc0000] text-white font-bold text-sm cursor-pointer mt-2">
          Continuer mes achats
        </button>
      </div>
    </div>
  );

  /* ── FULL CART ──────────────────────── */
  return (
    <div className="flex-1 bg-[#0a0a0a] min-h-screen fade-up">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShoppingCart size={26} className="text-red-600" /> Mon panier
          </h1>
          <button onClick={clearCart} className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 text-xs font-semibold cursor-pointer hover:text-red-400 hover:border-red-900/50">
            <Trash2 size={13} /> Vider
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* ══ LEFT COLUMN ══ */}
          <div className="space-y-5">

            {/* ── Payment Mode Tabs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TABS.map(tab => {
                const active = paymentMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPaymentMode(tab.id)}
                    className="relative rounded-xl border px-4 py-3.5 text-left cursor-pointer card-hover transition-all"
                    style={{
                      background: active ? tab.activeBg : 'rgba(17,17,17,0.8)',
                      borderColor: active ? tab.activeBorder : '#3f3f46'
                    }}
                  >
                    {tab.badge && (
                      <span className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-700/50">
                        {tab.badge}
                      </span>
                    )}
                    <p className="font-bold text-sm text-white">{tab.label}</p>
                    <p className="text-zinc-500 text-[10px] mt-0.5 font-medium">{tab.sub}</p>
                  </button>
                );
              })}
            </div>

            {/* ── Wallet info / KYC banners ── */}
            {user && !kycApproved && (
              <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 px-5 py-3 flex items-center gap-3">
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <p className="text-amber-300 text-xs font-semibold">KYC en attente d'approbation — revenez sous 48h.</p>
              </div>
            )}
            {user && kycApproved && !walletActive && (
              <div className="rounded-xl border border-sky-800/50 bg-sky-950/20 px-5 py-3 flex items-center gap-3">
                <Wallet size={16} className="text-sky-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sky-300 text-xs font-semibold">Portefeuille inactif — activez-le dans votre espace profil.</p>
                </div>
              </div>
            )}
            {walletActive && !canOrder && (
              <div className="rounded-xl border border-red-800/50 bg-red-950/20 px-5 py-3 flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-red-300 text-xs font-semibold">Nouvelles commandes bloquées — moins de 8 mois restants sur votre crédit.</p>
              </div>
            )}

            {/* ── Product Cards ── */}
            <div className="space-y-4">
              {cart.map(item => {
                const itemTotal = Number(item.price) * item.quantity;
                return (
                  <div key={item.id} className="rounded-2xl border border-zinc-800 bg-[#0f0f0f] overflow-hidden">

                    {/* Qty row */}
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-900/80">
                      <button onClick={() => updateQty(item.id, -1)} className="icon-btn w-7 h-7 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-300 cursor-pointer text-sm font-bold">-</button>
                      <span className="font-bold text-white text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="icon-btn w-7 h-7 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-300 cursor-pointer text-sm font-bold">+</button>
                    </div>

                    {/* Product content */}
                    <div className="px-5 py-4 space-y-4">
                      {/* Name + actions */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{item.name}</p>
                          <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                            <Package size={10} /> Stock : {item.stock_quantity ?? '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedDesc(s => ({ ...s, [item.id]: !s[item.id] }))}
                            className="btn-ghost flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 text-[11px] font-semibold cursor-pointer"
                          >
                            <Info size={11} /> Description
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="icon-btn w-8 h-8 rounded-lg border border-red-900/50 bg-red-950/20 text-red-500 flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Image + payment breakdown */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Thumbnail */}
                        <div className="relative shrink-0 w-full sm:w-[130px] h-40 sm:h-[110px] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 img-zoom">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          <button onClick={() => setZoomedImage(item.image_url)} className="icon-btn absolute top-1 right-1 w-6 h-6 rounded bg-black/60 text-white flex items-center justify-center cursor-pointer">
                            <Maximize2 size={11} />
                          </button>
                        </div>

                        {/* Right side — payment breakdown or description */}
                        <div className="flex-1">
                          {expandedDesc[item.id] ? (
                            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 px-4 py-3 h-full text-zinc-400 text-xs leading-relaxed">
                              {item.description || 'Aucune description disponible.'}
                            </div>
                          ) : paymentMode === 'echelonne' ? (
                            <EchelonnéPanel total={itemTotal} activatedAt={activatedAt} compact />
                          ) : paymentMode === 'acompte' ? (
                            <AcomptePanel total={itemTotal} />
                          ) : paymentMode === 'cash' ? (
                            <CashPanel total={itemTotal} />
                          ) : (
                            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 px-4 py-3 h-full flex items-center">
                              <p className="text-zinc-600 text-xs italic">
                                Choisissez un mode de paiement pour voir le détail.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Motif thumbnails + button */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {[item.image_url, item.image_url].map((src, i) => (
                            <div key={i} className="img-zoom w-12 h-12 rounded-lg overflow-hidden border border-zinc-700 cursor-pointer">
                              <img src={src} alt="motif" className="w-full h-full object-cover opacity-70 hover:opacity-100" />
                            </div>
                          ))}
                        </div>
                        <button className="btn-glow w-full py-2.5 rounded-xl bg-[#cc0000] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-950/30">
                          <Image size={13} /> Choisir le motif
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add another product */}
            <button onClick={onGoShop} className="btn-glow w-full py-3.5 rounded-xl bg-[#cc0000] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/30">
              <Plus size={16} /> Ajouter un autre produit
            </button>
          </div>

          {/* ══ RIGHT SIDEBAR ══ */}
          <div className="sticky top-[100px] space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-[#111111] p-5 space-y-4">
              <h3 className="font-black text-white text-base border-b border-zinc-800 pb-3">Addition total</h3>

              {/* Dynamic summary */}
              <SidebarSummary paymentMode={paymentMode} total={rawTotal} activatedAt={activatedAt} />

              {/* Conditions button */}
              <button 
                onClick={() => setShowConditions(true)}
                className="btn-ghost w-full py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-zinc-400" /> Conditions
              </button>

              {/* Accept checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setAccepted(v => !v)}
                  className={`icon-btn w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${accepted ? 'bg-red-700 border-red-600' : 'bg-zinc-900 border-zinc-700'}`}
                >
                  {accepted && <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3l1.5 1.5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                </div>
                <span className="text-zinc-400 text-[11px] group-hover:text-zinc-200">J'accepte les conditions de versement</span>
              </label>

              {/* Delivery */}
              <div className="space-y-1">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">Délai de livraison</p>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => setDeliveryAccepted(v => !v)}
                    className={`icon-btn w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${deliveryAccepted ? 'bg-red-700 border-red-600' : 'bg-zinc-900 border-zinc-700'}`}
                  >
                    {deliveryAccepted && <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3l1.5 1.5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                  </div>
                  <span className="text-zinc-400 text-[11px] group-hover:text-zinc-200">Livraison max. {getDeliveryDate()}</span>
                </label>
              </div>

              {/* Error */}
              {orderError && (
                <div className="rounded-lg bg-red-950/30 border border-red-900/50 px-3 py-2 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" /> {orderError}
                </div>
              )}

              {/* Continuer */}
              <button
                onClick={handleOrder}
                disabled={!paymentMode || !accepted || orderLoading || !canOrder}
                className={`btn-glow w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                  paymentMode && accepted && canOrder
                    ? 'bg-[#cc0000] shadow-red-950/40'
                    : 'bg-zinc-800 shadow-none cursor-not-allowed opacity-50'
                }`}
              >
                {orderLoading
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Traitement...</span>
                  : <><ChevronRight size={15} /> Continuer</>
                }
              </button>
            </div>

            {/* B2B info */}
            {walletActive && (
              <div className="rounded-2xl border border-zinc-800/60 bg-[#0f0f0f] px-5 py-4 space-y-2.5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Wallet size={11} className="text-red-500" /> Portefeuille B2B
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-600 mb-0.5">Acompte restant</p>
                    <p className="font-black text-white">{fmt(wallet?.balance ?? 5000000)} FCFA</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 mb-0.5">Crédit restant</p>
                    <p className="font-black text-white">{fmt(wallet?.credit_limit ?? 10000000)} FCFA</p>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-2">
                  {remaining} mois restants sur 12 · {remaining < 8 ? '⛔ Nouvelles commandes bloquées' : '✅ Commandes actives'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <div className="modal-scale relative max-w-3xl w-full rounded-2xl overflow-hidden">
            <img src={zoomedImage} alt="zoom" className="w-full h-auto rounded-2xl" />
            <button onClick={() => setZoomedImage(null)} className="icon-btn absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Conditions modal */}
      {showConditions && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm" onClick={() => setShowConditions(false)}>
          <div 
            className="modal-scale relative max-w-2xl w-full rounded-2xl border border-zinc-800 bg-[#111111] p-6 text-zinc-300 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Info className="text-red-500" size={20} /> Conditions de Versement
              </h2>
              <button 
                onClick={() => setShowConditions(false)} 
                className="icon-btn w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="font-semibold text-zinc-200">
                La validation de votre commande sur la plateforme GMD Créance est régie par les clauses contractuelles suivantes de Galassy Meuble Décor :
              </p>

              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-1">
                  <h4 className="font-bold text-white text-[11px] uppercase tracking-wide text-red-500">1. Règle de Financement Hybride (1/3 - 2/3)</h4>
                  <p>
                    Toute commande validée sur le catalogue est obligatoirement ventilée selon un ratio fixe :
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-zinc-400">
                    <li><strong>1/3 du montant</strong> est automatiquement imputé et débité de votre <strong>Acompte de Démarrage</strong>.</li>
                    <li><strong>2/3 du montant</strong> sont imputés sur votre <strong>Ligne de Crédit</strong> et font l'objet d'un échéancier de remboursement mensuel.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-1">
                  <h4 className="font-bold text-white text-[11px] uppercase tracking-wide text-red-500">2. Échéances de Remboursement et Cycle de Crédit</h4>
                  <p>
                    Les fonds prélevés sur la ligne de crédit sont amortis de façon linéaire sur la <strong>durée résiduelle</strong> du cycle contractuel de <strong>12 mois</strong> (calculé à partir de la date d'activation initiale du portefeuille).
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-1">
                  <h4 className="font-bold text-white text-[11px] uppercase tracking-wide text-red-500">3. Le Garde-fou des 8 mois</h4>
                  <p>
                    Dès le début du 5ème mois suivant l'activation du portefeuille (soit lorsqu'il reste <strong>moins de 8 mois</strong> avant l'expiration du cycle annuel de 12 mois), le tunnel d'achat est <strong>systématiquement bloqué</strong> pour toute nouvelle commande. L'entreprise doit régulariser et solder ses échéances en cours.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-1">
                  <h4 className="font-bold text-white text-[11px] uppercase tracking-wide text-red-500">4. Pénalités de Retard et Réquisition</h4>
                  <p>
                    Tout retard de paiement de vos mensualités entraîne des frais de pénalité de <strong>5 % journaliers</strong>. En cas de non-respect de l'accord initial persistant au-delà du 5e jour de retard, la rupture officielle du contrat sans recours est prononcée, entraînant la réquisition immédiate des meubles livrés.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-zinc-400 text-[10px]">
                En cliquant sur "J'accepte et je ferme" ou en cochant la case d'acceptation, vous reconnaissez avoir pris connaissance de ces dispositions et vous engagez à les respecter conformément à l'accord initial de conformité B2B.
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button 
                onClick={() => setShowConditions(false)} 
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-400 text-xs font-semibold cursor-pointer transition-colors"
              >
                Fermer
              </button>
              <button 
                onClick={() => {
                  setAccepted(true);
                  setShowConditions(false);
                }} 
                className="px-5 py-2 rounded-xl bg-[#cc0000] hover:bg-[#e60000] text-white text-xs font-bold shadow-lg shadow-red-950/40 cursor-pointer transition-colors"
              >
                J'accepte et je ferme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP D'ACTIVATION REQUIS (BLOQUANT) ── */}
      {showActivationPopup && (
        <div className="fixed inset-0 bg-black/85 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="modal-scale max-w-md w-full rounded-2xl border border-zinc-800 bg-[#0f0f11] p-6 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-red-950/30 border border-red-800/50 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
              <Wallet size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-wide">Activation de Portefeuille Requise</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Vous ne pouvez pas payer sans créditer votre compte du montant prédéfini par l'administrateur (<strong>{minActivationDeposit.toLocaleString('fr-FR')} FCFA</strong>).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setShowActivationPopup(false)}
                className="w-full px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-450 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  setShowActivationPopup(false);
                  handleOpenActivationPayment();
                }}
                className="w-full px-5 py-2.5 rounded-xl bg-[#cc0000] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wide transition-all cursor-pointer shadow-md shadow-red-950/20"
              >
                Créditer mon compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP SEUIL MAXIMUM DÉPASSÉ (BLOQUANT) ── */}
      {showSeuilPopup && (
        <div className="fixed inset-0 bg-black/85 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="modal-scale max-w-md w-full rounded-2xl border border-zinc-800 bg-[#0f0f11] p-6 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-amber-950/30 border border-amber-800/50 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-wide">Seuil Maximal Dépassé</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Le total des produits ({rawTotal.toLocaleString('fr-FR')} FCFA) dépasse le seuil global autorisé de <strong>{(minActivationDeposit * 3).toLocaleString('fr-FR')} FCFA</strong>. Pour continuer cet achat, vous devez effectuer un paiement cash.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowSeuilPopup(false);
                  setPaymentMode('cash');
                }}
                className="w-full px-5 py-2.5 rounded-xl bg-[#cc0000] hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Basculer en paiement Cash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP PÉRIODE LIMITE EXPIREE (BLOQUANT) ── */}
      {showExpirationPopup && (
        <div className="fixed inset-0 bg-black/85 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="modal-scale max-w-md w-full rounded-2xl border border-zinc-800 bg-[#0f0f11] p-6 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-red-950/30 border border-red-800/50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-wide">Période d'Éligibilité Expirée</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                La période autorisée pour effectuer des achats échelonnés est expirée ({purchaseEligibilityPeriod} mois écoulés depuis l'activation de votre compte). Pour finaliser votre commande, veuillez choisir l'option de paiement Cash.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowExpirationPopup(false);
                  setPaymentMode('cash');
                }}
                className="w-full px-5 py-2.5 rounded-xl bg-[#cc0000] hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Basculer en paiement Cash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
