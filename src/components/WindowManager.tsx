import { AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store";
import { Window } from "./Window";

export function WindowManager() {
  // IMPORTANT: return an array of primitive strings, not objects. `useShallow`
  // compares array elements with `Object.is`; fresh object literals would
  // never compare equal and would loop the store snapshot.
  const ids = useStore(
    useShallow((s) =>
      s.windows.filter((w) => w.workspace === s.workspace).map((w) => w.id)
    )
  );
  const workspace = useStore((s) => s.workspace);

  return (
    <div className="absolute inset-0 pointer-events-none" key={workspace}>
      <AnimatePresence>
        {ids.map((id) => (
          <Window key={id} id={id} />
        ))}
      </AnimatePresence>
    </div>
  );
}
