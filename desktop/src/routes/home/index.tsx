import { useAuth } from "@/hooks/use-auth";
import { Loading } from "@/components/layout/loading";
import { Navigate } from "react-router";
import { HomeTemplate } from "./components/home.template";
import { HomeProvider } from "./store/home.provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function HomePage() {
  const { loading, user } = useAuth();

  if (loading) return <Loading />;

  if (!user) return <Navigate to={"/login"} />;

  return (
    <HomeProvider>
      <TooltipProvider>
        <HomeTemplate />
      </TooltipProvider>
    </HomeProvider>
  );

}
