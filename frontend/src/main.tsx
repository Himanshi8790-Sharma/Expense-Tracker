import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.tsx";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🔥 create client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* ✅ WRAP HERE */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);