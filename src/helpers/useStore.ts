import { useStore as baseUseStore } from "vuex";
import { key } from "../store";
import { MutationDataTypes } from "../store/mutations";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function useStore() {
    const store = baseUseStore(key);

    /*function commit<T extends keyof MutationDataTypes>(
        data: MutationDataTypes[T]
    ) {
        store.commit<MutationDataTypes[T]>(data);
    }*/

    return { /*commit,*/ state: store.state };
}
