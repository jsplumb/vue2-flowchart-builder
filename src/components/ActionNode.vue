<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-action" data-jtk-target="true">
        <svg :width="obj.w" :height="obj.h">
            <rect x="10" y="10" :width="obj.w-20" :height="obj.h-20" class="inner" rx="5" ry="5"/>
        </svg>

        <span>{{obj.text}}</span>

        <div class="node-edit node-action" v-on:click="edit"></div>
        <div class="node-delete node-action delete" v-on:click="maybeDelete"></div>
        <div class="drag-start connect" data-jtk-source="true" data-jtk-port-type="source"></div>

        <!--
            add a second drag point, from which edges will be of type 'exampleAlternate', via the port mapping
            for ports of type 'alternate', in the view declared in Flowchart.vue
        -->
        <div style="position:absolute;right:20px;top:20px;width:15px;height:15px;background-color:darkcyan;cursor:pointer;"
             data-jtk-source="true"
             data-jtk-port-type="alternate"></div>

    </div>
</template>

<script>
    import BaseEditableNode from './BaseEditableNode.vue'
    export default {
        mixins:[BaseEditableNode]
    }
</script>
