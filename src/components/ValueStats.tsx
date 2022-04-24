import { defineComponent, toRefs } from "vue";
import { mmss, percentClass, timePercent } from '@/helpers/utils'

export default defineComponent({
  name: "ValueStats",
  props: {
    cur: Object,
    stats: Object,
    name: String,
    label: String,
  },
  setup(props) {
    const { cur, stats, name, label } = toRefs(props);

    function outThresholds() {
      const items = [];
      for (let val in stats.value?.thresholds) {
        const th = stats.value?.thresholds[val];
        items.push(
          <tr class="stats-value">
            <td class="label">{ val }%:</td>
            <td class="value">
              <span>{ mmss(th.total) }</span>&nbsp;
              { th.total > 0 && (
                <span class={'percent ' + percentClass(timePercent(th.total, cur.value?.meditationTime), `${name.value}${val}`)}>
                  ({ timePercent(th.total, cur.value?.meditationTime) })
                </span>
              )}
              { th.maxTime && ( <span class="max" >, max: { mmss(th.maxTime) }</span> ) }
              { th.loses > 0 && ( <span class="loses">, count: { th.loses }</span> ) }
            </td>
          </tr>
        )
      }
      return items;
    }
    
    return () => (
      <div class="stats-row">
        <table class="stats">
          { stats.value?.average && (
          <tr class="stats-value">
            <td class="label">{ label.value } avg:</td>
            <td class="value">
              { stats.value.average }%
            </td>
          </tr>
          )}
          { outThresholds() }
        </table>
      </div>
    )
  },
});
