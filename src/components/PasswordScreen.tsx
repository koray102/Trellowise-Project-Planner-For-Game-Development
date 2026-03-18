import { useState } from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-zinc-500',
};

export function PasswordScreen() {
  const { currentUser, loginWithPassword, logoutUser } = useStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  // If we somehow got here without a user, fallback
  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === '') return;

    const success = loginWithPassword(password);
    if (!success) {
      setError(true);
      // Shake animation effect could be triggered here via state if needed
    } else {
      setError(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-[200]">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-sm w-full mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={logoutUser}
          className="absolute -top-16 left-0 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Farklı profil seç
        </button>

        {/* Selected User Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative shadow-2xl shadow-indigo-500/20 rounded-full">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full bg-zinc-800 ring-4 ring-zinc-800"
            />
            <div className={cn(
              "absolute bottom-0 right-1 w-6 h-6 rounded-full border-4 border-zinc-950",
              STATUS_COLORS[currentUser.status] || 'bg-zinc-500'
            )} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-100">{currentUser.name}</h2>
            <p className="text-zinc-500 text-sm mt-1">Devam etmek için parolayı girin</p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className={cn("w-5 h-5", error ? "text-rose-500" : "text-zinc-500")} />
            </div>
            
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Takım parolası..."
              autoFocus
              className={cn(
                "w-full bg-zinc-900/80 border rounded-xl py-3.5 pl-11 pr-12 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all",
                error 
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50" 
                  : "border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              )}
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
             <p className="text-rose-500 text-sm font-medium text-center animate-in fade-in slide-in-from-top-1">
               Yanlış parola, lütfen tekrar deneyin.
             </p>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:text-white/50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
          >
            Giriş Yap
          </button>
        </form>

      </div>
    </div>
  );
}
