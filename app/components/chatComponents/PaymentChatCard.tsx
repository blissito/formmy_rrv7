export default function PaymentChatCard() {
  return <section className="border border-outlines grid place-items-center h-svh rounded-3xl">
    <div className="w-full flex flex-row  items-center max-w-[380px] gap-4 bg-[#EDEFF3] px-2 py-3 rounded-2xl">
        <div className="flex gap-3">
        <div className="min-w-20 h-20 bg-dark p-2 rounded-lg">
             <img className="w-full h-full object-contain " src="https://www.hermesmusic.com/cdn/shop/files/Hermes_Music_logo_8ef114f2-b1f3-4abc-933e-85c40891493d.svg?v=1726882361&width=220" alt="Product" />
        </div>
     <div className=" flex flex-col">
         <h3 className="text-base font-semibold text-dark">Detalle de tu pedido</h3>
         <p className="text-xs line-clamp-2">1 Ukulele azul, 1 Ukulele tenor, 1 piano, 1 guitarra eléctrica, 1 batería</p>
          <p className="text-sm font-semibold text-dark mt-auto">Total: $29.99</p>
        </div>
        </div>
         <div className="flex justify-end items-center gap-3">
              
               <button className="bg-brand-500 text-white p-3 rounded-full text-sm">Pagar</button>
        </div>
       
    </div>
    
  </section>;
}