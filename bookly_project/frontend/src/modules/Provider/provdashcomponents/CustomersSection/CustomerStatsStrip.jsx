import UsersIcon from '../../../../icons/UsersIcon';

const CustomerStatsStrip = ({ totalCustomers, returningRate, topServices }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total customers */}
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-600 font-medium">Összes ügyfél</h3>
                        <p className="text-4xl font-bold text-dark-blue mt-2">{totalCustomers}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-dark-blue" />
                    </div>
                </div>
            </div>

            {/* Card 2: Returning rate */}
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-600 font-medium">Visszatérő arány</h3>
                        <p className="text-4xl font-bold mt-2" style={{ color: returningRate >= 50 ? '#16a34a' : returningRate >= 25 ? '#d97706' : '#dc2626' }}>
                            {returningRate}%
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Card 3: Top services */}
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-gray-600 font-medium mb-3">Legnépszerűbb szolgáltatások</h3>
                        {topServices && topServices.length > 0 ? (
                            <div className="space-y-1.5">
                                {topServices.map((svc, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <span className="text-sm text-gray-700 truncate">{svc.name}</span>
                                        <span className="text-xs font-semibold text-dark-blue whitespace-nowrap">{svc.booking_count} db</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Nincs adat</p>
                        )}
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center ml-3 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerStatsStrip;
