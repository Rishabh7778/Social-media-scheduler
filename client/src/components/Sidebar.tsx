import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Image as ImageIcon, Settings, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { logoutUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';



const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Overview', path: '/dashboard' },
    { icon: <Calendar size={22} />, label: 'Schedule', path: '/dashboard/schedule' },
    // { icon: <ImageIcon size={22} />, label: 'Media Gallery', path: '/dashboard/gallery' },
    { icon: <ImageIcon size={22} />, label: 'Posts', path: '/dashboard/posts' },
    { icon: <Settings size={22} />, label: 'Settings', path: '/dashboard/settings' },
  ];

const dispatch = useDispatch<AppDispatch>();
const navigate = useNavigate();
  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully! Phir milenge.', {
      duration: 3000, // 3 seconds tak dikhega
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });

    setTimeout(() => {
      navigate('/login');
    }, 1500);
  }

  return (
    // 'fixed' hata diya taaki ye flow mein rahe
    <aside className="group h-screen w-20 hover:w-64 bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden sticky top-0">
      
      <div className="p-6 text-2xl font-bold border-b border-slate-800 text-blue-500 whitespace-nowrap">
        <span className="inline-block w-8">S</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2">
          ocialDash
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => 
              `flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <div className="min-w-[32px] flex justify-center">{item.icon}</div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <button 
  onClick={handleLogout} // 👈 1. onClick yahan main button par aayega
  className="group p-6 flex items-center gap-4 text-slate-400 hover:text-white border-t border-slate-800 whitespace-nowrap" // 👈 2. 'group' class add ki hai taaki group-hover chale
>
  <div className="min-w-[32px] flex justify-center">
    <LogOut size={22} />
  </div>
  
  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    Logout
  </span>
</button>
    </aside>
  );
};

export default Sidebar;