import { useNavigate } from "react-router";
import { Button } from "./Button";
import { EmojiConfetti } from "./EmojiConffeti";
import Modal from "./Modal";

export default function SuccessModal() {
  const navigate = useNavigate();

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
          src="/assets/finally_pro.svg"
          alt="formmy ghost"
        />
        <img
          className="max-w-md hidden dark:block"
          src="/assets/finally-pro-dark.svg"
          alt="formmy ghost"
        />
        <h2 className="dark:text-white text-space-800 text-center text-3xl font-bold tracking-wide">
      🚀 ¡Todo listo para empezar! Tu suscripción está activa.
        </h2>
        <p className="dark:text-gray-400 text-gray-600 text-lg font-light tracking-wide max-w-2xl text-center whitespace-pre-line">
          Gracias por confiar en Formmy. Ahora puedes aprovechar al máximo todas las funcionalidades de tu plan. 🚀
        </p>
        <Button type="button" onClick={handleRedirection}>
          ¡Ya quiero empezar!
        </Button>
      </Modal>
    </>
  );
}
