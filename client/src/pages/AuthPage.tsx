import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';

const AuthPage: React.FC = () => {
  // Redux hooks
  const navigate = useNavigate();
  
  // Redux se loading state aur error nikalna
  const { isLoading, error, token } = useSelector((state: RootState) => state.auth);

  // Effect: Jaise hi token aayega (login success), user ko redirect kar do
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        <h2 className="text-2xl font-bold text-center mb-6">
          Welcome
        </h2>

        {/* Backend se aane wala Error message yahan dikhega */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <a 
            href="http://localhost:5000/api/auth/facebook" 
            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            <span className="mr-2">📘</span> Login with Facebook
          </a>
          
          <a 
            href="http://localhost:5000/api/auth/linkedin" 
            className="flex items-center justify-center w-full bg-[#0077b5] hover:bg-[#006097] text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            <span className="mr-2">🔗</span> Login with LinkedIn
          </a>
        </div>

        {/* Loading state display (Optional, agar OAuth redirect me thoda time lage) */}
        {isLoading && (
          <p className="text-center text-gray-500 mt-6 font-medium">
            Processing...
          </p>
        )}
        
      </div>
    </div>
  );
};

export default AuthPage;