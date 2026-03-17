import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  return (
    // 'flex' parent automatically children ki width manage karta hai
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar apni jagah lega (20px se 64px) */}
      <Sidebar />
      
      {/* 'flex-1' ka matlab hai "bachi hui saari jagah le lo".
        Jab sidebar bada hoga, ye area automatically shrink ho jayega.
      */}
      <main className="flex-1 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <Outlet /> 
        </div>
      </main>
      
    </div>
  );
};

export default Dashboard;