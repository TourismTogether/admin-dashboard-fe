import { useEffect } from "react";
import type { ReactNode } from "react";
import { initializeSession } from "@/lib/api";

interface AuthBootstrapProps {
  children: ReactNode;
}

const AuthBootstrap: React.FC<AuthBootstrapProps> = ({ children }) => {
  useEffect(() => {
    void initializeSession();
  }, []);

  return <>{children}</>;
};

export default AuthBootstrap;
