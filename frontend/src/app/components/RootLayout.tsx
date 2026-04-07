import { Outlet, NavLink } from "react-router";
import { 
  Upload, 
  FileText, 
  Brain, 
  ClipboardList, 
  BarChart3,
  GraduationCap, 
  TrendingDown,
  User,
  Bell,
  Search,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/", label: "Upload", icon: Upload, exact: true },
  { path: "/summary", label: "Summary", icon: FileText },
  { path: "/flashcards", label: "Flashcards", icon: Brain },
  { path: "/quiz", label: "Quiz", icon: ClipboardList },
  // { path: "/research-paper", label: "Research Paper", icon: GraduationCap },
  { path: "/weak-analysis", label: "Weak Analysis", icon: TrendingDown },
];

export function RootLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("No email");

  useEffect(() => {
    const raw = localStorage.getItem("studyforge_auth");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { user?: { name?: string; email?: string } };
      setUserName(parsed.user?.name || "User");
      setUserEmail(parsed.user?.email || "No email");
    } catch {
      setUserName("User");
      setUserEmail("No email");
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-sidebar backdrop-blur-xl">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
                StudyForge
              </h1>
              <p className="text-xs text-muted-foreground">AI Learning Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-[#6366f1]/20 to-[#3b82f6]/20 text-white shadow-lg shadow-[#6366f1]/10"
                    : "text-slate-300 hover:text-white hover:bg-accent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/20 to-[#3b82f6]/20 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? "text-[#6366f1]" : ""}`} />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute right-0 w-1 h-8 bg-gradient-to-b from-[#6366f1] to-[#3b82f6] rounded-l-full"
                      layoutId="activeIndicator"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#6366f1]/10 to-[#3b82f6]/10 border border-[#6366f1]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse" />
              <p className="text-sm font-medium">Pro Plan</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Unlimited AI generations
            </p>
            <button className="w-full px-4 py-2 text-sm bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white rounded-lg hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card border border-border/50 backdrop-blur-xl"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border/50 z-40 flex flex-col backdrop-blur-xl"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
                      StudyForge
                    </h1>
                    <p className="text-xs text-muted-foreground">AI Learning Platform</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-[#6366f1]/20 to-[#3b82f6]/20 text-white"
                          : "text-slate-300 hover:text-white hover:bg-accent"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-accent transition-all duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#6366f1] rounded-full" />
            </button>
            <div className="w-px h-6 bg-border/50" />
            <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent transition-all duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#3b82f6] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-slate-300">{userEmail}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
