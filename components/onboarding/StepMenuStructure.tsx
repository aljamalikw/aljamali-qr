"use client";

import { useState } from "react";
import { StepCategories } from "./StepCategories";
import { StepMenuItems } from "./StepMenuItems";

interface StepMenuStructureProps {
  onBack: () => void;
  onContinue: () => Promise<void>;
}

export function StepMenuStructure({
  onBack,
  onContinue,
}: StepMenuStructureProps) {
  const [phase, setPhase] = useState<"categories" | "items">("categories");

  if (phase === "categories") {
    return (
      <StepCategories
        onBack={onBack}
        onContinue={async () => setPhase("items")}
      />
    );
  }

  return (
    <StepMenuItems
      onBack={() => setPhase("categories")}
      onContinue={onContinue}
      onSkip={onContinue}
    />
  );
}
