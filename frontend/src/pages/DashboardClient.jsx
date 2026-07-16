import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Wallet2, Calendar, FileText, Send, Check, AlertCircle, RefreshCw, Building2, Phone, Mail, MapPin, CreditCard, LogOut, ShieldCheck, User, Briefcase, Package, Eye, EyeOff, Edit3, X, Clock, Key, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('profil');

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') || 'profil';
    setActiveTab(tab);
  }, [location.search]);

  const [wallet, setWallet] = useState(null);
  const [minActivationDeposit, setMinActivationDeposit] = useState(5000000);
  const [kkiapaySubaccount23, setKkiapaySubaccount23] = useState('');
  const [orders, setOrders] = useState([]);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

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
  // Point 10: accordion infos entreprise
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);

  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPasswordState, setOldPasswordState] = useState('');
  const [newPasswordState, setNewPasswordState] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const wRes = await fetch(`${API_URL}/api/wallets/${user.company.id}?t=${Date.now()}`);
      const wData = await wRes.json();
      if (!wRes.ok) throw new Error(wData.error);
      setWallet(wData);

      const oRes = await fetch(`${API_URL}/api/orders/company/${user.company.id}?t=${Date.now()}`);
      const oData = await oRes.json();
      if (!oRes.ok) throw new Error(oData.error);
      setOrders(oData);

      const sRes = await fetch(`${API_URL}/api/special-requests/company/${user.company.id}?t=${Date.now()}`);
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
            if (!res.ok) {
              const errMsg = data.error + (data.details ? `\n(Détails techniques: ${data.details})` : '');
              throw new Error(errMsg);
            }
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
        email: user?.company?.manager_email || user?.email || "",
        phone: user?.company?.manager_phone || user?.phone || "",
        name: user?.company?.manager_name || "",
        ...(kkiapaySubaccount23 ? { partnerId: kkiapaySubaccount23 } : {})
      });
    } else {
      alert("La passerelle de paiement Kkiapay n'est pas chargée. Veuillez rafraîchir la page.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPasswordState || !newPasswordState) return;

    setPasswordChangeLoading(true);
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user.company.id,
          oldPassword: oldPasswordState,
          newPassword: newPasswordState
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPasswordChangeSuccess(data.message || 'Mot de passe modifié !');
      setOldPasswordState('');
      setNewPasswordState('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordChangeSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordChangeError(err.message);
    } finally {
      setPasswordChangeLoading(false);
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
      if (!res.ok) {
        const errMsg = data.error + (data.details ? `\n(Détails techniques: ${data.details})` : '');
        throw new Error(errMsg);
      }
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
    if (!wallet || !wallet.activated_at) return [];

    const activatedAt = new Date(wallet.activated_at);
    const globalMaturities = [];

    // Générer les 12 mois d'échéances globales
    for (let m = 1; m <= 12; m++) {
      const dueDate = new Date(activatedAt);
      dueDate.setMonth(activatedAt.getMonth() + m);
      dueDate.setDate(10); // Le 10 de chaque mois
      
      const dueDateString = dueDate.toISOString().split('T')[0];

      // Trouver toutes les échéances individuelles de toutes les commandes
      // qui tombent sur le même mois
      const matchingInstallments = [];
      orders.forEach(order => {
        const schedule = JSON.parse(JSON.stringify(order.payment_schedule || []));
        schedule.forEach(inst => {
          const instDate = new Date(inst.due_date);
          if (instDate.getFullYear() === dueDate.getFullYear() && instDate.getMonth() === dueDate.getMonth()) {
            matchingInstallments.push({
              order_id: order.id,
              order_number: order.order_number,
              installment_number: inst.installment_number,
              amount: inst.amount,
              paid: inst.paid,
              paid_at: inst.paid_at
            });
          }
        });
      });

      const totalAmount = matchingInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      const unpaidAmount = matchingInstallments.filter(inst => !inst.paid).reduce((sum, inst) => sum + Number(inst.amount), 0);
      const paidAmount = matchingInstallments.filter(inst => inst.paid).reduce((sum, inst) => sum + Number(inst.amount), 0);
      const allPaid = matchingInstallments.length > 0 ? matchingInstallments.every(inst => inst.paid) : true;
      const latestPaidAt = matchingInstallments.length > 0 ? matchingInstallments.map(inst => inst.paid_at).filter(Boolean).sort().pop() : null;

      globalMaturities.push({
        installment_number: m,
        due_date: dueDateString,
        amount: totalAmount,
        unpaidAmount: unpaidAmount,
        paidAmount: paidAmount,
        paid: allPaid,
        paid_at: latestPaidAt,
        installments: matchingInstallments
      });
    }

    return globalMaturities;
  };
  const getPaidInstallments = () => {
    const paidInsts = [];
    orders.forEach(order => {
      const schedule = JSON.parse(JSON.stringify(order.payment_schedule || []));
      schedule.forEach(inst => {
        if (inst.paid) {
          paidInsts.push({
            order_id: order.id,
            order_number: order.order_number,
            installment_number: inst.installment_number,
            paid_at: inst.paid_at,
            amount: inst.amount
          });
        }
      });
    });
    // Trier par date de paiement du plus récent au plus ancien
    return paidInsts.sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
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

    const totalUnpaidAmount = sameMonthUnpaid.reduce((sum, m) => sum + Number(m.unpaidAmount), 0);

    const unpaidInstallmentsOnly = [];
    sameMonthUnpaid.forEach(m => {
      if (m.installments) {
        m.installments.forEach(inst => {
          if (!inst.paid) {
            unpaidInstallmentsOnly.push(inst);
          }
        });
      }
    });

    return {
      year: earliestYear,
      month: earliestMonth,
      dueDate: unpaid[0].due_date,
      amount: totalUnpaidAmount,
      installments: unpaidInstallmentsOnly
    };
  };

  const getTotalRemaining = () => {
    return getClientMaturities().reduce((sum, m) => sum + Number(m.unpaidAmount || 0), 0);
  };

  const getUnpaidInstallmentsCount = () => {
    let count = 0;
    orders.forEach(order => {
      const schedule = JSON.parse(JSON.stringify(order.payment_schedule || []));
      schedule.forEach(inst => {
        if (!inst.paid) {
          count++;
        }
      });
    });
    return count;
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
                {/* Row 1 — Available (GREEN) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Champ_Dispo_Admin */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-emerald-900/40 space-y-3 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-950/5 blur-[30px] rounded-full"></div>
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-emerald-500" /> Acompte Disponible
                    </p>
                    <h3 className="font-bold text-emerald-400 text-lg font-mono">
                      {wallet.activated_at ? (showBalances ? `${Number(wallet.acompte_restant).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-none">
                      Limite : {wallet.activated_at ? (showBalances ? `${Number(wallet.acompte_initial).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </p>
                  </div>

                  {/* Champ_Dispo_Credit */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-emerald-900/40 space-y-3 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-950/5 blur-[30px] rounded-full"></div>
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-emerald-500" /> Crédit Disponible
                    </p>
                    <h3 className="font-bold text-emerald-400 text-lg font-mono">
                      {wallet.activated_at ? (showBalances ? `${(Number(wallet.credit_initial) - Number(wallet.credit_utilise)).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-none">
                      Limite : {wallet.activated_at ? (showBalances ? `${Number(wallet.credit_initial).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </p>
                  </div>
                </div>

                {/* Row 2 — Consumed (RED) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Champ_Conso_Admin */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-red-900/40 space-y-3 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-950/5 blur-[30px] rounded-full"></div>
                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-red-500" /> Acompte Consommé
                    </p>
                    <h3 className="font-bold text-red-400 text-lg font-mono">
                      {wallet.activated_at ? (showBalances ? `${(Number(wallet.acompte_initial) - Number(wallet.acompte_restant)).toLocaleString('fr-FR')} FCFA` : '•••••• FCFA') : '0 FCFA'}
                    </h3>
                  </div>

                  {/* Champ_Conso_Credit */}
                  <div className="p-4 rounded-xl bg-[#0f0f11] border border-red-900/40 space-y-3 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-900/5 blur-[30px] rounded-full"></div>
                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet2 size={12} className="text-red-500" /> Crédit Consommé
                    </p>
                    <h3 className="font-bold text-red-400 text-lg font-mono">
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
                Total restant dû: <span className="font-bold text-white font-mono">{totalRemaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA</span>
              </div>
            </div>

            {/* Point 10 : Accordéon masquant infos entreprise/gérant par défaut */}
            <div className="rounded-xl bg-bg-deepest border border-border-custom overflow-hidden">
              <button
                onClick={() => setShowCompanyDetails(!showCompanyDetails)}
                className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-surface-custom/30 transition-colors"
              >
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <Briefcase size={13} className="text-zinc-400" /> Informations entreprise &amp; gérant
                </span>
                <span className={`text-zinc-400 transition-transform duration-300 ${showCompanyDetails ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {showCompanyDetails && (
                <div className="px-5 pb-5 space-y-4 border-t border-border-custom pt-4">

                  {/* Identité Entreprise */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Briefcase size={11} /> Identité Entreprise
                    </h3>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Dénomination Sociale</label>
                      <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">{c.denomination_sociale}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Email Entreprise</label>
                      <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 truncate">{c.email}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Téléphone</label>
                      <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">{c.phone}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">N° RCCM</label>
                        <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 font-mono truncate">{c.rccm_number}</div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">N° IFU</label>
                        <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 font-mono truncate">{c.ifu_number}</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Ville</label>
                      <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">{c.city}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Adresse</label>
                      <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">{c.district}, {c.house} — Carré {c.square}</div>
                    </div>
                  </div>

                  {/* Gérant */}
                  <div className="space-y-3 pt-2 border-t border-border-custom">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <User size={11} /> Gérant Responsable
                    </h3>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Nom et Prénom</label>
                      <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">{c.manager_name}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Téléphone</label>
                        <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 truncate">{c.manager_phone}</div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Email</label>
                        <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 truncate">{c.manager_email}</div>
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
                          {c.kyc_status === 'APPROVED' ? 'Conformité KYC Approuvée' : c.kyc_status === 'REJECTED' ? 'KYC Rejeté' : "KYC en Attente d'Audit"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            <a
              href={`${API_URL}/api/orders/company/${user.company.id}/purchase-bulletin`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-lg bg-blue-950/40 border border-blue-900/50 text-blue-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-905/50 transition-all text-center"
            >
              📄 Télécharger mon Bulletin d'Achats & Situation B2B (PDF)
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setOldPasswordState('');
                  setNewPasswordState('');
                  setPasswordChangeError('');
                  setPasswordChangeSuccess('');
                  setShowPasswordModal(true);
                }}
                className="py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-700 transition-all"
              >
                <Key size={14} /> Modifier mon mot de passe
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('gmd_user');
                  window.location.href = '/login';
                }}
                className="py-3 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-red-950/50 transition-all"
              >
                <LogOut size={14} /> Déconnexion
              </button>
            </div>

            <div className="border-t border-border-custom pt-5 space-y-5">

              {/* Point 11 : Résumé mensualités impayées avec lien vers l'onglet Créances */}
              {getClientMaturities().filter(m => !m.paid).length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-amber-400">⚠️ Mensualités en attente</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Vous avez <strong className="text-white">{getClientMaturities().filter(m => !m.paid).length} mensualité(s)</strong> impayée(s).
                    </p>
                  </div>
                  <Link
                    to="/dashboard?tab=creances"
                    className="px-3 py-1.5 rounded-lg bg-amber-900/50 border border-amber-800/50 text-amber-300 text-[10px] font-bold shrink-0 hover:bg-amber-900/70 transition-colors"
                  >
                    Voir les créances →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ONGLET CREANCES : DESSIN DÉDIÉ ET ÉPURÉ ── */}
        {activeTab === 'creances' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Wallet2 size={16} className="text-zinc-400" />
                <h3 className="font-bold text-white text-sm">Suivi des Créances et En-cours</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${API_URL}/api/orders/company/${user.company.id}/purchase-bulletin`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-950/30 border border-blue-900/50 text-blue-400 hover:bg-blue-900/50 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                  📄 Bulletin d'Achats PDF
                </a>
                <button
                  onClick={fetchDashboardData}
                  className="p-1.5 rounded-lg bg-surface-custom border border-border-custom hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-all"
                  title="Rafraîchir les créances"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
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
              <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider">Plan d'échéances globales (12 Mois)</h4>
              <div className="rounded-xl bg-bg-deepest border border-border-custom overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Période</th>
                      <th className="p-3">📅 Date limite (10/mois)</th>
                      <th className="p-3">Montant cumulé</th>
                      <th className="p-3 text-right">Statut / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                    {getClientMaturities().map((mat, i) => (
                      <tr key={i} className="hover:bg-surface-custom/20 transition-colors">
                        <td className="p-3 font-semibold text-white">Mois {mat.installment_number}</td>
                        <td className="p-3 text-[10px]">{new Date(mat.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                        <td className="p-3 font-mono text-[10px]">
                          {showBalances ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-white">
                                {Number(mat.unpaidAmount).toLocaleString('fr-FR')} FCFA
                              </span>
                              {Number(mat.paidAmount) > 0 && (
                                <span className="text-zinc-500 text-[9px] font-semibold mt-0.5">
                                  Réglé : {Number(mat.paidAmount).toLocaleString('fr-FR')} / {Number(mat.amount).toLocaleString('fr-FR')}
                                </span>
                              )}
                            </div>
                          ) : '•••••• FCFA'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Reçus pour toutes les échéances déjà réglées */}
                            {mat.installments && mat.installments.filter(inst => inst.paid).length > 0 && (
                              <div className="flex flex-col items-end gap-1 mb-1">
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 uppercase flex items-center gap-1 self-end">
                                  <Check size={8} /> Réglé
                                </span>
                                {mat.installments.filter(inst => inst.paid).map((inst, idx) => (
                                  <a
                                    key={idx}
                                    href={`${API_URL}/api/orders/receipt/${inst.order_id}/${inst.installment_number}`}
                                    download
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-400 hover:text-white cursor-pointer transition-all text-[8px] font-bold"
                                    title={`Télécharger le reçu de l'échéance N°${inst.installment_number} (${inst.order_number})`}
                                  >
                                    <FileText size={8} /> Reçu {inst.order_number} (N°{inst.installment_number})
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Bouton de règlement pour les échéances restant à payer */}
                            {Number(mat.unpaidAmount) > 0 ? (
                              <button
                                onClick={() => handleOpenMonthlyDuePayment({ 
                                  amount: Number(mat.unpaidAmount), 
                                  dueDate: mat.due_date, 
                                  installments: mat.installments.filter(inst => !inst.paid) 
                                })}
                                disabled={paymentLoading}
                                className="px-3 py-1 rounded bg-primary-custom hover:bg-primary-hover text-white text-[10px] font-bold cursor-pointer disabled:opacity-60 transition-all shadow-md shadow-red-950/20"
                              >
                                Régler
                              </button>
                            ) : mat.amount === 0 ? (
                              <span className="text-zinc-500 text-[10px] italic">Aucun achat</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 uppercase flex items-center gap-1">
                                <Check size={9} /> Totalement Réglé
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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
                  {getPaidInstallments().reduce((sum, inst) => sum + Number(inst.amount), 0).toLocaleString('fr-FR')} <span className="text-xs text-zinc-400">FCFA</span>
                </h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                getUnpaidInstallmentsCount() === 0
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                  : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
              }`}>
                {getUnpaidInstallmentsCount() === 0 ? 'À JOUR' : `${getUnpaidInstallmentsCount()} EN ATTENTE`}
              </span>
            </div>

            <div className="rounded-xl bg-bg-deepest border border-border-custom overflow-x-auto">
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
                  {getPaidInstallments().length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-zinc-500 text-xs">
                        Aucun paiement effectué pour le moment.
                      </td>
                    </tr>
                  ) : (
                    getPaidInstallments().map((inst, i) => (
                      <tr key={i} className="hover:bg-surface-custom/20 transition-colors">
                        <td className="p-3 font-mono text-zinc-400 text-[10px]">{inst.order_number}</td>
                        <td className="p-3 text-[10px]">N°{inst.installment_number}</td>
                        <td className="p-3 text-[10px]">{inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('fr-FR') : '-'}</td>
                        <td className="p-3 font-bold font-mono text-white text-[10px]">{Number(inst.amount).toLocaleString('fr-FR')} FCFA</td>
                        <td className="p-3 text-right flex items-center justify-end gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 flex items-center gap-1"><Check size={9} /> PAYÉ</span>
                          <a
                            href={`${API_URL}/api/orders/receipt/${inst.order_id}/${inst.installment_number}`}
                            download
                            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-400 hover:text-white cursor-pointer transition-all text-[9px] font-bold"
                            title="Télécharger mon reçu PDF"
                          >
                            <FileText size={9} /> Télécharger mon reçu
                          </a>
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
                orders.map(order => {
                  const isExpanded = !!expandedOrders[order.id];
                  return (
                    <div key={order.id} className="rounded-xl bg-bg-deepest border border-border-custom overflow-hidden transition-all shadow-md">
                      {/* Collapsible Header */}
                      <div
                        onClick={() => toggleOrder(order.id)}
                        className="flex justify-between items-center p-4 bg-surface-custom/30 hover:bg-surface-custom/50 cursor-pointer transition-colors border-b border-border-custom/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-zinc-500 hover:text-white transition-colors">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs font-mono">{order.order_number}</p>
                            <p className="text-[9px] text-zinc-500">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-950/40 text-amber-400 border border-amber-900/40">
                            LIVRAISON EN COURS
                          </span>
                          <span className="text-[10px] font-bold text-zinc-300 font-mono">
                            {Number(order.total_amount).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </div>
                      
                      {/* Collapsible Content */}
                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-zinc-950/20">
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
                      )}
                    </div>
                  );
                })
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

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Key size={14} className="text-zinc-400" /> Modifier mon mot de passe
              </h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-sm font-bold bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePassword}>
              <div className="p-5 space-y-4">
                {passwordChangeError && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs">
                    {passwordChangeError}
                  </div>
                )}
                {passwordChangeSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs">
                    {passwordChangeSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      required
                      value={oldPasswordState}
                      onChange={e => setOldPasswordState(e.target.value)}
                      placeholder="Saisissez votre mot de passe actuel"
                      className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPasswordState}
                      onChange={e => setNewPasswordState(e.target.value)}
                      placeholder="Saisissez le nouveau mot de passe"
                      className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs font-semibold hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading || !oldPasswordState || !newPasswordState}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {passwordChangeLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardClient;
