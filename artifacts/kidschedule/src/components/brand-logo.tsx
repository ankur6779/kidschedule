import logoImg from "@assets/file_000000008c0c71fa81e22bfda886c9e8_1776489641690.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function BrandLogo({ size = "md", showTagline = false }: BrandLogoProps) {
  const logoSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const nameSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className="flex items-center gap-3">
      <img
        src={logoImg}
        alt="AmyNest"
        className={`${logoSize} rounded-xl object-contain shrink-0`}
        style={{ filter: "drop-shadow(0 2px 6px rgba(99,102,241,0.15))" }}
      />
      <div className="flex flex-col leading-none">
        <div className={`font-quicksand font-extrabold tracking-tight ${nameSize} flex items-baseline gap-1`}>
          <span style={{ color: "#3B82F6" }}>Amy</span>
          <span style={{ color: "#10B981" }}>Nest</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
              color: "#fff",
              letterSpacing: "0.04em",
              verticalAlign: "middle",
              lineHeight: 1,
            }}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide mt-0.5">
            Smart Parenting Powered by Amy AI
          </span>
        )}
      </div>
    </div>
  );
}
