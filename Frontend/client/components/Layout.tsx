import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Menu,
  X,
  GraduationCap,
  Upload,
  FileText,
  Users,
  UserCheck,
  BarChart3,
  CheckSquare,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Footer from "./Footer";
import { Button } from "@/components/ui/button";
import AicharyaAssistant from "@/components/AicharyaAssistant"; // <-- Import the assistant

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Home", href: "/", icon: GraduationCap },
  { name: "Knowledge Base", href: "/knowledge-base", icon: Upload },
  { name: "Smart Match", href: "/smart-match", icon: FileText },
  { name: "Student Profile", href: "/student-profile", icon: Users },
  { name: "Teacher Dashboard", href: "/dashboard", icon: UserCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Checker", href: "/checker", icon: CheckSquare },
];

const sidebarVariants: Variants = {
  open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  closed: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  closedMobile: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
};

const overlayVariants: Variants = {
  open: { opacity: 1, transition: { duration: 0.3 } },
  closed: { opacity: 0, transition: { duration: 0.3 } },
};

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const isMobileNow = window.innerWidth < 1024;
      setIsMobile(isMobileNow);
      if (!isMobileNow) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isMobile ? (sidebarOpen ? "open" : "closedMobile") : "open"}
        variants={sidebarVariants}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-material-lg"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-material-gray-200">
            <img
              src="../../aicharya.png"
              alt="AI-Charya Logo"
              className="h-10 w-10"
            />
            <span
              className="ml-3 text-xl font-semibold"
              style={{
                background: "linear-gradient(45deg, #4285f4 0%, #fbbc05 50%, #34a853 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI-Charya
            </span>
          </div>
          <nav className="flex-1 px-6 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <motion.li
                    key={item.name}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    variants={navItemVariants}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm",
                        isActive
                          ? "bg-material-blue text-white shadow-material"
                          : "text-material-gray-700 hover:bg-material-gray-100 hover:text-material-gray-900"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                        <item.icon
                          className={cn(
                            "mr-3 h-5 w-5 shrink-0",
                            isActive
                              ? "text-white"
                              : "text-material-gray-500 group-hover:text-material-gray-900"
                          )}
                        />
                      </motion.div>
                      {item.name}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>
          <div className="shrink-0 border-t border-material-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-material-blue flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-material-gray-900 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-material-gray-500 truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={signOut}
                className="p-1 text-material-gray-400 hover:text-material-red-500 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <header className="lg:hidden sticky top-0 z-30 bg-white shadow-material border-b border-material-gray-200">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              type="button"
              className="material-button-secondary p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-material-gray-900">
                {navigation.find((item) => item.href === location.pathname)?.name || "Educational Platform"}
              </h1>
            </div>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-material-blue flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 bg-material-gray-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransitionVariants}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {/* Floating Assistant - now imported as a standalone component*/}
      <AicharyaAssistant />

    </div>
  );
}
