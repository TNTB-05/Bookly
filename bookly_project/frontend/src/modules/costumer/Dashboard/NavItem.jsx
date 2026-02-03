// Navigációs elem - támogatja a desktop és mobil nézetet
export default function NavItem({ tab, label, icon, activeTab, setActiveTab, setIsMobileMenuOpen, isMobile }) {
    return (
        <button
            onClick={() => {
                setActiveTab(tab);
                if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            }}
            className={`${
                isMobile
                    ? `flex flex-col items-center gap-1 p-2 w-full justify-center rounded-xl transition-all duration-300 ${
                          activeTab === tab ? 'bg-dark-blue text-white shadow-lg scale-105' : 'text-gray-700 hover:text-dark-blue'
                      }`
                    : `${
                          activeTab === tab
                              ? 'border-dark-blue text-dark-blue font-semibold'
                              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-dark-blue'
                      } border-b-2 pb-1 transition-colors duration-200`
            }`}
        >
            {isMobile && <span className="text-lg">{icon}</span>}
            <span className={isMobile ? 'text-[10px] font-medium' : ''}>{label}</span>
        </button>
    );
}
