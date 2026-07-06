import React, { useState, useEffect } from 'react';
import { Wallet2, Calendar, FileText, Send, Check, AlertCircle, RefreshCw } from 'lucide-react';
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

      // Fetch Wallet
      const wRes = await fetch(`${API_URL}/api/wallets/${user.company.id}`);
      const wData = await wRes.json();
      if (!wRes.ok) throw new Error(wData.error);
      setWallet(wData);

      // Fetch Orders
      const oRes = await fetch(`${API_URL}/api/orders/company/${user.company.id}`);
      const oData = await oRes.json();
      if (!oRes.ok) throw new Error(oData.error);
      setOrders(oData);

      // Fetch Special Requests
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

  // Pay single maturity installment
  const handlePayInstallment = async (orderId, installmentNumber) => {
    if (paymentLoading) return;
    setPaymentLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/pay-installment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

  // Submit custom request
  const handleSubmitSpecialRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!description || !quantity) return;

    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/special-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

  // Approve admin quote
  const handleApproveQuote = async (requestId) => {
    if (paymentLoading) return;
    setPaymentLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/special-requests/${requestId}/approve`, {
        method: 'POST'
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

  // Calculate current week custom quota usage
  const getWeeklyQuotaUsed = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recent = specialRequests.filter(req => {
      return new Date(req.created_at) >= oneWeekAgo && req.status !== 'REJECTED';
    });

    return recent.reduce((sum, req) => sum + req.quantity, 0);
  };

  // Flatten all schedules to display in the client Maturities table
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
    // Sort by due date
    return list.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
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

  const weeklyQuota = getWeeklyQuotaUsed();

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 bg-bg-main">
      <div className="flex justify-between items-center border-b border-border-custom pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Espace Client</h2>
          <p className="text-sm text-zinc-400">Pilotez votre ligne de crédit et vos approvisionnements</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-2 rounded bg-surface-custom border border-border-custom hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-all"
          title="Rafraîchir"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded bg-red-950/30 border border-red-900/50 text-red-300 text-sm flex gap-3">
          <AlertCircle className="shrink-0" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* WALLET SUMMARY HUB */}
      {wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Status & Registration */}
          <div className="p-6 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between space-y-4">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Compte & Statut</p>
              <h3 className="font-bold text-white text-lg mt-1 truncate">{user.company.denomination_sociale}</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Audit Conformité KYC</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  wallet.company.kyc_status === 'APPROVED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                }`}>
                  {wallet.company.kyc_status === 'APPROVED' ? 'APPROUVÉ' : 'EN ATTENTE'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Date d'Activation</span>
                <span className="text-zinc-300 font-medium">
                  {wallet.activated_at ? new Date(wallet.activated_at).toLocaleDateString('fr-FR') : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Portfolio Acompte */}
          <div className="p-6 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-custom/5 blur-[40px] rounded-full"></div>
            
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Wallet2 size={14} className="text-zinc-400" /> Volet Acompte (1/3)</p>
              <h3 className="font-bold text-white text-2xl mt-2 font-mono">
                {Number(wallet.acompte_restant).toLocaleString('fr-FR')} <span className="text-xs text-zinc-400">FCFA</span>
              </h3>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-1 bg-surface-custom rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-custom"
                  style={{ width: wallet.activated_at ? `${(Number(wallet.acompte_restant) / Number(wallet.acompte_initial)) * 100}%` : '0%' }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase">
                <span>Consommé</span>
                <span>Disponible sur {Number(wallet.acompte_initial).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          {/* Card: Portfolio Credit */}
          <div className="p-6 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-glow/5 blur-[40px] rounded-full"></div>
            
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Wallet2 size={14} className="text-zinc-400" /> Volet Crédit (2/3)</p>
              <h3 className="font-bold text-white text-2xl mt-2 font-mono">
                {(Number(wallet.credit_initial) - Number(wallet.credit_utilise)).toLocaleString('fr-FR')} <span className="text-xs text-zinc-400">FCFA</span>
              </h3>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-1 bg-surface-custom rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-800"
                  style={{ width: wallet.activated_at ? `${((Number(wallet.credit_initial) - Number(wallet.credit_utilise)) / Number(wallet.credit_initial)) * 100}%` : '0%' }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase">
                <span>Dette active: {Number(wallet.credit_utilise).toLocaleString('fr-FR')} FCFA</span>
                <span>Limite: {Number(wallet.credit_initial).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETTS & MATURITIES TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table of Installments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-zinc-400" />
            <h3 className="font-bold text-white text-lg">Échéancier de Remboursement</h3>
          </div>

          <div className="rounded-lg bg-bg-deepest border border-border-custom overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">N° Commande</th>
                    <th className="p-4">Maturité N°</th>
                    <th className="p-4">Date Limite</th>
                    <th className="p-4">Montant Due</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                  {getClientMaturities().length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-zinc-500">
                        Aucun échéancier de créance actif.
                      </td>
                    </tr>
                  ) : (
                    getClientMaturities().map((mat, i) => (
                      <tr key={i} className="hover:bg-surface-custom/20 transition-colors">
                        <td className="p-4 font-mono font-semibold text-zinc-400">{mat.order_number}</td>
                        <td className="p-4">Échéance {mat.installment_number}</td>
                        <td className="p-4 font-medium">{new Date(mat.due_date).toLocaleDateString('fr-FR')}</td>
                        <td className="p-4 font-bold font-mono text-white">{Number(mat.amount).toLocaleString('fr-FR')} FCFA</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mat.paid ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-red-950/40 text-red-400 border border-red-900/40'
                          }`}>
                            {mat.paid ? 'PAYÉ' : 'IMPAYÉ'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {!mat.paid && (
                            <button
                              onClick={() => handlePayInstallment(mat.order_id, mat.installment_number)}
                              disabled={paymentLoading}
                              className="px-3 py-1 rounded bg-primary-custom hover:bg-primary-hover text-white text-[11px] font-semibold cursor-pointer disabled:opacity-60 transition-all"
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

        {/* CUSTOM DEVIATION FORM (SUR-MESURE) */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-zinc-400" />
              <h3 className="font-bold text-white text-lg">Demande Spéciale (Sur-mesure)</h3>
            </div>

            {/* Quota Progress Bar */}
            <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom space-y-2">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Quota de Soumission (7j)</span>
                <span className="text-zinc-200">{weeklyQuota} / 30 articles</span>
              </div>
              <div className="w-full h-1.5 bg-surface-custom rounded-full overflow-hidden">
                <div 
                  className={`h-full ${weeklyQuota >= 30 ? 'bg-red-500' : 'bg-primary-custom'}`}
                  style={{ width: `${(weeklyQuota / 30) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Limite stricte de 30 articles par semaine contractuelle. Le back-office émettra un devis sous 48h.
              </p>
            </div>

            {/* Submit Request Form */}
            <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom space-y-4">
              {formError && (
                <div className="p-3 rounded bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs flex gap-2">
                  <Check size={14} className="shrink-0 mt-0.5" />
                  <p>{formSuccess}</p>
                </div>
              )}

              <form onSubmit={handleSubmitSpecialRequest} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1.5">Description Technique du Mobilier</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Table de conférence ovale en noyer de 4m x 1.5m avec piétements noirs mats..."
                    rows="3"
                    className="w-full px-3 py-2 rounded bg-surface-custom/50 border border-border-custom text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-primary-custom resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1.5">Quantité d'Articles</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-surface-custom/50 border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading || weeklyQuota >= 30}
                  className="w-full py-2.5 rounded bg-primary-custom hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
                >
                  <Send size={12} /> Soumettre la demande
                </button>
              </form>
            </div>
          </div>

          {/* Special Requests Log */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider">Suivi des Demandes Spéciales</h4>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {specialRequests.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-6 border border-dashed border-border-custom rounded-lg">Aucune demande spéciale initiée.</p>
              ) : (
                specialRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded bg-bg-deepest border border-border-custom text-xs space-y-3.5">
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
                      <span>Quantité : {req.quantity}</span>
                      <span>
                        {req.estimated_price ? `${Number(req.estimated_price).toLocaleString('fr-FR')} FCFA` : 'Coût non défini'}
                      </span>
                    </div>

                    {req.status === 'QUOTED' && (
                      <button
                        onClick={() => handleApproveQuote(req.id)}
                        disabled={paymentLoading}
                        className="w-full py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[11px] cursor-pointer transition-all shadow shadow-emerald-950/40"
                      >
                        Accepter le Devis (Démarrer Contrat)
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
  );
}

export default DashboardClient;
