import React from "react";
import Image from "next/image";

const Logo: React.FC = () => {
  return (
      <div className="flex justify-center mb-4">
          <Image src="/blink_logo.svg" alt="Galoy" width={100} height={100} />
      </div>
  );
};

export default Logo;
