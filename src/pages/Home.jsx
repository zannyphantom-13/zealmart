import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';

const DEFAULT_SLIDES = [
    {
        id: 1,
        title: "SMART ENERGY.",
        subtitle: "The MAYJAY Concept fuses high-efficiency power infrastructure with enterprise-level sales automation engines.",
        buttonText: "EXPLORE OUR SOLUTIONS",
        link: "/products",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1000&q=80"
    }
];

const DEFAULT_FEATURED = [
    { id: '1', name: 'Smart Energy Meter Kit', price: 149000, category: 'Air Conditioners', brand: 'MAYJAY', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80' },
    { id: '2', name: 'Premium Solar Inverter 5kVA', price: 599000, category: 'Televisions', brand: 'MAYJAY', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80' },
    { id: '3', name: 'Deep Cycle Battery 200AH', price: 345000, category: 'Washing Machines', brand: 'MAYJAY', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80' },
    { id: '4', name: 'Industrial Automation PLC', price: 420000, category: 'Generators', brand: 'MAYJAY', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80' }
];

export default function Home() {
    const [featured, setFeatured] = useState(DEFAULT_FEATURED);
    const [featLoading, setFeatLoading] = useState(false);
    const [slides, setSlides] = useState(DEFAULT_SLIDES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFeatLoading(true);
                const settingsSnap = await getDoc(doc(db, 'settings', 'site_settings'));
                if (settingsSnap.exists() && settingsSnap.data().heroSlides && settingsSnap.data().heroSlides.length > 0) {
                    setSlides(settingsSnap.data().heroSlides);
                }

                const q = query(collection(db, "products"), where("featured", "==", true), limit(4));
                const snap = await getDocs(q);
                let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                if (items.length > 0) {
                    setFeatured(items);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setFeatLoading(false);
            }
        };
        fetchData();
    }, []);

    const activeHero = slides[currentSlide] || DEFAULT_SLIDES[0];

    return (
        <div className="bg-gray-50 flex-grow flex flex-col min-h-screen">
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
                {/* HERO & QUICK-VIEW GRID SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Side: Immersive Hero */}
                    <div className="lg:col-span-7 bg-brandBlack rounded-2xl relative overflow-hidden group shadow-2xl flex flex-col justify-between min-h-[420px] p-8 sm:p-12 border border-gray-800">
                        <div 
                            className="absolute inset-0 opacity-20 mix-blend-overlay bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url('${activeHero.image}')` }}
                        ></div>

                        <div className="absolute top-4 right-4 bg-brandLime/20 border border-brandLime/40 text-brandLime text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Innovative Ecosystem
                        </div>

                        <div className="relative z-10 max-w-xl my-auto">
                            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                                {activeHero.title.split(' ').map((word, i) => (
                                    <span key={i} className={i === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-brandLime to-brandGreen' : ''}>
                                        {word} {' '}
                                    </span>
                                ))}
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brandLime to-brandGreen">STREAMLINED</span> COMMERCE.
                            </h1>
                            <p className="text-gray-400 mt-4 text-sm sm:text-base font-light max-w-md">
                                {activeHero.subtitle || "High-efficiency power infrastructure with enterprise-level sales automation engines."}
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-wrap gap-4 pt-6">
                            <Link to={activeHero.link || "/products"} className="bg-brandLime text-brandBlack font-bold px-6 py-3 rounded-lg hover:bg-white shadow-lg transition-all duration-300 flex items-center space-x-2 group/btn text-sm">
                                <span>{activeHero.buttonText || "EXPLORE"}</span>
                                <i className="fa-solid fa-arrow-right transition-transform duration-300 group-hover/btn:translate-x-1"></i>
                            </Link>
                            <Link to="/products" className="border border-gray-700 text-white font-medium px-6 py-3 rounded-lg hover:bg-gray-800 transition-all text-sm">
                                View Catalog
                            </Link>
                        </div>

                        {/* Slider Indicators */}
                        <div className="flex space-x-2 mt-6 z-10">
                            {slides.map((_, idx) => (
                                <span 
                                    key={idx} 
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentSlide ? 'w-8 bg-brandLime' : 'w-2 bg-gray-700 hover:bg-gray-500'}`}
                                ></span>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Quick-View Grid */}
                    <div className="lg:col-span-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4 mt-8 lg:mt-0">
                            <h3 className="text-lg font-bold tracking-tight text-brandDark flex items-center space-x-2">
                                <span className="w-2 h-5 bg-brandLime rounded-sm inline-block"></span>
                                <span>NEW ARRIVALS</span>
                            </h3>
                            <Link to="/products" className="text-xs font-semibold text-brandGreen hover:text-brandLime flex items-center space-x-1">
                                <span>See All</span>
                                <i className="fa-solid fa-angle-right"></i>
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {featLoading ? (
                                [1,2,3,4].map(i => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64 animate-pulse flex flex-col">
                                        <div className="h-28 bg-gray-100 rounded-lg mb-2"></div>
                                        <div className="h-4 bg-gray-100 w-3/4 mb-1"></div>
                                        <div className="h-4 bg-gray-100 w-1/2 mb-auto"></div>
                                        <div className="h-8 bg-gray-100 w-full mt-3 rounded-md"></div>
                                    </div>
                                ))
                            ) : (
                                featured.slice(0, 4).map(product => (
                                    <div key={product.id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between group cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                                        <div className="relative overflow-hidden rounded-lg bg-gray-50 p-2 mb-2 flex items-center justify-center h-28">
                                            <img src={product.img || product.images?.[0] || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-700 line-clamp-1">{product.name}</h4>
                                            <p className="text-brandGreen font-extrabold text-sm mt-1">₦{Number(product.price).toLocaleString()}</p>
                                        </div>
                                        <div className="mt-3 grid grid-cols-5 gap-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                                                className="col-span-4 bg-brandDark text-white text-[11px] py-1.5 rounded-md hover:bg-brandLime hover:text-brandBlack transition-all font-bold"
                                            >
                                                Add to Cart
                                            </button>
                                            <button className="bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-md flex items-center justify-center">
                                                <i className="fa-regular fa-heart text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* TWO-COLUMN CORE BUSINESS DIVISIONS */}
                <section className="py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-brandDark to-brandBlack rounded-2xl p-8 text-white relative overflow-hidden group shadow-xl border border-gray-800">
                            <div className="absolute -right-10 -bottom-10 opacity-10 text-[180px] text-brandLime group-hover:rotate-12 transition-transform duration-500">
                                <i className="fa-solid fa-solar-panel"></i>
                            </div>
                            <span className="text-brandLime font-bold text-xs uppercase tracking-widest block mb-2">Sustainable Energy</span>
                            <h3 className="text-2xl font-black mb-3">SOLAR POWER SYSTEMS</h3>
                            <p className="text-gray-400 text-sm max-w-sm mb-6">High-performance custom design panels, smart grid controllers, and uninterrupted battery backups configured for zero-down-time.</p>
                            <Link to="/products?cat=Solar" className="inline-flex items-center space-x-2 text-sm font-bold text-white hover:text-brandLime transition-colors group/link">
                                <span>Configure System</span>
                                <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover/link:translate-x-1"></i>
                            </Link>
                        </div>

                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 text-brandDark relative overflow-hidden group shadow-xl border border-gray-200">
                            <div className="absolute -right-10 -bottom-10 opacity-5 text-[180px] text-brandDark group-hover:-rotate-12 transition-transform duration-500">
                                <i className="fa-solid fa-microchip"></i>
                            </div>
                            <span className="text-brandGreen font-bold text-xs uppercase tracking-widest block mb-2">Smart Living & Trade</span>
                            <h3 className="text-2xl font-black mb-3">E-COMMERCE ELECTRONICS</h3>
                            <p className="text-gray-600 text-sm max-w-sm mb-6">Explore heavy duty appliances, premium control processors, and automated peripheral devices instantly deployed to your logistics networks.</p>
                            <Link to="/products?cat=Electronics" className="inline-flex items-center space-x-2 text-sm font-bold text-brandDark hover:text-brandGreen transition-colors group/link">
                                <span>Browse Store</span>
                                <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover/link:translate-x-1"></i>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* SALES AUTOMATION SUITE */}
                <section id="automation-suite" className="bg-white rounded-2xl p-8 sm:p-12 shadow-xl border border-gray-100 my-4">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <div className="inline-flex items-center space-x-2 bg-brandLime/10 border border-brandLime/30 text-brandGreen px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                            <i className="fa-solid fa-network-wired"></i> <span>Automated Optimization</span>
                        </div>
                        <h2 className="text-3xl font-black text-brandDark">SALES AUTOMATION PLATFORM</h2>
                        <p className="text-gray-500 text-sm mt-2">Connect online channels with internal infrastructure pipelines seamlessly.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-xl border border-gray-100 transition-all duration-300 group text-center md:text-left">
                            <div className="w-12 h-12 rounded-xl bg-brandDark text-brandLime flex items-center justify-center mb-4 text-xl group-hover:bg-brandLime group-hover:text-brandBlack transition-colors mx-auto md:mx-0 shadow-md">
                                <i className="fa-solid fa-sliders"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mb-2">Centralized Order Management</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">Aggregates and routes cross-channel orders instantly through verification algorithms to speed fulfillment processing.</p>
                        </div>

                        <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-xl border border-gray-100 transition-all duration-300 group text-center md:text-left">
                            <div className="w-12 h-12 rounded-xl bg-brandDark text-brandLime flex items-center justify-center mb-4 text-xl group-hover:bg-brandLime group-hover:text-brandBlack transition-colors mx-auto md:mx-0 shadow-md">
                                <i className="fa-solid fa-boxes-stacked"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mb-2">Automated Inventory Sync</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">Keeps brick-and-mortar storage aligned with online visual product counts in millisecond real-time, preventing backorder issues.</p>
                        </div>

                        <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-xl border border-gray-100 transition-all duration-300 group text-center md:text-left">
                            <div className="w-12 h-12 rounded-xl bg-brandDark text-brandLime flex items-center justify-center mb-4 text-xl group-hover:bg-brandLime group-hover:text-brandBlack transition-colors mx-auto md:mx-0 shadow-md">
                                <i className="fa-solid fa-chart-pie"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mb-2">Integrated CRM & Reporting</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">Tracks buyer life-cycles, automatically computes sales data analytics, and populates clear dashboards for business reporting.</p>
                        </div>
                    </div>

                    <div className="mt-12 bg-brandBlack rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-800">
                        <div className="flex items-center space-x-4">
                            <div className="text-brandLime text-3xl hidden sm:block"><i className="fa-solid fa-laptop-code"></i></div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Ready to deploy high-grade sales mechanics?</h4>
                                <p className="text-gray-400 text-xs">Integrate API controls directly to standard physical machinery controllers.</p>
                            </div>
                        </div>
                        <button className="bg-brandLime text-brandBlack font-black text-xs px-6 py-3 rounded-lg hover:bg-white transition-all tracking-wider uppercase whitespace-nowrap">
                            Start Automating
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
