# DrupalTranslationsWebpackPlugin
Extract Drupal.t and Drupal.formatPlural calls from your webpack bundles.

The plugin will gather all those calls in one single file and emit them.
Then you can add this file to your Drupal theme library. Drupal will pick it up
and run its regex over it, so that those translations end up in the Frontend.

# How to use
## Add the plugin to your webpack config
```javascript
plugins: [
  new DrupalTranslationsWebpackPlugin({
    output: 'drupal-translations.js'
  })
]
```

You can use both translation functions everywhere. But *maybe* you need to declare
that Drupal is a global object. It worked for me without, in another project it
didn't.

*webpack.config.js*
```javascript
new webpack.ProvidePlugin({
  'Drupal': 'window.Drupal'
})
```

Also, if you use ESLint, you want to declare Drupal a global object:

*.eslintrc.js*
```javascript
globals: {
  'Drupal': true
}
```

It's important that you use the functions like normal, e.g. not write `window.Drupal.t`
or otherwise wrap them in your own function, etc. The plugin is rather "dumb"; it will
just go through all JS files and parse out the actual "string" where the function is
called.

For a detailled example on how to use this plugin, check out this Drupal webpack example:

https://github.com/dulnan/drupal-webpack-setup-example
