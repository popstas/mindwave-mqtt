import { initializeApp } from 'firebase/app';

// https://console.firebase.google.com/u/1/project/mindwave-web/settings/general/web:YmUzODEwNzEtOWNmOC00NjZiLWFhMTYtZjc2NDA3ZTQwZTAx?hl=ru
export default function useFirebaseApp() {
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyD0i84ewwfjn8OTmkcoFYhwdo2fDGquwNo",
    authDomain: "mindwave-web.firebaseapp.com",
    projectId: "mindwave-web",
    storageBucket: "mindwave-web.appspot.com",
    messagingSenderId: "478356403956",
    appId: "1:478356403956:web:90860a12d7ea90480a10a1",
    measurementId: "G-YJ8MXR825S"
  };
  // const analytics = getAnalytics(app);
  return initializeApp(firebaseConfig);
}
