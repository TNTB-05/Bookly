import { useState, useEffect } from 'react';
import { authApi } from '../../../auth/auth';
import { SkeletonStat, SkeletonCard, SkeletonAvatar, SkeletonText } from '../../../../components/skeletons';
import CustomerStatsStrip from './CustomerStatsStrip';
import CustomerListItem from './CustomerListItem';
import CustomerDetailDrawer from './CustomerDetailDrawer';

const CustomersSection = () => {
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, customersRes] = await Promise.all([
                authApi.get('/api/provider/calendar/customers/stats'),
                authApi.get('/api/provider/calendar/customers')
            ]);
            const statsData = await statsRes.json();
            const customersData = await customersRes.json();

            if (statsData.success) setStats(statsData.stats);
            if (customersData.success) setCustomers(customersData.customers);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Hiba történt az adatok betöltésekor');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (c.name && c.name.toLowerCase().includes(q)) || (c.email && c.email.toLowerCase().includes(q));
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-dark-blue">Ügyfelek</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => <SkeletonStat key={i} />)}
                </div>
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <SkeletonCard key={i} className="p-4">
                            <div className="flex items-center gap-4">
                                <SkeletonAvatar size="md" />
                                <div className="flex-1"><SkeletonText lines={2} /></div>
                            </div>
                        </SkeletonCard>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-dark-blue">Ügyfelek</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {/* Stats strip */}
            {stats && (
                <CustomerStatsStrip
                    totalCustomers={stats.total_customers}
                    returningRate={stats.returning_rate}
                    topServices={stats.top_services}
                />
            )}

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Keresés név vagy email alapján..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dark-blue/20 focus:border-dark-blue/30 transition-all"
                />
            </div>

            {/* Customer list */}
            <div className="space-y-3">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-40">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <p>{searchQuery ? 'Nincs találat a keresési feltételekre' : 'Még nincsenek ügyfelek'}</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer, index) => (
                        <CustomerListItem
                            key={customer.id ? `reg-${customer.id}` : `guest-${customer.email}-${index}`}
                            customer={customer}
                            onClick={() => setSelectedCustomer(customer)}
                        />
                    ))
                )}
            </div>

            {/* Detail drawer */}
            <CustomerDetailDrawer
                customer={selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
            />
        </div>
    );
};

export default CustomersSection;
