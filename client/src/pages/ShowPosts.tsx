import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserPosts, cancelPost, deletePost, reschedulePostAPI } from '../features/posts/postSlice';
import type { RootState, AppDispatch } from '../store/store';

const ShowPosts: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { posts, isLoading } = useSelector((state: RootState) => state.posts);
  const { user } = useSelector((state: RootState) => state.auth);

  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<string>('');
  const [newScheduleTime, setNewScheduleTime] = useState<string>('');

  useEffect(() => {
    dispatch(fetchUserPosts());
  }, [dispatch]);

  const filteredPosts = posts.filter((post) => {
    const matchesDate = filterDate ? post.scheduled_at.startsWith(filterDate) : true;
    const matchesStatus = filterStatus !== 'all' ? post.status === filterStatus : true;
    return matchesDate && matchesStatus;
  });

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    let safeString = dateString;
    if (safeString.includes(' ')) safeString = safeString.replace(' ', 'T');
    if (!safeString.includes('Z')) safeString = safeString + 'Z';
    const dateObj = new Date(safeString);
    return {
      date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const handleCancelPost = async (postId: number) => {
    if (!window.confirm("Kya aap is schedule ko cancel karna chahte hain?")) return;
    try {
      await dispatch(cancelPost(postId)).unwrap(); 
      alert("Schedule successfully cancelled! 🛑");
    } catch (error: any) {
      alert("Cancel failed: " + error);
    }
  };

  // 🚨 FIX: TS Warning ke liye 'provider' argument hata diya
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm(`Kya aap is post ko hamesha ke liye udana chahte hain?`)) return;
    try {
      await dispatch(deletePost(postId)).unwrap();
      alert("Post deleted from everywhere! 🗑️");
    } catch (error: any) {
      alert("Delete failed: " + error);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!newScheduleDate || !newScheduleTime) return alert("Date aur Time dono select karein!");
    const fullNewDate = `${newScheduleDate} ${newScheduleTime}:00`; 
    try {
      await dispatch(reschedulePostAPI({ postId: editingPostId!, newDate: fullNewDate })).unwrap();
      alert("Time successfully updated! ⏰");
      setEditingPostId(null);
    } catch (error: any) {
      alert("Error: " + error);
    }
  };

  if (isLoading && posts.length === 0) return <div className="p-10 text-center font-bold">Loading Posts...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              POST MANAGER
              {user?.provider && (
                <span className={`text-[10px] px-3 py-1 rounded-full text-white uppercase ${user.provider === 'linkedin' ? 'bg-blue-600' : 'bg-blue-800'}`}>
                  {user.provider}
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
            </select>

            {(filterDate || filterStatus !== 'all') && (
              <button onClick={() => {setFilterDate(''); setFilterStatus('all')}} className="text-red-500 text-sm font-bold ml-2 underline">Clear</button>
            )}
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium text-lg">Koi post nahi mili. 📭</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const { date, time } = formatDateTime(post.scheduled_at);
              return (
                <div key={post.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col">
                  
                  {/* Image & Provider */}
                  <div className="h-52 w-full bg-gray-100 relative overflow-hidden shrink-0">
                    {post.image_url ? (
                      <img src={post.image_url} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase text-xs">No Image</div>
                    )}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg ${post.provider === 'linkedin' ? 'bg-blue-600' : 'bg-blue-800'}`}>
                      {post.provider || 'UNKNOWN'}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 capitalize">{post.title}</h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{post.description}</p>
                    
                    {/* 📅 DATE & TIME */}
                    <div className="flex gap-2 mb-6 mt-auto">
                      <div className="flex-1 bg-blue-50 p-2 rounded-2xl text-center border border-blue-100">
                        <span className="block text-[10px] text-blue-400 font-bold uppercase">Date</span>
                        <span className="text-sm font-bold text-blue-800">{date}</span>
                      </div>
                      <div className="flex-1 bg-purple-50 p-2 rounded-2xl text-center border border-purple-100">
                        <span className="block text-[10px] text-purple-400 font-bold uppercase">Time</span>
                        <span className="text-sm font-bold text-purple-800">{time}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1 mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          post.status === 'published' ? 'bg-green-500 text-white' : 
                          post.status === 'pending' ? 'bg-amber-400 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {post.status}
                        </span>
                      </div>

                      {post.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingPostId(post.id)} 
                            className="flex-1 bg-blue-50 border border-blue-200 hover:bg-blue-500 hover:text-white text-blue-600 font-black py-3 rounded-2xl transition-all duration-300 uppercase text-[10px] tracking-wider"
                          >
                            Edit Time
                          </button>
                          <button 
                            onClick={() => handleCancelPost(post.id)} 
                            className="flex-1 bg-amber-50 border border-amber-200 hover:bg-amber-500 hover:text-white text-amber-600 font-black py-3 rounded-2xl transition-all duration-300 uppercase text-[10px] tracking-wider"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        // 🚨 FIX: Yahan se post.provider argument hata diya
                        <button onClick={() => handleDeletePost(post.id)} className="w-full bg-gray-900 hover:bg-red-600 text-white font-black py-3 rounded-2xl transition-all duration-300 uppercase text-xs">
                          Delete Everywhere
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🚨 EDIT TIME MODAL (POPUP) */}
      {editingPostId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800">Reschedule Post</h3>
              <button onClick={() => setEditingPostId(null)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">New Date</label>
                <input type="date" onChange={(e) => setNewScheduleDate(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">New Time</label>
                <input type="time" onChange={(e) => setNewScheduleTime(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingPostId(null)} className="flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Close</button>
                <button onClick={handleRescheduleSubmit} className="flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Save Time</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowPosts;