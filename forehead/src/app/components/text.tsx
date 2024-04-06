import React, { ReactNode } from "react";

interface TextElementProps {
  children: ReactNode;
  className?: string;
}

export function Title({ children, className }: TextElementProps) {
  return (
    <h1 className={`px-3 pt-3 text-3xl font-bold ${className ?? ""}`}>
      {children}
    </h1>
  );
}

export function Heading({ children, className }: TextElementProps) {
  return (
    <h2 className={`px-3 pt-3 text-2xl font-bold ${className ?? ""}`}>
      {children}
    </h2>
  );
}

export function NumberedList({ children, className }: TextElementProps) {
  return (
    <ol className={`list-inside list-decimal text-left ${className ?? ""}`}>
      {children}
    </ol>
  );
}
