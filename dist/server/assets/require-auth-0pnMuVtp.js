import { jsx, Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { x as useAuth } from "./router-CH3R9Cfm.js";
function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login" });
    }
  }, [loading, session, navigate]);
  if (loading || !session) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen grid place-items-center bg-background", children: /* @__PURE__ */ jsx(Loader2, { className: "size-6 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
export {
  RequireAuth as R
};
