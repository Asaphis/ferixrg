import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProtectedDashboard from "./pages/ProtectedDashboard";
import { AboutPage, ContactPage, FeaturesPage, HowItWorksPage, PlatformsPage, PricingPage, ResourcesPage, SolutionsPage } from "./pages/PublicPages";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/features" component={FeaturesPage} />
    <Route path="/how-it-works" component={HowItWorksPage} />
    <Route path="/solutions" component={SolutionsPage} />
    <Route path="/platforms" component={PlatformsPage} />
    <Route path="/pricing" component={PricingPage} />
    <Route path="/resources" component={ResourcesPage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/contact" component={ContactPage} />
    <Route path="/auth/:page" component={Auth} />
    <Route path="/auth" component={Auth} />
    <Route path="/app" component={ProtectedDashboard} />
    <Route path="/app/:rest*" component={ProtectedDashboard} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>;
}
