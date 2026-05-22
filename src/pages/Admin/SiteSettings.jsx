import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export default function SiteSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [tickerMessages, setTickerMessages] = useState([
        "⚡ Best Deals on Electronics & Home Appliances — Limited Offers, Shop Now!",
        "🚚 Enjoy Fast Delivery Across Lagos — Free Shipping on Orders From ₦999,999.99!"
    ]);

    const [heroSlides, setHeroSlides] = useState([
        {
            title: "Upgrade Your Living Space",
            subtitle: "Premium Air Conditioners, Televisions, and Home Appliances from world-class brands.",
            buttonText: "Shop Appliances",
            link: "/products",
            image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=1920&q=80"
        }
    ]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'site_settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.tickerMessages) setTickerMessages(data.tickerMessages);
                    if (data.heroSlides) setHeroSlides(data.heroSlides);
                }
            } catch (error) {
                console.error("Error loading settings:", error);
                toast.error("Failed to load settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'site_settings'), {
                tickerMessages,
                heroSlides
            }, { merge: true });
            toast.success("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    // Ticker Handlers
    const addTicker = () => setTickerMessages([...tickerMessages, ""]);
    const updateTicker = (idx, val) => {
        const newArr = [...tickerMessages];
        newArr[idx] = val;
        setTickerMessages(newArr);
    };
    const removeTicker = (idx) => setTickerMessages(tickerMessages.filter((_, i) => i !== idx));

    // Slide Handlers
    const addSlide = () => {
        if (heroSlides.length >= 7) {
            toast.error("Maximum of 7 slides allowed.");
            return;
        }
        setHeroSlides([...heroSlides, { title: "", subtitle: "", buttonText: "", link: "", image: "" }]);
    };
    const updateSlide = (idx, field, val) => {
        const newArr = [...heroSlides];
        newArr[idx][field] = val;
        setHeroSlides(newArr);
    };
    const removeSlide = (idx) => setHeroSlides(heroSlides.filter((_, i) => i !== idx));

    if (loading) return <div className="p-8 text-center">Loading Settings...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase">Site Settings</h2>
                    <p className="text-gray-500 text-sm">Manage Homepage content and Top Bar Messages.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-zeal-blue hover:bg-blue-800 text-white px-6 py-2 rounded font-bold transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>

            {/* Ticker Settings */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Top Bar Ticker Messages</h3>
                    <button onClick={addTicker} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-bold text-zeal-blue">
                        + Add Message
                    </button>
                </div>
                <div className="space-y-3">
                    {tickerMessages.map((msg, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={msg} 
                                onChange={(e) => updateTicker(idx, e.target.value)} 
                                className="flex-1 border border-gray-300 p-2 rounded text-sm outline-none focus:border-zeal-blue"
                                placeholder="Enter ticker message..."
                            />
                            <button onClick={() => removeTicker(idx)} className="bg-red-50 text-red-500 p-2 rounded hover:bg-red-100">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    ))}
                    {tickerMessages.length === 0 && <p className="text-sm text-gray-400">No messages added.</p>}
                </div>
            </div>

            {/* Hero Carousel Settings */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Hero Carousel Slides</h3>
                        <p className="text-xs text-gray-500">Add up to 7 giant slides for the homepage hero section.</p>
                    </div>
                    <button onClick={addSlide} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-bold text-zeal-blue">
                        + Add Slide ({heroSlides.length}/7)
                    </button>
                </div>

                <div className="space-y-8">
                    {heroSlides.map((slide, idx) => (
                        <div key={idx} className="border border-gray-200 p-4 rounded bg-gray-50 relative">
                            <div className="absolute top-2 right-2">
                                <button onClick={() => removeSlide(idx)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 font-bold">
                                    Delete Slide
                                </button>
                            </div>
                            <h4 className="font-bold text-sm mb-4 text-zeal-blue">Slide #{idx + 1}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                                    <input 
                                        type="text" 
                                        value={slide.title} 
                                        onChange={(e) => updateSlide(idx, 'title', e.target.value)} 
                                        className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-zeal-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
                                    <input 
                                        type="text" 
                                        value={slide.image} 
                                        onChange={(e) => updateSlide(idx, 'image', e.target.value)} 
                                        className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-zeal-blue"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle</label>
                                    <input 
                                        type="text" 
                                        value={slide.subtitle} 
                                        onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)} 
                                        className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-zeal-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Button Text</label>
                                    <input 
                                        type="text" 
                                        value={slide.buttonText} 
                                        onChange={(e) => updateSlide(idx, 'buttonText', e.target.value)} 
                                        className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-zeal-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Button Link</label>
                                    <input 
                                        type="text" 
                                        value={slide.link} 
                                        onChange={(e) => updateSlide(idx, 'link', e.target.value)} 
                                        className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-zeal-blue"
                                        placeholder="/products?cat=..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {heroSlides.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No slides added.</p>}
                </div>
            </div>
        </div>
    );
}
