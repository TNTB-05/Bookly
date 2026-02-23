import { useState, useRef } from 'react';
import SalonCard from '../SalonCard';
import LeftArrowIcon from '../../../../icons/LeftArrowIcon';
import RightArrowIcon from '../../../../icons/RightArrowIcon';

// Kiemelt szalonok tab - legjobban értékelt szalonok
export default function FeaturedSalonsTab({
    topRatedSalons,
    savedSalonIds,
    toggleSaveSalon,
    loadTopRatedSalons
}) {
    const [showAll, setShowAll] = useState(false);
    const [salonLimit, setSalonLimit] = useState(12);
    const carouselRef = useRef(null);

    function scrollCarousel(direction) {
        if (carouselRef.current) {
            const cardWidth = 320;
            const gap = 24;
            const scrollAmount = cardWidth + gap;
            const newScrollPosition = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            carouselRef.current.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth'
            });
        }
    }

    function handleLoadMore() {
        const newLimit = salonLimit + 12;
        setSalonLimit(newLimit);
        loadTopRatedSalons(newLimit);
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-dark-blue">Kiemelt szalonok</h1>
                    <p className="text-gray-600 mt-1">A legjobban értékelt partnereink</p>
                </div>
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-dark-blue font-medium hover:text-blue-800 flex items-center transition-colors"
                >
                    {showAll ? 'Kevesebb mutatása' : 'Összes megtekintése'}
                    <RightArrowIcon />
                </button>
            </div>

            {!showAll ? (
                /* Carousel view */
                <div className="relative group">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scrollCarousel('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Scroll left"
                    >
                        <LeftArrowIcon />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scrollCarousel('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Scroll right"
                    >
                        <RightArrowIcon />
                    </button>

                    <div ref={carouselRef} className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
                            {topRatedSalons.map((salon) => (
                                <div key={salon.id} className="shrink-0 w-80">
                                    <SalonCard
                                        salon={salon}
                                        savedSalonIds={savedSalonIds}
                                        toggleSaveSalon={toggleSaveSalon}
                                        showDistance={false}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Grid view */
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topRatedSalons.map((salon) => (
                            <SalonCard
                                key={salon.id}
                                salon={salon}
                                savedSalonIds={savedSalonIds}
                                toggleSaveSalon={toggleSaveSalon}
                                showDistance={false}
                            />
                        ))}
                    </div>
                    {topRatedSalons.length >= salonLimit && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={handleLoadMore}
                                className="px-8 py-3 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
                            >
                                Még több mutatása
                            </button>
                        </div>
                    )}
                </>
            )}

            {topRatedSalons.length === 0 && (
                <div className="text-center py-12 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                    <p className="text-gray-500">Szalonok betöltése...</p>
                </div>
            )}
        </div>
    );
}
