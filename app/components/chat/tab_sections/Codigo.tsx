import { useState } from "react";
import { ConfigMenu, EmbebidoButton, IntegracionesButton } from "../ConfigMenu";
import { StickyGrid } from "../PageContainer";
import { Card, IntegrationCard, MiniCard, MiniCardGroup } from "../common/Card";
import { useChipTabs } from "../common/ChipTabs";
import { CodeBlock } from "../common/CodeBlock";

export const Codigo = () => {
  const { currentTab, setCurrentTab } = useChipTabs("integrations");
  const { currentTab: miniCard, setCurrentTab: setMiniCard } =
    useChipTabs("sdk");

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
      {currentTab === "embed" && (
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
      )}
      {currentTab === "integrations" && (
        <article className="grid lg:grid-cols-3 grid-cols-2 gap-4 py-3">
          <IntegrationCard
            description="Conecta a tu agente a un número de WhatsApp y deja que responda los mensajes de tus clientes."
            name="Whatsapp"
            logo="/assets/chat/whatsapp.svg"
          />
          <IntegrationCard
            description="Conecta a tu agente a una página de Instagram y deja que responda los mensajes de tus clientes."
            name="Instagram"
            logo="/assets/chat/instagram.svg"
          />
          <IntegrationCard
            description="Conecta a tu agente a tu fan page y deja que responda los mensajes de tus clientes."
            name="Messenger"
            logo="/assets/chat/messenger.svg"
          />
          <IntegrationCard
            description="Deje que tu agente interactúe con sus clientes, responda a sus consultas, ayude con los pedidos y más."
            name="Shopify"
            logo="/assets/chat/shopify.svg"
          />
          <IntegrationCard
            description="Utiliza el plugin para Wordpress para agregar el widget de chat a su sitio web."
            name="Wordpress"
            logo="/assets/chat/wordpress.svg"
          />
          <IntegrationCard
            description="Conecta a tu agente a Slack, menciónalo y haz que responda cualquier mensaje."
            name="Slack"
            logo="/assets/chat/slack.svg"
          />
        </article>
      )}
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
