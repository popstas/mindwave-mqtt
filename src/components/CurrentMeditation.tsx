import { defineComponent, PropType, toRefs } from "vue";
import { MeditationType } from '@/helpers/types';
import ValueStats from "@/components/ValueStats";
import MeditationChart from "@/components/MeditationChart";
import { mmss } from "@/helpers/utils";
import { ElInput } from "element-plus"

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
      <div class="current-meditation">
        <div class="main-values">
          { props.mindwaveData?.value.signal === 0 && props.mindwaveData?.value.meditation > 0 && (
            <div class="main-value">
              <span class="label">Meditation:</span>
              <span class="value">{ props.mindwaveData?.value.meditation }</span>
            </div>
          )}
          { props.mindwaveData?.value.signal === 0 && props.mindwaveData?.value.attention > 0 && (
            <div class="main-value">
              <span class="label">Attention:</span>
              <span class="value">{ props.mindwaveData?.value.attention }</span>
            </div>
          )}
          { props.mindwaveData?.value.signal > 0 && (
            <div class="main-value">
              <span class="label">Signal loses:</span>
              <span class="value">{ Math.min(props.mindwaveData?.value.signal, 100) }</span>
            </div>
          )}
        </div>

            <ValueStats
              cur={cur.value}
              label="Meditation" 
              name="meditation" 
              stats={cur.value?.thresholdsData?.meditation}
            ></ValueStats>

            <ValueStats
              cur={cur.value}
              label="Attention" 
              name="attention" 
              stats={cur.value?.thresholdsData?.attention}
            ></ValueStats>

            { cur.value?.meditationTime > 0 && (
              <div class="meditation-time">
                <span class="label">Session time:</span>
                <span class="value">{ mmss(cur.value.meditationTime) }</span>
              </div>
            )}

        <div>
          <MeditationChart id={props.id} med={props.cur}></MeditationChart>
        </div>

        <div><ElInput
          class="meditation-name"
          v-model={cur.value.name}
          placeholder="Name"
          /* style={{width: meditationNameWidth() + 'px'}} */
        ></ElInput></div>
      </div>
    );
  },
});
