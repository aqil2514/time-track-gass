import { CardContainer } from "@/components/containers/card-container";
import { MainContainer } from "@/components/containers/main-container";
import { LoginForm } from "./components/login.form";

export function LoginTemplate() {
  return (
    <MainContainer className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <CardContainer
        title="Login Form"
        description="Login to enter Time Track Supervisor"
      >
        <LoginForm />
      </CardContainer>
    </MainContainer>
  );
}
