import React from "react";
import CelebrationFlip from "./CelebrationFlip";

const CelebrationExample = () => {
  return (
    <div>
      {/* Uso básico - 4000 suscriptores */}
      <CelebrationFlip />

      {/* Ejemplo personalizado - 1000 seguidores */}
      {/* 
      <CelebrationFlip 
        mainText="1000 FOLLOWERS"
        subText="THANK YOU"
        mainColor="limegreen"
        subColor="orange"
        duration={2.5}
        footerText="¡Gracias por seguirnos!"
      />
      */}

      {/* Ejemplo sin footer */}
      {/* 
      <CelebrationFlip 
        mainText="5000 LIKES"
        subText="AMAZING"
        showFooter={false}
      />
      */}
    </div>
  );
};

export default CelebrationExample;
