import { defineComponent, onMounted } from 'vue';
import { RouterView } from 'vue-router';
import useStore from '@/helpers/useStore';

export default defineComponent({
  setup() {
    const store = useStore();
    onMounted(() => {});

    return () => (
      <div>
        <RouterView />
      </div>
    );
  },
});
