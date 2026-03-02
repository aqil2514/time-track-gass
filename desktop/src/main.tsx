import ReactDOM from "react-dom/client";
import "./globals.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import HomeTemplate from "./routes/home";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";

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

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
