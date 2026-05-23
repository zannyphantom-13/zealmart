import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-brandBlack text-gray-400 pt-16 pb-8 border-t border-gray-800 text-xs mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-gray-800">
                {/* Branding Widget */}
                <div className="lg:col-span-2 space-y-4">
                    <Link to="/" className="flex items-center space-x-2 group w-max">
                        <div className="bg-brandDark p-2 rounded-full border border-brandLime/50">
                            <i className="fa-solid fa-solar-panel text-brandLime text-base"></i>
                        </div>
                        <span className="text-lg font-black tracking-tight text-white">
                            MAYJAY <span className="text-brandLime">CONCEPTS</span>
                        </span>
                    </Link>
                    <p className="text-gray-500 leading-relaxed max-w-sm text-[11px]">
                        Engineering advanced solutions for domestic clean-energy transitions and robust cross-channel merchant automation environments.
                    </p>
                    <div className="flex space-x-3 pt-2">
                        <a href="#" className="w-8 h-8 rounded-full bg-brandDark flex items-center justify-center hover:bg-brandLime hover:text-brandBlack text-white transition-all"><i className="fa-brands fa-facebook-f"></i></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-brandDark flex items-center justify-center hover:bg-brandLime hover:text-brandBlack text-white transition-all"><i className="fa-brands fa-x-twitter"></i></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-brandDark flex items-center justify-center hover:bg-brandLime hover:text-brandBlack text-white transition-all"><i className="fa-brands fa-linkedin-in"></i></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-brandDark flex items-center justify-center hover:bg-brandLime hover:text-brandBlack text-white transition-all"><i className="fa-brands fa-instagram"></i></a>
                    </div>
                </div>

                {/* Links Column 1 */}
                <div>
                    <h4 className="text-white font-bold tracking-wider uppercase mb-4 text-[11px]">COMPANY INFO</h4>
                    <ul className="space-y-2.5">
                        <li><Link to="#" className="hover:text-brandLime transition-colors">About Us</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Our Properties</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Solar & Power Systems</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Terms & Services</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Privacy Policy</Link></li>
                    </ul>
                </div>

                {/* Links Column 2 */}
                <div>
                    <h4 className="text-white font-bold tracking-wider uppercase mb-4 text-[11px]">CUSTOMER SERVICE</h4>
                    <ul className="space-y-2.5">
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Appliances Depot</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Smart Services</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Accessories Support</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Returns & Exchanges</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Secure Ordering</Link></li>
                    </ul>
                </div>

                {/* Links Column 3 */}
                <div>
                    <h4 className="text-white font-bold tracking-wider uppercase mb-4 text-[11px]">RESOURCES</h4>
                    <ul className="space-y-2.5">
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Automation Hardware</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">PLC Coding Guides</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Sensors Catalog</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Software Documentation</Link></li>
                        <li><Link to="#" className="hover:text-brandLime transition-colors">Alternative Energy Blog</Link></li>
                    </ul>
                </div>
            </div>

            {/* FOOTER SUB-ROW */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500">
                <div className="flex items-center space-x-2 order-2 sm:order-1">
                    <span>&copy; {new Date().getFullYear()} MAYJAY CONCEPTS. All Rights Reserved.</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 order-1 sm:order-2">
                    <div className="flex items-center space-x-1.5 bg-brandDark px-3 py-1.5 rounded-md text-white border border-gray-800">
                        <i className="fa-solid fa-shield-halved text-brandLime text-xs"></i>
                        <span className="text-[10px] font-bold tracking-wider uppercase">Secured Payment</span>
                    </div>
                    {/* Country Flag Identity Marker */}
                    <div className="flex items-center space-x-2 bg-brandDark px-3 py-1.5 rounded-md border border-gray-800">
                        <div className="flex space-x-0.5 h-3.5 w-5 rounded overflow-hidden">
                            <div className="bg-emerald-700 w-1/3 h-full"></div>
                            <div className="bg-white w-1/3 h-full"></div>
                            <div className="bg-emerald-700 w-1/3 h-full"></div>
                        </div>
                        <span className="text-white text-[10px] font-extrabold tracking-widest uppercase">MADE IN NIGERIA</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
