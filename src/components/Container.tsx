import { type ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        {children}
      </div>
    </div>
  );
}

export default Container