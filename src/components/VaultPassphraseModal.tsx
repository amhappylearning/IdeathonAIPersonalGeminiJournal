import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface VaultPassphraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (passphrase: string) => void;
  mode: 'encrypt' | 'decrypt';
  title?: string;
}

export const VaultPassphraseModal: React.FC<VaultPassphraseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mode,
  title,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || passphrase.length < 6) {
      setError('Passphrase must be at least 6 characters long.');
      return;
    }

    if (mode === 'encrypt' && passphrase !== confirmPassphrase) {
      setError('Passphrases do not match.');
      return;
    }

    setError(null);
    onConfirm(passphrase);
    setPassphrase('');
    setConfirmPassphrase('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl">
        
        {/* Header */}
        <div className="border-b border-stone-800 bg-stone-925 p-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-100">
                {title || (mode === 'encrypt' ? 'Encrypt Entry with Zero-Knowledge Vault' : 'Unlock Encrypted Vault Entry')}
              </h3>
              <p className="text-xs text-stone-400">
                AES-GCM-256 PBKDF2 local client-side cryptographic shield
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              {mode === 'encrypt' ? 'Create Vault Passphrase' : 'Enter Vault Passphrase'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
              <input
                id="input-vault-passphrase"
                type={showText ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter strong passphrase..."
                required
                autoFocus
                className="w-full rounded-xl border border-stone-700 bg-stone-950 py-2 pl-9 pr-10 text-sm text-stone-100 placeholder-stone-600 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowText(!showText)}
                className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300"
              >
                {showText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === 'encrypt' && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Confirm Vault Passphrase
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  id="input-vault-confirm-passphrase"
                  type={showText ? 'text' : 'password'}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Re-enter passphrase..."
                  required
                  className="w-full rounded-xl border border-stone-700 bg-stone-950 py-2 pl-9 pr-3 text-sm text-stone-100 placeholder-stone-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-stone-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero-Knowledge Guarantee</span>
            </div>
            <p>
              Your passphrase is never sent over any network. It stays exclusively in your browser memory to decrypt the payload.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-stone-700 py-2 text-xs font-medium text-stone-400 hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-vault-action"
              type="submit"
              className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition"
            >
              {mode === 'encrypt' ? 'Apply AES Encryption' : 'Unlock & Decrypt'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
