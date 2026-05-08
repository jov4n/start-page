import { useEffect, useState } from "react";
import clsx from "clsx";

export function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  function input(d: string) {
    if (reset) {
      setDisplay(d === "." ? "0." : d);
      setReset(false);
      return;
    }
    if (d === "." && display.includes(".")) return;
    setDisplay(display === "0" && d !== "." ? d : display + d);
  }

  function clear() {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setReset(false);
  }

  function pickOp(o: string) {
    if (op && prev !== null && !reset) {
      const n = compute(prev, parseFloat(display), op);
      setPrev(n);
      setDisplay(formatNumber(n));
    } else {
      setPrev(parseFloat(display));
    }
    setOp(o);
    setReset(true);
  }

  function equals() {
    if (op === null || prev === null) return;
    const n = compute(prev, parseFloat(display), op);
    setDisplay(formatNumber(n));
    setPrev(null);
    setOp(null);
    setReset(true);
  }

  function pct() {
    setDisplay(formatNumber(parseFloat(display) / 100));
  }

  function neg() {
    setDisplay(formatNumber(parseFloat(display) * -1));
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") input(e.key);
      else if (e.key === ".") input(".");
      else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") pickOp(e.key);
      else if (e.key === "Enter" || e.key === "=") equals();
      else if (e.key === "Backspace") setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      else if (e.key === "Escape") clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="h-full flex flex-col p-3 gap-3 bg-panel/40">
      <div className="flex-1 flex items-end justify-end px-4 py-3 rounded-xl bg-black/40 text-4xl font-mono tabular-nums break-all overflow-hidden">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Btn variant="muted" onClick={clear}>AC</Btn>
        <Btn variant="muted" onClick={neg}>+/−</Btn>
        <Btn variant="muted" onClick={pct}>%</Btn>
        <Btn variant="op" onClick={() => pickOp("/")} active={op === "/"}>÷</Btn>

        <Btn onClick={() => input("7")}>7</Btn>
        <Btn onClick={() => input("8")}>8</Btn>
        <Btn onClick={() => input("9")}>9</Btn>
        <Btn variant="op" onClick={() => pickOp("*")} active={op === "*"}>×</Btn>

        <Btn onClick={() => input("4")}>4</Btn>
        <Btn onClick={() => input("5")}>5</Btn>
        <Btn onClick={() => input("6")}>6</Btn>
        <Btn variant="op" onClick={() => pickOp("-")} active={op === "-"}>−</Btn>

        <Btn onClick={() => input("1")}>1</Btn>
        <Btn onClick={() => input("2")}>2</Btn>
        <Btn onClick={() => input("3")}>3</Btn>
        <Btn variant="op" onClick={() => pickOp("+")} active={op === "+"}>+</Btn>

        <Btn className="col-span-2" onClick={() => input("0")}>0</Btn>
        <Btn onClick={() => input(".")}>.</Btn>
        <Btn variant="eq" onClick={equals}>=</Btn>
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "num",
  className,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "num" | "op" | "eq" | "muted";
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-12 rounded-lg text-lg transition active:scale-95 select-none",
        variant === "num" && "bg-white/5 hover:bg-white/10",
        variant === "muted" && "bg-white/10 hover:bg-white/20 text-muted",
        variant === "op" && (active ? "bg-accent text-black" : "bg-accent/30 hover:bg-accent/40 text-accent"),
        variant === "eq" && "bg-accent text-black hover:brightness-110",
        className
      )}
    >
      {children}
    </button>
  );
}

function compute(a: number, b: number, op: string) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
    default: return b;
  }
}

function formatNumber(n: number) {
  if (!isFinite(n)) return "Error";
  const s = n.toString();
  if (s.length > 12) return n.toPrecision(10);
  return s;
}
