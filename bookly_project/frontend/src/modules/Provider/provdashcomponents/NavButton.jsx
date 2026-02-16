const NavButton = ({ activeTab, tabId, label, icon, onClick, isMobile }) => (
    <button
        onClick={() => onClick(tabId)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden
            ${activeTab === tabId
                ? 'bg-dark-blue text-white shadow-lg scale-105'
                : 'hover:bg-white/40 text-gray-700 hover:text-dark-blue'
            }
            ${isMobile ? 'flex-col text-[10px] gap-1 p-2 w-full justify-center' : 'w-full'}
        `}
    >
        <div className={`transition-transform duration-300 ${activeTab === tabId && !isMobile ? 'translate-x-1' : ''}`}>
             {icon}
        </div>
        <span className={`${isMobile ? 'font-medium' : 'font-semibold'}`}>{label}</span>
        
        {/* Active Indicator Glow */}
        {activeTab === tabId && (
            <div className="absolute inset-0 bg-white/10 opacity-50 blur-md rounded-xl"></div>
        )}
    </button>
);

export default NavButton;
