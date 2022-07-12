import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  increment,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.8.4/firebase-firestore.js";

export class SongDB_Firebase {
  constructor() {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyAlm7Rd5GwDM3axb6fUvxYvRXRGD_ZDa7Y",
      authDomain: "my-pwa-5824a.firebaseapp.com",
      projectId: "my-pwa-5824a",
      storageBucket: "my-pwa-5824a.appspot.com",
      messagingSenderId: "321578237384",
      appId: "1:321578237384:web:7a196f17a39f0e6d1814fd",
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log("App: ", app);
    this.db = getFirestore(app);
  }

  add(title, artist) {
    const dbCollection = collection(this.db, "songs");
    return addDoc(dbCollection, {
      title: title,
      artist: artist,
      likes: 0,
    });
  }

  saveSub(sub){
    
    const dbCollection = collection(this.db, "subscriptions");
    return addDoc(dbCollection, {
      subscription: JSON.stringify(sub)
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      const dbCollection = collection(this.db, "songs");
      getDocs(dbCollection)
        .then((querySnapshot) => {
          const results = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("getAll data", doc.id, doc.data());
            results.push({
              id: doc.id,
              title: data.title,
              artist: data.artist,
              likes: data.likes,
            });
          });
          resolve(results);
        })
        .catch((error) => {
          console.log("Error: ", error);
          reject(error);
        });
    });
  }

  update(song) {
    return new Promise((resolve, reject) => {
      const dbDoc = doc(this.db, "songs", song.id);
      console.log("ID: ", song.id);
      updateDoc(dbDoc, {
        likes: increment(1),
      })
        .then(() => {
          song.likes += 1;

          console.log("then: ", song.likes);
          resolve(song);
        })
        .catch((error) => {
          console.log("Update error: ", error);
          reject(error);
        });
    });
  }

  delete(song) {
    const dbDoc = doc(this.db, "songs", song.id);
    return deleteDoc(dbDoc);
  }
}

/* IndexDB codes */

export class SongDB_IndexedDB {
  constructor() {
    console.log("creating a game db instance.");
    const request = indexedDB.open("SongDB", 1);

    request.onerror = (event) => {
      console.log("Open error", event.target.error.message);
    };
    request.onsuccess = (event) => {
      console.log("Open database success", event);
      this.db = event.target.result;
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log("update executed: ", db);
      const objectStore = db.createObjectStore("songs", {
        keyPath: "id",
      });
      objectStore.createIndex("title", "title", { unique: true });
      console.log("object store created: ", objectStore);
    };
  }

  add(title, artist) {
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction(["songs"], "readwrite")
        .objectStore("songs")
        .add({
          id: Date.now(),
          title: title,
          artist: artist,
          likes: 0,
        });
      request.onerror = (event) => {
        reject(event.target.error.message);
      };
      request.onsuccess = (event) => {
        resolve(event);
      };
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["songs"], "readwrite");
      const objectStore = transaction.objectStore("songs");
      const request = objectStore.getAll();
      request.onerror = (event) => {
        reject(event.target.error.message);
      };
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
    });
  }

  update(song) {
    song.likes += 1;
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction(["songs"], "readwrite")
        .objectStore("songs")
        .put(song);
      request.onerror = (event) => {
        reject(event.target.error.message);
        console.log("update error: ", event);
      };
      request.onsuccess = (event) => {
        resolve(song);
      };
    });
  }

  delete(song) {
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction(["songs"], "readwrite")
        .objectStore("songs")
        .delete(song.id);
      request.onerror = (event) => {
        reject(event.target.error.message);
        console.log("delete error: ", event);
      };
      request.onsuccess = (event) => {
        resolve();
      };
    });
  }
}

export default class SongDB {
  constructor() {
    console.log("New SongDB");
    this.dbOnline = new SongDB_Firebase();
    this.dbOffline = new SongDB_IndexedDB();
    this.hasSync = false;
    this.swController = null;
    this.swRegistration = null;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active && registration.sync) {
          this.hasSync = true;
          this.swController = registration.active;
          this.swRegistration = registration;
        }
      });
    }
  }
  add(title, artist) {
    if (navigator.onLine) {
      return this.dbOnline.add(title, artist);
    }
    this.swRegistration.sync.register("add-game"); 
    return this.dbOffline.add(title, artist);
  }

  saveSub(sub) {
     return this.dbOnline.saveSub(sub);
  }
}
