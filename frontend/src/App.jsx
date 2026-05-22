import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./router";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/theme.css";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Navbar />
        <main className="app-container">
          <AppRoutes />
        </main>
      </Router>
    </ErrorBoundary>
  );
}
