import { getMe } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getMe();
  if (user) redirect("dashboard");
  
  redirect("login");
}
