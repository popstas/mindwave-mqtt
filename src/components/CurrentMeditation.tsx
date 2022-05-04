import { defineComponent, PropType, toRefs } from "vue";
import { MeditationType } from '@/helpers/types';
import ValueStats from "@/components/ValueStats";
import MeditationChart from "@/components/MeditationChart";
import { mmss } from "@/helpers/utils";
import { ElInput } from "element-plus"
import styles from "@/styles/components/CurrentMeditation.module.scss";

export default defineComponent({
  name: "CurrentMeditation",
  props: {
    id: String,
    cur: { type: Object as PropType<MeditationType>, required: true },
    mindwaveData: Object,
  },
  setup(props) {
    const { cur, mindwaveData } = toRefs(props);

    function meditationNameWidth() {
      const padding = 3; // paddings and close button
      const width = (cur.value?.name.length + 1) * 8 + padding;
      return Math.max(50, width);
    }

    // computed
    /* const meditationNameWidth = computed(() => {
      const padding = 3; // paddings and close button
      const width = (cur.meditationName.length + 1) * 8 + padding;
      return Math.max(50, width);
    }); */


    return () => (
      <div class={styles.currentMeditation}>
        <div class={styles.mainValues}>
          { props.mindwaveData?.value.signal === 0 && props.mindwaveData?.value.meditation > 0 && (
            <div class={styles.mainValue}>
              <span class={styles.label}>Meditation:</span>
              <span class={styles.value}>{ props.mindwaveData?.value.meditation }</span>
            </div>
          )}
          { props.mindwaveData?.value.signal === 0 && props.mindwaveData?.value.attention > 0 && (
            <div class={styles.mainValue}>
              <span class={styles.label}>Attention:</span>
              <span class={styles.value}>{ props.mindwaveData?.value.attention }</span>
            </div>
          )}
          { props.mindwaveData?.value.signal > 0 && (
            <div class={styles.mainValue}>
              <span class={styles.label}>Signal loses:</span>
              <span class={styles.value}>{ Math.min(props.mindwaveData?.value.signal, 100) }</span>
            </div>
          )}
        </div>

            <ValueStats
              cur={cur.value}
              label="Meditation" 
              name="meditation" 
              stats={cur.value?.thresholdsData?.meditation}
            />

            <ValueStats
              cur={cur.value}
              label="Attention" 
              name="attention" 
              stats={cur.value?.thresholdsData?.attention}
            />

            { cur.value?.durationTime > 0 && (
              <div class="meditation-time">
                <span class="label">Session time:</span>
                <span class="value">{ mmss(cur.value.durationTime) }</span>
              </div>
            )}

        <div>
          <MeditationChart id={props.id} med={props.cur} />
        </div>

        <div class="mt-2"><ElInput
          class="meditation-name"
          v-model={cur.value.name}
          placeholder="Name"
          /* style={{width: meditationNameWidth() + 'px'}} */
        /></div>
      </div>
    );
  },
});
