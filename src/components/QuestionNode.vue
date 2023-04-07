<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-action" data-jtk-target="true">
        <svg :width="obj.w" :height="obj.h" stroke-linejoin="round">
            <path :d="'M ' + (obj.w/2) + ' 10 L ' + (obj.w-10) + ' ' + (obj.h/2) + ' L ' + (obj.w/2) + ' ' + (obj.h-10) + ' L 10 ' + (obj.h/2) + ' Z'" class="inner"/>
        </svg>
        <span>{{obj.text}}</span>
        <div class="node-edit node-action" v-on:click="edit"></div>
        <div class="node-delete node-action delete" v-on:click="maybeDelete"></div>
        <div class="drag-start connect" data-jtk-source="true" data-jtk-port-type="source"></div>

        <jtk-endpoint v-bind:key="a.portId" v-for="a in obj.anchors" :data-jtk-anchor-x="a.x" :data-jtk-anchor-y="a.y" :data-jtk-orientation-x="a.ox" :data-jtk-orientation-y="a.oy" :data-jtk-port="a.portId" data-jtk-source="true" data-jtk-target="true"></jtk-endpoint>

    </div>



</template>

<script>
    import BaseEditableNode from './BaseEditableNode.vue'
    export default {
        mixins:[BaseEditableNode]
    }
</script>
