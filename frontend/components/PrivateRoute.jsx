import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";
import "../css/PrivateRoute.css";

const PrivateRoute = ({ pageToReturn }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    let isUserChecked = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      isUserChecked = true;
      // Kullanıcı durumu belirlendiğinde ve 1 saniye geçtikten sonra yükleme durumunu false yap
      setTimeout(() => setLoading(false), 1000);
    });

    // Eğer 5 saniye içinde kullanıcı durumu belirlenmezse, yükleme durumunu false yap
    const timeoutId = setTimeout(() => {
      if (!isUserChecked) setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [auth]);

  if (loading) {
    return (
      <div
        className="spinner-border text-primary"
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  else return pageToReturn;
};

export default PrivateRoute;