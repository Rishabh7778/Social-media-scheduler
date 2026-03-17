import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart3, Clock, CheckCircle, CalendarDays, Sparkles, ArrowRight } from 'lucide-react';
import { fetchUserPosts } from '../features/posts/postSlice'; // Apne path ke hisab se check kar lena
import type { RootState, AppDispatch } from '../store/store';
import { useNavigate } from 'react-router-dom';

const Overview = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, isLoading } = useSelector((state: RootState) => state.posts);
  const navigate = useNavigate();


  // Component mount hone par data layein
  useEffect(() => {
    dispatch(fetchUserPosts());
  }, [dispatch]);


  const parseSafeDate = (dateString: string) => {
    if (!dateString) return new Date(); // Agar date null hai toh aaj ki date le lo
    
    // Space ko 'T' se replace karo (Safari aur JS errors se bachne ke liye)
    let safeString = dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString;
    
    // Agar timezone missing hai toh add kar do (double Z lagne se rokne ke liye)
    if (!safeString.includes('Z') && !safeString.includes('+')) {
      safeString += 'Z'; 
    }

    const d = new Date(safeString);
    return isNaN(d.getTime()) ? new Date() : d; // Agar fir bhi error aaye, toh fallback
  };

  // 📊 CALCULATIONS (Real Data)
  const totalPosts = posts.length;
  const scheduledPosts = posts.filter((post: any) => post.status === 'pending').length;
  const publishedPosts = posts.filter((post: any) => post.status === 'published').length;

  // 🕒 RECENT ACTIVITY (Safe Sorting)
  const recentPosts = [...posts]
    .sort((a, b) => parseSafeDate(b.scheduled_at).getTime() - parseSafeDate(a.scheduled_at).getTime())
    .slice(0, 4);

  // 🤖 SMART FEATURE: Next Upcoming Post (Safe Sorting)
  const upcomingPosts = posts
    .filter((post: any) => post.status === 'pending')
    .sort((a, b) => parseSafeDate(a.scheduled_at).getTime() - parseSafeDate(b.scheduled_at).getTime());
  
  const nextPost = upcomingPosts.length > 0 ? upcomingPosts[0] : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const dateObj = parseSafeDate(dateString);
    return dateObj.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const ViewAllPosts = () => {
    navigate('/dashboard/posts'); 
  }

  if (isLoading && posts.length === 0) {
    return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* TOP STATS CARDS (Real Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Posts" value={totalPosts.toString()} icon={<BarChart3 className="text-blue-600"/>} color="bg-blue-50" />
        <StatCard title="Scheduled" value={scheduledPosts.toString()} icon={<Clock className="text-amber-600"/>} color="bg-amber-50" />
        <StatCard title="Published" value={publishedPosts.toString()} icon={<CheckCircle className="text-emerald-600"/>} color="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT ACTIVITY LIST (Left Side - 2 Columns wide) */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h2>
            <button onClick={ViewAllPosts} className="text-blue-600 text-sm font-bold hover:underline flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          {recentPosts.length === 0 ? (
            <p className="text-slate-500 font-medium py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No recent activity found. Schedule a post to see it here! 🚀
            </p>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    {/* Platform Icon Badge */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${post.provider === 'linkedin' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-slate-800 truncate">{post.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{formatDate(post.scheduled_at)}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="shrink-0 ml-4">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🚨 AI / SMART INSIGHT CARD (Right Side - 1 Column wide) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden flex flex-col">
          {/* Background decorative circles */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Up Next</h2>
          </div>

          {nextPost ? (
            <div className="relative z-10 flex-1 flex flex-col">
              <h3 className="text-2xl font-black mb-2 line-clamp-2 leading-tight">{nextPost.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-3 mb-6 font-medium">
                {nextPost.description}
              </p>
              
              <div className="mt-auto bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-slate-300 uppercase tracking-widest font-bold mb-1">Scheduled For</p>
                <p className="text-lg font-black text-amber-400">{formatDate(nextPost.scheduled_at)}</p>
                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-300">Platform</span>
                   <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded text-white">{nextPost.provider}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Queue is Empty</h3>
              <p className="text-slate-400 text-sm">You have no upcoming posts scheduled. Plan your next move!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-4xl font-black text-slate-800 tracking-tight">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
  </div>
);

export default Overview;