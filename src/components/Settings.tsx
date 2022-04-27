import { defineComponent, computed, watch } from 'vue';
import useStore from "@/helpers/useStore";
import { ElForm, ElFormItem, ElInput, ElCheckbox } from 'element-plus'
import { dbSet } from '@/helpers/firebaseDb';

export default defineComponent({
  name: 'Settings',
  props: {},
  setup(props) {
    const store = useStore();

    // console.log("store.state.settings:", store.state.settings);
    const models = {};
    for (let name in store.state.settings) {
      models[name] = computed({
        get: () => store.state.settings[name],
        set: (val) => {
          // console.log('commit ' + name, val);
          store.state.settings[name] = val;
          dbSet('settings', store.state.settings);
          store.commit('settings', store.state.settings);
        }
      });
    }

    watch(models.halfChartTop, (val) => {
      if (val) models.halfChartBottom.value = false;
    });
    watch(models.halfChartBottom, (val) => {
      if (val) models.halfChartTop.value = false;
    });

    return () => (
      <ElForm class="settings" label-width="150px">
        <div class="text-left">
          <ElFormItem label="Meditation time, sec">
            <ElInput v-model={models['meditationTimeMax'].value}/>
          </ElFormItem>
          <ElFormItem label="Meditation threshold" label-width="150px">
            <ElInput v-model={models['meditationFrom'].value}/>
          </ElFormItem>
          <ElFormItem label="History from day">
            <ElInput v-model={models['fromDay'].value} type="date"/>
          </ElFormItem>

            <ElCheckbox v-model={models['isSound'].value} label="Sound"/><br/>
            <ElCheckbox v-model={models['halfChartTop'].value} label="Chart from 70%"/><br/>
            <ElCheckbox v-model={models['halfChartBottom'].value} label="Chart to 30%"/><br/>
            <ElCheckbox v-model={models['meditationZones'].value} label="Show zones"/>
        </div>
      </ElForm>
    );
  },
});
