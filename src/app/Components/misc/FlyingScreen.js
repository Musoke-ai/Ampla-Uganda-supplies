import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaBirthdayCake } from "react-icons/fa";

const FlyingScreen = () => {
  const [cakes, setCakes] = useState([]);

  useEffect(() => {
    const newCakes = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: Math.random() * 6 + 3,
    }));
    setCakes(newCakes);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Moving cakes with green color */}
      {cakes.map((cake) => (
        <motion.div
          key={cake.id}
          className="absolute text-green-500 text-4xl"
          style={{ left: `${cake.left}%` }}
          initial={{ y: "100vh", opacity: 0 }}
          animate={{ y: "-10vh", opacity: 1 }}
          transition={{
            duration: cake.duration,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        >
          <FaBirthdayCake />
        </motion.div>
      ))}

      {/* Loading effect */}
      <div className="flex flex-col items-center z-10">
        <motion.div
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"
        />
        <p className="text-green-400 text-lg mt-4">Loading...</p>
      </div>
    </div>
  );
};

export default FlyingScreen;
