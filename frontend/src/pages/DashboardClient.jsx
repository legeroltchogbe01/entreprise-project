import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Wallet2, Calendar, FileText, Send, Check, AlertCircle, RefreshCw, Building2, Phone, Mail, MapPin, CreditCard, LogOut, ShieldCheck, User, Briefcase, Package, Eye, EyeOff, Edit3, X, Clock } from 'lucide-react';
import { API_URL, KKIAPAY_PUBLIC_KEY, KKIAPAY_SANDBOX } from '../config';

// ─── MINUTERIE DÉS-ACTIVATION 48H ──────────────────────────────────────────
function KYCDeactivationTimer({ company, wallet }) {
  const [timeLeft, setTimeLeft] = useState('');


  useEffect(() => {
    if (!company?.activated_at || (wallet && wallet.activated_at)) {
      return;
    }

    const calculateTime = () => {
      const approvedAt = new Date(company.activated_at).getTime();
      const limit = approvedAt + 48 * 60 * 60 * 1000; // 48 hours
      const now = Date.now();
      const diff = limit - now;

      if (diff <= 0) {
        setTimeLeft('Temps écoulé');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [company?.activated_at, wallet?.activated_at]);

  if (!company?.activated_at || (wallet && wallet.activated_at)) {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 text-amber-300 flex items-center justify-between gap-4 shadow-lg shadow-amber-950/10">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">⏳ Activation requise sous 48h</p>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Pour préserver l'accès à vos tarifs Gold B2B, veuillez effectuer le dépôt initial avant la fin du décompte.
        </p>
      </div>
      <div className="bg-amber-950/60 border border-amber-800/40 rounded-lg px-3.5 py-2 flex items-center justify-center shrink-0">
        <span className="font-mono text-sm font-black tracking-wider text-white">{timeLeft || 'Calcul...'}</span>
      </div>
    </div>
  );
}

function DashboardClient({ user }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'profil';

  const [wallet, setWallet] = useState(null);
  const [minActivationDeposit, setMinActivationDeposit] = useState(5000000);
  const [kkiapaySubaccount23, setKkiapaySubaccount23] = useState('');
  const [orders, setOrders] = useState([]);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Special Request Form State
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [requestImage, setRequestImage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Payment State
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  // Profile Update Request State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [profileUpdateFields, setProfileUpdateFields] = useState({});
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState('');
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState('');
  const [pendingUpdateRequest, setPendingUpdateRequest] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const wRes = await fetch(`${API_URL}/api/wallets/${user.company.id}`);
      const wData = await wRes.json();
      if (!wRes.ok) throw new Error(wData.error);
      setWallet(wData);

      const oRes = await fetch(`${API_URL}/api/orders/company/${user.company.id}`);
      const oData = await oRes.json();
      if (!oRes.ok) throw new Error(oData.error);
      setOrders(oData);

      const sRes = await fetch(`${API_URL}/api/special-requests/company/${user.company.id}`);
      const sData = await sRes.json();
      if (!sRes.ok) throw new Error(sData.error);
      setSpecialRequests(sData);

      const setRes = await fetch(`${API_URL}/api/admin/settings`);
      const setData = await setRes.json();
      if (setRes.ok) {
        setMinActivationDeposit(setData.minActivationDeposit);
        setKkiapaySubaccount23(setData.kkiapaySubaccount23 || '');
      }

      // Fetch pending profile update requests
      const purRes = await fetch(`${API_URL}/api/profile-update-requests/${user.company.id}`);
      if (purRes.ok) {
        const purData = await purRes.json();
        const pending = purData.find(r => r.status === 'PENDING');
        setPendingUpdateRequest(pending || null);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const submitProfileUpdate = async () => {
    setProfileUpdateError('');
    setProfileUpdateSuccess('');
    if (Object.keys(profileUpdateFields).length === 0) {
      setProfileUpdateError('Veuillez renseigner au moins un champ à modifier.');
      return;
    }
    setProfileUpdateLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile-update-requests/${user.company.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: profileUpdateFields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileUpdateSuccess('Votre demande de modification a été soumise. Elle sera traitée par un administrateur.');
      setProfileUpdateFields({});
      setPendingUpdateRequest(data);
      setTimeout(() => {
        setShowUpdateModal(false);
        setProfileUpdateSuccess('');
      }, 3000);
    } catch (err) {
      setProfileUpdateError(err.message || 'Erreur lors de la soumission.');
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  useEffect(() => {
    const handleKkiapaySuccess = async (response) => {
      console.log("Kkiapay callback received:", response);
      if (response && response.transactionId) {
        setPaymentLoading(true);
        try {
          if (window.currentDueToPay) {
            const due = window.currentDueToPay;
            window.currentDueToPay = null;

            const res = await fetch(`${API_URL}/api/orders/pay-monthly-due`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companyId: user.company.id,
                transactionId: response.transactionId,
                installments: due.installments.map(i => ({
                  orderId: i.order_id,
                  installmentNumber: i.installment_number
                }))
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message);
          } else {
            console.warn("Transaction reçue sans échéance active.");
          }
          await fetchDashboardData();
        } catch (err) {
          console.error(err);
          alert(err.message || "Erreur lors du traitement de la transaction.");
        } finally {
          setPaymentLoading(false);
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
  }, [user.company.id]);

  const handleOpenMonthlyDuePayment = (due) => {
    if (typeof window.openKkiapayWidget !== 'undefined') {
      window.currentDueToPay = due;
      window.openKkiapayWidget({
        amount: due.amount,
        position: "right",
        callback: "",
        data: "monthly_due",
        key: KKIAPAY_PUBLIC_KEY,
        sandbox: KKIAPAY_SANDBOX,
        ...(kkiapaySubaccount23 ? { partnerId: kkiapaySubaccount23 } : {})
      });
    } else {
      alert("La passerelle de paiement Kkiapay n'est pas chargée. Veuillez rafraîchir la page.");
    }
  };

  const handlePayInstallment = async (orderId, installmentNumber) => {
    if (paymentLoading) return;
    setPaymentLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/pay-installment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installmentNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmitSpecialRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!description || !quantity) return;
    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('companyId', user.company.id);
      formData.append('description', description);
      formData.append('quantity', quantity);
      if (requestImage) formData.append('image', requestImage);

      const res = await fetch(`${API_URL}/api/special-requests`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormSuccess(data.message);
      setDescription('');
      setQuantity('1');
      setRequestImage(null);
      // reset file input
      const fi = document.getElementById('devisImageInput');
      if (fi) fi.value = '';
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleApproveQuote = async (requestId) => {
    if (paymentLoading) return;
    setPaymentLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/special-requests/${requestId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getWeeklyQuotaUsed = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recent = specialRequests.filter(req => new Date(req.created_at) >= oneWeekAgo && req.status !== 'REJECTED');
    return recent.reduce((sum, req) => sum + req.quantity, 0);
  };

  const getClientMaturities = () => {
    const list = [];
    orders.forEach(order => {
      const schedule = JSON.parse(JSON.stringify(order.payment_schedule));
      schedule.forEach(inst => {
        list.push({
          order_id: order.id,
          order_number: order.order_number,
          installment_number: inst.installment_number,
          due_date: inst.due_date,
          amount: inst.amount,
          paid: inst.paid,
          paid_at: inst.paid_at
        });
      });
    });
    return list.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  };

  const getNextMonthlyDue = () => {
    const unpaid = getClientMaturities().filter(m => !m.paid);
    if (unpaid.length === 0) return null;

    const earliest = new Date(unpaid[0].due_date);
    const earliestYear = earliest.getFullYear();
    const earliestMonth = earliest.getMonth();

    const sameMonthUnpaid = unpaid.filter(m => {
      const d = new Date(m.due_date);
      return d.getFullYear() === earliestYear && d.getMonth() === earliestMonth;
    });

    const totalAmount = sameMonthUnpaid.reduce((sum, m) => sum + Number(m.amount), 0);

    return {
      year: earliestYear,
      month: earliestMonth,
      dueDate: unpaid[0].due_date,
      amount: totalAmount,
      installments: sameMonthUnpaid
    };
  };

  const getTotalRemaining = () => {
    return getClientMaturities().filter(m => !m.paid).reduce((sum, m) => sum + Number(m.amount), 0);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-main">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin text-primary-hover mx-auto" size={32} />
          <p className="text-zinc-500 text-sm">Chargement de l'espace entreprise...</p>
        </div>
      </div>
    );
  }

  const nextMonthlyDue = getNextMonthlyDue();
  const totalRemaining = getTotalRemaining();
  const weeklyQuota = getWeeklyQuotaUsed();
  const c = user.company;

  return (
    <div className="flex-1 bg-bg-main relative">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── TITLE ──────────────────── */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {activeTab === 'profil' ? 'Mon profil' : 'Espace Entreprise'}
          </h2>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-surface-custom border border-border-custom hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-all"
            title="Rafraîchir"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs flex gap-2">
            <AlertCircle className="shrink-0" size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* ── ONGLET PROFIL : CONTIENT TOUT COMME AVANT ── */}
        {activeTab === 'profil' && (
          <div className="space-y-5">
            {wallet && wallet.company && (
              <KYCDeactivationTimer company={wallet.company} wallet={wallet} />
            )}
            {/* ── PAYMENT CARD ──────────── */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left Side: Blue circular button with eye icon */}
                <button
                  type="button"
                  onClick={() => setShowBalances(!showBalances)}
                  className="w-10 h-10 rounded-full bg-[#0082f4] hover:bg-blue-600 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-colors"
                  title={showBalances ? "Masquer les soldes" : "Afficher les soldes"}
                >
                  {showBalances ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>

                {/* Middle: White card */}
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-xl px-6 py-2.5 shadow-md text-center min-w-[185px]">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">ÉCHÉANCE MENSUELLE GLOBALE</p>
                    <p className="text-lg font-black text-black mt-0.5 text-center font-mono">
                      {showBalances ? (nextMonthlyDue ? `${Number(nextMonthlyDue.amount).toLocaleString('fr-FR')} FCFA` : '0 FCFA') : '•••••• FCFA'}
                    </p>
                  </div>
                  {/* Calendar Pill below the white card */}
                  <div className="mt-3 flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5 shadow-inner">
                      <Calendar size={12} className="text-[#0082f4]" />
                      {nextMonthlyDue ? `Date limite : ${new Date(nextMonthlyDue.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Pas d\'échéance en cours'}
                    </span>
                  </div>
                </div>

                {/* Right Side: Green button "Payer" */}
                <button
                  onClick={() => {
                    if (nextMonthlyDue) {
                      handleOpenMonthlyDuePayment(nextMonthlyDue);
                    }
                  }}
                  disabled={paymentLoading || !nextMonthlyDue}
                  className="px-5 py-2.5 rounded-full bg-[#00b450] hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <CreditCard size={14} /> Payer
                </button>
              </div>
            </div>

            {/* Wallet Cards — showing the 4 fields of solde */}
            {wallet && (
              <div className="space-y-4">
                {/* Available Limits (Bloc A) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Champ_Dispo_Admin */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-border-custom space-y-3 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-custom/5 blur-[30px] rounded-full"></div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-[#0082f4]" /> Acompte Disponible (Champ_Dispo_Admin)
                    </p>
                    <h3 className="font-bold text-white text-lg font-mono">
                      {wallet.activated_at ? (showBalances ? `${Number(wallet.acompte_restant).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-none">
                      Limite de départ : {wallet.activated_at ? (showBalances ? `${Number(wallet.acompte_initial).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </p>
                  </div>

                  {/* Champ_Dispo_Credit */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-border-custom space-y-3 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-glow/5 blur-[30px] rounded-full"></div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-emerald-500" /> Crédit Disponible (Champ_Dispo_Credit)
                    </p>
                    <h3 className="font-bold text-white text-lg font-mono">
                      {wallet.activated_at ? (showBalances ? `${(Number(wallet.credit_initial) - Number(wallet.credit_utilise)).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-none">
                      Limite de départ : {wallet.activated_at ? (showBalances ? `${Number(wallet.credit_initial).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </p>
                  </div>
                </div>

                {/* Consumed Limits (Bloc B) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Champ_Conso_Admin */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-border-custom space-y-3 relative overflow-hidden shadow-md">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-zinc-600" /> Acompte Consommé (Champ_Conso_Admin)
                    </p>
                    <h3 className="font-bold text-white text-lg font-mono">
                      {wallet.activated_at ? (showBalances ? `${(Number(wallet.acompte_initial) - Number(wallet.acompte_restant)).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </h3>
                  </div>

                  {/* Champ_Conso_Credit */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-border-custom space-y-3 relative overflow-hidden shadow-md">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-red-500" /> Crédit Consommé (Champ_Conso_Credit)
                    </p>
                    <h3 className="font-bold text-white text-lg font-mono">
                      {wallet.activated_at ? (showBalances ? `${Number(wallet.credit_utilise).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </h3>
                  </div>
                </div>

                {/* Effectuer un Achat Button */}
                <div className="pt-2 text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#cc0000] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-950/20"
                  >
                    🛍️ Effectuer un achat
                  </Link>
                </div>
              </div>
            )}

            {/* ── COMPANY AVATAR + TOTAL REMAINING ── */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center space-y-5 shadow-lg">
              {/* Avatar circle */}
              <div className="w-24 h-24 mx-auto rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center shadow-inner">
                <User size={44} className="text-zinc-550" />
              </div>
              
              {/* Total remaining field */}
              <div className="w-full text-center py-3 px-4 rounded-xl bg-black/60 border border-zinc-850 text-sm text-zinc-350 font-medium">
                Total restant du: <span className="font-bold text-white font-mono">{totalRemaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA</span>
              </div>
            </div>

            {/* ── IDENTITY SECTION : ENTREPRISE ── */}
            <div className="p-5 rounded-xl bg-bg-deepest border border-border-custom space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Briefcase size={13} /> Identité Entreprise
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Dénomination Sociale</label>
                  <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                    {c.denomination_sociale}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Email Entreprise</label>
                  <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 truncate">
                    {c.email}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Téléphone</label>
                  <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                    {c.phone}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">N° RCCM</label>
                    <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 font-mono truncate">
                      {c.rccm_number}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">N° IFU</label>
                    <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 font-mono truncate">
                      {c.ifu_number}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Ville</label>
                  <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                    {c.city}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Adresse</label>
                  <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                    {c.district}, {c.house} — Carré {c.square}
                  </div>
                </div>
              </div>
            </div>

            {/* ── IDENTITY SECTION : GÉRANT ── */}
            <div className="p-5 rounded-xl bg-bg-deepest border border-border-custom space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={13} /> Gérant Responsable
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Nom et Prénom</label>
                  <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                    {c.manager_name}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Téléphone</label>
                    <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 truncate">
                      {c.manager_phone}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Email</label>
                    <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 truncate">
                      {c.manager_email}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Statut KYC</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      c.kyc_status === 'APPROVED'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                        : c.kyc_status === 'REJECTED'
                        ? 'bg-red-950/40 text-red-400 border border-red-900/50'
                        : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                    }`}>
                      <ShieldCheck size={13} />
                      {c.kyc_status === 'APPROVED' ? 'Conformité KYC Approuvée' : c.kyc_status === 'REJECTED' ? 'KYC Rejeté' : 'KYC en Attente d\'Audit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CONTACT & ACTION BUTTONS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`tel:${c.phone || '+22997000000'}`}
                className="py-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-950/50 transition-all"
              >
                <Phone size={13} /> Nous appeler
              </a>
              <a
                href="mailto:contact@gmd-creance.com"
                className="py-3 rounded-lg bg-surface-custom border border-border-custom text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-800 transition-all"
              >
                <Mail size={13} /> Nous contacter
              </a>
            </div>

            {/* ── PROFILE MODIFICATION REQUEST ── */}
            {pendingUpdateRequest ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 flex items-start gap-3">
                <Clock size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Demande de modification en attente</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Votre demande de modification de profil est en attente d'approbation par l'administrateur. Vous serez notifié de la décision.
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Soumise le {new Date(pendingUpdateRequest.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setProfileUpdateFields({});
                  setProfileUpdateError('');
                  setProfileUpdateSuccess('');
                  setShowUpdateModal(true);
                }}
                className="w-full py-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-blue-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-950/50 transition-all"
              >
                <Edit3 size={14} /> Demander une modification de profil
              </button>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('gmd_user');
                window.location.href = '/login';
              }}
              className="w-full py-3 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-red-950/50 transition-all"
            >
              <LogOut size={14} /> Déconnexion
            </button>

            <div className="text-center pb-2">
              <a href="#" className="text-xs text-blue-400 underline hover:text-blue-300 transition-colors">
                Mot de passe oublié
              </a>
            </div>


            <div className="border-t border-border-custom pt-6 space-y-6">

              {/* Échéancier */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-zinc-400" />
                  <h3 className="font-bold text-white text-sm">Échéancier de Remboursement</h3>
                </div>

                <div className="rounded-xl bg-bg-deepest border border-border-custom overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="p-3">N° Cmd</th>
                          <th className="p-3">Échéance</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Montant</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                        {getClientMaturities().length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-6 text-center text-zinc-500 text-xs">
                              Aucun échéancier de créance actif.
                            </td>
                          </tr>
                        ) : (
                          getClientMaturities().map((mat, i) => (
                            <tr key={i} className="hover:bg-surface-custom/20 transition-colors">
                              <td className="p-3 font-mono text-zinc-400 text-[10px]">{mat.order_number}</td>
                              <td className="p-3 text-[10px]">N°{mat.installment_number}</td>
                              <td className="p-3 text-[10px]">{new Date(mat.due_date).toLocaleDateString('fr-FR')}</td>
                              <td className="p-3 font-bold font-mono text-white text-[10px]">{Number(mat.amount).toLocaleString('fr-FR')}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  mat.paid ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-red-950/40 text-red-400 border border-red-900/40'
                                }`}>
                                  {mat.paid ? 'PAYÉ' : 'IMPAYÉ'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {!mat.paid && (
                                  <button
                                    onClick={() => handlePayInstallment(mat.order_id, mat.installment_number)}
                                    disabled={paymentLoading}
                                    className="px-2.5 py-1 rounded bg-primary-custom hover:bg-primary-hover text-white text-[10px] font-semibold cursor-pointer disabled:opacity-60 transition-all"
                                  >
                                    Régler
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Special Request */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-zinc-400" />
                  <h3 className="font-bold text-white text-sm">Demande Spéciale (Sur-mesure)</h3>
                </div>

                <div className="p-4 rounded-xl bg-bg-deepest border border-border-custom space-y-2">
                  <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                    <span>Quota de Soumission (7j)</span>
                    <span className="text-zinc-200">{weeklyQuota} / 30 articles</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-custom rounded-full overflow-hidden">
                    <div
                      className={`h-full ${weeklyQuota >= 30 ? 'bg-red-500' : 'bg-primary-custom'}`}
                      style={{ width: `${(weeklyQuota / 30) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-zinc-500">Limite de 30 articles/semaine. Devis sous 48h.</p>
                </div>

                <div className="p-4 rounded-xl bg-bg-deepest border border-border-custom space-y-3">
                  {formError && (
                    <div className="p-2.5 rounded bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] flex gap-2">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" /> <p>{formError}</p>
                    </div>
                  )}
                  {formSuccess && (
                    <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[10px] flex gap-2">
                      <Check size={12} className="shrink-0 mt-0.5" /> <p>{formSuccess}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmitSpecialRequest} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Description Technique</label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Table de conférence ovale en noyer 4m x 1.5m..."
                        rows="3"
                        className="w-full px-3 py-2 rounded-lg bg-surface-custom/50 border border-border-custom text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-primary-custom resize-none"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Quantité</label>
                      <input
                        type="number" min="1" required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-custom/50 border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={formLoading || weeklyQuota >= 30}
                      className="w-full py-2.5 rounded-lg bg-primary-custom hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
                    >
                      <Send size={11} /> Soumettre la demande
                    </button>
                  </form>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Suivi des demandes</h4>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                    {specialRequests.length === 0 ? (
                      <p className="text-zinc-500 text-xs text-center py-5 border border-dashed border-border-custom rounded-lg">Aucune demande spéciale.</p>
                    ) : (
                      specialRequests.map((req) => (
                        <div key={req.id} className="p-3.5 rounded-lg bg-bg-deepest border border-border-custom text-xs space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-medium text-zinc-300 line-clamp-2 leading-relaxed">{req.description}</p>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                              req.status === 'SUBMITTED' ? 'bg-zinc-800 text-zinc-400' :
                              req.status === 'QUOTED' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' :
                              req.status === 'APPROVED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-red-950/40 text-red-400'
                            }`}>
                              {req.status === 'SUBMITTED' && 'EN ATTENTE'}
                              {req.status === 'QUOTED' && 'DEVIS ÉMIS'}
                              {req.status === 'APPROVED' && 'APPROUVÉ'}
                              {req.status === 'REJECTED' && 'REJETÉ'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold uppercase">
                            <span>Qté: {req.quantity}</span>
                            <span>{req.estimated_price ? `${Number(req.estimated_price).toLocaleString('fr-FR')} FCFA` : '—'}</span>
                          </div>
                          {req.status === 'QUOTED' && (
                            <button
                              onClick={() => handleApproveQuote(req.id)}
                              disabled={paymentLoading}
                              className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[11px] cursor-pointer transition-all"
                            >
                              Accepter le Devis
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET CREANCES : DESSIN DÉDIÉ ET ÉPURÉ ── */}
        {activeTab === 'creances' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet2 size={16} className="text-zinc-400" />
              <h3 className="font-bold text-white text-sm">Suivi des Créances et En-cours</h3>
            </div>
            
            {wallet && (
              <div className="p-5 rounded-xl bg-bg-deepest border border-border-custom space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/5 blur-[40px] rounded-full"></div>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-zinc-400">Encours de crédit utilisé</p>
                  <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900/40 px-2 py-0.5 rounded font-bold">CRÉDIT ACTIF</span>
                </div>
                <h3 className="text-2xl font-black text-white font-mono">
                  {showBalances ? `${Number(wallet.credit_utilise).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA'}
                </h3>
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-surface-custom rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-700"
                      style={{ width: wallet.activated_at ? `${(Number(wallet.credit_utilise) / Number(wallet.credit_initial)) * 100}%` : '0%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase">
                    <span>Limite autorisée: {showBalances ? `${Number(wallet.credit_initial).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA'}</span>
                    <span>Disponible: {showBalances ? `${(Number(wallet.credit_initial) - Number(wallet.credit_utilise)).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider">Mensualités restant à régler</h4>
              <div className="rounded-xl bg-bg-deepest border border-border-custom overflow-hidden">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-3">N° Cmd</th>
                      <th className="p-3">Échéance</th>
                      <th className="p-3">Date Limite</th>
                      <th className="p-3">Montant</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                    {getClientMaturities().filter(m => !m.paid).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-zinc-500 text-xs">
                          Aucune échéance impayée. Votre compte est à jour !
                        </td>
                      </tr>
                    ) : (
                      getClientMaturities().filter(m => !m.paid).map((mat, i) => (
                        <tr key={i} className="hover:bg-surface-custom/20 transition-colors">
                          <td className="p-3 font-mono text-zinc-400 text-[10px]">{mat.order_number}</td>
                          <td className="p-3 text-[10px]">N°{mat.installment_number}</td>
                          <td className="p-3 text-[10px]">{new Date(mat.due_date).toLocaleDateString('fr-FR')}</td>
                          <td className="p-3 font-bold font-mono text-white text-[10px]">{showBalances ? `${Number(mat.amount).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handlePayInstallment(mat.order_id, mat.installment_number)}
                              disabled={paymentLoading}
                              className="px-3 py-1 rounded bg-primary-custom hover:bg-primary-hover text-white text-[10px] font-semibold cursor-pointer disabled:opacity-60 transition-all"
                            >
                              Régler
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET PAIEMENTS : VUE HISTORIQUE DÉDIÉE ── */}
        {activeTab === 'paiements' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-zinc-400" />
              <h3 className="font-bold text-white text-sm">Historique des Règlements Effectués</h3>
            </div>

            <div className="p-5 rounded-xl bg-bg-deepest border border-border-custom flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase">Cumul des paiements effectués</p>
                <h3 className="text-2xl font-black text-emerald-400 font-mono">
                  {getClientMaturities().filter(m => m.paid).reduce((sum, m) => sum + Number(m.amount), 0).toLocaleString('fr-FR')} <span className="text-xs text-zinc-400">FCFA</span>
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-bold">À JOUR</span>
            </div>

            <div className="rounded-xl bg-bg-deepest border border-border-custom overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3">N° Cmd</th>
                    <th className="p-3">Échéance</th>
                    <th className="p-3">Date de Paiement</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                  {getClientMaturities().filter(m => m.paid).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-zinc-500 text-xs">
                        Aucun paiement effectué pour le moment.
                      </td>
                    </tr>
                  ) : (
                    getClientMaturities().filter(m => m.paid).map((mat, i) => (
                      <tr key={i} className="hover:bg-surface-custom/20 transition-colors">
                        <td className="p-3 font-mono text-zinc-400 text-[10px]">{mat.order_number}</td>
                        <td className="p-3 text-[10px]">N°{mat.installment_number}</td>
                        <td className="p-3 text-[10px]">{mat.paid_at ? new Date(mat.paid_at).toLocaleDateString('fr-FR') : '-'}</td>
                        <td className="p-3 font-bold font-mono text-white text-[10px]">{Number(mat.amount).toLocaleString('fr-FR')} FCFA</td>
                        <td className="p-3 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">PAYÉ</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ONGLET LIVRAISONS : VUE DÉTAILLÉE DES COMMANDES ── */}
        {activeTab === 'livraisons' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-zinc-400" />
              <h3 className="font-bold text-white text-sm">Suivi des Livraisons & Commandes</h3>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="p-6 rounded-xl bg-bg-deepest border border-border-custom text-center text-zinc-500 text-xs">
                  Aucune commande enregistrée.
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="p-5 rounded-xl bg-bg-deepest border border-border-custom space-y-4">
                    <div className="flex justify-between items-center border-b border-border-custom/30 pb-3">
                      <div>
                        <p className="font-bold text-white text-sm font-mono">{order.order_number}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/40 text-amber-400 border border-amber-900/40">
                        LIVRAISON EN COURS
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {order.order_items && order.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-zinc-400 items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-surface-custom text-[10px] font-bold text-zinc-400 flex items-center justify-center">x{item.quantity}</span>
                            <span>{item.product?.name || 'Article'}</span>
                          </div>
                          <span className="font-mono text-zinc-300">{Number(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border-custom/30 text-xs">
                      <span className="text-zinc-500 font-semibold">Montant Total Facturé</span>
                      <span className="font-bold text-white font-mono text-sm">{Number(order.total_amount).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ONGLET DEVIS : DEMANDES SUR-MESURE + PROPOSITIONS ADMIN ── */}
        {activeTab === 'devis' && (
          <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-amber-400" />
              <h3 className="font-bold text-white text-sm">Mes Devis & Propositions</h3>
            </div>

            {/* Quota bar */}
            <div className="p-4 rounded-xl bg-bg-deepest border border-border-custom space-y-2">
              <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                <span>Quota de soumission (7 jours)</span>
                <span className={weeklyQuota >= 30 ? 'text-red-400' : 'text-zinc-200'}>{weeklyQuota} / 30 articles</span>
              </div>
              <div className="w-full h-1.5 bg-surface-custom rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${weeklyQuota >= 30 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min((weeklyQuota / 30) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-zinc-500">Limite de 30 articles/semaine. Réponse sous 48h ouvrées.</p>
            </div>

            {/* Formulaire nouvelle demande */}
            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/60 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-3">
                <Send size={14} className="text-amber-400" />
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Nouvelle Demande Sur-mesure</h4>
              </div>
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] flex gap-2">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" /><p>{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[10px] flex gap-2">
                  <Check size={12} className="shrink-0 mt-0.5" /><p>{formSuccess}</p>
                </div>
              )}
              <form onSubmit={handleSubmitSpecialRequest} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1.5">Description technique du modèle</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Table de conférence ovale en noyer massif, 4m × 1.5m, avec passe-câbles intégrés..."
                    rows="4"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-amber-600/60 resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1.5">Quantité souhaitée</label>
                  <input
                    type="number" min="1" required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-custom/50 border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-amber-600/60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1.5">Photo / Modèle de référence <span className="text-zinc-700 font-normal normal-case">(optionnel)</span></label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="devisImageInput"
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-custom/50 border border-dashed border-amber-800/40 hover:border-amber-600/60 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      {requestImage ? requestImage.name : 'Sélectionner une image...'}
                    </label>
                    <input
                      id="devisImageInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setRequestImage(e.target.files[0] || null)}
                    />
                    {requestImage && (
                      <button
                        type="button"
                        onClick={() => { setRequestImage(null); const fi = document.getElementById('devisImageInput'); if (fi) fi.value = ''; }}
                        className="text-zinc-600 hover:text-red-400 transition-all cursor-pointer"
                        title="Supprimer"
                      >✕</button>
                    )}
                  </div>
                  {requestImage && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(requestImage)}
                        alt="Aperçu"
                        className="w-24 h-24 object-cover rounded-lg border border-amber-800/30"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={formLoading || weeklyQuota >= 30}
                  className="w-full py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Send size={12} />
                  {formLoading ? 'Envoi en cours...' : weeklyQuota >= 30 ? 'Quota hebdomadaire atteint' : 'Envoyer la demande'}
                </button>
              </form>
            </div>

            {/* Liste des devis */}
            <div className="space-y-3">
              <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={12} /> Suivi de mes demandes ({specialRequests.length})
              </h4>
              {specialRequests.length === 0 ? (
                <div className="p-8 rounded-xl bg-bg-deepest border border-dashed border-border-custom text-center">
                  <FileText size={28} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-xs">Aucune demande de devis pour le moment.</p>
                  <p className="text-zinc-600 text-[10px] mt-1">Utilisez le formulaire ci-dessus pour soumettre votre première demande.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {specialRequests.map((req) => {
                    const isQuoted   = req.status === 'QUOTED';
                    const isApproved = req.status === 'APPROVED';
                    const isRejected = req.status === 'REJECTED';
                    const isPending  = req.status === 'SUBMITTED';
                    return (
                      <div
                        key={req.id}
                        className={`rounded-xl border p-4 space-y-3 transition-all ${
                          isQuoted   ? 'bg-amber-950/10 border-amber-800/40 shadow-md shadow-amber-950/20' :
                          isApproved ? 'bg-emerald-950/10 border-emerald-800/40' :
                          isRejected ? 'bg-red-950/10 border-red-900/30 opacity-70' :
                                       'bg-bg-deepest border-border-custom'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <p className="text-xs text-zinc-300 leading-relaxed flex-1">{req.description}</p>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black shrink-0 uppercase ${
                            isPending  ? 'bg-zinc-800 text-zinc-400' :
                            isQuoted   ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50' :
                            isApproved ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50' :
                                         'bg-red-950/60 text-red-400 border border-red-800/50'
                          }`}>
                            {isPending  && '⏳ En attente'}
                            {isQuoted   && '📋 Devis reçu'}
                            {isApproved && '✅ Approuvé'}
                            {isRejected && '❌ Rejeté'}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          {req.image_url && (
                            <img
                              src={req.image_url}
                              alt="Modèle"
                              className="w-16 h-16 object-cover rounded-lg border border-zinc-700/50 shrink-0"
                            />
                          )}
                          <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500 font-semibold uppercase items-center">
                            <span>Quantité: {req.quantity}</span>
                            <span>Soumis le {new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        {isQuoted && req.estimated_price && (
                          <div className="rounded-lg bg-amber-950/20 border border-amber-800/40 p-4 space-y-4">
                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">📩 Proposition de Devis Détaillée GMD</p>
                            
                            {/* Devis Quantitatif Table */}
                            {req.quote_items && Array.isArray(req.quote_items) && (
                              <div className="overflow-x-auto border-t border-b border-amber-900/30 py-2 my-2">
                                <table className="w-full text-left text-[11px]">
                                  <thead>
                                    <tr className="text-zinc-550 uppercase text-[9px] font-semibold">
                                      <th className="py-1">Désignation</th>
                                      <th className="py-1 text-center w-12">Qté</th>
                                      <th className="py-1 text-right w-24">P.U (FCFA)</th>
                                      <th className="py-1 text-right w-28">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-amber-900/10 text-zinc-300">
                                    {req.quote_items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="py-1 font-medium">{item.article}</td>
                                        <td className="py-1 text-center">{item.quantity}</td>
                                        <td className="py-1 text-right font-mono">{Number(item.price).toLocaleString('fr-FR')}</td>
                                        <td className="py-1 text-right font-mono font-semibold text-white">{Number(item.total).toLocaleString('fr-FR')}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {req.quote_notes && (
                              <div className="text-[11px] text-zinc-400 bg-black/30 p-2.5 rounded border border-amber-950/40">
                                <span className="font-bold text-amber-500 uppercase text-[9px] block mb-1">Notes administratives :</span>
                                <p className="leading-relaxed whitespace-pre-line">{req.quote_notes}</p>
                              </div>
                            )}

                            {req.contract_content && (
                              <div className="text-[10px] text-zinc-450 bg-black/40 p-3 rounded-lg border border-zinc-800/80 font-mono space-y-1">
                                <span className="font-bold text-zinc-400 uppercase text-[9px] block border-b border-zinc-800 pb-1 mb-1">📜 Aperçu du Contrat de Vente</span>
                                <p className="leading-relaxed whitespace-pre-line">{req.contract_content}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between border-t border-amber-900/30 pt-3">
                              <div>
                                <p className="text-[10px] text-zinc-500 font-semibold uppercase">Total Devis</p>
                                <p className="text-xl font-black text-white font-mono">
                                  {Number(req.estimated_price).toLocaleString('fr-FR')}
                                  <span className="text-xs text-zinc-400 ml-1 font-normal">FCFA</span>
                                </p>
                              </div>
                              <div className="text-right text-[9px] text-zinc-500">
                                <p>Payable en échelonnement</p>
                                <p className="font-bold text-zinc-400">1/3 d'acompte + 2/3 crédit</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                onClick={() => handleApproveQuote(req.id)}
                                disabled={paymentLoading}
                                className="py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
                              >
                                <Check size={13} /> Signer et Accepter le devis
                              </button>
                              <button
                                disabled
                                className="py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
                              >
                                ✕ Refuser
                              </button>
                            </div>
                            <p className="text-[9px] text-zinc-650 text-center">En acceptant, vous signez le contrat affiché ci-dessus.</p>
                          </div>
                        )}
                        {isApproved && req.estimated_price && (
                          <div className="rounded-lg bg-emerald-950/10 border border-emerald-800/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">✅ COMMANDE APPROUVÉE & CONTRAT SIGNÉ</span>
                              <span className="font-bold text-white font-mono text-sm">
                                {Number(req.estimated_price).toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                            {req.contract_content && (
                              <details className="mt-2 text-[10px] text-zinc-500 bg-black/10 p-2.5 rounded border border-zinc-900 font-mono">
                                <summary className="cursor-pointer hover:text-zinc-300 font-bold uppercase tracking-wider text-[9px]">Afficher le contrat signé</summary>
                                <p className="mt-2 leading-relaxed whitespace-pre-line text-zinc-400">{req.contract_content}</p>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── WhatsApp FAB ──────────── */}
      <a
        href="https://wa.me/22997000000"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-emerald-950/50 flex items-center justify-center z-50 hover:scale-110 transition-transform"
      >
        <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>

      {/* ── PROFILE UPDATE MODAL ────────────── */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateModal(false); }}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-900/40">
                  <Edit3 size={15} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Demande de modification</h3>
                  <p className="text-[10px] text-zinc-500">Renseignez uniquement les champs à modifier</p>
                </div>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {profileUpdateError && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>{profileUpdateError}</p>
                </div>
              )}
              {profileUpdateSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs flex gap-2">
                  <Check size={14} className="shrink-0 mt-0.5" />
                  <p>{profileUpdateSuccess}</p>
                </div>
              )}

              {/* Entreprise */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Briefcase size={11} /> Identité Entreprise
                </h4>
                {[
                  { key: 'phone', label: 'Téléphone entreprise' },
                  { key: 'city', label: 'Ville' },
                  { key: 'district', label: 'Quartier' },
                  { key: 'house', label: 'Maison N°' },
                  { key: 'square', label: 'Carré N°' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">{label}</label>
                    <input
                      type="text"
                      placeholder={`Actuel: ${c[key] || '—'}`}
                      value={profileUpdateFields[key] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setProfileUpdateFields(prev => val ? { ...prev, [key]: val } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-700 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Gérant */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <User size={11} /> Gérant Responsable
                </h4>
                {[
                  { key: 'manager_name', label: 'Nom et Prénom' },
                  { key: 'manager_phone', label: 'Téléphone' },
                  { key: 'manager_email', label: 'Email' },
                  { key: 'manager_city', label: 'Ville' },
                  { key: 'manager_district', label: 'Quartier' },
                  { key: 'manager_house', label: 'Maison N°' },
                  { key: 'manager_square', label: 'Carré N°' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">{label}</label>
                    <input
                      type="text"
                      placeholder={`Actuel: ${c[key] || '—'}`}
                      value={profileUpdateFields[key] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setProfileUpdateFields(prev => val ? { ...prev, [key]: val } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-700 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Garant */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={11} /> Garant / Avaliseur
                </h4>
                {[
                  { key: 'guarantor_name', label: 'Nom et Prénom' },
                  { key: 'guarantor_phone', label: 'Téléphone' },
                  { key: 'guarantor_email', label: 'Email' },
                  { key: 'guarantor_city', label: 'Ville' },
                  { key: 'guarantor_district', label: 'Quartier' },
                  { key: 'guarantor_house', label: 'Maison N°' },
                  { key: 'guarantor_square', label: 'Carré N°' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">{label}</label>
                    <input
                      type="text"
                      placeholder={`Actuel: ${c[key] || '—'}`}
                      value={profileUpdateFields[key] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setProfileUpdateFields(prev => val ? { ...prev, [key]: val } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-700 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {Object.keys(profileUpdateFields).length > 0 && (
                <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-blue-300 text-[11px] leading-relaxed">
                  <p className="font-bold mb-1">Champs à modifier ({Object.keys(profileUpdateFields).length}) :</p>
                  {Object.entries(profileUpdateFields).map(([k, v]) => (
                    <p key={k} className="text-zinc-400">• {k}: <span className="text-white font-mono">{v}</span></p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs font-semibold hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={submitProfileUpdate}
                disabled={profileUpdateLoading || Object.keys(profileUpdateFields).length === 0}
                className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {profileUpdateLoading ? 'Envoi...' : <><Send size={13} /> Soumettre la demande</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardClient;
