import { useEffect, useState } from "react";

const MobileOnlyWrapper = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 800);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMobile) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        fontSize: "1.5rem",
        paddingLeft: "40px",
        paddingRight: "40px"
      }}>
        <div>
            <p>This web application is currently optimized for mobile view only.</p>
            <p>Please either connect with a mobile device, or if you're on a desktop, you can simulate a mobile device by enabling "Device Mode" in your browser's developer tools and selecting a mobile device from the toolbar.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default MobileOnlyWrapper;