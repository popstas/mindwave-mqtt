import { InjectionKey } from "vue";
import { createStore, Store } from "vuex";
import { defaultState } from "./defaultState";
import {
    MeditationDataType,
} from "@/helpers/types";

export interface State {
    meditationStart: number;
    meditationTime: number;
    history: MeditationDataType[];
}

export const key: InjectionKey<Store<State>> = Symbol("store");
export const store = createStore({
    state: defaultState,
    // mutations,
});
