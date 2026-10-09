import { Redirect } from "expo-router";

import { useAuth } from "@/auth";

export default function Index() {
  const { status } = useAuth();
  return <Redirect href={status === "signedIn" ? "/explore" : "/login"} />;
}
