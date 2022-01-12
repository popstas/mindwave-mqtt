import { defineComponent, ref, Transition } from 'vue';
import useStore from '@/helpers/useStore';
import setPageTitle from '@/helpers/setPageTitle';

export default defineComponent({
  name: 'HistoryPage',
  setup() {
    setPageTitle('История');
    const store = useStore();

    return () => (
      <div>
        <h1>История</h1>
      </div>
    );
  }
});