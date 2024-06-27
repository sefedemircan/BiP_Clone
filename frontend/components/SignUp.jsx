import React, { useState } from "react";
import "../css/SignUp.css";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { database } from "../src/Config";

const SignUp = () => {
  const navigate = useNavigate();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone = e.target.phone.value;
    const email = `${phone}@gmail.com`;
    const password = e.target.password.value;

    try {
      const userCredential = await createUserWithEmailAndPassword(database, email, password);
      const user = userCredential.user;

      if (selectedImage) {
        const storage = getStorage();
        const storageRef = ref(storage, `profilePictures/${user.email}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedImage);

        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.error("Upload error:", error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              await updateProfile(user, {
                photoURL: downloadURL,
              });
              await setDoc(doc(db, "UsersD", user.uid), {
                email: user.email,
                uid: user.uid,
                photoURL: downloadURL,
              });
              await setDoc(doc(db, "userChats", user.uid), {});
              alert("Kayıt başarılı!");
              navigate("/login");
            } catch (error) {
              console.error("Error updating profile or setting document:", error);
              alert("Profil güncelleme veya veri ekleme sırasında bir hata oluştu.");
            }
          }
        );
      } else {
        alert("Lütfen bir fotoğraf seçin.");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Girdiğiniz telefon numarası kullanılmaktadır!");
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  return (
    <div className="container">
      <div className="bip">
        <img src="/logo.png" alt="" />
      </div>
      <div className="card-signup">
        <div className="row">
          <div className="col-lg-7 p-5">
            <h1 className="text-start">Kayıt Ol</h1>
          </div>

          <div className="col-lg-5 p-5">
            <h1 className="text-start">Fotoğraf Seçiniz</h1>
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
                  placeholder="*************"
                  name="password"
                  type="password"
                  className="form-control"
                  id="exampleInputPassword1"
                />
              </div>
              <button type="submit" className="btn btn-primary mt-3 mb-4">
                Kayıt Ol
              </button>
            </form>
          </div>

          <div className="col-lg-6 text-center image-upload">
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/png, image/jpeg"
              className="form-control"
              onChange={handleImageChange}
            />
            {selectedImage && (
              <img
                className="preview-image"
                src={URL.createObjectURL(selectedImage)}
                alt="Selected"
                style={{
                  width: "150px",
                  height: "150px",
                  position: "relative",
                  right: "16rem",
                  top: "-9.5rem",
                  borderRadius: "50%",
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="footer justify-content-center align-items-center d-flex mt-5">
        <p>
          © 2020 BiP İletişim Teknolojileri ve Dijital Servisler A.Ş. Tüm Hakları Saklıdır.
        </p>
      </div>
    </div>
  );
};

export default SignUp;
