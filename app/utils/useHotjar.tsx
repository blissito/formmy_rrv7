import { useEffect } from "react";

export default () => {
  useEffect(() => {
    // Solo cargar Hotjar en producción (HTTPS)
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      const script = document.createElement("script");
      script.innerText = `
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:3688898,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `;
      document.head.appendChild(script);
    }
  }, []);
};
