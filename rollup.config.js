import resolve from 'rollup-plugin-node-resolve';

export default {
    input: './dist/esm3/public_api.js',
    output: [
        {
            file: './dist/fesm3/sheetbase-user.js',
            format: 'esm',
            sourcemap: true
        },
        {
            file: './dist/bundles/sheetbase-user.umd.js',
            format: 'umd',
            sourcemap: true,
            name: 'User'
        }
    ],
    plugins: [
        resolve()
    ]
};
