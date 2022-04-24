import { ElLink } from 'element-plus';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { store } from '@/store';
import firebase from 'firebase/compat';

import useFirebaseApp from '@/helpers/useFirebaseApp';
import { getDatabase, onValue } from 'firebase/database';
import { ref as dbref, set } from '@firebase/database';
import { getAuth } from 'firebase/auth';

export default defineComponent({
  name: 'Profile',
  props: {},
  setup(props) {
    const app = useFirebaseApp();
    const auth = getAuth(app);
    const db = getDatabase(app);
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
    function syncData(data, dataRef) {
      if (!data.settings) data.settings = {};
      let isChanged = false;

      for (const name of settingsNames) {
        const remote = data.settings[name];
        const local = store.state[name];
        if (remote !== undefined) {
          if (remote !== local) {
            isChanged = true;
            store.commit(name, remote);
          }
        } else {
          isChanged = true;
          data.settings[name] = local;
        }
      }

      if (isChanged) {
        console.log("update data:", data);
        set(dataRef, data);
      }
    }

    function logout(){
      firebase.auth().signOut();
      isLogged.value = false;
      store.dispatch('user', undefined);
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
      const dataRef = dbref(db, "users/" + store.state.user.uid);
      onValue(dataRef, snapshot => {
        const data = snapshot.val();
        if (data) {
          console.log('Update data from firebase');
          syncData(data, dataRef);
        }
      });
    }

    onMounted(() => {
    });

    return () => (
      <div class="profile">
        { user.value?.email && (
          <a class="profile-logout" title="Click to logout" onClick={logout} href="#">{ user.value.email }</a>
        )}
        { !isLogged.value && (
          <ElLink class="profile-login" href="/login">Login</ElLink>
        )}
      </div>
    );
  },
});
