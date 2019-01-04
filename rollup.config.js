import resolve from 'rollup-plugin-node-resolve';

export default {
    input: './dist/esm3/public_api.js',
    output: [
        {
            file: './dist/fesm3/sheetbase-user-server.js',
            format: 'esm',
            sourcemap: true
        },
        {
            file: './dist/bundles/sheetbase-user-server.umd.js',
            format: 'umd',
            sourcemap: true,
            name: 'User'
        }
    ],
    plugins: [
        resolve()
    ]
};
