import { useNavigate } from "react-router";
import { Button } from "./Button";
import { EmojiConfetti } from "./EmojiConffeti";
import Modal from "./Modal";

export default function SuccessModal() {
  // const fetcher = useFetcher();
  const navigate = useNavigate();
  const handleRedirection = () => {
    navigate("/profile");
    // fetcher.submit(
    //   { intent: "google-login" },
    //   { method: "post", action: "/api/login" }
    // );
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
          ¡Felicidades! Ahora eres todo un PRO ✨
        </h2>
        <p className="dark:text-gray-400 text-gray-600 text-lg font-light  tracking-wide max-w-2xl text-center whitespace-pre-line">
          ¡Acabas de desbloquear todas las funcionalidades! <br />
          Utilizalas en todos tus formmys y mejora la experiencia de tus
          clientes. 😍
        </p>
        <Button type="button" onClick={handleRedirection}>
          ¡Ya quiero empezar!
        </Button>
      </Modal>
    </>
  );
}
