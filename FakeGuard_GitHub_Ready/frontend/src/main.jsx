import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import CommunityAlertForm from "./components/CommunityAlertForm.jsx";
import ChainTrace from "./components/ChainTrace.jsx";
import CreateChainRecord from "./components/CreateChainRecord.jsx";
import AddChainEvent from "./components/AddChainEvent.jsx";
import ProjectNav from "./components/ProjectNav.jsx";
import ProtectedPage from "./components/ProtectedPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ProjectNav />

      <Routes>
        <Route path="/" element={<App />} />

        <Route
          path="/community-alert"
          element={
            <ProtectedPage>
              <CommunityAlertForm />
            </ProtectedPage>
          }
        />

        <Route
          path="/create-chain-record"
          element={
            <ProtectedPage>
              <CreateChainRecord />
            </ProtectedPage>
          }
        />

        <Route
          path="/add-chain-event"
          element={
            <ProtectedPage>
              <AddChainEvent />
            </ProtectedPage>
          }
        />

        <Route path="/chain-trace" element={<ChainTrace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
