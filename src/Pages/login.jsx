// src/pages/Login.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontexts';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    // Optional: force account selection every time (good for dev/testing)
    // provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in AuthContext will update user → redirect happens via useEffect
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert(`Sign in failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-10 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Problem Repo</h1>
        <p className="text-gray-500 mb-10">
          A fully transparent issues and Proble tracker for the Rad5 team
        </p>

     <button
  onClick={handleGoogleSignIn}
  disabled={loading}
  className={`cursor-pointer
    w-full flex items-center justify-center gap-3
    bg-white border border-gray-300 hover:bg-gray-50
    text-gray-800 font-medium py-3 px-6 rounded-md
    transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
    disabled:opacity-60 disabled:cursor-not-allowed
    shadow-sm
  `}
>
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.84c-.25 1.31-.98 2.42-2.07 3.16v2.63h3.35c1.96-1.81 3.09-4.47 3.09-7.99z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.35-2.63c-.98.66-2.23 1.06-3.93 1.06-3.02 0-5.58-2.04-6.49-4.79H.96v2.67C2.76 20.39 6.93 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.51 14.21c-.23-.66-.36-1.37-.36-2.21s.13-1.55.36-2.21V7.34H.96C.35 8.85 0 10.39 0 12s.35 3.15.96 4.66l4.55-2.45z"
      fill="#FBBC05"
    />
    <path
      d="M12 4.98c1.64 0 3.11.56 4.27 1.66l3.19-3.19C17.46 1.01 14.97 0 12 0 6.93 0 2.76 2.61 .96 6.34l4.55 2.45C6.42 6.02 8.98 4.98 12 4.98z"
      fill="#EA4335"
    />
  </svg>
  <span>Sign in with Google</span>
</button>

        <p className="mt-8 text-sm text-gray-500">
          By signing in, you agree to our transparent team culture ✨
        </p>
      </div>
    </div>
  );
}