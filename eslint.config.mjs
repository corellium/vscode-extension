import harmony from '@beskar-labs/harmony';

//export default harmony;
export default {
    ...harmony,
    parserOptions: {
        ...harmony.parserOptions,
        project: './tsconfig.json', // <-- required for type-aware rules
    },
};
