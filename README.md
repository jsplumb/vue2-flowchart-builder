<a name="top"></a>
# Flowchart Builder (Vue 2)

This is a port of the Flowchart Builder application that demonstrates the Toolkit's Vue 2 ES6 module based integration, in a Vue CLI 3 application. 

![Flowchart Builder Demonstration](demo-flowchart.png)

This page gives you an in-depth look at how the application is put together.

## package.json

This file was created for us by the CLI, to which we then added a few entries:

```javascript
"dependencies": {
        "@jsplumbtoolkit/browser-ui-plugin-drawing-tools": "^5.12.0",
        "@jsplumbtoolkit/browser-ui-plugin-lasso": "^5.12.0",
        "@jsplumbtoolkit/browser-ui-plugin-miniview": "^5.12.0",
        "@jsplumbtoolkit/browser-ui-vue2": "^5.12.0",
        "@jsplumbtoolkit/browser-ui-vue2-drop": "^5.12.0",
        "@jsplumbtoolkit/connector-editors-orthogonal": "^5.12.0",
        "@jsplumbtoolkit/dialogs": "^5.12.0",
        "@jsplumbtoolkit/layout-spring": "^5.12.0",
        "vue": "2.5.17"
    },
    "devDependencies": {
        "@vue/cli-plugin-babel": "3.1.1",
        "@vue/cli-plugin-eslint": "3.1.5",
        "@vue/cli-service": "3.1.4",
        "babel-eslint": "10.0.1",
        "eslint": "5.8.0",
        "eslint-plugin-vue": "^5.0.0-0",
        "vue-template-compiler": "2.5.17"
    },

```


