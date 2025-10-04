module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/shared': './src/shared',
          '@/entities': './src/entities',
          '@/features': './src/features',
          '@/widgets': './src/widgets',
          '@/screens': './src/screens',
          '@/app': './src/app',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
}
