import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <div className="min-h-screen flexitems-center justify-center bg-gray-100">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-primary-600">
                  Wifi Voucher System
                </h1>
                <p className="text-gray-600 mt-2">Login page(coming soon)</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