[TOP](#top)

---


## Bootstrap

A CLI application is bootstrapped through `src/main.js`. Ours looks like this:

```javascript
import Vue from 'vue'
import App from './App.vue'
import { JsPlumbToolkitVue2Plugin } from '@jsplumbtoolkit/browser-ui-vue2'

Vue.config.productionTip = false

// import Toolkit plugin
Vue.use(JsPlumbToolkitVue2Plugin)

new Vue({ render: h => h(App) }).$mount('#app')

```

[TOP](#top)

---

## Application

The component that acts as the entry point of the application is defined in `App.vue`, which looks like this:

```vue
<template>
  <div id="app">
    <div class="jtk-demo-main" id="jtk-demo-flowchart">

        <div id="canvas" class="jtk-demo-canvas">
          <Controls surface-id="surface"></Controls>
          <Flowchart surface-id="surface"></Flowchart>
        </div>

        <div class="jtk-demo-rhs">
          <Palette surface-id="surface"
                   selector="[data-node-type]"
                   v-bind:data-generator="dataGenerator">
          </Palette>
          <div class="description">
            <p>
              This sample application is a copy of the Flowchart Builder application, using the Toolkit's
              Vue 2 integration components and Vue CLI 3.
            </p>
            <ul>
              <li>Drag new nodes from the palette on the left onto whitespace to add new disconnected nodes</li>
              <li>Drag new nodes from the palette on the left onto on edge to drop a node between two existing nodes</li>
              <li>Drag from the grey border of any node to any other node to establish a link, then provide a description for the link's label</li>
              <li>Click a link to edit its label.</li>
              <li>Click the 'Pencil' icon to enter 'select' mode, then select several nodes. Click the canvas to exit.</li>
              <li>Click the 'Home' icon to zoom out and see all the nodes.</li>
            </ul>
          </div>
        </div>

    </div>

  </div>
</template>

<style>
  @import "../node_modules/@jsplumbtoolkit/browser-ui/css/jsplumbtoolkit.css";
  @import "../node_modules/@jsplumbtoolkit/dialogs-core/css/jsplumbtoolkit-dialogs.css";
  @import "../node_modules/@jsplumbtoolkit/browser-ui/css/jsplumbtoolkit-demo-support.css";
  @import "../node_modules/@jsplumbtoolkit/connector-editors/css/jsplumbtoolkit-connector-editors.css";
  @import "./assets/css/app.css";
</style>

<script>

  import { uuid } from "@jsplumbtoolkit/core"

  import Flowchart from './components/Flowchart.vue'
  import Palette from './components/Palette.vue'
  import Controls from './components/Controls.vue'

export default {
  name: 'app',
  components: {
    Flowchart, Palette, Controls
  },
    methods:{
        dataGenerator:function(el) {
            return {
                type:el.getAttribute("data-node-type"),
                w:el.getAttribute("data-width"),
                h:el.getAttribute("data-height"),
                id:uuid()
            };
        }
    }
}
</script>

```


The template uses 3 components that are also declared in this app - `Flowchart`, `Palette` and `Controls`. A discussion of each of these is below.


---

## Flowchart Component

This is where most of the functionality is coordinated. We'll break it up into sections and go through each one.

### Template

```xml
<template>
    <div style="width: 100%;height: 100%;position: relative;">
    <jsplumb-toolkit ref="toolkitComponent"
                     url="data/copyright.json"
                     v-bind:render-params="renderParams"
                     v-bind:view="view"
                     surface-id="surface"
                     v-bind:toolkit-params="toolkitParams">

    </jsplumb-toolkit>
    <jsplumb-miniview surface-id="surface"></jsplumb-miniview>
    </div>
</template>
```

We use the `jsplumb-toolkit` component, providing several pieces of information:

- **ref="toolkitComponent"** we want to be able to retrieve this component after mounting, as we need a reference to the underlying Toolkit instance for some of our business logic
- **url="flowchart-1.json"** we provide the url for an initial dataset to load. This is of course optional.
- **v-bind:render-params="renderParams"** These are the parameters passed to the Surface component that renders the dataset. They are declared in the `data()` method of the Flowchart component.
- **v-bind:view="view"** This is the view passed to the Surface component that renders the dataset. The view is responsible for mapping node/edge/port types to their appearance and behaviour.
- **surface-id="surface"** We assign an ID to the surface for a couple of reasons: first, we need to nominate which surface to attach our miniview, controls and palette components to. Second, we need to access the surface for some of our app's functionality (which we will do inside the `mounted()` method of the flowchart component)
- **v-bind:toolkit-params="toolkitParams"** These are the parameters passed to the constructor of the Toolkit instance.


### Script Block

We'll break this up into parts too.

#### Imports

```
// jsplumb imports
import * as Dialogs from "@jsplumbtoolkit/dialogs"
import { getSurface } from '@jsplumbtoolkit/browser-ui-vue2'
import { uuid } from "@jsplumbtoolkit/core"
import { ForceDirectedLayout } from "@jsplumbtoolkit/layout-force-directed"

import { LassoPlugin } from "@jsplumbtoolkit/browser-ui-plugin-lasso"
import { DrawingToolsPlugin } from "@jsplumbtoolkit/browser-ui-plugin-drawing-tools"
import { newInstance as newConnectorEditors } from "@jsplumbtoolkit/connector-editors"

//
// you need to initialize the orthogonal connector editor to avoid it being ignored
// by a tree shaker
//
import * as OrthogonalConnectorEditors from "@jsplumbtoolkit/connector-editors-orthogonal"
OrthogonalConnectorEditors.initialize()
```

There are two types of imports:

##### jsPlumb imports

Various data model imports, the layout, plugins, methods to access a Surface, event names, etc. Note in particular here the code that imports and initialized the orthogonal connector editor:

```javascript
import * as OrthogonalConnectorEditors from "@jsplumbtoolkit/connector-editors-orthogonal"
OrthogonalConnectorEditors.initialize()
```

It is necessary to do this because in the current architecture, connector editors are instantiated internally by name, which is a mechanism that evades any tree shaking, and consequently, without this call, the connector editor is omitted from the final bundle.


##### Local imports

We import each of the components used to render the node types, and various constants used to identify node/port/edge types.


#### Component definition

The flowchart is declared as a class with the `@Component` decorator. Here we show the basic outline of the class; below we'll provide the body of each method and discuss each one.

```javascript
@Component
export default class Flowchart extends Vue {

    @Prop() surfaceId: string
    toolkit:BrowserUIVue2
    surface:Surface
    dialogs:Dialogs
    edgeEditor:EdgePathEditor
    
    data() { ... }
    
    methods:{
        ...
    }
    
    mounted() { ... }
}
```

The Flowchart component declares a `surfaceId` prop. This is an arbitrary value but it is required because Surfaces are created asynchronously. Any code that wishes to access a Surface has to use this asynchronous method: 

```javascript
getSurface(surfaceId:string, (s:Surface)=>any)
```

##### `mounted()`

We'll discuss this method first.

```javascript
mounted() {

        toolkitComponent = this.$refs.toolkitComponent;
        toolkit = toolkitComponent.toolkit;

        dialogs = Dialogs.newInstance({
            dialogs: {
                "dlgText": {
                    template:'<input type="text" size="50" jtk-focus jtk-att="text" value="${text}" jtk-commit="true"/>',
                    title:'Enter Text',
                    cancelable:true

                },
                "dlgConfirm": {
                    template:'${msg}',
                    title:'Please Confirm',
                    cancelable:true
                },
                "dlgMessage": {
                    template:'${msg}',
                    title:"Message",
                    cancelable:false
                }
            }
        });

        getSurface(this.surfaceId, (s) => {
            surface = s;
            edgeEditor = ConnectorEditors.newInstance(s)
        });

    }
```

Here, we instantiate a set of dialogs for the demo to use for various operations such as editing the label of a node, setting the label for an edge, confirming deletion, etc. Dialogs is a Toolkit package that was created for the purposes of having something to use in our demonstrations and there's no specific requirement for your code to use them. But you are welcome to, if you wish!

In the `mounted()` method we also access the `toolkitComponent` ref, from which we get a reference to the underlying Toolkit instance.  Lastly, we retrieve the created Surface, store a reference to it, and create an edge editor.

##### `data()`

The return value of this method contains 

- `toolkitParams` - constructor parameters for the Toolkit instance
- `renderParams` - parameters for the behaviour and configuration of the Surface
- `view` - Mappings of node/edge/port types to their appearance and behaviour.

```javascript
data:() => {
        return {
            toolkitParams:{
                nodeFactory:nodeFactory,
                edgeFactory:edgeFactory,
                beforeStartConnect:function(node) {
                    // limit edges from start node to 1. if any other type of node, return
                    return (node.data.type === "start" && node.getEdges().length > 0) ? false : { label:"..." };
                }
            },
            renderParams:{
                layout:{
                    type: ForceDirectedLayout.type
                },
                events:{
                    modeChanged:function (mode) {
                        let controls = document.querySelector(".controls");
                        surface.removeClass(controls.querySelectorAll("[mode]"), "selected-mode");
                        surface.addClass(controls.querySelectorAll("[mode='" + mode + "']"), "selected-mode");
                    },
                    canvasClick:() => {
                        toolkit.clearSelection();
                        edgeEditor.stopEditing();
                    }
                },
                consumeRightClick: false,
                dragOptions: {
                    filter: ".jtk-draw-handle, .node-action, .node-action i"
                },
                zoomToFit:true,
                plugins: [
                    DrawingToolsPlugin.type,
                    {
                        type:LassoPlugin.type,
                        options:{
                            invert:true
                        }
                    }
                ],
                grid:{
                    size:{
                        w:20,
                        h:20
                    }
                },
                magnetize:{
                    afterDrag:true
                }
            },
            view:{
                nodes: {
                    "start": {
                        component:StartNode
                    },
                    "selectable": {
                        events: {
                            tap: (params) => {
                                params.toolkit.toggleSelection(params.obj)
                            }
                        }
                    },
                    "question": {
                        parent: "selectable",
                        component:QuestionNode
                    },
                    "action": {
                        parent: "selectable",
                        component:ActionNode
                    },
                    "output":{
                        parent:"selectable",
                        component:OutputNode
                    }
                },
                // There are two edge types defined - 'yes' and 'no', sharing a common
                // parent.
                edges: {
                    "default": {
                        anchor:"AutoDefault",
                        endpoint:"Blank",
                        connector: {type:"Orthogonal", options:{ cornerRadius: 5 } },
                        paintStyle: { strokeWidth: 2, stroke: "rgb(132, 172, 179)", outlineWidth: 3, outlineStroke: "transparent" },	//	paint style for this edge type.
                        hoverPaintStyle: { strokeWidth: 2, stroke: "rgb(67,67,67)" }, // hover paint style for this edge type.
                        events: {
                            "click":(p) => {
                                edgeEditor.startEditing(p.edge, {
                                    deleteButton:true,
                                    onMaybeDelete:(edge, connection, doDelete) => {
                                        dialogs.show({
                                            id: "dlgConfirm",
                                            data: {
                                                msg: "Delete Edge"
                                            },
                                            onOK: doDelete
                                        });
                                    }
                                });
                            }
                        },
                        overlays: [
                            { type:"Arrow", options:{ location: 1, width: 10, length: 10 } }
                        ]
                    },
                    "response":{
                        parent:"default",
                        overlays:[
                            {
                                type: "Label",
                                options: {
                                    label: "${label}",
                                    events: {
                                        click: (p) => {
                                            showEdgeEditDialog(p.edge.data, (data) => {
                                                toolkit.updateEdge(p.edge, data);
                                            }, () => null)
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },

                ports: {
                    "start": {
                        edgeType: "default"
                    },
                    "source": {
                        maxConnections: -1,
                        edgeType: "response"
                    },
                    "target": {
                        maxConnections: -1,
                        isTarget: true
                    }
                }
            }
        };
    }
```

This method returns constructor parameters for the underlying Toolkit instance. In this demonstration we provide a `nodeFactory`, `edgeFactory` and `beforeStartConnect` method, the purpose of each of which is discussed in the comments inside the code.

The return value of this method is passed as a prop to the Toolkit component that the template for the Flowchart component uses. We implement this a a method with a return value rather than a class member of the Flowchart class in order to avoid any problems with references to `this`. 

##### methods

Two methods are exposed on the Flowchart component - the ability to edit the label of a node, and a method used to prompt a user to confirm that they wish to delete some node.

methods:{
        editNode:function(node) {
            dialogs.show({
                id: "dlgText",
                data: node.data,
                title: "Edit " + node.data.type + " name",
                onOK: (data) => {
                    if (data.text && data.text.length > 2) {
                        // if name is at least 2 chars long, update the underlying data and
                        // update the UI.
                        toolkit.updateNode(node, data);
                    }
                }
            });
        },
        maybeDelete:function(node) {
            dialogs.show({
                id: "dlgConfirm",
                data: {
                    msg: "Delete '" + node.data.text + "'"
                },
                onOK:() => {
                    toolkit.removeNode(node);
                }
            });
        }
    }
```

##### `maybeDelete(...)`

Prompts the user to see if they want to confirm deletion of the node, and deletes it if they confirm.

```javascript

    maybeDelete(node:Node) {
        this.dialogs.show({
            id: DIALOG_CONFIRM,
            data: {
                msg: "Delete '" + node.data.text + "'"
            },
            onOK:() => {
                this.toolkit.removeNode(node);
            }
        });
    }
```



---

## Node Components

Each of the four node types is rendered with a specific Vue component. With the exception of the `StartNode` component, they each include the `BaseEditableNode` mixin, whose definition is:

```
<script>

   import { BaseNodeComponent } from '@jsplumbtoolkit/browser-ui-vue2'
   import { consume } from "@jsplumbtoolkit/browser-ui"

    export default {
        mixins:[ BaseNodeComponent ],
        methods:{
            edit:function(event) {
                consume(event);
                this.$parent.$parent.editNode(this.getNode());
            },
            maybeDelete:function(event) {
                consume(event);
                this.$parent.$parent.maybeDelete(this.getNode());
            }
        }
    }

</script>

```

It offers 2 common methods - to handle editing of a node's label, and to handle a node's deletion.
 
 
### StartNode

```xml
<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-start">
        <svg :width="obj.w" :height="obj.h">
            <ellipse :cx="obj.w/2" :cy="obj.h/2" :rx="(obj.w/2) - 10" :ry="(obj.h/2) - 10" class="inner"/>
        </svg>
        <span>{{obj.text}}</span>
        <div class="drag-start connect" data-jtk-source="true" data-jtk-port-type="start"></div>
    </div>
</template>

<script>
    export default { }
</script>


```

### ActionNode

```xml
<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-action" data-jtk-target="true">
        <svg :width="obj.w" :height="obj.h">
            <rect x="10" y="10" :width="obj.w-20" :height="obj.h-20" class="inner" rx="5" ry="5"/>
        </svg>

        <span>{{obj.text}}</span>

        <div class="node-edit node-action" v-on:click="edit"></div>
        <div class="node-delete node-action delete" v-on:click="maybeDelete"></div>
        <div class="drag-start connect" data-jtk-source="true" data-jtk-port-type="source"></div>
    </div>
</template>

<script>
    import BaseEditableNode from './BaseEditableNode.vue'
    export default {
        mixins:[BaseEditableNode]
    }
</script>


```

#### OutputNode

```xml
<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-output" data-jtk-target="true">
        <svg :width="obj.w" :height="obj.h">
            <rect x="0" y="0" :width="obj.w" :height="obj.h" rx="5" ry="5"/>
        </svg>
        <span>{{obj.text}}</span>
        <div class="node-edit node-action" v-on:click="edit"></div>
        <div class="node-delete node-action delete" v-on:click="maybeDelete"></div>
    </div>
</template>

<script>
    import BaseEditableNode from './BaseEditableNode.vue'
    export default {
        mixins:[BaseEditableNode]
    }
</script>



```

#### QuestionNode

```xml
<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-action" data-jtk-target="true">
        <svg :width="obj.w" :height="obj.h" stroke-linejoin="round">
            <path :d="'M ' + (obj.w/2) + ' 10 L ' + (obj.w-10) + ' ' + (obj.h/2) + ' L ' + (obj.w/2) + ' ' + (obj.h-10) + ' L 10 ' + (obj.h/2) + ' Z'" class="inner"/>
        </svg>
        <span>{{obj.text}}</span>
        <div class="node-edit node-action" v-on:click="edit"></div>
        <div class="node-delete node-action delete" v-on:click="maybeDelete"></div>
        <div class="drag-start connect" data-jtk-source="true" data-jtk-port-type="source"></div>
    </div>
</template>

<script>
    import BaseEditableNode from './BaseEditableNode.vue'
    export default {
        mixins:[BaseEditableNode]
    }
</script>


```


---

## Dragging New Nodes

In this demonstration, new nodes can be dragged on to whitespace in the canvas, to create new, unconnected, nodes. They can also be dragged onto an existing edge, in which case the new node is injected in between the two nodes at either end of the edge on which the new node was dropped. Both of these capabilities are provided by the `SurfaceDrop` mixin from the Toolkit's Vue2 integration.

We declare a `Palette` component in the app's template:

```xml
<Palette surface-id="surface"
     selector="[data-node-type]"
     v-bind:data-generator="dataGenerator"
</Palette>
```

`Palette` is a component declared in this application, which uses the `SurfaceDrop` mixin from the Toolkit's Vue integration:

```javascript
<template>
    <div class="sidebar node-palette">
        <div class="sidebar-item" :data-node-type="entry.type" title="Drag to add new" v-for="entry in data" :key="entry.type" :data-width="entry.w" :data-height="entry.h">
            <i :class="entry.icon"></i>{{entry.label}}
        </div>
    </div>
</template>

<script>


    import { SurfaceDrop } from '@jsplumbtoolkit/browser-ui-vue2-drop'

    export default {
        mixins:[ SurfaceDrop ],
        data:function() {
            return {
                data:[
                    { icon:"icon-tablet", label:"Question", type:"question", w:240, h:220 },
                    { icon:"icon-eye-open", label:"Action", type:"action", w:240, h:160 },
                    { type:"output", icon:"icon-eye-open", label:"Output", w:240, h:160 }
                ]
            };
        }
    }

</script>

```

The `SurfaceDrop` mixin expects any concrete class it has been attached to to expose a `selector` property, which we pass to `Palette` as a prop. Its value in this case is `[data-node-type]`; in the template for `Palette` we write out each entry's `type` as the value of its `data-node-type` attribute.



[TOP](#top)

---

## Controls Component

The buttons in the top left of the screen are handled by the component defined in `Controls.vue`. Here's the full code for the component; a discussion follows below.

```
<template>
    <div class="controls" ref="container">
        <i class="fa fa-arrows selected-mode" mode="pan" title="Pan Mode" v-on:click="panMode()"></i>
        <i class="fa fa-pencil" mode="select" title="Select Mode" v-on:click="selectMode()"></i>
        <i class="fa fa-home" reset title="Zoom To Fit" v-on:click="zoomToFit()"></i>
        <i class="fa fa-undo" undo title="Undo last action" v-on:click="undo()"></i>
        <i class="fa fa-repeat" redo title="Redo last action" v-on:click="redo()"></i>
        <i class="fa fa-times" title="Clear" v-on:click="clear()"></i>
    </div>
</template>

<script>

    import { getSurface, SurfaceMode } from "@jsplumbtoolkit/browser-ui-vue2";
    import { EVENT_CANVAS_CLICK } from "@jsplumbtoolkit/browser-ui"
    import { EVENT_UNDOREDO_UPDATE } from "@jsplumbtoolkit/core"

    let container;
    let surfaceId;

    // a wrapper around getSurface, which expects a callback, as the surface may or may not have been
    // initialised when calls are made to it.
    function _getSurface(cb) {
        getSurface(surfaceId, cb)
    }

    export default {
        props:["surfaceId"],
        methods:{
            panMode:function() {
                _getSurface((s) => s.setMode(SurfaceMode.PAN))
            },
            selectMode:function() {
                _getSurface((s) => s.setMode(SurfaceMode.SELECT))
            },
            zoomToFit:function() {
                _getSurface((s) => s.zoomToFit())
            },
            undo:function() {
                _getSurface((s) => s.toolkitInstance.undo())
            },
            redo:function() {
                _getSurface((s) => s.toolkitInstance.redo())
            },
            clear: function() {
                _getSurface((s) => {
                    const t = s.toolkitInstance;
                    if (t.getNodeCount() === 0 || confirm("Clear canvas?")) {
                        t.clear();
                    }
                });
            }
        },
        mounted:function() {

            surfaceId = this.surfaceId;
            container = this.$refs.container;
            _getSurface((surface) => {

                surface.toolkitInstance.bind(EVENT_UNDOREDO_UPDATE, (state) => {
                    container.setAttribute("can-undo", state.undoCount > 0 ? "true" : "false")
                    container.setAttribute("can-redo", state.redoCount > 0 ? "true" : "false")
                })

                surface.bind(EVENT_CANVAS_CLICK, () => {
                    surface.toolkitInstance.clearSelection();
                });
            });
        }
    }

</script>


```

#### Referencing the component

The Controls component is created by the template in `App.vue`:

```html
<div id="canvas" class="jtk-demo-canvas">
  <Controls surface-id="surface"></Controls>
  <Flowchart surface-id="surface"></Flowchart>
</div>
```

We pass the same value for `surface-id` as we pass to the Flowchart component. Each component uses the underlying Toolkit's Vue2 service to access the Surface with this id. Note we pass the value in "kebab case" but the actual property is in camel case. 

#### Mounting the component

The component's `mounted` function does three things:

- Sets the component's `container` property. This is the DOM element hosting the component.
- Binds an event listener to the Toolkit's `EVENT_UNDOREDO_UPDATE` event, which updates the UI accordingly. 
- Binds an event listener to the `canvasClick` event to clear the current selection whenever a user clicks on whitespace in the canvas.

#### Behaviour

Each button is mapped to a method specified in the component's exports.  Note, in these methods, the use of the `_getSurface(..)` helper method to access the Surface. This method simply abstracts out the `surfaceId` from each of the individual handlers, and under the hood it accesses the `getSurface` method of the Toolkit's Vue 2 integration.

#### Pan Mode

Puts the Surface into "pan" mode (the lasso is disabled)

```javascript
panMode:function() {
    _getSurface((s) => s.setMode(SurfaceMode.PAN))
}
```

#### Select Mode

Puts the Surface into "select" mode (the lasso is enabled)

```javascript
selectMode:function() {
    _getSurface((s) => s.setMode(SurfaceMode.SELECT))
}
```

#### Zoom the contents to fit the viewport

This will adjust the zoom and pan so that the content is centered and zoomed to fit.

```javascript
zoomToFit:function() {
    _getSurface((s) => s.zoomToFit())
}
```

#### Undo the last action

We call the `undo()` method of the underlying Toolkit instance:

```javascript
undo:function() {
    _getSurface((s) => s.toolkitInstance.undo())
}
```

#### Redo the last action

We call the `redo()` method of the underlying Toolkit instance:

```javascript
redo:function() {
    _getSurface((s) => s.toolkitInstance.redo())
}
```

#### Clear the canvas

To clear the canvas we call the `clear` method of the underlying Toolkit. Note that we call `clear()` on the Toolkit even if there are no nodes in the dataset, which may seem odd, but we do this because then a few internal events are fired which will restore the canvas to the state the user expects.

```javascript
clear: function() {
    _getSurface((s) => {
        const t = s.toolkitInstance;
        if (t.getNodeCount() === 0 || confirm("Clear canvas?")) {
            t.clear();
        }
    })
}
```



[TOP](#top)





























