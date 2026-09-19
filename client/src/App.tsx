import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import ListingDetails from "./pages/ListingDetails";
import CreateListing from "./pages/CreateListing";
import Community from "./pages/Community";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import BrandSplash from "./components/BrandSplash";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/marketplace" component={Marketplace} />
    <Route path="/listing/:id" component={ListingDetails} />
    <Route path="/sell" component={CreateListing} />
    <Route path="/community" component={Community} />
    <Route path="/favorites" component={Favorites} />
    <Route path="/messages" component={Messages} />
    <Route path="/notifications" component={Notifications} />
    <Route path="/admin" component={AdminDashboard} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><BrandSplash /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
