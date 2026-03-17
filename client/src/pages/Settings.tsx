import React, { useEffect, useState } from 'react';
import { User, Palette, Bell, Save, } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux'; // Redux se data nikalne ke liye
import type { RootState, AppDispatch } from '../store/store';
import { fetchUserData } from '../features/auth/authSlice';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [selectedTheme, setSelectedTheme] = useState('Light'); // Default theme state

  // 🚨 REDUX: Logged-in user ka data nikalna
  // Note: Aapke state ka naam `auth` ya `user` ho sakta hai, apne hisab se check kar lena
  const dispatch = useDispatch<AppDispatch>();
  const {user, isLoading } = useSelector((state: RootState) => state.auth); 

  const tabs = [
    { id: 'Profile', label: 'My Profile', icon: <User size={18} /> },
    { id: 'Appearance', label: 'Background Color', icon: <Palette size={18} /> },
    { id: 'Notifications', label: 'Notifications', icon: <Bell size={18} /> }, 
  ];

  const handleSaveTheme = () => {
    alert(`Theme '${selectedTheme}' saved successfully! (API logic aage aayega)`);
    // Yahan aap theme change karne ka Redux action ya API call daal sakte hain
  };

  useEffect(() => {
  dispatch(fetchUserData());
  }, [dispatch]);


  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">Account Settings</h2>

      {/* --- HORIZONTAL TOP NAV --- */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap uppercase tracking-widest ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT --- */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 md:p-10 animate-in slide-in-from-bottom-2 duration-300">
        
        {/* 1. PROFILE (READ ONLY) */}
        {activeTab === 'Profile' && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-100 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                  {/* Default avatar based on user's name */}
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=3b82f6`} alt="Avatar" />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800">{user?.name || 'Guest User'}</h4>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Personal Account</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Display Name</label>
                {/* 🚨 Read Only Input */}
                <input 
                  type="text" 
                  value={user?.name || 'Loading...'} 
                  readOnly 
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-slate-600 cursor-not-allowed" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Email Address</label>
                {/* 🚨 Read Only Input */}
                <input 
                  type="email" 
                  value={user?.email || 'Loading...'} 
                  readOnly 
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-slate-600 cursor-not-allowed" 
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 font-bold flex items-center gap-2 mt-4">
              <User size={14} /> Name and email cannot be changed from this dashboard.
            </p>
          </div>
        )}

        {/* 2. BACKGROUND COLOR (Appearance) */}
        {activeTab === 'Appearance' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-1">Theme Preferences</h3>
              <p className="text-slate-500 font-medium">Choose how your dashboard looks.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setSelectedTheme('Light')}
                className={`h-24 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all border-2 ${selectedTheme === 'Light' ? 'bg-slate-50 border-blue-600 text-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 mb-2"></div>
                Light
              </button>
              
              <button 
                onClick={() => setSelectedTheme('Dark')}
                className={`h-24 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all border-2 ${selectedTheme === 'Dark' ? 'bg-slate-900 border-blue-500 text-white shadow-lg shadow-slate-800' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 mb-2"></div>
                Dark
              </button>
              
              <button 
                onClick={() => setSelectedTheme('Soft Blue')}
                className={`h-24 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all border-2 ${selectedTheme === 'Soft Blue' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-lg shadow-blue-100' : 'bg-blue-50 border-blue-100 text-blue-500 hover:border-blue-200'}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 mb-2"></div>
                Soft Blue
              </button>
              
              <button 
                onClick={() => setSelectedTheme('Nature')}
                className={`h-24 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all border-2 ${selectedTheme === 'Nature' ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-lg shadow-emerald-100' : 'bg-emerald-50 border-emerald-100 text-emerald-500 hover:border-emerald-200'}`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 mb-2"></div>
                Nature
              </button>
            </div>
          </div>
        )}

        {/* 3. NOTIFICATIONS */}
        {activeTab === 'Notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-black text-slate-800">Email Notifications</p>
                <p className="text-sm text-slate-500 font-medium">Get updates about your scheduled posts.</p>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-blue-600 cursor-pointer" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-black text-slate-800">Failed Post Alerts</p>
                <p className="text-sm text-slate-500 font-medium">Immediate alert when a post fails to publish.</p>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-blue-600 cursor-pointer" defaultChecked />
            </div>
          </div>
        )}

        {/* 🚨 SAVE BUTTON (SIRF APPEARANCE TAB PAR DIKHEGA) */}
        {activeTab === 'Appearance' && (
          <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handleSaveTheme}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-xl shadow-blue-200 hover:-translate-y-1"
            >
              <Save size={16} />
              Save Theme Changes
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;