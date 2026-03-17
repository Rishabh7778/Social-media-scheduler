import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { createPost, fetchUserPosts } from '../features/posts/postSlice';
import type { AppDispatch, RootState } from '../store/store';

interface PostFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  status: string;
  image: File | null;
  pageId: string;
  selectedPageData: any | null;
}

const CalendarView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedEventData, setSelectedEventData] = useState<any>(null);

  // 🚨 NAYA STATE: Image Preview ke liye
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  const { posts, isLoading } = useSelector((state: RootState) => state.posts);

  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<PostFormData>({
    title: '', description: '', date: today, time: '12:00',
    status: 'pending', image: null, pageId: '', selectedPageData: null,
  });

  useEffect(() => {
    dispatch(fetchUserPosts());
  }, [dispatch]);

  const calendarEvents = useMemo(() => {
    const seenDates = new Set();
    const uniqueEvents: any[] = [];

    if (posts && posts.length > 0) {
      posts.forEach((post: any) => {
        const dateOnly = post.scheduled_at ? post.scheduled_at.split('T')[0].split(' ')[0] : '';

        if (dateOnly && !seenDates.has(dateOnly)) {
          seenDates.add(dateOnly);
          uniqueEvents.push({
            id: String(post.id),
            title: post.title,
            start: post.scheduled_at,
            backgroundColor: post.status === 'published' ? '#10b981' : '#f59e0b',
            borderColor: 'transparent',
            extendedProps: {
              description: post.description,
              imageUrl: post.image_url,
              platform: post.provider,
              status: post.status
            }
          });
        }
      });
    }
    return uniqueEvents;
  }, [posts]);

  useEffect(() => {
  const fetchSocialAccounts = async () => {
    // 🔥 FIX: Agar accounts pehle se hain, toh dobara fetch mat karo
    if (socialAccounts.length > 0) return; 

    setIsLoadingAccounts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/social-accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSocialAccounts(response.data);
    } catch (err) { 
      console.error("Accounts fetch error:", err); 
    } finally { 
      setIsLoadingAccounts(false); 
    }
  };

  if (isModalOpen) {
    fetchSocialAccounts();
  }
}, [isModalOpen, socialAccounts.length]); // Dependencies update kar di

  // Handlers
  const closeModalAndReset = () => {
    setIsModalOpen(false);
    setImagePreview(null);
  };

  const handleDateClick = (arg: DateClickArg) => {
    setFormData({ ...formData, date: arg.dateStr });
    setIsModalOpen(true);
  };

  const handleNewPostClick = () => {
    setFormData({ ...formData, date: today });
    setIsModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    setSelectedEventData({
      title: info.event.title,
      description: props.description,
      date: info.event.startStr.split('T')[0],
      time: info.event.startStr.split('T')[1]?.substring(0, 5) || '12:00',
      imageUrl: props.imageUrl,
      platform: props.platform,
      status: props.status
    });
    setIsDetailsOpen(true);
  };

  const renderEventContent = (eventInfo: any) => {
    const imgUrl = eventInfo.event.extendedProps.imageUrl;
    return (
      <div className="flex flex-col items-center p-1 cursor-pointer overflow-hidden w-full">
        {imgUrl ? (
          <img src={imgUrl} alt="post-thumbnail" className="w-full h-24 object-cover rounded-sm mb-1" />
        ) : (
          <div className="w-full h-12 bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 rounded-sm mb-1">
            No Image
          </div>
        )}
        <b className="text-[10px] truncate w-full text-center text-black">
          {eventInfo.event.title}
        </b>
      </div>
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🚨 NAYA LOGIC: Image select hone par preview banana
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file)); // Preview URL generate kiya
    }
  };

  // Image remove karne ka handler
  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAccount = formData.selectedPageData;

    if (!selectedAccount && formData.status === 'pending') {
      alert("Bhai, Platform (FB/LinkedIn) toh select kar lo!");
      return;
    }

    const scheduledAt = `${formData.date} ${formData.time}:00`;
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('date', scheduledAt);
    data.append('status', formData.status);

    if (selectedAccount) data.append('selectedPage', JSON.stringify(selectedAccount));
    if (formData.image) data.append('image', formData.image);

    const resultAction = await dispatch(createPost(data));

    if (createPost.fulfilled.match(resultAction)) {
      closeModalAndReset();
      const pName: string = selectedAccount?.provider || selectedAccount?.platform || "Account";
      alert("Post successfully scheduled on " + pName.toUpperCase());

      dispatch(fetchUserPosts());
      navigate('/dashboard/posts');

      setFormData({
        title: '', description: '', date: today, time: '12:00',
        status: 'pending', image: null, pageId: '', selectedPageData: null
      });
    } else {
      alert("Error: " + resultAction.payload);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-800">Planner Calendar</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your social media schedule</p>
          </div>
          <button onClick={handleNewPostClick} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-200">
            + New Post
          </button>
        </div>

        <div className="border border-gray-100 rounded-2xl p-2 bg-white shadow-inner">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            dateClick={handleDateClick}
            events={calendarEvents}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>
      </div>

      {/* 🚨 PREMIUM UI MODAL: CREATE NEW POST FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in duration-300">

            <div className="flex justify-between items-center p-6 lg:px-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Create New Post</h3>
              <button onClick={closeModalAndReset} className="bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-colors shadow-sm">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 lg:p-8 flex flex-col md:flex-row gap-8">

              {/* LEFT COLUMN: Image Upload Area */}
              <div className="w-full md:w-5/12 shrink-0">
                <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">Media Attachment</label>
                <div className={`relative w-full h-64 md:h-full min-h-[300px] border-2 border-dashed rounded-3xl overflow-hidden transition-all flex flex-col items-center justify-center group ${imagePreview ? 'border-blue-500 bg-gray-900' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 cursor-pointer'}`}>

                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button type="button" onClick={removeImage} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                          Remove Image
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="text-blue-500 bg-blue-50 p-4 rounded-full mb-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <p className="text-sm font-bold text-gray-600">Click or drag to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Form Fields */}
              <div className="w-full md:w-7/12 flex flex-col gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                    Publish Destination
                  </label>
                  <select
                    name="pageId"
                    value={formData.pageId}
                    onChange={(e) => {
                      const accObj = socialAccounts.find(a => String(a.id) === e.target.value);
                      setFormData({ ...formData, pageId: e.target.value, selectedPageData: accObj });
                    }}
                    // Jab loading ho rahi ho toh select ko thoda disable rakhein
                    disabled={isLoadingAccounts}
                    className={`w-full px-4 py-4 border rounded-2xl outline-none font-bold transition-all ${isLoadingAccounts ? 'bg-gray-200 text-gray-400 animate-pulse' : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    required={formData.status === 'pending'}
                  >
                    {isLoadingAccounts ? (
                      <option>Wait... fetching accounts 🚀</option>
                    ) : (
                      <>
                        <option value="">-- Choose Account --</option>
                        {socialAccounts.length === 0 ? (
                          <option disabled>No accounts found. Please link one.</option>
                        ) : (
                          socialAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              [{(acc.provider || acc.platform || '??').toUpperCase()}] {acc.name}
                            </option>
                          ))
                        )}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Post Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Internal name for this post" className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800" required />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Caption / Content</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="What do you want to share with your audience?" className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 resize-none" required />
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Schedule Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700" required />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Schedule Time</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Post Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                  >
                    <option value="pending">Schedule (Auto-Post)</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>

                <div className="pt-4 mt-auto">
                  <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg transition-all ${isLoading ? 'bg-blue-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-1'}`}>
                    {isLoading ? 'Processing...' : (formData.status === 'pending' ? 'Schedule Post Now' : 'Save as Draft')}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 🚨 PREMIUM POPUP 2: POST DETAILS */}
      {isDetailsOpen && selectedEventData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 sm:p-6 opacity-100 transition-opacity">

          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100 animate-in zoom-in-95 duration-200">

            {/* 📸 HEADER IMAGE & MEDIA AREA */}
            <div className="relative h-64 w-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center group">
              {selectedEventData.imageUrl ? (
                <>
                  <img src={selectedEventData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  {/* Subtle dark gradient overlay taaki text aur button clearly dikhe */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40"></div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center opacity-50">
                  <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="font-bold uppercase tracking-widest text-xs text-gray-500">No Media Attached</span>
                </div>
              )}

              {/* ✖️ GLASSMORPHISM CLOSE BUTTON */}
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="absolute top-5 right-5 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              {/* 🏷️ PLATFORM BADGE (Floating on Image) */}
              <div className="absolute bottom-5 left-6">
                <span className={`px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] text-white shadow-lg ${selectedEventData.platform === 'linkedin' ? 'bg-blue-600' :
                    selectedEventData.platform === 'facebook' ? 'bg-blue-800' : 'bg-gray-800'
                  }`}>
                  {selectedEventData.platform}
                </span>
              </div>
            </div>

            {/* 📝 CONTENT AREA */}
            <div className="p-6 lg:p-8">
              <div className="flex justify-between items-start mb-3 gap-4">
                <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedEventData.title}</h3>

                {/* 🚥 STATUS INDICATOR (Soft Colors) */}
                <span className={`shrink-0 px-3 py-1.5 rounded-xl font-bold uppercase tracking-widest text-[9px] border ${selectedEventData.status === 'published' ? 'bg-green-50 text-green-600 border-green-200' :
                    selectedEventData.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                  {selectedEventData.status}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-8 line-clamp-4 leading-relaxed font-medium">
                {selectedEventData.description}
              </p>

              {/* 📅 DATE & TIME WIDGET (Neumorphic Feel) */}
              <div className="bg-gray-50 rounded-2xl p-1.5 flex items-center text-sm border border-gray-100 shadow-inner">
                <div className="flex-1 bg-white p-3.5 rounded-xl text-center shadow-sm m-1">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">Date</span>
                  <span className="font-black text-gray-800">{selectedEventData.date}</span>
                </div>
                <div className="flex-1 bg-white p-3.5 rounded-xl text-center shadow-sm m-1">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">Time</span>
                  <span className="font-black text-gray-800">{selectedEventData.time}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;