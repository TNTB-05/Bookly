export default function NavItem({ tab, label, icon, activeTab, setActiveTab, setIsMobileMenuOpen }) {
    return (
        <button
            onClick={() => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
            }}
            className={`${
                activeTab === tab
                    ? 'border-indigo-500 text-gray-900 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left sm:w-auto sm:border-l-0 sm:border-b-2 sm:p-0 sm:pb-1 sm:bg-transparent sm:m-0 transition-colors duration-200`}
        >
            <span className="sm:hidden mr-2">{icon}</span>
            {label}
        </button>
    );
}
