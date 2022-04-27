import useStore from "@/helpers/useStore";
import { computed, defineComponent } from "vue";
import { ElTable, ElTableColumn } from "element-plus"
import { dateTimeFormat, mmss, percentClass } from '@/helpers/utils';
import '@/styles/components/MeditationList.scss';

interface MedRowType {
  startTime: number,
  date: string,
  name: string,
  time: string,
  med70: number,
  med80: number,
  med90: number,
  med100: number,
  med_avg: number,
  med70_mins: number,
  attention: number,
  compare: 'compare',
  remove: 'x',
}

interface ColumnType {
  property: string,
}

export default defineComponent({
  name: "MeditationsList",
  props: {},
  emits: ['load', 'compare', 'remove'],

  setup(props, context) {
    const store = useStore();

    function getMeditationByRow(row: MedRowType) {
      return store.state.meditationsBrief.find(m => {
        return m.startTime === row.startTime
      });
    }
    function onCellClick(row: MedRowType, column: ColumnType) {
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

    function medColFormatter(row: MedRowType, column: ColumnType) {
      const val = row[column.property];
      const cl = percentClass(val, column.property);
      return (<div class={cl}>{val}</div>)
    }

    const items = computed(() => {
      return store.state.meditationsBrief?.map(med => {
        return {
          startTime: med.startTime,
          date: dateTimeFormat(med.startTime), // TODO: med__date_today: Date.now() - med.meditationStart < 86400000
          name: med.name,
          time: mmss(med.durationTime),
          med70: Math.round(med.thresholdsData.meditation.thresholds[70].total / med.durationTime * 100),
          med80: Math.round(med.thresholdsData.meditation.thresholds[80].total / med.durationTime * 100),
          med90: Math.round(med.thresholdsData.meditation.thresholds[90].total / med.durationTime * 100),
          med100: Math.round(med.thresholdsData.meditation.thresholds[100].total / med.durationTime * 100),
          med_avg: Math.round(med.thresholdsData.meditation.average),
          med70_mins: Math.round(med.thresholdsData.meditation.thresholds[70].total / 60 * 10) / 10,
          attention: Math.round(med.thresholdsData.attention.average),
          compare: 'compare',
          remove: 'x',
        } as MedRowType
      });
    });

    return () => (
      <div class="mt-4 mx-1">
        <h2>History</h2>
        <ElTable class="meditation-items"
          data={items.value}
          empty-text="No meditations yet"
          stripe={true}
          default-sort={{ prop: 'date', order: 'descending' }}
          style={{width: '100%'}}
          onCell-click={onCellClick}
        >
          <ElTableColumn prop="date" label="Date" sortable width="150" />
          <ElTableColumn prop="name" label="Name" sortable className="clickable" />
          <ElTableColumn prop="time" label="Time" sortable width="50"/>
          <ElTableColumn prop="med70" label="Med70" sortable width="65" formatter={medColFormatter}/>
          <ElTableColumn prop="med80" label="Med80" sortable width="65" formatter={medColFormatter}/>
          <ElTableColumn prop="med90" label="Med90" sortable width="65" formatter={medColFormatter}/>
          <ElTableColumn prop="med100" label="Med100" sortable width="67" formatter={medColFormatter}/>
          <ElTableColumn prop="med_avg" label="Med avg" sortable width="63" formatter={medColFormatter}/>
          <ElTableColumn prop="med70_mins" label="Med70 mins" sortable width="65" formatter={medColFormatter}/>
          <ElTableColumn prop="attention" label="Att" sortable width="65"/>
          <ElTableColumn prop="compare" label="" width="70" className="clickable" />
          <ElTableColumn prop="remove" label="" width="20" className="clickable" />
        </ElTable>
      </div>
    );
  },
});
