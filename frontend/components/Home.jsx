import React from "react";
import "../src/App.css"
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="bip">
        <img src="/logo.png" alt="" />
      </div>
      <div className="card">
        <div className="row">
          <div className="col-lg-7 p-5">
            <h1 className="text-start">
              Hızlı, güvenli ve eğlenceli <br /> mesajlaşmaya başlamak için;
            </h1>

            <div className="num mt-4">
              <p className="no">1</p>
              <p className="text">
                Cihazınızdan <strong>BiP'i</strong> açın, yüklü değilse yükleyin
              </p>
            </div>

            <div className="mobileButtons">
              <button className="mobile">
                <i className="fa-brands fa-android"></i>
                <span>Android</span>
              </button>
              <button className="mobile">
                <i className="fa-brands fa-apple"></i>
                <span>iOS</span>
              </button>
              <button className="mobile">
                <i className="fa-brands fa-windows"></i>
                <span>Windows</span>
              </button>
            </div>

            <div className="num">
              <p className="no">2</p>
              <p className="text">
                <i className="fa-solid fa-bars"></i>
                <strong> Daha Fazla</strong> simgesine dokunun ve BiP Web’i
                seçin.
              </p>
            </div>

            <div className="num">
              <p className="no">3</p>
              <p className="text">
                Sağdaki <strong>QR</strong> kodu <strong>BiP</strong> mobil
                uygulamasından okutun.
              </p>
            </div>
          </div>

          <div className="qr col-lg-5">
            <img src="/QR.png" alt="" />
          </div>
        </div>

        <div className="phone-text justify-content-center align-items-center d-flex">
          <div className="login-signup">
            
              <button
                type="submit"
                onClick={() => navigate("login")}
                className="home-btn-1 btn btn-primary mt-3 mb-4"
              >
                Giriş Yap
              </button>
            
              <button
                type="submit"
                onClick={() => navigate("signup")}
                className="home-btn-2 btn btn-primary mt-3 mb-4"
              >
                Kayıt Ol
              </button>
            
          </div>
        </div>

        <div className="video mb-5 justify-content-center align-items-center d-flex">
          <div className="row">
            <div className="col-lg-12">
              <video
                src="/video.mp4"
                width="500px"
                height="300px"
                controls="controls"
                type="video/mp4"
                title="Başla"
              ></video>
            </div>
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

export default Home;
