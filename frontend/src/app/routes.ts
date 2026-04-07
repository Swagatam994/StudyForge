import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { UploadPage } from "./pages/UploadPage";
import { SummaryPage } from "./pages/SummaryPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { QuizPage } from "./pages/QuizPage";
import { ResearchPaperPage } from "./pages/ResearchPaperPage";
import { WeakAnalysisPage } from "./pages/WeakAnalysisPage";
import { AuthPage } from "./pages/AuthPage";
import Dashboard from "../pages/Dashboard";
import CognitivePage from "../pages/CognitivePage";
import StudyPlanPage from "../pages/StudyPlanPage";
import { Navigate, Outlet } from "react-router";
export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: UploadPage },
      { path: "summary", Component: SummaryPage },
      { path: "flashcards", Component: FlashcardsPage },
      { path: "quiz", Component: QuizPage },
      { path: "dashboard", Component: Dashboard },
      { path: "cognitive", Component: CognitivePage },
      { path: "study-plan", Component: StudyPlanPage },
      { path: "research-paper", Component: ResearchPaperPage },
      { path: "weak-analysis", Component: WeakAnalysisPage },
    ],
  },
]);

