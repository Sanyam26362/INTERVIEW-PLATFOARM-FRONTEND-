import { redirect } from "next/navigation";

// /interview without sessionId redirects to dashboard
export default function InterviewIndexPage() {
  redirect("/dashboard");
}
