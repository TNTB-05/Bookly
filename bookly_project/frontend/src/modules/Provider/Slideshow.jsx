import { useState, useEffect, useCallback } from 'react';

const testimonials = [
    {
        quote: 'A Bookly-val 40%-kal csökkent az üres időpontjaim száma. Az ügyfelek maguktól foglalnak — nekem csak a munkára kell koncentrálnom.',
        name: 'Kovács Éva',
        role: 'Fodrász, Budapest',
        initials: 'KÉ'
    },
    {
        quote: 'Korábban naponta egy órát töltöttem telefonálással és időpont-egyeztetéssel. Most ez teljesen automatikus. Ajánlom minden kollégámnak.',
        name: 'Tóth Márton',
        role: 'Körmös szalon tulajdonos, Debrecen',
        initials: 'TM'
    },
    {
        quote: 'Az első héten három új ügyfelem volt a Bookly-on keresztül. Egyszerű a kezelés, és az ügyfelek is imádják.',
        name: 'Szabó Petra',
        role: 'Kozmetikus, Győr',
        initials: 'SP'
    }
];

export default function Slideshow() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, []);

    useEffect(() => {
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    return (
        <section className="bg-dark-blue text-white py-16 sm:py-20">
            <div className="max-w-4xl mx-auto px-6">
                <div className="relative">
                    <div className="text-8xl font-serif text-white/10 text-center leading-none select-none" aria-hidden="true">
                        &ldquo;
                    </div>

                    <div className="relative min-h-[200px]">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className={`transition-opacity duration-700 ${
                                    index === currentIndex ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'
                                }`}
                            >
                                <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed italic text-center">
                                    {testimonial.quote}
                                </p>

                                <div className="w-12 h-0.5 bg-accent-blue mx-auto my-6"></div>

                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-accent-blue/20 border-2 border-accent-blue/40 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                        {testimonial.initials}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{testimonial.name}</p>
                                        <p className="text-sm text-white/60">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-10">
                        {testimonials.map((_, dotIndex) => (
                            <button
                                key={dotIndex}
                                onClick={() => setCurrentIndex(dotIndex)}
                                className={`transition-all duration-300 rounded-full ${
                                    dotIndex === currentIndex ? 'w-8 h-1.5 bg-accent-blue' : 'w-1.5 h-1.5 bg-white/30'
                                }`}
                                aria-label={`${dotIndex + 1}. vélemény`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
