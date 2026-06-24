import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Reception_dashboard from "./components/Reception_dashboard";
import Patient_dashboard from "./components/Patient_dashboard";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* DEFAULT */}
        <Route
          path="/"
          element={<Navigate to="/patient" />}
        />

        {/* PATIENT SCREEN */}
        <Route
          path="/patient"
          element={<Patient_dashboard />}
        />

        {/* RECEPTION SCREEN */}
        <Route
          path="/reception"
          element={<Reception_dashboard />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;