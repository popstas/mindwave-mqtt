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
      <ElForm class="settings" label-width="120px">
        <ElFormItem label="Meditation time, sec">
          <ElInput v-model={models['meditationTimeMax'].value}/>
        </ElFormItem>
        <ElFormItem label="Meditation threshold">
          <ElInput v-model={models['meditationFrom'].value}/>
        </ElFormItem>
        <ElFormItem label="Show history from day">
          <ElInput v-model={models['fromDay'].value}/>
        </ElFormItem>

        <ElFormItem label="Sound">
          <ElCheckbox v-model={models['isSound'].value}/>
        </ElFormItem>
        <ElFormItem label="Chart from 70%">
          <ElCheckbox v-model={models['halfChartTop'].value}/>
        </ElFormItem>
        <ElFormItem label="Chart to 30%">
          <ElCheckbox v-model={models['halfChartBottom'].value}/>
        </ElFormItem>
        <ElFormItem label="Show zones">
          <ElCheckbox v-model={models['meditationZones'].value}/>
        </ElFormItem>
      </ElForm>
    );
  },
});
