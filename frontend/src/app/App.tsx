import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <div className="dark">
      <RouterProvider router={router} />
      <Toaster />
    </div>
  );
}
