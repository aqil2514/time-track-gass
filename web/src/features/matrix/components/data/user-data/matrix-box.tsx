import React, { forwardRef } from "react"; 

export interface MatrixBoxConfig {
  intensity: number;
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  config: MatrixBoxConfig;
}

export const MatrixBox = forwardRef<HTMLDivElement, Props>(
  ({ config, ...props }, ref) => {
    const { intensity } = config;

    return (
      <div
        {...props}
        ref={ref}
        className="w-full h-9 rounded-md transition-all duration-300 border border-white/2 cursor-help"
        style={{
          backgroundColor:
            intensity === 0
              ? "#060b18"
              : `rgba(168, 85, 247, ${intensity / 12})`,
          boxShadow:
            intensity > 8
              ? `0 0 ${intensity * 1.2}px rgba(168, 85, 247, ${intensity / 20})`
              : "none",
          ...props.style,
        }}
      />
    );
  },
);

MatrixBox.displayName = "MatrixBox";
