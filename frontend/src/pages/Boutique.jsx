import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, QrCode, Plus,
  ArrowLeft, Filter, Maximize2, ShoppingBag, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import jsQR from 'jsqr';
// ─── TOUTES LES CATÉGORIES ────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Mobilier de Bureau',            image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sièges & Fauteuils',            image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tables & Bureaux',              image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80' },
  { name: 'Rangement & Armoires',          image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80' },
  { name: "Mobilier d'Accueil",            image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Mobilier de Salle de Réunion',  image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80' },
  { name: 'Mobilier Extérieur',            image: 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=600&q=80' },
  { name: 'Décoration & Accessoires',      image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80' },
  { name: 'Autre',                         image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
];

function Boutique({ user, cart, setCart, wallet, forceShowProducts, setForceShowProducts }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQty, setDetailQty] = useState(1);

  // Filtre Prix
  const [maxPrice, setMaxPrice] = useState(3000000);

  // Proposer mon modèle Modal
  const [showProposerModal, setShowProposerModal] = useState(false);
  const [proposerContact, setProposerContact] = useState('');
  const [proposerDesc, setProposerDesc] = useState('');
  const [proposerFile, setProposerFile] = useState(null);
  const [proposerError, setProposerError] = useState('');
  const [proposerSuccess, setProposerSuccess] = useState('');
  const [submittingProposer, setSubmittingProposer] = useState(false);

  // QR Camera scanner Modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = React.useRef(null);

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Votre navigateur ne supporte pas l'accès à la caméra ou nécessite une connexion sécurisée (HTTPS).");
      setShowCameraModal(true);
      return;
    }
    try {
      // On essaye d'abord la caméra arrière (téléphone)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      setCameraStream(stream);
      setShowCameraModal(true);
    } catch (err) {
      try {
        // En cas d'échec (ex: PC sans caméra arrière), on essaie n'importe quelle caméra dispo
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(fallbackStream);
        setShowCameraModal(true);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
           setCameraError("L'accès à la caméra a été refusé. Veuillez vérifier les permissions de votre navigateur.");
        } else if (fallbackErr.name === 'NotFoundError') {
           setCameraError("Aucune caméra n'a été détectée sur cet appareil.");
        } else if (fallbackErr.name === 'NotReadableError') {
           setCameraError("La caméra est déjà utilisée par une autre application ou est inaccessible.");
        } else {
           setCameraError("Erreur caméra : " + (fallbackErr.message || "Erreur inconnue"));
        }
        setShowCameraModal(true);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowCameraModal(false);
  };

  // Bind video stream to <video> when modal opens and scan QR code
  const canvasRef = React.useRef(document.createElement('canvas'));

  useEffect(() => {
    let animationFrameId;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            console.log("Found QR code", code.data);
            stopCamera();
            setSearchQuery(code.data);
            if (setForceShowProducts) setForceShowProducts(true);
            return;
          }
        } catch (err) {
          // Ignore canvas errors
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.setAttribute("playsinline", true); // Important for iOS
      videoRef.current.play().then(() => {
        animationFrameId = requestAnimationFrame(tick);
      }).catch(e => console.error(e));
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [showCameraModal, cameraStream]);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Si on force l'affichage depuis le menu "Produits"
  // Si on force l'affichage depuis le menu "Produits"
  useEffect(() => {
    if (forceShowProducts) {
      if (!selectedCategory) {
        setSelectedCategory('Tous les produits');
      }
      setSelectedProduct(null);
    } else {
      setSelectedCategory(null);
      setSelectedProduct(null);
    }
  }, [forceShowProducts]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Appliquer filtres catégorie, recherche et prix
  useEffect(() => {
    let result = products;

    if (selectedCategory && selectedCategory !== 'Tous les produits' && selectedCategory !== 'search') {
      result = result.filter(p =>
        p.category === selectedCategory ||
        // fallback: keyword match for products without category set yet
        (!p.category && selectedCategory.toLowerCase().split(' ').some(kw =>
          p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)
        ))
      );
    }

    if (searchQuery.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    result = result.filter(p => Number(p.price) <= maxPrice);

    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, maxPrice, products]);

  const handleCategoryClick = (catName) => {
    setSelectedCategory(catName);
    setSelectedProduct(null);
    setSearchQuery('');
    if (setForceShowProducts) {
      setForceShowProducts(true);
    }
  };

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find(i => i.id === product.id);
    setCart(existing
      ? cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
      : [...cart, { ...product, quantity }]
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  if (!user) {
    return (
      <div className="flex-1 bg-[#0a0a0a] min-h-screen flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute max-w-[400px] w-[60vw] h-[60vw] max-h-[400px] rounded-full bg-red-950/10 blur-[130px] top-1/4 left-1/4"></div>
        <div className="absolute max-w-[300px] w-[50vw] h-[50vw] max-h-[300px] rounded-full bg-red-950/5 blur-[100px] bottom-1/4 right-1/4"></div>

        <div className="max-w-xl w-full glass-panel p-8 sm:p-10 rounded-2xl border border-zinc-850 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-red-950/30 border border-red-800/50 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse shadow-md shadow-red-950/30">
             <ShoppingBag size={28} />
          </div>
          <div className="space-y-3">
             <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Espace VIP GMD</h3>
             <p className="text-sm text-zinc-400 leading-relaxed">
               Le catalogue de produits et les services financiers de GMD sont exclusivement réservés aux entreprises partenaires enregistrées et approuvées.
             </p>
          </div>
          
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 text-left space-y-2">
             <p className="text-xs font-semibold text-zinc-350">
               Pourquoi cette restriction ?
             </p>
             <p className="text-[11px] text-zinc-500 leading-relaxed">
               En tant que plateforme B2B et grossiste privilégié, GMD requiert la validation des documents de conformité (RCCM, IFU) et l'analyse de crédit avant d'ouvrir l'accès aux commandes et grilles tarifaires.
             </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
             <Link to="/login" className="px-6 py-2.5 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-950/20 cursor-pointer">
                Se connecter
             </Link>
             <Link to="/register" className="px-6 py-2.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-bold transition-all cursor-pointer">
                Créer un compte entreprise
             </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.role === 'CLIENT' && user.company?.kyc_status !== 'APPROVED') {
    return (
      <div className="flex-1 bg-[#0a0a0a] min-h-screen flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute max-w-[400px] w-[60vw] h-[60vw] max-h-[400px] rounded-full bg-red-950/10 blur-[130px] top-1/4 left-1/4"></div>
        <div className="absolute max-w-[300px] w-[50vw] h-[50vw] max-h-[300px] rounded-full bg-[#004d26]/10 blur-[100px] bottom-1/4 right-1/4"></div>

        <div className="max-w-xl w-full glass-panel p-8 sm:p-10 rounded-2xl border border-zinc-850 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-red-950/30 border border-red-800/50 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse shadow-md shadow-red-950/30">
             <ShoppingBag size={28} />
          </div>
          <div className="space-y-3">
             <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Accès au Catalogue Restreint</h3>
             <p className="text-sm text-zinc-400 leading-relaxed">
               Cette section (Boutique et catalogue de produits) sera disponible dès que votre compte entreprise aura été validé et approuvé par les administrateurs de GMD.
             </p>
          </div>
          
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 text-left space-y-3">
             <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Statut actuel de conformité :
                <span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-800/40 text-[10px] uppercase font-bold">
                  {user.company?.kyc_status === 'REJECTED' 
                    ? 'REJETÉ / À CORRIGER' 
                    : user.company?.kyc_status === 'DEACTIVATED'
                      ? 'DÉSACTIVÉ (48H DÉPASSÉ)'
                      : 'EN ATTENTE D\'AUDIT'}
                </span>
             </div>
             <p className="text-[11px] text-zinc-500 leading-relaxed">
               {user.company?.kyc_status === 'REJECTED' 
                 ? "Votre dossier de conformité n'a pas été validé. Veuillez contacter le support administratif de GMD pour corriger les pièces fournies."
                 : user.company?.kyc_status === 'DEACTIVATED'
                   ? "Votre compte a été automatiquement désactivé car aucune commande n'a été passée dans les 48 heures suivant sa validation. Veuillez contacter GMD pour réactiver votre accès."
                   : "Nos équipes examinent actuellement les documents d'identification fiscale (IFU) et de registre de commerce (RCCM) soumis lors de votre inscription."
               }
             </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
             <Link to="/dashboard?tab=profil" className="px-6 py-2.5 rounded bg-red-900/10 hover:bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-bold transition-all shadow-md shadow-red-950/20 cursor-pointer">
                Consulter mon Profil
             </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] min-h-screen">

      {/* ── SEARCH BAR Mockup Replica ───────────────────── */}
      <div className="bg-black/60 border-b border-zinc-950 px-6 py-6">
        <div className="max-w-4xl mx-auto p-3.5 rounded-xl border border-zinc-900 bg-[#0c0c0e] space-y-3 shadow-2xl">
          
          {/* Row 1: Scan text + QR icon (Opens Camera) */}
          <div 
            onClick={startCamera}
            className="flex items-center justify-between border border-zinc-900 bg-black/40 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-black/60 transition-colors"
          >
            <span className="text-zinc-400 text-[11px] font-semibold tracking-wide">
              Rechercher un produit ou scanner son QR code
            </span>
            <button className="icon-btn focus:outline-none cursor-pointer">
              <QrCode size={15} style={{ color: '#cc0000' }} />
            </button>
          </div>

          {/* Row 2: Search input + Outline Button */}
          <div className="flex items-center gap-3 border border-zinc-900 bg-black/40 rounded-lg px-4 py-1.5">
            <Search size={15} className="text-zinc-650 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code produit..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!selectedCategory) {
                  setSelectedCategory('Tous les produits');
                }
                setSelectedProduct(null);
              }}
              className="flex-1 bg-transparent text-[11px] text-zinc-300 placeholder-zinc-700 outline-none w-full border-none py-1"
            />
            <button className="btn-ghost border border-zinc-700 hover:border-zinc-500 rounded px-4 py-1 text-[11px] font-bold text-zinc-100 bg-transparent cursor-pointer transition-all">
              Chercher
            </button>
          </div>

          {/* Row 3: propose model link */}
          <div className="border border-zinc-900 bg-black/40 rounded-lg px-4 py-2.5 text-left">
            <button
              onClick={() => {
                if (user) {
                  setProposerError('');
                  setProposerSuccess('');
                  setShowProposerModal(true);
                } else {
                  navigate('/login');
                }
              }}
              className="text-zinc-500 hover:text-zinc-300 text-[11px] font-medium transition-colors bg-transparent border-none outline-none cursor-pointer"
            >
              proposer mon model
            </button>
          </div>

        </div>
      </div>

      {/* ── CONTENT AREA ────────────────────────────────── */}
      {selectedProduct ? (
        /* ── VUE DE DÉTAIL DU PRODUIT ── */
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 fade-up">
          <div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="icon-btn w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer shadow"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Image Column */}
            <div className="img-zoom relative rounded-2xl bg-zinc-900 border border-zinc-800 h-[400px] md:h-[500px] shadow-xl">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button 
                title="Agrandir l'image"
                className="icon-btn absolute top-4 right-4 w-9 h-9 rounded-lg bg-black/60 text-white flex items-center justify-center cursor-pointer"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Info Column */}
            <div className="bg-[#111111] border border-zinc-800/80 rounded-2xl p-8 space-y-6 shadow-lg">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white tracking-wide">{selectedProduct.name}</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-3">
                  Matière : Velours / Tissu Premium | Couleur : Disponible en plusieurs coloris | Dimensions standards GMD.
                </p>
                <div className="pt-2">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                  {selectedProduct.custom_data && (
                    <div className="mt-3 text-xs text-zinc-300 space-y-1">
                      {Object.entries(selectedProduct.custom_data).map(([k, v]) => (
                        <div key={k}><span className="text-zinc-500 mr-2 font-mono">{k}:</span> <span className="text-white">{String(v)}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl font-black text-[#cc0000]">
                  {Number(selectedProduct.price).toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-sm text-zinc-550 line-through">
                  {(Number(selectedProduct.price) * 1.15).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Quantity selector and Cart button */}
              <div className="flex items-center gap-4 pt-6 border-t border-zinc-850">
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1.5">
                  <button
                    onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                    className="w-9 h-9 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-zinc-800 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-white font-bold text-base">
                    {detailQty}
                  </span>
                  <button
                    onClick={() => setDetailQty(detailQty + 1)}
                    className="w-9 h-9 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-zinc-800 transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProduct, detailQty);
                    setSelectedProduct(null);
                    navigate('/panier');
                  }}
                  className="btn-glow flex-1 py-3.5 rounded-xl bg-[#cc0000] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/40"
                >
                  <ShoppingCart size={18} /> Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : selectedCategory ? (
        /* ── VUE CATALOGUE PRODUIT AVEC FILTRES ── */
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Colonne Gauche: Filtres */}
            <div className="w-full md:w-68 shrink-0 bg-[#111111] border border-zinc-800/80 rounded-2xl p-5 space-y-6 h-fit shadow-md">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Filter size={16} className="text-red-500" /> Filtres
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    if (setForceShowProducts) setForceShowProducts(false);
                    setSearchQuery('');
                    setMaxPrice(3000000);
                  }}
                  className="btn-ghost text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={12} /> Retour Accueil
                </button>
              </div>

              <div className="space-y-2.5">
                <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider block">Prix max : {maxPrice.toLocaleString('fr-FR')} FCFA</label>
                <input
                  type="range"
                  min="50000"
                  max="3000000"
                  step="50000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-red-600 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Catégories</p>
                <button
                  onClick={() => setSelectedCategory('Tous les produits')}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === 'Tous les produits' 
                      ? 'bg-red-950/40 text-red-400 border-l-2 border-red-500 pl-3' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  Tous les produits
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex justify-between items-center ${
                      selectedCategory === cat.name 
                        ? 'bg-red-950/40 text-red-400 border-l-2 border-red-500 pl-3' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-zinc-600">produits</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grille des produits filtrés */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-white font-bold text-xl tracking-wide">
                  {selectedCategory}
                </h2>
                <span className="text-zinc-550 text-sm">({filteredProducts.length} produits trouvés)</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6].map(n => (
                    <div key={n} className="h-68 rounded-2xl bg-zinc-900/60 animate-pulse"></div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 space-y-2 bg-[#111111] border border-zinc-800/60 rounded-2xl">
                  <ShoppingBag size={48} className="mx-auto stroke-[1.5] text-zinc-700" />
                  <p className="text-sm font-medium">Aucun produit ne correspond à ces filtres.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => { setSelectedProduct(product); setDetailQty(1); }}
                      className="card-hover rounded-2xl bg-[#111111] border border-zinc-800 overflow-hidden cursor-pointer shadow-md"
                    >
                      <div className="img-zoom h-48 bg-zinc-900 relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed h-8">{product.description}</p>
                        {product.custom_data && (
                          <div className="text-[10px] text-zinc-500 mt-1 flex gap-2 flex-wrap">
                            {Object.entries(product.custom_data).slice(0,3).map(([k,v]) => (
                              <span key={k} className="px-2 py-0.5 rounded bg-zinc-900/60">{k}: {String(v)}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                          <p className="font-bold text-white text-base">{Number(product.price).toLocaleString('fr-FR')} <span className="text-zinc-550 text-[10px]">FCFA</span></p>
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(product); navigate('/panier'); }}
                            className="btn-glow px-3.5 py-2 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={12} /> Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* ── VUE ACCUEIL standard (Dégagée et Aérée) ── */
        <div className="space-y-8 pb-16">
          {/* Hero Banner */}
          <div className="max-w-6xl mx-auto px-6 pt-6 fade-up">
            <div className="img-zoom relative h-[280px] rounded-2xl shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"
                alt="Mobilier de prestige GMD"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 space-y-2">
                <h1 className="text-white font-black text-2xl md:text-3xl leading-tight">
                  Créez un intérieur qui impose son style.
                </h1>
                <p className="text-zinc-300 text-xs md:text-sm max-w-xl leading-relaxed">
                  Des lignes premium, des finitions élégantes et des modèles pensés pour sublimer votre salon dès le premier regard.
                </p>
              </div>
            </div>
          </div>

          {/* Portefeuille actif */}
          {user?.role === 'CLIENT' && wallet?.activated_at && (
            <div className="max-w-6xl mx-auto px-6">
              <div className="bg-red-950/20 border border-red-900/40 rounded-xl px-5 py-3 flex items-center justify-between text-xs md:text-sm">
                <span className="text-zinc-400 font-semibold">Portefeuille disponible :</span>
                <div className="flex items-center gap-6">
                  <span className="text-zinc-300">
                    Acompte : <span className="font-black text-white">{Number(wallet.acompte_restant).toLocaleString('fr-FR')} FCFA</span>
                  </span>
                  <span className="text-zinc-300">
                    Crédit : <span className="font-black text-white">{(Number(wallet.credit_initial) - Number(wallet.credit_utilise)).toLocaleString('fr-FR')} FCFA</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grille de catégories */}
          <div className="px-6 max-w-6xl mx-auto space-y-4">
            <h2 className="text-white font-black text-xl border-b border-zinc-900 pb-2">Catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="card-hover rounded-2xl overflow-hidden bg-[#111111] border border-zinc-800 cursor-pointer text-left shadow fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="img-zoom h-40 relative bg-zinc-900">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-90" />
                  </div>
                  <div className="px-4 py-3 space-y-0.5">
                    <p className="font-bold text-white text-sm transition-colors group-hover:text-red-500">{cat.name}</p>
                    <p className="text-red-500 text-[10px] uppercase font-bold tracking-wider">produits</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CART FAB → navigue vers /panier ─────── */}
      {cartCount > 0 && (
        <Link
          to="/panier"
          className="cart-fab fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#cc0000] text-white flex items-center justify-center shadow-2xl shadow-red-950/50 z-50"
        >
          <ShoppingCart size={22} />
          <span className="badge-pulse absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[#cc0000] text-[11px] font-black flex items-center justify-center">
            {cartCount}
          </span>
        </Link>
      )}
      {/* ── MODAL PROPOSER MON MODEL ────────────────────────── */}
      {showProposerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="modal-scale w-full max-w-md bg-[#0f0f11] border border-zinc-900 rounded-2xl p-6 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b border-zinc-900 pb-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Proposer mon model</h3>
              <button 
                onClick={() => setShowProposerModal(false)}
                className="icon-btn w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Error & Success Messages */}
            {proposerError && (
              <div className="mb-4 p-3.5 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs">
                {proposerError}
              </div>
            )}
            {proposerSuccess && (
              <div className="mb-4 p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs">
                {proposerSuccess}
              </div>
            )}

            {/* Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingProposer(true);
                setProposerError('');
                setProposerSuccess('');

                try {
                  const formData = new FormData();
                  formData.append('companyId', user?.company?.id || '');
                  formData.append('description', `[Contact: ${proposerContact}] - ${proposerDesc}`);
                  formData.append('quantity', '1');
                  if (proposerFile) formData.append('image', proposerFile);

                  const res = await fetch(`${API_URL}/api/special-requests`, {
                    method: 'POST',
                    body: formData
                  });

                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);

                  setProposerSuccess(data.message);
                  setProposerContact('');
                  setProposerDesc('');
                  setProposerFile(null);
                  setTimeout(() => setShowProposerModal(false), 2000);

                } catch (err) {
                  setProposerError(err.message);
                } finally {
                  setSubmittingProposer(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* File Upload */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sélectionner Image</label>
                <div className="flex items-center justify-between border border-zinc-900 bg-black/40 rounded-lg px-3.5 py-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProposerFile(e.target.files[0])}
                    className="w-full text-zinc-400 text-[11px] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-zinc-800 file:text-[10px] file:font-semibold file:bg-zinc-950 file:text-zinc-300 hover:file:bg-zinc-900 file:cursor-pointer"
                  />
                </div>
              </div>

              {/* Contact Input */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contact</label>
                <input
                  type="text"
                  required
                  placeholder="Votre numero de contact"
                  value={proposerContact}
                  onChange={(e) => setProposerContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-zinc-900 text-zinc-300 placeholder-zinc-700 outline-none focus:border-red-900 transition-colors"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Decrivez le modele souhaite"
                  value={proposerDesc}
                  onChange={(e) => setProposerDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-zinc-900 text-zinc-300 placeholder-zinc-700 outline-none focus:border-red-900 transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingProposer}
                className="btn-glow w-full py-3 rounded-xl bg-[#cc0000] text-white font-bold text-sm flex items-center justify-center cursor-pointer shadow-lg shadow-red-950/40 disabled:opacity-60 transition-all"
              >
                {submittingProposer ? 'Envoi en cours...' : 'Envoyer'}
              </button>

            </form>
          </div>
        </div>
      )}
      {/* ── MODAL CAMERA SCANNER QR ─────────────────────────── */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[110] backdrop-blur-md">
          <div className="modal-scale w-full max-w-md bg-[#0f0f11] border border-zinc-900 rounded-2xl p-6 shadow-2xl relative text-center space-y-4">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Scanner un QR Code GMD</h3>
              <button 
                onClick={stopCamera}
                className="icon-btn w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Error display */}
            {cameraError ? (
              <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs text-left leading-relaxed">
                {cameraError}
              </div>
            ) : (
              /* Camera view with laser scan animation */
              <div className="relative w-full aspect-square md:aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-inner flex items-center justify-center">
                
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />

                {/* Laser scan lines */}
                <div className="laser-scan absolute left-0 w-full h-0.5 bg-red-650 opacity-80 shadow-[0_0_12px_#ff0000]"></div>
                
                {/* Overlay target corners */}
                <div className="absolute inset-8 border-2 border-white/20 pointer-events-none rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-white/50 bg-black/60 px-2 py-0.5 rounded font-mono">CIBLER LE QR CODE</span>
                </div>

              </div>
            )}

            <button 
              onClick={stopCamera}
              className="btn-glow px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold w-full cursor-pointer"
            >
              Fermer le scanner
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default Boutique;
