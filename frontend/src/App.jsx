import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";
import AppLayout from "./layout/AppLayout";
import LivePredictionPage from "./pages/LivePrediction";
import ForecastPage from "./pages/ForecastPage";
import MultiCityScan from "./pages/MultiCityScan";
import Simulation from "./pages/Simulation";
import AreaHeatmap from "./pages/AreaHeatmap";
import Explainability from "./pages/Explainability";
import ChatAssistant from "./pages/ChatAssistant";
import CustomPredictionPage from "./pages/CustomPredictionPage";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <motion.div
                key="/"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <LivePredictionPage />
              </motion.div>
            }
          />
          <Route
            path="/forecast"
            element={
              <motion.div
                key="/forecast"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <ForecastPage />
              </motion.div>
            }
          />
          <Route
            path="/multi-city"
            element={
              <motion.div
                key="/multi-city"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <MultiCityScan />
              </motion.div>
            }
          />
          <Route
            path="/simulation"
            element={
              <motion.div
                key="/simulation"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Simulation />
              </motion.div>
            }
          />
          <Route
            path="/area-heatmap"
            element={
              <motion.div
                key="/area-heatmap"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <AreaHeatmap />
              </motion.div>
            }
          />
          <Route
            path="/explainability"
            element={
              <motion.div
                key="/explainability"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Explainability />
              </motion.div>
            }
          />
          <Route
            path="/chat"
            element={
              <motion.div
                key="/chat"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <ChatAssistant />
              </motion.div>
            }
          />
          <Route
            path="/custom"
            element={
              <motion.div
                key="/custom"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <CustomPredictionPage />
              </motion.div>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="appBackground">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}
