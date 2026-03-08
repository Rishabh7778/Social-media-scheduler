import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import axios from 'axios';

import { useDispatch, useSelector } from 'react-redux';
import { createPost } from '../features/posts/postSlice';
import type { AppDispatch, RootState } from '../store/store';

interface PostFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  status: string;
  image: File | null;
  pageId: string;
  selectedPageData: any | null; // Naya field pura object store karne ke liye
}

const CalendarView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userPages, setUserPages] = useState<any[]>([]);
  const [isPagesLoading, setIsPagesLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.posts);

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    description: '',
    date: '',
    time: '12:00',
    status: 'pending',
    image: null,
    pageId: '',
    selectedPageData: null,
  });

  const fetchFacebookPages = async () => {
    setIsPagesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/facebook/pages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPages(response.data);
    } catch (err) {
      console.error("Pages fetch karne mein galti hui:", err);
    } finally {
      setIsPagesLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchFacebookPages();
    }
  }, [isModalOpen]);

  const handleDateClick = (arg: DateClickArg) => {
    setFormData({ ...formData, date: arg.dateStr });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selectedPageData && formData.status === 'pending') {
      alert("Bhai, Page toh select kar lo!");
      return;
    }

    const scheduledAt = `${formData.date} ${formData.time}:00`;

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('date', scheduledAt);
    data.append('status', formData.status);
    
    // YAHAN DHAYAN DO: Pura object stringify karke bhej rahe hain
    if (formData.selectedPageData) {
        data.append('selectedPage', JSON.stringify(formData.selectedPageData));
    }

    if (formData.image) {
      data.append('image', formData.image);
    }

    const resultAction = await dispatch(createPost(data));

    if (createPost.fulfilled.match(resultAction)) {
      setIsModalOpen(false);
      // Reset Form
      setFormData({ 
        title: '', description: '', date: '', time: '12:00', 
        status: 'pending', image: null, pageId: '', selectedPageData: null 
      });
      alert("Post successfully saved and scheduled!");
    } else {
      alert("Error: " + resultAction.payload);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Schedule Your Posts</h2>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dateClick={handleDateClick}
          height="80vh"
          events={[]} // Yahan aap apne scheduled posts fetch karke dikha sakte hain
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Create New Post</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Facebook Page Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Facebook Page</label>
                <select
                  name="pageId"
                  value={formData.pageId}
                  onChange={(e) => {
                    const pageObj = userPages.find(p => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      pageId: e.target.value,
                      selectedPageData: pageObj // Token aur ID dono yahan save ho gaye
                    });
                  }}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-blue-500"
                  required={formData.status === 'pending'}
                >
                  <option value="">-- Select a Page --</option>
                  {isPagesLoading ? <option>Loading...</option> :
                    userPages.map(page => (
                      <option key={page.id} value={page.id}>{page.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 w-full px-3 py-2 border rounded-md" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input type="time" name="time" value={formData.time} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md">
                  <option value="pending">Pending (Schedule)</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-md text-white font-semibold transition ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isLoading ? 'Saving...' : (formData.status === 'pending' ? 'Schedule Post' : 'Save Draft')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;