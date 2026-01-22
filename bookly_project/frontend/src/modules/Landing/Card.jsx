export default function Card({ title, description, imageUrl }) {
    return (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-48 overflow-hidden bg-linear-to-br from-blue-50 to-white">
                <img src={imageUrl} alt={`${title}-image`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{description}</p>
            </div>
        </div>
    );
}
