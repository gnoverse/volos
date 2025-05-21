import { formatHealthFactor } from "@/app/utils/format.utils";

interface HealthBarProps {
  healthFactor: string
}

export function HealthBar({ healthFactor }: HealthBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center px-1">
        <span className="text-sm text-red-400">&lt; 1</span>
        <span className="text-sm text-gray-400">Health Factor</span>
        <span className="text-sm text-blue-400">3+</span>
      </div>
      <div className="relative h-10 mb-2">
        {/* Bar */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
          style={{
            background: "linear-gradient(to right, #ef4444 0%, #ef4444 20%, #3b82f6 40%, #3b82f6 60%, #2563eb 80%, #2563eb 100%)",
          }}
        />
        {/* Marker & Value */}
        {(() => {
          const rawHf = parseFloat(formatHealthFactor(healthFactor) || "0");
          const hfNum = Math.max(1, Math.min(3, rawHf));
          const markerPercent = ((hfNum - 1) / 2) * 100;
          let valueLeft = `calc(${markerPercent}% - 18px)`;
          
          if (markerPercent < 10) valueLeft = "0px";
          if (markerPercent > 90) valueLeft = "calc(100% - 36px)";

          let labelColor = "text-red-400";
          if (hfNum >= 2.1) labelColor = "text-blue-600";
          else if (hfNum >= 1.55) labelColor = "text-blue-400";

          return (
            <>
              {/* Marker */}
              <div
                className="absolute"
                style={{
                  left: `calc(${markerPercent}% - 2px)`,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "14px",
                  background: "#fff",
                  borderRadius: "2px",
                  boxShadow: "0 0 4px #0008",
                  zIndex: 2,
                }}
              />
              {/* Value label below marker */}
              <div
                className={`absolute text-lg font-bold transition-all ${labelColor}`}
                style={{
                  left: valueLeft,
                  top: "36px",
                  width: "36px",
                  textAlign: "center",
                }}
              >
                {formatHealthFactor(healthFactor)}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  )
} 