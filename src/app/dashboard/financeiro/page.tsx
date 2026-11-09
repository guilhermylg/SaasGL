import { redirect } from "next/navigation";

export default function FinanceiroRedirectPage() {
  redirect("/dashboard/payments");
}
