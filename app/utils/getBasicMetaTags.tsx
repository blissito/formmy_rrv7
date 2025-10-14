export type GetBasicMetaTagsPros = {
  title: string;
  description?: string;
  image?: string;
  twitterCard?: "summary" | "summary_large_image";
};

export default function getBasicMetaTags({
  title,
  description = "Chatbots IA y formularios de contacto para tu sitio web", // description should be at least 100 chars
  image = "https://i.imgur.com/NyaSaFn.png",
  twitterCard = "summary",
}: GetBasicMetaTagsPros) {
  if (!title) {
    return [
      {
        title: "Formmy",
      },
      {
        name: "description",
        content: "Agrega chatbots IA a tu sitio web fácilmente",
      },
    ];
  }
  return [
    { title },
    {
      property: "og:title",
      content: title,
    },
    {
      name: "description",
      content: description,
    },
    {
      property: "og:image",
      content: image,
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:url",
      content: "www.formy.app",
    },
    {
      name: "twitter:card",
      content: twitterCard,
    },
    {
      name: "twitter:image",
      content: image,
    },
  ];
}
