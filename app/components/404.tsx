import { Link } from "react-router";

export default function NotFound() {
  return (
    <>
      <meta charSet="utf-8" />
      <main className="notFund" style={{ textAlign: "center" }}>
        <img
          style={{ width: "80%", maxWidth: "1600px", margin: "0 auto" }}
          src="/assets/404.svg"
          alt="404"
        />
        <h1 style={{ fontSize: "98px", fontFamily: "sans" }}>404 </h1>
        <p style={{ fontSize: "32px", color: "#878893", fontWeight: "400" }}>
          ¡Ups! Está página no existe
        </p>
        <Link to="/">
          <button
            style={{
              backgroundColor: "#9A99EA",
              height: "40px",
              borderRadius: "20px",
              color: "white",
              padding: "14px 24px",
              marginTop: "48px",
              fontFamily: "sans-serif",
              border: "none",
            }}
          >
            Volver al iniciow
          </button>
        </Link>
      </main>
    </>
  );
}
