import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';

const CATEGORIES = [
    'All', 'Solar', 'Electronics', 'Automation', 'Air Conditioners', 'Televisions', 'Refrigerators', 'Generators', 'Washing Machines', 'Phones', 'Laptops', 'Audio', 'Gaming'
];

function pathToCategory(pathname) {
    if (pathname.includes('phones')) return 'Phones';
    if (pathname.includes('laptops')) return 'Laptops';
    if (pathname.includes('gaming')) return 'Gaming';
    return null;
}

export default function Shop() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    const urlCat = searchParams.get('cat') || searchParams.get('search') ? null : pathToCategory(location.pathname);
    const initial = CATEGORIES.find(c => c.toLowerCase() === (urlCat || '').toLowerCase()) || 'All';

    const [active, setActive] = useState(initial);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(collection(db, 'products'));
                let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                if (items.length === 0) {
                    items = [
                        { id: '1', name: 'Smart Energy Meter Kit', price: 149000, category: 'Solar', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80', brand: 'MAYJAY' },
                        { id: '2', name: 'Premium Solar Inverter 5kVA', price: 599000, category: 'Solar', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80', brand: 'MAYJAY' }
                    ];
                }
                setProducts(items);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const cat = searchParams.get('cat') || pathToCategory(location.pathname);
        if (cat) {
            const match = CATEGORIES.find(c => c.toLowerCase() === cat.toLowerCase());
            setActive(match || 'All');
            setSearch('');
        }
        
        const searchQ = searchParams.get('search');
        if (searchQ) {
            setSearch(searchQ);
            setActive('All');
        }
    }, [location.search, location.pathname, searchParams]);

    const filtered = products.filter(p => {
        const matchCat = active === 'All' || p.category === active;
        const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="bg-gray-50 flex-grow min-h-screen flex flex-col">
            {/* Page Header */}
            <div className="bg-brandBlack border-b border-gray-800 shadow-xl py-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1000&q=80')] mix-blend-overlay bg-cover bg-center"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="w-full md:w-auto">
                            <div className="inline-flex items-center space-x-2 bg-brandLime/10 border border-brandLime/30 text-brandLime px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3">
                                <i className="fa-solid fa-bolt"></i> <span>Premium Catalog</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
                                {search ? `Search: ${search}` : active === 'All' ? 'ALL PRODUCTS' : active}
                            </h1>
                            <p className="text-sm text-gray-400 mt-2 flex items-center font-medium">
                                <i className="fas fa-check-circle text-brandLime mr-1.5"></i> 100% Genuine Brands • Manufacturer Warranty
                            </p>
                        </div>
                        <div className="w-full md:w-96 relative group">
                            <input
                                type="text"
                                placeholder="Filter within catalog..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-brandDark text-white border border-gray-700 focus:border-brandLime focus:ring-1 focus:ring-brandLime rounded-lg py-3 pl-12 pr-4 outline-none transition-all font-medium text-sm placeholder-gray-500"
                            />
                            <i className="fas fa-search absolute left-4 top-4 text-gray-400 text-sm group-focus-within:text-brandLime transition-colors"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 flex-grow">
                {/* Sidebar Filters */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white border border-gray-100 overflow-hidden sticky top-28 shadow-xl rounded-2xl group">
                        <div className="bg-brandBlack text-brandLime px-5 py-4 font-black uppercase tracking-widest text-xs flex items-center justify-between border-b border-gray-800">
                            <span>Categories</span>
                            <i className="fas fa-layer-group text-gray-400 text-sm group-hover:text-brandLime transition-colors"></i>
                        </div>
                        <ul className="divide-y divide-gray-50 bg-gray-50/50">
                            {CATEGORIES.map(cat => (
                                <li key={cat}>
                                    <button
                                        onClick={() => { setActive(cat); setSearch(''); }}
                                        className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-all flex items-center justify-between group/btn ${
                                            active === cat 
                                              ? 'text-brandBlack bg-white border-l-4 border-brandLime shadow-sm' 
                                              : 'text-gray-500 hover:text-brandDark hover:bg-white border-l-4 border-transparent'
                                        }`}
                                    >
                                        <span>{cat}</span>
                                        <i className={`fas fa-chevron-right text-[10px] transition-transform ${active === cat ? 'text-brandLime translate-x-1' : 'text-gray-300 group-hover/btn:translate-x-1'}`}></i>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Main Product Grid */}
                <div className="flex-1">
                    <div className="bg-white p-4 border border-gray-100 mb-6 flex justify-between items-center rounded-xl shadow-md">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Found <span className="text-brandDark bg-brandLime/20 px-2 py-0.5 rounded-md ml-1">{filtered.length}</span> items
                        </span>
                        <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                            <span className="text-gray-400 mr-3">Sort by:</span>
                            <select className="bg-gray-50 border border-gray-200 text-brandDark py-2 px-3 outline-none rounded-lg focus:border-brandLime transition-colors cursor-pointer">
                                <option>Popularity</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 h-72 animate-pulse flex flex-col justify-between">
                                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-4"></div>
                                    <div className="h-4 bg-gray-100 w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-100 w-1/2 mb-auto"></div>
                                    <div className="h-8 bg-gray-100 w-full mt-3 rounded-md"></div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white p-16 rounded-2xl shadow-xl border border-gray-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                                <i className="fas fa-search text-3xl text-gray-300"></i>
                            </div>
                            <h3 className="text-2xl font-black text-brandDark mb-2 uppercase tracking-tight">No products found</h3>
                            <p className="text-gray-500 mb-8 font-medium text-sm max-w-sm">We couldn't find any items matching your criteria. Try adjusting your filters or search terms.</p>
                            <button 
                                onClick={() => { setSearch(''); setActive('All'); }}
                                className="bg-brandDark hover:bg-brandBlack text-brandLime font-black py-3 px-8 rounded-xl uppercase tracking-widest text-xs transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(p => (
                                <div key={p.id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between group cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                                    <div className="relative overflow-hidden rounded-lg bg-gray-50 p-2 mb-2 flex items-center justify-center h-40">
                                        <img src={p.img || p.images?.[0] || 'https://via.placeholder.com/150'} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-700 line-clamp-2 min-h-[32px]">{p.name}</h4>
                                        <p className="text-brandGreen font-extrabold text-sm mt-1">₦{Number(p.price).toLocaleString()}</p>
                                    </div>
                                    <div className="mt-3 grid grid-cols-5 gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}
                                            className="col-span-4 bg-brandDark text-white text-[11px] py-1.5 rounded-md hover:bg-brandLime hover:text-brandBlack transition-all font-bold"
                                        >
                                            Add to Cart
                                        </button>
                                        <button className="bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-md flex items-center justify-center">
                                            <i className="fa-regular fa-heart text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
