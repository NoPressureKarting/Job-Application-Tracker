import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import { Cloud, CloudCheck, LogIn, LogOut, Loader2, AlertCircle } from 'lucide-react';

interface AuthStatusBadgeProps {
  onSyncLocalData?: (userId: string) => Promise<void>;
}

export const AuthStatusBadge: React.FC<AuthStatusBadgeProps> = ({ onSyncLocalData }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasSyncedForUserRef = React.useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && onSyncLocalData && hasSyncedForUserRef.current !== user.uid) {
        hasSyncedForUserRef.current = user.uid;
        setIsSyncing(true);
        try {
          await onSyncLocalData(user.uid);
        } catch (e) {
          console.error('Auto sync error on login:', e);
        } finally {
          setIsSyncing(false);
        }
      }
      if (!user) {
        hasSyncedForUserRef.current = null;
      }
    });
    return () => unsubscribe();
  }, []); // Run auth state listener only once on mount

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentUser ? (
        <div className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl px-2.5 py-1 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-5 h-5 rounded-full ring-1 ring-indigo-400"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline truncate max-w-[110px]">
              {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0]}
            </span>
          </div>

          <div className="h-3 w-px bg-indigo-200 dark:bg-indigo-800" />

          {isSyncing ? (
            <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden md:inline">Syncing</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
              title="Realtime Cloud Sync Active"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline">Cloud Synced</span>
            </span>
          )}

          <button
            onClick={handleSignOut}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors ml-1"
            title="Sign out of Firebase"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={isAuthenticating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          title="Sign in with Google to sync your job pipeline and resumes across all published URLs and devices"
        >
          {isAuthenticating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          ) : (
            <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          )}
          <span>Cloud Sync</span>
        </button>
      )}

      {errorMsg && (
        <div
          className="text-rose-500 text-[11px] flex items-center gap-1"
          title={errorMsg}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Sync Error</span>
        </div>
      )}
    </div>
  );
};
