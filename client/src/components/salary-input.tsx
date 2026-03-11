import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { parseSalary, formatSalary } from "@/lib/utils";

interface SalaryInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  "data-testid"?: string;
}

export function SalaryInput({ value, onChange, placeholder, "data-testid": testId }: SalaryInputProps) {
  const [display, setDisplay] = useState(formatSalary(value));

  useEffect(() => {
    setDisplay(formatSalary(value));
  }, [value]);

  return (
    <Input
      placeholder={placeholder}
      value={display}
      onChange={(e) => setDisplay(e.target.value)}
      onBlur={() => {
        const parsed = parseSalary(display);
        onChange(parsed);
        setDisplay(formatSalary(parsed));
      }}
      data-testid={testId}
    />
  );
}
