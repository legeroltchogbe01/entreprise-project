import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck2, AlertTriangle, AlertCircle, RefreshCw, Send, DollarSign, Users, Award, Percent, X } from 'lucide-react';
import { API_URL } from '../config';

function DashboardAdmin() {
  const [companies, setCompanies] = useState([]);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State for Quoting
  const [quotes, setQuotes] = useState({}); // { requestId: price }
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Status management Loading
  const [actionLoading, setActionLoading] = useState(false);

  // Company Backup / Directory States
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySearch, setCompanySearch] = useState('');


  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch Stats
      const statsRes = await fetch(`${API_URL}/api/admin/stats`);
      const statsData = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsData.error);
      setStats(statsData);

      // Fetch Companies
      const compRes = await fetch(`${API_URL}/api/admin/companies`);
      const compData = await compRes.json();
      if (!compRes.ok) throw new Error(compData.error);
      setCompanies(compData);

      // Fetch Special Requests
      const specRes = await fetch(`${API_URL}/api/special-requests`);
      const specData = await specRes.json();
      if (!specRes.ok) throw new Error(specData.error);
      setSpecialRequests(specData);

      // Fetch schedules
      const schedRes = await fetch(`${API_URL}/api/admin/schedules`);
      const schedData = await schedRes.json();
      if (!schedRes.ok) throw new Error(schedData.error);
      setSchedules(schedData);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des données d\'administration.');
    } finally {
      setLoading(false);
    }
  };

  // Approve/Reject KYC
  const handleUpdateKyc = async (id, status) => {
    if (actionLoading) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/companies/${id}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit quote price estimates
  const handleSendQuote = async (requestId) => {
    const price = quotes[requestId];
    if (!price) {
      alert('Veuillez renseigner un prix pour émettre le devis.');
      return;
    }

    setQuoteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/special-requests/${requestId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estimatedPrice: parseFloat(price) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setQuotes({ ...quotes, [requestId]: '' });
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleQuotePriceChange = (requestId, value) => {
    setQuotes({ ...quotes, [requestId]: value });
  };

  // Trigger simulated WhatsApp relance message
  const handleTriggerWhatsApp = async (item, type) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: item.company_name,
          phone: item.company_phone,
          amount: item.amount,
          dueDate: item.due_date,
          type
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`[Relance Simulée OK]\n${data.message}`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-main">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin text-primary-hover mx-auto" size={32} />
          <p className="text-zinc-500 text-sm">Chargement de la console administrative...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 bg-bg-main">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border-custom pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Back-office Administratif</h2>
          <p className="text-sm text-zinc-400">Gestion KYC, chiffrage des devis et suivi algorithmique du risque</p>
        </div>
        <button 
          onClick={fetchAdminData}
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

      {/* STATS OVERVIEW CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card: Total Companies */}
          <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Entreprises Enregistrées</p>
              <h3 className="text-2xl font-bold text-white font-mono">{stats.companiesCount}</h3>
              <p className="text-[9px] text-primary-hover font-semibold">{stats.pendingKycCount} En attente d'approbation</p>
            </div>
            <Users size={32} className="text-zinc-700 shrink-0" />
          </div>

          {/* Card: Total Credit Granted */}
          <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Crédit Global Accordé</p>
              <h3 className="text-xl font-bold text-white font-mono truncate max-w-[160px]">{stats.totalCreditLimit.toLocaleString('fr-FR')} <span className="text-[10px] text-zinc-500">FCFA</span></h3>
              <p className="text-[9px] text-zinc-400">Consommé : {stats.totalCreditUsed.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <DollarSign size={32} className="text-zinc-700 shrink-0" />
          </div>

          {/* Card: Debt Outstanding */}
          <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Restant à Recouvrer</p>
              <h3 className="text-xl font-bold text-white font-mono truncate max-w-[160px]">{stats.totalUnpaid.toLocaleString('fr-FR')} <span className="text-[10px] text-zinc-500">FCFA</span></h3>
              <p className="text-[9px] text-zinc-400">Remboursé : {stats.totalPaid.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <Award size={32} className="text-zinc-700 shrink-0" />
          </div>

          {/* Card: Recovery Rate */}
          <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom flex items-center justify-between font-mono">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Taux de Recouvrement</p>
              <h3 className="text-2xl font-bold text-white">{stats.recoveryRate} %</h3>
              <div className="w-24 h-1 bg-surface-custom rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.recoveryRate}%` }}></div>
              </div>
            </div>
            <Percent size={32} className="text-zinc-700 shrink-0" />
          </div>
        </div>
      )}

      {/* ADMIN CONTROLS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* KYC AUDIT PANEL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-zinc-400" />
            <h3 className="font-bold text-white text-lg">Vérification des Dossiers KYC</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {companies.filter(c => c.kyc_status === 'PENDING').length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10 border border-dashed border-border-custom rounded-lg bg-bg-deepest">
                Aucun dossier de conformité KYC en attente d'audit.
              </p>
            ) : (
              companies.filter(c => c.kyc_status === 'PENDING').map((company) => (
                <div key={company.id} className="p-5 rounded-lg bg-bg-deepest border border-border-custom space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{company.denomination_sociale}</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 font-mono">ID: {company.id}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/40 text-amber-400 border border-amber-900/50">
                      EN ATTENTE AUDIT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-zinc-400 border-t border-border-custom/50 pt-3">
                    <div>
                      <p className="font-semibold text-zinc-300">Entreprise</p>
                      <p className="mt-1">RCCM: {company.rccm_number}</p>
                      <p>IFU: {company.ifu_number}</p>
                      <p>Tél: {company.phone}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-300">Gérant & Garant</p>
                      <p className="mt-1">Gérant: {company.manager_name}</p>
                      <p>Garant: {company.guarantor_name}</p>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="p-3 rounded bg-surface-custom/30 border border-border-custom/40 space-y-2 text-xs">
                    <p className="font-semibold text-zinc-300">Pièces d'identité & Selfies :</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <a href={`${API_URL}/uploads/${company.manager_cip_pdf}`} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">
                        📄 CIP Gérant (PDF)
                      </a>
                      <a href={`${API_URL}/uploads/${company.manager_selfie}`} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">
                        🖼️ Selfie Gérant (Photo)
                      </a>
                      <a href={`${API_URL}/uploads/${company.guarantor_cip_pdf}`} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">
                        📄 CIP Garant (PDF)
                      </a>
                      <a href={`${API_URL}/uploads/${company.guarantor_selfie}`} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">
                        🖼️ Selfie Garant (Photo)
                      </a>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => handleUpdateKyc(company.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded bg-surface-custom border border-border-custom hover:bg-red-950/20 hover:border-red-900 text-zinc-400 hover:text-red-400 text-xs font-semibold cursor-pointer transition-all"
                    >
                      Rejeter
                    </button>
                    <button
                      onClick={() => handleUpdateKyc(company.id, 'APPROVED')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded bg-primary-custom hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-red-950/20"
                    >
                      Approuver le dossier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CUSTOM ESTIMATES QUOTER PANEL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 size={18} className="text-zinc-400" />
            <h3 className="font-bold text-white text-lg">Chiffrage des Commandes Spéciales</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {specialRequests.filter(r => r.status === 'SUBMITTED').length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10 border border-dashed border-border-custom rounded-lg bg-bg-deepest">
                Aucune commande sur-mesure en attente de tarification.
              </p>
            ) : (
              specialRequests.filter(r => r.status === 'SUBMITTED').map((req) => (
                <div key={req.id} className="p-5 rounded-lg bg-bg-deepest border border-border-custom space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">Client : {req.company.denomination_sociale}</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Soumis le : {new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                      À CHIFFRER (SOUS 48H)
                    </span>
                  </div>

                  <div className="p-3.5 rounded bg-surface-custom/30 border border-border-custom/50 text-xs text-zinc-300 space-y-2">
                    <p className="font-semibold text-zinc-400">Description du Mobilier :</p>
                    <p className="leading-relaxed font-mono text-[11px]">{req.description}</p>
                    <p className="font-semibold text-zinc-400 pt-1">Quantité : {req.quantity} article(s)</p>
                  </div>

                  {/* Estimation Input Form */}
                  <div className="flex items-center gap-3 border-t border-border-custom/50 pt-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Estimation Coût (FCFA)"
                        value={quotes[req.id] || ''}
                        onChange={(e) => handleQuotePriceChange(req.id, e.target.value)}
                        className="w-full px-3 py-2 rounded bg-surface-custom/50 border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom"
                      />
                    </div>
                    <button
                      onClick={() => handleSendQuote(req.id)}
                      disabled={quoteLoading}
                      className="px-4 py-2 rounded bg-primary-custom hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
                    >
                      <Send size={12} /> Émettre le Devis
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MATRICIAL VIEW OF PAYMENTS & WHATSAPP RELANCES */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-zinc-400" />
          <h3 className="font-bold text-white text-lg">Pivot des Créances & Gestion du Risque de Recouvrement</h3>
        </div>

        <div className="rounded-lg bg-bg-deepest border border-border-custom overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Client B2B</th>
                  <th className="p-4">N° Commande</th>
                  <th className="p-4">Mensualité N°</th>
                  <th className="p-4">Maturité</th>
                  <th className="p-4">Montant Requis</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-center">Simuler Relance WhatsApp (Reminders)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-zinc-500">
                      Aucune créance enregistrée.
                    </td>
                  </tr>
                ) : (
                  schedules.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-custom/20 transition-colors">
                      <td className="p-4 font-semibold text-white">{item.company_name}</td>
                      <td className="p-4 font-mono text-zinc-400">{item.order_number}</td>
                      <td className="p-4">Mensualité {item.installment_number}</td>
                      <td className="p-4">{new Date(item.due_date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4 font-bold font-mono text-white">{Number(item.amount).toLocaleString('fr-FR')} FCFA</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.paid ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-red-950/40 text-red-400 border border-red-900/40'
                        }`}>
                          {item.paid ? 'RÉGLÉ' : 'RECOUVREMENT'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {!item.paid ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleTriggerWhatsApp(item, 'J-3')}
                              className="px-2.5 py-1 rounded bg-surface-custom border border-border-custom hover:bg-zinc-800 text-[10px] text-zinc-300 font-semibold cursor-pointer"
                              title="Relancer à J-3"
                            >
                              J-3
                            </button>
                            <button
                              onClick={() => handleTriggerWhatsApp(item, 'J+1')}
                              className="px-2.5 py-1 rounded bg-surface-custom border border-border-custom hover:bg-amber-950/20 hover:border-amber-900 text-[10px] text-amber-400 font-semibold cursor-pointer"
                              title="Relancer à J+1"
                            >
                              J+1
                            </button>
                            <button
                              onClick={() => handleTriggerWhatsApp(item, 'J+7')}
                              className="px-2.5 py-1 rounded bg-surface-custom border border-border-custom hover:bg-red-950/20 hover:border-red-900 text-[10px] text-red-400 font-semibold cursor-pointer"
                              title="Avertissement J+7"
                            >
                              J+7
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">-</span>
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

      {/* DIRECTORY & BACKUP PANEL */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-zinc-400" />
            <h3 className="font-bold text-white text-lg">Annuaire & Sauvegarde des Dossiers Entreprises</h3>
          </div>
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            className="px-3 py-1.5 rounded bg-bg-deepest border border-border-custom text-zinc-105 text-xs focus:outline-none focus:border-primary-custom w-full sm:w-64"
          />
        </div>

        <div className="rounded-lg bg-bg-deepest border border-border-custom overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Dénomination</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Téléphone</th>
                  <th className="p-4">Statut KYC</th>
                  <th className="p-4">Date d'inscription</th>
                  <th className="p-4 text-center">Sauvegarde des Infos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                {companies.filter(c => 
                  c.denomination_sociale.toLowerCase().includes(companySearch.toLowerCase()) ||
                  c.email.toLowerCase().includes(companySearch.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-zinc-500">
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                ) : (
                  companies.filter(c => 
                    c.denomination_sociale.toLowerCase().includes(companySearch.toLowerCase()) ||
                    c.email.toLowerCase().includes(companySearch.toLowerCase())
                  ).map((c) => (
                    <tr key={c.id} className="hover:bg-surface-custom/20 transition-colors">
                      <td className="p-4 font-semibold text-white">{c.denomination_sociale}</td>
                      <td className="p-4 font-mono text-zinc-400">{c.email}</td>
                      <td className="p-4">{c.phone}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.kyc_status === 'APPROVED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' :
                          c.kyc_status === 'REJECTED' ? 'bg-red-950/40 text-red-400 border border-red-900/40' :
                          'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                        }`}>
                          {c.kyc_status === 'APPROVED' ? 'APPROUVÉ' : c.kyc_status === 'REJECTED' ? 'REJETÉ' : 'EN ATTENTE'}
                        </span>
                      </td>
                      <td className="p-4">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedCompany(c)}
                          className="px-2.5 py-1 rounded bg-surface-custom border border-border-custom hover:bg-zinc-800 text-[10px] text-zinc-300 font-semibold cursor-pointer"
                        >
                          📄 Consulter les Infos
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

      {/* COMPANY DETAIL & BACKUP MODAL */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm overflow-y-auto">
          <div className="modal-scale w-full max-w-4xl bg-[#0f0f11] border border-zinc-900 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-8">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="font-bold text-white text-lg uppercase tracking-wider">
                  Sauvegarde Dossier : {selectedCompany.denomination_sociale}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 font-mono">ID unique : {selectedCompany.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="icon-btn w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[50vh] overflow-y-auto pr-1">
              
              {/* Col 1: Entreprise Info */}
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom space-y-3.5">
                <h4 className="font-bold text-xs text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
                  01. Informations Entreprise
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Dénomination sociale</span>
                    <span className="text-white font-medium">{selectedCompany.denomination_sociale}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">N° RCCM</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.rccm_number}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">N° IFU</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.ifu_number}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Téléphone</span>
                    <span className="text-zinc-300">{selectedCompany.phone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Email officiel</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.email}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-900 space-y-1">
                    <span className="text-zinc-400 font-semibold block">Adresse Géographique</span>
                    <p className="text-zinc-300">
                      {selectedCompany.house}, Carré {selectedCompany.square}<br />
                      Quartier {selectedCompany.district}<br />
                      {selectedCompany.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Col 2: Gérant Info */}
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom space-y-3.5">
                <h4 className="font-bold text-xs text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
                  02. Informations du Gérant
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Nom et Prénom</span>
                    <span className="text-white font-medium">{selectedCompany.manager_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">N° RCCM (si applicable)</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.manager_rccm || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">N° IFU</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.manager_ifu}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Téléphone</span>
                    <span className="text-zinc-300">{selectedCompany.manager_phone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Email</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.manager_email}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-900 space-y-1">
                    <span className="text-zinc-400 font-semibold block">Adresse Géographique</span>
                    <p className="text-zinc-300">
                      {selectedCompany.manager_house}, Carré {selectedCompany.manager_square}<br />
                      Quartier {selectedCompany.manager_district}<br />
                      {selectedCompany.manager_city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Col 3: Garant Info */}
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom space-y-3.5">
                <h4 className="font-bold text-xs text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
                  03. Informations de l'Avaliseur
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Nom et Prénom</span>
                    <span className="text-white font-medium">{selectedCompany.guarantor_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">N° RCCM (si applicable)</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.guarantor_rccm || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">N° IFU</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.guarantor_ifu}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Téléphone</span>
                    <span className="text-zinc-300">{selectedCompany.guarantor_phone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-550 block">Email</span>
                    <span className="text-zinc-300 font-mono">{selectedCompany.guarantor_email}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-900 space-y-1">
                    <span className="text-zinc-400 font-semibold block">Adresse Géographique</span>
                    <p className="text-zinc-300">
                      {selectedCompany.guarantor_house}, Carré {selectedCompany.guarantor_square}<br />
                      Quartier {selectedCompany.guarantor_district}<br />
                      {selectedCompany.guarantor_city}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Documents Section at bottom of modal */}
            <div className="mt-6 p-4 rounded-lg bg-bg-deepest border border-border-custom space-y-3">
              <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
                Pièces Justificatives (Téléchargement et consultation)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <a 
                  href={`${API_URL}/uploads/${selectedCompany.manager_cip_pdf}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-3 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="text-lg">📄</span>
                  <span className="font-semibold mt-1">CIP Gérant (PDF)</span>
                </a>
                <a 
                  href={`${API_URL}/uploads/${selectedCompany.manager_selfie}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-3 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="text-lg">📹</span>
                  <span className="font-semibold mt-1">Selfie Vidéo Gérant</span>
                </a>
                <a 
                  href={`${API_URL}/uploads/${selectedCompany.guarantor_cip_pdf}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-3 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="text-lg">📄</span>
                  <span className="font-semibold mt-1">CIP Garant (PDF)</span>
                </a>
                <a 
                  href={`${API_URL}/uploads/${selectedCompany.guarantor_selfie}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-3 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="text-lg">📹</span>
                  <span className="font-semibold mt-1">Selfie Vidéo Garant</span>
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end mt-6 border-t border-zinc-900 pt-4">
              <button 
                onClick={() => setSelectedCompany(null)}
                className="px-5 py-2 rounded bg-surface-custom hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default DashboardAdmin;
