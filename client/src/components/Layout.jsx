import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ServerStatusChecker from "./ServerStatusChecker";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ServerStatusChecker>{children}</ServerStatusChecker>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;