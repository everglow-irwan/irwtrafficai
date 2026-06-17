import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Hotspots from "@/pages/Hotspots";
import NotFound from "@/pages/not-found";
import VideoTemplate from "@/components/video/VideoTemplate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/video" component={VideoTemplate} />
      <Route path="/:rest*">
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/chat" component={Chat} />
            <Route path="/hotspots" component={Hotspots} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;