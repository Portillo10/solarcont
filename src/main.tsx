import ReactDOM from "react-dom/client";
import App from "./App";
import { runMigrations } from "./db/migrations";

runMigrations();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);
