import {
  computed,
  inject,
  provide,
  Ref,
  ComputedRef,
  ref,
  watch,
  reactive,
} from 'vue';
import { useRouter } from 'vue-router';
import useRedditMarkdownGenerator, { getDrivetrain } from './generator';
import getDefaultForm from './defaultForm';
import {
  DriveType,
  FormattingFormProps,
} from './types';
import useUpgrades, { UseUpgrades } from './useUpgrades';
import useUnitsConverter from './useUnitsConverter';
import { SettingsFormV1 } from './SettingsFormV1';
import useFormEncoder from './useFormEncoder';

interface UseFormattingForm {
  form: SettingsFormV1;
  driveType: ComputedRef<DriveType>;
  globalUnit: Ref<'Metric' | 'Imperial'>;
  convertOnUnitChange: Ref<boolean>;
  show: ComputedRef<UseUpgrades>;
  markdown: ComputedRef<string>;
  encoded: ComputedRef<string>;
  reset(): void;
}

const providerKey = 'formatting-form';

export function useFormattingFormProvider(props: FormattingFormProps) {
  const router = useRouter();
  const encoder = useFormEncoder(props);

  const form = reactive(encoder.decode(props.encodedForm));

  // watch(() => props.game, (current, previous) => { });

  const driveType = computed(() => getDrivetrain(form.build));

  const show = useUpgrades(form, driveType);

  const {
    globalUnit,
    convertOnUnitChange,
    setUnits,
  } = useUnitsConverter(form, !props.encodedForm);

  const encodedForm = computed(() => encoder.encode(form));

  watch(encodedForm, (current, old) => {
    if (current !== old) {
      router.replace({
        params: {
          encodedForm: current,
        },
      });
    }
  });

  const linkUrl = computed(() => `https://optn.club${router.currentRoute.value.fullPath}`);
  const { markdown } = useRedditMarkdownGenerator(props, form, linkUrl, globalUnit);

  function reset() {
    const defaultForm = getDefaultForm(props.version);
    form.build = defaultForm.build;
    form.make = defaultForm.make;
    form.model = defaultForm.model;
    form.stats = defaultForm.stats;
    form.tune = defaultForm.tune;
    setUnits();
  }

  const state: UseFormattingForm = {
    form,
    driveType,
    globalUnit,
    convertOnUnitChange,
    show,
    markdown,
    encoded: encodedForm,
    reset,
  };

  provide(providerKey, state);

  return state;
}

export function useFormattingForm() {
  const state = inject<UseFormattingForm>(providerKey);
  if (!state) throw new Error('Injected state not available');
  return state;
}
