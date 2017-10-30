var path = require('path');
module.exports = {
  entry: './src/game.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'vanduul.space.js',
    library: 'VanduulSpace'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|build)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      },
      
          { test: /\.css$/, loader: "style-loader!css-loader" },
       { test: /\.jpg$/, loader: 'file-loader' }
    ]
  },
  externals: {
    'react': 'commonjs react' // this line is just to use the React dependency of our parent-testing-project instead of using our own React.
  }
};
