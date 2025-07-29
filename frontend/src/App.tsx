import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Flashcards from "./pages/Flashcards";
import Challenges from "./pages/Challenges";
import ChallengeHome from "./pages/ChallengeHome";
import ChallengeSelector from "./pages/ChallengeSelector";
import ChallengeWorkspace from "./pages/ChallengeWorkspace";
import Tutor from "./pages/Tutor";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="flashcards" element={<Flashcards />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="challenges/home" element={<ChallengeHome />} />
            <Route path="challenges/new" element={<ChallengeSelector />} />
            <Route path="challenges/workspace" element={<ChallengeWorkspace />} />
            <Route path="tutor" element={<Tutor />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
