// import useStore from "@/helpers/useStore";
import { computed, defineComponent, toRefs } from "vue";
import { ElTable, ElTableColumn } from "element-plus"

export default defineComponent({
  name: "DaysList",
  props: {
    days: Object
  },
  setup(props) {
    // const store = useStore();
    const { days } = toRefs(props);

    const items = computed(() => {
      return days.value.map(med => {
        return {
          day: med.day,
          med70avg: parseInt(med.med70avg), // TODO: percentClass(med.med70avg, 'meditation70')
          med80avg: parseInt(med.med80avg),
          med90avg: parseInt(med.med90avg),
          med70mins: parseInt(med.med70totalMins),
          count: med.count,
          mins: med.mins,
        }
      });
    });

    return () => (
      <div class="meditation-days">
        <h2>Days</h2>
        <ElTable class="meditation-items"
          data={items.value}
          stripe={true}
          default-sort={{ prop: 'day', order: 'descending' }}
          style={{width: '100%'}}
        >
          <ElTableColumn prop="day" label="day" sortable width="140" />
          <ElTableColumn prop="med70avg" label="med70 avg" sortable width="80"/>
          <ElTableColumn prop="med80avg" label="med80 avg" sortable width="80"/>
          <ElTableColumn prop="med90avg" label="med90 avg" sortable width="80"/>
          <ElTableColumn prop="med70mins" label="med 70 mins" sortable width="80"/>
          <ElTableColumn prop="count" label="count" sortable width="80"/>
          <ElTableColumn prop="mins" label="mins" sortable width="80"/>
        </ElTable>
      </div>
    );

  },
});
