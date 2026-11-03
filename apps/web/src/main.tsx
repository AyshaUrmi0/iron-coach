import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { isLoggedOutError } from "./api";
import App from "./App";
import { ME_KEY } from "./auth";
import "./index.css";

const MAX_RETRIES = 3;

const queryClient = new QueryClient({
  // A session can expire while a tab stays open. Clearing the user sends them to the login page.
  queryCache: new QueryCache({
    onError: (error) => {
      if (isLoggedOutError(error)) queryClient.setQueryData(ME_KEY, null);
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failures, error) => !isLoggedOutError(error) && failures < MAX_RETRIES,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
