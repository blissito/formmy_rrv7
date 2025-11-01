import React from "react";

export const useStripe = () => {
  const [isFetching, setIsFetching] = React.useState(false);
  const redirectToCheckout = async () => {
    setIsFetching(true);
    const body = new FormData();
    body.set("intent", "get_stripe_checkout"); // API
    const response = await fetch("/api/stripe", {
      method: "post",
      body,
    });
    const url = await response.text();
    setIsFetching(false);
    if (!url) return url;

    const a = document.createElement("a");
    a.href = url;
    a.click();
  };
  return { redirectToCheckout, isFetching };
};
