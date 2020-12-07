import Vue from 'vue'
import App from './App.vue'
import { JsPlumbToolkitVue2Plugin } from 'jsplumbtoolkit-vue2';

Vue.config.productionTip = false

require('@/assets/css/jsplumbtoolkit.css');
require('@/assets/css/jsplumbtoolkit-demo-support.css');
require('@/assets/css/jsplumbtoolkit-editable-connectors.css');
require('@/assets/css/app.css');

// import plugin the new way
Vue.use(JsPlumbToolkitVue2Plugin);

new Vue({ render: h => h(App) }).$mount('#app')

