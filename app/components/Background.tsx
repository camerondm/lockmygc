import { motion } from "framer-motion";

const FuturisticBackground = () => {
  const shapes = [
    { type: "circle", count: 10 },
    { type: "triangle", count: 10 },
    { type: "rectangle", count: 10 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden opacity-20">
      <svg className="w-full h-full">
        {shapes.flatMap((shape, shapeIndex) =>
          Array.from({ length: shape.count }).map((_, index) => {
            const key = `${shape.type}-${shapeIndex}-${index}`;
            const x = Math.random() * 100 + "%";
            const y = Math.random() * 100 + "%";
            const size = Math.random() * 50 + 10;

            switch (shape.type) {
              case "circle":
                return (
                  <motion.circle
                    key={key}
                    cx={x}
                    cy={y}
                    r={size / 2}
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 0.3, 0.7],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: Math.random() * 10 + 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                );
              case "triangle":
                return (
                  <motion.polygon
                    key={key}
                    points={`${x},${y} ${Number(x.slice(0, -1)) + size / 2}%,${
                      Number(y.slice(0, -1)) + size
                    }% ${Number(x.slice(0, -1)) - size / 2}%,${
                      Number(y.slice(0, -1)) + size
                    }%`}
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 0.3, 0.7],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: Math.random() * 10 + 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                );
              case "rectangle":
                return (
                  <motion.rect
                    key={key}
                    x={x}
                    y={y}
                    width={size}
                    height={size / 2}
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 0.3, 0.7],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: Math.random() * 10 + 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                );
              default:
                return null;
            }
          })
        )}
      </svg>
    </div>
  );
};

export default FuturisticBackground;
