import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    if ((session.user as any).role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return <LandingPage />;
}
