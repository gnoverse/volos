interface HealthBarProps {
    healthFactor: number
    projectedHealthFactor?: number
}

export function HealthBar({ healthFactor, projectedHealthFactor }: HealthBarProps) {
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
        {/* Current Health Factor Marker & Value */}
        {(() => {
          const rawHf = healthFactor;
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
              {/* Current Marker */}
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
              {/* Current Value label below marker */}
              <div
                className={`absolute text-lg font-bold ${labelColor}`}
                style={{
                  left: valueLeft,
                  top: "36px",
                  width: "36px",
                  textAlign: "center",
                }}
              >
                {healthFactor.toFixed(2)}
              </div>
            </>
          );
        })()}

        {/* Projected Health Factor Marker & Value */}
        {projectedHealthFactor !== undefined && (() => {
          const rawProjHf = projectedHealthFactor;
          const projHfNum = Math.max(1, Math.min(3, rawProjHf));
          const projMarkerPercent = ((projHfNum - 1) / 2) * 100;
          let projValueLeft = `calc(${projMarkerPercent}% - 18px)`;
          
          if (projMarkerPercent < 10) projValueLeft = "0px";
          if (projMarkerPercent > 90) projValueLeft = "calc(100% - 36px)";

          let projLabelColor = "text-red-400";
          if (projHfNum >= 2.1) projLabelColor = "text-blue-600";
          else if (projHfNum >= 1.55) projLabelColor = "text-blue-400";

          return (
            <>
              {/* Projected Marker */}
              <div
                className="absolute"
                style={{
                  left: `calc(${projMarkerPercent}% - 2px)`,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "14px",
                  background: "#fff",
                  borderRadius: "2px",
                  boxShadow: "0 0 4px #0008",
                  opacity: 0.6,
                  zIndex: 1,
                }}
              />
              {/* Projected Value label below marker */}
              <div
                className={`absolute text-lg font-bold transition-all ${projLabelColor} opacity-60`}
                style={{
                  left: projValueLeft,
                  top: "56px",
                  width: "36px",
                  textAlign: "center",
                }}
              >
                {projectedHealthFactor.toFixed(2)}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  )
} 
