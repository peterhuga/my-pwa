import SongDB from "./song-db.js";
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/my-pwa/service-worker.js", { scope: "/my-pwa/" })
    .then((registration) => {
      console.log("Success. Scope:", registration.scope);
    })
    .catch((error) => {
      console.log("Failed. Error:", error);
    });
}

const songDB = new SongDB();

const notificationButton = document.getElementById("send-button");
const form = document.getElementById("input-container");
const showButton = document.getElementById("show-button");
const outputContainer = document.getElementById("output-container");

if ("Notification" in window && "serviceWorker" in navigator) {
  const permission = Notification.permission;

  console.log("Permission is: ", permission);
  switch (permission) {
    case "granted":
      notificationButton.style.display = "none";
      //showMyNotification();
      configurePushSubscription();
      break;

    case "denied":
      form.style.display = "none";
      break;
    case "default":
      form.style.display = "none";
      break;
  }
}
notificationButton.addEventListener("click", requestUserPermission);

showButton.addEventListener("click", showMyNotification);

navigator.serviceWorker.addEventListener("message", (message) => {
  outputContainer.innerHTML = message.data;
  console.log("Message in home page is: ", message);
});

function showMyNotification() {
  const titleText = document.getElementById("title").value;
  const bodyText = document.getElementById("body").value;
  const options = {
    body: bodyText,
    icon: "/my-pwa/images/images.png",
    image: "/my-pwa/images/pwa.png",
    actions: [
      {
        action: "Agree",
        title: "Agree",
      },
      { action: "Disagree", title: "Disagree" },
    ],
  };

  if (titleText) {
    outputContainer.innerHTML = "";
    //new Notification(titleText,options);

    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(titleText, options);
    });
  } else {
    outputContainer.innerHTML = "Title can't be empty!";
  }
}

function requestUserPermission() {
  console.log("Requesting permission");
  Notification.requestPermission()
    .then((permission) => {
      console.log("User selected: ", permission);
      if (permission === "granted") {
        notificationButton.style.display = "none";
        form.style.display = "block";
        configurePushSubscription();
      }
    })
    .catch((err) => {
      console.log("error: ", err);
    });
}

function configurePushSubscription() {
  navigator.serviceWorker.ready.then((registration) => {
    const pushManager = registration.pushManager;
    
    pushManager.getSubscription().then((subscription) => {
      console.log("Current subscription is: ", subscription);
      if (subscription === null) {
        const publicKey = 'BOWrglHa-CnCeqIN9ObaWKOO9A27_R7fei-ql8d2zF2vCU9BiQAFTxQ0HikAt8hSwB4KCBW-2w1PPU44unYpk0Q';
        const options = {
          userVisibleOnly:true,
          applicationServerKey:  publicKey
        }
        pushManager.subscribe(options)
        .then((sub)=>{
          console.log("New sub: ", sub);
          console.log(JSON.stringify(sub));
          songDB.saveSub(sub)
          .then((res)=>{
            console.log("Save sub to FB: ", res);
          })
          .catch((err)=>{
            console.log("SaveSub to FB Error: ", err);
          });
        })
        .catch((err)=>{
          console.log("Error: ", err);
        });
      } else {
        console.log("There is a subscription already.");
      }
    });
  });
}
