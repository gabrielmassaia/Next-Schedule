import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 640) {
  // 640px = breakpoint sm do Tailwind
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return {
    isMobile,
  };
}
