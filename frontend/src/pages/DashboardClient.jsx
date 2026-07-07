import React, { useState, useEffect } from 'react';
import { Wallet2, Calendar, FileText, Send, Check, AlertCircle, RefreshCw, User, Phone, Mail, MapPin, CreditCard, LogOut, KeyRound } from 'lucide-react';
import { API_URL } from '../config';

function DashboardClient({ user }) {
  const [wallet, setWallet] = useState(null);
  const [orders, setOrders] = useState([]);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Special Request Form State
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Payment State
  const [paymentLoading, setPaymentLoading] = useState(false);

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

    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
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
      const res = await fetch(`${API_URL}/api/special-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user.company.id,
          description,
          quantity: parseInt(quantity)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormSuccess(data.message);
      setDescription('');
      setQuantity('1');
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

  const getNextPayment = () => {
    const maturities = getClientMaturities();
    const unpaid = maturities.filter(m => !m.paid);
    if (unpaid.length === 0) return null;
    return unpaid[0];
  };

  const getTotalRemaining = () => {
    const maturities = getClientMaturities();
    return maturities.filter(m => !m.paid).reduce((sum, m) => sum + Number(m.amount), 0);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-main">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin text-primary-hover mx-auto" size={32} />
          <p className="text-zinc-500 text-sm">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const nextPayment = getNextPayment();
  const totalRemaining = getTotalRemaining();
  const weeklyQuota = getWeeklyQuotaUsed();
  const company = user.company;

  return (
    <div className="flex-1 bg-bg-main relative">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── TITLE ──────────────────── */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Mon profil</h2>
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

        {/* ── PAYMENT CARD ──────────── */}
        <div className="p-4 rounded-xl bg-bg-deepest border border-border-custom">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-950/50 border border-emerald-900/40 flex items-center justify-center">
                <CreditCard size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Prochain versement</p>
                <h3 className="text-xl font-bold text-white font-mono">
                  {nextPayment ? `${Number(nextPayment.amount).toLocaleString('fr-FR')}` : '0'} <span className="text-xs text-zinc-400">FCFA</span>
                </h3>
              </div>
            </div>
            {nextPayment && (
              <button
                onClick={() => handlePayInstallment(nextPayment.order_id, nextPayment.installment_number)}
                disabled={paymentLoading}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow shadow-emerald-950/40 disabled:opacity-60 shrink-0"
              >
                <CreditCard size={13} /> Payer
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-surface-custom border border-border-custom text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5">
              <Calendar size={11} />
              {nextPayment ? new Date(nextPayment.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pas de date de paiement'}
            </span>
          </div>
        </div>

        {/* ── AVATAR + TOTAL REMAINING ── */}
        <div className="p-5 rounded-xl bg-bg-deepest border border-border-custom text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-custom border-2 border-border-custom flex items-center justify-center">
            <User size={36} className="text-zinc-500" />
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-surface-custom rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-custom transition-all duration-500"
                style={{ width: wallet && wallet.credit_initial > 0 ? `${(Number(wallet.credit_utilise) / Number(wallet.credit_initial)) * 100}%` : '0%' }}
              ></div>
            </div>
            <p className="text-xs text-zinc-400">
              Total restant dû: <span className="text-white font-bold font-mono">{totalRemaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA</span>
            </p>
          </div>
        </div>

        {/* ── IDENTITY SECTION ────────── */}
        <div className="p-5 rounded-xl bg-bg-deepest border border-border-custom space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Identité Client</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Nom complet</label>
              <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                {company.manager_name || company.denomination_sociale}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Email</label>
              <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200 truncate">
                {company.email}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Téléphone</label>
              <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                {company.phone}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Ville</label>
              <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                {company.city}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">Adresse</label>
              <div className="w-full px-4 py-2.5 rounded-lg bg-surface-custom/50 border border-border-custom text-sm text-zinc-200">
                {company.district}{company.house ? `, ${company.house}` : ''}
              </div>
            </div>
          </div>

          <button className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer transition-all">
            Modifier mes infos
          </button>
        </div>

        {/* ── CONTACT & ACTION BUTTONS ── */}
        <div className="grid grid-cols-2 gap-3">
          <a 
            href={`tel:${company.phone || '+22997000000'}`}
            className="py-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-950/50 transition-all"
          >
            <Phone size={13} /> Nous appeler
          </a>
          <a 
            href={`mailto:contact@gmd-creance.com`}
            className="py-3 rounded-lg bg-surface-custom border border-border-custom text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-800 transition-all"
          >
            <Mail size={13} /> Nous contacter
          </a>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('gmd_user');
            window.location.href = '/login';
          }}
          className="w-full py-3 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-red-950/50 transition-all"
        >
          <LogOut size={14} /> Déconnexion
        </button>

        <div className="text-center">
          <a href="#" className="text-xs text-blue-400 underline hover:text-blue-300 transition-colors">
            Mot de passe oublié
          </a>
        </div>

        {/* ── SEPARATOR ────────────────── */}
        <div className="border-t border-border-custom pt-6">

        {/* ── WALLET DETAILS (Acompte + Crédit) ── */}
        {wallet && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-bg-deepest border border-border-custom space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-custom/5 blur-[30px] rounded-full"></div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Wallet2 size={12} className="text-zinc-400" /> Acompte (1/3)
              </p>
              <h3 className="font-bold text-white text-lg font-mono">
                {Number(wallet.acompte_restant).toLocaleString('fr-FR')} <span className="text-[10px] text-zinc-400">FCFA</span>
              </h3>
              <div className="w-full h-1 bg-surface-custom rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-custom"
                  style={{ width: wallet.activated_at ? `${(Number(wallet.acompte_restant) / Number(wallet.acompte_initial)) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-bg-deepest border border-border-custom space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-glow/5 blur-[30px] rounded-full"></div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Wallet2 size={12} className="text-zinc-400" /> Crédit (2/3)
              </p>
              <h3 className="font-bold text-white text-lg font-mono">
                {(Number(wallet.credit_initial) - Number(wallet.credit_utilise)).toLocaleString('fr-FR')} <span className="text-[10px] text-zinc-400">FCFA</span>
              </h3>
              <div className="w-full h-1 bg-surface-custom rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-800"
                  style={{ width: wallet.activated_at ? `${((Number(wallet.credit_initial) - Number(wallet.credit_utilise)) / Number(wallet.credit_initial)) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* ── MATURITIES TABLE ────────── */}
        <div className="space-y-3 mb-6">
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
                        Aucun échéancier actif.
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

        {/* ── SPECIAL REQUEST FORM ──── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-zinc-400" />
            <h3 className="font-bold text-white text-sm">Demande Spéciale (Sur-mesure)</h3>
          </div>

          {/* Quota */}
          <div className="p-4 rounded-xl bg-bg-deepest border border-border-custom space-y-2">
            <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
              <span>Quota (7j)</span>
              <span className="text-zinc-200">{weeklyQuota} / 30</span>
            </div>
            <div className="w-full h-1.5 bg-surface-custom rounded-full overflow-hidden">
              <div 
                className={`h-full ${weeklyQuota >= 30 ? 'bg-red-500' : 'bg-primary-custom'}`}
                style={{ width: `${(weeklyQuota / 30) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form */}
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
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Table de conférence ovale en noyer..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg bg-surface-custom/50 border border-border-custom text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-primary-custom resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  required
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

          {/* Requests Log */}
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
    </div>
  );
}

export default DashboardClient;
