import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../features/auth/authSlice';
import type { AppDispatch, RootState } from '../store/store';

interface FormData {
  name?: string;
  email: string;
  password: string;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', password: '' });

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Redux se loading state aur error nikalna
  const { isLoading, error, token } = useSelector((state: RootState) => state.auth);

  // Effect: Jaise hi token aayega (login success), user ko redirect kar do
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLogin) {
      // Login API call
      dispatch(loginUser({ email: formData.email, password: formData.password }));
    } else {
      // Register API call
      const resultAction = await dispatch(registerUser(formData));
      
      // Agar register successful hua, toh turant login mode par switch kardo
      if (registerUser.fulfilled.match(resultAction)) {
        alert("Registration successful! Please login.");
        setIsLogin(true);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-200 rounded-full p-1 w-full text-center">
            <button
              type="button"
              className={`w-1/2 py-2 rounded-full transition-all ${isLogin ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={`w-1/2 py-2 rounded-full transition-all ${!isLogin ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>
          
        </div>

        <h2 className="text-2xl font-bold text-center mb-4">
          {isLogin ? 'Welcome Back!' : 'Create an Account'}
        </h2>

        {/* Backend se aane wala Error message yahan dikhega */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your name" required={!isLogin} />
            </div>
          )}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your email" required />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your password" required />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-2 rounded-lg transition-colors font-semibold mt-6 ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span className="text-blue-500 cursor-pointer hover:underline font-medium" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </p>
        <p>
          <a 
  href="http://localhost:5000/api/auth/facebook" 
  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
  Login with Facebook
</a>
        </p>
      </div>
      
    </div>
  );
};

export default AuthPage;