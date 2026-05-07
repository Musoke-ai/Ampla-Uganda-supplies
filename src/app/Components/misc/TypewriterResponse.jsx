import React, { useEffect, useState } from "react";

const TypewriterResponse = ({
  answer = "",
  speed = 18,
  className = "",
  animate = true,
}) => {
  const [text, setText] = useState(animate ? "" : answer);
  const [isComplete, setIsComplete] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setText(answer);
      setIsComplete(true);
      return undefined;
    }

    if (!answer) {
      setText("");
      setIsComplete(false);
      return undefined;
    }

    let index = 0;
    let stopped = false;

    setText("");
    setIsComplete(false);

    const type = () => {
      if (stopped) return;

      if (index >= answer.length) {
        setIsComplete(true);
        return;
      }

      setText(answer.slice(0, index + 1));

      const char = answer[index];
      index += 1;

      let delay = speed;
      if (char === " ") delay = Math.max(8, speed * 0.45);
      if (char === "," || char === ";") delay = Math.max(120, speed * 8);
      if (char === "." || char === "!" || char === "?") delay = Math.max(180, speed * 12);
      if (char === "\n") delay = Math.max(140, speed * 10);

      setTimeout(type, delay);
    };

    type();

    return () => {
      stopped = true;
    };
  }, [answer, animate, speed]);

  return (
    <div className={`agent-typewriter ${className}`.trim()} aria-live="polite">
      <div className="agent-typewriter-content">
        {text}
        {!isComplete ? <span className="agent-typewriter-cursor" /> : null}
      </div>
    </div>
  );
};

export default TypewriterResponse;
