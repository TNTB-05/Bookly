import UsersIcon from '../../../../icons/UsersIcon';
import RefreshIcon from '../../../../icons/RefreshIcon';
import PresentationChartIcon from '../../../../icons/PresentationChartIcon';

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
                        <RefreshIcon className="w-6 h-6 text-green-600" />
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
                        <PresentationChartIcon className="w-6 h-6 text-purple-600" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerStatsStrip;
