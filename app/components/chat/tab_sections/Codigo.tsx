import { useState } from "react";
import { ConfigMenu, EmbebidoButton, IntegracionesButton } from "../ConfigMenu";
import { StickyGrid } from "../PageContainer";
import { Card, MiniCard, MiniCardGroup } from "../common/Card";
import { useChipTabs } from "../common/ChipTabs";
import { CodeBlock } from "../common/CodeBlock";

export const Codigo = () => {
  const { currentTab, setCurrentTab } = useChipTabs("embed");
  const { currentTab: miniCard, setCurrentTab: setMiniCard } =
    useChipTabs("sdk");

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <StickyGrid>
      <section>
        <ConfigMenu>
          <EmbebidoButton
            current={currentTab}
            onClick={() => setCurrentTab("embed")}
          />
          <IntegracionesButton
            current={currentTab}
            onClick={() => setCurrentTab("integrations")}
          />
        </ConfigMenu>
      </section>
      <section>
        <Card
          title="Embebe tu chatbot en tu sitio web"
          text={
            <div>
              <p>
                Elige la forma de embebido que más te convenga.{" "}
                <a href="#!" className="underline">
                  Más información
                </a>
              </p>
            </div>
          }
        >
          <section>
            <MiniCardGroup selectedMinicard={miniCard} onSelect={setMiniCard}>
              {miniCard === "sdk" && <SDK />}
              {miniCard === "iframe" && <Iframe />}
              {miniCard === "link" && <LinkBlock />}
            </MiniCardGroup>
          </section>
        </Card>
      </section>
    </StickyGrid>
  );
};

const LinkBlock = () => {
  const codeToCopy = `https://yourdomain.com/chatbot`;
  const instructions = [
    { step: "1", description: "Copia el código" },
    {
      step: "2",
      description: "Copialo y pégalo en el navegador",
    },
  ];
  return (
    <CodeBlock
      title="Instrucciones de configuración"
      language="Javascript"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};

const Iframe = () => {
  const codeToCopy = `<iframe src="https://yourdomain.com/chatbot" width="300" height="600"></iframe>`;
  const instructions = [
    { step: "1", description: "Copia el código" },
    {
      step: "2",
      description: "Pégalo en tu archivo index.html donde quieras",
    },
    {
      step: "3",
      description: "Haz una prueba para asegurarte de que está funcionando.",
    },
  ];
  return (
    <CodeBlock
      title="Instrucciones de configuración"
      language="Javascript"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};

const SDK = () => {
  const codeToCopy = `<script>
(function(w, d, s, o, f, js, fjs) {
  w[o] = w[o] || function() {
    (w[o].q = w[o].q || []).push(arguments);
  };
  js = d.createElement(s);
  fjs = d.getElementsByTagName(s)[0];
  js.id = o;
  js.src = f;
  js.async = 1;
  fjs.parentNode.insertBefore(js, fjs);
}(window, document, 'script', 'chatbot', 'https://cdn.yourdomain.com/chatbot.js'));
</script>`;
  const instructions = [
    { step: "1", description: "Copia el código" },
    {
      step: "2",
      description:
        "Pégalo en tu archivo index.html dentro de la etiqueta head ",
    },
    {
      step: "3",
      description: "Haz una prueba para asegurarte de que está funcionando.",
    },
  ];
  return (
    <CodeBlock
      title="Instrucciones de configuración"
      language="Javascript"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};
