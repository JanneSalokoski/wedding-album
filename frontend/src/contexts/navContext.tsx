import { createContext, useContext, useState } from "react";

type NavCtx = {
  order: number[];                 // array of photo IDs in current grid order
  setOrder: (ids: number[]) => void;
  currentId: number | undefined;
  setCurrentId: (id: number) => void;
  nextId: () => number | undefined;
  prevId: () => number | undefined;
}

const Ctx = createContext<NavCtx | null>(null);

export const useGalleryNav = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGalleryNav must be inside GalleryNavProvider");
  return v;
};

export function GalleryNavProvider({ children }: { children: React.ReactNode }) {

  const [order, setOrder] = useState<number[]>([]);
  const [currentId, setCurrentId] = useState<number | undefined>(undefined);

  const length = order.length;

  function nextId() {
    if (currentId && currentId < length && currentId > 0) {
      return currentId + 1;
    }
  }

  function prevId() {
    if (currentId && currentId < length && currentId > 0) {
      return currentId - 1;
    }
  }

  return (
    <Ctx.Provider
      value={{
        order,
        setOrder,
        currentId,
        setCurrentId,
        nextId,
        prevId,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
