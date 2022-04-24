import { computed, defineComponent, onMounted } from 'vue';
import useStore from '@/helpers/useStore';
import firebase from "firebase/compat/app";
import "firebaseui/dist/firebaseui.css";
import { getAuth } from "firebase/auth";
import useFirebaseApp from '@/helpers/useFirebaseApp';
import Profile from '@/components/Profile';

export default defineComponent({
  name: "Login",
  setup() {
    const store = useStore();
    const isLogged = computed(() => {
      return !!store.state.user;
    });

    const app = useFirebaseApp();

    onMounted(async () => {
      if (import.meta.env.SSR) return;
      const firebaseui = await import("firebaseui");
      const auth = getAuth(app);

      let ui = firebaseui.auth.AuthUI.getInstance();
      if (!ui) {
        ui = new firebaseui.auth.AuthUI(auth);
      }

      const uiConfig = {
        signInSuccessUrl: '/', // TODO: redirect
        signInFlow: "popup",
        signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID]
      };
      ui.start("#firebaseui-auth-container", uiConfig);

      // without firebaseui
      /*const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        'login_hint': 'popstas@gmail.com' // TODO: to localstorage
      });
      signInWithPopup(auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken;
          // The signed-in user info.
          const user = result.user;
          console.log("logged user:", user);
          // ...
        }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });*/
    });

    return () => (
      <div>
        <Profile></Profile>

        { !isLogged.value && <div id="firebaseui-auth-container"></div> }
      </div>
    );
  }
});