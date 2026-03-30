import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import { type EventClickArg, type EventContentArg } from '@fullcalendar/core';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createPost, fetchUserPosts } from '../features/posts/postSlice';
import type { AppDispatch, RootState } from '../store/store';

// Interfaces
interface PostFormData { title: string; description: string; date: string; time: string; status: string; image: File | null; pageId: string; selectedPageData: any | null; }
interface SocialAccount { access_token?: string; id: string | number; name: string; provider?: string; platform?: string; }
interface Post { id: number; title: string; description: string; scheduled_at: string; status: string; image_url?: string; provider?: string; }

const CalendarView: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
    const [isDayPostsOpen, setIsDayPostsOpen] = useState<boolean>(false); 
    const [selectedDayPosts, setSelectedDayPosts] = useState<Post[]>([]); 
    const [selectedEventData, setSelectedEventData] = useState<any | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

    const dispatch = useDispatch<AppDispatch>();
    const { posts, isLoading } = useSelector((state: RootState) => state.posts);
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState<PostFormData>({
        title: '', description: '', date: today, time: '12:00',
        status: 'pending', image: null, pageId: '', selectedPageData: null,
    });

    useEffect(() => { dispatch(fetchUserPosts()); }, [dispatch]);

    const calendarEvents = useMemo(() => {
        if (!posts) return [];
        return posts.map((post: Post) => ({
            id: String(post.id),
            title: post.title,
            start: post.scheduled_at,
            backgroundColor: post.status === 'published' ? '#10b981' : '#f59e0b',
            borderColor: 'transparent',
            extendedProps: post
        }));
    }, [posts]);

    useEffect(() => {
        const fetchSocialAccounts = async () => {
            setIsLoadingAccounts(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/auth/social-accounts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSocialAccounts(response.data);
            } catch (err) { console.error(err); } finally { setIsLoadingAccounts(false); }
        };
        if (isModalOpen) fetchSocialAccounts();
    }, [isModalOpen]);

    const handleDateClick = (arg: DateClickArg) => {
        const postsForThisDay = posts.filter(p => p.scheduled_at.startsWith(arg.dateStr));
        if (postsForThisDay.length > 0) {
            setSelectedDayPosts(postsForThisDay);
            setIsDayPostsOpen(true);
        } else {
            setFormData({ ...formData, date: arg.dateStr });
            setIsModalOpen(true);
        }
    };

    const handleEventClick = (info: EventClickArg) => {
        const data = info.event.extendedProps;
        setSelectedEventData({
            ...data,
            date: info.event.startStr.split('T')[0],
            time: info.event.startStr.split('T')[1]?.substring(0, 5) || '12:00',
            platform: data.provider,
            imageUrl: data.image_url
        });
        setIsDetailsOpen(true);
    };

    const renderEventContent = (eventInfo: EventContentArg) => {
        const imgUrl = eventInfo.event.extendedProps.image_url;
        return (
            <div className="flex flex-col items-center p-0.5 cursor-pointer overflow-hidden w-full">
                {imgUrl ? <img src={imgUrl} className="w-full h-8 md:h-12 object-cover rounded-sm mb-1" /> : <div className="w-full h-4 md:h-6 bg-gray-200 rounded-sm mb-1" />}
                <b className="text-[8px] md:text-[10px] truncate w-full text-center text-black">{eventInfo.event.title}</b>
            </div>
        );
    };

    const closeModalAndReset = () => { setIsModalOpen(false); setImagePreview(null); };
    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleImageChange = (e: any) => {
        if (e.target.files?.[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };
    const removeImage = () => { setFormData({ ...formData, image: null }); setImagePreview(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('date', `${formData.date} ${formData.time}:00`);
        data.append('status', formData.status);
        if (formData.selectedPageData) data.append('selectedPage', JSON.stringify(formData.selectedPageData));
        if (formData.image) data.append('image', formData.image);

        const result = await dispatch(createPost(data));
        if (createPost.fulfilled.match(result)) {
            closeModalAndReset();
            dispatch(fetchUserPosts());
            navigate('/dashboard/posts');
        }
    };

    return (
        <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800">Planner Calendar</h2>
                    <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-200">+ New Post</button>
                </div>
                
                {/* FullCalendar Responsive Wrapper */}
                <div className="overflow-x-auto">
                    <div className="min-w-[600px] md:min-w-full">
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
            </div>

            {/* LIST MODAL */}
            {isDayPostsOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-black text-lg md:text-xl text-gray-800">Posts for {selectedDayPosts[0]?.scheduled_at.split(' ')[0]}</h3>
                            <button onClick={() => setIsDayPostsOpen(false)} className="text-2xl font-bold text-gray-400 hover:text-red-500">&times;</button>
                        </div>
                        <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto space-y-4">
                            {selectedDayPosts.map(post => (
                                <div key={post.id} className="flex gap-4 p-3 md:p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer border border-gray-100" onClick={() => { handleEventClick({ event: { title: post.title, startStr: post.scheduled_at, extendedProps: post } } as any); setIsDayPostsOpen(false); }}>
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                                        {post.image_url && <img src={post.image_url} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 truncate text-sm md:text-base">{post.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{post.description}</p>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setFormData({ ...formData, date: selectedDayPosts[0].scheduled_at.split(' ')[0] }); setIsDayPostsOpen(false); setIsModalOpen(true); }} className="w-full py-3 md:py-4 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-all mt-2">+ Add Another Post</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE POST MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center z-[100] p-0 md:p-4 overflow-y-auto">
                    <div className="bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-4xl min-h-screen md:min-h-0 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-5 md:px-8 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl md:text-2xl font-black text-gray-800">Create New Post</h3>
                            <button onClick={closeModalAndReset} className="bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-colors shadow-sm">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-5 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 overflow-y-auto">
                            {/* LEFT COLUMN: Image Upload */}
                            <div className="w-full md:w-5/12 shrink-0">
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Media Attachment</label>
                                <div className={`relative w-full h-48 md:h-full min-h-[200px] md:min-h-[350px] border-2 border-dashed rounded-3xl overflow-hidden transition-all flex flex-col items-center justify-center group ${imagePreview ? 'border-blue-500 bg-gray-900' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 cursor-pointer'}`}>
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <button type="button" onClick={removeImage} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">Remove</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="text-blue-500 bg-blue-50 p-3 rounded-full mb-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                                            <p className="text-xs font-bold text-gray-500">Click to upload media</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Form Fields */}
                            <div className="w-full md:w-7/12 flex flex-col gap-4 md:gap-5 pb-10 md:pb-0">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Destination</label>
                                    <select name="pageId" value={formData.pageId} onChange={(e) => { const acc = socialAccounts.find(a => String(a.id) === e.target.value); setFormData({ ...formData, pageId: e.target.value, selectedPageData: acc }); }} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 text-sm" required={formData.status === 'pending'}>
                                        <option value="">{isLoadingAccounts ? 'Fetching...' : '-- Choose Account --'}</option>
                                        {socialAccounts.map(acc => <option key={acc.id} value={acc.id}>[{(acc.provider || acc.platform || '??').toUpperCase()}] {acc.name}</option>)}
                                    </select>
                                </div>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Post Title" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium text-sm" required />
                                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Caption..." className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium resize-none text-sm" required />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-700 text-sm" required />
                                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-gray-700 text-sm" required />
                                </div>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-700 outline-none text-sm">
                                    <option value="pending">Schedule (Auto-Post)</option>
                                    <option value="draft">Save as Draft</option>
                                </select>
                                <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg transition-all text-sm ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {isLoading ? 'Processing...' : 'Schedule Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            {isDetailsOpen && selectedEventData && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center z-[110] p-0 md:p-4">
                    <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="relative h-56 md:h-64 w-full bg-gray-200">
                            {selectedEventData.imageUrl ? <img src={selectedEventData.imageUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No Media</div>}
                            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center text-xl transition-colors">&times;</button>
                            <div className="absolute bottom-4 left-6 px-3 py-1 rounded-full bg-blue-600 text-white font-black text-[9px] uppercase shadow-lg">{selectedEventData.platform}</div>
                        </div>
                        <div className="p-6 md:p-8">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-tight">{selectedEventData.title}</h3>
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 font-bold text-[8px] uppercase mb-4">{selectedEventData.status}</span>
                            <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed font-medium">{selectedEventData.description}</p>
                            <div className="bg-gray-50 rounded-2xl p-1 flex items-center text-xs border border-gray-100 shadow-inner">
                                <div className="flex-1 bg-white p-3 rounded-xl text-center shadow-sm m-1"><span className="block text-[8px] uppercase font-bold text-gray-400 mb-0.5">Date</span><span className="font-black text-gray-800">{selectedEventData.date}</span></div>
                                <div className="flex-1 bg-white p-3 rounded-xl text-center shadow-sm m-1"><span className="block text-[8px] uppercase font-bold text-gray-400 mb-0.5">Time</span><span className="font-black text-gray-800">{selectedEventData.time}</span></div>
                            </div>
                            <div className="mt-6 md:hidden pb-4">
                                <button onClick={() => setIsDetailsOpen(false)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Close Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;