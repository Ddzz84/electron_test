import React from "react";
import ReactDOM from "react-dom/client";
import { StoreProvider } from "@/components/store/contextStore";
import App from "./App";
import "./samples/node-api";
import "./assets/app.css";
import "./assets/index.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <StoreProvider>
        <App />
    </StoreProvider>
);

postMessage({ payload: "removeLoading" }, "*");
