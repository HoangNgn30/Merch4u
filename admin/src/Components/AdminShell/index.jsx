import React, { useContext } from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import { MyContext } from "../../App";
import AdminAIChatBot from "../AdminAIChatBot";

const AdminShell = ({ children }) => {
  const { isSidebarOpen, windowWidth } = useContext(MyContext);

  return (
    <section className="main min-h-screen">
      <Header />
      <div className="contentMain flex w-full min-w-0">
        <div
          className="sidebarWrapper flex-shrink-0 transition-all duration-200 ease-out"
          style={{
            width:
              !isSidebarOpen
                ? 0
                : windowWidth < 992
                  ? 0
                  : "clamp(200px, 20vw, 300px)",
            maxWidth: !isSidebarOpen || windowWidth < 992 ? 0 : 300,
            opacity: !isSidebarOpen ? 0 : 1,
            visibility: !isSidebarOpen ? "hidden" : "visible",
            overflow: "hidden",
          }}
        >
          <Sidebar />
        </div>
        <div className="contentRight py-3 px-3 sm:py-4 sm:px-5 flex-1 min-w-0 overflow-x-auto transition-all duration-200">
          {children}
        </div>
      </div>
      <AdminAIChatBot />
    </section>
  );
};

export default AdminShell;
