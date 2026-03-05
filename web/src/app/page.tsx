import { getMe } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getMe();
  if (user) redirect("dashboard");
  
  redirect("login");
}
