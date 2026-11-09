import { redirect } from "next/navigation";

export default function AlunosRedirectPage() {
  redirect("/dashboard/students");
}
