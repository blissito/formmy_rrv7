export default function ProductChatCard() {
  return <section className="border border-outlines grid place-items-center h-svh rounded-3xl">
    <div className="w-full flex flex-col items-center max-w-[300px]">
        <img className="w-32 h-32 object-cover rounded-lg mb-4 border border-outlines/50" src="https://www.hermesmusic.com/cdn/shop/files/Babilon-Electric-Bass-Guitar-Bundle-Sunburst-bass-www_hermesmusic_com-2.jpg?v=1713969009&width=700" alt="Product" />
      <h3 className="text-lg font-semibold text-dark">Formmy Chat</h3>
      <p className="text-sm text-gray-600 mt-2 text-center">Descubre cómo Formmy puede ayudarte a crear formularios profesionales en segundos.</p>
      <hr className="w-full h-1 border-outlines mt-6 mb-4" />
      <span className="text-base text-dark font-bold"> $29.99 mxn</span>
      <button className="w-fit text-sm bg-brand-500 text-white px-3 py-1 rounded-full hover:bg-brand-600 transition-colors mt-6">
        Ver más
      </button>
    </div>
  </section>;
}