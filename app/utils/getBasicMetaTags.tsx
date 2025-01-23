export type GetBasicMetaTagsPros = {
  title: string;
  description?: string;
  image?: string;
  twitterCard?: "summary" | "summary_large_image";
};

export default function getBasicMetaTags({
  title,
  description = "Agrega formularios de contacto a tu sitio web fácilmente", // description should be at least 100 chars
  image = "https://i.imgur.com/6kgOsufh.png",
  twitterCard = "summary",
}: GetBasicMetaTagsPros) {
  if (!title) {
    return [
      {
        title: "Formmy",
      },
      {
        name: "description",
        content: "Agrega formularios de contacto a tu sitio web fácilmente",
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
      content: "formy.app",
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
