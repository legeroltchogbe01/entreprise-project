import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, Upload, CheckCircle, AlertTriangle, Video, Camera, X, FileText } from 'lucide-react';
import { API_URL } from '../config';

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Entreprise
    denomination_sociale: '',
    rccm_number: '',
    ifu_number: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    house: '',
    square: '-',
    
    // Gérant
    manager_name: '',
    manager_ifu: '',
    manager_phone: '',
    manager_email: '',
    manager_city: '',
    manager_district: '',
    manager_house: '',
    manager_square: '-',

    // Avaliseur
    guarantor_name: '',
    guarantor_ifu: '',
    guarantor_phone: '',
    guarantor_email: '',
    guarantor_city: '',
    guarantor_district: '',
    guarantor_house: '',
    guarantor_square: '-',
  });

  // Files State
  const [files, setFiles] = useState({
    company_ifu_pdf: null,
    company_rccm_pdf: null,
    manager_cip_pdf: null,
    manager_selfie: null,
    manager_ifu_pdf: null,
    guarantor_cip_pdf: null,
    guarantor_selfie: null,
    guarantor_ifu_pdf: null,
  });

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (['ifu_number', 'manager_ifu', 'guarantor_ifu'].includes(e.target.name)) {
      // Strip any character that is not a digit
      val = val.replace(/\D/g, '');
    }
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  // Video KYC State
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycRole, setKycRole] = useState(null); // 'manager' | 'guarantor'
  const [kycStream, setKycStream] = useState(null);
  const [kycPhase, setKycPhase] = useState('idle'); // 'idle' | 'recording' | 'done'
  const [kycInstruction, setKycInstruction] = useState("Veuillez bien cadrer votre visage et cliquer sur Démarrer.");
  const [kycProgress, setKycProgress] = useState(0);
  const kycVideoRef = React.useRef(null);
  const kycMediaRecorderRef = React.useRef(null);
  const kycChunksRef = React.useRef([]);

  const startKYC = (role) => {
    setKycRole(role);
    setShowKYCModal(true);
    setKycPhase('idle');
    setKycInstruction("Veuillez bien cadrer votre visage et cliquer sur Démarrer.");
    setKycProgress(0);
    startKYCCamera();
  };

  const startKYCCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setKycStream(stream);
    } catch (err) {
      console.error(err);
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const stopKYCCamera = () => {
    if (kycStream) {
      kycStream.getTracks().forEach(t => t.stop());
    }
    setKycStream(null);
  };

  const closeKYCModal = () => {
    stopKYCCamera();
    setShowKYCModal(false);
  };

  const startKYCRecording = () => {
    if (!kycStream) return;
    setKycPhase('recording');
    kycChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(kycStream);
    kycMediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        kycChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(kycChunksRef.current, { type: 'video/webm' });
      setFiles(prev => ({
        ...prev,
        [kycRole === 'manager' ? 'manager_selfie' : 'guarantor_selfie']: blob
      }));
      setKycPhase('done');
      stopKYCCamera();
    };

    mediaRecorder.start();

    // Sequence d'instructions type Binance
    const instructions = [
      { text: "Regardez lentement vers la GAUCHE", time: 2000 },
      { text: "Regardez lentement vers la DROITE", time: 5000 },
      { text: "Levez la tête vers le HAUT", time: 8000 },
      { text: "Baissez la tête vers le BAS", time: 11000 },
      { text: "Regardez l'objectif de face et souriez !", time: 14000 },
    ];

    let startTime = Date.now();
    const duration = 16000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setKycProgress(progress);
      
      const currentInst = instructions.slice().reverse().find(inst => elapsed >= inst.time);
      if (currentInst) {
        setKycInstruction(currentInst.text);
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        if (kycMediaRecorderRef.current && kycMediaRecorderRef.current.state !== 'inactive') {
          kycMediaRecorderRef.current.stop();
        }
      }
    }, 100);
  };

  React.useEffect(() => {
    if (showKYCModal && kycStream && kycVideoRef.current && kycPhase !== 'done') {
      kycVideoRef.current.srcObject = kycStream;
    }
  }, [showKYCModal, kycStream, kycPhase]);

  const isLettersOnly = (val) => /^[A-Za-zÀ-ÿ\s'-]+$/.test(val.trim());
  const isDigitsOnly = (val) => /^\d+$/.test(val.trim());
  const isValidPhone = (val) => /^\d{10}$/.test(val.trim());
  const isValidEmail = (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim().toLowerCase());
  const isValidRCCM = (val) => val.trim() !== '';
  const isAlphanumeric = (val) => /^[a-zA-Z0-9À-ÿ\s'-]+$/.test(val.trim());

  const isStep1Valid = () => {
    return (
      formData.denomination_sociale.trim() !== '' &&
      isValidRCCM(formData.rccm_number) &&
      formData.rccm_number.trim().length >= 12 &&
      formData.rccm_number.trim().length <= 15 &&
      isDigitsOnly(formData.ifu_number) &&
      formData.ifu_number.trim().length === 13 &&
      isValidPhone(formData.phone) &&
      isValidEmail(formData.email) &&
      isLettersOnly(formData.city) &&
      isLettersOnly(formData.district) &&
      formData.house.trim() !== '' &&
      files.company_ifu_pdf !== null &&
      files.company_rccm_pdf !== null
    );
  };

  const isStep2Valid = () => {
    return (
      isLettersOnly(formData.manager_name) &&
      isDigitsOnly(formData.manager_ifu) &&
      formData.manager_ifu.trim().length === 13 &&
      isValidPhone(formData.manager_phone) &&
      isValidEmail(formData.manager_email) &&
      isLettersOnly(formData.manager_city) &&
      isLettersOnly(formData.manager_district) &&
      formData.manager_house.trim() !== '' &&
      files.manager_cip_pdf !== null &&
      files.manager_ifu_pdf !== null &&
      files.manager_selfie !== null
    );
  };

  const isStep3Valid = () => {
    return (
      isLettersOnly(formData.guarantor_name) &&
      isDigitsOnly(formData.guarantor_ifu) &&
      formData.guarantor_ifu.trim().length === 13 &&
      isValidPhone(formData.guarantor_phone) &&
      isValidEmail(formData.guarantor_email) &&
      isLettersOnly(formData.guarantor_city) &&
      isLettersOnly(formData.guarantor_district) &&
      formData.guarantor_house.trim() !== '' &&
      files.guarantor_cip_pdf !== null &&
      files.guarantor_ifu_pdf !== null &&
      files.guarantor_selfie !== null
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.denomination_sociale || !formData.rccm_number || !formData.ifu_number || !formData.phone || !formData.email || !formData.city || !formData.district || !formData.house) {
        setError('Veuillez remplir toutes les informations d\'entreprise (y compris l\'adresse complète).');
        return;
      }
      if (formData.ifu_number.trim().length !== 13) {
        setError("Le numéro IFU de l'entreprise doit contenir exactement 13 caractères.");
        return;
      }
      const rccmLength = formData.rccm_number.trim().length;
      if (rccmLength < 12 || rccmLength > 15) {
        setError("Le numéro RCCM de l'entreprise doit contenir entre 12 et 15 caractères.");
        return;
      }
      if (!files.company_ifu_pdf || !files.company_rccm_pdf) {
        setError('Veuillez importer le document IFU et le document RCCM de l\'entreprise.');
        return;
      }
    } else if (step === 2) {
      // Validation Gérant
      if (!formData.manager_name || !formData.manager_ifu || !formData.manager_phone || !formData.manager_email || !formData.manager_city || !formData.manager_district || !formData.manager_house) {
        setError('Veuillez remplir toutes les informations obligatoires du Gérant.');
        return;
      }
      if (formData.manager_ifu.trim().length !== 13) {
        setError("Le numéro IFU du gérant doit contenir exactement 13 caractères.");
        return;
      }
      if (!files.manager_cip_pdf || !files.manager_selfie || !files.manager_ifu_pdf) {
        setError('Veuillez fournir la copie de la CIP, le document IFU et effectuer la vérification vidéo KYC pour le Gérant.');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Final validation - guarantor fields
    if (!formData.guarantor_name || !formData.guarantor_ifu || !formData.guarantor_phone || !formData.guarantor_email || !formData.guarantor_city || !formData.guarantor_district || !formData.guarantor_house) {
      setError('Veuillez remplir toutes les informations obligatoires de l\'Avaliseur (Garant).');
      return;
    }
    if (formData.guarantor_ifu.trim().length !== 13) {
      setError("Le numéro IFU du garant doit contenir exactement 13 caractères.");
      return;
    }

    // Final validation - files
    if (
      !files.company_ifu_pdf ||
      !files.company_rccm_pdf ||
      !files.manager_cip_pdf ||
      !files.manager_selfie ||
      !files.manager_ifu_pdf ||
      !files.guarantor_cip_pdf ||
      !files.guarantor_selfie ||
      !files.guarantor_ifu_pdf
    ) {
      setError('Veuillez importer toutes les pièces justificatives requises (RCCM, IFU, CIP et Selfie vidéo KYC pour le gérant et le garant).');
      return;
    }

    setLoading(true);

    const postData = new FormData();
    // Append standard fields with trimming and lowercasing for emails
    Object.keys(formData).forEach(key => {
      let val = formData[key];
      if (typeof val === 'string') {
        if (key === 'email' || key === 'manager_email' || key === 'guarantor_email') {
          val = val.toLowerCase().trim();
        } else {
          val = val.trim();
        }
      }
      postData.append(key, val);
    });
    // Append files
    Object.keys(files).forEach(key => {
      if (files[key] instanceof Blob && !(files[key] instanceof File)) {
        postData.append(key, files[key], `${key}.webm`);
      } else {
        postData.append(key, files[key]);
      }
    });

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        body: postData
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error("Le serveur a renvoyé une réponse invalide (HTML). Si le backend vient d'être déployé ou est hébergé gratuitement sur Render, il est probablement en cours de démarrage. Veuillez patienter 30 secondes et réessayer.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission du dossier.');
      }

      setSuccess('Votre dossier a été soumis avec succès ! L\'équipe administrative de GMD va l\'auditer.');
      setStep(4); // Success step

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validation error flags
  const errCompanyDenomination = formData.denomination_sociale !== '' && formData.denomination_sociale.trim() === '';
  const errCompanyEmail = formData.email.trim() !== '' && !isValidEmail(formData.email);
  const errCompanyPhone = formData.phone.trim() !== '' && !isValidPhone(formData.phone);
  const errCompanyRccm = formData.rccm_number.trim() !== '' && (formData.rccm_number.trim().length < 12 || formData.rccm_number.trim().length > 15);
  const errCompanyIfu = formData.ifu_number.trim() !== '' && formData.ifu_number.trim().length !== 13;
  const errCompanyCity = formData.city.trim() !== '' && !isLettersOnly(formData.city);
  const errCompanyDistrict = formData.district.trim() !== '' && !isLettersOnly(formData.district);

  const errManagerName = formData.manager_name.trim() !== '' && !isLettersOnly(formData.manager_name);
  const errManagerIfu = formData.manager_ifu.trim() !== '' && formData.manager_ifu.trim().length !== 13;
  const errManagerPhone = formData.manager_phone.trim() !== '' && !isValidPhone(formData.manager_phone);
  const errManagerEmail = formData.manager_email.trim() !== '' && !isValidEmail(formData.manager_email);
  const errManagerCity = formData.manager_city.trim() !== '' && !isLettersOnly(formData.manager_city);
  const errManagerDistrict = formData.manager_district.trim() !== '' && !isLettersOnly(formData.manager_district);

  const errGuarantorName = formData.guarantor_name.trim() !== '' && !isLettersOnly(formData.guarantor_name);
  const errGuarantorIfu = formData.guarantor_ifu.trim() !== '' && formData.guarantor_ifu.trim().length !== 13;
  const errGuarantorPhone = formData.guarantor_phone.trim() !== '' && !isValidPhone(formData.guarantor_phone);
  const errGuarantorEmail = formData.guarantor_email.trim() !== '' && !isValidEmail(formData.guarantor_email);
  const errGuarantorCity = formData.guarantor_city.trim() !== '' && !isLettersOnly(formData.guarantor_city);
  const errGuarantorDistrict = formData.guarantor_district.trim() !== '' && !isLettersOnly(formData.guarantor_district);

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12 bg-bg-main relative">
      <div className="absolute max-w-[400px] w-[60vw] h-[60vw] max-h-[400px] rounded-full bg-primary-custom/5 blur-[120px] top-1/4 left-1/4"></div>

      <div className="w-full max-w-3xl glass-panel p-4 sm:p-8 rounded-lg border border-border-custom relative z-10">
        
        {/* Step Indicator */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Étape {step} sur 3</span>
              <span className="text-sm font-semibold text-white">
                {step === 1 && 'Informations Entreprise'}
                {step === 2 && 'Informations du Gérant'}
                {step === 3 && 'Informations de l\'Avaliseur (Garant)'}
                
              </span>
            </div>
            <div className="h-1.5 w-full bg-bg-deepest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-custom transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-red-300 text-sm">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white tracking-wide border-b border-border-custom pb-2">01. Informations de l'Entreprise</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Dénomination Sociale *</label>
                <input 
                  type="text" required name="denomination_sociale" value={formData.denomination_sociale} onChange={handleInputChange}
                  placeholder="Ex: BENIN LOGISTICS SARL"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none transition-all text-base sm:text-sm ${errCompanyDenomination ? 'border-red-500/70 focus:border-red-400' : 'border-border-custom focus:border-red-500'}`}
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-amber-500/80 flex items-start gap-1">
                  <span className="mt-[1px] shrink-0">⚠️</span>
                  <span>Ce champ doit contenir la <strong>dénomination exacte</strong> telle qu'elle est inscrite sur le <strong>Registre de Commerce et du Crédit Mobilier (RCCM)</strong>. Toute différence de nom par rapport au RCCM entraînera le rejet du dossier de conformité KYC.</span>
                </p>
                {errCompanyDenomination && <p className="text-red-500 text-[10px] mt-1">Ce champ ne peut pas être vide.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Adresse Email Entreprise *</label>
                <input 
                  type="email" required name="email" value={formData.email} onChange={handleInputChange}
                  placeholder="contact@entreprise.bj"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errCompanyEmail ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errCompanyEmail && <p className="text-red-500 text-[10px] mt-1">Format d'adresse email invalide (ex: contact@domaine.com).</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Téléphone Officiel * (10 chiffres)</label>
                <input 
                  type="text" required name="phone" value={formData.phone} onChange={handleInputChange}
                  placeholder="Ex: 0197000000" maxLength={10}
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errCompanyPhone ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errCompanyPhone && <p className="text-red-500 text-[10px] mt-1">Le téléphone doit contenir exactement 10 chiffres.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Numéro RCCM * (12 à 15 caractères)</label>
                <input 
                  type="text" required name="rccm_number" value={formData.rccm_number} onChange={handleInputChange}
                  placeholder="Ex: RB-COT-26-B-1234" maxLength={15}
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errCompanyRccm ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errCompanyRccm && <p className="text-red-500 text-[10px] mt-1">Le RCCM doit contenir entre 12 et 15 caractères.</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Identifiant Fiscal Unique (IFU) * (13 chiffres)</label>
                <input 
                  type="text" required name="ifu_number" value={formData.ifu_number} onChange={handleInputChange}
                  placeholder="Ex: 3202612345678" maxLength={13}
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errCompanyIfu ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errCompanyIfu && <p className="text-red-500 text-[10px] mt-1">L'IFU doit contenir exactement 13 chiffres.</p>}
              </div>
            </div>

            <h4 className="text-sm font-bold text-zinc-300 tracking-wide border-b border-zinc-800 pb-2 pt-2">Adresse Géographique Entreprise</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ville *</label>
                <input 
                  type="text" name="city" required value={formData.city} onChange={handleInputChange} placeholder="Ex: Cotonou"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errCompanyCity ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errCompanyCity && <p className="text-red-500 text-[10px] mt-1">La ville ne doit contenir que des lettres.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Quartier *</label>
                <input 
                  type="text" name="district" required value={formData.district} onChange={handleInputChange} placeholder="Ex: Cadjehoun"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errCompanyDistrict ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errCompanyDistrict && <p className="text-red-500 text-[10px] mt-1">Le quartier ne doit contenir que des lettres.</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Maison/Carré *</label>
                <input 
                  type="text" name="house" required value={formData.house} onChange={handleInputChange} placeholder="Ex: Villa 12B, Carré 564"
                  className="w-full px-4 py-2.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm"
                />
              </div>
            </div>

            <h4 className="text-sm font-bold text-zinc-300 tracking-wide border-b border-zinc-800 pb-2 pt-6">Pièces Justificatives (Entreprise)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Document IFU (PDF) *</label>
                  <label className="flex-1 border border-dashed border-border-custom hover:border-zinc-500 rounded px-3 py-2 text-center text-xs text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer block">
                    <input type="file" name="company_ifu_pdf" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <span className="flex items-center justify-center gap-1.5 break-all"><Upload size={14} /> {files.company_ifu_pdf ? files.company_ifu_pdf.name : 'Sélectionner PDF'}</span>
                  </label>
              </div>
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Document RCCM (PDF) *</label>
                  <label className="flex-1 border border-dashed border-border-custom hover:border-zinc-500 rounded px-3 py-2 text-center text-xs text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer block">
                    <input type="file" name="company_rccm_pdf" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <span className="flex items-center justify-center gap-1.5 break-all"><Upload size={14} /> {files.company_rccm_pdf ? files.company_rccm_pdf.name : 'Sélectionner PDF'}</span>
                  </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="button" onClick={handleNext}
                disabled={!isStep1Valid()}
                className="px-6 py-3 rounded bg-red-800 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-red-950/20"
              >
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Manager Info */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white tracking-wide border-b border-border-custom pb-2">02. Informations du Gérant</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nom et Prénom *</label>
                <input 
                  type="text" required name="manager_name" value={formData.manager_name} onChange={handleInputChange}
                  placeholder="Ex: Richard SOGLO"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errManagerName ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errManagerName && <p className="text-red-500 text-[10px] mt-1">Le nom ne doit contenir que des lettres.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Identifiant Fiscal Unique (IFU) * (13 chiffres)</label>
                <input 
                  type="text" required name="manager_ifu" value={formData.manager_ifu} onChange={handleInputChange}
                  placeholder="Ex: 3202612345678" maxLength={13}
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errManagerIfu ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errManagerIfu && <p className="text-red-500 text-[10px] mt-1">L'IFU doit contenir exactement 13 chiffres.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Téléphone * (10 chiffres)</label>
                <input 
                  type="text" required name="manager_phone" value={formData.manager_phone} onChange={handleInputChange}
                  placeholder="Ex: 0197123456" maxLength={10}
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errManagerPhone ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errManagerPhone && <p className="text-red-500 text-[10px] mt-1">Le téléphone doit contenir exactement 10 chiffres.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Adresse E-mail *</label>
                <input 
                  type="email" required name="manager_email" value={formData.manager_email} onChange={handleInputChange}
                  placeholder="richard.soglo@gmail.com"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errManagerEmail ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errManagerEmail && <p className="text-red-500 text-[10px] mt-1">Format d'adresse email invalide (ex: richard.soglo@gmail.com).</p>}
              </div>
            </div>

            <h4 className="text-sm font-bold text-zinc-300 tracking-wide border-b border-zinc-800 pb-2 pt-2">Adresse Géographique Gérant</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ville *</label>
                <input 
                  type="text" name="manager_city" required value={formData.manager_city} onChange={handleInputChange} placeholder="Ex: Cotonou"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errManagerCity ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errManagerCity && <p className="text-red-500 text-[10px] mt-1">La ville ne doit contenir que des lettres.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Quartier *</label>
                <input 
                  type="text" name="manager_district" required value={formData.manager_district} onChange={handleInputChange} placeholder="Ex: Gbégamey"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errManagerDistrict ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errManagerDistrict && <p className="text-red-500 text-[10px] mt-1">Le quartier ne doit contenir que des lettres.</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Maison/Carré *</label>
                <input 
                  type="text" name="manager_house" required value={formData.manager_house} onChange={handleInputChange} placeholder="Ex: Villa 12B, Carré 564"
                  className="w-full px-4 py-2.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm"
                />
              </div>
            </div>

            
            <h4 className="text-sm font-bold text-zinc-300 tracking-wide border-b border-zinc-800 pb-2 pt-6">Pièces Justificatives (Gérant)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Copie PDF de la carte CIP *</label>
                  <label className="flex-1 border border-dashed border-border-custom hover:border-zinc-500 rounded px-3 py-2 text-center text-xs text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer block">
                    <input type="file" name="manager_cip_pdf" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <span className="flex items-center justify-center gap-1.5 break-all"><Upload size={14} /> {files.manager_cip_pdf ? files.manager_cip_pdf.name : 'Sélectionner PDF'}</span>
                  </label>
              </div>
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Document IFU (PDF) *</label>
                  <label className="flex-1 border border-dashed border-border-custom hover:border-zinc-500 rounded px-3 py-2 text-center text-xs text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer block">
                    <input type="file" name="manager_ifu_pdf" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <span className="flex items-center justify-center gap-1.5 break-all"><Upload size={14} /> {files.manager_ifu_pdf ? files.manager_ifu_pdf.name : 'Sélectionner PDF'}</span>
                  </label>
              </div>
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Vérification Vidéo (KYC) *</label>
                  {files.manager_selfie ? (
                    <div className="w-full flex items-center justify-center gap-2 border border-green-900 bg-green-950/20 text-green-400 rounded px-3 py-2 text-xs font-semibold">
                      <CheckCircle size={14} /> KYC Validée
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => startKYC('manager')}
                      className="w-full flex items-center justify-center gap-2 border border-primary-custom bg-primary-custom/10 hover:bg-primary-custom/20 text-red-400 rounded px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Video size={14} /> Démarrer KYC
                    </button>
                  )}
              </div>
            </div>
            

            <div className="flex justify-between pt-6">
              <button 
                type="button" onClick={handlePrev}
                className="px-6 py-2.5 rounded border border-border-custom text-zinc-300 hover:bg-surface-custom text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
              >
                <ArrowLeft size={16} /> Retour
              </button>
              <button 
                type="button" onClick={handleNext}
                disabled={!isStep2Valid()}
                className="px-6 py-3 rounded bg-red-800 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-red-950/20"
              >
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Guarantor Info */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-white tracking-wide border-b border-border-custom pb-2">03. Informations de l'Avaliseur (Garant)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nom et Prénom *</label>
                <input 
                  type="text" required name="guarantor_name" value={formData.guarantor_name} onChange={handleInputChange}
                  placeholder="Ex: Cédric HOUNDÉ"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errGuarantorName ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errGuarantorName && <p className="text-red-500 text-[10px] mt-1">Le nom ne doit contenir que des lettres.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Identifiant Fiscal Unique (IFU) * (13 chiffres)</label>
                <input 
                  type="text" required name="guarantor_ifu" value={formData.guarantor_ifu} onChange={handleInputChange}
                  placeholder="Ex: 3202612345678" maxLength={13}
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errGuarantorIfu ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errGuarantorIfu && <p className="text-red-500 text-[10px] mt-1">L'IFU doit contenir exactement 13 chiffres.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Téléphone * (10 chiffres)</label>
                <input 
                  type="text" required name="guarantor_phone" value={formData.guarantor_phone} onChange={handleInputChange}
                  placeholder="Ex: 0197999999" maxLength={10}
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errGuarantorPhone ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errGuarantorPhone && <p className="text-red-500 text-[10px] mt-1">Le téléphone doit contenir exactement 10 chiffres.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Adresse E-mail *</label>
                <input 
                  type="email" required name="guarantor_email" value={formData.guarantor_email} onChange={handleInputChange}
                  placeholder="cedric.hounde@gmail.com"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errGuarantorEmail ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errGuarantorEmail && <p className="text-red-500 text-[10px] mt-1">Format d'adresse email invalide (ex: cedric.hounde@gmail.com).</p>}
              </div>
            </div>

            <h4 className="text-sm font-bold text-zinc-300 tracking-wide border-b border-zinc-800 pb-2 pt-2">Adresse Géographique Avaliseur</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ville *</label>
                <input 
                  type="text" name="guarantor_city" required value={formData.guarantor_city} onChange={handleInputChange} placeholder="Ex: Porto-Novo"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errGuarantorCity ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errGuarantorCity && <p className="text-red-500 text-[10px] mt-1">La ville ne doit contenir que des lettres.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Quartier *</label>
                <input 
                  type="text" name="guarantor_district" required value={formData.guarantor_district} onChange={handleInputChange} placeholder="Ex: Avakpa"
                  className={`w-full px-4 py-2.5 rounded bg-bg-deepest border text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm ${errGuarantorDistrict ? 'border-red-500/70 focus:border-red-500' : 'border-border-custom'}`}
                />
                {errGuarantorDistrict && <p className="text-red-500 text-[10px] mt-1">Le quartier ne doit contenir que des lettres.</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Maison/Carré *</label>
                <input 
                  type="text" name="guarantor_house" required value={formData.guarantor_house} onChange={handleInputChange} placeholder="Ex: Villa 12B, Carré 564"
                  className="w-full px-4 py-2.5 rounded bg-bg-deepest border border-border-custom text-zinc-100 placeholder-zinc-750 focus:outline-none focus:border-red-500 transition-all text-base sm:text-sm"
                />
              </div>
            </div>

            <h4 className="text-sm font-bold text-zinc-300 tracking-wide border-b border-zinc-800 pb-2 pt-6">Pièces Justificatives (Avaliseur)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Copie PDF de la carte CIP *</label>
                  <label className="flex-1 border border-dashed border-border-custom hover:border-zinc-500 rounded px-3 py-2 text-center text-xs text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer block">
                    <input type="file" name="guarantor_cip_pdf" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <span className="flex items-center justify-center gap-1.5 break-all"><Upload size={14} /> {files.guarantor_cip_pdf ? files.guarantor_cip_pdf.name : 'Sélectionner PDF'}</span>
                  </label>
              </div>
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Document IFU (PDF) *</label>
                  <label className="flex-1 border border-dashed border-border-custom hover:border-zinc-500 rounded px-3 py-2 text-center text-xs text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer block">
                    <input type="file" name="guarantor_ifu_pdf" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <span className="flex items-center justify-center gap-1.5 break-all"><Upload size={14} /> {files.guarantor_ifu_pdf ? files.guarantor_ifu_pdf.name : 'Sélectionner PDF'}</span>
                  </label>
              </div>
              <div className="p-4 rounded-lg bg-bg-deepest border border-border-custom flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Vérification Vidéo (KYC) *</label>
                  {files.guarantor_selfie ? (
                    <div className="w-full flex items-center justify-center gap-2 border border-green-900 bg-green-950/20 text-green-400 rounded px-3 py-2 text-xs font-semibold">
                      <CheckCircle size={14} /> KYC Validée
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => startKYC('guarantor')}
                      className="w-full flex items-center justify-center gap-2 border border-primary-custom bg-primary-custom/10 hover:bg-primary-custom/20 text-red-400 rounded px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Video size={14} /> Démarrer KYC
                    </button>
                  )}
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button 
                type="button" onClick={handlePrev}
                className="px-6 py-2.5 rounded border border-border-custom text-zinc-300 hover:bg-surface-custom text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
              >
                <ArrowLeft size={16} /> Retour
              </button>
              <button 
                type="submit" disabled={loading || !isStep3Valid()}
                className="px-6 py-3 rounded bg-red-800 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-red-950/20"
              >
                {loading ? 'Soumission en cours...' : 'Soumettre le dossier'} <ShieldCheck size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Success Message */}
        {step === 4 && (
          <div className="text-center py-8 space-y-6">
            <CheckCircle className="text-red-500 mx-auto" size={64} />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Dossier soumis avec succès !</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                {success}
              </p>
            </div>
            <div className="pt-6">
              <Link 
                to="/login"
                className="px-6 py-3 rounded bg-red-800 hover:bg-red-700 text-white text-sm font-semibold transition-all inline-block shadow-md shadow-red-950/20"
              >
                Retourner à la page de connexion
              </Link>
            </div>
          </div>
        )}

        {/* KYC Video Modal */}
        {showKYCModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[110] backdrop-blur-md">
            <div className="modal-scale w-full max-w-md bg-[#0f0f11] border border-zinc-900 rounded-2xl p-4 sm:p-6 shadow-2xl relative text-center space-y-4">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Vérification Vidéo ({kycRole === 'manager' ? 'Gérant' : 'Garant'})
                </h3>
                {kycPhase !== 'recording' && (
                  <button 
                    onClick={closeKYCModal}
                    className="icon-btn w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="min-h-[40px] flex items-center justify-center">
                <p className={`text-sm font-semibold transition-all duration-300 ${kycPhase === 'recording' ? 'text-red-400 scale-105' : 'text-zinc-300'}`}>
                  {kycInstruction}
                </p>
              </div>

              {/* Camera Preview */}
              <div className="relative w-full aspect-square rounded-full overflow-hidden bg-black border-4 border-zinc-800 mx-auto max-w-[200px] sm:max-w-[250px] shadow-inner flex items-center justify-center">
                <video 
                  ref={kycVideoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Progress Ring Overlay during recording */}
                {kycPhase === 'recording' && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,0,0,0.2)" strokeWidth="4" />
                    <circle 
                      cx="50" cy="50" r="48" fill="none" stroke="#ef4444" strokeWidth="4" 
                      strokeDasharray="301.59" 
                      strokeDashoffset={301.59 - (kycProgress / 100) * 301.59}
                      className="transition-all duration-100 ease-linear"
                    />
                  </svg>
                )}
              </div>

              {/* Controls */}
              <div className="pt-4">
                {kycPhase === 'idle' && (
                  <button 
                    onClick={startKYCRecording}
                    className="w-full py-3 rounded-md bg-red-800 hover:bg-red-700 text-white font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/40"
                  >
                    <Camera size={16} /> Démarrer l'enregistrement
                  </button>
                )}
                {kycPhase === 'recording' && (
                  <div className="w-full py-3 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Enregistrement en cours...
                  </div>
                )}
                {kycPhase === 'done' && (
                  <div className="space-y-3">
                    <div className="w-full py-3 rounded-md bg-green-950/20 border border-green-900/50 text-green-400 font-medium flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> Vidéo enregistrée avec succès
                    </div>
                    <button 
                      type="button"
                      onClick={closeKYCModal}
                      className="w-full py-3 rounded-md bg-red-850 hover:bg-red-700 text-white font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/40"
                    >
                      Valider et continuer
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Register;
