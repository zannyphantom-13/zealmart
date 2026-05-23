import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import toast from 'react-hot-toast';

export default function Navbar() {
    const [search, setSearch] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [tickerText, setTickerText] = useState('Powering the Future, Automating Success.');
    const { user, isAdmin, logout } = useAuthStore();
    const { getTotalItems } = useCartStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'site_settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().tickerMessages) {
                    setTickerText(docSnap.data().tickerMessages.join('     |     '));
                }
            } catch (error) {
                console.error("Error fetching ticker settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) navigate(`/products?search=${encodeURIComponent(search)}`);
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Signed out successfully');
    };

    return (
        <>
            {/* TOP ANNOUNCEMENT BANNER */}
            <div className="bg-brandBlack text-white text-center py-2 text-xs font-semibold tracking-widest border-b border-gray-800 uppercase animate-pulse">
                {tickerText}
            </div>

            {/* PRIMARY NAVBAR */}
            <header className="bg-brandDark text-white sticky top-0 z-50 shadow-xl border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 gap-4">
                        
                        {/* Brand Logo */}
                        <Link to="/" className="flex items-center space-x-2 group shrink-0">
                            <div className="relative bg-brandBlack p-2 rounded-full border border-brandLime/50 group-hover:border-brandLime transition-all duration-300">
                                <i className="fa-solid fa-solar-panel text-brandLime text-xl"></i>
                                <i className="fa-solid fa-bolt text-brandYellow text-xs absolute -bottom-1 -right-1 animate-bounce"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tight text-white group-hover:text-brandLime transition-colors duration-300">
                                    MAYJAY <span className="text-brandLime">CONCEPTS</span>
                                </span>
                                <span className="text-[9px] uppercase tracking-widest text-gray-400 -mt-1">Automation & Energy</span>
                            </div>
                        </Link>

                        {/* Global Search Bar */}
                        <div className="hidden md:flex flex-1 max-w-xl relative">
                            <form onSubmit={handleSearch} className="w-full relative">
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products, solutions, or systems..."
                                    className="w-full bg-brandBlack text-white pl-4 pr-12 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-brandLime focus:ring-1 focus:ring-brandLime transition-all duration-300 placeholder-gray-500 text-sm"
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-brandLime text-brandBlack font-bold px-3 py-1.5 rounded-md hover:bg-white transition-colors duration-300 text-xs">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </button>
                            </form>
                        </div>

                        {/* Right Utility Icons */}
                        <div className="flex items-center space-x-4 shrink-0">
                            <Link to={user ? "/profile" : "/login"} className="text-gray-300 hover:text-brandLime p-2 transition-colors duration-200 relative group hidden sm:inline-block">
                                <i className="fa-regular fa-user text-lg"></i>
                            </Link>
                            {isAdmin && (
                                <Link to="/admin" className="text-gray-300 hover:text-brandLime p-2 transition-colors duration-200 hidden sm:inline-block" title="Admin Dashboard">
                                    <i className="fa-solid fa-cog text-lg"></i>
                                </Link>
                            )}
                            {user && (
                                <button onClick={handleLogout} className="text-gray-300 hover:text-brandLime p-2 transition-colors duration-200 hidden sm:inline-block" title="Logout">
                                    <i className="fa-solid fa-sign-out-alt text-lg"></i>
                                </button>
                            )}
                            <Link to="/cart" className="text-gray-300 hover:text-brandLime p-2 transition-colors duration-200 relative flex items-center space-x-1 bg-brandBlack/50 px-3 py-1.5 rounded-lg border border-gray-800">
                                <i className="fa-solid fa-cart-shopping text-brandLime text-sm"></i>
                                <span className="bg-brandLime text-brandBlack text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {getTotalItems()}
                                </span>
                            </Link>
                            {/* Mobile Menu Button */}
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white hover:text-brandLime focus:outline-none p-2">
                                <i className={`fa-solid text-xl ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* DESKTOP MEGA-NAVIGATION */}
                <nav className="hidden md:block bg-brandBlack border-t border-gray-800 text-sm font-medium">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1">
                        <Link to="/" className="px-4 py-3.5 text-brandLime border-b-2 border-brandLime transition-all">HOME</Link>
                        
                        <div className="relative" onMouseEnter={() => setActiveDropdown('solar')} onMouseLeave={() => setActiveDropdown(null)}>
                            <Link to="/products?cat=Solar" className="px-4 py-3.5 text-gray-300 hover:text-white flex items-center space-x-1 transition-all">
                                <span>SOLAR & POWER SOLUTIONS</span>
                                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${activeDropdown === 'solar' ? 'rotate-180' : ''}`}></i>
                            </Link>
                            {activeDropdown === 'solar' && (
                                <div className="absolute left-0 w-56 bg-white text-gray-800 shadow-2xl rounded-b-lg border border-gray-100 py-2 z-50">
                                    <Link to="/products?cat=Solar%20Panels" className="block px-4 py-2.5 hover:bg-brandLime/10 hover:text-brandDark transition-colors">Solar Panels</Link>
                                    <Link to="/products?cat=Inverters" className="block px-4 py-2.5 hover:bg-brandLime/10 hover:text-brandDark transition-colors">Inverters & Converters</Link>
                                </div>
                            )}
                        </div>

                        <div className="relative" onMouseEnter={() => setActiveDropdown('electronics')} onMouseLeave={() => setActiveDropdown(null)}>
                            <Link to="/products?cat=Electronics" className="px-4 py-3.5 text-gray-300 hover:text-white flex items-center space-x-1 transition-all">
                                <span>GENERAL ELECTRONICS</span>
                                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${activeDropdown === 'electronics' ? 'rotate-180' : ''}`}></i>
                            </Link>
                            {activeDropdown === 'electronics' && (
                                <div className="absolute left-0 w-56 bg-white text-gray-800 shadow-2xl rounded-b-lg border border-gray-100 py-2 z-50">
                                    <Link to="/products?cat=Appliances" className="block px-4 py-2.5 hover:bg-brandLime/10 hover:text-brandDark transition-colors">Smart Home Appliances</Link>
                                    <Link to="/products?cat=Gadgets" className="block px-4 py-2.5 hover:bg-brandLime/10 hover:text-brandDark transition-colors">Gadgets & Accessories</Link>
                                </div>
                            )}
                        </div>

                        <Link to="/products" className="px-4 py-3.5 text-gray-300 hover:text-white transition-all">ALL PRODUCTS</Link>
                    </div>
                </nav>

                {/* MOBILE NAVIGATION */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-brandDark border-t border-gray-700 px-4 pt-2 pb-6 space-y-2 transition-all">
                        <form onSubmit={handleSearch} className="relative my-3">
                            <input 
                                type="text" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..." 
                                className="w-full bg-brandBlack text-white pl-4 pr-10 py-2 rounded-lg text-sm border border-gray-700" 
                            />
                            <button type="submit" className="absolute right-3 top-2 text-gray-400">
                                <i className="fa-solid fa-magnifying-glass text-xs"></i>
                            </button>
                        </form>
                        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md bg-brandBlack text-brandLime font-semibold">HOME</Link>
                        <div className="border-t border-gray-800 my-1"></div>
                        <span className="block px-3 py-1 text-xs text-gray-400 font-bold tracking-wider uppercase">Categories</span>
                        <Link to="/products?cat=Solar" onClick={() => setMobileMenuOpen(false)} className="block px-5 py-2 text-gray-300 text-sm hover:text-white">Solar & Power</Link>
                        <Link to="/products?cat=Electronics" onClick={() => setMobileMenuOpen(false)} className="block px-5 py-2 text-gray-300 text-sm hover:text-white">General Electronics</Link>
                        <div className="border-t border-gray-800 my-1"></div>
                        
                        {user ? (
                            <>
                                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-300 hover:text-white">My Account</Link>
                                {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-brandLime hover:text-white">Admin</Link>}
                                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-brandLime hover:text-white">Login</Link>
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-300 hover:text-white">Register</Link>
                            </>
                        )}
                    </div>
                )}
            </header>
        </>
    );
}
