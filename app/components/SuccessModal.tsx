import { useNavigate } from "react-router";
import { Button } from "./Button";
import { EmojiConfetti } from "./EmojiConffeti";
import Modal from "./Modal";

type SuccessModalProps = {
  plan?: "STARTER" | "PRO" | "ENTERPRISE" | "FREE" | "TRIAL";
};

const getPlanConfig = (plan: SuccessModalProps["plan"]) => {
  switch (plan) {
    case "STARTER":
      return {
        title: "¡Felicidades! Ahora tienes el plan Starter ✨",
        description: "¡Perfecto para empezar! Ahora puedes crear tu primer chatbot con IA y aprovechar todas las herramientas para hacer crecer tu negocio. 🚀",
        image: "/assets/finally_pro.svg",
        imageDark: "/assets/finally-pro-dark.svg",
      };
    case "PRO":
      return {
        title: "¡Felicidades! Ahora eres todo un PRO ✨",
        description: "¡Acabas de desbloquear todas las funcionalidades! Utilízalas en todos tus formmys y mejora la experiencia de tus clientes. 😍",
        image: "/assets/finally_pro.svg",
        imageDark: "/assets/finally-pro-dark.svg",
      };
    case "ENTERPRISE":
      return {
        title: "¡Bienvenido al plan Enterprise! 🏢✨",
        description: "Ahora tienes acceso a chatbots ilimitados, contexto RAG sin límites y soporte prioritario. ¡Es momento de llevar tu negocio al siguiente nivel! 🚀",
        image: "/assets/finally_pro.svg",
        imageDark: "/assets/finally-pro-dark.svg",
      };
    default:
      return {
        title: "¡Felicidades! Tu compra fue exitosa ✨",
        description: "¡Gracias por confiar en Formmy! Ahora puedes aprovechar al máximo tu plan. 😍",
        image: "/assets/finally_pro.svg",
        imageDark: "/assets/finally-pro-dark.svg",
      };
  }
};

export default function SuccessModal({ plan }: SuccessModalProps) {
  const navigate = useNavigate();
  const config = getPlanConfig(plan);

  const handleRedirection = () => {
    navigate("/dashboard/plan");
  };

  return (
    <>
      <EmojiConfetti />
      <Modal
        onClose={handleRedirection}
        className="flex flex-col items-center gap-6 pb-12"
      >
        <img
          className="max-w-md dark:hidden block"
          src={config.image}
          alt="formmy ghost"
        />
        <img
          className="max-w-md hidden dark:block"
          src={config.imageDark}
          alt="formmy ghost"
        />
        <h2 className="dark:text-white text-space-800 text-center text-3xl font-bold tracking-wide">
          {config.title}
        </h2>
        <p className="dark:text-gray-400 text-gray-600 text-lg font-light tracking-wide max-w-2xl text-center whitespace-pre-line">
          {config.description}
        </p>
        <Button type="button" onClick={handleRedirection}>
          ¡Ya quiero empezar!
        </Button>
      </Modal>
    </>
  );
}
