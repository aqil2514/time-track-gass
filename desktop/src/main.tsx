import ReactDOM from "react-dom/client";
import "./globals.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import HomeTemplate from "./routes/home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeTemplate />,
  },
]);

const root = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(root).render(
  <RouterProvider router={router} />,
);