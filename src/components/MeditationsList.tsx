import useStore from "@/helpers/useStore";
import { computed, defineComponent, PropType, ref, withKeys, withModifiers, emit } from "vue";
import { ElTable, ElTableColumn } from "element-plus"
import { MeditationType } from "@/helpers/types"
import { dateTimeFormat, mmss } from "@/helpers/utils";

export default defineComponent({
  name: "MeditationsList",
  props: {},
  emits: ['load', 'compare', 'remove'],

  setup(props, context) {
    const store = useStore();

    function getMeditationByRow(row) {
      return store.state.meditations.find(m => {
        return m?.meditationStart == row?.meditationStart
      });
    }
    function onCellClick(row, column, cell, event) {
      let actionMap = {
        name: 'load',
        compare: 'compare',
        remove: 'remove',
      };
      const action = actionMap[column.property];
      if (!action) return;

      const med = getMeditationByRow(row);
      // console.log(`MeditationsList: emit: ${action}`);
      context.emit(action, med);
    }

    /* function tableRowClassName({ row, rowIndex }: {
      row: any
      rowIndex: number
    }) {
      console.log('row: ', row);
      if (rowIndex === 1) {
        return 'warning-row'
      } else if (rowIndex === 3) {
        return 'success-row'
      }
      return ''
    } */

    const items = computed(() => {
      return store.state.meditationsBrief.map(med => {
        return {
          meditationStart: med.startTime,
          date: dateTimeFormat(med.startTime), // TODO: med__date_today: Date.now() - med.meditationStart < 86400000
          name: med.name, // TODO: <a title="click for load" href="javascript:" v-html="med.name" onClick={() => loadMeditation(med)}></a>,
          time: mmss(med.durationTime),
          med70: Math.round(med.thresholdsData.meditation.thresholds[70].total / med.durationTime * 100),
          med80: Math.round(med.thresholdsData.meditation.thresholds[80].total / med.durationTime * 100),
          med90: Math.round(med.thresholdsData.meditation.thresholds[90].total / med.durationTime * 100),
          med100: Math.round(med.thresholdsData.meditation.thresholds[100].total / med.durationTime * 100),
          med_avg: Math.round(med.thresholdsData.meditation.average),
          med70_mins: Math.round(med.thresholdsData.meditation.thresholds[70].total / 60 * 10) / 10,
          attention: Math.round(med.thresholdsData.attention.average),
          compare: 'compare',
          remove: 'x',/*(
            <div class="med__actions">
              <a href="javascript:" onClick={() => compareMeditation(med)}>compare</a>
              <a href="javascript:" onClick={() => removeMeditation(med)}>x</a>
            </div>
          ),*/
        }
      });
    });

    return () => (
      <div class="meditations-list">
        <h2>History</h2>
        <ElTable class="meditation-items"
          data={items.value}
          empty-text="No meditations yet"
          stripe={true}
          default-sort={{ prop: 'date', order: 'descending' }}
          style={{width: '100%'}}
          onCell-click={onCellClick}
          /* row-class-name={tableRowClassName} */
        >
          <ElTableColumn prop="date" label="Date" sortable width="150" />
          <ElTableColumn prop="name" label="Name" sortable/>
          <ElTableColumn prop="time" label="Time" sortable width="50"/>
          <ElTableColumn prop="med70" label="Med70" sortable width="65"/>
          <ElTableColumn prop="med80" label="Med80" sortable width="65"/>
          <ElTableColumn prop="med90" label="Med90" sortable width="65"/>
          <ElTableColumn prop="med100" label="Med100" sortable width="67"/>
          <ElTableColumn prop="med_avg" label="Med avg" sortable width="63"/>
          <ElTableColumn prop="med70_mins" label="Med70 mins" sortable width="65"/>
          <ElTableColumn prop="attention" label="Att" sortable width="65"/>
          <ElTableColumn prop="compare" label="" width="70"/>
          <ElTableColumn prop="remove" label="" width="20"/>
        </ElTable>
      </div>
    );
  },
});
