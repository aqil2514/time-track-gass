import ReactDOM from "react-dom/client";
import "./globals.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import HomeTemplate from "./routes/home";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import { check } from "@tauri-apps/plugin-updater";
import { ask } from "@tauri-apps/plugin-dialog";

const router = createBrowserRouter([
  {
    path: "/",

    element: <HomeTemplate />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
]);

const root = document.getElementById("root") as HTMLElement;

async function checkUpdate() {
  try {
    const update = await check();
    console.log("Update check result:", update);
    if (update) {
      const yes = await ask(
        `Versi baru ${update.version} tersedia. Update sekarang?`,
        { title: "Update Tersedia", kind: "info" },
      );
      if (yes) {
        await update.downloadAndInstall();
      }
  }
    
  } catch (error) {
    console.error(error)
  }
}

checkUpdate();

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
