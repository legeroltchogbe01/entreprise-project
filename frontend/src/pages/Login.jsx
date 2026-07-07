import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';

function Login({ setUser, onRequestRegister }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la connexion.');
      }

      localStorage.setItem('gmd_user', JSON.stringify(data));
      setUser(data);

      if (data.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
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
          <h2 className="text-2xl font-bold text-white tracking-wide">Espace Professionnel</h2>
          <p className="text-sm text-zinc-400 mt-2">Saisissez votre email professionnel pour accéder à l'application</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-red-300 text-sm">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <p>{error}</p>
          </div>
        )}

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
            {/* <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
              Pour le rôle Administrateur, utilisez : <span className="text-primary-hover">admin@gmd.bj</span>
            </p> */}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-primary-custom hover:bg-primary-hover text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40 hover:shadow-red-900/50 cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Connexion en cours...' : 'Se Connecter'} <ArrowRight size={16} />
          </button>
        </form>

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
