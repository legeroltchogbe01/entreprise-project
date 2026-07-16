import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config';

function Login({ setUser, onRequestRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Forgot password states
  const [forgotRequired, setForgotRequired] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Check if it's the admin bypassing password
    const isSpecialAdmin = email.toLowerCase().trim() === 'admin@gmd.bj' || email.toLowerCase().trim() === 'admin@gmd.com';
    if (!isSpecialAdmin && !password) {
      setError('Veuillez renseigner votre mot de passe.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          password: isSpecialAdmin ? 'admin' : password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la connexion.');
      }

      if (data.otpRequired) {
        setOtpRequired(true);
      } else {
        // Direct login (Admin)
        localStorage.setItem('gmd_user', JSON.stringify(data));
        setUser(data);
        if (data.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
          otp: otpCode.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Le code de vérification est incorrect ou a expiré.');
      }

      localStorage.setItem('gmd_user', JSON.stringify(data));
      setUser(data);
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error + (data.details ? `\n(Détails techniques: ${data.details})` : '');
        throw new Error(errMsg);
      }

      setOtpSent(true);
      setSuccessMessage(data.message || 'Code OTP envoyé !');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !resetOtp || !newPassword) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: resetOtp.trim(),
          newPassword: newPassword.trim()
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error + (data.details ? `\n(Détails techniques: ${data.details})` : '');
        throw new Error(errMsg);
      }

      setSuccessMessage(data.message || 'Mot de passe modifié !');
      setTimeout(() => {
        setForgotRequired(false);
        setOtpSent(false);
        setResetOtp('');
        setNewPassword('');
        setPassword('');
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-bg-main relative">
      {/* Decorative Glow Background */}
      <div className="absolute max-w-[400px] w-[60vw] h-[60vw] max-h-[400px] rounded-full bg-primary-custom/5 blur-[120px] top-1/4 left-1/4"></div>
      <div className="absolute max-w-[300px] w-[50vw] h-[50vw] max-h-[300px] rounded-full bg-accent-glow/5 blur-[100px] bottom-1/4 right-1/4"></div>

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-lg border border-border-custom relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-lg font-black text-white tracking-widest uppercase mb-4 opacity-90">
            GALASSY MEUBLE DECOR
          </h1>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {forgotRequired ? 'Réinitialisation' : otpRequired ? 'Double Sécurité' : 'Espace Professionnel'}
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            {forgotRequired 
              ? (otpSent ? 'Saisissez l\'OTP reçu et votre nouveau mot de passe' : 'Saisissez votre email pour recevoir un OTP')
              : otpRequired 
                ? 'Saisissez le code de vérification OTP envoyé sur votre adresse email' 
                : 'Saisissez vos identifiants pour accéder à l\'application'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-red-300 text-sm">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex items-start gap-3 text-emerald-300 text-sm">
            <p>{successMessage}</p>
          </div>
        )}

        {!forgotRequired ? (
          !otpRequired ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Adresse Email Professionnelle
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="entreprise@domain.com"
                    className="w-full pl-10 pr-4 py-3 rounded-md bg-bg-deepest border border-border-custom text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-custom transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotRequired(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={email.toLowerCase().trim() !== 'admin@gmd.bj' && email.toLowerCase().trim() !== 'admin@gmd.com'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full pl-4 pr-10 py-3 rounded-md bg-bg-deepest border border-border-custom text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-custom transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-primary-custom hover:bg-primary-hover text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40 hover:shadow-red-900/50 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Connexion...' : 'Se Connecter'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Code de vérification OTP (6 chiffres)
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  pattern="[0-9]{6}"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 123456"
                  className="w-full px-4 py-3 text-center tracking-[12px] font-mono text-xl rounded-md bg-bg-deepest border border-border-custom text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-600 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Vérification...' : 'Valider la connexion'} <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpRequired(false);
                  setOtpCode('');
                  setError('');
                }}
                className="w-full py-2.5 rounded-md bg-transparent border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Retour à la saisie des identifiants
              </button>
            </form>
          )
        ) : (
          !otpSent ? (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Adresse Email de votre entreprise
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="entreprise@domain.com"
                  className="w-full px-4 py-3 rounded-md bg-bg-deepest border border-border-custom text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-custom transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-primary-custom hover:bg-primary-hover text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40 hover:shadow-red-900/50 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Envoi du code...' : 'Recevoir le code de récupération'} <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotRequired(false);
                  setError('');
                }}
                className="w-full py-2.5 rounded-md bg-transparent border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Retour à la connexion
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Code de vérification OTP (6 chiffres)
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  pattern="[0-9]{6}"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 123456"
                  className="w-full px-4 py-3 text-center tracking-[12px] font-mono text-xl rounded-md bg-bg-deepest border border-border-custom text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Saisissez le nouveau mot de passe"
                    className="w-full pl-4 pr-10 py-3 rounded-md bg-bg-deepest border border-border-custom text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-custom transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Modification...' : 'Modifier le mot de passe'} <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setResetOtp('');
                  setNewPassword('');
                  setError('');
                }}
                className="w-full py-2.5 rounded-md bg-transparent border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Renvoyer le code
              </button>
            </form>
          )
        )}

        <div className="mt-8 pt-6 border-t border-border-custom/50 text-center">
          <p className="text-sm text-zinc-500">
            Votre entreprise n'a pas encore de compte ?
          </p>
          <button
            type="button"
            onClick={onRequestRegister}
            className="text-sm text-primary-hover hover:text-red-400 font-semibold mt-1 inline-block transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Créer un compte pour mon entreprise
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
