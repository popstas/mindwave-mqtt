import { defineComponent, PropType, ref, toRefs, withKeys, withModifiers } from "vue";
import useStore from "@/helpers/useStore";

export default defineComponent({
  name: "CurrentMeditation",
  props: {
    cur: Object,
    mindwaveData: Object,
  },
  setup(props) {
    const store = useStore();

    const { cur, mindwaveData } = toRefs(props);

    setTimeout(() => {
      console.log('props.mindwaveData:', props.mindwaveData.value);
    }, 2000);

    return () => (
      <div class="current-meditation">
        <div>Meditation: { mindwaveData.value.meditation }</div>
        
        <div class="main-values">
          { props.mindwaveData.value.signal === 0 && props.mindwaveData.value.meditation > 0 && (
            <div v-if="" class="main-value">
              <span class="label">Meditation:</span>
              <span class="value">{ props.mindwaveData.value.meditation }</span>
            </div>
          )}
          { props.mindwaveData.value.signal === 0 && props.mindwaveData.value.attention > 0 && (
            <div class="main-value">
              <span class="label">Attention:</span>
              <span class="value">{ props.mindwaveData.value.attention }</span>
            </div>
          )}
          { props.mindwaveData.value.signal > 0 && (
            <div class="main-value">
              <span class="label">Signal loses:</span>
              <span class="value">{ Math.min(props.mindwaveData.value.signal, 100) }</span>
            </div>
          )}
        </div>
      </div>
    );
  },
});
