import React, { useState } from 'react';
import { X, Calendar, Tag, HardDrive, Maximize2 } from 'lucide-react';

// 1. Typescript Interface for Media
interface MediaItem {
  id: number;
  url: string;
  title: string;
  date: string;
  size: string;
  type: string;
}

const MediaGallery = () => {
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  // Static Data
  const mediaFiles: MediaItem[] = [
    { id: 1, url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500', title: 'Facebook Promo Post', date: 'Oct 24, 2023', size: '1.2 MB', type: 'PNG' },
    { id: 2, url: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=500', title: 'Instagram Story Art', date: 'Oct 22, 2023', size: '850 KB', type: 'JPG' },
    { id: 3, url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500', title: 'Analytics Chart Update', date: 'Oct 20, 2023', size: '2.4 MB', type: 'PNG' },
    { id: 4, url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500', title: 'Team Meeting Cover', date: 'Oct 18, 2023', size: '1.1 MB', type: 'JPG' },
    { id: 5, url: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=500', title: 'Marketing Strategy', date: 'Oct 15, 2023', size: '3.1 MB', type: 'PNG' },
    { id: 6, url: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?w=500', title: 'New Product Launch', date: 'Oct 12, 2023', size: '1.5 MB', type: 'JPG' },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Media Gallery</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Upload New</button>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mediaFiles.map((item) => (
          <div 
            key={item.id} 
            className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedImage(item)}
          >
            <div className="aspect-square overflow-hidden">
              <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="p-3">
              <p className="font-semibold text-slate-700 truncate">{item.title}</p>
              <p className="text-xs text-slate-400">{item.date}</p>
            </div>
            {/* Overlay icon */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Popup (Modal) */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left: Image Preview */}
            <div className="md:w-2/3 bg-slate-100 flex items-center justify-center p-2">
              <img src={selectedImage.url} alt={selectedImage.title} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>

            {/* Right: Details Section */}
            <div className="md:w-1/3 p-8 relative">
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X size={24} className="text-slate-500" />
              </button>

              <h3 className="text-2xl font-bold text-slate-800 mb-6">{selectedImage.title}</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={18} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Uploaded On</p>
                    <p className="font-medium">{selectedImage.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <HardDrive size={18} className="text-emerald-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">File Size</p>
                    <p className="font-medium">{selectedImage.size}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Tag size={18} className="text-amber-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Format</p>
                    <p className="font-medium">{selectedImage.type}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  Use in Post
                </button>
                <button className="w-full border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;