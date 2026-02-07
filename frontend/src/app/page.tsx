import React from "react";
import Link from "next/link";
const page = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <Link href="/auth" className="border-2 pt-2 pb-2 pr-2 pl-2">
        Go to auth page
      </Link>
    </div>
  );
};

export default page;
