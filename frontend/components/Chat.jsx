import React from "react";
import "../css/Chat.css";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { signOut, updateProfile } from "firebase/auth";
import { database } from "../src/Config";
import { useState, useEffect } from "react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import sound from "/achive-sound-132273.mp3";

const Chat = () => {
  const navigate = useNavigate();
  const db = getFirestore();
  const currentUser = database.currentUser;

  //#region states
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const [userPhotos, setUserPhotos] = useState({});
  const [chats, setChats] = useState([]);
  const [cId, setCId] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [starredMessages, setStarredMessages] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [media, setMedia] = useState("");
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  //#endregion

  //Logout işlemi
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut(database);
      navigate("/");

      console.log("Başarıyla çıkış yapıldı");
    } catch (error) {
      console.error("Çıkış yaparken hata:", error);
    }
  };

  //Chat ekranını gösterme işlemi
  const rightDiv = document.getElementById("right");
  const showChat = async () => {
    rightDiv.style.display = "block";
  };

  //Mesaj gönderme işlemi
  const sendMessage = async (event) => {
    if (message.trim() === "" && !media) {
      alert("Enter a valid message or select a file to send.");
      return;
    }

    const { uid, email } = database.currentUser;

    let mediaUrl = "";
    if (media) {
      // Medya dosyasını Firebase Storage'a yükle
      const storage = getStorage();
      const storageRef = ref(storage, `messages/${uid}/${media.name}`);
      const uploadResult = await uploadBytes(storageRef, media);
      mediaUrl = await getDownloadURL(uploadResult.ref);
    }

    const chatDocRef = doc(db, "chats", chatId);
    const messageCollectionRef = collection(chatDocRef, "messages");

    await addDoc(messageCollectionRef, {
      text: message,
      sender: uid,
      timestamp: serverTimestamp(),
      displayName: email,
      media: mediaUrl, // Medya URL'sini mesaja ekle
    });

    playSound();

    setMessage("");
    setMedia("");
  };

  //Grup mesaj gönderme işlemi
  const sendGroupMessage = async (event) => {
    event.preventDefault();

    if (message.trim() === "") {
      alert("Enter valid message");
      return;
    }

    const { uid, email } = database.currentUser;
    const groupRef = collection(db, `groupInfo/${selectedGroup.id}/messages`);

    await addDoc(groupRef, {
      text: newMessage,
      sender: uid,
      timestamp: serverTimestamp(),
      displayName: email,
    });

    setNewMessage("");
    setMedia("");
  };

  const currentUserId = database.currentUser.uid;
  const selectedUserId = selectedUser?.uid;
  const chatId = [currentUserId, selectedUserId].sort().join("_");

  //Mesajları getirme işlemi
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      let latestTimestamp = lastMessageTimestamp;
      querySnapshot.forEach((doc) => {
        messages.push(doc.data());
        const messageTimestamp = doc.data().timestamp?.toDate().getTime();
        if (messageTimestamp > latestTimestamp) {
          latestTimestamp = messageTimestamp;
        }
      });

      if (latestTimestamp !== lastMessageTimestamp && messages.length > 0) {
        playSound(); // Yeni mesaj varsa ses çal
        setLastMessageTimestamp(latestTimestamp); // En son mesajın zaman damgasını güncelle
      }
      setMessages(messages);
    });

    return () => {
      unsub();
    };
  }, [db, chatId, lastMessageTimestamp]);

  //Kullanıcıları çekme işlemi
  useEffect(() => {
    const getUsers = async () => {
      const usersCollection = collection(db, "UsersD");
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map((doc) => doc.data());
      setUsers(userList);
      if (!searchTerm) {
        setSearchResults(userList);
      }
    };

    const handleSearch = async () => {
      const results = users.filter((user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    };

    getUsers().then(() => {
      if (searchTerm) {
        handleSearch();
      }
    });
  }, [searchTerm]);

  //Seçilen kullanıcıyı chat ekranına getirme işlemi
  const handleUserClick = (user) => {
    setSelectedUser(user);
    const currentUserId = database.currentUser.uid;
    const selectedUserId = user.uid;
    const newChatId = [currentUserId, selectedUserId].sort().join("_");
    setCId(newChatId);
    setIsGroupChat(false);
    // console.log(newChatId);
  };

  //Firebase'den kullanıcının fotoğrafının URL'sini alın
  useEffect(() => {
    const user = database.currentUser;
    if (user != null) {
      setUserPhotoURL(user.photoURL);
    }
  }, []);

  //Kullanıcıları çekme işlemi
  useEffect(() => {
    const fetchData = async () => {
      const data = await getDocs(collection(db, "UsersD"));
      setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
    fetchData();
  }, []);

  //Chat oluşturma işlemi
  const handleSelect = async () => {
    const currentUser = database.currentUser;
    const userID = selectedUser?.uid;
    const userEmail = selectedUser?.email;
    const userPhoto = selectedUser?.photoURL;

    const combinedId =
      currentUser.uid > userID
        ? currentUser.uid + userID
        : userID + currentUser.uid;
    try {
      const res = await getDoc(doc(db, "chats", combinedId));
      if (!res.exists()) {
        await setDoc(doc(db, "chats", combinedId), { messages: [] });

        await updateDoc(doc(db, "userChats", currentUser.uid), {
          [combinedId + ".userInfo"]: {
            uid: userID,
            email: userEmail,
            photoURL: userPhoto,
          },
          [combinedId + ".date"]: serverTimestamp(),
        });

        await updateDoc(doc(db, "userChats", userID), {
          [combinedId + ".userInfo"]: {
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          },
          [combinedId + ".date"]: serverTimestamp(),
        });
      }
    } catch (error) {}
  };

  //Chatleri getirme işlemi
  useEffect(() => {
    const getChats = () => {
      const currentUser = database.currentUser;
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(doc.data());
      });

      return () => {
        unsub();
      };
    };
    currentUser.uid && getChats();
  }, [currentUser.uid]);

  //Emoji seçme işlemi
  const handleEmoji = (e) => {
    setMessage((prev) => prev + e.emoji);
    setOpen(false);
  };

  //Mesajı yıldızlama işlemi
  const handleStarClick = async (message) => {
    try {
      const { uid, email } = database.currentUser;
      const starredMessagesCollectionRef = collection(db, "starredMessages");

      await addDoc(starredMessagesCollectionRef, {
        content: message.text,
        displayName: message.displayName,
        timestamp: message.timestamp,
        starredBy: email,
      });

      console.log("Message starred successfully");
    } catch (error) {
      console.error("Error starring message: ", error);
    }
  };

  // Mesajın yıldızını kaldırma işlemi
  const handleUnstarClick = async (message) => {
    try {
      const { email } = database.currentUser;
      const starredMessagesCollectionRef = collection(db, "starredMessages");
      // Yıldızlanmış mesajları bulmak için sorgu oluştur
      const q = query(
        starredMessagesCollectionRef,
        where("starredBy", "==", email),
        where("timestamp", "==", message.timestamp) // Mesajı benzersiz olarak tanımlamak için timestamp kullanılıyor
      );
      const querySnapshot = await getDocs(q);
      // Sorgu sonucunda dönen her doküman için silme işlemi gerçekleştir
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      console.log("Message unstarred successfully");
    } catch (error) {
      console.error("Error unstarring message: ", error);
    }
  };

  //Yıldızlanmış mesajları getirme işlemi
  useEffect(() => {
    const fetchStarredMessages = async () => {
      const { email } = database.currentUser;
      const starredMessagesCollectionRef = collection(db, "starredMessages");
      const q = query(
        starredMessagesCollectionRef,
        where("starredBy", "==", email)
      );
      const starredMessagesSnapshot = await getDocs(q);
      const starredMessagesList = starredMessagesSnapshot.docs.map((doc) =>
        doc.data()
      );
      setStarredMessages(starredMessagesList);
    };

    fetchStarredMessages().then(() => {
      // console.log(starredMessages);
    });
  }, []);

  //Offcanvas kullanıcıları çekme işlemi
  const OffcanvasWithUsers = () => {
    const [canvasUsers, setCanvasUsers] = useState([]);

    useEffect(() => {
      const getUsers = async () => {
        const usersCollectionRef = collection(db, "UsersD");
        const usersSnapshot = await getDocs(usersCollectionRef);
        setCanvasUsers(usersSnapshot.docs.map((doc) => doc.data()));
      };

      getUsers();
    }, []);
  };

  //checkbox işlemi
  const handleCheckboxChange = (user, isChecked) => {
    if (isChecked) {
      setSelectedUsers((prevUsers) => [...prevUsers, user]);
    } else {
      setSelectedUsers((prevUsers) =>
        prevUsers.filter((u) => u.email !== user.email)
      );
    }
  };

  //Grup oluşturma işlemi
  const handleCreateGroup = async (file) => {
    try {
      const { uid, email } = database.currentUser;
      const groupInfo = collection(db, "groupInfo");
      const membersList = [...selectedUsers.map((user) => user.email), email];

      const docRef = await addDoc(groupInfo, {
        groupName,
        createdBy: email,
        timestamp: serverTimestamp(),
        members: membersList,
        photoURL: "",
      });

      console.log("Group created successfully");

      if (file) {
        handleFileChange({ target: { files: [file] } }, docRef);
      }
      // Reset form
      setGroupName("");
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error creating group: ", error);
    }
  };

  // Grup çekme işlemi
  useEffect(() => {
    const currentUserEmail = database.currentUser.email;
    const groupInfo = collection(db, "groupInfo");

    // Mevcut kullanıcının üyesi olduğu veya oluşturduğu grupları çek
    const groupsCreatedByUserQuery = query(
      groupInfo,
      where("createdBy", "==", currentUserEmail)
    );
    const groupsUserIsMemberOfQuery = query(
      groupInfo,
      where("members", "array-contains", currentUserEmail)
    );

    const unsubscribe = onSnapshot(groupsUserIsMemberOfQuery, (snapshot) => {
      const groupsCreatedByUser = [];
      const unsubscribeCreatedBy = onSnapshot(
        groupsCreatedByUserQuery,
        (snapshotCreatedBy) => {
          groupsCreatedByUser.push(
            ...snapshotCreatedBy.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );
        }
      );

      const newGroups = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .concat(
          groupsCreatedByUser.filter(
            (group) => !newGroups.some((newGroup) => newGroup.id === group.id)
          )
        );

      setGroups(newGroups);
      return () => {
        unsubscribeCreatedBy();
      };
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  //Grupdan ayrılma işlemi
  const leaveGroup = async () => {
    const currentUserEmail = database.currentUser.email;
    const groupRef = doc(db, "groupInfo", selectedGroup.id);

    try {
      const groupDoc = await getDoc(groupRef);
      if (groupDoc.exists()) {
        const currentMembers = groupDoc.data().members;
        const newMembers = currentMembers.filter(
          (member) => member !== currentUserEmail
        );

        if (newMembers.length > 0) {
          await updateDoc(groupRef, { members: newMembers });
        } else {
          const groupMessagesRef = collection(
            db,
            `groupInfo/${selectedGroup.id}/messages`
          );
          const groupMessagesQuery = query(groupMessagesRef);
          const groupMessagesSnapshot = await getDocs(groupMessagesQuery);
          groupMessagesSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });

          await deleteDoc(groupRef);
        }
      }

      // Kullanıcı arayüzünü güncelleyin
      setSelectedGroup(null); // Grup seçimini sıfırla

      window.location.reload();
    } catch (error) {
      alert("Error leaving group: ", error);
      // Kullanıcıya hata ile ilgili bilgi ver
    }
  };

  // Kullanıcıların fotoğraflarını almak için bir fonksiyon
  const fetchUserPhotos = async (members) => {
    const userPhotosTemp = {};
    for (const member of members) {
      const userRef = doc(db, "userD", database.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        userPhotosTemp[member] = userSnap.data().photoURL;
      } else {
        console.log("No such user!");
      }
    }
    setUserPhotos(userPhotosTemp);
  };

  const fetchGroupMembers = async () => {
    if (!selectedGroup.id) return;

    const groupRef = doc(db, "groupInfo", selectedGroup.id);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
      const members = groupSnap.data().members;
      setGroupMembers(members);
      fetchUserPhotos(members); // Kullanıcı fotoğraflarını al
    } else {
      console.log("No such document!");
    }
  };

  useEffect(() => {
    fetchGroupMembers();
  }, [selectedGroup?.id]);

  //Fotoğraf değiştirme işlemi
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  //Fotoğraf yükleme işlemi
  const handleUpload = async () => {
    const storage = getStorage();
    const storageRef = ref(
      storage,
      `profilePictures/${database.currentUser.email}`
    );

    const uploadTask = uploadBytesResumable(storageRef, selectedImage);

    uploadTask.on(
      (error) => {
        console.log(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          await updateProfile(database.currentUser, {
            photoURL: downloadURL,
          });

          await setDoc(
            doc(db, "UsersD", database.currentUser.uid),
            {
              photoURL: downloadURL,
            },
            { merge: true }
          );
          setSearchResults(
            searchResults.map((user) =>
              user.uid === database.currentUser.uid
                ? { ...user, photoURL: downloadURL }
                : user
            )
          );
        });
      }
    );
  };
  const handleGroupClick = (event, group) => {
    event.preventDefault();
    setSelectedGroup(group);
    const newChatId = `group_${group.id}`;
    setCId(newChatId);
    setIsGroupChat(true);
  };

  //Grup mesajlarını getirme işlemi
  useEffect(() => {
    if (selectedGroup) {
      const groupRef = collection(db, `groupInfo/${selectedGroup.id}/messages`);
      const q = query(groupRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setGroupMessages(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });

      return unsubscribe;
    }
  }, [selectedGroup]);

  // File input change handler
  const handleFileChange = (e, docRef) => {
    const file = e.target.files[0];
    uploadFile(file, docRef);
  };
  // Media input change handler
  const handleMediaChange = (event) => {
    const file = event.target.files[0]; // Kullanıcının seçtiği ilk dosyayı al
    if (file) {
      const formData = new FormData();
      formData.append("file", file); // 'file' anahtarı ile dosyayı form verisine ekle

      // Eğer mesaj metni varsa, bu metni de form verisine ekle
      if (message.trim() !== "") {
        formData.append("message", message);
      }

      // formData'yı mesaj gönderme işlevine argüman olarak geçir
      sendMessage(formData);
    }
  };
  // Upload file to Firebase Storage
  const uploadFile = async (file, docRef) => {
    const storage = getStorage();
    const storageRef = ref(storage, `groupPhotos/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Handle the upload task progress
      },
      (error) => {
        console.error("Error uploading file: ", error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        saveGroupPhotoURL(downloadURL, docRef);
      }
    );
  };

  const saveGroupPhotoURL = async (file, docRef) => {
    const groupInfoRef = doc(db, "groupInfo", docRef.id);
    await updateDoc(groupInfoRef, {
      createdBy: database.currentUser.email,
      members: selectedUsers.map((user) => user.email),
      timestamp: serverTimestamp(),
      groupName,
      photoURL: url,
    });
  };

  const saveMessageMedia = async (file, docRef) => {
    const messageMedia = doc(db, "media", docRef.id);
    await updateDoc(messageMedia, {
      createdBy: database.currentUser.email,
      timestamp: serverTimestamp(),
      sender: database.currentUser.uid,
      photoURL: url,
    });
  };

  const addBlockedUser = async (currentUserId, blockedUserEmail) => {
    const userRef = doc(db, "blockedUsers", currentUserId);
    await setDoc(userRef, {
      blockedUsers: arrayUnion(blockedUserEmail),
      blockedBy: currentUserId,
    });
  };

  const blockUser = async (user) => {
    const blockedUserID = selectedUser?.uid;
    const blockedUserEmail = selectedUser?.email;
    const currentUserId = database.currentUser.uid;
    alert(`User blocked: Name: ${selectedUser.email}, ID: ${blockedUserID}`);
    setBlockedUsers([...blockedUsers, user]);
    addBlockedUser(currentUserId, blockedUserEmail);
  };

  const handleUnblockUser = async (userEmail) => {
    const currentUserId = database.currentUser.uid; // Assuming you have access to the current user's ID
    const userRef = doc(db, "blockedUsers", currentUserId);

    try {
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(userEmail), // Assuming blockedUsers is an array of emails. If it's an array of user IDs, use the ID instead.
      });
      // Update local state to reflect the change
      setBlockedUsers((prev) => prev.filter((email) => email !== userEmail));
    } catch (error) {
      console.error("Error unblocking user: ", error);
    }
  };

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      const currentUserId = database.currentUser.uid;
      // Since we're interested in the current user's blocked users, we use currentUserId to reference the document
      const userRef = doc(db, "blockedUsers", currentUserId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const blockedUserIds = docSnap.data().blockedUsers;
        // Here you might want to fetch more details for each blocked user by their IDs
        setBlockedUsers(blockedUserIds);
      } else {
        console.log("No such document!");
      }
    };

    fetchBlockedUsers();
  }, []);

  const filteredSearchResults = searchResults.filter(
    (user) => !blockedUsers.includes(user.email)
  );
  // alert(`Filtered search results: ${filteredSearchResults.map(user => user.email).join(", ")}`);

  useEffect(() => {
    const checkIfBlocked = async () => {
      const currentUserUid = database.currentUser.uid;
      const blockedUsersRef = collection(db, "blockedUsers");

      const q = query(
        blockedUsersRef,
        where("blockedBy", "==", currentUserUid)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Kullanıcı, başka bir kullanıcı tarafından engellenmiş
        console.log(
          "Blocked users: ",
          querySnapshot.docs[0].data().blockedUsers
        );
        console.log("Blocked by :" + querySnapshot.docs[0].data().blockedBy);
      } else {
        // Kullanıcı engellenmemiş
        console.log("Kullanıcı engellenmemiş.");
      }
    };

    checkIfBlocked();
  }, []);

  const uploadMedia = async (file, docRef) => {
    const storage = getStorage();
    const storageRef = ref(storage, `media/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Handle the upload task progress
      },
      (error) => {
        console.error("Error uploading file: ", error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        saveMessageMedia(downloadURL, docRef);
      }
    );
  };

  const playSound = () => {
    const audio = new Audio(sound);
    audio.play();
  };

  return (
    <div className="container mt-3 w-100">
      <div className="line"></div>
      <div className="card-chat">
        <div className="row">
          <div className="left col-lg-4">
            <div className="row">
              <div className="top-menu">
                <button className="profileButton" type="button">
                  <img src={userPhotoURL} alt="User avatar" />{" "}
                </button>
                <p className="user-name">{database.currentUser.email}</p>
                <i className="fa-regular fa-bell"></i>
                <i className="fa-regular fa-message"></i>
                <div className="dropdown">
                  <i
                    className="fa-solid fa-ellipsis-vertical"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  ></i>
                  <ul className="dropdown-menu">
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#offcanvasExample"
                        aria-controls="offcanvasExample"
                      >
                        New Group
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#offcanvasExample2"
                        aria-controls="offcanvasExample2"
                      >
                        Profile
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal"
                      >
                        Starred
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        Settings
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#offcanvasExample3"
                        aria-controls="offcanvasExample3"
                        href="#"
                      >
                        Blocked Users
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={(e) => handleLogout(e)}
                        className="dropdown-item"
                        href="#"
                      >
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              className="modal fade"
              id="exampleModal"
              tabIndex="-1"
              aria-labelledby="exampleModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h1 className="modal-title fs-5" id="exampleModalLabel">
                      Starred Messages
                    </h1>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    {starredMessages.map((message, index) => (
                      <p key={index}>
                        <strong>{message.displayName}</strong>:{" "}
                        {message.content}
                        <br />
                        <small>
                          {new Date(
                            message.timestamp.seconds * 1000
                          ).toLocaleString()}
                        </small>
                        <button
                          type="button"
                          onClick={() => handleUnstarClick(message)}
                          className="btn btn-secondary remove-starred"
                        >
                          X
                        </button>
                      </p>
                    ))}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="offcanvas offcanvas-start"
              tabIndex="-1"
              id="offcanvasExample3"
              aria-labelledby="offcanvasExampleLabel2"
            >
              <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="offcanvasExampleLabel2">
                  Blocked Users
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="offcanvas"
                  aria-label="Close"
                ></button>
              </div>

              <div className="offcanvas-body blocked-users-list">
                {blockedUsers.map((userEmail, index) => (
                  <div
                    key={index}
                    className="offcanvas-body blocked-users-list"
                  >
                    <p>{userEmail}</p>{" "}
                    <button
                      type="button"
                      className="btn btn-primary unblock"
                      onClick={() => handleUnblockUser(userEmail)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="offcanvas offcanvas-start"
              tabIndex="-1"
              id="offcanvasExample"
              aria-labelledby="offcanvasExampleLabel"
            >
              <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="offcanvasExampleLabel">
                  Add a participant
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="offcanvas"
                  aria-label="Close"
                ></button>
              </div>

              <div className="offcanvas-body">
                <div className="create-group-image">
                  <img src="" className="group-photo" />
                  <input
                    type="file"
                    className="group-photo-input"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="input-group mt-3 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Group Name"
                    aria-label="Username"
                    aria-describedby="basic-addon1"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                {users.map((user, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      className="canvasList"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <img
                        className="canvasPhoto"
                        src={user.photoURL}
                        alt="User avatar"
                      />{" "}
                      <p className="canvasEmail">{user.email}</p>{" "}
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value=""
                        id={`flexCheckDefault${index}`}
                        onChange={(e) =>
                          handleCheckboxChange(user, e.target.checked)
                        }
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn canvasBtn"
                  onClick={handleCreateGroup}
                >
                  Create Group
                </button>
              </div>
            </div>

            <div
              className="offcanvas offcanvas-start"
              tabIndex="-1"
              id="offcanvasExample2"
              aria-labelledby="offcanvasExampleLabel"
            >
              <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="offcanvasExampleLabel">
                  Edit Profile
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="offcanvas"
                  aria-label="Close"
                ></button>
              </div>

              <div className="offcanvas-body">
                <div className="image-edit">
                  <img
                    className="canvas-edit-profile"
                    src={database.currentUser.photoURL}
                    alt="Profile"
                  />
                </div>
                <div className="image-upload">
                  <input
                    type="file"
                    className="imageInput"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="aboutUser mt-4">
                  {database.currentUser.email}
                </div>
                <button
                  type="submit"
                  className="btn canvasBtn"
                  onClick={handleUpload}
                >
                  Save
                </button>
              </div>
            </div>

            <div className="row search mt-4">
              <form className="d-flex mb-3" role="search">
                <input
                  className="form-control me-2"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <i className="fa-solid fa-bars-staggered"></i>
              </form>
            </div>

            <div
              onClick={() => handleSelect()}
              className="row user-list"
              id="user-list"
            >
              {filteredSearchResults.map((user, index) => (
                <div
                  key={index}
                  className="user mt-3"
                  type="button"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-list-p">
                    <img src={user.photoURL} alt="User avatar" />{" "}
                  </div>
                  <div className="user-email">
                    <p>{user.email}</p>
                  </div>
                </div>
              ))}

              {groups.map((group, index) => (
                <div
                  key={index}
                  className="user mt-3"
                  type="button"
                  onClick={(event) => handleGroupClick(event, group)}
                >
                  <div className="user-list-p">
                    <img src={group.photoURL} alt="Group avatar" />{" "}
                  </div>
                  <div className="user-email">
                    <p>{group.groupName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="right col-lg-8" id="right">
            <div className="top-menu-right">
              <button className="profileButton-right mt-4" type="button">
                {isGroupChat ? (
                  <img src={selectedGroup.photoURL} alt="Group avatar" />
                ) : selectedUser ? (
                  <img src={selectedUser.photoURL} alt="User avatar" />
                ) : null}
              </button>
              <p className="user-name-right">
                {isGroupChat
                  ? selectedGroup.groupName
                  : selectedUser
                  ? selectedUser.email
                  : "No user or group selected"}
              </p>
              {selectedUser && !isGroupChat && (
                <button
                  type="submit"
                  className="btn block"
                  onClick={() => blockUser()}
                >
                  Block
                </button>
              )}
              {isGroupChat && (
                <div class="btn-group">
                  <button
                    type="button"
                    class="btn btn-primary dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Group Settings
                  </button>
                  <ul class="dropdown-menu">
                    <li>
                      <a
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal3"
                        class="dropdown-item"
                        href="#"
                      >
                        Participants
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() => leaveGroup()}
                        class="dropdown-item"
                        href="#"
                      >
                        Leave
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div
              class="modal fade"
              id="exampleModal3"
              tabindex="-1"
              aria-labelledby="exampleModalLabel"
              aria-hidden="true"
            >
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">
                      Pariticipants
                    </h1>
                    <button
                      type="button"
                      class="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <h2>Group Members</h2>
                    <ul>
                      {groupMembers.map((member, index) => (
                        <li key={index}>
                          <img
                            src={userPhotos[member]}
                            style={{ width: "50px", height: "50px" }}
                          />{" "}
                          {/* Kullanıcı fotoğrafını göster */}
                          <p>{member}</p> {/* Kullanıcı adını göster */}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div class="modal-footer">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="chatBox">
              <div className="chat-history">
                {(isGroupChat ? groupMessages : messages).map((message, id) => {
                  const messageClass =
                    message.sender === database.currentUser.uid
                      ? "sent"
                      : "received";

                  return (
                    <div
                      key={id} // Use a unique key for each message
                      className={`message ${messageClass}`}
                    >
                      <div className="message-content">
                        <div className="content-star">
                          <p className="display-name">{message.displayName}</p>
                          <p className="message-text">{message.text}</p>
                          <i
                            onClick={() => handleStarClick(message)}
                            className="fa-solid fa-star"
                          ></i>
                        </div>
                      </div>

                      <div className="message-timestamp">
                        {message.timestamp ? (
                          <>
                            {new Date(message.timestamp.toDate()).getHours()}:
                            {new Date(message.timestamp.toDate()).getMinutes() <
                            10
                              ? "0"
                              : ""}
                            {new Date(message.timestamp.toDate()).getMinutes()}
                            {messageClass === "sent" && (
                              <i className="fas fa-check"></i>
                            )}
                          </>
                        ) : (
                          <span>Timestamp not available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="row search-m mt-4">
                <form
                  onSubmit={(event) => {
                    event.preventDefault(); // Formun varsayılan gönderim işlemini engelleyin
                    // Eğer mesaj boş değilse veya bir medya dosyası seçilmişse, mesajı gönder
                    if (
                      message.trim() !== "" ||
                      document.querySelector(".message-file").files.length > 0
                    ) {
                      isGroupChat
                        ? sendGroupMessage(event)
                        : sendMessage(event);
                    }
                  }}
                  className="d-flex mb-3"
                  role="search"
                >
                  <input
                    className="form-control me-2"
                    type="text"
                    name="messageInput"
                    id="messageInput"
                    placeholder="Type your message..."
                    aria-label="Search"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setNewMessage(e.target.value);
                      // setMedia(e.target.value); // Bu satırı kaldırabilirsiniz, çünkü medya dosyası input'tan değil, file input'tan alınacak
                    }}
                  />
                  <div className="emoji">
                    <i
                      className="fa-regular fa-face-smile"
                      onClick={() => setOpen((prev) => !prev)}
                    ></i>
                    <div className="picker">
                      <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                    </div>
                  </div>
                  <i className="fa-solid fa-paperclip"></i>{" "}
                  {/* class -> className */}
                  <input
                    className="message-file"
                    type="file"
                    onChange={handleMediaChange}
                  />
                  <button className="btn btn-primary" type="submit">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
