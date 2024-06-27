import React, { useState } from "react";
import "../css/Login.css";
import { useNavigate } from "react-router-dom";
import { database } from "../src/Config";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone = e.target.phone.value;
    const email = phone + "@gmail.com";
    const password = e.target.password.value;

    try {
      await signInWithEmailAndPassword(database, email, password);
      navigate("/chat");
    } catch (error) {
      alert("Hata! Tekrar deneyiniz.");
    }
  };


  return (
    <div className="container">
      <div className="bip">
        <img src="/logo.png" alt="" />
      </div>
      <div className="cardLogin">
        <div className="row">
          <div className="col-lg-7 p-5">
            <h1 className="text-start">Giriş Yap</h1>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <form onSubmit={(e) => handleSubmit(e)}>
              <div className="mb-3">
                <label htmlFor="exampleInputEmail1" className="form-label">
                  Telefon Numaranız
                </label>
                <input
                  value={email}
                  placeholder="05991230101"
                  name="phone"
                  type="text"
                  className="form-control"
                  id="exampleInputEmail1"
                  aria-describedby="emailHelp"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">
                  Şifreniz
                </label>
                <input
                  value={password}
                  placeholder="*************"
                  name="password"
                  type="password"
                  className="form-control"
                  id="exampleInputPassword1"
                />
              </div>
              <button type="submit" className="btn btn-primary mt-3 mb-4">
                Giriş Yap
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="footer justify-content-center align-items-center d-flex mt-5">
        <p>
          © 2020 BiP İletişim Teknolojileri ve Dijital Servisler A.Ş. Tüm
          Hakları Saklıdır.
        </p>
      </div>
    </div>
  );
};

export default Login;
