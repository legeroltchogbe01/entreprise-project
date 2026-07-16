import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck2, AlertTriangle, AlertCircle, RefreshCw, Send, DollarSign, Users, Award, Percent, X, PackageOpen, Plus, Trash2, Image as ImageIcon, Edit3, Tag, FileText, Video, Clock, Check, Package } from 'lucide-react';
import { API_URL } from '../config';

function DashboardAdmin() {
  const [companies, setCompanies] = useState([]);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  // Orders
  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // Reports
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('monthly');
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State for Quoting
  const [quotes, setQuotes] = useState({}); // { requestId: price }
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Status management Loading
  const [actionLoading, setActionLoading] = useState(false);

  // Advanced Quoter States
  const [activeQuoteId, setActiveQuoteId] = useState(null); // specialRequest id being quoted
  const [quoteRows, setQuoteRows] = useState([]); // [{ article, price, quantity, total }]
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteTotal, setQuoteTotal] = useState(0);

  // Contract Customizer States
  const [selectedContractId, setSelectedContractId] = useState(null); // specialRequest id to edit contract for
  const [contractContent, setContractContent] = useState('');
  const [contractLoading, setContractLoading] = useState(false);

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'kyc', 'devis', 'contracts', 'risk', 'products'

  // Company Backup / Directory States
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySearch, setCompanySearch] = useState('');
  const [kycSearch, setKycSearch] = useState('');
  const [devisSearch, setDevisSearch] = useState('');
  const [contractsSearch, setContractsSearch] = useState('');
  const [riskSearch, setRiskSearch] = useState('');
  const [profileUpdatesSearch, setProfileUpdatesSearch] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [productsSearch, setProductsSearch] = useState('');

  // Products States
  const [products, setProducts] = useState([]);
  const [productFields, setProductFields] = useState([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductImage, setNewProductImage] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [newProductCustomValues, setNewProductCustomValues] = useState({});
  const [newProductMotifs, setNewProductMotifs] = useState([]); // [{ name, image_url }]
  const [newMotifName, setNewMotifName] = useState('');
  const [motifUploadLoading, setMotifUploadLoading] = useState(false);

  // Dynamic field creation states
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [fieldLoading, setFieldLoading] = useState(false);

  // Categories States
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryImage, setEditCategoryImage] = useState(null);

  // Product Edit Modal States
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('');
  const [editProductImage, setEditProductImage] = useState(null);
  const [editProductCustomValues, setEditProductCustomValues] = useState({});
  const [editProductLoading, setEditProductLoading] = useState(false);
  const [editProductMotifs, setEditProductMotifs] = useState([]); // [{ name, image_url }]
  const [editMotifName, setEditMotifName] = useState('');

  // Wallet Activation & System Settings States
  const [minActivationDeposit, setMinActivationDeposit] = useState(5000000);
  const [purchaseEligibilityPeriod, setPurchaseEligibilityPeriod] = useState(4);
  const [kkiapaySubaccount13, setKkiapaySubaccount13] = useState('');
  const [kkiapaySubaccount23, setKkiapaySubaccount23] = useState('');
  const [isEditingSubaccount13, setIsEditingSubaccount13] = useState(false);
  const [isEditingSubaccount23, setIsEditingSubaccount23] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  // Profile update requests
  const [profileUpdateRequests, setProfileUpdateRequests] = useState([]);
  const [profileUpdateActionLoading, setProfileUpdateActionLoading] = useState(false);
  const [adminNoteMap, setAdminNoteMap] = useState({});

  // Bulk product selection
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Auto-load orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && allOrders.length === 0) {
      setOrdersLoading(true);
      fetch(`${API_URL}/api/admin/orders?t=${Date.now()}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setAllOrders(data))
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch Stats
      const statsRes = await fetch(`${API_URL}/api/admin/stats?t=${Date.now()}`);
      const statsData = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsData.error);
      setStats(statsData);

      // Fetch Companies
      const compRes = await fetch(`${API_URL}/api/admin/companies?t=${Date.now()}`);
      const compData = await compRes.json();
      if (!compRes.ok) throw new Error(compData.error);
      setCompanies(compData);

      // Fetch Special Requests
      const specRes = await fetch(`${API_URL}/api/special-requests?t=${Date.now()}`);
      const specData = await specRes.json();
      if (!specRes.ok) throw new Error(specData.error);
      setSpecialRequests(specData);

      // Fetch schedules
      const schedRes = await fetch(`${API_URL}/api/admin/schedules?t=${Date.now()}`);
      const schedData = await schedRes.json();
      if (!schedRes.ok) throw new Error(schedData.error);
      setSchedules(schedData);

      // Fetch Products
      const prodRes = await fetch(`${API_URL}/api/products`);
      const prodData = await prodRes.json();
      if (!prodRes.ok) throw new Error(prodData.error);
      setProducts(prodData);

      // Fetch Product Fields
      const fieldsRes = await fetch(`${API_URL}/api/admin/product-fields`);
      const fieldsData = await fieldsRes.json();
      if (fieldsRes.ok) setProductFields(fieldsData);

      // Fetch Categories
      const catRes = await fetch(`${API_URL}/api/admin/categories`);
      const catData = await catRes.json();
      if (catRes.ok) setCategories(catData);

      // Fetch Settings
      const setRes = await fetch(`${API_URL}/api/admin/settings`);
      const setData = await setRes.json();
      if (setRes.ok) {
        setMinActivationDeposit(setData.minActivationDeposit);
        setPurchaseEligibilityPeriod(setData.purchaseEligibilityPeriod || 4);
        setKkiapaySubaccount13(setData.kkiapaySubaccount13 || '');
        setKkiapaySubaccount23(setData.kkiapaySubaccount23 || '');
      }

      // Fetch Profile Update Requests
      const purRes = await fetch(`${API_URL}/api/profile-update-requests/admin/all`);
      if (purRes.ok) {
        const purData = await purRes.json();
        setProfileUpdateRequests(purData);
      }

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

  // Submit quote price estimates with dynamic items table
  const handleSendQuote = async (requestId) => {
    if (quoteRows.length === 0) {
      alert('Veuillez ajouter au moins un article au devis.');
      return;
    }

    setQuoteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/special-requests/${requestId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteItems: quoteRows,
          quoteNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setActiveQuoteId(null);
      setQuoteRows([]);
      setQuoteNotes('');
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  // Submit contract customization
  const handleSaveContract = async (requestId) => {
    setContractLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/special-requests/${requestId}/contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractContent
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setSelectedContractId(null);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setContractLoading(false);
    }
  };

  // Profile update request handlers
  const handleApproveProfileUpdate = async (requestId) => {
    setProfileUpdateActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile-update-requests/admin/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: adminNoteMap[requestId] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Profil mis à jour avec succès.');
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setProfileUpdateActionLoading(false);
    }
  };

  const handleRejectProfileUpdate = async (requestId) => {
    setProfileUpdateActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile-update-requests/admin/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: adminNoteMap[requestId] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Demande rejetée.');
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setProfileUpdateActionLoading(false);
    }
  };

  // Helper methods for dynamic quote items
  const addQuoteRow = () => {
    setQuoteRows([...quoteRows, { article: '', price: 0, quantity: 1, total: 0 }]);
  };

  const removeQuoteRow = (index) => {
    const next = [...quoteRows];
    next.splice(index, 1);
    setQuoteRows(next);
    recalcQuoteTotal(next);
  };

  const updateQuoteRow = (index, field, value) => {
    const next = [...quoteRows];
    const row = { ...next[index] };
    if (field === 'price') {
      row.price = parseFloat(value) || 0;
      row.total = row.price * row.quantity;
    } else if (field === 'quantity') {
      row.quantity = parseInt(value) || 0;
      row.total = row.price * row.quantity;
    } else {
      row[field] = value;
    }
    next[index] = row;
    setQuoteRows(next);
    recalcQuoteTotal(next);
  };

  const recalcQuoteTotal = (rows) => {
    const tot = rows.reduce((acc, r) => acc + (r.price * r.quantity), 0);
    setQuoteTotal(tot);
  };

  const handleStartQuote = (req) => {
    setActiveQuoteId(req.id);
    setQuoteRows([{ article: req.description, price: 0, quantity: req.quantity, total: 0 }]);
    setQuoteNotes('');
    setQuoteTotal(0);
  };

  const handleStartContractEdit = (req) => {
    setSelectedContractId(req.id);
    setContractContent(req.contract_content || '');
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

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) {
      alert('Le nom et le prix sont obligatoires');
      return;
    }
    setProductLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newProductName);
      formData.append('description', newProductDesc);
      formData.append('price', newProductPrice);
      if (newProductCategory) formData.append('category', newProductCategory);
      
      // custom dynamic fields + motifs
      const finalCustomData = {
        ...newProductCustomValues,
        motifs: newProductMotifs
      };
      formData.append('custom_data', JSON.stringify(finalCustomData));

      if (newProductImage) {
        formData.append('image', newProductImage);
      }

      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        body: formData // No Content-Type header so browser sets multipart/form-data
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');

      alert(data.message);
      setNewProductName('');
      setNewProductDesc('');
      setNewProductPrice('');
      setNewProductCategory('');
      setNewProductImage(null);
      setNewProductCustomValues({});
      setNewProductMotifs([]);
      setNewMotifName('');
      // Reset file input
      const fileInput = document.getElementById('productImageInput');
      if (fileInput) fileInput.value = '';
      
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setProductLoading(false);
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette entreprise ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/companies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');
      alert(data.message);
      await fetchAdminData();
      setSelectedCompany(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleActivateWallet = async (companyId) => {
    if (!window.confirm("Voulez-vous vraiment activer le portefeuille de cette entreprise ?")) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallets/activate/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message);
      await fetchAdminData();
      setSelectedCompany(prev => {
        if (prev && prev.id === companyId) {
          return {
            ...prev,
            wallet: data.wallet
          };
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Erreur lors de l'activation financière.");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!minActivationDeposit || parseFloat(minActivationDeposit) <= 0) {
      alert("Veuillez saisir un montant d'activation minimum valide.");
      return;
    }
    if (!purchaseEligibilityPeriod || parseInt(purchaseEligibilityPeriod, 10) < 1) {
      alert("Veuillez saisir une période d'éligibilité d'achat valide (min 1 mois).");
      return;
    }
    setWalletLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minActivationDeposit: parseFloat(minActivationDeposit),
          purchaseEligibilityPeriod: parseInt(purchaseEligibilityPeriod, 10),
          kkiapaySubaccount13: kkiapaySubaccount13,
          kkiapaySubaccount23: kkiapaySubaccount23
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erreur lors de la mise à jour des paramètres.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleCustomFieldChange = (key, value) => {
    setNewProductCustomValues(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!newFieldKey || !newFieldLabel || !newFieldType) {
      alert('Veuillez remplir tous les champs du champ dynamique');
      return;
    }
    setFieldLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/product-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newFieldKey, label: newFieldLabel, type: newFieldType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création champ');
      alert(data.message);
      setNewFieldKey('');
      setNewFieldLabel('');
      setNewFieldType('text');
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setFieldLoading(false);
    }
  };

  // Delete Product Field
  const handleDeleteField = async (id) => {
    if (!window.confirm('Supprimer ce champ ? Il sera retiré du formulaire d\'achat.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/product-fields/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur suppression champ');
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ? Cela supprimera également les lignes de facturation associées s'il y en a.")) return;
    
    setProductLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setProductLoading(false);
    }
  };

  // Bulk Delete Products
  const handleDeleteSelectedProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Supprimer ${selectedProducts.size} produit(s) sélectionné(s) ? Cette action est irréversible.`)) return;
    setBulkDeleteLoading(true);
    try {
      await Promise.all([...selectedProducts].map(id =>
        fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' })
      ));
      setSelectedProducts(new Set());
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  // ── Category Handlers ─────────────────────────────────────────
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Veuillez saisir un nom de catégorie');
      return;
    }
    setCategoryLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newCategoryName.trim());
      if (newCategoryImage) {
        formData.append('image', newCategoryImage);
      }

      const res = await fetch(`${API_URL}/api/admin/categories`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création catégorie');
      alert(data.message);
      setNewCategoryName('');
      setNewCategoryImage(null);
      const fileInput = document.getElementById('categoryImageInput');
      if (fileInput) fileInput.value = '';
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
    setEditCategoryImage(null);
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName('');
    setEditCategoryImage(null);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryName.trim()) {
      alert('Veuillez saisir un nom de catégorie');
      return;
    }
    setCategoryLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editCategoryName.trim());
      if (editCategoryImage) {
        formData.append('image', editCategoryImage);
      }

      const res = await fetch(`${API_URL}/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour catégorie');
      alert(data.message);
      setEditingCategory(null);
      setEditCategoryName('');
      setEditCategoryImage(null);
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ? Les produits existants garderont leur catégorie actuelle.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur suppression catégorie');
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Product Edit Handlers ──────────────────────────────────────
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductDesc(product.description || '');
    setEditProductPrice(String(product.price));
    setEditProductCategory(product.category || '');
    setEditProductImage(null);
    
    // Split motifs and other custom data
    const cData = product.custom_data || {};
    const cleanCustomValues = { ...cData };
    delete cleanCustomValues.motifs;
    setEditProductCustomValues(cleanCustomValues);
    setEditProductMotifs(cData.motifs || []);
    setEditMotifName('');
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editProductName || !editProductPrice) {
      alert('Le nom et le prix sont obligatoires');
      return;
    }
    setEditProductLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editProductName);
      formData.append('description', editProductDesc);
      formData.append('price', editProductPrice);
      formData.append('category', editProductCategory);
      
      // Merge motifs with other custom fields
      const finalCustomData = {
        ...editProductCustomValues,
        motifs: editProductMotifs
      };
      formData.append('custom_data', JSON.stringify(finalCustomData));

      if (editProductImage) {
        formData.append('image', editProductImage);
      }

      const res = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification');

      alert(data.message);
      setEditingProduct(null);
      setEditProductMotifs([]);
      setEditMotifName('');
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setEditProductLoading(false);
    }
  };

  const handleUploadMotifFile = async (file, isEdit) => {
    if (!file) return;
    setMotifUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_URL}/api/products/upload-motif-image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur upload motif');

      const motifNameInput = isEdit ? editMotifName : newMotifName;
      if (!motifNameInput.trim()) {
        alert("Veuillez d'abord saisir le nom du motif avant de choisir sa photo.");
        setMotifUploadLoading(false);
        return;
      }

      const newMotifObj = {
        id: 'motif-' + Date.now(),
        name: motifNameInput.trim(),
        image_url: data.image_url
      };

      if (isEdit) {
        setEditProductMotifs(prev => [...prev, newMotifObj]);
        setEditMotifName('');
      } else {
        setNewProductMotifs(prev => [...prev, newMotifObj]);
        setNewMotifName('');
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setMotifUploadLoading(false);
      const fileInput = document.getElementById(isEdit ? 'editMotifFileInput' : 'newMotifFileInput');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleRemoveMotif = (motifId, isEdit) => {
    if (isEdit) {
      setEditProductMotifs(prev => prev.filter(m => m.id !== motifId));
    } else {
      setNewProductMotifs(prev => prev.filter(m => m.id !== motifId));
    }
  };

  const handleEditCustomFieldChange = (key, value) => {
    setEditProductCustomValues(prev => ({ ...prev, [key]: value }));
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

  const pendingKycCount = companies.filter(c => c.kyc_status === 'PENDING').length;
  const pendingQuotesCount = specialRequests.filter(r => r.status === 'PENDING').length;
  const pendingContractsCount = specialRequests.filter(r => r.status === 'QUOTED').length;
  const unpaidSchedulesCount = schedules.filter(s => !s.paid).length;

  const getFileUrl = (path) => {
    if (!path) return '#';
    return path.startsWith('http') ? path : `${API_URL}/uploads/${path}`;
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ADMIN SESSION NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-border-custom pb-4 overflow-x-auto">
        {[
          { id: 'directory', label: '🗂️ Annuaire Client B2B' },
          { id: 'kyc', label: '🛡️ Dossiers KYC', badge: pendingKycCount },
          { id: 'devis', label: '⚡ Chiffrage Devis', badge: pendingQuotesCount },
          { id: 'contracts', label: '📜 Édition Contrats', badge: pendingContractsCount },
          { id: 'risk', label: '📊 Risque & Créances', badge: unpaidSchedulesCount },
          { id: 'profile_updates', label: '✏️ Modifications Profil', badge: profileUpdateRequests.filter(r => r.status === 'PENDING').length },
          { id: 'orders', label: '🛒 Commandes' },
          { id: 'reports', label: '📈 Rapports' },
          { id: 'products', label: '📦 Catalogue Produits' },
          { id: 'settings', label: '⚙️ Paramètres' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors border flex items-center gap-1.5 relative ${
              activeTab === tab.id
                ? 'bg-red-950/30 border-red-800/70 text-red-400 font-bold'
                : 'border-zinc-900/50 bg-zinc-950/30 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white badge-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SESSION CHANNELS & RENDER PANELS */}
      <div className="space-y-8">
        
        {/* DIRECTORY PANEL */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
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

            <div className="rounded-lg bg-bg-deepest border border-border-custom overflow-hidden max-h-[550px] overflow-y-auto pr-1">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-400 font-semibold uppercase tracking-wider">
                      <th className="p-4">Dénomination</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Téléphone</th>
                      <th className="p-4">Statut KYC</th>
                      <th className="p-4">Date d'inscription</th>
                      <th className="p-4 text-center">Infos</th>
                      <th className="p-4 text-center">Supprimer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                    {companies.filter(c => 
                      c.denomination_sociale.toLowerCase().includes(companySearch.toLowerCase()) ||
                      c.email.toLowerCase().includes(companySearch.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-zinc-500">
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
                              c.kyc_status === 'DEACTIVATED' ? 'bg-zinc-950 text-zinc-500 border border-zinc-800/80' :
                              'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                            }`}>
                              {c.kyc_status === 'APPROVED' ? 'APPROUVÉ' : c.kyc_status === 'REJECTED' ? 'REJETÉ' : c.kyc_status === 'DEACTIVATED' ? 'DÉSACTIVÉ' : 'EN ATTENTE'}
                            </span>
                          </td>
                          <td className="p-4">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedCompany(c)}
                              className="px-2.5 py-1 rounded bg-surface-custom border border-border-custom hover:bg-zinc-800 text-[10px] text-zinc-300 font-semibold cursor-pointer"
                            >
                              📄 Consulter
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteCompany(c.id)}
                              className="p-1.5 rounded bg-red-950/30 border border-red-900/40 hover:bg-red-900/40 text-red-400 cursor-pointer transition-all"
                              title="Supprimer cette entreprise"
                            >
                              <Trash2 size={13} />
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

        {/* KYC AUDIT PANEL */}
        {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-zinc-400" />
              <h3 className="font-bold text-white text-lg">Vérification des Dossiers KYC</h3>
            </div>
            <input
              type="text"
              placeholder="Rechercher un dossier (Nom entreprise, gérant...)"
              value={kycSearch}
              onChange={(e) => setKycSearch(e.target.value)}
              className="px-3 py-1.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom w-full sm:w-64"
            />
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {companies.filter(c => 
              c.kyc_status === 'PENDING' && (
                c.denomination_sociale.toLowerCase().includes(kycSearch.toLowerCase()) ||
                c.manager_name.toLowerCase().includes(kycSearch.toLowerCase())
              )
            ).length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10 border border-dashed border-border-custom rounded-lg bg-bg-deepest">
                Aucun dossier de conformité KYC correspondant trouvé.
              </p>
            ) : (
              companies.filter(c => 
                c.kyc_status === 'PENDING' && (
                  c.denomination_sociale.toLowerCase().includes(kycSearch.toLowerCase()) ||
                  c.manager_name.toLowerCase().includes(kycSearch.toLowerCase())
                )
              ).map((company) => (
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
                  <div className="p-4 rounded bg-surface-custom/30 border border-border-custom/40 space-y-3 text-xs">
                    <p className="font-semibold text-zinc-350">Pièces justificatives du dossier B2B :</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                      <a href={getFileUrl(company.company_rccm_pdf)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <FileText size={12} className="text-red-400 shrink-0" />
                        <span>RCCM Entreprise (PDF)</span>
                      </a>
                      <a href={getFileUrl(company.company_ifu_pdf)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <FileText size={12} className="text-red-400 shrink-0" />
                        <span>IFU Entreprise (PDF)</span>
                      </a>
                      <a href={getFileUrl(company.manager_cip_pdf)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <FileText size={12} className="text-red-400 shrink-0" />
                        <span>CIP Gérant (PDF)</span>
                      </a>
                      {company.manager_ifu_pdf && (
                        <a href={getFileUrl(company.manager_ifu_pdf)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                          <FileText size={12} className="text-red-400 shrink-0" />
                          <span>IFU Gérant (PDF)</span>
                        </a>
                      )}
                      <a href={getFileUrl(company.manager_selfie)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <Video size={12} className="text-red-400 shrink-0" />
                        <span>Selfie Vidéo Gérant</span>
                      </a>
                      <a href={getFileUrl(company.guarantor_cip_pdf)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <FileText size={12} className="text-red-400 shrink-0" />
                        <span>CIP Garant (PDF)</span>
                      </a>
                      {company.guarantor_ifu_pdf && (
                        <a href={getFileUrl(company.guarantor_ifu_pdf)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                          <FileText size={12} className="text-red-400 shrink-0" />
                          <span>IFU Garant (PDF)</span>
                        </a>
                      )}
                      <a href={getFileUrl(company.guarantor_selfie)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 rounded bg-bg-deepest border border-border-custom/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <Video size={12} className="text-red-400 shrink-0" />
                        <span>Selfie Vidéo Garant</span>
                      </a>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end items-center">
                    <button
                      onClick={() => setSelectedCompany(company)}
                      className="mr-auto text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      🔍 Consulter le dossier complet
                    </button>
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
        )}

        {/* CUSTOM ESTIMATES QUOTER PANEL */}
        {activeTab === 'devis' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-zinc-400" />
              <h3 className="font-bold text-white text-lg">Chiffrage des Commandes Spéciales</h3>
            </div>
            <input
              type="text"
              placeholder="Rechercher un devis (Nom entreprise...)"
              value={devisSearch}
              onChange={(e) => setDevisSearch(e.target.value)}
              className="px-3 py-1.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom w-full sm:w-64"
            />
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {specialRequests.filter(r => 
              r.status === 'SUBMITTED' && 
              r.company?.denomination_sociale.toLowerCase().includes(devisSearch.toLowerCase())
            ).length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10 border border-dashed border-border-custom rounded-lg bg-bg-deepest">
                Aucune commande sur-mesure correspondante en attente de tarification.
              </p>
            ) : (
              specialRequests.filter(r => 
                r.status === 'SUBMITTED' && 
                r.company?.denomination_sociale.toLowerCase().includes(devisSearch.toLowerCase())
              ).map((req) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded bg-surface-custom/30 border border-border-custom/50 text-xs text-zinc-300 space-y-2">
                      <p className="font-semibold text-zinc-400">Description du Mobilier :</p>
                      <p className="leading-relaxed font-mono text-[11px]">{req.description}</p>
                      <p className="font-semibold text-zinc-400 pt-1">Quantité demandée : {req.quantity} article(s)</p>
                    </div>
                    {req.image_url && (
                      <div className="flex items-center gap-2 border border-border-custom/50 rounded-lg p-2 bg-surface-custom/10">
                        <img src={req.image_url} alt="Modèle demandé" className="w-28 h-28 object-cover rounded-lg border border-border-custom" />
                        <span className="text-[10px] text-zinc-500">Image jointe par le client</span>
                      </div>
                    )}
                  </div>

                  {activeQuoteId === req.id ? (
                    <div className="space-y-4 border-t border-border-custom/40 pt-4">
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Création du Devis Quantitatif</p>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border-custom text-zinc-450 uppercase text-[10px]">
                              <th className="py-2 pr-2">Article / Modèle</th>
                              <th className="py-2 px-2 w-28">Prix Unit. (FCFA)</th>
                              <th className="py-2 px-2 w-20">Quantité</th>
                              <th className="py-2 pl-2 w-32 text-right">Total</th>
                              <th className="py-2 pl-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-custom/30">
                            {quoteRows.map((row, idx) => (
                              <tr key={idx}>
                                <td className="py-2 pr-2">
                                  <input
                                    type="text"
                                    required
                                    value={row.article}
                                    onChange={(e) => updateQuoteRow(idx, 'article', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                                    placeholder="Libellé de l'article"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    required
                                    min="0"
                                    value={row.price}
                                    onChange={(e) => updateQuoteRow(idx, 'price', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={row.quantity}
                                    onChange={(e) => updateQuoteRow(idx, 'quantity', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                                  />
                                </td>
                                <td className="py-2 pl-2 text-right font-mono text-zinc-300 font-semibold">
                                  {Number(row.total).toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="py-2 pl-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeQuoteRow(idx)}
                                    className="text-red-500 hover:text-red-400 text-xs"
                                  >✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center bg-zinc-900/30 p-3 rounded border border-border-custom/50">
                        <button
                          type="button"
                          onClick={addQuoteRow}
                          className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold"
                        >
                          + Ajouter une ligne
                        </button>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Montant global calculé</span>
                          <span className="text-lg font-black text-white font-mono">{quoteTotal.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-zinc-500 font-bold uppercase">Notes sur le devis / Mentions</label>
                        <textarea
                          rows={2}
                          value={quoteNotes}
                          onChange={(e) => setQuoteNotes(e.target.value)}
                          placeholder="Ex: Garantie de 2 ans incluse. Bois de noyer traité..."
                          className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setActiveQuoteId(null)}
                          className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleSendQuote(req.id)}
                          disabled={quoteLoading}
                          className="px-5 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <Send size={12} /> Émettre et Envoyer le Devis
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end border-t border-border-custom/50 pt-3">
                      <button
                        onClick={() => handleStartQuote(req)}
                        className="px-4 py-2 rounded bg-primary-custom hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        ⚡ Commencer le chiffrage
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {/* CONTRACT CUSTOMIZER PANEL */}
        {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-zinc-400" />
              <h3 className="font-bold text-white text-lg">Édition & Personnalisation des Contrats</h3>
            </div>
            <input
              type="text"
              placeholder="Rechercher un contrat (Nom entreprise...)"
              value={contractsSearch}
              onChange={(e) => setContractsSearch(e.target.value)}
              className="px-3 py-1.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom w-full sm:w-64"
            />
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {specialRequests.filter(r => 
              (r.status === 'QUOTED' || r.status === 'APPROVED') &&
              r.company?.denomination_sociale.toLowerCase().includes(contractsSearch.toLowerCase())
            ).length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10 border border-dashed border-border-custom rounded-lg bg-bg-deepest">
                Aucun contrat correspondant trouvé.
              </p>
            ) : (
              specialRequests.filter(r => 
                (r.status === 'QUOTED' || r.status === 'APPROVED') &&
                r.company?.denomination_sociale.toLowerCase().includes(contractsSearch.toLowerCase())
              ).map((req) => (
                <div key={req.id} className="p-5 rounded-lg bg-bg-deepest border border-border-custom space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">Société : {req.company.denomination_sociale}</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Montant : {Number(req.estimated_price).toLocaleString('fr-FR')} FCFA · Statut : {req.status}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${req.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                      {req.status === 'APPROVED' ? 'CONTRAT SIGNÉ' : 'DEVIS ÉMIS'}
                    </span>
                  </div>

                  {selectedContractId === req.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={10}
                        value={contractContent}
                        onChange={(e) => setContractContent(e.target.value)}
                        className="w-full p-3 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono leading-relaxed resize-y"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedContractId(null)}
                          className="px-4 py-2 rounded bg-zinc-850 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleSaveContract(req.id)}
                          disabled={contractLoading}
                          className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          {contractLoading ? 'Enregistrement...' : 'Sauvegarder le contrat personnalisé'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleStartContractEdit(req)}
                        className="px-4 py-2 rounded bg-surface-custom border border-border-custom hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-all"
                      >
                        ✍️ Éditer / Personnaliser le contrat
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {/* MATRICIAL VIEW OF PAYMENTS & WHATSAPP RELANCES */}
        {activeTab === 'risk' && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-zinc-400" />
              <h3 className="font-bold text-white text-lg">Pivot des Créances & Gestion du Risque de Recouvrement</h3>
            </div>
            <input
              type="text"
              placeholder="Rechercher une créance (Nom entreprise, N° Cmd...)"
              value={riskSearch}
              onChange={(e) => setRiskSearch(e.target.value)}
              className="px-3 py-1.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom w-full sm:w-64"
            />
          </div>

          <div className="rounded-lg bg-bg-deepest border border-border-custom overflow-hidden max-h-[580px] overflow-y-auto pr-1">
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
                  {schedules.filter(s => 
                    s.company_name.toLowerCase().includes(riskSearch.toLowerCase()) ||
                    s.order_number.toLowerCase().includes(riskSearch.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-zinc-500">
                        Aucune créance correspondante trouvée.
                      </td>
                    </tr>
                  ) : (
                    schedules.filter(s => 
                      s.company_name.toLowerCase().includes(riskSearch.toLowerCase()) ||
                      s.order_number.toLowerCase().includes(riskSearch.toLowerCase())
                    ).map((item, idx) => (
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
      )}

      {/* CATALOGUE PRODUITS PANEL */}
      {activeTab === 'products' && (
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <PackageOpen size={18} className="text-zinc-400" />
          <h3 className="font-bold text-white text-lg">Gestion du Catalogue Produits</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration, Catégories et Ajout */}
          <div className="lg:col-span-1 space-y-6">

            {/* ── Section Gestion des Catégories ── */}
            <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom">
              <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <Tag size={16} className="text-amber-500" /> Catégories
              </h4>

              {/* Liste des catégories existantes */}
              {categories.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded bg-surface-custom/50 border border-border-custom/50">
                      <div className="flex items-center gap-2">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-6 h-6 rounded object-cover border border-border-custom/50" />
                        ) : (
                          <span className="w-6 h-6 rounded bg-zinc-950/60 flex items-center justify-center text-[7px] text-zinc-600 border border-border-custom/30">No px</span>
                        )}
                        <span className="text-xs font-semibold text-white">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="p-1 rounded hover:bg-blue-950/40 text-zinc-500 hover:text-blue-400 transition-all cursor-pointer"
                          title="Modifier cette catégorie"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                          title="Supprimer cette catégorie"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {categories.length === 0 && (
                <p className="text-zinc-500 text-[11px] mb-3 text-center py-3 border border-dashed border-border-custom rounded">
                  Aucune catégorie créée. Ajoutez-en ci-dessous.
                </p>
              )}

              {editingCategory ? (
                /* Formulaire de modification de catégorie */
                <form onSubmit={handleUpdateCategory} className="space-y-3 mt-3 p-3 bg-zinc-900/40 rounded border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-500 uppercase">Modifier la catégorie</span>
                    <button type="button" onClick={handleCancelEditCategory} className="text-zinc-500 hover:text-white text-[10px]">Annuler</button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nom de la catégorie..."
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={categoryLoading}
                      className="px-3 py-2 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      Enregistrer
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Nouvelle Image de la catégorie (Optionnelle)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditCategoryImage(e.target.files[0])}
                      className="w-full text-[10px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-surface-custom file:text-zinc-300 hover:file:bg-zinc-800"
                    />
                  </div>
                </form>
              ) : (
                /* Formulaire de création de catégorie */
                <form onSubmit={handleCreateCategory} className="space-y-2 mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nouvelle catégorie..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={categoryLoading}
                      className="px-3 py-2 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus size={12} /> {categoryLoading ? '...' : 'Créer'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Image de la catégorie (Optionnelle)</label>
                    <input
                      id="categoryImageInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewCategoryImage(e.target.files[0])}
                      className="w-full text-[10px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-surface-custom file:text-zinc-300 hover:file:bg-zinc-800"
                    />
                  </div>
                </form>
              )}
            </div>
            
            {/* Liste des champs existants avec suppression */}
            {productFields.length > 0 && (
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom">
                <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                  <PackageOpen size={15} className="text-zinc-400" /> Champs du formulaire ({productFields.length})
                </h4>
                <div className="space-y-1.5">
                  {productFields.map(f => (
                    <div key={f.id} className="flex items-center justify-between px-3 py-2 rounded bg-surface-custom/50 border border-border-custom/50">
                      <div>
                        <span className="text-xs font-semibold text-white">{f.label}</span>
                        <span className="ml-2 text-[10px] text-zinc-500 font-mono">({f.key} · {f.type})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(f.id)}
                        className="p-1 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                        title="Supprimer ce champ"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire de création de champ dynamique */}
            <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom h-fit">
              <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <Plus size={16} className="text-emerald-500" /> Nouveau Champ Dynamique
              </h4>
              <form onSubmit={handleCreateField} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Clé technique (ex: color)</label>
                  <input type="text" required value={newFieldKey} onChange={(e) => setNewFieldKey(e.target.value)} className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-primary-custom" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Libellé (ex: Couleur)</label>
                  <input type="text" required value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-primary-custom" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Type de champ</label>
                  <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-primary-custom">
                    <option value="text">Texte libre</option>
                    <option value="number">Nombre</option>
                  </select>
                </div>
                <button type="submit" disabled={fieldLoading} className="w-full py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-50 mt-2">
                  {fieldLoading ? 'Création...' : 'Créer le champ'}
                </button>
              </form>
            </div>

            {/* Formulaire d'ajout de produit */}
            <div className="p-5 rounded-lg bg-bg-deepest border border-border-custom h-fit">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus size={16} className="text-primary-custom" /> Ajouter un produit
              </h4>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-semibold">
                Total : {products.length}
              </span>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-primary-custom"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Catégorie</label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-primary-custom"
                >
                  <option value="">-- Sélectionner une catégorie --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Prix (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-primary-custom"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
                <textarea
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-primary-custom resize-none"
                />
              </div>
              {/* Dynamic custom fields provided by admin configuration */}
              {productFields.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Champs personnalisés</label>
                  <div className="space-y-2">
                    {productFields.map(f => (
                      <div key={f.id}>
                        <label className="block text-[11px] text-zinc-400 mb-1">{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={newProductCustomValues[f.key] || ''}
                            onChange={(e) => handleCustomFieldChange(f.key, e.target.value)}
                            className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs"
                          >
                            <option value="">--</option>
                            {(f.options || []).map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : f.type === 'number' ? (
                          <input type="number" value={newProductCustomValues[f.key] || ''} onChange={(e) => handleCustomFieldChange(f.key, e.target.value)} className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs" />
                        ) : (
                          <input type="text" value={newProductCustomValues[f.key] || ''} onChange={(e) => handleCustomFieldChange(f.key, e.target.value)} className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Motifs / Finitions */}
              <div className="border border-border-custom bg-surface-custom/30 rounded-lg p-3 space-y-3">
                <span className="block text-xs font-bold text-zinc-300">🎨 Motifs / Finitions (Optionnel)</span>
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-zinc-500">Nom du motif</label>
                    <input
                      type="text"
                      value={newMotifName}
                      onChange={(e) => setNewMotifName(e.target.value)}
                      placeholder="Ex: Tissu Velours Vert"
                      className="w-full px-3 py-1.5 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-zinc-500 block truncate">Photo motif</label>
                    <div className="relative">
                      <input
                        id="newMotifFileInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadMotifFile(e.target.files[0], false)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={motifUploadLoading || !newMotifName.trim()}
                      />
                      <div className="w-full py-1.5 rounded bg-zinc-800 text-zinc-400 text-center text-xs font-semibold border border-zinc-700 hover:bg-zinc-700">
                        {motifUploadLoading ? '...' : 'Choisir'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des motifs saisis */}
                {newProductMotifs.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto pr-1">
                    {newProductMotifs.map((motif, index) => (
                      <div key={index} className="flex items-center gap-1.5 p-1.5 rounded bg-bg-deepest border border-border-custom relative group">
                        <img src={motif.image_url} alt={motif.name} className="w-8 h-8 rounded object-cover" />
                        <span className="text-[10px] text-zinc-300 truncate w-20" title={motif.name}>{motif.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMotif(motif.id, false)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-800 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Image du produit</label>
                <div className="flex items-center gap-2">
                  <input
                    id="productImageInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewProductImage(e.target.files[0])}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-surface-custom file:text-zinc-300 hover:file:bg-zinc-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={productLoading}
                className="w-full py-2.5 rounded bg-primary-custom hover:bg-primary-hover text-white text-xs font-bold transition-all disabled:opacity-50 mt-2"
              >
                {productLoading ? 'Enregistrement...' : 'Enregistrer le produit'}
              </button>
            </form>
          </div>
          </div>

          {/* Liste des produits */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-bg-deepest border border-border-custom overflow-hidden max-h-[580px] overflow-y-auto pr-1">
              <div className="px-4 py-3 border-b border-border-custom/50 flex items-center justify-between gap-3">
                <span className="font-bold text-xs text-white shrink-0">Liste des produits</span>
                <input
                  type="text"
                  placeholder="Rechercher un produit (Nom, catégorie...)"
                  value={productsSearch}
                  onChange={(e) => setProductsSearch(e.target.value)}
                  className="px-2.5 py-1 rounded bg-bg-deepest border border-border-custom text-zinc-100 text-[11px] focus:outline-none focus:border-primary-custom w-full max-w-[200px]"
                />
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-semibold shrink-0">
                  {products.length} produit(s)
                </span>
              </div>

              {/* Bulk action toolbar */}
              {selectedProducts.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-red-950/30 border-b border-red-900/40">
                  <span className="text-red-300 text-xs font-semibold">
                    {selectedProducts.size} produit(s) sélectionné(s)
                  </span>
                  <button
                    onClick={handleDeleteSelectedProducts}
                    disabled={bulkDeleteLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {bulkDeleteLoading ? 'Suppression...' : 'Supprimer la sélection'}
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-surface-custom/50 border-b border-border-custom text-zinc-400 font-semibold uppercase tracking-wider">
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={products.length > 0 && selectedProducts.size === products.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 accent-red-500 cursor-pointer"
                          title="Tout sélectionner"
                        />
                      </th>
                      <th className="p-4">Produit</th>
                      <th className="p-4">Catégorie</th>
                      <th className="p-4">Prix</th>
                      <th className="p-4">Date d'ajout</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/50 text-zinc-300">
                    {products.filter(p => 
                      p.name?.toLowerCase().includes(productsSearch.toLowerCase()) ||
                      (p.category || '').toLowerCase().includes(productsSearch.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-zinc-500">
                          Aucun produit correspondant trouvé.
                        </td>
                      </tr>
                    ) : (
                      products.filter(p => 
                        p.name?.toLowerCase().includes(productsSearch.toLowerCase()) ||
                        (p.category || '').toLowerCase().includes(productsSearch.toLowerCase())
                      ).map((product) => (
                        <tr
                          key={product.id}
                          className={`hover:bg-surface-custom/20 transition-colors ${selectedProducts.has(product.id) ? 'bg-red-950/10 border-l-2 border-l-red-700' : ''}`}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => toggleSelectProduct(product.id)}
                              className="w-4 h-4 accent-red-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-surface-custom flex-shrink-0 overflow-hidden border border-border-custom/50">
                                {product.image_url ? (
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon size={16} /></div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{product.name}</p>
                                <p className="text-[10px] text-zinc-500 max-w-[200px] truncate">{product.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {product.category ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/30 text-amber-400 border border-amber-900/40">
                                {product.category}
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-4 font-bold font-mono text-white">{Number(product.price).toLocaleString('fr-FR')} FCFA</td>
                          <td className="p-4 text-zinc-400">{new Date(product.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="p-4 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => openEditModal(product)}
                                className="p-2 rounded bg-blue-950/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 transition-colors cursor-pointer"
                                title="Modifier ce produit"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={productLoading}
                                className="p-2 rounded bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-400 transition-colors cursor-pointer"
                                title="Supprimer ce produit"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PROFILE UPDATES PANEL */}
      {activeTab === 'profile_updates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Edit3 size={18} className="text-zinc-400" />
              <h3 className="font-bold text-white text-lg">Demandes de Modification de Profil</h3>
            </div>
            <input
              type="text"
              placeholder="Rechercher une demande (Nom entreprise...)"
              value={profileUpdatesSearch}
              onChange={(e) => setProfileUpdatesSearch(e.target.value)}
              className="px-3 py-1.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom w-full sm:w-64"
            />
          </div>

          {profileUpdateRequests.filter(req => 
            req.company?.denomination_sociale?.toLowerCase().includes(profileUpdatesSearch.toLowerCase())
          ).length === 0 ? (
            <div className="p-8 rounded-lg bg-bg-deepest border border-border-custom text-center text-zinc-500 text-sm">
              Aucune demande de modification correspondante trouvée.
            </div>
          ) : (
            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
              {profileUpdateRequests.filter(req => 
                req.company?.denomination_sociale?.toLowerCase().includes(profileUpdatesSearch.toLowerCase())
              ).map(req => (
                <div key={req.id} className={`p-5 rounded-xl border space-y-4 ${
                  req.status === 'PENDING' ? 'bg-amber-950/10 border-amber-900/40' :
                  req.status === 'APPROVED' ? 'bg-emerald-950/10 border-emerald-900/40' :
                  'bg-zinc-950 border-zinc-800'
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{req.company?.denomination_sociale}</p>
                      <p className="text-[11px] text-zinc-500">{req.company?.email}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        Soumise le {new Date(req.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      req.status === 'PENDING' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/50' :
                      req.status === 'APPROVED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50' :
                      'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}>
                      {req.status === 'PENDING' ? '⏳ En attente' : req.status === 'APPROVED' ? '✓ Approuvée' : '✗ Rejetée'}
                    </span>
                  </div>

                  {/* Proposed changes */}
                  <div className="bg-zinc-900/60 rounded-lg p-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Modifications demandées :</p>
                    {Object.entries(req.changes).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500 font-mono w-40 shrink-0">{key}</span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Admin note if exists */}
                  {req.admin_note && (
                    <div className="text-[11px] text-zinc-400 bg-zinc-900/40 rounded p-2.5 border border-zinc-800/50">
                      <span className="font-bold text-zinc-500">Note admin : </span>{req.admin_note}
                    </div>
                  )}

                  {/* Actions for PENDING requests */}
                  {req.status === 'PENDING' && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                      <input
                        type="text"
                        placeholder="Note admin (optionnel)..."
                        value={adminNoteMap[req.id] || ''}
                        onChange={e => setAdminNoteMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveProfileUpdate(req.id)}
                          disabled={profileUpdateActionLoading}
                          className="flex-1 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <Check size={13} /> Approuver & Appliquer
                        </button>
                        <button
                          onClick={() => handleRejectProfileUpdate(req.id)}
                          disabled={profileUpdateActionLoading}
                          className="flex-1 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-red-900/40 disabled:opacity-50"
                        >
                          <X size={13} /> Rejeter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDERS PANEL */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-amber-400" />
              <h3 className="font-bold text-white text-lg">Commandes Passées</h3>
              <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5">{allOrders.length} commandes</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Rechercher une commande (N° Cmd, client...)"
                value={ordersSearch}
                onChange={(e) => setOrdersSearch(e.target.value)}
                className="px-3 py-1.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 text-xs focus:outline-none focus:border-primary-custom w-full sm:w-64"
              />
              <button
                onClick={async () => {
                  setOrdersLoading(true);
                  const r = await fetch(`${API_URL}/api/admin/orders?t=${Date.now()}`);
                  if (r.ok) setAllOrders(await r.json());
                  setOrdersLoading(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white text-xs cursor-pointer transition-colors shrink-0"
              >
                <RefreshCw size={13} />
                {ordersLoading ? 'Chargement...' : 'Actualiser'}
              </button>
            </div>
          </div>

          {allOrders.filter(o => 
            o.order_number?.toLowerCase().includes(ordersSearch.toLowerCase()) ||
            o.company?.denomination_sociale?.toLowerCase().includes(ordersSearch.toLowerCase())
          ).length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune commande correspondante trouvée</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
              {allOrders.filter(o => 
                o.order_number?.toLowerCase().includes(ordersSearch.toLowerCase()) ||
                o.company?.denomination_sociale?.toLowerCase().includes(ordersSearch.toLowerCase())
              ).map(order => {
                const schedule = order.payment_schedule || [];
                const paidCount = schedule.filter(i => i.paid).length;
                const totalCount = schedule.length;
                const acompte = Number(order.total_amount) / 3;
                const credit = (Number(order.total_amount) * 2) / 3;
                return (
                  <div key={order.id} className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white text-sm">{order.order_number}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-400 text-sm">{Number(order.total_amount).toLocaleString('fr-FR')} FCFA</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          paidCount === totalCount ? 'bg-green-950/50 text-green-400 border border-green-800/50' :
                          paidCount > 0 ? 'bg-yellow-950/50 text-yellow-400 border border-yellow-800/50' :
                          'bg-red-950/50 text-red-400 border border-red-800/50'
                        }`}>{paidCount}/{totalCount} échéances</span>
                      </div>
                    </div>
                    {/* Client info */}
                    {order.company && (
                      <div className="text-xs text-zinc-400 bg-zinc-900 rounded-lg p-3 flex flex-wrap gap-4">
                        <span><span className="text-zinc-600">Client : </span><strong className="text-white">{order.company.denomination_sociale}</strong></span>
                        <span><span className="text-zinc-600">Resp. : </span>{order.company.manager_name || '—'}</span>
                        <span><span className="text-zinc-600">Tél : </span>{order.company.manager_phone || '—'}</span>
                      </div>
                    )}
                    {/* Articles with photos & motifs */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Articles</p>
                      {(order.order_items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg">
                          {item.product?.image_url ? (
                            <img src={item.product.image_url} alt={item.product?.name} className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                              <Package size={16} className="text-zinc-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.product?.name || 'Produit'}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/50 text-purple-400 border border-purple-800/40">🎨 Motif : {item.motif || 'Standard'}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">Qté : {item.quantity}</span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-amber-400 shrink-0">{Number(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</p>
                        </div>
                      ))}
                    </div>
                    {/* Financial recap */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-600 mb-0.5">Total</p>
                        <p className="text-xs font-bold text-amber-400">{Number(order.total_amount).toLocaleString('fr-FR')}</p>
                      </div>
                      <div className="text-center border-l border-r border-zinc-800">
                        <p className="text-[10px] text-zinc-600 mb-0.5">Acompte 1/3</p>
                        <p className="text-xs font-bold text-green-400">{acompte.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-600 mb-0.5">Crédit 2/3</p>
                        <p className="text-xs font-bold text-purple-400">{credit.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REPORTS PANEL */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            <h3 className="font-bold text-white text-lg">Rapports & Statistiques</h3>
          </div>

          {/* Period selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'daily', label: "Aujourd'hui" },
              { id: 'weekly', label: 'Cette semaine' },
              { id: 'monthly', label: 'Ce mois' },
              { id: 'annual', label: 'Cette année' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setReportType(p.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                  reportType === p.id
                    ? 'bg-blue-950/40 border-blue-700 text-blue-400'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >{p.label}</button>
            ))}
            <button
              onClick={async () => {
                setReportLoading(true);
                const r = await fetch(`${API_URL}/api/admin/reports?type=${reportType}&t=${Date.now()}`);
                if (r.ok) setReportData(await r.json());
                setReportLoading(false);
              }}
              className="ml-auto px-4 py-2 rounded-lg text-xs font-bold cursor-pointer bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              {reportLoading ? 'Génération...' : 'Générer le rapport'}
            </button>
          </div>

          {!reportData ? (
            <div className="text-center py-16 text-zinc-600">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p>Sélectionnez une période et cliquez sur "Générer le rapport"</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Encaissé', value: Number(reportData.summary.totalEncaisse).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA', color: 'text-green-400', bg: 'bg-green-950/20 border-green-900/50', icon: '💰' },
                  { label: 'Commandes', value: reportData.summary.totalOrders, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/50', icon: '🛒' },
                  { label: 'Nouvelles Activations', value: reportData.summary.newActivations, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/50', icon: '👥' },
                  { label: 'Échéances Réglées', value: reportData.summary.installmentsPaidCount, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/50', icon: '✅' },
                  { label: 'Acomptes Perçus (1/3)', value: Number(reportData.summary.totalAcomptePercu).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA', color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/50', icon: '📥' },
                  { label: 'Crédit Accordé (2/3)', value: Number(reportData.summary.totalCreditAccorde).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA', color: 'text-violet-400', bg: 'bg-violet-950/20 border-violet-900/50', icon: '🏦' },
                  { label: 'Mensualités Perçues', value: Number(reportData.summary.totalInstallmentsPaid).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA', color: 'text-cyan-400', bg: 'bg-cyan-950/20 border-cyan-900/50', icon: '🔄' },
                  { label: 'Échéances en Attente', value: reportData.summary.installmentsPendingCount, color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/50', icon: '⏳' },
                ].map((kpi, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${kpi.bg} space-y-1`}>
                    <p className="text-lg">{kpi.icon}</p>
                    <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Period info & Export */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-500">
                  <span>Période : </span>
                  <strong className="text-white">{new Date(reportData.startDate).toLocaleDateString('fr-FR')} → {new Date(reportData.endDate).toLocaleDateString('fr-FR')}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rows = [
                        ['Référence', 'Client', 'Date', 'Montant Total', 'Acompte 1/3', 'Crédit 2/3', 'Articles', 'Motifs'],
                        ...(reportData.orders || []).map(o => [
                          o.order_number,
                          o.company?.denomination_sociale || '',
                          new Date(o.created_at).toLocaleDateString('fr-FR'),
                          Number(o.total_amount).toFixed(0),
                          (Number(o.total_amount) / 3).toFixed(0),
                          ((Number(o.total_amount) * 2) / 3).toFixed(0),
                          (o.order_items || []).map(i => i.product?.name).join(' | '),
                          (o.order_items || []).map(i => i.motif || 'Standard').join(' | ')
                        ])
                      ];
                      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `rapport_gmd_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 text-xs font-bold cursor-pointer transition-colors"
                  >
                    ⬇️ Exporter en CSV
                  </button>
                  <a
                    href={`${API_URL}/api/admin/reports/pdf?type=${reportType}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-900/50 text-xs font-bold cursor-pointer transition-colors"
                  >
                    ⬇️ Télécharger en PDF
                  </a>
                </div>
              </div>

              {/* Orders table */}
              {(reportData.orders || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Commandes de la période</p>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800 max-h-[350px] overflow-y-auto pr-1">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-900 text-zinc-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Référence</th>
                          <th className="px-4 py-3">Client</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Articles / Motifs</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {(reportData.orders || []).map(order => (
                          <tr key={order.id} className="hover:bg-zinc-900/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-amber-400 font-bold">{order.order_number}</td>
                            <td className="px-4 py-3 text-white">{order.company?.denomination_sociale}</td>
                            <td className="px-4 py-3 text-zinc-400">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {(order.order_items || []).map((item, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    {item.product?.image_url && <img src={item.product.image_url} alt="" className="w-7 h-7 rounded object-cover border border-zinc-700 shrink-0" />}
                                    <span className="text-zinc-300">{item.product?.name || 'Produit'}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-950/50 text-purple-400 border border-purple-800/40">{item.motif || 'Standard'}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-400">{Number(order.total_amount).toLocaleString('fr-FR')} FCFA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SETTINGS PANEL */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-zinc-400" />
            <h3 className="font-bold text-white text-lg">Paramètres Généraux du Système</h3>
          </div>

          <div className="p-6 rounded-lg bg-bg-deepest border border-border-custom space-y-6">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Montant minimum d'activation du portefeuille (FCFA) *
                </label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 w-full sm:w-80">
                  <input
                    type="number"
                    required
                    min="100"
                    value={minActivationDeposit}
                    onChange={(e) => setMinActivationDeposit(e.target.value)}
                    className="bg-transparent border-0 text-white font-mono text-sm w-full focus:outline-none focus:ring-0 text-right"
                  />
                  <span className="text-zinc-500 text-xs ml-2 font-bold">FCFA</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                  Ce montant définit le dépôt d'acompte (1/3) minimal exigé pour l'activation. 
                  La ligne de crédit associée sera fixée au double (2/3), portant la capacité totale à **{Number(minActivationDeposit * 3).toLocaleString('fr-FR')} FCFA** (le triple).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Période limite d'éligibilité aux achats échelonnés (mois) *
                </label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 w-full sm:w-80">
                  <input
                    type="number"
                    required
                    min="1"
                    value={purchaseEligibilityPeriod}
                    onChange={(e) => setPurchaseEligibilityPeriod(e.target.value)}
                    className="bg-transparent border-0 text-white font-mono text-sm w-full focus:outline-none focus:ring-0 text-right"
                  />
                  <span className="text-zinc-500 text-xs ml-2 font-bold">MOIS</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                  Définit la période (en mois à partir de la date d'activation du compte) durant laquelle le client est autorisé à réaliser des achats échelonnés. Au-delà de cette période, seul le paiement cash est disponible.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  ID du sous-compte Kkiapay (Acompte Initial - 1/3)
                </label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 w-full sm:w-96 gap-2">
                  <input
                    type={isEditingSubaccount13 ? "text" : "password"}
                    readOnly={!isEditingSubaccount13}
                    value={kkiapaySubaccount13}
                    onChange={(e) => setKkiapaySubaccount13(e.target.value)}
                    placeholder="Ex: subaccount_1_3_id"
                    className="bg-transparent border-0 text-white font-mono text-sm w-full focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingSubaccount13(!isEditingSubaccount13)}
                    className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold cursor-pointer transition-colors shrink-0"
                  >
                    {isEditingSubaccount13 ? "Masquer" : "Modifier"}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                  Identifiant du sous-compte destinataire pour le versement initial de l'acompte (1/3). Si vide, le compte principal sera utilisé.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  ID du sous-compte Kkiapay (Échéances de Crédit - 2/3)
                </label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 w-full sm:w-96 gap-2">
                  <input
                    type={isEditingSubaccount23 ? "text" : "password"}
                    readOnly={!isEditingSubaccount23}
                    value={kkiapaySubaccount23}
                    onChange={(e) => setKkiapaySubaccount23(e.target.value)}
                    placeholder="Ex: subaccount_2_3_id"
                    className="bg-transparent border-0 text-white font-mono text-sm w-full focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingSubaccount23(!isEditingSubaccount23)}
                    className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold cursor-pointer transition-colors shrink-0"
                  >
                    {isEditingSubaccount23 ? "Masquer" : "Modifier"}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                  Identifiant du sous-compte destinataire pour le règlement des mensualités de crédit (2/3). Si vide, le compte principal sera utilisé.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-900 flex justify-end">
                <button
                  type="submit"
                  disabled={walletLoading}
                  className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/20"
                >
                  {walletLoading ? 'Sauvegarde...' : '✓ Enregistrer les configurations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRODUCT EDIT MODAL ── */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm overflow-y-auto">
          <div className="modal-scale w-full max-w-lg bg-[#0f0f11] border border-zinc-900 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-8">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Edit3 size={18} className="text-blue-400" /> Modifier le produit
                </h3>
                <p className="text-xs text-zinc-500 mt-1 font-mono">ID: {editingProduct.id}</p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="icon-btn w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current image preview */}
            {editingProduct.image_url && (
              <div className="mb-4 flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-surface-custom overflow-hidden border border-border-custom/50 flex-shrink-0">
                  <img src={editingProduct.image_url} alt={editingProduct.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-zinc-500">Image actuelle</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Catégorie</label>
                <select
                  value={editProductCategory}
                  onChange={(e) => setEditProductCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Aucune catégorie --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Prix (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={editProductPrice}
                  onChange={(e) => setEditProductPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
                <textarea
                  value={editProductDesc}
                  onChange={(e) => setEditProductDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              {/* Dynamic custom fields */}
              {productFields.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Champs personnalisés</label>
                  <div className="space-y-2">
                    {productFields.map(f => (
                      <div key={f.id}>
                        <label className="block text-[11px] text-zinc-400 mb-1">{f.label}</label>
                        {f.type === 'number' ? (
                          <input type="number" value={editProductCustomValues[f.key] || ''} onChange={(e) => handleEditCustomFieldChange(f.key, e.target.value)} className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs" />
                        ) : (
                          <input type="text" value={editProductCustomValues[f.key] || ''} onChange={(e) => handleEditCustomFieldChange(f.key, e.target.value)} className="w-full px-3 py-2 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Motifs / Finitions */}
              <div className="border border-border-custom bg-surface-custom/30 rounded-lg p-3 space-y-3">
                <span className="block text-xs font-bold text-zinc-300">🎨 Motifs / Finitions (Optionnel)</span>
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-zinc-500">Nom du motif</label>
                    <input
                      type="text"
                      value={editMotifName}
                      onChange={(e) => setEditMotifName(e.target.value)}
                      placeholder="Ex: Tissu Velours Bleu"
                      className="w-full px-3 py-1.5 rounded bg-surface-custom border border-border-custom text-zinc-100 text-xs"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-zinc-500 block truncate">Photo motif</label>
                    <div className="relative">
                      <input
                        id="editMotifFileInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadMotifFile(e.target.files[0], true)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={motifUploadLoading || !editMotifName.trim()}
                      />
                      <div className="w-full py-1.5 rounded bg-zinc-800 text-zinc-400 text-center text-xs font-semibold border border-zinc-700 hover:bg-zinc-700">
                        {motifUploadLoading ? '...' : 'Choisir'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des motifs existants/modifiés */}
                {editProductMotifs.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto pr-1">
                    {editProductMotifs.map((motif, index) => (
                      <div key={index} className="flex items-center gap-1.5 p-1.5 rounded bg-bg-deepest border border-border-custom relative group">
                        <img src={motif.image_url} alt={motif.name} className="w-8 h-8 rounded object-cover" />
                        <span className="text-[10px] text-zinc-300 truncate w-20" title={motif.name}>{motif.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMotif(motif.id, true)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-800 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Remplacer l'image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditProductImage(e.target.files[0])}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-surface-custom file:text-zinc-300 hover:file:bg-zinc-800"
                />
              </div>
              <div className="flex gap-3 justify-end border-t border-zinc-900 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2 rounded bg-surface-custom hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editProductLoading}
                  className="px-5 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editProductLoading ? 'Enregistrement...' : '✓ Sauvegarder les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      {/* COMPANY DETAIL & BACKUP MODAL */}
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

            {/* Scrollable Container to fit all resolutions */}
            <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-2">
              
              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Col 1: Entreprise Info */}
                <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between space-y-3.5">
                  <div className="space-y-3.5">
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

                  {/* Documents Section inside Col 1 */}
                  <div className="pt-3 border-t border-zinc-900 space-y-2">
                    <span className="text-zinc-400 font-semibold block uppercase text-[10px] tracking-wider">Pièces Jointes</span>
                    <div className="grid grid-cols-2 gap-2">
                      <a 
                        href={selectedCompany.company_rccm_pdf?.startsWith('http') ? selectedCompany.company_rccm_pdf : `${API_URL}/uploads/${selectedCompany.company_rccm_pdf}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-2 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex items-center justify-center gap-1.5 text-center text-zinc-300 hover:text-white transition-colors"
                      >
                        <FileText size={12} className="text-red-400" />
                        <span className="text-[10px] font-bold">RCCM (PDF)</span>
                      </a>
                      <a 
                        href={selectedCompany.company_ifu_pdf?.startsWith('http') ? selectedCompany.company_ifu_pdf : `${API_URL}/uploads/${selectedCompany.company_ifu_pdf}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-2 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex items-center justify-center gap-1.5 text-center text-zinc-300 hover:text-white transition-colors"
                      >
                        <FileText size={12} className="text-red-400" />
                        <span className="text-[10px] font-bold">IFU (PDF)</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Col 2: Gérant Info */}
                <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between space-y-3.5">
                  <div className="space-y-3.5">
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

                  {/* Documents Section inside Col 2 */}
                  <div className="pt-3 border-t border-zinc-900 space-y-2">
                    <span className="text-zinc-400 font-semibold block uppercase text-[10px] tracking-wider">Pièces Jointes & KYC</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <a 
                        href={selectedCompany.manager_cip_pdf?.startsWith('http') ? selectedCompany.manager_cip_pdf : `${API_URL}/uploads/${selectedCompany.manager_cip_pdf}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                      >
                        <FileText size={12} className="text-red-400" />
                        <span className="text-[9px] font-bold mt-0.5">CIP</span>
                      </a>
                      {selectedCompany.manager_ifu_pdf ? (
                        <a 
                          href={selectedCompany.manager_ifu_pdf.startsWith('http') ? selectedCompany.manager_ifu_pdf : `${API_URL}/uploads/${selectedCompany.manager_ifu_pdf}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                        >
                          <FileText size={12} className="text-red-400" />
                          <span className="text-[9px] font-bold mt-0.5">IFU</span>
                        </a>
                      ) : (
                        <div className="p-1.5 rounded bg-zinc-900/50 border border-zinc-800/30 flex flex-col items-center justify-center text-zinc-600">
                          <span className="text-[9px] font-bold">N/A</span>
                        </div>
                      )}
                      <a 
                        href={selectedCompany.manager_selfie?.startsWith('http') ? selectedCompany.manager_selfie : `${API_URL}/uploads/${selectedCompany.manager_selfie}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                      >
                        <Video size={12} className="text-red-400" />
                        <span className="text-[9px] font-bold mt-0.5">Selfie</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Col 3: Garant Info */}
                <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between space-y-3.5">
                  <div className="space-y-3.5">
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

                  {/* Documents Section inside Col 3 */}
                  <div className="pt-3 border-t border-zinc-900 space-y-2">
                    <span className="text-zinc-400 font-semibold block uppercase text-[10px] tracking-wider">Pièces Jointes & KYC</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <a 
                        href={selectedCompany.guarantor_cip_pdf?.startsWith('http') ? selectedCompany.guarantor_cip_pdf : `${API_URL}/uploads/${selectedCompany.guarantor_cip_pdf}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                      >
                        <FileText size={12} className="text-red-400" />
                        <span className="text-[9px] font-bold mt-0.5">CIP</span>
                      </a>
                      {selectedCompany.guarantor_ifu_pdf ? (
                        <a 
                          href={selectedCompany.guarantor_ifu_pdf.startsWith('http') ? selectedCompany.guarantor_ifu_pdf : `${API_URL}/uploads/${selectedCompany.guarantor_ifu_pdf}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                        >
                          <FileText size={12} className="text-red-400" />
                          <span className="text-[9px] font-bold mt-0.5">IFU</span>
                        </a>
                      ) : (
                        <div className="p-1.5 rounded bg-zinc-900/50 border border-zinc-800/30 flex flex-col items-center justify-center text-zinc-600">
                          <span className="text-[9px] font-bold">N/A</span>
                        </div>
                      )}
                      <a 
                        href={selectedCompany.guarantor_selfie?.startsWith('http') ? selectedCompany.guarantor_selfie : `${API_URL}/uploads/${selectedCompany.guarantor_selfie}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 rounded bg-surface-custom hover:bg-zinc-800 border border-border-custom/50 flex flex-col items-center justify-center text-center text-zinc-300 hover:text-white transition-colors"
                      >
                        <Video size={12} className="text-red-400" />
                        <span className="text-[9px] font-bold mt-0.5">Selfie</span>
                      </a>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── SECTION 04: PORTEFEUILLE FINANCIER ── */}
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom space-y-3.5">
                <h4 className="font-bold text-xs text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2 flex justify-between items-center">
                  <span>04. Situation du Portefeuille Financier</span>
                  {selectedCompany.wallet && selectedCompany.wallet.activated_at ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-bold uppercase">
                      Actif depuis le {new Date(selectedCompany.wallet.activated_at).toLocaleDateString('fr-FR')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/40 text-amber-400 border border-amber-900/40 font-bold uppercase">
                      Non Activé Financièrement
                    </span>
                  )}
                </h4>

                {selectedCompany.wallet && selectedCompany.wallet.activated_at ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 rounded bg-surface-custom/30 border border-border-custom/50">
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Acompte Initial (1/3)</span>
                      <span className="text-white font-mono font-bold text-sm">{Number(selectedCompany.wallet.acompte_initial).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="p-3 rounded bg-surface-custom/30 border border-border-custom/50">
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Acompte Restant</span>
                      <span className="text-white font-mono font-bold text-sm">{Number(selectedCompany.wallet.acompte_restant).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="p-3 rounded bg-surface-custom/30 border border-border-custom/50">
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Ligne de Crédit (2/3)</span>
                      <span className="text-white font-mono font-bold text-sm">{Number(selectedCompany.wallet.credit_initial).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="p-3 rounded bg-surface-custom/30 border border-border-custom/50">
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Crédit Consommé</span>
                      <span className="text-white font-mono font-bold text-sm">{Number(selectedCompany.wallet.credit_utilise).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded bg-zinc-950/50 border border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-300">
                        Ce portefeuille n'est pas encore activé financièrement.
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Le dépôt d'acompte initial requis (configuré globalement) est de <strong className="text-white font-mono">{Number(minActivationDeposit).toLocaleString('fr-FR')} FCFA</strong>. La ligne de crédit associée sera fixée au double ({Number(minActivationDeposit * 2).toLocaleString('fr-FR')} FCFA).
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleActivateWallet(selectedCompany.id)}
                      disabled={walletLoading}
                      className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/20 animate-pulse"
                    >
                      🚀 {walletLoading ? 'Activation...' : 'Activer le Portefeuille'}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end mt-6 border-t border-zinc-900 pt-4 gap-2">
              
              {/* Direct Approve/Reject buttons inside detail modal */}
              {selectedCompany.kyc_status === 'PENDING' && (
                <div className="mr-auto flex gap-2">
                  <button 
                    onClick={async () => {
                      await handleUpdateKyc(selectedCompany.id, 'APPROVED');
                      setSelectedCompany(prev => ({ ...prev, kyc_status: 'APPROVED' }));
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-emerald-950/20"
                  >
                    ✓ Approuver le client
                  </button>
                  <button 
                    onClick={async () => {
                      await handleUpdateKyc(selectedCompany.id, 'REJECTED');
                      setSelectedCompany(prev => ({ ...prev, kyc_status: 'REJECTED' }));
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-900/50 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    ✗ Rejeter le dossier
                  </button>
                </div>
              )}

              {selectedCompany.kyc_status === 'DEACTIVATED' && (
                <button 
                  onClick={async () => {
                    await handleUpdateKyc(selectedCompany.id, 'APPROVED');
                    setSelectedCompany(null);
                  }}
                  disabled={actionLoading}
                  className="mr-auto px-5 py-2 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-emerald-950/20"
                >
                  Réactiver le compte (48h)
                </button>
              )}

              <button 
                onClick={() => handleDeleteCompany(selectedCompany.id)}
                className="px-4 py-2 rounded bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-semibold cursor-pointer transition-colors"
              >
                Supprimer l'entreprise
              </button>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 rounded bg-surface-custom hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default DashboardAdmin;
