import { ElLink } from 'element-plus';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { store } from '@/store';

import useFirebaseApp from '@/helpers/useFirebaseApp';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { dbGet, dbSet } from '@/helpers/firebaseDb';

export default defineComponent({
  name: 'Profile',
  props: {},
  setup(props) {
    const app = useFirebaseApp();
    const auth = getAuth(app);
    const settingsNames = [
      'isSound',
      'halfChartTop',
      'halfChartBottom',
      'meditationZones',
      'meditationTimeMax',
      'meditationFrom',
      'fromDay',
    ]

    auth.onAuthStateChanged(user => {
      if (user) {
        console.log("logged user:", user);
        setUser(user);
        isLogged.value = true;
      } else {
        console.log("logout");
        isLogged.value = false;
        setUser(undefined);
      }
    });

    // const store = useStore();
    const isLogged = ref(false);
    const user = computed(() => store.state.user);

    // TODO: move to App?
    function syncSettings(settings?: object, settingsRef) {
      console.log('Update settings from firebase:', settings);
      if (!settings) settings = {};
      let isChanged = false;

      for (const name of settingsNames) {
        const remote = settings[name];
        const local = store.state.settings[name];
        if (remote !== undefined) {
          if (remote !== local) {
            isChanged = true;
            store.state.settings[name] = remote;
          }
        } else {
          isChanged = true;
          settings[name] = local;
        }
      }

      if (isChanged) {
        console.log("update settings:", settings);
        dbSet(settingsRef, settings);
      }
    }

    function loginPopup() {
      // without firebaseui
      const provider = new GoogleAuthProvider();
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
          console.log("logged user popup:", user);
        }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
    }

    function logout(){
      signOut(auth);
      isLogged.value = false;
      store.commit('user', undefined);
    }

    function setUser(user) {
      if (!user) {
        store.commit('user', null);
        return;
      }

      store.commit("user", {
        uid: user.uid,
        photoURL: user.photoURL,
        displayName: user.displayName,
        email: user.email,
      });

      if (!user.email) return;

      // https://firebase.google.com/docs/database/web/read-and-write
      dbGet('settings', syncSettings);
    }

    onMounted(() => {
    });

    return () => (
      <div class="profile">
        { user.value?.email && (
          <a class="profile-logout" title="Click to logout" onClick={logout} href="#">{ user.value.email }</a>
        )}
        { !isLogged.value && (
          <ElLink class="profile-login" onClick={loginPopup}>Login</ElLink>
        )}
      </div>
    );
  },
});
