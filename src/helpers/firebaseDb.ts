import useFirebaseApp from '@/helpers/useFirebaseApp';
import { getDatabase } from 'firebase/database';
import { store } from '@/store';
import { ref, set, get, remove, DatabaseReference } from '@firebase/database';

const app = useFirebaseApp();
const db = getDatabase(app);

export function dbGet(path: string, onData: (data?: {}, dbRef?: DatabaseReference) => void) {
  if (!store.state.user) {
    onData();
    return undefined;
  }

  const dbRef = ref(db, `users/${store.state.user.uid}/${path}`);
  get(dbRef).then(snapshot => {
    const data = snapshot.val();
    if (data) {
      onData(data, dbRef);
    }
  });
}

export function dbSet(path: string | DatabaseReference, data: {}) {
  return new Promise((resolve, reject) => {
    if (!store.state.user) {
      return reject();
    }

    const dbRef = typeof path === 'string' ?
      ref(db, `users/${store.state.user.uid}/${path}`) :
      path;
    return set(dbRef, data);
  });
}

export function dbRemove(path: string | DatabaseReference) {
  if (!store.state.user) {
    return undefined;
  }

  const dbRef = typeof path === 'string' ?
    ref(db, `users/${store.state.user.uid}/${path}`) :
    path;
  return remove(dbRef);
}
