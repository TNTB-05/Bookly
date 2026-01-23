import { useState, useEffect, useCallback } from 'react';

const placeholderImages = [
    "https://placehold.co/1200x400/0A8CBA/white?text=Slide+1",
    "https://placehold.co/1200x400/7DE1F4/darkblue?text=Slide+2",
    "https://placehold.co/1200x400/E0F7FA/darkblue?text=Slide+3"
];

export default function Slideshow() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const prevSlide = useCallback(() => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? placeholderImages.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    }, [currentIndex]);

    const nextSlide = useCallback(() => {
        const isLastSlide = currentIndex === placeholderImages.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex]);

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    return (
        <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] relative group overflow-hidden">
            {placeholderImages.map((url, index) => (
                <div
                    key={index}
                    style={{ backgroundImage: `url(${url})` }}
                    className={`absolute inset-0 w-full h-full bg-center bg-cover transition-opacity duration-700 ease-in-out ${
                        index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                ></div>
            ))}
            
            {/* Left Arrow */}
            <div className="hidden group-hover:block absolute top-[50%] -translate-x-0 translate-y-[-50%] left-8 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer hover:bg-black/40 transition-colors z-20">
                <button onClick={prevSlide} className="w-8 h-8 flex items-center justify-center">
                    &#10094;
                </button>
            </div>
            
            {/* Right Arrow */}
            <div className="hidden group-hover:block absolute top-[50%] -translate-x-0 translate-y-[-50%] right-8 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer hover:bg-black/40 transition-colors z-20">
                <button onClick={nextSlide} className="w-8 h-8 flex items-center justify-center">
                    &#10095;
                </button>
            </div>
            
            {/* Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center py-2 gap-2 z-20">
                {placeholderImages.map((_, slideIndex) => (
                    <div
                        key={slideIndex}
                        onClick={() => goToSlide(slideIndex)}
                        className={`text-2xl cursor-pointer transition-colors drop-shadow-md ${
                            currentIndex === slideIndex ? 'text-white' : 'text-white/50'
                        }`}
                    >
                        &#8226;
                    </div>
                ))}
            </div>
        </div>
    );
}
